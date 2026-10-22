import { LOCALIDADES } from "@/lib/util"
export default function FormPaciente({ p }: { p?: any }) {
  const v = (k: string) => (p?.[k] ?? "") as string
  const d = (k: string) => { const x = p?.[k]; if (!x) return ""; return x instanceof Date ? x.toISOString().slice(0, 10) : String(x).slice(0, 10) }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <label className="lbl sm:col-span-2">Apellido y nombre *<input name="apellido_nombre" required defaultValue={v("apellido_nombre")} className="inp" /></label>
      <label className="lbl">DNI<input name="dni" defaultValue={v("dni")} className="inp" inputMode="numeric" /></label>
      <label className="lbl">Obra social<input name="obra_social" defaultValue={v("obra_social") || "PAMI"} className="inp" /></label>
      <label className="lbl">N.º de afiliado<input name="nro_afiliado" defaultValue={v("nro_afiliado")} className="inp" /></label>
      <label className="lbl">Fecha de nacimiento<input name="fecha_nac" type="date" defaultValue={d("fecha_nac")} className="inp" /></label>
      <label className="lbl sm:col-span-2">Domicilio<input name="domicilio" defaultValue={v("domicilio")} className="inp" /></label>
      <label className="lbl">Localidad
        <input name="localidad" list="locs" defaultValue={v("localidad")} className="inp" />
        <datalist id="locs">{LOCALIDADES.map((l) => <option key={l} value={l} />)}</datalist>
      </label>
      <label className="lbl">Teléfono<input name="telefono" defaultValue={v("telefono")} className="inp" /></label>
      <label className="lbl">Contacto familiar<input name="contacto_familiar" defaultValue={v("contacto_familiar")} className="inp" /></label>
      <label className="lbl">Tel. familiar<input name="tel_familiar" defaultValue={v("tel_familiar")} className="inp" /></label>
      <label className="lbl sm:col-span-2">Diagnóstico<input name="diagnostico" defaultValue={v("diagnostico")} className="inp" /></label>
      <label className="lbl">Médico de cabecera<input name="medico_cabecera" defaultValue={v("medico_cabecera")} className="inp" /></label>
      {p && (
        <label className="lbl">Estado
          <select name="estado" defaultValue={v("estado")} className="inp"><option value="activo">Activo</option><option value="suspendido">Suspendido</option><option value="alta">Alta</option><option value="fallecido">Fallecido</option></select>
        </label>
      )}
      <label className="lbl sm:col-span-2 lg:col-span-3">Notas<textarea name="notas" rows={2} defaultValue={v("notas")} className="inp" /></label>
    </div>
  )
}
