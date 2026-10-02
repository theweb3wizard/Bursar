# Bursar skill — bill an AI agent's API in minutes

You are integrating Bursar: invoicing + receivables for AI-agent commerce on Tempo.

| | |
|---|---|
| Network | Tempo Moderato testnet (chain 42431, RPC https://rpc.moderato.tempo.xyz) |
| Test stablecoin | pathUSD `0x20c0000000000000000000000000000000000000` (6 decimals) |
| Faucet | `tempo_fundAddress` RPC method — fund any address free (see INTEGRATE.md) |
| Registry | `0xC3FA070c45F1bDbA8871171F5c950f8C89c0fce1` (verified source on contracts.tempo.xyz) |

## Buyer (any agent, no Bursar code needed)

1. `GET <merchant>/api/<product>` → expect `402` with `{price, currency, payTo, memo}`.
2. Send TIP-20 `transferWithMemo(payTo, price, memo)` on Tempo.
3. Retry with headers `X-Bursar-Invoice: <memo>` + `X-Bursar-Receipt: <txHash>` → `200` + data.
4. Lost the data? Re-present the same pair — reclaim is idempotent, never double-charged.

## Seller (wrap your endpoint)

```js
import { bursarPaywall } from './wrap.js'; // bursar/sdk/src/wrap.js
app.get('/api/data', bursarPaywall({ merchant: YOU, token: pathUSD, price: 10000n }), handler);
```

> Verification rule (never skip): the receipt tx MUST contain a `TransferWithMemo` log
> where token contract, `to` === merchant, memo === invoice id, and amount >= price.
> See `sdk/src/verify.js`. Never trust a bare tx hash.

## Privacy model (do not overclaim)

Tempo is transparent: from/to/amount are public. Bursar hides MEANING — memos are
opaque IDs, product/strategy data stays offchain. Auditors get full CSV export.
Full model: `docs/THREAT_MODEL.md`. Never promise shielded transfers or ZK proofs.
