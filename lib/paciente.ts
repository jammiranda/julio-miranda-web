import { s } from "./util"
export const CAMPOS = ["apellido_nombre","dni","obra_social","nro_afiliado","fecha_nac","domicilio","localidad","telefono","contacto_familiar","tel_familiar","diagnostico","medico_cabecera","notas"] as const
export function valores(fd: FormData) {
  return CAMPOS.map((c) => {
    const v = s(fd.get(c))
    return c === "apellido_nombre" && v ? v.toUpperCase() : v
  })
}
