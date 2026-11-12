import Link from "next/link"

/** 404 dentro de la Academia (curso, guía, perfil o producto que no existe): conserva el menú y el pie del sitio. */
export default function NoEncontradaAcademia() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="card max-w-lg w-full flex flex-col gap-3 text-center">
        <p className="m-0 text-sm font-bold uppercase tracking-[0.14em] text-[var(--ac-texto)]">Error 404</p>
        <h1 className="m-0 text-2xl">No encontramos esa página</h1>
        <p className="m-0 text-[var(--gris)]">Puede que el link esté mal escrito o que el contenido ya no esté publicado. Desde acá podés seguir:</p>
        <Link href="/cursos" className="btn-p mt-2">Ver los cursos</Link>
        <div className="flex flex-wrap justify-center gap-2">
          <Link href="/guias" className="btn-s">Guías gratis</Link>
          <Link href="/mi-cuenta" className="btn-s">Mi cuenta</Link>
          <Link href="/" className="btn-s">Inicio</Link>
        </div>
      </div>
    </main>
  )
}
