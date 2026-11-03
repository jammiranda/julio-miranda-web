import type { SVGProps } from "react"

/**
 * Íconos propios de DEVISEBIT. Trazo de 2 px, puntas cuadradas y esquinas en ángulo,
 * para que acompañen la geometría del logo. Son pocos a propósito: controles de la barra
 * y marcas de las redes oficiales. Todo lo demás se explica con texto.
 */
type P = Omit<SVGProps<SVGSVGElement>, "width" | "height"> & { size?: number }

function Base({ size = 20, children, ...rest }: P & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  )
}

export const IcoMenu = (p: P) => (
  <Base {...p}>
    <path d="M3 6h18M3 12h12M3 18h18" />
  </Base>
)

export const IcoCerrar = (p: P) => (
  <Base {...p}>
    <path d="M5 5l14 14M19 5L5 19" />
  </Base>
)

export const IcoDesplegar = (p: P) => (
  <Base {...p}>
    <path d="M5 9l7 7 7-7" />
  </Base>
)

export const IcoInstagram = (p: P) => (
  <Base {...p}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <path d="M17.5 6.5h.01" />
  </Base>
)

export const IcoLinkedin = (p: P) => (
  <Base {...p}>
    <rect x="3" y="3" width="18" height="18" />
    <path d="M8 10.5V17M8 7.5h.01M12 17v-6.5M12 13.5c0-2 1.4-3 3-3s3 1 3 3V17" />
  </Base>
)

export const IcoYoutube = (p: P) => (
  <Base {...p}>
    <rect x="2" y="5" width="20" height="14" rx="4" />
    <path d="M10 9.5v5l4.5-2.5z" />
  </Base>
)

export const IcoBlog = (p: P) => (
  <Base {...p}>
    <path d="M4 4h16v16H4zM8 9h8M8 13h8M8 17h5" />
  </Base>
)
