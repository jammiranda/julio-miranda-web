import { NextResponse, type NextRequest } from "next/server"
const PUBLIC = ["/login", "/primer-ingreso", "/activar", "/recuperar", "/api/consultas", "/api/whatsapp", "/api/crm", "/api/salud", "/api/visita", "/api/panel", "/v.js", "/brief", "/agendar", "/fichas", "/api/e/", "/baja", "/api/suscribir", "/api/cron", "/api/academia", "/_next", "/favicon", "/manifest.webmanifest", "/icon", "/apple-icon", "/sw.js", "/robots.txt", "/sitemap.xml", "/descarga", "/gracias", "/lista-precios", "/portal", "/wa-perfil.jpg", "/marca/"]
export function middleware(req: NextRequest) {
  const p = req.nextUrl.pathname
  const host = (req.headers.get("host") ?? "").toLowerCase()
  // academia.devisebit.com: sitio público de contenidos (vive en /academia)
  if (host.startsWith("academia.")) {
    if (p.startsWith("/api") || p.startsWith("/_next") || p.startsWith("/academia") || /\.(png|ico|txt|xml|webmanifest)$/.test(p)) return NextResponse.next()
    const u = req.nextUrl.clone()
    u.pathname = "/academia" + (p === "/" ? "" : p)
    return NextResponse.rewrite(u)
  }
  // portal.devisebit.com: portal de clientes (vive en /portal, maneja su propia sesión)
  if (host.startsWith("portal.")) {
    if (p.startsWith("/_next") || p.startsWith("/portal") || /\.(png|ico|txt|xml|webmanifest|js|jpg)$/.test(p)) return NextResponse.next()
    const u = req.nextUrl.clone()
    u.pathname = "/portal" + (p === "/" ? "" : p)
    return NextResponse.rewrite(u)
  }
  if (PUBLIC.some((x) => p.startsWith(x)) || p === "/academia" || p.startsWith("/academia/")) return NextResponse.next()
  if (!req.cookies.get("db_sesion")) return NextResponse.redirect(new URL("/login", req.url))
  // El layout necesita saber en qué sistema estás (Comercial o Academia)
  const h = new Headers(req.headers)
  h.set("x-ruta", p)
  const res = NextResponse.next({ request: { headers: h } })
  const esp = p.startsWith("/academia-admin") || p.startsWith("/cursos") ? "academia" : /^\/(email|cuenta|ayuda|usuarios|api)(\/|$)/.test(p) ? null : "comercial"
  if (esp && req.cookies.get("db_espacio")?.value !== esp) res.cookies.set("db_espacio", esp, { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 180 })
  return res
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] }
