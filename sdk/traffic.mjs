import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
// Honest-volume bot: makes REAL testnet payments at a human pace.
// Every purchase is a genuine onchain settlement — testnet tokens only.
const BURSAR = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const TOKEN = '0x20c0000000000000000000000000000000000000';
const TARGETS = JSON.parse(process.env.TARGETS || JSON.stringify([
  { ep: 'http://localhost:4021/api/price', key: BURSAR + '/.test-wallet' },
]));
const ROUNDS = parseInt(process.env.ROUNDS || '12', 10);
const PAUSE_MS = parseInt(process.env.PAUSE_MS || '45000', 10);

function cast(...args) {
  const forgeBin = (process.env.USERPROFILE || process.env.HOME) + '/.foundry/bin/cast';
  return execSync(`"${forgeBin}" ${args.join(' ')} --json --rpc-url https://rpc.moderato.tempo.xyz`, { encoding: 'utf8' }).trim();
}

let done = 0;
for (let n = 0; n < ROUNDS; n++) {
  const t = TARGETS[n % TARGETS.length];
  try {
    const pk = fs.readFileSync(t.key, 'utf8').trim();
    const c = await (await fetch(t.ep)).json();
    if (!c.memo) { console.log(`round ${n}: no challenge, skipping`); continue; }
    const tx = JSON.parse(cast('send', TOKEN, '"transferWithMemo(address,uint256,bytes32)"', c.payTo, c.price, c.memo, '--private-key', pk)).transactionHash;
    await new Promise((r) => setTimeout(r, 8000));
    const r = await fetch(t.ep, { headers: { 'X-Bursar-Invoice': c.memo, 'X-Bursar-Receipt': tx } });
    if (r.status === 200) { done++; console.log(`round ${n}: PAID ${tx.slice(0, 10)}… via ${t.ep}`); }
    else console.log(`round ${n}: verify failed (${r.status})`);
  } catch (e) { console.log(`round ${n}: error ${String(e).split('\n')[0]}`); }
  if (n < ROUNDS - 1) await new Promise((r) => setTimeout(r, PAUSE_MS));
}
console.log(`TRAFFIC DONE: ${done}/${ROUNDS} settled`);
