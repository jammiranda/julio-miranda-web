import Link from "next/link"
import { requerir } from "@/lib/auth"
import { q, one } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { brevoConfigurado, enviadosHoy, LIMITE_DIARIO, REMITENTE, diagnosticoBrevo, procesarCola } from "@/lib/email"
import { audit } from "@/lib/db"
import { fechaHora } from "@/lib/consultas"
import { asegurarRelanzamiento, lanzarRelanzamientoSiCorresponde } from "@/lib/campania-relanzamiento"
import { waitUntil } from "@vercel/functions"
import { depurarBase, contarSinRespuesta, depurarSinRespuesta } from "@/lib/depuracion"

export const dynamic = "force-dynamic"
export const maxDuration = 300

const EST: Record<string, string> = { borrador: "bg-slate-100 text-slate-700", enviando: "bg-amber-50 text-amber-700", enviada: "bg-emerald-50 text-emerald-700", pausada: "bg-slate-100 text-slate-500" }

async function enviarAhora(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  if (fd.get("op") === "reintentar") await q("update em_envios e set estado='pendiente', error=null from em_campanias k where k.id=e.campania_id and e.estado='error' and k.estado in ('enviando','enviada')")
  await q("update em_campanias k set estado='enviando', terminada=null where estado='enviada' and exists (select 1 from em_envios e where e.campania_id=k.id and e.estado='pendiente')")
  const r = await procesarCola(60)
  await audit(u, "email_enviar_ahora", "em_envios", undefined, `${r.enviados} enviados · ${r.motivo}`)
  revalidatePath("/email")
}

async function depurar() {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const n = await depurarSinRespuesta(3, `Depuración · ${u.nombre}`)
  await audit(u, "email_depurar", "db_contactos", undefined, `${n} pasados a Descartados por no responder`)
  revalidatePath("/email")
}

async function cancelarProg() {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  await q("update config set valor='cancelado' where clave='relanzamiento_auto'")
  await audit(u, "email_programacion_cancelada", "em_campania")
  revalidatePath("/email")
}

export default async function Email() {
  await requerir(["gerente", "coordinacion"])
  const [diag, errores] = await Promise.all([
    diagnosticoBrevo(),
    q<{ error: string; n: number }>("select coalesce(error,'(sin detalle)') error, count(*)::int n from em_envios where estado='error' group by 1 order by 2 desc limit 5"),
  ])
  const enCola = (await one<{ n: number }>("select count(*)::int n from em_envios where estado='pendiente'"))?.n ?? 0
  const dep = await depurarBase().catch(() => null)
  const sinRespuesta = await contarSinRespuesta(3)
  const relEstado = await lanzarRelanzamientoSiCorresponde().catch(() => "")
  if (relEstado.startsWith("lanzada")) waitUntil(procesarCola())
  const prog = (await one<{ valor: string }>("select valor from config where clave='relanzamiento_auto'").catch(() => null))?.valor
  const relId = await asegurarRelanzamiento()
  const rel = relId ? await one<any>(`select k.estado, count(e.id)::int total, count(e.id) filter (where e.estado='enviado')::int enviados, count(e.id) filter (where e.estado='pendiente')::int pendientes from em_campanias k left join em_envios e on e.campania_id=k.id where k.id=$1 group by k.id`, [relId]) : null
  const sinLista = (await one<{ n: number }>("select count(*)::int n from db_contactos where clase is null and email is not null and email_estado='activo'"))?.n ?? 0
  const [camps, base, hoy] = await Promise.all([
    q<any>(`select k.*, count(e.id)::int total, count(e.id) filter (where e.estado='enviado')::int enviados, count(e.id) filter (where e.estado='pendiente')::int pendientes,
              count(e.abierto_en)::int abiertos, count(e.clic_en)::int clics, count(*) filter (where e.baja)::int bajas
            from em_campanias k left join em_envios e on e.campania_id=k.id group by k.id order by k.creado desc limit 50`),
    one<any>(`select count(*) filter (where email is not null and email_estado='activo')::int activos, count(*) filter (where suscrito_en is not null and email_estado='activo')::int suscriptos,
                count(*) filter (where email_estado='baja')::int bajas, count(*) filter (where email_estado='rebotado')::int rebotados from db_contactos`),
    enviadosHoy(),
  ])
  const cupoCompleto = !diag.ok && hoy >= LIMITE_DIARIO && diag.problemas.every((p) => /créditos/.test(p))
  const pct = (a: number, b: number) => (b ? `${Math.round((100 * a) / b)}%` : "—")
  const form = `<form onsubmit="event.preventDefault();var f=this;fetch('https://sistema.devisebit.com/api/suscribir',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:f.email.value,nombre:f.nombre.value,tag:'newsletter',origen:location.hostname})}).then(function(){f.innerHTML='<p>¡Listo! Revisá tu correo.</p>'})">
  <input name="nombre" placeholder="Tu nombre"> <input name="email" type="email" required placeholder="Tu email"> <button>Suscribirme</button>
</form>`
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="m-0">Envíos</h1><p className="m-0 text-sm text-[#4A515C]">Newsletters, promociones e invitaciones con plantillas de distintos estilos, escritas a mano o con IA. Ves aperturas y clics de cada envío.</p></div>
        <Link href="/email/plantillas" className="btn-p">+ Nuevo envío</Link>
      </div>
      {!brevoConfigurado() && <p className="m-0 card border-2 border-amber-300 text-sm">⚠️ Falta conectar Brevo (variable <code>BREVO_API_KEY</code> en Vercel). Podés armar campañas y verlas, pero no se envían hasta conectarlo.</p>}
      <section className={`card flex flex-col gap-2 border-2 ${diag.ok ? "border-emerald-200" : "border-red-300"}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="m-0 text-base">{diag.ok ? "✅ Envío de correos funcionando" : cupoCompleto ? "✅ Cupo de hoy completo: sigue mañana a las 8 h" : "⚠️ Los correos no pueden salir"}</h2>
          <form action={enviarAhora} className="flex gap-2">
            {errores.length > 0 && <button name="op" value="reintentar" className="btn-s py-1.5 text-sm">Reintentar los que fallaron</button>}
            {enCola > 0 && <button name="op" value="enviar" className="btn-p py-1.5 text-sm">Enviar ahora ({Math.min(enCola, 60)})</button>}
          </form>
        </div>
        {!cupoCompleto && diag.problemas.map((p, i) => <p key={i} className="m-0 text-sm text-red-700">• {p}</p>)}
        {diag.info.map((p, i) => <p key={i} className="m-0 text-xs text-[#4A515C]">{p}</p>)}
        {enCola > 0 && <p className="m-0 text-xs text-[#4A515C]">{enCola} correos en cola. Salen solos todos los días a las 8 h, o ahora con el botón.</p>}
        {errores.length > 0 && <div className="text-xs"><strong>Errores de envío:</strong><ul className="m-0 pl-5">{errores.map((e, i) => <li key={i}>{e.n} × {e.error}</li>)}</ul></div>}
      </section>
      {relId && rel && (
        <section className="card flex flex-wrap items-center justify-between gap-3 border-2 border-[#C8231F]">
          <div className="flex flex-col gap-1">
            <h2 className="m-0 text-base">📣 Campaña «DEVISEBIT se renueva» · landings de servicios</h2>
            <p className="m-0 text-sm text-[#4A515C]">
              {rel.estado === "borrador" && prog === "esperando_dominio" ? "⏳ Programada: apenas Brevo muestre devisebit.com como autenticado, se clasifica «Por clasificar» con las sugerencias y sale sola, " + LIMITE_DIARIO + " por día hasta completar la base. Si querés, podés lanzarla antes desde la campaña."
                : rel.estado === "borrador" ? "Lista para enviar: revisá a quién va (listas, etiquetas), mandate una prueba y tocá «Enviar campaña». Sale de a " + LIMITE_DIARIO + " por día, sola."
                : rel.estado === "enviando" ? `En marcha: ${rel.enviados} de ${rel.total} enviados · ${rel.pendientes} en cola (≈ ${Math.ceil(rel.pendientes / LIMITE_DIARIO)} día${Math.ceil(rel.pendientes / LIMITE_DIARIO) === 1 ? "" : "s"} más).`
                : rel.estado === "pausada" ? `Pausada: ${rel.enviados} de ${rel.total} enviados.` : `Terminada: ${rel.enviados} enviados.`}
              {" "}Estadísticas en panel.devisebit.com → Email.
            </p>
          </div>
          <div className="flex gap-2">{rel.estado === "borrador" && prog === "esperando_dominio" && <form action={cancelarProg}><button className="btn-s">Cancelar programación</button></form>}<Link href={`/email/${relId}`} className="btn-p">{rel.estado === "borrador" ? "Abrir" : "Ver campaña"}</Link></div>
        </section>
      )}
      {sinLista > 0 && (
        <p className="m-0 card border-2 border-amber-300 text-sm">⚠️ Hay <strong>{sinLista}</strong> contactos con email en <strong>«Por clasificar»</strong>: no reciben ningún envío hasta ubicarlos en una lista. <Link href="/contactos/clasificar" className="font-semibold underline">Clasificarlos</Link> (podés aceptar las sugerencias en lote).</p>
      )}
      <section className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[["Con email activo", base?.activos], ["Suscriptos al newsletter", base?.suscriptos], ["Bajas", base?.bajas], ["Rebotados", base?.rebotados], [`Enviados hoy (máx. ${LIMITE_DIARIO})`, hoy]].map(([t, n]) => (
          <div key={t as string} className="card flex flex-col gap-1"><span className="text-xs font-semibold uppercase tracking-wider text-[#4A515C]">{t}</span><span className="text-3xl font-extrabold">{(n as number) ?? 0}</span></div>
        ))}
      </section>
      <section className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>Campaña</th><th>Estado</th><th className="text-right">Destinatarios</th><th className="text-right">Enviados</th><th className="text-right">Abrieron</th><th className="text-right">Clics</th><th className="text-right">Bajas</th><th></th></tr></thead>
            <tbody>
              {camps.map((k) => (
                <tr key={k.id} className="hover:bg-[#F8F9FB]">
                  <td><Link href={`/email/${k.id}`} className="font-semibold hover:underline">{k.asunto}</Link><div className="text-xs text-[#4A515C]">{fechaHora(k.creado)}{k.creado_por ? ` · ${k.creado_por}` : ""}</div></td>
                  <td><span className={`chip ${EST[k.estado]}`}>{k.estado}</span>{k.pendientes > 0 && k.estado === "enviando" && <div className="text-xs text-[#4A515C] mt-1">{k.pendientes} en cola</div>}</td>
                  <td className="text-right">{k.total || "—"}</td><td className="text-right">{k.enviados || "—"}</td>
                  <td className="text-right">{k.enviados ? `${k.abiertos} · ${pct(k.abiertos, k.enviados)}` : "—"}</td>
                  <td className="text-right">{k.enviados ? `${k.clics} · ${pct(k.clics, k.enviados)}` : "—"}</td>
                  <td className="text-right">{k.bajas || "—"}</td>
                  <td><Link href={`/email/${k.id}`} className="btn-s py-1 px-3 text-xs">Abrir</Link></td>
                </tr>
              ))}
              {!camps.length && <tr><td colSpan={8} className="text-center text-[#4A515C] py-6">Todavía no hay campañas. Creá la primera: la IA te arma el borrador.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
      <section className="card flex flex-col gap-2">
        <h2 className="m-0 text-base">🧹 Depuración de la base</h2>
        <p className="m-0 text-sm text-[#4A515C]">Cada envío limpia la base: los correos que rebotan o que Brevo bloquea quedan como <strong>rebotados</strong>, y quien marca spam o se da de baja no recibe nada más. Se revisa solo todos los días{dep?.marcados ? ` (hoy: ${dep.marcados} marcados)` : ""}.</p>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="m-0 text-sm"><strong>{sinRespuesta}</strong> contactos recibieron 3 envíos o más y nunca abrieron ni hicieron clic (los clientes no se tocan).</p>
          {sinRespuesta > 0 && <form action={depurar}><button className="btn-s">Pasarlos a Descartados</button></form>}
        </div>
      </section>
      <section className="card flex flex-col gap-2">
        <h2 className="m-0 text-base">📣 Público para anuncios de Instagram y Facebook</h2>
        <p className="m-0 text-sm text-[#4A515C]">La base depurada lista para subir a Meta como <strong>público personalizado</strong> (Administrador de anuncios → Públicos → Crear público → Lista de clientes). Sale sin los «no-enviar», bajas, rebotados ni excluidos. Meta cifra los datos al subirlos y solo los usa para encontrar esas cuentas.</p>
        <div className="flex flex-wrap gap-2"><a href="/api/e/publico-meta" className="btn-s">Descargar toda la base depurada</a><a href="/api/e/publico-meta?red=1" className="btn-s">Solo la red de Julio</a></div>
      </section>
      <section className="card flex flex-col gap-2">
        <h2 className="m-0 text-base">Cómo funciona</h2>
        <ul className="m-0 pl-5 text-sm flex flex-col gap-1 text-[#262C37]">
          <li>Remitente: <strong>{REMITENTE.name} &lt;{REMITENTE.email}&gt;</strong>. Brevo gratis permite {LIMITE_DIARIO} por día: si la campaña tiene más destinatarios, sigue sola cada día a las 8 h.</li>
          <li>Cada correo lleva link de baja en un clic; quien se da de baja no vuelve a recibir nada. Se miden aperturas y clics.</li>
          <li>Para elegir a quién mandar, usá etapa, sector, categoría, origen o <strong>etiquetas</strong> (se cargan al importar con una columna «Etiquetas»).</li>
        </ul>
        <details className="text-sm"><summary className="cursor-pointer font-semibold">Formulario de suscripción para cualquier web</summary>
          <pre className="mt-2 whitespace-pre-wrap text-xs bg-[#F5F6F8] rounded-xl p-3">{form}</pre></details>
      </section>
    </div>
  )
}
