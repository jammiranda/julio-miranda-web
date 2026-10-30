import { URL_ACADEMIA } from "@/lib/academia"

/** Aviso arriba de los cursos del portal: el aula "de verdad" vive en ACADEMIA DEVISEBIT (misma cuenta). */
export default function AvisoAula({ ruta = "/mi-cuenta" }: { ruta?: string }) {
  return (
    <div className="card !border-[#C8231F] flex flex-wrap items-center justify-between gap-3">
      <span className="text-sm"><strong className="block text-base">Abrí tu aula en ACADEMIA DEVISEBIT</strong>Tus cursos, clases en vivo y certificados, con la misma cuenta y sin volver a ingresar.</span>
      <a href={`${URL_ACADEMIA}${ruta}`} className="btn-p py-1.5">Ir a mi aula ↗</a>
    </div>
  )
}
