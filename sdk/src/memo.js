import { hexToBytes, bytesToHex } from 'viem';

/** Invoice memo helpers: IDs must fit Tempo transfer memos (bytes32). */
export function newInvoiceId() {
  const b = new Uint8Array(32);
  crypto.getRandomValues(b);
  return bytesToHex(b);
}

export function assertMemoFits(id) {
  const b = hexToBytes(id);
  if (b.length !== 32) throw new Error(`invoice id must be 32 bytes, got ${b.length}`);
  return id;
}

/** Offchain invoice map: invoiceId -> { merchant, buyer, token, amount, unit, status, receipt } */
export class InvoiceMap {
  constructor() { this.map = new Map(); }
  open(inv) { this.map.set(inv.id, { ...inv, status: 'open', createdAt: Date.now() }); return inv.id; }
  get(id) { return this.map.get(id.toLowerCase()); }
  markPaid(id, receipt) {
    const inv = this.get(id);
    if (!inv || inv.status !== 'open') return null;
    inv.status = 'paid'; inv.receipt = receipt; inv.paidAt = Date.now();
    return inv;
  }
  outstanding() { return [...this.map.values()].filter((i) => i.status === 'open'); }
}
