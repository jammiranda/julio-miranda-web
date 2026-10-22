"use client"
import { useEffect, useState } from "react"

const b64 = (s: string) => { const p = "=".repeat((4 - (s.length % 4)) % 4); const r = atob((s + p).replace(/-/g, "+").replace(/_/g, "/")); return Uint8Array.from([...r].map((c) => c.charCodeAt(0))) }

/** Activa las notificaciones en este dispositivo (celular o compu). */
export default function ActivarAvisos({ compacto = false }: { compacto?: boolean }) {
  const [estado, setEstado] = useState<"cargando" | "no-soporta" | "ios" | "inactivo" | "activo" | "bloqueado">("cargando")
  const [msg, setMsg] = useState("")
  useEffect(() => {
    (async () => {
      const ios = /iphone|ipad/i.test(navigator.userAgent) && !(window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone)
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) return setEstado(ios ? "ios" : "no-soporta")
      if (Notification.permission === "denied") return setEstado("bloqueado")
      const reg = await navigator.serviceWorker.register("/sw.js")
      const sub = await reg.pushManager.getSubscription()
      setEstado(sub ? "activo" : "inactivo")
    })().catch(() => setEstado("no-soporta"))
  }, [])
  async function activar() {
    setMsg("")
    try {
      const reg = await navigator.serviceWorker.register("/sw.js")
      const perm = await Notification.requestPermission()
      if (perm !== "granted") { setEstado("bloqueado"); return }
      const { clave } = await (await fetch("/api/push")).json()
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(clave) })
      await fetch("/api/push", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sub: sub.toJSON() }) })
      await fetch("/api/push", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prueba: true }) })
      setEstado("activo"); setMsg("Listo: te mandamos una notificación de prueba.")
    } catch { setMsg("No se pudo activar en este dispositivo.") }
  }
  async function desactivar() {
    const reg = await navigator.serviceWorker.getRegistration("/sw.js")
    const sub = await reg?.pushManager.getSubscription()
    if (sub) { await fetch("/api/push", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) }); await sub.unsubscribe() }
    setEstado("inactivo")
  }
  if (estado === "cargando") return null
  const txt: Record<string, string> = {
    "no-soporta": "Este navegador no permite notificaciones.",
    ios: "En iPhone: abrí el sistema en Safari, tocá Compartir → \"Agregar a pantalla de inicio\" y desde ese ícono activá las notificaciones.",
    bloqueado: "Las notificaciones están bloqueadas para este sitio. Habilitalas en la configuración del navegador.",
  }
  if (txt[estado]) return <p className={`m-0 ${compacto ? "text-xs" : "text-sm"} text-[#4F5C69]`}>{txt[estado]}</p>
  return (
    <div className="flex flex-wrap items-center gap-2">
      {estado === "activo"
        ? <><span className={`${compacto ? "text-xs" : "text-sm"} text-[#0B5E31] font-semibold`}>🔔 Notificaciones activas en este dispositivo</span><button type="button" onClick={desactivar} className="text-xs underline text-[#4F5C69]">Desactivar</button></>
        : <button type="button" onClick={activar} className={compacto ? "btn-s py-1 px-3 text-xs" : "btn-p"}>🔔 Activar notificaciones en este dispositivo</button>}
      {msg && <span className="text-xs text-[#4F5C69]">{msg}</span>}
    </div>
  )
}
