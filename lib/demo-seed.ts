/**
 * Datos ficticios para la demo en marca blanca (DEMO=1). Nada de esto es real:
 * nombres, documentos y teléfonos se generan al azar con una semilla fija.
 */
type Exec = (text: string, params?: unknown[]) => Promise<unknown>

const NOMBRES = ["María", "José", "Ana", "Carlos", "Rosa", "Luis", "Elena", "Jorge", "Marta", "Héctor", "Norma", "Raúl", "Silvia", "Oscar", "Graciela", "Hugo", "Teresa", "Alberto", "Beatriz", "Ricardo", "Susana", "Eduardo", "Alicia", "Roberto", "Mirta", "Juan", "Olga", "Pedro", "Nélida", "Ángel"]
const APELLIDOS = ["Gómez", "Fernández", "López", "Martínez", "Pérez", "Sosa", "Romero", "Díaz", "Álvarez", "Torres", "Ruiz", "Ramírez", "Flores", "Acosta", "Benítez", "Medina", "Herrera", "Suárez", "Aguirre", "Giménez", "Molina", "Castro", "Ortiz", "Silva", "Núñez", "Rojas", "Luna", "Juárez", "Cabrera", "Ríos"]
const ZONAS = ["Ciudad", "Zona Norte", "Zona Sur", "Zona Oeste", "Villa del Parque", "Barrio Jardín", "Los Álamos", "San Martín"]
const DIAG = ["ACV con secuela motora", "EPOC reagudizado", "Fractura de cadera operada", "Insuficiencia cardíaca", "Úlcera por presión sacra", "Diabetes tipo 2 con pie diabético", "Parkinson avanzado", "Postquirúrgico abdominal", "Cuidados paliativos oncológicos", "Demencia moderada", "Neumonía en recuperación"]
const OBRAS = ["PAMI", "PAMI", "IOMA", "OSDE", "Swiss Medical", "Galeno", "Particular"]
const MODULOS = ["A1", "A2", "A3", "B", "C"]
const PROFES: [string, string][] = [
  ["Lic. Carolina Vega", "enfermeria"], ["Lic. Pablo Herrera", "enfermeria"], ["Enf. Daniela Ríos", "enfermeria"], ["Enf. Marcos Luna", "enfermeria"],
  ["Lic. Florencia Paz", "kinesiologia"], ["Lic. Tomás Ibarra", "kinesiologia"],
  ["Dr. Gustavo Mena", "medico"], ["Dra. Lucía Salas", "medico"],
  ["Lic. Romina Gil", "fonoaudiologia"], ["Andrea Correa", "cuidador"],
]

function rnd(seed: number) {
  let s = seed
  return () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648)
}

const iso = (d: Date) => d.toISOString().slice(0, 10)

export async function sembrarDemo(x: Exec) {
  const r = rnd(20261125)
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)]
  const hoy = new Date()

  // Usuarios de la demo (sin clave: se entra por /demo)
  await x("delete from usuarios")
  await x("insert into usuarios(id,usuario,nombre,rol) values (1,'administrador','Gerencia','gerente'),(2,'coordinacion','Laura · Coordinación','coordinacion'),(3,'consulta','Martín · Consulta','consulta')")
  await x("select setval(pg_get_serial_sequence('usuarios','id'), 3)")
  // Sin clave real: nadie puede entrar por /login ni por /primer-ingreso (solo por /demo con el link personal)
  await x("update usuarios set pass_hash='sin-clave-demo'")

  // Profesionales
  for (const [n, e] of PROFES) await x("insert into profesionales(nombre,especialidad,matricula,telefono,localidad) values ($1,$2,$3,$4,$5)", [n, e, "MP " + (1000 + Math.floor(r() * 9000)), "11 " + (4000 + Math.floor(r() * 5999)) + "-" + (1000 + Math.floor(r() * 8999)), pick(ZONAS)])

  // Pacientes con orden vigente
  const N = 42
  for (let i = 0; i < N; i++) {
    const nombre = `${pick(APELLIDOS)}, ${pick(NOMBRES)}`
    const estado = i < 36 ? "activo" : i < 40 ? "alta" : "suspendido"
    const nac = new Date(1932 + Math.floor(r() * 30), Math.floor(r() * 12), 1 + Math.floor(r() * 27))
    await x(
      `insert into pacientes(apellido_nombre,dni,nro_afiliado,obra_social,fecha_nac,domicilio,localidad,telefono,contacto_familiar,tel_familiar,diagnostico,medico_cabecera,estado,antecedentes,alergias,medicacion)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
      [nombre, String(5000000 + Math.floor(r() * 9000000)), "15" + String(Math.floor(r() * 1e10)).padStart(10, "0"), pick(OBRAS), iso(nac),
        `Calle ${pick(APELLIDOS)} ${100 + Math.floor(r() * 2800)}`, pick(ZONAS), "11 " + (4000 + Math.floor(r() * 5999)) + "-" + (1000 + Math.floor(r() * 8999)),
        `${pick(NOMBRES)} (hija/o)`, "11 " + (5000 + Math.floor(r() * 4999)) + "-" + (1000 + Math.floor(r() * 8999)), pick(DIAG), "Dr. " + pick(APELLIDOS), estado,
        "HTA. Dislipemia.", r() < 0.2 ? "Penicilina" : "Sin alergias conocidas", "Enalapril 10 mg c/12 h · Omeprazol 20 mg"],
    )
    const pid = i + 1
    const ini = new Date(hoy); ini.setDate(ini.getDate() - 20 - Math.floor(r() * 150))
    const ven = new Date(hoy); ven.setDate(ven.getDate() + (i % 7 === 0 ? 4 : 10 + Math.floor(r() * 80)))
    await x("insert into ordenes(paciente_id,nro_op,modulo,fecha_inicio,fecha_vencimiento,estado,enf_mes,kin_mes,med_mes) values ($1,$2,$3,$4,$5,$6,$7,$8,1)",
      [pid, "OP-" + (300000 + Math.floor(r() * 99999)), pick(MODULOS), iso(ini), iso(ven), estado === "activo" ? "vigente" : "baja", 12 + Math.floor(r() * 10), 6 + Math.floor(r() * 6)])
  }

  // Visitas: 4 meses hacia atrás hasta hoy, más agenda de los próximos días
  const tipos: [string, number][] = [["enfermeria", 0.62], ["kinesiologia", 0.82], ["medico", 0.9], ["fonoaudiologia", 0.95], ["cuidador", 1]]
  const profPor: Record<string, number[]> = {}
  PROFES.forEach(([, e], k) => (profPor[e] ??= []).push(k + 1))
  const desde = new Date(hoy); desde.setMonth(desde.getMonth() - 3); desde.setDate(1)
  const filas: unknown[][] = []
  for (let d = new Date(desde); d <= new Date(hoy.getTime() + 6 * 864e5); d.setDate(d.getDate() + 1)) {
    if (d.getDay() === 0) continue
    const futura = d > hoy
    const cant = 14 + Math.floor(r() * 10)
    for (let k = 0; k < cant; k++) {
      const u = r()
      const tipo = tipos.find(([, p]) => u < p)![0]
      const pid = 1 + Math.floor(r() * 36)
      const estado = futura ? "programada" : r() < 0.94 ? "realizada" : "no_realizada"
      filas.push([pid, pick(profPor[tipo]), iso(d), tipo, estado, estado === "realizada" && r() < 0.9,
          estado === "realizada" ? `${110 + Math.floor(r() * 40)}/${65 + Math.floor(r() * 25)}` : null, estado === "realizada" ? String(62 + Math.floor(r() * 30)) : null,
          estado === "realizada" ? (36 + r()).toFixed(1) : null, estado === "realizada" ? String(92 + Math.floor(r() * 7)) : null,
          estado === "realizada" ? pick(["Paciente estable, buena tolerancia.", "Se realiza curación, buena evolución.", "Ejercicios de marcha asistida.", "Control de signos vitales sin novedad.", "Familia informada de pautas de cuidado."]) : null])
    }
  }
  for (let k = 0; k < filas.length; k += 150) {
    const lote = filas.slice(k, k + 150)
    const vals = lote.map((_, i) => "(" + Array.from({ length: 11 }, (_, j) => "$" + (i * 11 + j + 1)).join(",") + ")").join(",")
    await x("insert into visitas(paciente_id,profesional_id,fecha,tipo,estado,app_pami,ta,fc,temp,sat,evolucion) values " + vals, lote.flat())
  }

  // Historia clínica de algunos pacientes
  for (let pid = 1; pid <= 8; pid++) {
    await x("insert into hc_registros(paciente_id,fecha,tipo,profesional,texto,creado_por_nombre) values ($1,$2,'ingreso',$3,$4,'Gerencia')", [pid, iso(new Date(hoy.getTime() - 40 * 864e5)), "Dr. Gustavo Mena", "Ingreso a internación domiciliaria. Se define módulo y plan de cuidados con la familia."])
    await x("insert into hc_registros(paciente_id,fecha,tipo,profesional,texto,creado_por_nombre) values ($1,$2,'evolucion',$3,$4,'Laura · Coordinación')", [pid, iso(new Date(hoy.getTime() - 7 * 864e5)), "Lic. Carolina Vega", "Evolución favorable. Se mantiene plan de enfermería y kinesiología."])
  }

  // Equipamiento
  for (let pid = 1; pid <= 14; pid++) await x("insert into equipamiento(paciente_id,item,fecha_entrega) values ($1,$2,$3)", [pid, pick(["Cama ortopédica", "Colchón antiescaras", "Silla de ruedas", "Andador", "Concentrador de oxígeno"]), iso(new Date(hoy.getTime() - (5 + Math.floor(r() * 60)) * 864e5))])

  // Histórico y cierres de meses anteriores
  await x("delete from historico")
  await x("delete from cierres")
  for (let m = 3; m >= 1; m--) {
    const p = new Date(hoy.getFullYear(), hoy.getMonth() - m, 1)
    const per = `${p.getFullYear()}-${String(p.getMonth() + 1).padStart(2, "0")}`
    await x("insert into cierres(periodo,factura_real,cobra_en,cerrado) values ($1,$2,$3,true)", [per, 14000000 + Math.floor(r() * 4000000), "A los 60 días"])
  }

  // Consultas entrantes
  const motivos = ["Internación domiciliaria para mi mamá", "Kinesiología después de una operación", "Enfermería para curaciones", "Consulta por cobertura", "Quiero sumarme al equipo de enfermería", "Equipamiento: cama ortopédica"]
  const estados = ["nueva", "contactada", "evaluacion", "ingreso", "nueva", "contactada"]
  for (let k = 0; k < 6; k++) {
    await x("insert into consultas(creado,canal,nombre,telefono,paciente_nombre,obra_social,localidad,motivo,estado,empresa) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,'sanpatricio')",
      [new Date(hoy.getTime() - k * 1.7 * 864e5).toISOString(), k % 3 === 0 ? "web" : "whatsapp", `${pick(NOMBRES)} ${pick(APELLIDOS)}`, "11 " + (4000 + Math.floor(r() * 5999)) + "-" + (1000 + Math.floor(r() * 8999)), `${pick(NOMBRES)} ${pick(APELLIDOS)}`, pick(OBRAS), pick(ZONAS), motivos[k], estados[k]])
  }
}
