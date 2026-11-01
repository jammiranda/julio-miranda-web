import { requerir } from "@/lib/auth"
import { PIEZAS } from "@/lib/piezas"
import PiezaCard from "@/components/PiezaCard"

export const dynamic = "force-dynamic"

export default async function Piezas() {
  await requerir(["gerente", "coordinacion", "profesional"])
  const feed = PIEZAS.filter((p) => p.formato === "feed")
  const hist = PIEZAS.filter((p) => p.formato === "historia")
  return (
    <div className="flex flex-col gap-6">
      <header className="pag-cab">
        <div><div className="eyebrow">Comunicación</div><h1 className="m-0">Piezas para redes</h1><p>Listas para usar a mano desde el celular: tocá <b>Compartir</b> para mandarlas directo a Instagram, Facebook o LinkedIn, o <b>Descargar</b>. Abajo de cada una está el texto para copiar, en español e inglés.</p></div>
      </header>
      <section className="flex flex-col gap-3">
        <h2 className="m-0 text-lg font-bold">Feed ({feed.length})</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{feed.map((p) => <PiezaCard key={p.id} p={p} />)}</div>
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="m-0 text-lg font-bold">Historias ({hist.length})</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{hist.map((p) => <PiezaCard key={p.id} p={p} />)}</div>
      </section>
    </div>
  )
}
