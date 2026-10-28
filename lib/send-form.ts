import { leerOrigen } from "@/components/attribution"

// Envía formularios directo a FormSubmit desde el navegador (el envío servidor a servidor queda bloqueado).
export async function sendForm(d: Record<string, string | undefined>): Promise<boolean> {
  if (d.website) return true // trampa para bots
  const tema = d.tema || "Consulta"
  const r = await fetch("https://formsubmit.co/ajax/mirandajulioadrian@gmail.com", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      _subject: `Nueva consulta web DEVISEBIT · ${tema} · ${d.nombre || ""}`,
      _cc: "info@devisebit.com",
      _template: "table",
      _captcha: "false",
      _replyto: d.email || "",
      name: d.nombre || "",
      email: d.email || "",
      Organización: d.org || "",
      WhatsApp: d.tel || "",
      Tema: tema,
      Mensaje: d.msg || "",
      Página: d.pagina || "",
    }),
  })
  // Además la consulta entra al sistema de DEVISEBIT (CRM), con el origen de la visita
  if (!/cv|curr[ií]cul|trabaj|postula/i.test(tema)) try {
    await fetch("https://sistema.devisebit.com/api/consultas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ canal: "web", nombre: d.nombre, email: d.email, organizacion: d.org, telefono: d.tel, motivo: tema, mensaje: [d.msg, d.pagina ? `Página: ${d.pagina}` : ""].filter(Boolean).join("\n"), ...leerOrigen() }),
    })
  } catch {}
  const j = await r.json().catch(() => ({} as { success?: unknown }))
  return r.ok && (j.success === true || j.success === "true")
}
