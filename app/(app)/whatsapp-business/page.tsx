import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { requerir } from "@/lib/auth"
import { audit } from "@/lib/db"
import { asegurarPerfil, estadoPerfil, perfilActual, guardarPerfilDatos, guardarFoto, fotoActual, perfilEnWhatsApp, PERFIL, type Perfil } from "@/lib/waperfil"

export const dynamic = "force-dynamic"
export const maxDuration = 60

const RUBROS: [string, string][] = [["PROF_SERVICES", "Servicios profesionales"], ["OTHER", "Otro"], ["EDU", "Educación"], ["HEALTH", "Salud"], ["RETAIL", "Comercio"], ["NONPROFIT", "Sin fines de lucro"]]
const ir = (m: string, ok = true) => redirect(`/whatsapp-business?${ok ? "ok" : "e"}=${encodeURIComponent(m)}`)

async function guardar(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const t = (k: string, n: number) => String(fd.get(k) ?? "").trim().slice(0, n)
  const web = (k: string) => { const v = t(k, 256); return v ? (/^https?:\/\//.test(v) ? v : `https://${v}`) : "" }
  const p: Perfil = {
    about: t("about", 139) || PERFIL.about, description: t("description", 512), address: t("address", 256), email: t("email", 128),
    websites: [web("web1"), web("web2")].filter(Boolean), vertical: RUBROS.some(([k]) => k === fd.get("vertical")) ? String(fd.get("vertical")) : "PROF_SERVICES",
  }
  if (p.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)) ir("El email no es válido.", false)
  await guardarPerfilDatos(p)
  const f = fd.get("foto")
  if (f && typeof f === "object" && "size" in f && f.size > 0) {
    if (!/^image\/(jpeg|png)$/.test(f.type)) ir("La foto tiene que ser JPG o PNG.", false)
    if (f.size > 4_000_000) ir("La foto pesa más de 4 MB.", false)
    await guardarFoto({ t: f.type, d: Buffer.from(await f.arrayBuffer()).toString("base64") })
  }
  if (fd.get("foto_original") === "on") await guardarFoto(null)
  const r = await asegurarPerfil(true)
  await audit(u, "perfil_whatsapp", "config", 0, JSON.stringify(r).slice(0, 300))
  revalidatePath("/whatsapp-business")
  if (r.ok) ir("Perfil de WhatsApp actualizado. Los clientes lo ven en unos minutos.")
  ir("WhatsApp no aceptó el cambio: " + String((r as any).perfil ?? (r as any).error ?? "error"), false)
}

export default async function WhatsAppBusiness({ searchParams }: { searchParams: { ok?: string; e?: string } }) {
  await requerir(["gerente", "coordinacion"])
  const [p, estado, foto, real] = await Promise.all([perfilActual(), estadoPerfil(), fotoActual(), perfilEnWhatsApp().catch(() => null)])
  const fotoSrc = real?.profile_picture_url ?? (foto ? `data:${foto.t};base64,${foto.d}` : "/wa-perfil.jpg")
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="m-0">WhatsApp Business</h1>
        <p className="m-0 text-sm text-[#4A515C]">Lo que ve el cliente cuando abre el contacto de DEVISEBIT en WhatsApp. Al guardar se actualiza directo en WhatsApp.</p>
      </div>
      {searchParams.ok && <p role="status" className="m-0 text-sm font-semibold text-[#0B7A3B]">{searchParams.ok}</p>}
      {searchParams.e && <p role="alert" className="m-0 text-sm font-semibold text-[#C8231F]">{searchParams.e}</p>}
      <section className="card flex flex-wrap items-center gap-4 text-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={fotoSrc} alt="Foto de perfil de WhatsApp" width={72} height={72} className="w-[72px] h-[72px] rounded-full object-cover bg-[#0B0D12]" />
        <div className="flex flex-col gap-0.5">
          <strong className="text-base">{real?.verified_name ?? "DEVISEBIT"}</strong>
          <span className="text-[#4A515C]">{real?.display_phone_number ?? "+54 9 11 7346-6490"}</span>
          {real?.quality_rating && <span className="text-xs text-[#4A515C]">Calidad del número: {String(real.quality_rating).toLowerCase()}</span>}
        </div>
        <p className="m-0 text-xs text-[#4A515C] basis-full">El nombre visible lo aprueba Meta: se cambia desde el Administrador de WhatsApp, no desde acá.</p>
      </section>
      <form action={guardar} className="card grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="lbl md:col-span-2">Info (frase corta, máx. 139)<input name="about" defaultValue={p.about} maxLength={139} className="inp" /></label>
        <label className="lbl md:col-span-2">Descripción (máx. 512)<textarea name="description" defaultValue={p.description} maxLength={512} rows={6} className="inp" /></label>
        <label className="lbl md:col-span-2">Dirección<input name="address" defaultValue={p.address} maxLength={256} className="inp" /></label>
        <label className="lbl">Email<input name="email" type="email" defaultValue={p.email} className="inp" /></label>
        <label className="lbl">Rubro<select name="vertical" defaultValue={p.vertical} className="inp">{RUBROS.map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></label>
        <label className="lbl">Web 1<input name="web1" defaultValue={p.websites[0] ?? ""} className="inp" /></label>
        <label className="lbl">Web 2<input name="web2" defaultValue={p.websites[1] ?? ""} className="inp" /></label>
        <label className="lbl">Cambiar foto (JPG o PNG cuadrada, mínimo 640×640)<input name="foto" type="file" accept="image/jpeg,image/png" className="inp" /></label>
        <label className="flex items-center gap-2 text-sm self-end"><input type="checkbox" name="foto_original" /> Volver al logo de DEVISEBIT</label>
        <button className="btn-p md:col-span-2 justify-self-start">Guardar y publicar en WhatsApp</button>
      </form>
      {estado && <p className="m-0 text-xs text-[#4A515C]">Última publicación: {new Date(estado.cuando).toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })} · perfil {String(estado.perfil)} · foto {String(estado.foto ?? "—")} · mensajes de aviso: {estado.plantillas && typeof estado.plantillas === "object" ? Object.entries(estado.plantillas).map(([k, v]) => `${k} (${v})`).join(", ") : "se crean cuando entre el próximo mensaje"}</p>}
    </div>
  )
}
