import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

  try {

    const productId = typeof req.query.productId === 'string' ? req.query.productId : undefined;
    if (!productId) return res.status(400).send('Missing "productId"');

    const lambdaUrl =
      'https://p6yxe9qil9.execute-api.us-east-1.amazonaws.com/staging/images' +
      `?productId=${encodeURIComponent(productId)}`;

    const lambdaRes = await fetch(lambdaUrl, { method: 'GET' });

    if (!lambdaRes.ok) {
      return res.status(lambdaRes.status).send(await lambdaRes.text());
    }

    const contentType = lambdaRes.headers.get('content-type') ?? 'application/octet-stream';
    const base64Body = await lambdaRes.text();
    const buf = Buffer.from(base64Body, 'base64');

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=300');

    return res.status(200).send(buf);
  
  } catch (err: unknown) {
    
    const message =
      err instanceof Error ? err.message : typeof err === 'string' ? err : JSON.stringify(err);
    return res.status(500).send(`Proxy error: ${message}`);

  }
}
