import type { Metadata } from "next"

export const metadata: Metadata = { title: "Mi cuenta", robots: { index: false, follow: false } }

/** Espacio del alumno dentro de ACADEMIA DEVISEBIT (academia.devisebit.com/mi-cuenta): mismo header y pie que el sitio público. */
export default function MiCuentaLayout({ children }: { children: React.ReactNode }) {
  return <main className="max-w-6xl mx-auto w-full px-4 py-6 sm:py-10">{children}</main>
}
