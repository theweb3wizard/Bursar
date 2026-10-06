import { createPublicClient, http, keccak256, toHex } from 'viem';

const TRANSFER_WITH_MEMO_SIG = keccak256(
  toHex('TransferWithMemo(address,address,uint256,bytes32)')
);

const client = createPublicClient({
  transport: http('https://rpc.moderato.tempo.xyz'),
});

/**
 * Verify that txHash settles invoiceId: finds a TransferWithMemo log on the
 * token contract whose indexed memo equals the invoice id, with value >= price,
 * AND whose indexed recipient is the merchant.
 * Returns the paid amount (bigint) or null.
 *
 * `merchant` is REQUIRED (fail-closed): without a payee binding, anyone could
 * present a same-token / same-memo / same-amount transfer paid to themselves
 * and be treated as paid (GH issue #6, thanks @chenshj73).
 */
export async function verifyPayment({ token, merchant, invoiceId, txHash, minAmount = 0n }) {
  if (!merchant) throw new Error('verifyPayment: merchant (payee) address is required');
  const receipt = await client.getTransactionReceipt({ hash: txHash });
  if (!receipt || receipt.status !== 'success') return null;
  const want = invoiceId.toLowerCase();
  const payee = merchant.toLowerCase();
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== token.toLowerCase()) continue;
    if (log.topics[0]?.toLowerCase() !== TRANSFER_WITH_MEMO_SIG.toLowerCase()) continue;
    const to = '0x' + (log.topics[2] || '').slice(-40).toLowerCase();
    if (to !== payee) continue; // paid someone else — not our sale
    if ((log.topics[3] || '').toLowerCase() !== want) continue;
    const value = BigInt(log.data);
    if (value < BigInt(minAmount)) continue;
    return value;
  }
  return null;
}
