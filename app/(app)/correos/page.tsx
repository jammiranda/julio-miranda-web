import Link from "next/link"
import { redirect } from "next/navigation"
import { requerir } from "@/lib/auth"
import { correosGmail, correosImap, contactosPorEmail, emailDe, nombreDe, imapConfig, limpiarCache, conectorAlDia } from "@/lib/integraciones"
import { Pestanias } from "@/components/Registro"

export const dynamic = "force-dynamic"
export const maxDuration = 60

const cuando = (iso: string) => {
  const d = new Date(iso)
  const hoy = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Argentina/Buenos_Aires" })
  const dia = d.toLocaleDateString("sv-SE", { timeZone: "America/Argentina/Buenos_Aires" })
  return dia === hoy
    ? d.toLocaleTimeString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
    : d.toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", day: "numeric", month: "short" })
}

async function actualizar(fd: FormData) {
  "use server"
  await requerir(["gerente", "coordinacion"])
  const ver = String(fd.get("ver") ?? "gmail")
  await limpiarCache(ver === "info" ? "imap:" : "g:gmail")
  redirect(`/correos?ver=${ver}`)
}

export default async function Correos({ searchParams: sp }: { searchParams: { ver?: string } }) {
  await requerir(["gerente", "coordinacion"])
  const ver = sp.ver === "info" ? "info" : "gmail"
  const [g, im, cfg, v2] = await Promise.all([correosGmail(), correosImap(), imapConfig(), conectorAlDia()])
  const emails = ver === "gmail" ? g.hilos.map((h) => emailDe(h.de)) : im.mails.map((m) => m.deEmail)
  const contactos = await contactosPorEmail(emails)
  const noLeidosG = g.hilos.filter((h) => h.noLeido).length

  return (
    <div className="flex flex-col gap-5">
      <header className="pag-cab">
        <div><div className="eyebrow">Comunicación</div><h1 className="m-0">Correo</h1><p>Tu Gmail y la casilla info@devisebit.com en un mismo lugar. Si quien escribe ya es un contacto del CRM, se enlaza con su ficha.</p></div>
        <div className="pag-acc">
          <form action={actualizar}><input type="hidden" name="ver" value={ver} /><button className="btn-s">Actualizar</button></form>
          <Link href="/integraciones" className="btn-s">Configurar</Link>
        </div>
      </header>

      <Pestanias base="/correos" actual={ver} items={[{ v: "gmail", n: "Gmail", cant: noLeidosG || undefined }, { v: "info", n: "info@devisebit.com", cant: im.noLeidos || undefined }]} />

      {ver === "gmail" ? (
        !v2 ? <p className="vacio">Gmail todavía no está conectado. Actualizá el conector de Google en <Link href="/integraciones" className="underline">Integraciones</Link> (un solo paso).</p>
        : g.hilos.length ? (
          <ul className="card !p-0 m-0 list-none divide-y divide-[var(--borde-2)] overflow-hidden">
            {g.hilos.map((h) => {
              const em = emailDe(h.de), c = contactos[em]
              return (
                <li key={h.id} className={`flex items-start gap-3 px-4 py-3 ${h.noLeido ? "bg-[var(--sup)]" : "bg-[var(--sup-2)]/40"}`}>
                  <span className={`mt-2 w-2 h-2 rounded-full shrink-0 ${h.noLeido ? "bg-[var(--ac)]" : "bg-transparent"}`} aria-label={h.noLeido ? "Sin leer" : undefined} />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <span className={`truncate ${h.noLeido ? "font-bold" : "font-semibold"}`}>{nombreDe(h.de)}</span>
                      {c && <Link href={`/contactos/${c.id}`} className="chip bg-red-50 text-rojo hover:underline">CRM · {c.n}</Link>}
                      {h.mensajes > 1 && <span className="text-xs text-[var(--gris)]">{h.mensajes} mensajes</span>}
                    </div>
                    <div className={`truncate ${h.noLeido ? "font-semibold" : ""}`}>{h.asunto}</div>
                    <div className="text-sm text-[var(--gris)] truncate">{h.fragmento}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="text-xs text-[var(--gris)] tabular-nums">{cuando(h.fecha)}</span>
                    <a href={h.link} target="_blank" rel="noopener noreferrer" className="btn-s py-1 px-2.5 text-xs">Abrir ↗</a>
                  </div>
                </li>
              )
            })}
          </ul>
        ) : <p className="vacio">{g.ok ? "No hay correos con la búsqueda configurada." : "Gmail no respondió. Probá Actualizar en un momento."}</p>
      ) : (
        !cfg.tieneClave ? <p className="vacio">La casilla info@devisebit.com todavía no está conectada. Dirección la configura en <Link href="/integraciones" className="underline">Integraciones</Link> con los datos IMAP de Donweb.</p>
        : im.mails.length ? (
          <ul className="card !p-0 m-0 list-none divide-y divide-[var(--borde-2)] overflow-hidden">
            {im.mails.map((m) => {
              const c = contactos[m.deEmail]
              return (
                <li key={m.uid} className={`flex items-start gap-3 px-4 py-3 ${m.leido ? "" : "bg-[var(--sup)]"}`}>
                  <span className={`mt-2 w-2 h-2 rounded-full shrink-0 ${m.leido ? "bg-transparent" : "bg-[var(--ac)]"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-2"><span className={`truncate ${m.leido ? "font-semibold" : "font-bold"}`}>{m.de}</span>{m.deEmail && m.de !== m.deEmail && <span className="text-xs text-[var(--gris)]">{m.deEmail}</span>}{c && <Link href={`/contactos/${c.id}`} className="chip bg-red-50 text-rojo hover:underline">CRM · {c.n}</Link>}</div>
                    <div className={`truncate ${m.leido ? "" : "font-semibold"}`}>{m.asunto}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="text-xs text-[var(--gris)] tabular-nums">{cuando(m.fecha)}</span>
                    {!c && m.deEmail && <Link href={`/contactos/nuevo?email=${encodeURIComponent(m.deEmail)}&nombre=${encodeURIComponent(m.de)}`} className="btn-s py-1 px-2.5 text-xs">+ Contacto</Link>}
                    {cfg.webmail && <a href={cfg.webmail} target="_blank" rel="noopener noreferrer" className="btn-s py-1 px-2.5 text-xs">Abrir ↗</a>}
                  </div>
                </li>
              )
            })}
          </ul>
        ) : <p className="vacio">{im.ok ? "La bandeja está vacía." : `No pude leer la casilla${im.error ? `: ${im.error}` : ""}. Revisá los datos en Integraciones.`}</p>
      )}
      <p className="m-0 text-xs text-[var(--gris)]">Se actualiza cada 5 minutos. El sistema solo lee: para responder se abre el correo en Gmail o en el webmail.</p>
    </div>
  )
}
