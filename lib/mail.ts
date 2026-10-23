/** Envío de mails transaccionales con Resend (RESEND_API_KEY). Si no está configurado devuelve false. */
export async function enviarMail(to: string, asunto: string, html: string) {
  const key = process.env.RESEND_API_KEY
  if (!key) return false
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.MAIL_FROM ?? "DEVISEBIT <sistema@devisebit.com>", to, subject: asunto, html }),
  })
  return r.ok
}
