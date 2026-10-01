import { privateKeyToAccount } from 'viem/accounts';import fs from 'node:fs';const pk=fs.readFileSync(process.argv[2],'utf8').trim();console.log(privateKeyToAccount('0x'+pk).address);
