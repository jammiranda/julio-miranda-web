/** Menú de la Academia (mismo orden en escritorio y en celular). Un ítem con `hijos` es un grupo desplegable. */
export type ItemMenu = { href: string; label: string; detalle?: string }
export type EntradaMenu = ItemMenu | { label: string; hijos: ItemMenu[] }

export const MENU: EntradaMenu[] = [
  { href: "/", label: "Inicio" },
  {
    label: "Aprender",
    hijos: [
      { href: "/cursos", label: "Cursos", detalle: "A tu ritmo, con certificado" },
      { href: "/programas", label: "Programas", detalle: "Programas ejecutivos · próximamente" },
      { href: "/guias", label: "Guías", detalle: "Guías prácticas gratis" },
    ],
  },
  { href: "/videos", label: "Videos" },
  { href: "/equipo", label: "Equipo" },
  { href: "/descargas", label: "Descargas" },
]

export const esGrupo = (e: EntradaMenu): e is { label: string; hijos: ItemMenu[] } => "hijos" in e
/** ¿La ruta actual corresponde a este link? (en el sitio público la ruta interna puede venir con /academia adelante) */
export function activo(ruta: string | null, href: string) {
  const r = (ruta ?? "/").replace(/^\/academia(?=\/|$)/, "") || "/"
  return href === "/" ? r === "/" : r === href || r.startsWith(href + "/")
}
