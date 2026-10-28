import type { Metadata } from "next"
import { one } from "@/lib/db"
import { demoInfo, videoDe, type DemoInfo } from "@/lib/demos"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Tus demos", robots: { index: false, follow: false } }

const WA = "https://wa.me/5491173466490?text=Hola%20DEVISEBIT%2C%20quiero%20ver%20las%20demos"

/** Página personal con las demos habilitadas para un link. */
export default async function MisDemos({ params }: { params: { token: string } }) {
  const a = await one<{ nombre: string | null; demos: string[]; blanca: boolean; expira: Date; revocado: boolean }>(
    "select nombre, demos, blanca, expira, revocado from demo_accesos where token=$1", [params.token],
  ).catch(() => null)
  const vigente = a && !a.revocado && new Date(a.expira) > new Date()
  const blanca = !!a?.blanca
  const acento = blanca ? "#1D4E89" : "#C8231F"

  if (!vigente) {
    return (
      <main className="min-h-screen bg-[#F5F6F8] flex items-center justify-center px-4 py-12">
        <div className="card max-w-md w-full flex flex-col gap-3 text-center">
          <h1 className="m-0 text-2xl">{a ? "Este link ya venció" : "Link no válido"}</h1>
          <p className="m-0 text-[#4A515C]">Los links de demo son personales y duran unos días.{blanca ? " Pedile uno nuevo a tu asesor." : " Pedí uno nuevo y te llega al instante a tu correo."}</p>
          {!blanca && (
            <div className="flex flex-col gap-2 mt-2">
              <a href="https://www.devisebit.com/demos#pedir" className="btn-p">Pedir un link nuevo</a>
              <a href={WA} className="btn-s">Escribir por WhatsApp</a>
            </div>
          )}
        </div>
      </main>
    )
  }

  const lista = a!.demos.map((s) => demoInfo(s)).filter(Boolean) as DemoInfo[]
  const vence = new Date(a!.expira).toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", day: "numeric", month: "long" })
  const q = blanca ? "?marca=blanca" : ""
  return (
    <main className="min-h-screen bg-[#F5F6F8]">
      <header className="bg-[#0B0D12] text-white">
        <div className="max-w-6xl mx-auto px-4 pt-8 pb-10 sm:pt-12 sm:pb-14 flex flex-col gap-3">
          {blanca ? <span className="text-sm font-semibold tracking-[0.2em] text-white/70">TU MARCA</span> : <span className="text-xl font-extrabold tracking-[0.04em]">DEVISE<span className="text-[#FF6A63]">BIT</span></span>}
          <h1 className="m-0 text-[30px] sm:text-[44px] leading-tight font-extrabold text-white">{a!.nombre ? `${a!.nombre.split(" ")[0]}, estas son tus demos` : "Tus demos"}</h1>
          <p className="m-0 text-white/75 max-w-2xl">Funcionan en tu navegador, con datos de ejemplo. Muestran las funciones básicas: el sistema completo tiene más módulos, que vemos juntos en una presentación. Link personal, válido hasta el {vence}.</p>
        </div>
      </header>
      <ul className="m-0 p-0 list-none max-w-6xl mx-auto px-4 py-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {lista.map((d) => (
          <li key={d.slug} className="card flex flex-col gap-3">
            <h2 className="m-0 text-xl">{d.titulo}</h2>
            <p className="m-0 text-[15px] text-[#4A515C]">{d.texto}</p>
            <div className="mt-auto flex flex-col gap-2 pt-2">
              <a href={`/demo/${params.token}/${d.slug}${q}`} className="btn-p text-center" style={{ background: acento }}>Probar la demo</a>
              <a href={`/demo/${params.token}/${d.slug}${q ? q + "&" : "?"}tour=1`} className="btn-s text-center">Recorrido guiado</a>
              <details className="rounded-xl border border-[#E2E5EA]">
                <summary className="cursor-pointer px-4 py-2.5 text-sm font-semibold text-center">▶ Ver el video (1 min)</summary>
                <video src={videoDe(d.slug, blanca)} controls preload="none" playsInline className="w-full rounded-b-xl bg-black aspect-video" />
              </details>
            </div>
          </li>
        ))}
      </ul>
      {!blanca && (
        <section className="max-w-6xl mx-auto px-4 pb-14">
          <div className="card flex flex-wrap items-center justify-between gap-4">
            <div><h2 className="m-0 text-xl">¿Lo vemos con tus datos?</h2><p className="m-0 text-[#4A515C]">En 30 minutos te mostramos el sistema completo, adaptado a tu organización.</p></div>
            <div className="flex flex-wrap gap-2"><a href="https://sistema.devisebit.com/agendar" className="btn-p">Agendar una reunión</a><a href={WA} className="btn-s">WhatsApp</a></div>
          </div>
        </section>
      )}
    </main>
  )
}
