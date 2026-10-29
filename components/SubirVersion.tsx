"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

/** Sube un PDF por partes (evita el límite de tamaño por pedido) como versión nueva de un documento. */
export default function SubirVersion({ doc }: { doc: number }) {
  const r = useRouter()
  const [estado, setEstado] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)
  async function enviar(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault()
    const f = ev.currentTarget
    const file = (f.elements.namedItem("archivo") as HTMLInputElement).files?.[0]
    if (!file) return setEstado("Elegí un archivo.")
    const notas = (f.elements.namedItem("notas") as HTMLInputElement).value
    const pub = (f.elements.namedItem("publicar") as HTMLInputElement).checked
    setOcupado(true)
    try {
      const api = (b: unknown) => fetch("/api/biblioteca/subir", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(b) }).then(async (x) => { const j = await x.json(); if (!x.ok) throw new Error(j.error || "Error"); return j })
      const ini = await api({ accion: "iniciar", doc, nombre: file.name, mime: file.type || "application/pdf", tamano: file.size, notas })
      const total = Math.ceil(file.size / ini.trozo)
      for (let n = 0; n < total; n++) {
        setEstado(`Subiendo ${Math.round((n / total) * 100)}%…`)
        const buf = new Uint8Array(await file.slice(n * ini.trozo, (n + 1) * ini.trozo).arrayBuffer())
        let bin = ""
        for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000))
        await api({ accion: "parte", id: ini.id, n, datos: btoa(bin) })
      }
      await api({ accion: "cerrar", id: ini.id, publicar: pub })
      setEstado(pub ? `Versión ${ini.version} publicada.` : `Versión ${ini.version} guardada como borrador.`)
      f.reset()
      r.refresh()
    } catch (e) {
      setEstado(`No se pudo subir: ${(e as Error).message}`)
    } finally {
      setOcupado(false)
    }
  }
  return (
    <form onSubmit={enviar} className="flex flex-col gap-2">
      <input name="archivo" type="file" accept="application/pdf,.pdf" className="inp !py-1.5" aria-label="Archivo PDF" disabled={ocupado} />
      <input name="notas" className="inp !py-1.5" placeholder="Qué cambió (opcional)" disabled={ocupado} />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="publicar" defaultChecked /> Publicar ya como versión vigente</label>
      <button className="btn-s self-start" disabled={ocupado}>{ocupado ? "Subiendo…" : "Subir versión"}</button>
      {estado && <p className="m-0 text-sm text-[#4A515C]" role="status">{estado}</p>}
    </form>
  )
}
