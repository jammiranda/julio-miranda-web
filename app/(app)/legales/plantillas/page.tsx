import Link from "next/link"
import { requerir } from "@/lib/auth"
import { PLANTILLAS } from "@/lib/legales-plantillas"

export const dynamic = "force-dynamic"

export default async function Plantillas() {
  await requerir(["gerente", "coordinacion"])
  return (
    <div className="flex flex-col gap-5">
      <header className="pag-cab">
        <div><div className="eyebrow">Legales</div><h1 className="m-0">Modelos listos para enviar</h1><p>Documentación base de cada servicio, ya con los datos y la firma de DEVISEBIT. Completás los datos del cliente, editás lo que haga falta y lo descargás en Word o lo guardás en PDF.</p></div>
        <div className="pag-acc"><Link href="/legales" className="btn-s">Contratos y vencimientos</Link></div>
      </header>
      <ul className="m-0 p-0 list-none grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {PLANTILLAS.map((p) => (
          <li key={p.k} className="card flex flex-col gap-2">
            <h2 className="m-0 text-base">{p.titulo}</h2>
            <p className="m-0 text-sm text-[var(--gris)]">{p.para}</p>
            <Link href={`/legales/plantillas/${p.k}`} className="btn-p self-start mt-auto">Completar y editar</Link>
          </li>
        ))}
      </ul>
      <p className="m-0 text-xs text-[var(--gris)]">Son modelos de partida. Antes de firmar algo con plata o responsabilidad en juego, que lo revise el abogado, y cargá el CUIT de DEVISEBIT y el cargo de la firma una sola vez para que queden en todos los documentos.</p>
    </div>
  )
}
