#!/usr/bin/env bash
# Bursar 1-command redeploy (testnet reset recovery).
# Usage: MERCHANT_KEY=<key> ./redeploy.sh
# Recompiles, redeploys the registry, re-verifies source, updates Vercel REGISTRY env.
set -euo pipefail
cd "$(dirname "$0")/../contracts"
forge build
OUT=$(forge create src/BursarInvoiceRegistry.sol:BursarInvoiceRegistry \
  --rpc-url https://rpc.moderato.tempo.xyz --private-key "$MERCHANT_KEY" --broadcast --json)
ADDR=$(echo "$OUT" | grep -o '"deployedTo": *"[^"]*"' | cut -d'"' -f4)
echo "Deployed: $ADDR"
forge verify-contract "$ADDR" src/BursarInvoiceRegistry.sol:BursarInvoiceRegistry \
  --chain-id 42431 --verifier sourcify --verifier-url "https://contracts.tempo.xyz" || true
echo "$ADDR" > ../.registry-address
echo "Now: set Vercel env REGISTRY=$ADDR and redeploy (vercel --prod)."
