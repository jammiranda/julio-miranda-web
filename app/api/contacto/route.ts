import { NextResponse, type NextRequest } from "next/server"

const TO = "mirandajulioadrian@gmail.com"
const CC = "info@devisebit.com"

const clean = (v: unknown, max = 2000) => String(v ?? "").replace(/[<>]/g, "").trim().slice(0, max)

export async function POST(req: NextRequest) {
  try {
    const d = await req.json()
    if (d.website) return NextResponse.json({ ok: true }) // trampa para bots

    const nombre = clean(d.nombre, 120)
    const email = clean(d.email, 160)
    if (!nombre || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ ok: false, error: "Completá nombre y un email válido." }, { status: 400 })
    }

    const tema = clean(d.tema, 120)
    const r = await fetch(`https://formsubmit.co/ajax/${TO}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Origin: "https://www.devisebit.com",
        Referer: "https://www.devisebit.com/contacto",
      },
      body: JSON.stringify({
        _subject: `Nueva consulta web DEVISEBIT · ${tema} · ${nombre}`,
        _cc: CC,
        _template: "table",
        _captcha: "false",
        name: nombre,
        email,
        Organización: clean(d.org, 160),
        WhatsApp: clean(d.tel, 60),
        Tema: tema,
        Mensaje: clean(d.msg, 4000),
        Página: clean(d.pagina, 200),
      }),
    })
    const j = await r.json().catch(() => ({}))
    const ok = r.ok && (j.success === true || j.success === "true")
    if (!ok) console.error("[contacto] formsubmit", r.status, j)
    return NextResponse.json({ ok, message: j.message }, { status: ok ? 200 : 502 })
  } catch (e) {
    console.error("[contacto]", e)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
