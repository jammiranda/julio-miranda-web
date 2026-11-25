// Cotizaciones del dólar (fuente: dolarapi.com). Cacheado 10 minutos en el borde.
export default async function handler(req, res) {
  try {
    const r = await fetch('https://dolarapi.com/v1/dolares', { headers: { Accept: 'application/json' } });
    const j = await r.json();
    const out = {};
    for (const d of j) out[d.casa] = { compra: d.compra, venta: d.venta, ts: d.fechaActualizacion };
    res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1800');
    return res.status(200).json(out);
  } catch (e) {
    return res.status(502).json({ error: 'fx' });
  }
}
