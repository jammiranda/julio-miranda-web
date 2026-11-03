/** Carita de persona (SVG) para listas y organigrama: mismo estilo que los muñecos de la torre. */
const SKIN = ["#f1c9a5", "#e0ac82", "#c68863", "#9a6a47", "#f6d7bd"]
const HAIR = ["#2b2118", "#4a3224", "#1c1c22", "#8a5a2b", "#b88b4a", "#6b2d2d"]
const MUJ = new Set(["barbara", "jime", "georgina", "debora"])
function hsh(s: string) { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h) }
export function cara(id: string, color = "#8a919e", ia = false) {
  const h = hsh(id), skin = SKIN[h % SKIN.length], hair = HAIR[(h >> 3) % HAIR.length], mujer = MUJ.has(id)
  const pelo = mujer
    ? `<path d="M14 36c-1-16 7-24 18-24s19 8 18 24c0 4-1 8-3 12 0-10-3-18-15-18S17 38 17 48c-2-4-3-8-3-12z" fill="${hair}"/>`
    : `<path d="M16 32c0-13 7-20 16-20s16 7 16 20c-5-6-10-8-16-8s-11 2-16 8z" fill="${hair}"/>`
  const aur = ia ? `<path d="M14 34a18 18 0 0 1 36 0" fill="none" stroke="#161a26" stroke-width="3.5"/><rect x="10" y="32" width="7" height="10" rx="3" fill="#161a26"/><rect x="47" y="32" width="7" height="10" rx="3" fill="#161a26"/>` : ""
  return `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M6 64c0-12 10-18 26-18s26 6 26 18z" fill="${color}"/><circle cx="32" cy="32" r="14" fill="${skin}"/>${pelo}<circle cx="27" cy="33" r="1.8" fill="#151515"/><circle cx="37" cy="33" r="1.8" fill="#151515"/><path d="M28 40q4 3 8 0" fill="none" stroke="#8a3b3b" stroke-width="1.6" stroke-linecap="round"/>${aur}</svg>`
}
