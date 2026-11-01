import Link from "next/link"
import { notFound } from "next/navigation"
import { requerir } from "@/lib/auth"
import { plantilla, CAMPOS } from "@/lib/legales-plantillas"
import EditorLegal from "@/components/EditorLegal"

export const dynamic = "force-dynamic"

export default async function Modelo({ params }: { params: { k: string } }) {
  await requerir(["gerente", "coordinacion"])
  const p = plantilla(params.k)
  if (!p) notFound()
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2"><Link href="/legales/plantillas" className="text-sm underline text-[var(--gris)]">← Modelos</Link><h1 className="m-0 text-xl">{p.titulo}</h1></div>
      <EditorLegal titulo={p.titulo} cuerpo={p.cuerpo} campos={CAMPOS} />
    </div>
  )
}
