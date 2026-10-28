"use client"
import { useEffect } from "react"

/**
 * Resguardo del portal: cualquier link a otro sitio (academia, web, WhatsApp, documentos, Mercado Pago no)
 * se abre en otra pestaña, para que el cliente nunca pierda su cuenta abierta.
 * Los formularios (por ejemplo, pagar con Mercado Pago) no se tocan.
 */
export default function LinksExternos() {
  useEffect(() => {
    const click = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = (e.target as HTMLElement | null)?.closest?.("a[href]") as HTMLAnchorElement | null
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return
      let u: URL
      try { u = new URL(a.href, location.href) } catch { return }
      if (!/^https?:$/.test(u.protocol) || u.host === location.host) return
      e.preventDefault()
      window.open(u.href, "_blank", "noopener,noreferrer")
    }
    document.addEventListener("click", click, true)
    return () => document.removeEventListener("click", click, true)
  }, [])
  return null
}
