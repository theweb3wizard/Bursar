import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { tempoModerato } from 'viem/chains';
import { withRelay } from 'viem/tempo';
import fs from 'node:fs';
// Zero-gas buyer: pays via Tempo's public testnet fee sponsor. The buyer needs
// ONLY the purchase amount — no gas token, no fee balance. Success with an
// exact-balance wallet proves the fee was $0.
const EP = process.argv[2] || 'http://localhost:4021/api/price';
const KEYFILE = process.argv[3];
const TOKEN = '0x20c0000000000000000000000000000000000000';
const SPONSOR = 'https://sponsor.moderato.tempo.xyz';
const RPC = 'https://rpc.moderato.tempo.xyz';

const moderato = { ...tempoModerato, rpcUrls: { default: { http: [RPC] } } };
const tip20Abi = [
  { name: 'transferWithMemo', type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'to', type: 'address' }, { name: 'value', type: 'uint256' }, { name: 'memo', type: 'bytes32' }],
    outputs: [{ name: '', type: 'bool' }] },
];

const pk = '0x' + fs.readFileSync(KEYFILE, 'utf8').trim();
const account = privateKeyToAccount(pk);
const sponsored = withRelay(http(RPC), http(SPONSOR));
const wallet = createWalletClient({ account, chain: moderato, transport: sponsored });
const pub = createPublicClient({ chain: moderato, transport: http(RPC) });

// 1. Challenge.
let r = await fetch(EP);
if (r.status !== 402) throw new Error('expected 402, got ' + r.status);
const c = await r.json();
console.log('402 memo:', c.memo, 'price:', c.price);

// 2. Sponsored payment (buyer may hold exactly `price` and nothing else).
const hash = await wallet.writeContract({
  address: TOKEN, abi: tip20Abi, functionName: 'transferWithMemo',
  args: [c.payTo, BigInt(c.price), c.memo],
});
console.log('sponsored tx:', hash);
await pub.waitForTransactionReceipt({ hash });

// 3. Retry with receipt.
r = await fetch(EP, { headers: { 'X-Bursar-Invoice': c.memo, 'X-Bursar-Receipt': hash } });
console.log('retry status:', r.status);
console.log('data:', JSON.stringify(await r.json()));
