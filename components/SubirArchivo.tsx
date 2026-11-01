"use client"
import { useRef, useState } from "react"

/**
 * Subida de un archivo al repositorio protegido de la Academia (cifrado, por partes de 2,5 MB).
 * Al terminar completa el campo <input name="campo"> del formulario con la referencia "enc:db:<clave>".
 */
const TROZO = 2_500_000
const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("")
const b64 = (b: ArrayBuffer) => { let s = ""; const u = new Uint8Array(b); for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000)); return btoa(s) }
const limpio = (n: string) => n.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "")

export default function SubirArchivo({ slug, campo = "archivo_url" }: { slug: string; campo?: string }) {
  const caja = useRef<HTMLDivElement>(null)
  const [pct, setPct] = useState(0)
  const [estado, setEstado] = useState("")
  const [sobre, setSobre] = useState(false)
  const [subiendo, setSubiendo] = useState(false)

  async function post(b: any) {
    const r = await fetch("/api/academia/archivos", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(b) })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) throw new Error(j.error ?? "Error al subir")
    return j
  }

  async function subir(f: File) {
    setSubiendo(true); setPct(0); setEstado(`Subiendo ${f.name}…`)
    try {
      const buf = await f.arrayBuffer()
      const sha = hex(await crypto.subtle.digest("SHA-256", buf))
      const clave = `cursos/${limpio(slug) || "curso"}/${limpio(f.name) || "archivo"}`
      const ini = await post({ accion: "iniciar", clave, nombre: f.name, mime: f.type || "application/octet-stream", tamano: f.size, sha256: sha })
      const n = Math.ceil(buf.byteLength / (ini.trozo || TROZO))
      for (let i = 0; i < n; i++) {
        await post({ accion: "parte", id: ini.id, n: i, datos: b64(buf.slice(i * (ini.trozo || TROZO), (i + 1) * (ini.trozo || TROZO))) })
        setPct(Math.round(((i + 1) / n) * 100))
      }
      await post({ accion: "cerrar", id: ini.id })
      const input = caja.current?.closest("form")?.querySelector<HTMLInputElement>(`input[name="${campo}"]`)
      if (input) { input.value = ini.url; input.dispatchEvent(new Event("input", { bubbles: true })) }
      setEstado(`Cargado: ${f.name}. Guardá la lección para dejarlo asociado.`)
    } catch (e: any) { setEstado(`No se pudo subir: ${e.message}`) } finally { setSubiendo(false) }
  }

  return (
    <div
      ref={caja}
      className={`drop ${sobre ? "sobre" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setSobre(true) }}
      onDragLeave={() => setSobre(false)}
      onDrop={(e) => { e.preventDefault(); setSobre(false); const f = e.dataTransfer.files?.[0]; if (f) subir(f) }}
    >
      <label className="btn-s btn !py-2 cursor-pointer">
        Subir archivo
        <input type="file" className="sr-only" disabled={subiendo} onChange={(e) => { const f = e.target.files?.[0]; if (f) subir(f) }} />
      </label>
      <span className="text-sm text-[var(--gris)]">o arrastralo acá (hasta 40 MB). Queda guardado y cifrado; solo lo descargan los inscriptos.</span>
      {subiendo && <span className="barra" aria-hidden="true"><i style={{ width: `${pct}%` }} /></span>}
      {estado && <span role="status" className="basis-full text-xs text-[var(--gris)]">{estado}</span>}
    </div>
  )
}
