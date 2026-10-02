# Hosting Bursar (merchant API)

> **Current path: Vercel serverless** (live). The merchant runs as stateless functions
> beside the dashboard in one Vercel project; books derive 100% from chain logs.
> No server to keep awake, no database, no card. The options below are legacy notes.

## How the live deployment works

| Piece | Where |
|-------|-------|
| Dashboard + API | Vercel project `bursar` (static + `/api/*` functions) |
| State | None server-side — books read from Tempo chain logs per request |
| Secrets | Vercel env: `MERCHANT`, `TOKEN`, `PRICE`, `REGISTRY`, `TEMPO_RPC`, `VIEW_KEY` (+ `MERCHANT_KEY` testnet key for best-effort anchoring) |
| Deploy | `npx vercel deploy --prod` from `dashboard/` |

## Legacy options (superseded — kept for reference)

<details>
<summary>Option A — Railway ($5 trial, may card-wall)</summary>

1. railway.app → **New Project → Deploy from GitHub repo** → select `Bursar`.
2. Service Settings → **Root Directory** = `sdk`. Set **Start Command** = `node server.js`.
3. Variables: `MERCHANT` = payout address, `TOKEN` = `0x20c0...0000`, `PRICE` = `10000`.
   (Railway provides `PORT`; the server honors it.)
4. Fund the address via the faucet, **Generate Domain**, test `/health`.

</details>

<details>
<summary>Option B — Hugging Face Spaces (Docker now requires PRO — dead end)</summary>

Free Docker Spaces were removed; skip unless this changes.

</details>

<details>
<summary>Option C — Render (card verification wall — dead end)</summary>

`render.yaml` remains in repo. Revive only with a card-backed account.

</details>

## Point the dashboard at a custom merchant

Append `?api=https://YOUR-MERCHANT` to the dashboard URL:
`https://bursar-ruby.vercel.app/?api=...`
The dashboard remembers it (localStorage) for return visits.

## Second merchant (optional)

Same steps with `merchant2.js` as Start Command + `MERCHANT` = second address,
`PRICE` = `20000`, giving the translate API at `/api/translate`.
