import Link from "next/link"
import { redirect } from "next/navigation"
import { requerir } from "@/lib/auth"
import { q, audit } from "@/lib/db"
import { POLITICAS, POLITICA_DEFECTO, politica, habilitarSolicitud, urlPortal } from "@/lib/portal"
import { config, guardarConfig, diasBloqueo, plata } from "@/lib/cobros"
import { fecha } from "@/lib/util"
import { empresa, guardarEmpresa, cargarFactura, CONDICIONES_IVA, formatoCuit, cuitValido } from "@/lib/comprobantes"

export const dynamic = "force-dynamic"

async function guardar(fd: FormData) {
  "use server"
  const u = await requerir(["gerente"])
  const pol = String(fd.get("politica") ?? POLITICA_DEFECTO)
  if (POLITICAS.some((p) => p.v === pol)) await guardarConfig("portal_politica", pol)
  await guardarConfig("portal_bloqueo_dias", String(Math.max(0, Math.min(365, Number(fd.get("dias")) || 0))))
  await guardarConfig("datos_transferencia", String(fd.get("transferencia") ?? "").slice(0, 1000))
  await audit(u, "portal_config", "config", "portal", pol)
  redirect("/portal-admin?ok=1")
}

async function resolver(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const id = Number(fd.get("id"))
  if (fd.get("op") === "habilitar") {
    const r = await habilitarSolicitud(id, u.nombre)
    await audit(u, "portal_habilita", "portal_solicitud", id, r.ok ? undefined : r.error)
    redirect(r.ok ? "/portal-admin?hab=1" : `/portal-admin?err=${encodeURIComponent(r.error ?? "error")}`)
  }
  await q("update portal_solicitudes set resuelta='rechazada', resuelta_por=$1, resuelta_en=now() where lower(email)=(select lower(email) from portal_solicitudes where id=$2) and resultado='pendiente' and resuelta is null", [u.nombre, id])
  await audit(u, "portal_rechaza", "portal_solicitud", id)
  redirect("/portal-admin")
}

async function datosEmpresa(fd: FormData) {
  "use server"
  const u = await requerir(["gerente"])
  const cuit = String(fd.get("cuit") ?? "").replace(/\D/g, "")
  if (cuit && !cuitValido(cuit)) redirect("/portal-admin?err=" + encodeURIComponent("El CUIT de la empresa no es válido") + "#empresa")
  const iva = String(fd.get("iva") ?? "")
  await guardarEmpresa({ razon: String(fd.get("razon") ?? "DEVISEBIT SRL"), cuit, iva: (CONDICIONES_IVA as readonly string[]).includes(iva) ? iva : "", domicilio: String(fd.get("domicilio") ?? ""), iibb: String(fd.get("iibb") ?? ""), inicio: String(fd.get("inicio") ?? "") })
  await audit(u, "empresa_datos", "config", "empresa_datos")
  redirect("/portal-admin?ok=1#empresa")
}

async function facturar(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const nro = String(fd.get("nro") ?? "").trim(), url = String(fd.get("url") ?? "").trim()
  if (!nro || !/^https?:\/\//.test(url)) redirect("/portal-admin?err=" + encodeURIComponent("Poné el número de factura y el link al PDF (https://…)") + "#facturas")
  const r = await cargarFactura(Number(fd.get("cobro")), { nro, url, tipo: String(fd.get("tipo") ?? "") || null, por: u.nombre })
  redirect(r.ok ? "/portal-admin?fok=1#facturas" : "/portal-admin?err=" + encodeURIComponent(r.error ?? "error") + "#facturas")
}

async function acceso(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const cid = Number(fd.get("contacto"))
  const v = String(fd.get("acceso"))
  if (!["auto", "habilitado", "bloqueado"].includes(v)) redirect("/portal-admin")
  await q("update db_contactos set portal_acceso=$1, actualizado=now() where id=$2", [v, cid])
  await audit(u, `portal_acceso_${v}`, "db_contacto", cid)
  redirect("/portal-admin#clientes")
}

/** Cuenta creada sola desde el portal: el equipo la deja, la bloquea o la borra (solo si todavía no tiene nada asociado). */
async function cuentaNueva(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const cid = Number(fd.get("contacto"))
  const op = String(fd.get("op"))
  if (op === "bloquear") {
    await q("update db_contactos set portal_acceso='bloqueado', actualizado=now() where id=$1", [cid])
    await audit(u, "portal_acceso_bloqueado", "db_contacto", cid, "cuenta nueva")
    redirect("/portal-admin#nuevas")
  }
  if (op === "borrar") {
    const libre = await q(
      `select 1 from db_contactos c where c.id=$1 and c.fuente='portal'
         and not exists (select 1 from db_proyectos p where p.contacto_id=c.id)
         and not exists (select 1 from db_cobros b where b.contacto_id=c.id)
         and not exists (select 1 from am_inscripciones i where i.contacto_id=c.id)`, [cid])
    if (!libre.length) redirect("/portal-admin?err=" + encodeURIComponent("Esa cuenta ya tiene proyectos, cobros o cursos: bloqueala en lugar de borrarla.") + "#nuevas")
    try { await q("delete from db_contactos where id=$1", [cid]) }
    catch { redirect("/portal-admin?err=" + encodeURIComponent("No se pudo borrar porque tiene otros registros (consultas, reuniones…). Bloqueala.") + "#nuevas") }
    await audit(u, "portal_cuenta_borrada", "db_contacto", cid)
    redirect("/portal-admin?borr=1#nuevas")
  }
  redirect("/portal-admin#nuevas")
}

const RES: Record<string, string> = { enviado: "Código enviado", pendiente: "Pendiente", bloqueado: "Bloqueado", limite: "Límite (email o IP)", error: "Error de envío" }
const RES_C: Record<string, string> = { enviado: "bg-emerald-50 text-emerald-700", pendiente: "bg-amber-50 text-amber-700", bloqueado: "bg-slate-100 text-slate-700", limite: "bg-slate-100 text-slate-600", error: "bg-red-50 text-rojo" }

export default async function PortalAdmin({ searchParams }: { searchParams: { ok?: string; hab?: string; err?: string; fok?: string; borr?: string } }) {
  const u = await requerir(["gerente", "coordinacion"])
  const [pol, dias, transf, emp, facturas, pendientes, ultimos, clientes, nuevas] = await Promise.all([
    politica(), diasBloqueo(), config("datos_transferencia", ""), empresa(),
    q<any>(`select b.*, to_char(b.factura_pedida_en at time zone 'America/Argentina/Buenos_Aires','DD/MM HH24:MI') pedida, k.nombre, k.organizacion, k.email, p.nombre proyecto
            from db_cobros b join db_contactos k on k.id=b.contacto_id left join db_proyectos p on p.id=b.proyecto_id
            where b.factura_estado='pedida' and b.estado<>'anulado' order by b.factura_pedida_en`),
    q<any>(`select distinct on (lower(s.email)) s.id, s.email, s.detalle, s.creado, c.nombre, c.id contacto_id from portal_solicitudes s left join db_contactos c on c.id=s.contacto_id
            where s.resultado='pendiente' and s.resuelta is null order by lower(s.email), s.creado desc`),
    q<any>("select s.*, c.nombre from portal_solicitudes s left join db_contactos c on c.id=s.contacto_id order by s.creado desc limit 25"),
    q<any>(`select c.id, c.nombre, c.organizacion, c.email, c.portal_acceso, c.portal_ultimo,
              (select count(*)::int from db_proyectos p where p.contacto_id=c.id and p.estado<>'cancelado') proyectos,
              (select count(*)::int from am_inscripciones i where i.contacto_id=c.id and i.estado<>'baja') cursos,
              (select max(((now() at time zone 'America/Argentina/Buenos_Aires')::date - b.vence)) from db_cobros b where b.contacto_id=c.id and b.estado='pendiente') atraso,
              (select string_agg(m || ' ' || t, ' + ') from (select b.moneda m, sum(b.monto)::text t from db_cobros b where b.contacto_id=c.id and b.estado='pendiente' and b.vence < (now() at time zone 'America/Argentina/Buenos_Aires')::date group by b.moneda) x) vencido
            from db_contactos c
            where c.portal_acceso<>'auto' or c.portal_ultimo is not null
               or exists (select 1 from db_proyectos p where p.contacto_id=c.id and p.estado<>'cancelado')
               or exists (select 1 from db_cobros b where b.contacto_id=c.id and b.estado='pendiente')
            order by (select max(((now() at time zone 'America/Argentina/Buenos_Aires')::date - b.vence)) from db_cobros b where b.contacto_id=c.id and b.estado='pendiente') desc nulls last, c.portal_ultimo desc nulls last limit 200`),
    q<any>(`select c.id, c.nombre, c.email, c.clase, c.portal_acceso, c.portal_ultimo, c.creado from db_contactos c
            where c.fuente='portal' and c.creado > now() - interval '30 days' order by c.creado desc limit 100`),
  ])
  const estadoDe = (c: any) => c.portal_acceso === "bloqueado" ? { t: "Bloqueado a mano", k: "bg-slate-800 text-white" }
    : c.portal_acceso !== "habilitado" && dias > 0 && (c.atraso ?? 0) > dias ? { t: `Suspendido por deuda (${c.atraso} días)`, k: "bg-red-50 text-rojo" }
    : c.portal_acceso === "habilitado" ? { t: "Habilitado a mano", k: "bg-emerald-50 text-emerald-700" } : { t: "Activo", k: "bg-sky-50 text-sky-700" }
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div><h1 className="m-0">Portal y accesos</h1><p className="m-0 text-sm text-[#4A515C]">Quién entra a <a href={urlPortal()} target="_blank" rel="noopener noreferrer" className="underline">la cuenta de clientes y alumnos</a>, pedidos pendientes, bloqueos y deuda.</p></div>
      </div>
      {searchParams.ok && <p role="status" className="m-0 text-sm text-emerald-700">Configuración guardada.</p>}
      {searchParams.hab && <p role="status" className="m-0 text-sm text-emerald-700">Habilitado. Le mandamos la invitación por email.</p>}
      {searchParams.err && <p role="alert" className="m-0 text-sm text-rojo">{searchParams.err}</p>}

      {searchParams.borr && <p role="status" className="m-0 text-sm text-emerald-700">Cuenta borrada.</p>}
      {searchParams.fok && <p role="status" className="m-0 text-sm text-emerald-700">Factura cargada y enviada al cliente.</p>}
      {(!emp.cuit || !emp.iva) && <p role="alert" className="m-0 card py-3 text-sm !bg-amber-50 !border-amber-200">Faltan el CUIT y la condición de IVA de DEVISEBIT para los comprobantes y para sugerir el tipo de factura. <a href="#empresa" className="underline font-semibold">Cargarlos</a></p>}

      <section id="facturas" className="card flex flex-col gap-3" aria-labelledby="t-fac">
        <h2 id="t-fac" className="m-0 text-base">Facturas pedidas para emitir ({facturas.length})</h2>
        {!facturas.length && <p className="m-0 text-sm text-[#4A515C]">No hay pedidos de factura.</p>}
        {facturas.map((f) => (
          <form key={f.id} action={facturar} className="rounded-xl border border-[#E2E5EA] p-3 grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-3">
            <input type="hidden" name="cobro" value={f.id} />
            <div className="text-sm">
              <strong className="block">Factura {f.factura_tipo ?? "(tipo a definir)"} · {plata(f.monto, f.moneda)}</strong>
              <span className="block">{f.concepto}{f.proyecto ? ` · ${f.proyecto}` : ""} · {f.estado === "pagado" ? "pagado" : "pendiente de pago"}</span>
              <span className="block text-xs text-[#4A515C] mt-1">Para: <strong className="text-[#0E1116]">{f.factura_datos?.razon}</strong> · {f.factura_datos?.doc_tipo} {f.factura_datos?.doc_tipo === "DNI" ? f.factura_datos?.doc : formatoCuit(f.factura_datos?.doc ?? "")} · {f.factura_datos?.iva} · {f.factura_datos?.domicilio}{f.factura_datos?.email ? ` · ${f.factura_datos.email}` : ""}</span>
              <span className="block text-xs text-[#4A515C]">Pedida {f.pedida} por <Link href={`/contactos/${f.contacto_id}`} className="underline">{f.organizacion ?? f.nombre}</Link></span>
            </div>
            <div className="flex flex-wrap gap-2 items-end content-start">
              <select name="tipo" defaultValue={f.factura_tipo ?? ""} className="inp py-1.5 w-20" aria-label="Tipo"><option value="">Tipo</option><option>A</option><option>B</option><option>C</option></select>
              <input name="nro" required placeholder="N° 0001-00000123" className="inp py-1.5 flex-1 min-w-[140px]" aria-label="Número de factura" />
              <input name="url" type="url" required placeholder="Link al PDF (Drive, ARCA…)" className="inp py-1.5 w-full" aria-label="Link al PDF" />
              <button className="btn-p py-1.5">Cargar y enviar al cliente</button>
            </div>
          </form>
        ))}
        <p className="m-0 text-xs text-[#4A515C]">La factura se emite en ARCA (factura electrónica) y acá se carga el número y el link al PDF: le llega al cliente por email y queda para descargar en su cuenta.</p>
      </section>

      <section className="card flex flex-col gap-3" aria-labelledby="t-pend">
        <h2 id="t-pend" className="m-0 text-base">Pedidos de acceso para validar ({pendientes.length})</h2>
        {!pendientes.length && <p className="m-0 text-sm text-[#4A515C]">No hay pedidos pendientes.</p>}
        {pendientes.map((s) => (
          <form key={s.id} action={resolver} className="flex flex-wrap items-center gap-3 rounded-xl border border-[#E2E5EA] p-3">
            <input type="hidden" name="id" value={s.id} />
            <span className="flex-1 min-w-[220px]"><strong className="block text-sm">{s.email}</strong><span className="text-xs text-[#4A515C]">{s.nombre ? <Link href={`/contactos/${s.contacto_id}`} className="underline">{s.nombre}</Link> : "No está en Contactos"} · {s.detalle} · {fecha(s.creado)}</span></span>
            <button name="op" value="habilitar" className="btn-p py-1.5">Habilitar y mandar acceso</button>
            <button name="op" value="rechazar" className="btn-s py-1.5">Rechazar</button>
          </form>
        ))}
      </section>

      <section id="nuevas" className="card flex flex-col gap-3" aria-labelledby="t-nue">
        <div>
          <h2 id="t-nue" className="m-0 text-base">Cuentas creadas solas (últimos 30 días): {nuevas.length}</h2>
          <p className="m-0 text-xs text-[#4A515C]">Con el ingreso libre, quien pone su email entra y queda en Contactos («Por clasificar», origen portal). Si alguna no corresponde, bloqueala (deja de entrar al instante, aunque tenga la sesión abierta) o borrala si todavía no tiene nada asociado.</p>
        </div>
        {!nuevas.length && <p className="m-0 text-sm text-[#4A515C]">No hay cuentas nuevas.</p>}
        {nuevas.map((n) => (
          <form key={n.id} action={cuentaNueva} className="flex flex-wrap items-center gap-3 rounded-xl border border-[#E2E5EA] p-3">
            <input type="hidden" name="contacto" value={n.id} />
            <span className="flex-1 min-w-[220px]"><Link href={`/contactos/${n.id}`} className="block text-sm font-semibold hover:underline">{n.email}</Link><span className="text-xs text-[#4A515C]">Creada {fecha(n.creado)} · {n.portal_ultimo ? `último ingreso ${fecha(n.portal_ultimo)}` : "todavía no entró"} · {n.clase ? `lista: ${n.clase}` : "Por clasificar"}</span></span>
            {n.portal_acceso === "bloqueado" ? <span className="chip bg-slate-800 text-white">Bloqueada</span> : <button name="op" value="bloquear" className="btn-s py-1.5">Bloquear</button>}
            <button name="op" value="borrar" className="btn-s py-1.5 text-rojo">Borrar</button>
          </form>
        ))}
      </section>

      <section id="clientes" className="card flex flex-col gap-3 overflow-x-auto" aria-labelledby="t-cli">
        <h2 id="t-cli" className="m-0 text-base">Clientes y alumnos</h2>
        <table className="tbl">
          <thead><tr><th>Contacto</th><th>Tiene</th><th>Vencido</th><th>Estado</th><th>Último ingreso</th><th>Acceso</th></tr></thead>
          <tbody>
            {clientes.map((c) => {
              const e = estadoDe(c)
              return (
                <tr key={c.id}>
                  <td><Link href={`/contactos/${c.id}`} className="font-semibold hover:underline">{c.organizacion ?? c.nombre}</Link><span className="block text-xs text-[#4A515C]">{c.organizacion ? `${c.nombre} · ` : ""}{c.email ?? "sin email"}</span></td>
                  <td className="text-xs">{c.proyectos ? `${c.proyectos} proy.` : ""}{c.proyectos && c.cursos ? " · " : ""}{c.cursos ? `${c.cursos} cursos` : ""}</td>
                  <td className={c.vencido ? "text-rojo font-semibold text-xs" : "text-xs text-[#4A515C]"}>{c.vencido ? c.vencido.split(" + ").map((x: string) => { const [m, v] = x.split(" "); return plata(v, m) }).join(" + ") : "—"}</td>
                  <td><span className={`chip ${e.k}`}>{e.t}</span></td>
                  <td className="text-xs">{c.portal_ultimo ? fecha(c.portal_ultimo) : "Nunca"}</td>
                  <td>
                    <form action={acceso} className="flex gap-1">
                      <input type="hidden" name="contacto" value={c.id} />
                      <select name="acceso" defaultValue={c.portal_acceso} className="inp py-1 text-sm w-auto" aria-label={`Acceso de ${c.nombre}`}>
                        <option value="auto">Automático</option><option value="habilitado">Habilitar siempre</option><option value="bloqueado">Bloquear</option>
                      </select>
                      <button className="btn-s py-1 text-xs">OK</button>
                    </form>
                  </td>
                </tr>
              )
            })}
            {!clientes.length && <tr><td colSpan={6} className="text-[#4A515C]">Todavía no hay clientes con proyectos, cobros o ingresos.</td></tr>}
          </tbody>
        </table>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <form action={guardar} className="card flex flex-col gap-3" aria-labelledby="t-reg">
          <h2 id="t-reg" className="m-0 text-base">Reglas</h2>
          <fieldset className="m-0 p-0 border-0 flex flex-col gap-2" disabled={u.rol !== "gerente"}>
            <legend className="text-sm font-semibold mb-1">¿Quién puede entrar a Mi cuenta (portal y Academia)?</legend>
            {POLITICAS.map((p) => (
              <label key={p.v} className="flex gap-2 items-start text-sm rounded-xl border border-[#E2E5EA] p-3 has-[:checked]:border-[#C8231F] has-[:checked]:bg-[#FDECEB]">
                <input type="radio" name="politica" value={p.v} defaultChecked={pol === p.v} className="mt-1" />
                <span><strong className="block">{p.n}</strong><span className="text-xs text-[#4A515C]">{p.d}</span></span>
              </label>
            ))}
            <label className="lbl">Suspender el acceso con pagos vencidos hace más de (días)<input name="dias" type="number" min={0} max={365} defaultValue={dias} className="inp" /><span className="text-xs font-normal text-[#4A515C]">0 = nunca automático. Con deuda, el cliente solo ve su estado de cuenta y puede pagar; se reactiva solo al acreditarse.</span></label>
            <label className="lbl">Datos para transferencia (los ve el cliente en Pagos)<textarea name="transferencia" rows={4} defaultValue={transf} className="inp" placeholder={"Banco … · CBU …\nAlias … · CUIT …\nTitular DEVISEBIT SRL"} /></label>
            <button className="btn-p">Guardar reglas</button>
          </fieldset>
          {u.rol !== "gerente" && <p className="m-0 text-xs text-[#4A515C]">Solo Dirección puede cambiar las reglas.</p>}
        </form>

        <section className="card flex flex-col gap-2" aria-labelledby="t-log">
          <h2 id="t-log" className="m-0 text-base">Últimos pedidos de ingreso</h2>
          <p className="m-0 text-xs text-[#4A515C]">Si alguien dice que no le llegó el email, acá ves qué pasó.</p>
          <ul className="m-0 p-0 list-none flex flex-col">
            {ultimos.map((s) => (
              <li key={s.id} className="flex items-center gap-2 py-2 border-b border-[#EEF0F3] last:border-0 text-sm">
                <span className="flex-1 min-w-0"><span className="block truncate font-semibold">{s.email}</span><span className="text-xs text-[#4A515C]">{new Date(s.creado).toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", hourCycle: "h23" })}{s.detalle ? ` · ${s.detalle}` : ""}{s.resuelta ? ` · ${s.resuelta}` : ""}</span></span>
                <span className={`chip ${RES_C[s.resultado] ?? ""}`}>{RES[s.resultado] ?? s.resultado}</span>
              </li>
            ))}
            {!ultimos.length && <li className="text-sm text-[#4A515C]">Sin pedidos todavía.</li>}
          </ul>
        </section>
      </div>
      <form id="empresa" action={datosEmpresa} className="card flex flex-col gap-3" aria-labelledby="t-emp">
        <h2 id="t-emp" className="m-0 text-base">Datos de DEVISEBIT para comprobantes</h2>
        <fieldset className="m-0 p-0 border-0 grid grid-cols-1 md:grid-cols-3 gap-3" disabled={u.rol !== "gerente"}>
          <label className="lbl">Razón social<input name="razon" defaultValue={emp.razon} className="inp" /></label>
          <label className="lbl">CUIT<input name="cuit" defaultValue={emp.cuit ? formatoCuit(emp.cuit) : ""} inputMode="numeric" className="inp" placeholder="30-12345678-9" /></label>
          <label className="lbl">Condición frente al IVA<select name="iva" defaultValue={emp.iva} className="inp"><option value="">Elegí…</option>{CONDICIONES_IVA.filter((x) => x !== "Consumidor Final").map((x) => <option key={x}>{x}</option>)}</select></label>
          <label className="lbl md:col-span-3">Domicilio comercial<input name="domicilio" defaultValue={emp.domicilio} className="inp" /></label>
          <label className="lbl">Ingresos Brutos<input name="iibb" defaultValue={emp.iibb} className="inp" /></label>
          <label className="lbl">Inicio de actividades<input name="inicio" defaultValue={emp.inicio} className="inp" placeholder="01/01/2009" /></label>
          <div className="flex items-end"><button className="btn-p w-full">Guardar datos</button></div>
        </fieldset>
        <p className="m-0 text-xs text-[#4A515C]">Salen en cada comprobante de pago. Con la condición de IVA, el sistema sugiere el tipo de factura según el cliente: Responsable Inscripto emite A a inscriptos y monotributistas y B al resto; Monotributo emite C.</p>
      </form>
    </div>
  )
}
