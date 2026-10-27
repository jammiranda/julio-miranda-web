import Link from "next/link"
import { redirect } from "next/navigation"
import type { Metadata } from "next"
import Marca from "@/components/Marca"
import { clienteActual, cerrarSesionCliente } from "@/lib/portal"

export const metadata: Metadata = { title: "Portal de clientes · DEVISEBIT", robots: { index: false, follow: false } }

async function salir() {
  "use server"
  cerrarSesionCliente()
  redirect("/portal/entrar?salio=1")
}

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const c = await clienteActual()
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-[#E2E5EA]">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link href="/portal" aria-label="Inicio del portal"><Marca chico sub="PORTAL DE CLIENTES" /></Link>
          {c && (
            <div className="flex items-center gap-3 text-sm">
              <span className="hidden sm:flex flex-col leading-tight text-right"><span className="font-semibold">{c.nombre}</span>{c.organizacion && <span className="text-xs text-[#4A515C]">{c.organizacion}</span>}</span>
              <form action={salir}><button className="btn-s py-1.5">Salir</button></form>
            </div>
          )}
        </div>
      </header>
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-6">{children}</main>
      <footer className="text-center text-xs text-[#4A515C] py-6 px-4">
        DEVISEBIT SRL · <a href="https://wa.me/5491173466490" className="underline">WhatsApp +54 9 11 7346-6490</a> · <a href="mailto:info@devisebit.com" className="underline">info@devisebit.com</a><br />
        Tus datos están protegidos (Ley 25.326). Cada ingreso queda registrado.
      </footer>
    </div>
  )
}
