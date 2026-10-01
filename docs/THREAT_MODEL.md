# Bursar privacy model (threat model v1.0 — read before claiming anything)

## What competitors CAN see (Tempo is a transparent chain — we never claim otherwise)
- That a transfer happened between two addresses, its amount, and its timestamp.
- The invoice memo: a random 32-byte ID with no intrinsic meaning.

## What competitors CANNOT learn (the actual protection)
- **What was bought.** The memo is opaque. Nothing onchain maps a payment to a product,
  an API endpoint, a price tier, or a merchant revenue line.
- **Whose strategy it is.** Buyer wallets are pseudonymous; invoice metadata
  (product, buyer reference, usage pattern) lives only in the merchant's books.
- **Merchant economics.** Per-product revenue, top customers, and volumes are invisible
  without the merchant's own records.

## What auditors and accountants DO get (view-key export)
- The merchant holds the full invoice map and can export complete books
  (`/api/export`, CSV) for tax and audit. Compliance-compatible privacy:
  hidden from rivals, transparent to anyone the merchant authorizes.

## Explicitly OUT of scope (do not promise)
- Shielded/hidden transfers or amounts (would need chain-level privacy — Tempo Zones
  are unfinished and operator-visible; verified Oct 1, 2026).
- Zero-knowledge proofs of anything. Sender anonymity against chain analysis.
- Protection against timing/correlation analysis by a determined adversary.

## One-line version for judges
"Competitors watching the chain see money move. They can't see what anyone bought,
who's winning, or what strategy anyone runs — but your accountant sees everything."
