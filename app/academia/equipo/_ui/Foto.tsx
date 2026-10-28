import { existsSync } from "fs"
import path from "path"
import { fotoDe, type Perfil } from "@/lib/equipo"

/** Foto cuadrada de la persona o, si todavía no está el archivo, sus iniciales. */
export default function Foto({ p, className = "" }: { p: Perfil; className?: string }) {
  const url = fotoDe(p.slug)
  if (existsSync(path.join(process.cwd(), "public", url)))
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={`Foto de ${p.nombre}`} width={400} height={400} loading="lazy" className={`object-cover ${className}`} />
  return <div className={`bg-[#0E1116] text-[#FF6A63] flex items-center justify-center font-extrabold ${className}`} aria-hidden="true"><span className="text-[clamp(1.5rem,4vw,2.5rem)]">{p.iniciales}</span></div>
}
