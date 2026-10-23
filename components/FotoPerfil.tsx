"use client"
import { useRef, useState } from "react"

/** Elige una foto, la recorta cuadrada a 256 px y la manda como data URL al formulario. */
export default function FotoPerfil({ accion, actual }: { accion: (fd: FormData) => void; actual?: string | null }) {
  const ref = useRef<HTMLInputElement>(null)
  const [vista, setVista] = useState<string | null>(actual ?? null)
  const [dato, setDato] = useState("")
  async function elegir(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const img = await createImageBitmap(f)
    const lado = Math.min(img.width, img.height)
    const c = document.createElement("canvas")
    c.width = c.height = 256
    c.getContext("2d")!.drawImage(img, (img.width - lado) / 2, (img.height - lado) / 2, lado, lado, 0, 0, 256, 256)
    const url = c.toDataURL("image/jpeg", 0.85)
    setVista(url); setDato(url)
  }
  return (
    <form action={accion} className="flex items-center gap-4">
      <input ref={ref} type="file" accept="image/*" onChange={elegir} className="hidden" />
      <input type="hidden" name="foto" value={dato} />
      <button type="button" onClick={() => ref.current?.click()} className="relative group" title="Cambiar foto">
        {vista
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={vista} alt="Tu foto" className="w-20 h-20 rounded-full object-cover ring-4 ring-[#FDECEB]" />
          : <span className="w-20 h-20 rounded-full bg-[#FDECEB] text-[#C8231F] flex items-center justify-center text-3xl">📷</span>}
        <span className="absolute bottom-0 right-0 bg-[#C8231F] text-white text-xs rounded-full w-7 h-7 flex items-center justify-center shadow">✎</span>
      </button>
      <div className="flex flex-col gap-1">
        <button type="button" onClick={() => ref.current?.click()} className="btn-s py-1.5 text-sm">{vista ? "Cambiar foto" : "Subir foto"}</button>
        {dato && <button className="btn-p py-1.5 text-sm">Guardar foto</button>}
        {!dato && vista && <button name="quitar" value="1" className="text-xs text-[#4A515C] underline">Quitar foto</button>}
      </div>
    </form>
  )
}
