import type { Metadata } from "next"
import { Suspense } from "react"
import { unstable_cache } from "next/cache"
import { waitUntil } from "@vercel/functions"
import { redirect } from "next/navigation"
import { cerrarSesion, ROL_NOMBRE } from "@/lib/auth"
import { instagram, registrarSeguidores, historialSeguidores } from "@/lib/instagram"
import { one } from "@/lib/db"
import { safe } from "@/lib/panel"
import { acceso, base, fmt, Spark, NoPermiso } from "./_ui"
import Nav from "./_nav"
import Buscar from "./_buscar"
import "./panel.css"

export const metadata: Metadata = { title: "Panel de Contenido · DEVISEBIT", robots: { index: false, follow: false } }

async function salir() {
  "use server"
  cerrarSesion()
  redirect("/login")
}

// La foto diaria de seguidores y la sincronización de publicaciones se hacen en segundo plano y como mucho cada 6 horas (además del cron de las 8)
const registroDiario = unstable_cache(async () => { await registrarSeguidores().catch(() => null); return Date.now() }, ["pc-ig-registro"], { revalidate: 21600 })

/** Pendientes que se muestran como globito en el menú (se recalculan como mucho cada minuto). */
const avisosMenu = unstable_cache(
  async () => {
    const r = await safe(one<{ c: number }>(`select count(*)::int c from consultas where empresa='devisebit' and necesita_humano and estado in ('nueva','contactada')`))
    return { crm: r?.c ?? 0 }
  },
  ["pc-avisos-menu"],
  { revalidate: 60 },
)

async function CuentaIG() {
  const [ig, hist] = await Promise.all([instagram(), historialSeguidores(60).catch(() => [])])
  if (ig?.ok) waitUntil(registroDiario().catch(() => null))
  return (
    <div className="pc-acct">
      <div className="l">Seguidores en Instagram</div>
      <div className="n">{ig?.ok ? fmt(ig.perfil.seguidores) : "—"}</div>
      {hist.length > 1 && <Spark vals={hist.map((h) => h.seguidores)} color="var(--ig)" alto={28} className="pc-sp" />}
      <div className="l">{ig?.ok ? `@${ig.perfil.username} · ${hist.length > 1 ? `evolución de ${hist.length} días` : "la evolución se arma día a día"}` : "Instagram sin conexión"}</div>
    </div>
  )
}

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const u = await acceso()
  const b = base()
  const av = u ? await avisosMenu().catch(() => ({ crm: 0 })) : { crm: 0 }
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" />
      <div className="pc">
        <a className="pc-skip" href="#contenido">Saltar al contenido</a>
        <aside className="pc-side">
          <div className="pc-brand">
            <a href={b || "/"} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
              <span className="pc-mark">D</span>
              <span><b>DEVISEBIT</b><small>Panel de contenido</small></span>
            </a>
            <form action={salir} className="pc-salir-movil"><button className="pc-btn" style={{ padding: "4px 10px", fontSize: 12 }}>Salir</button></form>
          </div>
          {u && <Buscar base={b} oficina={u.rol === "gerente"} />}
          {u && (
            <Suspense fallback={<div className="pc-acct"><div className="l">Seguidores en Instagram</div><div className="n">…</div></div>}>
              <CuentaIG />
            </Suspense>
          )}
          {u && <Nav base={b} oficina={u.rol === "gerente"} avisos={{ crm: av.crm }} />}
          <div className="pc-foot">
            {u && <span>{u.nombre} · {ROL_NOMBRE[u.rol]}</span>}
            <span>DEVISEBIT SRL · datos propios, sin cifras inventadas</span>
            <form action={salir}><button>Cerrar sesión</button></form>
          </div>
        </aside>
        <main className="pc-main" id="contenido" tabIndex={-1}>
          <div className="pc-wrap">{u ? children : <NoPermiso />}</div>
        </main>
      </div>
    </>
  )
}
