import { createPublicClient, createWalletClient, http, keccak256, toHex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const RPC = process.env.TEMPO_RPC || 'https://rpc.moderato.tempo.xyz';
const REGISTRY = process.env.REGISTRY || '0xe138ED601fb64181cF38987a13bfbC94Fcf51066';
const MERCHANT = process.env.MERCHANT;
const TOKEN = process.env.TOKEN || '0x20c0000000000000000000000000000000000000';
const PRICE = BigInt(process.env.PRICE || '10000');
const KEY = process.env.MERCHANT_KEY; // testnet key only

const TRANSFER_WITH_MEMO = keccak256(toHex('TransferWithMemo(address,address,uint256,bytes32)'));

const pub = createPublicClient({ transport: http(RPC) });
const invoiceAbi = [
  { name: 'createInvoiceWithId', type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'id', type: 'bytes32' }, { name: 'buyer', type: 'address' }, { name: 'token', type: 'address' }, { name: 'amount', type: 'uint256' }],
    outputs: [{ name: '', type: 'bytes32' }] },
  { name: 'markPaid', type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'id', type: 'bytes32' }, { name: 'paymentTxHash', type: 'bytes32' }], outputs: [] },
];

async function anchor(fn, args) {
  if (!KEY) return null; // local demo mode: skip onchain anchoring
  const account = privateKeyToAccount(KEY.startsWith('0x') ? KEY : '0x' + KEY);
  const wallet = createWalletClient({ account, transport: http(RPC) });
  const hash = await wallet.writeContract({ address: REGISTRY, abi: invoiceAbi, functionName: fn, args });
  return pub.waitForTransactionReceipt({ hash });
}

async function findPaymentWithPayer(invoiceId, minAmount) {
  // Narrow window + topic filter: Tempo RPC caps getLogs results.
  const latest = await pub.getBlockNumber();
  const from = latest > 2000n ? latest - 2000n : 0n;
  const logs = await pub.getLogs({
    address: TOKEN,
    topics: [TRANSFER_WITH_MEMO],
    fromBlock: from, toBlock: 'latest',
  });
  const want = invoiceId.toLowerCase();
  for (const log of logs) {
    if ((log.topics[0] || '').toLowerCase() !== TRANSFER_WITH_MEMO.toLowerCase()) continue;
    if ((log.topics[3] || '').toLowerCase() !== want) continue;
    if (BigInt(log.data) < minAmount) continue;
    return { tx: log.transactionHash, payer: '0x' + (log.topics[1] || '').slice(-40) };
  }
  return null;
}

export default async function handler(req, res) {
  if (!MERCHANT) { res.status(500).json({ error: 'merchant not configured' }); return; }
  const invoice = req.headers['x-bursar-invoice'];
  const receipt = req.headers['x-bursar-receipt'];

  // Step 1 — challenge: ephemeral id, nothing onchain yet.
  if (!invoice || !receipt) {
    const b = new Uint8Array(32); crypto.getRandomValues(b);
    const id = '0x' + [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
    res.status(402).json({
      price: PRICE.toString(), currency: TOKEN, payTo: MERCHANT, memo: id,
      instructions: 'Pay via TIP-20 transferWithMemo(payTo, price, memo), then retry with X-Bursar-Invoice and X-Bursar-Receipt (tx hash) headers.',
    });
    return;
  }

  // Step 2 — verify payment logs, then anchor invoice + paid state onchain.
  // Fail closed: any verification error is a 402, never a 500.
  try {
    const found = await findPaymentWithPayer(invoice, PRICE);
    if (!found || found.tx.toLowerCase() !== String(receipt).toLowerCase()) {
      res.status(402).json({ error: 'payment not verified onchain', invoice });
      return;
    }
    try {
      await anchor('createInvoiceWithId', [invoice, found.payer, TOKEN, PRICE]);
      await anchor('markPaid', [invoice, found.tx]);
    } catch { /* bookkeeping best-effort; receipt already verified */ }
    res.status(200).json({ symbol: 'BURSAR-INDEX', price: '1234.56', ts: Date.now(), receipt: found.tx, invoice });
  } catch {
    res.status(402).json({ error: 'verification temporarily unavailable — retry', invoice });
  }
}
