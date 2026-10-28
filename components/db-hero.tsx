import type React from "react"

export default function DbHero({
  kicker,
  title,
  sub,
  children,
}: {
  kicker: string
  title: React.ReactNode
  sub?: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <section className="db-tech bg-[#0B0D12] text-white">
      <div className="db-rise max-w-[1240px] mx-auto px-4 md:px-8 pt-16 pb-[72px] flex flex-col gap-4">
        <p className="m-0 text-sm font-bold uppercase tracking-[0.16em] text-[#FF6A63]">{kicker}</p>
        <h1 className="m-0 font-tight text-[38px] md:text-[52px] leading-[1.08] font-extrabold max-w-[900px]">{title}</h1>
        {sub && <p className="m-0 text-lg md:text-[19px] leading-relaxed text-[#C3C8D1] max-w-[760px]">{sub}</p>}
        {children}
      </div>
      <div className="db-scan"><i /></div>
    </section>
  )
}
