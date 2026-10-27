import { NextResponse, type NextRequest } from "next/server"
const PUBLIC = ["/login", "/primer-ingreso", "/activar", "/recuperar", "/api/consultas", "/api/whatsapp", "/api/crm", "/api/salud", "/brief", "/agendar", "/fichas", "/api/e/", "/baja", "/api/suscribir", "/api/cron", "/api/academia", "/_next", "/favicon", "/manifest.webmanifest", "/icon", "/apple-icon", "/sw.js", "/robots.txt", "/sitemap.xml", "/descarga", "/gracias", "/lista-precios", "/wa-perfil.jpg", "/marca/"]
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
  if (PUBLIC.some((x) => p.startsWith(x)) || p === "/academia" || p.startsWith("/academia/")) return NextResponse.next()
  if (!req.cookies.get("db_sesion")) return NextResponse.redirect(new URL("/login", req.url))
  return NextResponse.next()
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] }
