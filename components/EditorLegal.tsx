"use client"
import { useMemo, useRef, useState } from "react"

type Campo = { k: string; l: string; ph?: string; def?: string }

/** Completa los {{campos}} en vivo y deja el documento editable; descarga en Word (.doc) o imprime a PDF. */
export default function EditorLegal({ titulo, cuerpo, campos }: { titulo: string; cuerpo: string; campos: Campo[] }) {
  const [v, setV] = useState<Record<string, string>>(() => Object.fromEntries(campos.map((c) => [c.k, c.def ?? ""])))
  const doc = useRef<HTMLDivElement>(null)
  const [editado, setEditado] = useState(false)

  const html = useMemo(() => {
    const esc = (x: string) => x.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!)
    return esc(cuerpo).replace(/\{\{(\w+)\}\}/g, (_, k) => (v[k] ? `<b>${esc(v[k])}</b>` : `<mark>[${esc(campos.find((c) => c.k === k)?.l ?? k)}]</mark>`)).replace(/\n/g, "<br>")
  }, [cuerpo, v, campos])

  const firma = `<br><br><table style="width:100%;margin-top:40px"><tr><td style="width:50%;vertical-align:bottom"><div style="border-top:1px solid #000;width:80%;padding-top:4px">${v.firmante || "Julio A. Miranda"}<br>${v.cargo || "Gerente"}<br>DEVISEBIT SRL</div></td><td style="vertical-align:bottom"><div style="border-top:1px solid #000;width:80%;padding-top:4px">${v.representante || "Representante del cliente"}<br>${v.cliente || "Cliente"}</div></td></tr></table>`
  const completo = () => (editado ? (doc.current?.innerHTML ?? html) : html + firma)

  function word() {
    const doc2 = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>${titulo}</title><style>body{font-family:Calibri,Arial;font-size:11pt;line-height:1.45}mark{background:#ffe08a}</style></head><body>${completo()}</body></html>`
    const a = document.createElement("a")
    a.href = URL.createObjectURL(new Blob(["﻿", doc2], { type: "application/msword" }))
    a.download = `${titulo.replace(/[^\w]+/g, "-").toLowerCase()}.doc`
    a.click()
  }
  function imprimir() {
    const w = window.open("", "_blank")
    if (!w) return
    w.document.write(`<html><head><meta charset="utf-8"><title>${titulo}</title><style>body{font-family:Georgia,serif;font-size:12pt;line-height:1.5;margin:24mm}mark{background:#ffe08a}</style></head><body>${completo()}</body></html>`)
    w.document.close(); w.focus(); setTimeout(() => w.print(), 300)
  }

  return (
    <div className="grid lg:grid-cols-[320px_1fr] gap-5 items-start">
      <form className="card flex flex-col gap-2.5 lg:sticky lg:top-20" onSubmit={(e) => e.preventDefault()}>
        <h2 className="m-0 text-base">Datos</h2>
        {campos.map((c) => (
          <label key={c.k} className="lbl text-xs">{c.l}<input className="inp !py-2" value={v[c.k] ?? ""} placeholder={c.ph} onChange={(e) => { setEditado(false); setV((p) => ({ ...p, [c.k]: e.target.value })) }} /></label>
        ))}
        <p className="m-0 text-xs text-[var(--gris)]">Lo amarillo es lo que falta completar. Si editás el texto a mano, los datos del formulario dejan de actualizar el documento.</p>
      </form>
      <div className="flex flex-col gap-3 min-w-0">
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-p" onClick={word}>Descargar en Word</button>
          <button type="button" className="btn-s" onClick={imprimir}>Imprimir / guardar PDF</button>
          <button type="button" className="btn-s" onClick={() => navigator.clipboard.writeText(doc.current?.innerText ?? "")}>Copiar texto</button>
        </div>
        <div
          ref={doc}
          contentEditable
          suppressContentEditableWarning
          onInput={() => setEditado(true)}
          className="card !p-8 bg-white text-[15px] leading-relaxed outline-none focus:ring-2 focus:ring-[var(--ac)] [&_mark]:bg-amber-200"
          dangerouslySetInnerHTML={{ __html: html + firma }}
          key={editado ? "libre" : JSON.stringify(v)}
        />
      </div>
    </div>
  )
}
