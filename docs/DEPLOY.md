# Hosting Bursar (merchant API) — Render or Railway, ~10 minutes

The merchant is a plain Node server (zero non-viem dependencies). Books live in
memory: restarts reseed empty, which is fine for the demo and disclosed to judges.

## Render (recommended)
1. Sign up at render.com → **New → Web Service** → connect the `Bursar` GitHub repo.
2. Settings: **Root Directory** = `sdk`, **Build Command** = `npm install --no-audit --no-fund`,
   **Start Command** = `node server.js`. (Or use `render.yaml` blueprint: New → Blueprint → same repo.)
3. Environment variables:
   - `MERCHANT` = your payout address (generate one: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`, derive address, keep the key private)
   - `TOKEN` = `0x20c0000000000000000000000000000000000000` (test pathUSD, Moderato)
   - `PRICE` = `10000` ($0.01)
   - Render sets `PORT` itself — the server already honors it.
4. Fund the merchant address from Tempo's faucet (worthless test tokens):
   ```bash
   curl -X POST https://rpc.moderato.tempo.xyz -H 'Content-Type: application/json' \
     -d '{"jsonrpc":"2.0","method":"tempo_fundAddress","params":["YOUR_ADDRESS"],"id":1}'
   ```
5. Open `https://YOUR-SERVICE.onrender.com/health` → `{"ok":true,...}` means live.
   Cold starts take ~30s on free tier — the dashboard tolerates it (refresh button).

## Railway
1. railway.app → **New Project → Deploy from GitHub repo** → select `Bursar`.
2. Service Settings → **Root Directory** = `sdk`. Railway auto-detects Node
   (`npm install` + `node server.js` — set Start Command explicitly if needed).
3. Same env vars as above (`MERCHANT`, `TOKEN`, `PRICE`; Railway provides `PORT`).
4. Same faucet step. **Generate Domain** in Settings → test `/health`.

## Point the dashboard at it
Append `?api=https://YOUR-SERVICE.onrender.com` to the Vercel dashboard URL:
`https://bursar-fw002xskn-the-web3-wizards-projects.vercel.app/?api=...`
The dashboard remembers it (localStorage) for return visits.

## Second merchant (optional)
Same steps with `merchant2.js` as Start Command + `MERCHANT` = second address,
`PRICE` = `20000`, giving the translate API at `/api/translate`.
