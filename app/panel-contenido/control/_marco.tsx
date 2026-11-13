"use client"
import { useEffect, useRef, useState } from "react"

/** Marco de la infografía: aislado (sin acceso a la sesión) y con el alto que informa la propia página. */
export function Marco({ src, titulo }: { src: string; titulo: string }) {
  const ref = useRef<HTMLIFrameElement>(null)
  const [alto, setAlto] = useState(1400)
  useEffect(() => {
    const f = (e: MessageEvent) => {
      if (e.source !== ref.current?.contentWindow) return
      const h = Number((e.data as any)?.controlAlto)
      if (Number.isFinite(h) && h > 200 && h < 30000) setAlto(Math.ceil(h))
    }
    window.addEventListener("message", f)
    return () => window.removeEventListener("message", f)
  }, [])
  return <iframe ref={ref} src={src} title={titulo} sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox" loading="lazy" className="cm-marco" style={{ height: alto }} />
}
