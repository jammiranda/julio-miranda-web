export default function Avatar({ nombre, foto, size = 36 }: { nombre: string; foto?: string | null; size?: number }) {
  const ini = nombre.split(/\s+/).filter(Boolean).slice(0, 2).map((x) => x[0]?.toUpperCase()).join("")
  return foto ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={foto} alt="" width={size} height={size} className="rounded-full object-cover ring-2 ring-[#C8231F]/30" style={{ width: size, height: size }} />
  ) : (
    <span className="rounded-full bg-gradient-to-br from-[#C8231F] to-[#9E1A17] text-white font-bold flex items-center justify-center ring-2 ring-[#C8231F]/20" style={{ width: size, height: size, fontSize: size * 0.38 }} aria-hidden="true">{ini || "?"}</span>
  )
}
