export default async function handler(req, res) {
  res.status(200).json({
    ok: true,
    merchant: process.env.MERCHANT || null,
    price: process.env.PRICE || null,
    registry: process.env.REGISTRY || '0xC3FA070c45F1bDbA8871171F5c950f8C89c0fce1',
    chain: 'Tempo Moderato 42431',
  });
}
