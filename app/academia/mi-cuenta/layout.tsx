import type { Metadata } from "next"

export const metadata: Metadata = { title: "Mi cuenta", robots: { index: false, follow: false } }

export default function MiCuentaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-espacio="academia" className="rounded-[28px] mx-2 sm:mx-4 my-4">
      <main className="max-w-6xl mx-auto w-full px-4 py-6 sm:py-10">{children}</main>
    </div>
  )
}
