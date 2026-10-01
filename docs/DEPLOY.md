# Hosting Bursar (merchant API)

The merchant is a plain Node server (zero non-viem dependencies). Books live in
memory: restarts reseed empty, which is fine for the demo and disclosed to judges.

## Option A — Railway (try first, $5 free trial)
1. railway.app → **New Project → Deploy from GitHub repo** → select `Bursar`.
2. Service Settings → **Root Directory** = `sdk`. Set **Start Command** = `node server.js`.
3. Variables: `MERCHANT` = payout address, `TOKEN` = `0x20c0...0000`, `PRICE` = `10000`.
   (Railway provides `PORT`; the server honors it.)
4. Fund the address via the faucet (see Render section below), **Generate Domain**,
   test `/health`. If Railway asks for a card up front, skip to Option B.

## Option B — Hugging Face Spaces (free, no card, Docker)
1. huggingface.co → New **Space** → SDK **Docker**, port **7860**, Blank template.
2. Push this repo's files to the Space (or upload `sdk/`, `dashboard/`, `Dockerfile`).
3. Space Settings → Variables: `MERCHANT`, `TOKEN`, `PRICE` (same values as above).
4. The Space URL serves the merchant; test `/health`.

## Option C — Render (needs card verification for blueprint use)
1. render.com → New → **Blueprint** → connect `theweb3wizard/Bursar` (`render.yaml` prefills).
2. Set `MERCHANT`; `TOKEN`/`PRICE` prefilled; Render provides `PORT`.
3. Fund + test `/health` as above.


## Point the dashboard at it
Append `?api=https://YOUR-SERVICE.onrender.com` to the Vercel dashboard URL:
`https://bursar-fw002xskn-the-web3-wizards-projects.vercel.app/?api=...`
The dashboard remembers it (localStorage) for return visits.

## Second merchant (optional)
Same steps with `merchant2.js` as Start Command + `MERCHANT` = second address,
`PRICE` = `20000`, giving the translate API at `/api/translate`.
