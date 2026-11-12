import Link from "next/link"

/** 404 dentro de Mi cuenta (proyecto, cobro o curso que no existe o no es de esta cuenta): conserva el menú. */
export default function NoEncontradaPortal() {
  return (
    <div className="card max-w-lg mx-auto my-8 flex flex-col gap-3 text-center">
      <p className="m-0 text-sm font-bold uppercase tracking-[0.14em] text-[var(--ac-texto)]">Error 404</p>
      <h1 className="m-0 text-2xl">No encontramos esa página</h1>
      <p className="m-0 text-[var(--gris)]">Puede que el link esté mal escrito o que corresponda a otra cuenta.</p>
      <Link href="/portal" className="btn-p mt-2">Ir al inicio de Mi cuenta</Link>
      <p className="m-0 text-sm text-[var(--gris)]">¿Necesitás ayuda? <a href="https://wa.me/5491173466490" target="_blank" rel="noopener noreferrer" className="font-semibold text-[var(--ac-texto)] underline">Escribinos por WhatsApp</a></p>
    </div>
  )
}
