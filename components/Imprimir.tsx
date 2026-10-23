"use client"
export default function Imprimir({ texto = "Imprimir / PDF" }: { texto?: string }) {
  return <button type="button" onClick={() => window.print()} className="btn-s no-print">{texto}</button>
}
