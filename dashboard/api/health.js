export default async function handler(req, res) {
  res.status(200).json({
    ok: true,
    merchant: process.env.MERCHANT || null,
    price: process.env.PRICE || null,
    registry: process.env.REGISTRY || '0xe138ED601fb64181cF38987a13bfbC94Fcf51066',
    chain: 'Tempo Moderato 42431',
  });
}
