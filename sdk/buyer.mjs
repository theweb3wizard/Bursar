import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
// Demo buyer: behaves like any AI agent would — plain HTTP + a wallet.
// Usage: node buyer.mjs [endpoint]
const EP = process.argv[2] || 'http://localhost:4021/api/price';
const TOKEN = '0x20c0000000000000000000000000000000000000';
const BURSAR = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function cast(...args) {
  const forgeBin = (process.env.USERPROFILE || process.env.HOME) + '/.foundry/bin/cast';
  return execSync(`"${forgeBin}" ${args.join(' ')} --json --rpc-url https://rpc.moderato.tempo.xyz`, { encoding: 'utf8' }).trim();
}

const keyFile = BURSAR + '/.test-wallet';
const pk = (await import('node:fs')).readFileSync(keyFile, 'utf8').trim();

// 1. Ask for data -> expect 402 with invoice.
let r = await fetch(EP);
if (r.status !== 402) throw new Error('expected 402, got ' + r.status);
const challenge = await r.json();
console.log('402 challenge:', JSON.stringify(challenge));

// 2. Pay with memo = invoice id.
const payOut = JSON.parse(cast('send', TOKEN, '"transferWithMemo(address,uint256,bytes32)"', challenge.payTo, challenge.price, challenge.memo, '--private-key', pk));
const txHash = payOut.transactionHash;
console.log('paid in', txHash);

// 3. Wait for indexing, retry with receipt.
await new Promise((r2) => setTimeout(r2, 8000));
r = await fetch(EP, { headers: { 'X-Bursar-Invoice': challenge.memo, 'X-Bursar-Receipt': txHash } });
console.log('retry status:', r.status);
console.log('data:', JSON.stringify(await r.json()));
