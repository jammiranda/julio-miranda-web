import type { Metadata } from "next"
import { precios, ars, PAGO } from "@/lib/precios"
import { fecha } from "@/lib/util"
import Imprimir from "@/components/Imprimir"
import Redes from "@/components/Redes"

export const dynamic = "force-dynamic"
export const metadata: Metadata = {
  title: "Lista de precios · DEVISEBIT",
  description: "Precios vigentes de DEVISEBIT SRL: páginas web, agentes de WhatsApp con IA, redes y anuncios, sistemas y plataformas.",
  robots: { index: false, follow: false },
}

export default async function ListaPrecios() {
  const ps = await precios(true)
  const lineas = Array.from(new Set(ps.map((p) => p.linea)))
  const ult = ps.reduce((a, p) => (p.actualizado > a ? p.actualizado : a), "")
  const wa = (t: string) => `https://wa.me/5491173466490?text=${encodeURIComponent(`Hola DEVISEBIT, me interesa ${t}`)}`
  return (
    <main className="min-h-screen bg-[#F5F6F8] print:bg-white">
      <header className="bg-[#0E1116] text-white" style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}>
        <div className="max-w-5xl mx-auto px-5 py-10">
          <div className="flex items-center justify-between gap-3">
            <a href="https://www.devisebit.com" className="text-xl font-extrabold tracking-[0.04em] text-white no-underline">DEVISE<span className="text-[#FF6A63]">BIT</span></a>
            <span className="text-xs uppercase tracking-[0.2em] text-white/60">Lista de precios</span>
          </div>
          <h1 className="m-0 mt-8 text-4xl sm:text-5xl leading-tight text-white">Precios claros, por escrito.</h1>
          <p className="m-0 mt-4 text-lg text-white/80 max-w-2xl">Valores finales en pesos argentinos, vigentes al {ult ? fecha(ult) : "día de hoy"}. Están en la parte baja de lo que se cobra en el mercado porque trabajamos con abono mensual y diseñamos con inteligencia artificial.</p>
          <div className="mt-6 flex flex-wrap gap-2 no-print">
            <a href="https://wa.me/5491173466490?text=Hola%20DEVISEBIT%2C%20vi%20la%20lista%20de%20precios" className="btn bg-[#C8231F] text-white hover:bg-[#9E1A17]">Consultar por WhatsApp</a>
            <Imprimir texto="Descargar PDF" />
          </div>
        </div>
      </header>
      <div className="max-w-5xl mx-auto px-5 py-8 flex flex-col gap-6">
        {lineas.map((l) => (
          <section key={l} className="flex flex-col gap-3 break-inside-avoid">
            <h2 className="m-0 text-xl">{l}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ps.filter((p) => p.linea === l).map((p) => (
                <article key={p.id} className="card flex flex-col gap-2 break-inside-avoid">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="m-0 text-base">{p.producto}</h3>
                    <div className="text-right whitespace-nowrap">
                      {p.precio != null && <div className="text-xl font-extrabold">{ars(p.precio)}</div>}
                      {p.abono != null && <div className={p.precio != null ? "text-sm text-[#4A515C]" : "text-xl font-extrabold"}>{p.precio != null ? "+ " : ""}{ars(p.abono)}<span className="text-sm font-normal text-[#4A515C]"> /mes</span></div>}
                    </div>
                  </div>
                  {p.condicion && <p className="m-0 text-xs font-semibold text-[#C8231F]">{p.condicion}</p>}
                  {p.incluye && <p className="m-0 text-sm text-[#262C37]">{p.incluye}</p>}
                  {p.argumento && <p className="m-0 text-xs text-[#4A515C]">{p.argumento}</p>}
                  <div className="flex gap-3 mt-auto pt-1 text-sm no-print">
                    <a href={wa(p.producto)} className="font-semibold text-[#C8231F]">Lo quiero →</a>
                    {p.link && <a href={p.link} className="text-[#4A515C] underline">Ver detalle</a>}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
        <section className="card text-sm flex flex-col gap-1">
          <h2 className="m-0 text-base">Formas de pago</h2>
          <p className="m-0">{PAGO.texto}</p>
          <p className="m-0">Transferencias a <strong>{PAGO.titular}</strong> (CUIT {PAGO.cuit}) · {PAGO.banco}, {PAGO.cuenta} · CBU <strong>{PAGO.cbu}</strong> · alias <strong>{PAGO.alias}</strong>.</p>
          <p className="m-0 text-xs text-[#4A515C]">Los abonos tienen un mínimo de 6 meses (redes y anuncios, 3 meses); después se dan de baja con 30 días de aviso. La inversión en anuncios la paga el cliente directo a Meta o Google. Comparamos nuestros precios con tarifarios públicos del mercado argentino y los revisamos cada trimestre.</p>
        </section>
        <footer className="flex flex-col items-center gap-2 text-center text-xs text-[#4A515C] py-4"><Redes conTexto className="no-print justify-center" />DEVISEBIT SRL · Software e IA. Desde 2009 · info@devisebit.com · WhatsApp +54 9 11 7346-6490</footer>
      </div>
    </main>
  )
}
