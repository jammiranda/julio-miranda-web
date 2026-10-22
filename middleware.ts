import { NextResponse, type NextRequest } from "next/server"
const PUBLIC = ["/login", "/primer-ingreso", "/activar", "/_next", "/favicon"]
export function middleware(req: NextRequest) {
  const p = req.nextUrl.pathname
  if (PUBLIC.some((x) => p.startsWith(x))) return NextResponse.next()
  if (!req.cookies.get("sp_sesion")) return NextResponse.redirect(new URL("/login", req.url))
  return NextResponse.next()
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] }
