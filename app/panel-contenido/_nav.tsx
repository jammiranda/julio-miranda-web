"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef } from "react"

const I: Record<string, React.ReactNode> = {
  inicio: <path d="M3 11l9-8 9 8v10H3z" />,
  publicaciones: <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /></>,
  crm: <path d="M3 4h18l-7 8v6l-4 2v-8z" />,
  academia: <><path d="M2 9l10-5 10 5-10 5z" /><path d="M6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5" /></>,
  web: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" /></>,
  usuarios: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></>,
  analisis: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  youtube: <><rect x="2" y="5" width="20" height="14" rx="4" /><path d="M10 9l5 3-5 3z" /></>,
  anuncios: <path d="M3 11v2a1 1 0 001 1h2l5 4V6L6 10H4a1 1 0 00-1 1zM15 9a4 4 0 010 6M18 6a8 8 0 010 12" />,
  email: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></>,
  linkedin: <><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 014 0v4M12 10v7" /></>,
  competencia: <><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M3 20c0-3 3-5 6-5s6 2 6 5M15 15c3 0 6 1.5 6 4.5" /></>,
}
const GRUPOS: { g?: string; items: [string, string][] }[] = [
  { items: [["", "Inicio"]] },
  { g: "Contenido", items: [["publicaciones", "Publicaciones"]] },
  { g: "Negocio", items: [["crm", "CRM y ventas"], ["academia", "Academia"], ["web", "Web"], ["usuarios", "Usuarios"]] },
  { g: "Medir", items: [["analisis", "Análisis"], ["email", "Email"], ["youtube", "YouTube"], ["linkedin", "LinkedIn"], ["anuncios", "Anuncios"], ["competencia", "Competencia"]] },
]

export default function Nav({ base }: { base: string }) {
  const p = usePathname() ?? "/"
  const rel = (base && p.startsWith(base) ? p.slice(base.length) : p).replace(/^\/+/, "").split("/")[0]
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    // En celular la barra es horizontal: deja visible la pestaña activa
    ref.current?.querySelector<HTMLElement>('[aria-current="page"]')?.scrollIntoView({ block: "nearest", inline: "center" })
  }, [rel])
  return (
    <nav ref={ref} className="pc-nav" aria-label="Secciones del panel">
      {GRUPOS.map((g, gi) => (
        <div key={gi} style={{ display: "contents" }}>
          {g.g && <div className="grp">{g.g}</div>}
          {g.items.map(([s, t]) => (
            <Link key={s} href={`${base}/${s}`.replace(/\/$/, "") || "/"} aria-current={rel === s ? "page" : undefined} prefetch={false}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{I[s || "inicio"]}</svg>
              {t}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  )
}
