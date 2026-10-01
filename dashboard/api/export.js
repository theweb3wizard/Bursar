export default async function handler(req, res) {
  const key = req.headers['x-bursar-viewkey'];
  if (key !== 'demo-view-key') { res.status(403).json({ error: 'auditor view key required (demo key: demo-view-key)' }); return; }
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const base = `${proto}://${req.headers.host}`;
  const r = await fetch(base + '/api/invoices');
  const { open = [], paid = [] } = await r.json();
  const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = ['id,status,merchant,buyer,token,amount_base_units,created_at,paid_at,receipt_tx'];
  for (const i of [...open, ...paid]) rows.push([i.id, i.status, i.merchant, i.buyer || '', i.token, i.amount, i.createdAt || '', i.paidAt || '', i.receipt || ''].map(q).join(','));
  res.setHeader('content-type', 'text/csv');
  res.setHeader('content-disposition', 'attachment; filename="bursar-books.csv"');
  res.status(200).send(rows.join('\n'));
}
