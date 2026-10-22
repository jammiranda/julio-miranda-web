import { requerir } from "@/lib/auth"
import DbTabs from "./tabs"

export default async function DevisebitLayout({ children }: { children: React.ReactNode }) {
  await requerir(["gerente"])
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="m-0 text-xs font-bold uppercase tracking-[0.14em] text-[#4F5C69]">DEVISEBIT SRL</p>
          <h1 className="m-0">CRM comercial</h1>
        </div>
        <DbTabs />
      </div>
      {children}
    </div>
  )
}
