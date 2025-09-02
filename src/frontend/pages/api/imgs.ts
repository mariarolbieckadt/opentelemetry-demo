import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const key = typeof req.query.key === 'string' ? req.query.key : undefined;
    if (!key) return res.status(400).send('Missing "key"');

    const gwUrl =
      'https://p6yxe9qil9.execute-api.us-east-1.amazonaws.com/staging/images' +
      `?key=${encodeURIComponent(key)}`;

    // Server-side fetch: With OneAgent on your frontend service,
    // Dynatrace will auto-propagate W3C trace context on this outgoing call.
    const gwRes = await fetch(gwUrl, { method: 'GET' });

    if (!gwRes.ok) {
      return res.status(gwRes.status).send(await gwRes.text());
    }

    const contentType = gwRes.headers.get('content-type') ?? 'application/octet-stream';
    const buf = Buffer.from(await gwRes.arrayBuffer());
    res.setHeader('Content-Type', contentType);
    // Optional caching
    res.setHeader('Cache-Control', 'public, max-age=300');
    return res.status(200).send(buf);
  } catch (err: any) {
    return res.status(500).send(`Proxy error: ${err?.message ?? err}`);
  }
}
