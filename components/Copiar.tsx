"use client"
import { useState } from "react"
export default function Copiar({ texto, etiqueta = "Copiar" }: { texto: string; etiqueta?: string }) {
  const [ok, setOk] = useState(false)
  return <button type="button" onClick={async () => { await navigator.clipboard.writeText(texto); setOk(true); setTimeout(() => setOk(false), 1800) }} className="btn-s py-1 px-3 text-xs">{ok ? "¡Copiado!" : etiqueta}</button>
}
