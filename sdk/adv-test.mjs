import { execSync } from 'node:child_process';
// Adversarial suite vs production merchant. Every case asserts an expected HTTP code.
// Usage: node adv-test.mjs [baseUrl] [keyfile]
const BASE = process.argv[2] || 'https://bursar-ruby.vercel.app';
const KEYFILE = process.argv[3];
const TOKEN = '0x20c0000000000000000000000000000000000000';
const ALPHA = '0x20c0000000000000000000000000000000000001';
const RPC = 'https://rpc.moderato.tempo.xyz';
import fs from 'node:fs';
const pk = fs.readFileSync(KEYFILE, 'utf8').trim();

function cast(...args) {
  const forgeBin = (process.env.USERPROFILE || process.env.HOME) + '/.foundry/bin/cast';
  return execSync(`"${forgeBin}" ${args.join(' ')} --json --rpc-url ${RPC}`, { encoding: 'utf8' }).trim();
}
async function call(path, headers = {}) {
  const r = await fetch(BASE + path, { headers });
  const body = await r.text();
  return { code: r.status, body };
}
async function challenge() {
  const r = await call('/api/price');
  if (r.code !== 402) throw new Error('no challenge: ' + r.code + ' ' + r.body);
  return JSON.parse(r.body);
}
async function pay(to, amount, memo, token = TOKEN) {
  const out = JSON.parse(cast('send', token, '"transferWithMemo(address,uint256,bytes32)"', to, amount, memo, '--private-key', pk));
  await new Promise((r) => setTimeout(r, 9000));
  return out.transactionHash;
}
let pass = 0, fail = 0;
function verdict(name, got, want) {
  const ok = got === want;
  ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}: got ${got}, want ${want}`);
}

// T1: legit purchase works
const c1 = await challenge();
const tx1 = await pay(c1.payTo, c1.price, c1.memo);
let r = await call('/api/price', { 'X-Bursar-Invoice': c1.memo, 'X-Bursar-Receipt': tx1 });
verdict('T1 legit purchase', r.code, 200);

// T2: same pair again = idempotent reclaim
r = await call('/api/price', { 'X-Bursar-Invoice': c1.memo, 'X-Bursar-Receipt': tx1 });
verdict('T2 reclaim same pair', r.code, 200);

// T3: real tx, WRONG invoice
const c3 = await challenge();
r = await call('/api/price', { 'X-Bursar-Invoice': c3.memo, 'X-Bursar-Receipt': tx1 });
verdict('T3 cross-invoice replay', r.code, 402);

// T4: underpay by 1 unit
const c4 = await challenge();
const tx4 = await pay(c4.payTo, String(BigInt(c4.price) - 1n), c4.memo);
r = await call('/api/price', { 'X-Bursar-Invoice': c4.memo, 'X-Bursar-Receipt': tx4 });
verdict('T4 underpayment', r.code, 402);

// T5: wrong token (AlphaUSD), right memo + amount
const c5 = await challenge();
const tx5 = await pay(c5.payTo, c5.price, c5.memo, ALPHA);
r = await call('/api/price', { 'X-Bursar-Invoice': c5.memo, 'X-Bursar-Receipt': tx5 });
verdict('T5 wrong token', r.code, 402);

// T6: garbage receipt, unpaid bill
const c6 = await challenge();
r = await call('/api/price', { 'X-Bursar-Invoice': c6.memo, 'X-Bursar-Receipt': '0x' + '1'.repeat(64) });
verdict('T6 garbage receipt', r.code, 402);

// T8: right memo + right amount, WRONG recipient (paid to self, not merchant) — GH issue #6
const SELF = execSync(`"${forgeBin}" wallet address --private-key ${pk}`, { encoding: 'utf8' }).trim();
const c8 = await challenge();
const tx8 = await pay(SELF, c8.price, c8.memo);
r = await call('/api/price', { 'X-Bursar-Invoice': c8.memo, 'X-Bursar-Receipt': tx8 });
verdict('T8 wrong recipient', r.code, 402);

// T7: 402 flood — 15 rapid challenges, server must stay up
let flood402 = 0;
for (let i = 0; i < 15; i++) {
  const f = await call('/api/price');
  if (f.code === 402) flood402++;
}
verdict('T7 flood survival (15x402)', flood402, 15);

console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
