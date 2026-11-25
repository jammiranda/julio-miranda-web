import { get } from '@vercel/blob';
const TYPES = {
  'index.html': 'text/html; charset=utf-8', 'app.html': 'text/html; charset=utf-8', 'app.js': 'text/javascript; charset=utf-8',
  'terminos.html': 'text/html; charset=utf-8', 'privacidad.html': 'text/html; charset=utf-8',
  'manifest.webmanifest': 'application/manifest+json', 'sw.js': 'text/javascript; charset=utf-8',
  'icon-192.png': 'image/png', 'icon-512.png': 'image/png', 'apple-touch-icon.png': 'image/png', 'og.png': 'image/png',
  'icon.svg': 'image/svg+xml', 'matebot.svg': 'image/svg+xml', 'devisebit.png': 'image/png', 'landing.js': 'text/javascript; charset=utf-8', 'robots.txt': 'text/plain; charset=utf-8', 'sitemap.xml': 'application/xml',
};
export default async function handler(req, res) {
  const f = String(req.query.f || 'index.html');
  if (!TYPES[f]) return res.status(404).end();
  try {
    const r = await get('site/' + f, { access: 'private', useCache: false });
    if (!r || !r.stream) return res.status(404).send('no encontrado');
    const buf = Buffer.from(await new Response(r.stream).arrayBuffer());
    const bin = f.endsWith('.png') || f.endsWith('.svg');
    res.setHeader('Content-Type', TYPES[f]);
    res.setHeader('Cache-Control', bin ? 'public, max-age=86400, s-maxage=86400' : 'public, max-age=0, s-maxage=60, stale-while-revalidate=300');
    return res.status(200).send(buf);
  } catch (e) {
    return res.status(500).send('error');
  }
}
