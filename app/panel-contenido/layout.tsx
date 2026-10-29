import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { cerrarSesion, ROL_NOMBRE } from "@/lib/auth"
import { instagram, registrarSeguidores, historialSeguidores } from "@/lib/instagram"
import { acceso, base, fmt, Spark, NoPermiso } from "./_ui"
import Nav from "./_nav"
import "./panel.css"

export const metadata: Metadata = { title: "Panel de Contenido · DEVISEBIT", robots: { index: false, follow: false } }

async function salir() {
  "use server"
  cerrarSesion()
  redirect("/login")
}

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const u = await acceso()
  const b = base()
  const ig = u ? await instagram() : null
  // Foto diaria de seguidores al abrir el panel (además del cron de las 8)
  if (ig?.ok) await registrarSeguidores(ig.perfil).catch(() => null)
  const hist = u ? await historialSeguidores(60).catch(() => []) : []
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" />
      <div className="pc">
        <aside className="pc-side">
          <div className="pc-brand">
            <a href={b || "/"} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
              <span className="pc-mark">D</span>
              <span><b>DEVISEBIT</b><small>Panel de contenido</small></span>
            </a>
            <form action={salir} className="pc-salir-movil"><button className="pc-btn" style={{ padding: "4px 10px", fontSize: 12 }}>Salir</button></form>
          </div>
          {u && (
            <div className="pc-acct">
              <div className="l">Seguidores en Instagram</div>
              <div className="n">{ig?.ok ? fmt(ig.perfil.seguidores) : "—"}</div>
              {hist.length > 1 && <Spark vals={hist.map((h) => h.seguidores)} color="var(--ig)" alto={28} className="pc-sp" />}
              <div className="l">{ig?.ok ? `@${ig.perfil.username} · ${hist.length > 1 ? `evolución de ${hist.length} días` : "la evolución se arma día a día"}` : "Instagram sin conexión"}</div>
            </div>
          )}
          {u && <Nav base={b} />}
          <div className="pc-foot">
            {u && <span>{u.nombre} · {ROL_NOMBRE[u.rol]}</span>}
            <span>DEVISEBIT SRL · datos propios, sin cifras inventadas</span>
            <form action={salir}><button>Cerrar sesión</button></form>
          </div>
        </aside>
        <main className="pc-main">
          <div className="pc-wrap">{u ? children : <NoPermiso />}</div>
        </main>
      </div>
    </>
  )
}
