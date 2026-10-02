import fs from 'node:fs';
import { payInvoice, getReceivables } from '../src/index.js';
// Example: buy $0.01 of market data as an agent. Needs a funded test key.
// Usage: node examples/node-pay.js [endpoint] [keyfile]
const EP = process.argv[2] || 'http://localhost:4021/api/price';
const KEY = fs.readFileSync(process.argv[3] || '../.test-wallet', 'utf8').trim();
const TOKEN = '0x20c0000000000000000000000000000000000000';

const bought = await payInvoice(EP, { key: KEY, token: TOKEN });
console.log('bought:', JSON.stringify(bought.data));
console.log('receipt:', bought.receipt);
const books = await getReceivables(new URL(EP).origin);
console.log(`books: ${books.paid.length} paid, ${books.open.length} open`);
