"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef } from "react"

/** Menú de Mi cuenta: marca la sección en la que está la persona (aria-current) para que siempre sepa dónde está. */
export default function PortalNav({ items, academia }: { items: { href: string; t: string }[]; academia: string }) {
  // En portal.devisebit.com la ruta visible no lleva el prefijo /portal; por la ruta larga, sí.
  const p = (usePathname() ?? "").replace(/^\/portal(?=\/|$)/, "") || "/"
  const activo = (href: string) => {
    const h = href.replace(/^\/portal/, "") || "/"
    if (h === "/") return p === "/" || p.startsWith("/p/")
    return p === h || p.startsWith(h + "/") || (h === "/pagos" && (p.startsWith("/pagar") || p.startsWith("/facturacion")))
  }
  // En celular el menú se desliza: la sección actual tiene que quedar a la vista
  const ref = useRef<HTMLElement>(null)
  useEffect(() => { ref.current?.querySelector<HTMLElement>('[aria-current="page"]')?.scrollIntoView({ block: "nearest", inline: "center" }) }, [p])
  return (
    <nav ref={ref} aria-label="Mi cuenta" className="portal-nav max-w-5xl mx-auto px-4 pb-2 flex gap-1 overflow-x-auto">
      {items.map((i) => <Link key={i.href} href={i.href} aria-current={activo(i.href) ? "page" : undefined}>{i.t}</Link>)}
      <a href={academia} title="Tus cursos, clases y certificados. Entrás con esta misma cuenta">ACADEMIA DEVISEBIT ↗</a>
    </nav>
  )
}
