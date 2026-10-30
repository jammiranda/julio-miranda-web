import type { Metadata } from "next"

export const metadata: Metadata = { title: "Panel de autor", robots: { index: false, follow: false } }

/** Panel de autor (docentes) dentro de ACADEMIA DEVISEBIT: academia.devisebit.com/autor. Cada página valida el acceso. */
export default function AutorLayout({ children }: { children: React.ReactNode }) {
  return <main className="max-w-6xl mx-auto w-full px-4 py-6 sm:py-10">{children}</main>
}
