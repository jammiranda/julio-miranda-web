import { eliminar } from "@/lib/eliminar"
import BotonConfirmar from "@/components/BotonConfirmar"

/** Botón «Eliminar» con confirmación. `e` es el tipo de elemento y `id` su identificador; vuelve a `volver` (ruta con filtros). */
export default function Eliminar({ e, id, volver, nombre, texto = "Eliminar" }: { e: string; id: string | number; volver: string; nombre?: string; texto?: string }) {
  return (
    <form action={eliminar} className="inline-block">
      <input type="hidden" name="e" value={e} /><input type="hidden" name="id" value={String(id)} /><input type="hidden" name="volver" value={volver} />
      <BotonConfirmar chico mensaje={`¿Eliminar ${nombre ? `«${nombre}»` : "este elemento"}? No se puede deshacer y queda registrado en Auditoría.`}>{texto}</BotonConfirmar>
    </form>
  )
}
