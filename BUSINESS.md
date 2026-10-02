# Bursar — business in one page *(v2, 2026-10-03 — rewritten after red-team review)*

> Live product: https://bursar-ruby.vercel.app/ · repo: https://github.com/theweb3wizard/Bursar ·
> registry: `0xC3FA070c45F1bDbA8871171F5c950f8C89c0fce1` (Tempo Moderato, verified source).

## Who pays *(pipeline, not projection)*

Target: API/MCP operators selling to agents who feel reconciliation pain today.
Committed motion: 10 pilot outreaches → 3 paid by December (LOIs linked here as they land).
We will not project merchant counts we haven't talked to.

## Pricing *(SaaS-first — the take alone can't carry micropayments)*

| Tier | Price | Includes |
|------|-------|----------|
| Starter | **$49/mo** (≤10K invoices) | dashboard, books, audit export |
| Growth | **$149/mo** | sessions/budgets, dunning, QuickBooks-ready export, priority support |
| Take | **0.5%, capped** | so no merchant ever pays more than Stripe prepaid on equal volume. At $1K/mo flow the cap binds: max ~$40/mo all-in. |

> Year-one math we can defend: 3 paid pilots × $49 × 12 + capped take ≈ **$2–5K ARR
> proven**, path to $1M ARR = 500 merchants × ~$165/mo. No invented 200-merchant tables.

## Guarantees *(why a merchant switches)*

- ✅ **Non-custodial, MIT fallback:** money goes straight to the merchant's wallet, never
  through our contracts. If Bursar is down >60s, middleware fails open to direct wallet
  + local ledger — zero code change, SLA published.
- ✅ **USDC + pathUSD settlement** (no pathUSD-only lock-in); bank payout via existing ramps.
- ✅ **Latency budget:** p95 added latency <25ms or the month is free.
- ✅ **CPA-safe export:** every invoice carries tx hash + memo; if the CSV doesn't import
  cleanly, onboarding is free until it does.

## Why now *(evidence, not reports)*

- Agents already pay per call onchain (live: our own dashboard settles $0.01–0.02
  purchases on Tempo testnet today — links above).
- Cost proof: measured ¢-per-invoice table ships with the pilot (fee screenshot +
  infra bill, not "90%+ margin" claims).
- Incumbent gap, named: Stripe Billing has no agent/metered-crypto path; Request/Loop
  serve humans; MCPay/Corbits are spend-side with no seller books. We own the
  receivables half on the chain built for settlement.

## 3 stages *(no lending — ever, until counsel says otherwise)*

| Stage | Focus |
|-------|-------|
| **1. Dev tool (now)** | 2-line billing middleware + dashboard. Win hackathon, 10 pilots. |
| **2. Merchant suite (Dec)** | sessions/budgets, dunning, first-10-free, QuickBooks export. |
| **3. Billing primitive (Q1)** | subscriptions via smart-account pulls; settlement-history API that third-party underwriters can build on (optionality, not a lending pitch). |

## Cost proof *(measured Oct 3, Moderato tx 0x86368b96…)*

| | |
|---|---|
| Chain fee per $0.01 sale | **18 base units = $0.000018** |
| Vercel Hobby + public RPC | **$0** |
| **True cost per invoice** | **≈$0.00002** — at 10K invoices/mo the chain bill is $0.20 |

> Replaces all margin estimates — this is measured, not modeled.

## Moat *(wedge, not handwave)*

Tempo-native depth (sessions, memos, fee sponsorship, zero-gas buyers) + live
settlement history no fork can backdate. "Don't trust our deck. Query our contract."
