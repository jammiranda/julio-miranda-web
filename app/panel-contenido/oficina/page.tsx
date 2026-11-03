import { soloJulio } from "@/lib/oficina"
import { NoPermiso } from "../_ui"

export const dynamic = "force-dynamic"
export const metadata = { title: "Oficina · DEVISEBIT" }

export default async function OficinaModulo() {
  if (!(await soloJulio())) return <NoPermiso />
  return (
    <iframe
      src="/api/oficina/vista"
      title="Oficina de agentes"
      style={{ width: "100%", height: "calc(100dvh - 64px)", minHeight: 640, border: 0, borderRadius: 16, background: "transparent", display: "block" }}
    />
  )
}
