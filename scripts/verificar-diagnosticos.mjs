// Verifica que lib/diagnosticos-datos.ts sea copia exacta de lib/diagnosticos.ts de la web (salvo el encabezado).
// Uso: node scripts/verificar-diagnosticos.mjs ../julio-miranda-web/lib/diagnosticos.ts
import { readFileSync } from "fs"
const web = process.argv[2]
if (!web) { console.error("Pasá la ruta a lib/diagnosticos.ts de la web"); process.exit(2) }
const cuerpo = (t) => t.split(" * Reglas:")[1]
const ok = cuerpo(readFileSync(web, "utf8")) === cuerpo(readFileSync(new URL("../lib/diagnosticos-datos.ts", import.meta.url), "utf8"))
console.log(ok ? "OK: preguntas y cálculo sincronizados con la web" : "DISTINTOS: copiá lib/diagnosticos.ts de la web a lib/diagnosticos-datos.ts")
process.exit(ok ? 0 : 1)
