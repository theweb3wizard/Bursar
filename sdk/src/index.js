import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { tempoModerato } from 'viem/chains';
import { bursarPaywall } from './wrap.js';
import { verifyPayment } from './verify.js';

const TIP20_ABI = [
  { name: 'transferWithMemo', type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'to', type: 'address' }, { name: 'value', type: 'uint256' }, { name: 'memo', type: 'bytes32' }],
    outputs: [{ name: '', type: 'bool' }] },
];

/** Seller: bill any endpoint. See wrap.js for full options. */
export function billEndpoint(opts) {
  return bursarPaywall(opts);
}

/**
 * Buyer: pay for one API call. No Bursar account, key, or signup.
 * @returns the endpoint's data + onchain receipt.
 */
export async function payInvoice(endpoint, { key, token, rpc = 'https://rpc.moderato.tempo.xyz' }) {
  const account = privateKeyToAccount(key.startsWith('0x') ? key : '0x' + key);
  const client = createWalletClient({ account, chain: tempoModerato, transport: http(rpc) });
  const pub = createPublicClient({ chain: tempoModerato, transport: http(rpc) });
  const challenge = await (await fetch(endpoint)).json();
  if (!challenge.memo) throw new Error('no 402 challenge: ' + JSON.stringify(challenge).slice(0, 160));
  const hash = await client.writeContract({
    address: challenge.currency, abi: TIP20_ABI, functionName: 'transferWithMemo',
    args: [challenge.payTo, BigInt(challenge.price), challenge.memo],
  });
  await pub.waitForTransactionReceipt({ hash });
  await new Promise((r) => setTimeout(r, 6000));
  const r = await fetch(endpoint, { headers: { 'X-Bursar-Invoice': challenge.memo, 'X-Bursar-Receipt': hash } });
  if (r.status !== 200) throw new Error('settlement not accepted: ' + (await r.text()).slice(0, 200));
  return { data: await r.json(), receipt: hash, invoice: challenge.memo };
}

/** Books: open + paid invoices for any Bursar merchant base URL. */
export async function getReceivables(baseUrl) {
  const r = await fetch(baseUrl.replace(/\/$/, '') + '/api/invoices');
  if (!r.ok) throw new Error('books unreachable: ' + r.status);
  return r.json();
}

export { verifyPayment };
export { newInvoiceId, InvoiceMap } from './memo.js';
