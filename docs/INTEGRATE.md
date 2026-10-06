# Sell your API to AI agents in 5 minutes *(Bursar + Tempo)*

> No accounts. No API keys to manage. No credit cards. Agents pay you $0.01 at a
> time, in stablecoins, and every payment writes its own receipt.

## What you need

| | |
|---|---|
| API | Any HTTP API (REST or MCP server) |
| Wallet | A Tempo wallet (testnet is free — see step 1) |
| Runtime | Node.js 18+ |

## Step 1 — Get a wallet with test money *(2 min)*

Generate a key, then fund it from Tempo's public faucet (worthless test tokens):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" > .merchant-key
# address for it: npx -y viem-addr-lookup <key>  (or ask us)
curl -X POST https://rpc.moderato.tempo.xyz -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"tempo_fundAddress","params":["YOUR_ADDRESS"],"id":1}'
```

## Step 2 — Wrap your endpoint *(2 min)*

```bash
npm install viem
```

```js
import { bursarPaywall } from './wrap.js'; // copy these two files in
import { verifyPayment } from './verify.js';

app.get('/api/your-thing',
  bursarPaywall({
    merchant: 'YOUR_ADDRESS',
    token: '0x20c0000000000000000000000000000000000000', // test pathUSD
    price: 10000n,                                       // $0.01
    verifyPayment: (invoiceId, txHash) =>
      verifyPayment({ token: '0x20c0...0000', merchant: 'YOUR_ADDRESS', invoiceId, txHash, minAmount: 10000n }),
  }),
  (req, res) => res.json(yourData()));
```

## Step 3 — See your money *(1 min)*

Open the merchant dashboard, click any row for the receipt trail, hit
**Export books** for your accountant. Flip **Competitor view** to see what
rivals can't learn about your business.

---

## How agents pay you

| # | Step |
|---|------|
| 1 | Agent calls your endpoint → gets `402` with a price and a bill number. |
| 2 | Agent sends one stablecoin transfer with the bill number in the memo (~0.5s on Tempo). |
| 3 | Agent retries with the receipt → your API answers, Bursar logs the invoice as paid. |

> No accounts for buyers either. If it can make an HTTP call and hold a key, it can pay you.

---

## Mainnet later

Same code, real pathUSD, chain 4217. Talk to us before handling real money —
we'll walk through the non-custodial checklist with you.
