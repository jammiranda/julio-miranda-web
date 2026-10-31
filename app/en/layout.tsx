import type { ReactNode } from "react"

/** Sección en inglés: marca el idioma del documento para lectores de pantalla y navegadores. */
export default function EnLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: "document.documentElement.lang='en'" }} />
      {children}
    </>
  )
}
