import { REDES } from "@/lib/redes"

const ICONO: Record<string, JSX.Element> = {
  instagram: <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" /></svg>,
  linkedin: <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.06c.53-1 1.83-2.06 3.76-2.06C20.6 8.64 21 11.2 21 14.5V21h-4v-5.8c0-1.38-.03-3.16-1.93-3.16-1.93 0-2.22 1.5-2.22 3.06V21H9z" /></svg>,
  youtube: <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden="true"><path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12 31 31 0 0 0 1 16.8a3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8zM9.75 15.02V8.98L15.5 12z" /></svg>,
  blog: <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M4 4h12a2 2 0 0 1 2 2v14H6a2 2 0 0 1-2-2z" /><path d="M18 8h2v10a2 2 0 0 1-2 2M8 8h6M8 12h6M8 16h4" /></svg>,
}

/** Íconos de las redes de DEVISEBIT. Siempre abren en otra pestaña. */
export default function Redes({ oscuro = false, conTexto = false, className = "" }: { oscuro?: boolean; conTexto?: boolean; className?: string }) {
  return (
    <ul className={`m-0 p-0 list-none flex flex-wrap gap-2 ${className}`} aria-label="Redes de DEVISEBIT">
      {REDES.map((r) => (
        <li key={r.id}>
          <a
            href={r.href} target="_blank" rel="noopener noreferrer"
            aria-label={`${r.nombre} de DEVISEBIT (se abre en otra pestaña)`} title={`${r.nombre} · ${r.usuario}`}
            className={`${conTexto ? "px-3 gap-2" : "w-9 justify-center"} h-9 rounded-xl border inline-flex items-center transition-colors ${oscuro ? "border-white/15 text-white/75 hover:border-[#FF6A63] hover:text-white" : "border-[#C3C8D1] bg-white text-[#262C37] hover:border-[#C8231F] hover:text-[#C8231F]"}`}
          >
            {ICONO[r.id]}
            {conTexto && <span className="text-xs font-semibold">{r.nombre}</span>}
          </a>
        </li>
      ))}
    </ul>
  )
}
