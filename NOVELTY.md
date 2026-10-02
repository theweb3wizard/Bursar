# Why Bursar is not "x402 on Tempo" (read this before asking)

x402 answers: "how does an agent pay for one thing, once." Bursar answers what the
seller does for the next ten years: invoices, books, budgets, audits, dunning.

| | x402 (Coinbase) | Bursar |
|---|---|---|
| One payment | Yes — HTTP 402 + receipt | Yes — same flow, MPP-compatible |
| Who owes what | Nobody tracks it | Invoice registry (onchain) + merchant books |
| Repeat/loyal buyers | Pay full price every time | Sessions, budgets, first-N-free (roadmap) |
| Seller accounting | Raw chain logs | Invoice ↔ memo reconciliation + CSV export |
| Buyer privacy story | Transparent by default | Semantic privacy: opaque memos, view-key audits (`docs/THREAT_MODEL.md`) |
| Home chain | Base-first | Tempo: stablecoin gas, 0.5s finality, native fee sponsorship |

Corbits/MCPay/Latinum proved the pay-side wins hackathons. All of them leave the
seller's books empty. Bursar owns the other half of every transaction — and charges
for it (0.5% take + SaaS), which is why it's a company and not a demo.
