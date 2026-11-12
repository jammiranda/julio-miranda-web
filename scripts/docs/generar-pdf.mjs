// Genera el PDF de «Alta de cliente · Agente de WhatsApp» desde su fuente HTML (necesita Playwright con Chromium en la máquina).
// Uso: node scripts/docs/generar-pdf.mjs
import { createRequire } from "module"
import { fileURLToPath } from "url"
import path from "path"
const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT ?? "playwright")
const aqui = path.dirname(fileURLToPath(import.meta.url))
const b = await chromium.launch()
const p = await b.newPage()
await p.goto("file://" + path.join(aqui, "alta-agente-whatsapp.html"))
await p.pdf({ path: path.join(aqui, "../../public/mv-a7c41e9b3f06/alta-agente-whatsapp-devisebit.pdf"), format: "A4", printBackground: true, preferCSSPageSize: true })
await b.close()
