import { createPublicClient, http, keccak256, toHex } from 'viem';

const RPC = process.env.TEMPO_RPC || 'https://rpc.moderato.tempo.xyz';
const REGISTRY = process.env.REGISTRY || '0xe138ED601fb64181cF38987a13bfbC94Fcf51066';
const MERCHANT = (process.env.MERCHANT || '').toLowerCase();

const pub = createPublicClient({ transport: http(RPC) });
const CREATED = keccak256(toHex('InvoiceCreated(bytes32,address,address,address,uint256)'));
const MEMO_SIG = keccak256(toHex('TransferWithMemo(address,address,uint256,bytes32)'));
const invoiceAbi = [
  { name: 'getInvoice', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'id', type: 'bytes32' }],
    outputs: [{ name: '', type: 'tuple',
      components: [
        { name: 'id', type: 'bytes32' }, { name: 'merchant', type: 'address' },
        { name: 'buyer', type: 'address' }, { name: 'token', type: 'string' },
        { name: 'amount', type: 'uint256' }, { name: 'createdAt', type: 'uint256' },
        { name: 'paidAt', type: 'uint256' }, { name: 'paymentTxHash', type: 'bytes32' },
        { name: 'status', type: 'uint8' },
      ] }] },
];

/** Books derived purely from chain state — no server memory needed. */
export default async function handler(req, res) {
  try {
    const latest = await pub.getBlockNumber();
    const fromReg = latest > 50000n ? latest - 50000n : 0n;
    const fromPay = latest > 4000n ? latest - 4000n : 0n; // ~30 min of Tempo blocks; RPC caps results
    const [regLogs, payLogs] = await Promise.all([
      pub.getLogs({ address: REGISTRY, topics: [CREATED], fromBlock: fromReg, toBlock: 'latest' }),
      MERCHANT
        ? pub.getLogs({ address: process.env.TOKEN || '0x20c0000000000000000000000000000000000000', topics: [MEMO_SIG], fromBlock: fromPay, toBlock: 'latest' }).catch((e) => { console.error('payLogs failed', String(e).slice(0, 300)); return []; })
        : Promise.resolve([]),
    ]);
    const logs = regLogs;
    const ids = [];
    for (const log of logs) {
      if ((log.topics[0] || '').toLowerCase() !== CREATED.toLowerCase()) continue;
      const merchant = ('0x' + (log.topics[2] || '').slice(-40)).toLowerCase();
      if (MERCHANT && merchant !== MERCHANT) continue;
      ids.push({ id: log.topics[1], blockNumber: log.blockNumber });
    }
    const states = await Promise.all(ids.slice(0, 25).map(async ({ id, blockNumber }) => {
      const s = await pub.readContract({ address: REGISTRY, abi: invoiceAbi, functionName: 'getInvoice', args: [id] }).catch(() => null);
      if (!s) return null;
      return { s, blockNumber: blockNumber.toString() };
    }));
    const all = states.filter(Boolean).map(({ s, blockNumber }) => ({
      id: s.id,
      merchant: s.merchant,
      buyer: s.buyer,
      token: s.token,
      amount: s.amount.toString(),
      createdAt: null, // Tempo uses chain-clock timestamps, not unix — blocks shown instead
      paidAt: null,
      blockNumber,
      receipt: s.status === 2 ? s.paymentTxHash : null,
      status: s.status === 2 ? 'paid' : s.status === 3 ? 'cancelled' : 'open',
    }));
    const byId = new Map(all.map((i) => [i.id.toLowerCase(), i]));
    // Payments the registry never heard about (serverless anchoring is best-effort):
    // each TransferWithMemo to the merchant IS a paid invoice, fully described onchain.
    for (const log of payLogs) {
      const memo = (log.topics[3] || '').toLowerCase();
      if (!memo || memo === '0x' + '0'.repeat(64)) continue;
      if (MERCHANT && ('0x' + (log.topics[2] || '').slice(-40)).toLowerCase() !== MERCHANT) continue; // only our sales
      if (byId.has(memo)) continue;
      byId.set(memo, {
        id: log.topics[3],
        merchant: MERCHANT,
        buyer: '0x' + (log.topics[1] || '').slice(-40),
        token: log.address,
        amount: BigInt(log.data).toString(),
        createdAt: null,
        paidAt: null,
        blockNumber: log.blockNumber.toString(),
        receipt: log.transactionHash,
        status: 'paid',
      });
    }
    const merged = [...byId.values()];
    res.status(200).json({ open: merged.filter((i) => i.status === 'open'), paid: merged.filter((i) => i.status === 'paid') });
  } catch (e) {
    res.status(500).json({ error: 'chain read failed', detail: String(e).slice(0, 200) });
  }
}
