import { q, one } from "./db"
import type { Usuario } from "./auth"

/** Definición de qué se puede importar/exportar en cada módulo. */
export type Entidad = "pacientes" | "ordenes" | "visitas" | "profesionales" | "consultas" | "historia"

type Col = { k: string; n: string; sin: string[] }
const norm = (x: unknown) => String(x ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "")

export const ENTIDADES: Record<Entidad, { titulo: string; roles: Usuario["rol"][]; importa: boolean; cols: Col[]; sql: string }> = {
  pacientes: {
    titulo: "Pacientes", roles: ["gerente", "coordinacion"], importa: true,
    cols: [
      { k: "apellido_nombre", n: "Apellido y nombre", sin: ["apellidoynombre", "paciente", "nombre", "afiliado", "nombreyapellido", "apellidonombre"] },
      { k: "dni", n: "DNI", sin: ["dni", "documento", "nrodocumento"] },
      { k: "obra_social", n: "Obra social", sin: ["obrasocial", "cobertura", "os"] },
      { k: "nro_afiliado", n: "N.º afiliado", sin: ["nroafiliado", "numeroafiliado", "beneficio", "nrobeneficio", "afiliadonro"] },
      { k: "fecha_nac", n: "Fecha nacimiento", sin: ["fechanac", "fechanacimiento", "nacimiento", "fnac"] },
      { k: "domicilio", n: "Domicilio", sin: ["domicilio", "direccion"] },
      { k: "localidad", n: "Localidad", sin: ["localidad", "ciudad"] },
      { k: "telefono", n: "Teléfono", sin: ["telefono", "tel", "celular"] },
      { k: "contacto_familiar", n: "Contacto familiar", sin: ["contactofamiliar", "familiar", "contacto"] },
      { k: "tel_familiar", n: "Tel. familiar", sin: ["telfamiliar", "telefonofamiliar"] },
      { k: "diagnostico", n: "Diagnóstico", sin: ["diagnostico", "dx", "patologia"] },
      { k: "medico_cabecera", n: "Médico de cabecera", sin: ["medicocabecera", "medico", "medicodecabecera"] },
      { k: "estado", n: "Estado", sin: ["estado"] },
      { k: "notas", n: "Notas", sin: ["notas", "observaciones", "obs"] },
    ],
    sql: "select apellido_nombre, dni, obra_social, nro_afiliado, fecha_nac, domicilio, localidad, telefono, contacto_familiar, tel_familiar, diagnostico, medico_cabecera, estado, notas from pacientes order by apellido_nombre",
  },
  ordenes: {
    titulo: "Órdenes de prestación (OP)", roles: ["gerente", "coordinacion"], importa: true,
    cols: [
      { k: "paciente", n: "Paciente", sin: ["paciente", "apellidoynombre", "afiliado", "nombre"] },
      { k: "dni", n: "DNI", sin: ["dni", "documento"] },
      { k: "nro_op", n: "N.º OP", sin: ["nroop", "op", "orden", "numeroop", "ordendeprestacion"] },
      { k: "modulo", n: "Módulo", sin: ["modulo", "mod"] },
      { k: "fecha_inicio", n: "Inicio", sin: ["fechainicio", "inicio", "desde", "emision", "fechaemision"] },
      { k: "fecha_vencimiento", n: "Vencimiento", sin: ["fechavencimiento", "vencimiento", "vence", "hasta"] },
      { k: "estado", n: "Estado", sin: ["estado"] },
    ],
    sql: "select p.apellido_nombre paciente, p.dni, o.nro_op, o.modulo, o.fecha_inicio, o.fecha_vencimiento, o.estado from ordenes o join pacientes p on p.id=o.paciente_id order by p.apellido_nombre, o.fecha_inicio desc",
  },
  visitas: {
    titulo: "Visitas", roles: ["gerente", "coordinacion"], importa: true,
    cols: [
      { k: "fecha", n: "Fecha", sin: ["fecha", "dia"] },
      { k: "paciente", n: "Paciente", sin: ["paciente", "apellidoynombre", "afiliado", "nombre"] },
      { k: "dni", n: "DNI", sin: ["dni", "documento"] },
      { k: "tipo", n: "Tipo", sin: ["tipo", "prestacion", "especialidad"] },
      { k: "profesional", n: "Profesional", sin: ["profesional", "prestador"] },
      { k: "estado", n: "Estado", sin: ["estado"] },
      { k: "app_pami", n: "APP PAMI", sin: ["apppami", "app", "registradoapp"] },
      { k: "evolucion", n: "Evolución", sin: ["evolucion", "observaciones", "notas"] },
    ],
    sql: "select v.fecha, p.apellido_nombre paciente, p.dni, v.tipo, pr.nombre profesional, v.estado, case when v.app_pami then 'Sí' else 'No' end app_pami, v.evolucion from visitas v join pacientes p on p.id=v.paciente_id left join profesionales pr on pr.id=v.profesional_id order by v.fecha desc",
  },
  profesionales: {
    titulo: "Profesionales", roles: ["gerente", "coordinacion"], importa: true,
    cols: [
      { k: "nombre", n: "Nombre", sin: ["nombre", "apellidoynombre", "profesional"] },
      { k: "especialidad", n: "Especialidad", sin: ["especialidad", "tipo", "profesion"] },
      { k: "matricula", n: "Matrícula", sin: ["matricula", "mp", "mn"] },
      { k: "telefono", n: "Teléfono", sin: ["telefono", "tel", "celular"] },
      { k: "localidad", n: "Localidad", sin: ["localidad", "zona", "ciudad"] },
    ],
    sql: "select nombre, especialidad, matricula, telefono, localidad, case when activo then 'Sí' else 'No' end activo from profesionales order by nombre",
  },
  consultas: {
    titulo: "Consultas", roles: ["gerente", "coordinacion"], importa: true,
    cols: [
      { k: "creado", n: "Fecha", sin: ["fecha", "creado", "entro"] },
      { k: "canal", n: "Canal", sin: ["canal", "origen", "medio"] },
      { k: "nombre", n: "Quién consulta", sin: ["nombre", "quienconsulta", "contacto"] },
      { k: "telefono", n: "Teléfono", sin: ["telefono", "tel", "celular", "whatsapp"] },
      { k: "paciente_nombre", n: "Paciente", sin: ["paciente", "pacientenombre"] },
      { k: "obra_social", n: "Cobertura", sin: ["obrasocial", "cobertura"] },
      { k: "localidad", n: "Localidad", sin: ["localidad", "ciudad"] },
      { k: "motivo", n: "Motivo", sin: ["motivo", "servicio"] },
      { k: "mensaje", n: "Mensaje", sin: ["mensaje", "detalle", "consulta"] },
      { k: "estado", n: "Estado", sin: ["estado"] },
      { k: "asignado", n: "Responsable", sin: ["responsable", "asignado"] },
      { k: "notas", n: "Notas", sin: ["notas", "observaciones"] },
    ],
    sql: "select creado, canal, nombre, telefono, paciente_nombre, obra_social, localidad, motivo, mensaje, estado, asignado, notas from consultas where empresa='sanpatricio' order by creado desc",
  },
  historia: {
    titulo: "Historia clínica", roles: ["gerente"], importa: false,
    cols: [],
    sql: "select p.apellido_nombre paciente, p.dni, h.fecha, h.tipo, h.profesional, h.texto, h.creado_por_nombre cargado_por, h.creado, case when h.anulado then 'ANULADO: '||coalesce(h.anulado_motivo,'') else '' end anulado from hc_registros h join pacientes p on p.id=h.paciente_id order by p.apellido_nombre, h.fecha",
  },
}

/** Busca la fila de encabezados y arma el mapa columna→índice. */
export function mapear(ent: Entidad, filas: unknown[][]) {
  const cols = ENTIDADES[ent].cols
  for (let i = 0; i < Math.min(filas.length, 15); i++) {
    const h = (filas[i] ?? []).map(norm)
    const m: Record<string, number> = {}
    for (const c of cols) {
      const j = h.findIndex((x) => x && c.sin.includes(x))
      if (j >= 0) m[c.k] = j
    }
    if (Object.keys(m).length >= 2 || (Object.keys(m).length === 1 && cols.length <= 2)) return { fila: i, m }
  }
  return null
}

function fechaISO(v: unknown): string | null {
  const t = String(v ?? "").trim()
  if (!t) return null
  let m = t.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/)
  if (m) { const y = m[3].length === 2 ? "20" + m[3] : m[3]; return `${y}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` }
  m = t.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return `${m[1]}-${m[2]}-${m[3]}`
  if (/^\d{5}$/.test(t)) { const d = new Date(Date.UTC(1899, 11, 30) + Number(t) * 864e5); return d.toISOString().slice(0, 10) }
  return null
}
const txt = (v: unknown) => { const t = String(v ?? "").trim(); return t ? t : null }
const TIPO: Record<string, string> = { enfermeria: "enfermeria", enf: "enfermeria", kinesiologia: "kinesiologia", kine: "kinesiologia", kin: "kinesiologia", medico: "medico", med: "medico", medica: "medico", fonoaudiologia: "fonoaudiologia", fono: "fonoaudiologia", cuidador: "cuidador" }

async function pacienteId(nombre: string | null, dni: string | null) {
  if (dni) { const r = await one<{ id: number }>("select id from pacientes where regexp_replace(dni,'\\D','','g')=regexp_replace($1,'\\D','','g') limit 1", [dni]); if (r) return r.id }
  if (nombre) { const r = await one<{ id: number }>("select id from pacientes where upper(apellido_nombre)=upper($1) limit 1", [nombre.trim()]); if (r) return r.id }
  return null
}

/** Importa filas ya leídas del Excel/CSV. Devuelve cuántas se crearon, actualizaron u omitieron. */
export async function importar(ent: Entidad, filas: unknown[][]) {
  const mp = mapear(ent, filas)
  if (!mp) throw new Error("No reconocí los encabezados. La primera fila tiene que tener los nombres de las columnas (por ejemplo: Paciente, DNI, Localidad).")
  const g = (row: unknown[], k: string) => (mp.m[k] != null ? row[mp.m[k]] : undefined)
  let creados = 0, actualizados = 0, omitidos = 0
  const errores: string[] = []
  for (const row of filas.slice(mp.fila + 1)) {
    if (!row || row.every((x) => !String(x ?? "").trim())) continue
    try {
      if (ent === "pacientes") {
        const nombre = txt(g(row, "apellido_nombre"))?.toUpperCase() ?? null
        if (!nombre) { omitidos++; continue }
        const v = { dni: txt(g(row, "dni")), obra_social: txt(g(row, "obra_social")), nro_afiliado: txt(g(row, "nro_afiliado")), fecha_nac: fechaISO(g(row, "fecha_nac")), domicilio: txt(g(row, "domicilio")), localidad: txt(g(row, "localidad")), telefono: txt(g(row, "telefono")), contacto_familiar: txt(g(row, "contacto_familiar")), tel_familiar: txt(g(row, "tel_familiar")), diagnostico: txt(g(row, "diagnostico")), medico_cabecera: txt(g(row, "medico_cabecera")), notas: txt(g(row, "notas")) }
        let estado = txt(g(row, "estado"))?.toLowerCase() ?? null
        if (estado && !["activo", "alta", "fallecido", "suspendido"].includes(estado)) estado = null
        const id = await pacienteId(nombre, v.dni)
        const ks = Object.keys(v) as (keyof typeof v)[]
        if (id) {
          await q(`update pacientes set ${ks.map((k, i) => `${k}=coalesce($${i + 1},${k})`).join(",")}, estado=coalesce($${ks.length + 1},estado) where id=$${ks.length + 2}`, [...ks.map((k) => v[k]), estado, id])
          actualizados++
        } else {
          await q(`insert into pacientes(apellido_nombre,${ks.join(",")},estado) values ($1,${ks.map((_, i) => `$${i + 2}`).join(",")},$${ks.length + 2})`, [nombre, ...ks.map((k) => k === "obra_social" ? v[k] ?? "PAMI" : v[k]), estado ?? "activo"])
          creados++
        }
      } else if (ent === "profesionales") {
        const nombre = txt(g(row, "nombre"))
        if (!nombre) { omitidos++; continue }
        const ex = await one<{ id: number }>("select id from profesionales where upper(nombre)=upper($1)", [nombre])
        const v = [txt(g(row, "especialidad")), txt(g(row, "matricula")), txt(g(row, "telefono")), txt(g(row, "localidad"))]
        if (ex) { await q("update profesionales set especialidad=coalesce($1,especialidad), matricula=coalesce($2,matricula), telefono=coalesce($3,telefono), localidad=coalesce($4,localidad) where id=$5", [...v, ex.id]); actualizados++ }
        else { await q("insert into profesionales(nombre,especialidad,matricula,telefono,localidad) values ($1,coalesce($2,'Enfermería'),$3,$4,$5)", [nombre, ...v]); creados++ }
      } else if (ent === "consultas") {
        const nombre = txt(g(row, "nombre")), tel = txt(g(row, "telefono"))
        if (!nombre && !tel) { omitidos++; continue }
        let estado = txt(g(row, "estado"))?.toLowerCase() ?? "nueva"
        if (!["nueva", "contactada", "evaluacion", "ingreso", "descartada"].includes(estado)) estado = "nueva"
        await q("insert into consultas(creado,canal,nombre,telefono,paciente_nombre,obra_social,localidad,motivo,mensaje,estado,asignado,notas) values (coalesce($1::timestamptz,now()),coalesce($2,'otro'),$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)",
          [fechaISO(g(row, "creado")), txt(g(row, "canal"))?.toLowerCase() ?? null, nombre, tel, txt(g(row, "paciente_nombre")), txt(g(row, "obra_social")), txt(g(row, "localidad")), txt(g(row, "motivo")), txt(g(row, "mensaje")), estado, txt(g(row, "asignado")), txt(g(row, "notas"))])
        creados++
      } else if (ent === "ordenes") {
        const pid = await pacienteId(txt(g(row, "paciente")), txt(g(row, "dni")))
        const modulo = txt(g(row, "modulo"))?.toUpperCase() ?? null, ini = fechaISO(g(row, "fecha_inicio"))
        if (!pid || !modulo || !ini) { omitidos++; errores.push(`${txt(g(row, "paciente")) ?? "?"}: falta paciente existente, módulo o inicio`); continue }
        const nro = txt(g(row, "nro_op"))
        const ex = nro ? await one<{ id: number }>("select id from ordenes where paciente_id=$1 and nro_op=$2", [pid, nro]) : null
        let estado = txt(g(row, "estado"))?.toLowerCase() ?? "vigente"
        if (!["vigente", "vencida", "renovada", "baja"].includes(estado)) estado = "vigente"
        if (ex) { await q("update ordenes set modulo=$1, fecha_inicio=$2, fecha_vencimiento=$3, estado=$4 where id=$5", [modulo, ini, fechaISO(g(row, "fecha_vencimiento")), estado, ex.id]); actualizados++ }
        else { await q("insert into ordenes(paciente_id,nro_op,modulo,fecha_inicio,fecha_vencimiento,estado) values ($1,$2,$3,$4,$5,$6)", [pid, nro, modulo, ini, fechaISO(g(row, "fecha_vencimiento")), estado]); creados++ }
      } else if (ent === "visitas") {
        const pid = await pacienteId(txt(g(row, "paciente")), txt(g(row, "dni")))
        const f = fechaISO(g(row, "fecha")), tipo = TIPO[norm(g(row, "tipo"))]
        if (!pid || !f || !tipo) { omitidos++; errores.push(`${txt(g(row, "paciente")) ?? "?"} ${f ?? ""}: falta paciente existente, fecha o tipo`); continue }
        const prof = txt(g(row, "profesional"))
        const pr = prof ? await one<{ id: number }>("select id from profesionales where upper(nombre)=upper($1)", [prof]) : null
        let estado = txt(g(row, "estado"))?.toLowerCase().replace(" ", "_") ?? "realizada"
        if (!["programada", "realizada", "no_realizada"].includes(estado)) estado = "realizada"
        const app = /^(s|si|sí|x|1|true)$/i.test(String(g(row, "app_pami") ?? "").trim())
        await q("insert into visitas(paciente_id,profesional_id,fecha,tipo,estado,app_pami,evolucion) values ($1,$2,$3,$4,$5,$6,$7)", [pid, pr?.id ?? null, f, tipo, estado, app, txt(g(row, "evolucion"))])
        creados++
      }
    } catch (e: any) {
      omitidos++
      errores.push(e?.message ?? "error")
    }
  }
  return { creados, actualizados, omitidos, errores: errores.slice(0, 20) }
}

export async function exportarCSV(ent: Entidad) {
  const rows = await q<Record<string, unknown>>(ENTIDADES[ent].sql)
  const cab = rows[0] ? Object.keys(rows[0]) : ENTIDADES[ent].cols.map((c) => c.k)
  const cel = (v: unknown) => {
    if (v == null) return ""
    const t = v instanceof Date ? (isNaN(v.getTime()) ? "" : v.toISOString().slice(0, v.getUTCHours() || v.getUTCMinutes() ? 16 : 10).replace("T", " ")) : String(v)
    return /[";\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t
  }
  return "﻿" + [cab.join(";"), ...rows.map((r) => cab.map((k) => cel(r[k])).join(";"))].join("\r\n")
}
