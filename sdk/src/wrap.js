import { newInvoiceId, InvoiceMap } from './memo.js';

/**
 * Bursar merchant middleware (Express-compatible).
 * Wraps any endpoint with 402 machine payments settled on Tempo.
 *
 * Flow: agent calls endpoint -> 402 + invoice id -> agent pays merchant
 * via TIP-20 transferWithMemo(invoiceId) -> agent retries with tx hash ->
 * middleware verifies the memo log -> serves data + marks invoice paid.
 *
 * @param {object} opts
 * @param {string} opts.merchant - merchant wallet address
 * @param {string} opts.token - TIP-20 token address (e.g. test pathUSD)
 * @param {bigint|number|string} opts.price - price per call (base units)
 * @param {Function} opts.verifyPayment - async (invoiceId, txHash) => bool;
 *   MUST check the cited tx carries this invoice id in its TransferWithMemo log.
 * @param {Function} opts.onPaid - async (invoice) => receipt data for the buyer
 */
export function bursarPaywall({ merchant, token, price, verifyPayment, onPaid }) {
  const invoices = new InvoiceMap();

  async function middleware(req, res, next) {
    const receipt = req.headers['x-bursar-receipt'];
    const invoiceId = req.headers['x-bursar-invoice'];
    if (!receipt || !invoiceId) {
      const id = newInvoiceId();
      invoices.open({ id, merchant, buyer: null, token, amount: String(price), unit: 'call' });
      res.status(402).json({
        price: String(price),
        currency: token,
        payTo: merchant,
        memo: id,
        instructions: 'Pay via TIP-20 transferWithMemo(payTo, price, memo), then retry with X-Bursar-Invoice and X-Bursar-Receipt (tx hash) headers.',
      });
      return;
    }
    const inv = invoices.get(invoiceId);
    if (!inv) { res.status(402).json({ error: 'unknown invoice — request a fresh 402' }); return; }
    let ok = false;
    try { ok = await verifyPayment(invoiceId, receipt); } catch { ok = false; }
    if (!ok) { res.status(402).json({ error: 'payment not verified onchain', invoice: invoiceId }); return; }
    invoices.markPaid(invoiceId, receipt);
    req.bursarInvoice = invoices.get(invoiceId);
    if (onPaid) { try { req.bursarData = await onPaid(req.bursarInvoice); } catch { /* serve anyway */ } }
    next();
  }

  middleware.invoices = invoices;
  return middleware;
}
