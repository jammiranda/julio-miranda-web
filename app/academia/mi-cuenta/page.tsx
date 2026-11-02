import { q } from "@/lib/db"
import { requerirAlumno } from "@/lib/portal"
import { misInscripciones, proximasClasesDe, comprasDe } from "@/lib/cursos"
import { salirCuenta } from "@/lib/ingreso"
import { InicioAlumno } from "@/components/aula/AulaAcademia"

export const dynamic = "force-dynamic"

/** Inicio del alumno en ACADEMIA DEVISEBIT: sus cursos con avance, próximas clases, certificados y lo que compró. */
export default async function MiCuentaAcademia() {
  const c = await requerirAlumno()
  const [ins, clases, compras] = await Promise.all([misInscripciones(c.id), proximasClasesDe(c.id), comprasDe(c.email)])
  const otros = await q<any>(
    `select slug, titulo, imagen, bajada, modalidad, horas, precio from am_cursos where estado='publicado'
       and id not in (select e.curso_id from am_inscripciones i join am_ediciones e on e.id=i.edicion_id where i.contacto_id=$1 and i.estado<>'baja')
     order by destacado desc, creado desc limit 3`, [c.id])
  
  return <InicioAlumno nombre={c.nombre} ins={ins} clases={clases} compras={compras} otros={otros} salir={<form action={salirCuenta}><input type="hidden" name="sitio" value="academia" /><button className="btn-s">Salir</button></form>} />
}
