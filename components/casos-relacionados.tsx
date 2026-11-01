import Link from "next/link"
import { CASOS } from "@/lib/casos-datos"
import { CASOS_EN } from "@/lib/casos-datos-en"

type Lang = "es" | "en"

const T = {
  es: { kicker: "Casos reales", h2: "Esto ya lo hicimos", all: "Ver todos los casos", base: "/casos-de-exito/todos#caso-", todos: "/casos-de-exito/todos", res: "Resultado" },
  en: { kicker: "Real cases", h2: "We have already done this", all: "See all cases", base: "/en/success-stories/all#case-", todos: "/en/success-stories/all", res: "Result" },
}

/** Casos de éxito relacionados con la página donde se muestran. `ids` son los id de lib/casos-datos. */
export default function CasosRelacionados({ ids, lang = "es", oscuro = false }: { ids: number[]; lang?: Lang; oscuro?: boolean }) {
  const t = T[lang]
  const fuente: any[] = lang === "en" ? CASOS_EN : CASOS
  const casos = ids.map((id) => fuente.find((c) => c.id === id)).filter(Boolean)
  if (!casos.length) return null
  const bg = oscuro ? "db-tech bg-[#0B0D12] text-white" : "bg-[#F5F6F8] text-[#0E1116]"
  const card = oscuro ? "border-[#262C37] bg-[#161A22]" : "border-[#E2E5EA] bg-white"
  const mut = oscuro ? "text-[#C3C8D1]" : "text-[#4A515C]"
  return (
    <section aria-label={t.h2} className={bg}>
      <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-14 flex flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col gap-1.5">
            <p className="m-0 text-sm font-bold uppercase tracking-[0.16em] text-[#C8231F]">{t.kicker}</p>
            <h2 className="m-0 font-tight text-[26px] md:text-[34px] leading-[1.1] font-extrabold">{t.h2}</h2>
          </div>
          <Link href={t.todos} className="font-bold text-[#C8231F] hover:text-[#9E1A17]">{t.all} →</Link>
        </div>
        <ul className="m-0 p-0 list-none grid md:grid-cols-3 gap-4">
          {casos.map((c) => (
            <li key={c.id}>
              <Link href={t.base + c.id} className={"db-card h-full rounded-2xl border overflow-hidden flex flex-col " + card}>
                <img src={c.image} alt={c.title} width={640} height={360} loading="lazy" decoding="async" className="w-full aspect-[16/9] object-cover" />
                <span className="p-5 flex flex-col gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#C8231F]">{c.client}</span>
                  <strong className="font-tight text-[18px] leading-snug">{c.title}</strong>
                  <span className={"text-[14.5px] leading-relaxed " + mut}><b>{t.res}:</b> {c.achievements}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
