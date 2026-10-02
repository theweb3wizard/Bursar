# Contributing to Bursar

Bursar is the cash register for AI agents on Tempo. Small, sharp PRs beat big ones.

## Ground rules
- Money code is sacred: any change to verification, settlement, or key handling needs
  a live-testnet proof (tx hash) in the PR description. No exceptions.
- Never weaken the threat model (`docs/THREAT_MODEL.md`). If your change touches privacy
  claims, update that doc in the same PR.
- Copy is plain human words. No hype, no jargon. If a judge can't understand it in
  5 seconds, rewrite it.
- Dashboard changes must keep: keyboard access, mobile layout, reduced-motion support.

## Good first issues
Look for the `good first issue` label — each names its proof of done. Ask questions
in the issue before big rewrites.

## Local dev
- Contracts: `cd contracts && forge build` (solc 0.8.26). Deploys target Tempo Moderato
  testnet (chain 42431). Never commit keys — `.gitignore` covers wallets.
- Merchant: `cd sdk && npm install && node server.js` (`MERCHANT` env for real use).
- Buyer: `node buyer.mjs <endpoint>`. Fund test wallets via `tempo_fundAddress` (see README).

## License
MIT. By contributing you agree your work ships under it.
