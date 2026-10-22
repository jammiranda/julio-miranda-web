import { redirect } from "next/navigation"
import { requerir } from "@/lib/auth"
import { one, audit } from "@/lib/db"
import { CAMPOS, valores } from "@/lib/paciente"
import FormPaciente from "@/components/FormPaciente"

async function crear(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const vals = valores(fd)
  const r = await one<{ id: number }>(`insert into pacientes(${CAMPOS.join(",")}) values (${CAMPOS.map((_, i) => "$" + (i + 1)).join(",")}) returning id`, vals)
  await audit(u, "alta_paciente", "paciente", r!.id)
  redirect(`/pacientes/${r!.id}`)
}

export default async function Nuevo() {
  await requerir(["gerente", "coordinacion"])
  return (
    <form action={crear} className="flex flex-col gap-4">
      <h1 className="m-0">Nuevo paciente</h1>
      <div className="card"><FormPaciente /></div>
      <div className="flex gap-2"><button className="btn-p">Guardar paciente</button><a href="/pacientes" className="btn-s">Cancelar</a></div>
    </form>
  )
}
