import { NextResponse, type NextRequest } from "next/server"
const PUBLIC = ["/login", "/primer-ingreso", "/activar", "/recuperar", "/api/consultas", "/api/whatsapp", "/api/crm", "/api/salud", "/api/visita", "/api/panel", "/api/ads", "/api/demos", "/demo/", "/doc/", "/v.js", "/brief", "/agendar", "/fichas", "/api/e/", "/baja", "/api/suscribir", "/api/cron", "/api/academia", "/_next", "/favicon", "/manifest.webmanifest", "/icon", "/apple-icon", "/sw.js", "/robots.txt", "/sitemap.xml", "/descarga", "/gracias", "/lista-precios", "/portal", "/wa-perfil.jpg", "/marca/"]
export function middleware(req: NextRequest) {
  const p = req.nextUrl.pathname
  const host = (req.headers.get("host") ?? "").toLowerCase()
  // academia.devisebit.com: sitio público (vive en /academia) + su propio sistema interno en /sistema
  if (host.startsWith("academia.")) {
    if (p.startsWith("/api") || p.startsWith("/_next") || /\.(png|ico|txt|xml|webmanifest|js|jpg|svg)$/.test(p)) return NextResponse.next()
    // Sistema interno de la Academia y pantallas compartidas (sesión propia de este dominio)
    if (/^\/(sistema|email|usuarios|cuenta|ayuda|login|primer-ingreso|activar|recuperar)(\/|$)/.test(p)) {
      if (!/^\/(login|primer-ingreso|activar|recuperar)(\/|$)/.test(p) && !req.cookies.get("db_sesion")) return NextResponse.redirect(new URL("/login", req.url))
      const h = new Headers(req.headers)
      h.set("x-espacio", "academia")
      return NextResponse.next({ request: { headers: h } })
    }
    if (p.startsWith("/academia")) return NextResponse.next()
    const u = req.nextUrl.clone()
    u.pathname = "/academia" + (p === "/" ? "" : p)
    return NextResponse.rewrite(u)
  }
  // panel.devisebit.com: Panel de Contenido (vive en /panel-contenido) con la misma sesión del sistema
  if (host.startsWith("panel.")) {
    if (p.startsWith("/api") || p.startsWith("/_next") || /\.(png|ico|txt|xml|webmanifest|js|jpg|svg)$/.test(p)) return NextResponse.next()
    if (/^\/(login|primer-ingreso|activar|recuperar)(\/|$)/.test(p)) return NextResponse.next()
    // panel.devisebit.com llega por proxy a panel.sistema.devisebit.com: el login siempre se manda al dominio público (las URL relativas rompen el middleware)
    if (!req.cookies.get("db_sesion")) return NextResponse.redirect(host.startsWith("panel.localhost") ? new URL("/login", req.url) : "https://panel.devisebit.com/login")
    if (p === "/panel-contenido" || p.startsWith("/panel-contenido/")) return NextResponse.next()
    const u = req.nextUrl.clone()
    u.pathname = "/panel-contenido" + (p === "/" ? "" : p)
    return NextResponse.rewrite(u)
  }
  // sistema.devisebit.com: la Academia tiene su propio sistema en academia.devisebit.com/sistema
  if (host.startsWith("sistema.")) {
    const viejo = p.match(/^\/(academia-admin|cursos)(\/.*)?$/)
    if (viejo) return NextResponse.redirect(`https://academia.devisebit.com/sistema${viejo[1] === "cursos" ? "/cursos" : ""}${viejo[2] ?? ""}${req.nextUrl.search}`)
    if (p === "/sistema" || p.startsWith("/sistema/")) return NextResponse.redirect(`https://academia.devisebit.com${p}${req.nextUrl.search}`)
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
  return NextResponse.next()
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] }
