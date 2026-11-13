import { type NextRequest } from "next/server"
import { soloJulio } from "@/lib/oficina"
import { diaValido, infografiaDe, pdfDe } from "@/lib/control"

export const dynamic = "force-dynamic"

// La infografía avisa su alto al panel para que el marco no tenga barra propia
const AJUSTE = `<script>(function(){function a(){try{parent.postMessage({controlAlto:document.documentElement.scrollHeight},"*")}catch(e){}}addEventListener("load",a);addEventListener("resize",a);setTimeout(a,400);setTimeout(a,1500);if(window.ResizeObserver)new ResizeObserver(a).observe(document.documentElement)})()</script>`

/** GET ?dia=YYYY-MM-DD&t=pdf|info[&bajar=1]: solo Julio (sesión del panel). /api/panel es público en el middleware, por eso se verifica acá. */
export async function GET(req: NextRequest) {
  if (!(await soloJulio())) return new Response("No autorizado", { status: 401 })
  const sp = req.nextUrl.searchParams, dia = sp.get("dia"), t = sp.get("t")
  if (!diaValido(dia)) return new Response("Día inválido", { status: 400 })
  const comunes = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" }
  if (t === "pdf") {
    const f = await pdfDe(dia)
    if (!f) return new Response("Ese corte no tiene PDF", { status: 404 })
    return new Response(Buffer.from(f.pdf_b64, "base64"), { headers: { ...comunes, "Content-Type": "application/pdf", "Content-Disposition": `${sp.get("bajar") ? "attachment" : "inline"}; filename="${f.pdf_nombre}"` } })
  }
  if (t === "info") {
    const f = await infografiaDe(dia)
    if (!f) return new Response("Ese corte no tiene infografía", { status: 404 })
    const html = f.infografia.includes("</body>") ? f.infografia.replace("</body>", AJUSTE + "</body>") : f.infografia + AJUSTE
    // sandbox sin allow-same-origin: la página corre aislada y no puede leer la sesión ni llamar al panel
    return new Response(html, { headers: { ...comunes, "Content-Type": "text/html; charset=utf-8", "Content-Security-Policy": "sandbox allow-scripts allow-popups allow-popups-to-escape-sandbox; frame-ancestors 'self'" } })
  }
  return new Response("Tipo inválido", { status: 400 })
}
