import Link from "next/link"
import { redirect } from "next/navigation"
import type { Metadata } from "next"
import Marca from "@/components/Marca"
import { clienteActual, cerrarSesionCliente } from "@/lib/portal"
import { URL_ACADEMIA } from "@/lib/academia"
import LinksExternos from "@/components/LinksExternos"
import Redes from "@/components/Redes"

export const metadata: Metadata = { title: "Mi cuenta · DEVISEBIT", robots: { index: false, follow: false } }

async function salir() {
  "use server"
  cerrarSesionCliente()
  redirect("/portal/entrar?salio=1")
}

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const c = await clienteActual()
  const items = c?.acceso === "ok"
    ? [{ href: "/portal", t: "Inicio" }, { href: "/portal/cursos", t: "Mis cursos" }, { href: "/portal/pagos", t: "Pagos y facturas" }, { href: "/portal/servicios", t: "Servicios" }]
    : c ? [{ href: "/portal/pagos", t: "Pagos y facturas" }] : []
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-[#E2E5EA]">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link href="/portal" aria-label="Inicio de mi cuenta"><Marca chico sub="MI CUENTA" /></Link>
          {c && (
            <div className="flex items-center gap-3 text-sm">
              <span className="hidden sm:flex flex-col leading-tight text-right"><span className="font-semibold">{c.nombre}</span>{c.organizacion && <span className="text-xs text-[#4A515C]">{c.organizacion}</span>}</span>
              <form action={salir}><button className="btn-s py-1.5">Salir</button></form>
            </div>
          )}
        </div>
        {c && (
          <nav aria-label="Mi cuenta" className="max-w-5xl mx-auto px-4 pb-2 flex gap-1 overflow-x-auto">
            {items.map((i) => <Link key={i.href} href={i.href} className="px-3 py-1.5 rounded-lg text-sm font-semibold text-[#262C37] hover:bg-[#FDECEB] whitespace-nowrap">{i.t}</Link>)}
            <a href={`${URL_ACADEMIA}/cursos`} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg text-sm font-semibold text-[#262C37] hover:bg-[#FDECEB] whitespace-nowrap">Academia ↗</a>
          </nav>
        )}
      </header>
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-6">{children}</main>
      <LinksExternos />
      <footer className="flex flex-col items-center gap-2 text-center text-xs text-[#4A515C] py-6 px-4">
        <Redes conTexto />
        <p className="m-0">DEVISEBIT SRL · <a target="_blank" rel="noopener noreferrer" href="https://wa.me/5491173466490" className="underline">WhatsApp +54 9 11 7346-6490</a> · <a href="mailto:info@devisebit.com" className="underline">info@devisebit.com</a><br />
        Tus datos están protegidos (Ley 25.326). Cada ingreso queda registrado.</p>
      </footer>
    </div>
  )
}
