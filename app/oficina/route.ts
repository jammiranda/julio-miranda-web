import { NextResponse } from "next/server"
import { soloJulio } from "@/lib/oficina"
import { OFICINA_HTML } from "@/lib/oficina-html"

export const dynamic = "force-dynamic"

const HEAD = { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex, nofollow", "referrer-policy": "same-origin" }

function entrar(error?: string) {
  const google = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
  const msg: Record<string, string> = { cuenta: "Esa cuenta de Google no tiene acceso a la Oficina.", sesion: "Se venció el intento. Probá de nuevo.", google: "Google no respondió. Probá de nuevo.", usuario: "No encontré tu usuario en el sistema.", config: "Entrar con Google todavía no está configurado." }
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Oficina DEVISEBIT</title><style>
:root{color-scheme:light dark;--bg:#f1f2f4;--ink:#15171c;--card:#fff;--line:#d3d7de;--brand:#d7263d}@media(prefers-color-scheme:dark){:root{--bg:#12141a;--ink:#eceef2;--card:#1b1f2a;--line:#2e3442}}
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:var(--bg);color:var(--ink);font:16px/1.5 system-ui,-apple-system,Segoe UI,sans-serif;padding:16px}
main{width:100%;max-width:380px;background:var(--card);border:1px solid var(--line);border-radius:18px;padding:28px 24px;text-align:center}
h1{font-size:22px;margin:0 0 6px}p{margin:0 0 18px;opacity:.75}.b{display:block;width:100%;padding:13px 16px;border-radius:12px;border:1px solid var(--line);background:transparent;color:var(--ink);font:600 16px system-ui;text-decoration:none;margin-top:10px}.p{background:var(--ink);color:var(--bg);border-color:var(--ink)}.e{color:var(--brand);margin:0 0 14px;opacity:1}
</style></head><body><main><h1>Oficina DEVISEBIT</h1><p>Acceso privado.</p>${error && msg[error] ? `<p class="e" role="alert">${msg[error]}</p>` : ""}${google ? `<a class="b p" href="/api/oficina/google">Entrar con Google</a>` : ""}<a class="b${google ? "" : " p"}" href="/login">Entrar con usuario y clave</a></main></body></html>`
  return new NextResponse(html, { status: 401, headers: HEAD })
}

export async function GET(req: Request) {
  if (!(await soloJulio())) return entrar(new URL(req.url).searchParams.get("error") ?? undefined)
  return new NextResponse(OFICINA_HTML, { headers: HEAD })
}
