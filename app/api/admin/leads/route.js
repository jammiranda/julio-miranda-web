import { cfg } from '@/lib/config';
import { sql } from '@/lib/db';

// CRM: exporta SOLO a quienes aceptaron recibir novedades. /api/admin/leads?key=ADMIN_KEY[&format=json]
export async function GET(req) {
  const p = new URL(req.url).searchParams;
  if (!cfg.adminKey || p.get('key') !== cfg.adminKey) return new Response('forbidden', { status: 401 });
  const rows = await sql`SELECT first_name, username, email, phone, optin_at, created_at
    FROM users WHERE marketing_optin = true ORDER BY created_at DESC`;
  const total = await sql`SELECT count(*)::int AS n FROM users`;
  if (p.get('format') === 'json') return Response.json({ usuarios_totales: total[0].n, contactos_con_permiso: rows.length, rows });
  const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = ['nombre,usuario_telegram,email,telefono,acepto_novedades,alta,origen',
    ...rows.map((r) => [r.first_name, r.username, r.email, r.phone, r.optin_at?.toISOString?.() ?? r.optin_at, r.created_at?.toISOString?.() ?? r.created_at, 'MateBot'].map(q).join(','))].join('\n');
  return new Response(csv, {
    headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': 'attachment; filename="matebot-contactos.csv"' },
  });
}
