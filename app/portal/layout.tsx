import Link from "next/link"
import { redirect } from "next/navigation"
import type { Metadata } from "next"
import Marca from "@/components/Marca"
import { clienteActual, cerrarSesionCliente } from "@/lib/portal"
import { URL_ACADEMIA } from "@/lib/academia"
import LinksExternos from "@/components/LinksExternos"
import Redes from "@/components/Redes"
import FuentesEspacio from "@/components/FuentesEspacio"
import PortalNav from "./_nav"
import { tieneAsesoria } from "@/lib/asesoria"

/** El espacio del alumno dentro de la Academia (misma sesión): cursos, clases y certificados, o los cursos abiertos si todavía no tiene. */
const MI_ACADEMIA = `${URL_ACADEMIA}/mi-cuenta`

export const metadata: Metadata = { title: { default: "Mi cuenta · DEVISEBIT", template: "%s · Mi cuenta DEVISEBIT" }, robots: { index: false, follow: false } }

async function salir() {
  "use server"
  cerrarSesionCliente()
  redirect("/portal/entrar?salio=1")
}

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const c = await clienteActual()
  const ase = c?.acceso === "ok" ? await tieneAsesoria(c.id).catch(() => false) : false
  const items = c?.acceso === "ok"
    ? [{ href: "/portal", t: "Inicio" }, ...(ase ? [{ href: "/portal/asesoria", t: "Asesoría" }] : []), { href: "/portal/cursos", t: "Mis cursos" }, { href: "/portal/pagos", t: "Pagos y facturas" }, { href: "/portal/reuniones", t: "Reuniones" }, { href: "/portal/servicios", t: "Servicios y productos" }]
    : c ? [{ href: "/portal/pagos", t: "Pagos y facturas" }] : []
  return (
    <div data-espacio="portal" className="min-h-screen flex flex-col">
      <FuentesEspacio />
      <header className="portal-cab">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link href="/portal" aria-label="DEVISEBIT Mi cuenta, inicio" className="inline-flex items-center min-h-[44px]"><Marca chico sub="MI CUENTA" /></Link>
          {!c && <a href={MI_ACADEMIA} className="inline-flex items-center min-h-[44px] text-sm font-semibold text-[var(--ac-texto)] hover:underline">Ir a ACADEMIA DEVISEBIT ↗</a>}
          {c && (
            <div className="flex items-center gap-3 text-sm">
              <span className="hidden sm:flex flex-col leading-tight text-right"><span className="font-semibold">{c.nombre}</span>{c.organizacion && <span className="text-xs text-[#4A515C]">{c.organizacion}</span>}</span>
              <form action={salir}><button className="btn-s py-1.5">Salir</button></form>
            </div>
          )}
        </div>
        {c && (
          <PortalNav items={items} academia={MI_ACADEMIA} />
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
