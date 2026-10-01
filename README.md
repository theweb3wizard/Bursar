# BURSAR — the cash register for AI agents

AI agents already pay for APIs in stablecoins. Nobody sends the sellers a proper
receipt. Bursar is **invoicing, budgets, and receivables for the machine economy**,
settled on [Tempo](https://tempo.xyz) (chain 4217) via the Machine Payments Protocol.

Built for the Colosseum Crypto World's Fair hackathon — Tempo track.

## How a sale happens
1. Agent calls your API → gets `402` with a price and a bill number.
2. Agent sends one stablecoin transfer with the bill number in the memo (~0.5s on Tempo).
3. Bursar checks the payment against the chain, flips the bill to paid, logs the invoice.

No accounts. No API keys. If it can make an HTTP call and hold a key, it can pay you.

## Privacy, honestly
Tempo is a transparent chain and we never claim otherwise. What competitors can't
learn: **what was bought, which product earns what, or whose strategy is whose**
— memos are opaque IDs, meaning lives offchain. What auditors get: full books via
view-key CSV export. See [`docs/THREAT_MODEL.md`](docs/THREAT_MODEL.md).

## Repo layout
- `contracts/` — `BursarInvoiceRegistry.sol` (Foundry). Non-custodial invoice registry;
  settlement is direct wallet-to-wallet, this contract never holds funds.
  Deployed on Tempo Moderato testnet: `0xe138ED601fb64181cF38987a13bfbC94Fcf51066`
- `sdk/` — merchant middleware (`src/wrap.js`), onchain receipt verifier (`src/verify.js`),
  example merchants (`server.js`, `merchant2.js`), demo buyer (`buyer.mjs`), volume bot (`traffic.mjs`)
- `dashboard/` — single-file merchant ledger (KPIs, receipt modal, competitor view, audit export)
- `docs/` — `INTEGRATE.md` (5-min merchant guide), `THREAT_MODEL.md`

## Run it (testnet)
```bash
# 1. Merchant ( Terminal 1 )
cd sdk && npm install && node server.js        # :4021, market-data API at $0.01
node merchant2.js                              # :4023 needs MERCHANT env, translate API at $0.02

# 2. Fund a test wallet from Tempo's public faucet (worthless test tokens)
curl -X POST https://rpc.moderato.tempo.xyz -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"tempo_fundAddress","params":["YOUR_ADDRESS"],"id":1}'

# 3. Buy something as an agent ( Terminal 2 )
node buyer.mjs http://localhost:4021/api/price

# 4. Open the books
http://localhost:4021/dashboard
```

Contracts: `cd contracts && forge build` (solc 0.8.26). Deploy: `forge create` with `--broadcast`.

## Links
- Live dashboard: https://bursar-fw002xskn-the-web3-wizards-projects.vercel.app/ (append `?api=<merchant-url>` to point at a live merchant)
- Colosseum submission: *(added at submission)*
- Demo video: *(added Day 9)*
- Registry contract (Moderato): `0xe138ED601fb64181cF38987a13bfbC94Fcf51066`

## License
MIT — see [LICENSE](LICENSE).
