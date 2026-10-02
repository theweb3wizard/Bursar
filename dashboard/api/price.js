import { createPublicClient, createWalletClient, http, keccak256, toHex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const RPC = process.env.TEMPO_RPC || 'https://rpc.moderato.tempo.xyz';
const REGISTRY = process.env.REGISTRY || '0xC3FA070c45F1bDbA8871171F5c950f8C89c0fce1';
const MERCHANT = (process.env.MERCHANT || '').toLowerCase();
const TOKEN = (process.env.TOKEN || '0x20c0000000000000000000000000000000000000').toLowerCase();
const PRICE = BigInt(process.env.PRICE || '10000');
const KEY = process.env.MERCHANT_KEY; // testnet key only
const TIMEOUT_MS = 25000;

const TRANSFER_WITH_MEMO = keccak256(toHex('TransferWithMemo(address,address,uint256,bytes32)'));

const pub = createPublicClient({ transport: http(RPC) });
const invoiceAbi = [
  { name: 'createInvoiceWithId', type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'id', type: 'bytes32' }, { name: 'buyer', type: 'address' }, { name: 'token', type: 'address' }, { name: 'amount', type: 'uint256' }],
    outputs: [{ name: '', type: 'bytes32' }] },
  { name: 'markPaid', type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'id', type: 'bytes32' }, { name: 'paymentTxHash', type: 'bytes32' }], outputs: [] },
];

const withTimeout = (p, ms = TIMEOUT_MS) =>
  Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);

function logMatchesMemo(log, invoiceId, minAmount) {
  if (log.address.toLowerCase() !== TOKEN) return false; // wrong token (incl. fakes)
  if ((log.topics[0] || '').toLowerCase() !== TRANSFER_WITH_MEMO.toLowerCase()) return false;
  const to = '0x' + (log.topics[2] || '').slice(-40).toLowerCase();
  if (to !== MERCHANT) return false; // not paid to us
  if ((log.topics[3] || '').toLowerCase() !== invoiceId.toLowerCase()) return false; // wrong bill
  if (BigInt(log.data) < minAmount) return false; // underpaid
  return true;
}

async function verifyByReceipt(invoiceId, txHash) {
  const receipt = await withTimeout(pub.getTransactionReceipt({ hash: txHash }));
  if (!receipt || receipt.status !== 'success') return null;
  for (const log of receipt.logs) {
    if (logMatchesMemo(log, invoiceId, PRICE)) {
      return { tx: txHash, payer: '0x' + (log.topics[1] || '').slice(-40) };
    }
  }
  return null;
}

async function verifyByScan(invoiceId) {
  const latest = await withTimeout(pub.getBlockNumber());
  // 1000-block pages (~8 min each on Tempo), up to 3 pages back.
  for (let page = 0; page < 3; page++) {
    const to = latest - BigInt(page * 1000);
    const from = to > 1000n ? to - 1000n : 0n;
    let logs;
    try {
      logs = await withTimeout(pub.getLogs({ address: TOKEN, topics: [TRANSFER_WITH_MEMO], fromBlock: from, toBlock: to }));
    } catch { continue; } // capped/failed page: try an older one
    for (const log of logs) {
      if (logMatchesMemo(log, invoiceId, PRICE)) {
        return { tx: log.transactionHash, payer: '0x' + (log.topics[1] || '').slice(-40) };
      }
    }
    if (from === 0n) break;
  }
  return null;
}

async function anchor(fn, args) {
  if (!KEY) return null;
  const account = privateKeyToAccount(KEY.startsWith('0x') ? KEY : '0x' + KEY);
  const wallet = createWalletClient({ account, transport: http(RPC) });
  const hash = await withTimeout(wallet.writeContract({ address: REGISTRY, abi: invoiceAbi, functionName: fn, args }), 15000);
  return withTimeout(pub.waitForTransactionReceipt({ hash }), 15000).catch(() => null);
}

export default async function handler(req, res) {
  if (!MERCHANT) { res.status(500).json({ error: 'merchant not configured' }); return; }
  const q = req.query || {};
  const invoice = req.headers['x-bursar-invoice'] || q.invoice;
  const receipt = req.headers['x-bursar-receipt'] || q.receipt;

  // Step 1 — challenge: ephemeral id, nothing onchain, nothing to spam.
  if (!invoice || !receipt) {
    const b = new Uint8Array(32); crypto.getRandomValues(b);
    const id = '0x' + [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
    res.status(402).json({
      price: PRICE.toString(), currency: TOKEN, payTo: MERCHANT, memo: id,
      instructions: 'Pay via TIP-20 transferWithMemo(payTo, price, memo), then retry with X-Bursar-Invoice and X-Bursar-Receipt (tx hash) headers — or ?invoice=&receipt=.',
    });
    return;
  }

  // Step 2 — verify, serve, anchor (best-effort). Fail closed to 402, never 500.
  try {
    let found = null;
    try { found = await verifyByReceipt(invoice, String(receipt)); } catch { found = null; }
    if (!found) found = await verifyByScan(invoice).catch(() => null);
    // Strict binding: the presented receipt must BE the settling tx.
    // A paid bill + wrong receipt = 402. Same pair re-presented = idempotent reclaim.
    if (!found || found.tx.toLowerCase() !== String(receipt).toLowerCase()) {
      res.status(402).json({ error: 'payment not verified onchain', invoice });
      return;
    }
    // Replay note: memo==invoice exact match binds a tx to exactly one bill.
    // Re-presenting the same pair re-serves the same data (idempotent reclaim).
    anchor('createInvoiceWithId', [invoice, found.payer, TOKEN, PRICE])
      .then(() => anchor('markPaid', [invoice, found.tx]))
      .catch(() => {});
    res.status(200).json({ symbol: 'BURSAR-INDEX', price: '1234.56', ts: Date.now(), receipt: found.tx, invoice });
  } catch {
    res.status(402).json({ error: 'verification temporarily unavailable — retry', invoice });
  }
}
