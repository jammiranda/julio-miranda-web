import { permanentRedirect } from "next/navigation"
// Redirección permanente (308): le dice a Google que el catálogo ahora vive en /casos-de-exito
export default function TrabajosPage() { permanentRedirect("/casos-de-exito#todos") }
