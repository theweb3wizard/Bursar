# MAINNET readiness — how Bursar goes from demo to real business

## Where we are today (testnet demo)

- Contracts on Tempo Moderato TESTNET (chain 42431). Test tokens are free from the
  faucet and worthless. Anyone trying the demo must: get a test wallet, fund it from
  the faucet, point at testnet RPC. INTEGRATE.md walks through it in 5 minutes.
- This is correct for the hackathon: judges expect testnet, and no real money can
  be lost by anyone, including us.

## What "real world ready" additionally requires (mainnet, chain 4217)

| # | Step | Notes |
|---|------|-------|
| 1 | **Deploy registry to Tempo mainnet** | Same `forge create` commands, `--rpc-url https://rpc.tempo.xyz --chain-id 4217`, funded with a real mainnet wallet. Verify source on the mainnet explorer. (~30 min, needs a mainnet wallet + ~$1 of pathUSD) |
| 2 | **Real stablecoins** | pathUSD is live on mainnet (Bridge-issued); merchants receive real dollars. No code changes: TOKEN is an env var. |
| 3 | **Key management** | Test keys in Vercel env get replaced: dedicated merchant signer, minimal funds, rotation plan, no human reuse. Documented before handling $1 of volume. |
| 4 | **Security pass** | Fresh adversarial run on mainnet + at least one external eye on the registry (bounty/peer review note in README). Non-custodial design keeps this small: the contracts never hold funds. |
| 5 | **Operational bits** | Status page, support contact, terms of service, fee disclosure, refund policy (dunning worker covers the flow; policy covers the promise). |
| 6 | **Our SaaS billing** | $49/mo tiers + capped take need a real subscription rail (Stripe fiat for the SaaS side; the irony is intended and fine). |

## Who can use it TODAY, as-is

- ✅ Hackathon judges and pilot developers: testnet, free, 5-minute INTEGRATE.md path.
- ❌ Nobody should put real dollars through the testnet deployment — it literally cannot
  (test tokens aren't worth anything and don't leave Moderato).

## Decision for the founder (post-submission, not before)

> Mainnet deploy is deliberately AFTER Oct 12: judging happens on testnet, and mainnet
> brings real-money responsibility (support, uptime, key custody). The checklist above
> is the complete path — estimated half a day plus the security review.
