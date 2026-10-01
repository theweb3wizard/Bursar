import { createPublicClient, http, keccak256, toHex } from 'viem';

const TRANSFER_WITH_MEMO_SIG = keccak256(
  toHex('TransferWithMemo(address,address,uint256,bytes32)')
);

const client = createPublicClient({
  transport: http('https://rpc.moderato.tempo.xyz'),
});

/**
 * Verify that txHash settles invoiceId: finds a TransferWithMemo log on the
 * token contract whose indexed memo equals the invoice id, with value >= price.
 * Returns the paid amount (bigint) or null.
 */
export async function verifyPayment({ token, invoiceId, txHash, minAmount = 0n }) {
  const receipt = await client.getTransactionReceipt({ hash: txHash });
  if (!receipt || receipt.status !== 'success') return null;
  const want = invoiceId.toLowerCase();
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== token.toLowerCase()) continue;
    if (log.topics[0]?.toLowerCase() !== TRANSFER_WITH_MEMO_SIG.toLowerCase()) continue;
    if ((log.topics[3] || '').toLowerCase() !== want) continue;
    const value = BigInt(log.data);
    if (value < BigInt(minAmount)) continue;
    return value;
  }
  return null;
}
