import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bursarPaywall } from './src/wrap.js';
import { verifyPayment } from './src/verify.js';

// Second demo merchant: pays per translation instead of market data.
// Proves Bursar handles many sellers, not just the example one.
const HERE = path.dirname(fileURLToPath(import.meta.url));
const MERCHANT = process.env.MERCHANT;
const TOKEN = process.env.TOKEN || '0x20c0000000000000000000000000000000000000';
const PRICE = BigInt(process.env.PRICE || '20000'); // $0.02
const PRODUCT = process.env.PRODUCT || 'translate';
if (!MERCHANT) { console.error('MERCHANT env required'); process.exit(1); }

const paywall = bursarPaywall({
  merchant: MERCHANT,
  token: TOKEN,
  price: PRICE,
  verifyPayment: (invoiceId, txHash) => verifyPayment({ token: TOKEN, invoiceId, txHash, minAmount: PRICE }),
  onPaid: async () => ({ product: PRODUCT, result: 'hola mundo (demo translation)', ts: Date.now() }),
});

function adapt(handler) {
  return (rawReq, rawRes) => {
    const headers = {};
    for (const [k, v] of Object.entries(rawReq.headers)) headers[k.toLowerCase()] = v;
    const req = { headers, method: rawReq.method, url: rawReq.url };
    const res = {
      status(code) { rawRes.statusCode = code; return this; },
      json(obj) { rawRes.setHeader('content-type', 'application/json'); rawRes.end(JSON.stringify(obj)); },
    };
    handler(req, res, () => {
      rawRes.setHeader('content-type', 'application/json');
      rawRes.end(JSON.stringify(req.bursarData));
    });
  };
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/api/translate' && req.method === 'GET') return adapt(paywall)(req, res);
  if (url.pathname === '/api/invoices' && req.method === 'GET') {
    const all = [...paywall.invoices.map.values()];
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ open: all.filter((i) => i.status === 'open'), paid: all.filter((i) => i.status === 'paid') }));
    return;
  }
  if (url.pathname === '/dashboard' || url.pathname === '/') {
    try {
      let html = fs.readFileSync(path.join(HERE, '..', 'dashboard', 'index.html'), 'utf8');
      html = html.replace(/Merchant ledger/, 'Merchant ledger — translate API');
      res.setHeader('content-type', 'text/html; charset=utf-8');
      res.end(html);
    } catch { res.statusCode = 500; res.end('dashboard missing'); }
    return;
  }
  res.statusCode = 404; res.end('not found');
});

const port = process.env.PORT || 4023;
server.listen(port, () => console.log(`second merchant (${PRODUCT}) on :${port}`));
