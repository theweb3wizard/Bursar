import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bursarPaywall } from './src/wrap.js';
import { verifyPayment } from './src/verify.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));

const MERCHANT = process.env.MERCHANT || '0xC7dC24FCa0b55721b8A2b6543702Be289aA2F261';
const TOKEN = process.env.TOKEN || '0x20c0000000000000000000000000000000000000'; // test pathUSD
const PRICE = 10000n; // $0.01 (6 decimals)

const paywall = bursarPaywall({
  merchant: MERCHANT,
  token: TOKEN,
  price: PRICE,
  verifyPayment: (invoiceId, txHash) => verifyPayment({ token: TOKEN, invoiceId, txHash, minAmount: PRICE }),
  onPaid: async () => ({ symbol: 'BURSAR-INDEX', price: '1234.56', ts: Date.now() }),
});

// Minimal (req,res,next) adapter so the paywall runs on zero-dependency node:http.
function adapt(handler) {
  return (rawReq, rawRes) => {
    const headers = {};
    for (const [k, v] of Object.entries(rawReq.headers)) headers[k.toLowerCase()] = v;
    const req = { headers, method: rawReq.method, url: rawReq.url };
    const res = {
      status(code) { rawRes.statusCode = code; return this; },
      json(obj) {
        rawRes.setHeader('content-type', 'application/json');
        rawRes.end(JSON.stringify(obj));
      },
    };
    handler(req, res, () => {
      rawRes.setHeader('content-type', 'application/json');
      rawRes.end(JSON.stringify(rawReq.bursarData ?? req.bursarData));
    });
  };
}

const priceHandler = adapt(paywall);

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/api/price' && req.method === 'GET') return priceHandler(req, res);
  if (url.pathname === '/api/invoices' && req.method === 'GET') {
    const all = [...paywall.invoices.map.values()];
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ open: all.filter((i) => i.status === 'open'), paid: all.filter((i) => i.status === 'paid') }));
    return;
  }
  if (url.pathname === '/api/export' && req.method === 'GET') {
    // View-key audit export: full books for accountants. Demo uses a shared
    // key header; production issues signed per-auditor view keys.
    if (req.headers['x-bursar-viewkey'] !== 'demo-view-key') {
      res.statusCode = 403;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ error: 'auditor view key required (demo key: demo-view-key)' }));
      return;
    }
    const all = [...paywall.invoices.map.values()];
    const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = ['id,status,merchant,buyer,token,amount_base_units,created_at,paid_at,receipt_tx'];
    for (const i of all) rows.push([i.id, i.status, i.merchant, i.buyer || '', i.token, i.amount, i.createdAt || '', i.paidAt || '', i.receipt || ''].map(q).join(','));
    res.setHeader('content-type', 'text/csv');
    res.setHeader('content-disposition', 'attachment; filename="bursar-books.csv"');
    res.end(rows.join('\n'));
    return;
  }
  if (url.pathname === '/health') {
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, merchant: MERCHANT, price: PRICE.toString() }));
    return;
  }
  if (url.pathname === '/dashboard' || url.pathname === '/') {
    try {
      const html = fs.readFileSync(path.join(HERE, '..', 'dashboard', 'index.html'), 'utf8');
      res.setHeader('content-type', 'text/html; charset=utf-8');
      res.end(html);
    } catch { res.statusCode = 500; res.end('dashboard missing'); }
    return;
  }
  res.statusCode = 404; res.end('not found');
});

const port = process.env.PORT || 4021;
server.listen(port, () => console.log(`bursar example merchant on :${port}`));
