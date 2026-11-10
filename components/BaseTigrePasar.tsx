"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

/** Pasa una tanda del segmento corporativo a Envíos. Pide confirmación: después de pasarla, entra en las campañas "Email marketing". */
export default function BaseTigrePasar({ tanda, cantidad }: { tanda: 1 | 2; cantidad: number }) {
  const [ocupado, setOcupado] = useState(false)
  const [msg, setMsg] = useState<{ t: string; ok: boolean } | null>(null)
  const router = useRouter()
  async function pasar() {
    if (!window.confirm(`Pasar la tanda ${tanda} (${cantidad.toLocaleString("es-AR")} emails corporativos) a Envíos. No se envía nada todavía. ¿Seguir?`)) return
    setOcupado(true); setMsg(null)
    const r = await fetch("/api/base-tigre/pasar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tanda }) })
    const j = await r.json().catch(() => ({ ok: false, error: `Error ${r.status}` }))
    setOcupado(false)
    setMsg(j.ok ? { ok: true, t: `Tanda ${tanda}: ${j.pasados} contactos pasados a Envíos.` } : { ok: false, t: j.error })
    if (j.ok) router.refresh()
  }
  return (
    <span className="inline-flex flex-col gap-1">
      <button type="button" disabled={ocupado} onClick={pasar} className="btn-s disabled:opacity-60">{ocupado ? "Pasando…" : `Pasar tanda ${tanda} a Envíos`}</button>
      {msg && <span role="status" className={`text-xs ${msg.ok ? "text-emerald-700" : "text-rojo"}`}>{msg.t}</span>}
    </span>
  )
}
