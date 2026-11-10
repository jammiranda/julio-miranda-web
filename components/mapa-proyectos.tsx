"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import type * as TRES from "three"
import { GALAXIAS as GALAXIAS_ES, TOTAL_NODOS as TOTAL_NODOS_ES, type Galaxia, type Nodo } from "@/lib/mapa-datos"
import { GALAXIAS_EN, TOTAL_NODOS_EN } from "@/lib/mapa-datos-en"

/**
 * Mapa 3D de proyectos: cada sector es una galaxia y cada proyecto o cliente, un nodo.
 * Se navega arrastrando (rotar), con los botones +/− o pellizcando (zoom) y tocando un nodo.
 * Sin WebGL, o con "reducir movimiento", queda la vista lista (que además siempre está debajo).
 */

// La librería 3D (unos 140 kB) se descarga aparte, después de que la página ya se ve
let THREE: typeof TRES

type Motor = {
  enfocarGalaxia: (id: string | null) => void
  seleccionar: (id: string | null) => void
  zoom: (factor: number) => void
}

const brillo = (() => {
  let tex: TRES.CanvasTexture | null = null
  return () => {
    if (tex) return tex
    const c = document.createElement("canvas")
    c.width = c.height = 128
    const g = c.getContext("2d")!
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64)
    grad.addColorStop(0, "rgba(255,255,255,1)")
    grad.addColorStop(0.25, "rgba(255,255,255,0.55)")
    grad.addColorStop(1, "rgba(255,255,255,0)")
    g.fillStyle = grad
    g.fillRect(0, 0, 128, 128)
    tex = new THREE.CanvasTexture(c)
    return tex
  }
})()

function webglDisponible() {
  try {
    const c = document.createElement("canvas")
    return !!(c.getContext("webgl2") || c.getContext("webgl"))
  } catch {
    return false
  }
}

const TXT = {
  es: {
    section: "Mapa 3D de proyectos",
    kicker: "Mapa de proyectos",
    title: (n: number, g: number) => `Explorá ${n} proyectos en ${g} sectores`,
    hint: "Arrastrá para girar. Tocá un sector o un punto de luz.",
    zoomIn: "Acercar",
    zoomOut: "Alejar",
    all: "Todo",
    allAria: "Ver todos los sectores",
    goTo: "Ir a un sector",
    list: "Ver como lista ↓",
    listHref: "#todos",
    close: "Cerrar",
    cta: "Quiero algo así",
    ctaHref: "/contacto#formulario",
    loading: "Cargando el mapa…",
    noGl: "Tu dispositivo no puede mostrar el 3D. Mirá los proyectos en la lista de abajo.",
    count: (n: number) => `${n} proyectos`,
  },
  en: {
    section: "3D project map",
    kicker: "Project map",
    title: (n: number, g: number) => `Explore ${n} projects across ${g} sectors`,
    hint: "Drag to rotate. Tap a sector or a point of light.",
    zoomIn: "Zoom in",
    zoomOut: "Zoom out",
    all: "All",
    allAria: "Show all sectors",
    goTo: "Jump to a sector",
    list: "View as a list ↓",
    listHref: "#casos",
    close: "Close",
    cta: "I want something like this",
    ctaHref: "/en/contact#formulario",
    loading: "Loading the map…",
    noGl: "Your device can't display the 3D map. Browse the projects in the list below.",
    count: (n: number) => `${n} projects`,
  },
} as const

const buscar = (GALAXIAS: Galaxia[], id: string): { g: Galaxia; n: Nodo } | null => {
  for (const g of GALAXIAS) {
    const n = g.nodos.find((x) => x.id === id)
    if (n) return { g, n }
  }
  return null
}

export default function MapaProyectos({ lang = "es" }: { lang?: "es" | "en" } = {}) {
  const GALAXIAS = lang === "en" ? GALAXIAS_EN : GALAXIAS_ES
  const TOTAL_NODOS = lang === "en" ? TOTAL_NODOS_EN : TOTAL_NODOS_ES
  const T = TXT[lang]
  const caja = useRef<HTMLDivElement>(null)
  const lienzo = useRef<HTMLCanvasElement>(null)
  const motor = useRef<Motor | null>(null)
  const etiquetasGalaxia = useRef<Record<string, HTMLButtonElement | null>>({})
  const etiquetaHover = useRef<HTMLDivElement>(null)
  const [sel, setSel] = useState<string | null>(null)
  const [foco, setFoco] = useState<string | null>(null)
  const [sinWebgl, setSinWebgl] = useState(false)
  const [listo, setListo] = useState(false)
  const selRef = useRef<string | null>(null)

  const seleccionar = useCallback((id: string | null) => {
    selRef.current = id
    setSel(id)
    if (id) {
      const f = buscar(GALAXIAS, id)
      if (f) setFoco(f.g.id)
    }
    motor.current?.seleccionar(id)
  }, [GALAXIAS])

  const enfocar = useCallback((id: string | null) => {
    setFoco(id)
    setSel(null)
    selRef.current = null
    motor.current?.seleccionar(null)
    motor.current?.enfocarGalaxia(id)
  }, [])

  useEffect(() => {
    let limpiar: (() => void) | undefined
    let cancelado = false
    import("three").then((m) => { if (cancelado) return; THREE = m; limpiar = iniciar() }).catch(() => setSinWebgl(true))
    return () => { cancelado = true; limpiar?.() }

    function iniciar(): (() => void) | undefined {
    const cont = caja.current
    const cv = lienzo.current
    if (!cont || !cv) return
    if (!webglDisponible()) {
      setSinWebgl(true)
      return
    }
    const reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, powerPreference: "high-performance" })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setClearColor(0x000000, 0)
    const escena = new THREE.Scene()
    escena.fog = new THREE.FogExp2(0x05060a, 0.011)
    const camara = new THREE.PerspectiveCamera(55, 1, 0.1, 400)

    // ── Estrellas de fondo
    {
      const n = 1800
      const pos = new Float32Array(n * 3)
      for (let i = 0; i < n; i++) {
        const r = 70 + Math.random() * 90
        const t = Math.random() * Math.PI * 2
        const p = Math.acos(2 * Math.random() - 1)
        pos[i * 3] = r * Math.sin(p) * Math.cos(t)
        pos[i * 3 + 1] = r * Math.cos(p)
        pos[i * 3 + 2] = r * Math.sin(p) * Math.sin(t)
      }
      const geo = new THREE.BufferGeometry()
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3))
      const mat = new THREE.PointsMaterial({ color: 0x9aa6c4, size: 0.28, sizeAttenuation: true, transparent: true, opacity: 0.7, depthWrite: false, fog: false })
      escena.add(new THREE.Points(geo, mat))
    }

    // ── Galaxias y nodos
    const mallasNodo: TRES.Mesh[] = []
    const posNodo = new Map<string, TRES.Vector3>()
    const grupoNodo = new Map<string, { malla: TRES.Mesh; halo: TRES.Sprite; base: number }>()
    const centros = new Map<string, TRES.Vector3>()
    const dorada = Math.PI * (3 - Math.sqrt(5))

    GALAXIAS.forEach((gx, gi) => {
      const centro = new THREE.Vector3(...gx.pos)
      centros.set(gx.id, centro)
      const color = new THREE.Color(gx.color)
      const grupo = new THREE.Group()
      grupo.position.copy(centro)
      escena.add(grupo)

      const nucleo = new THREE.Sprite(new THREE.SpriteMaterial({ map: brillo(), color, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }))
      nucleo.scale.setScalar(6.5)
      grupo.add(nucleo)

      // polvo en forma de disco con brazos
      const nPolvo = 520
      const pp = new Float32Array(nPolvo * 3)
      for (let i = 0; i < nPolvo; i++) {
        const r = 0.6 + Math.pow(Math.random(), 0.7) * 5.2
        const brazo = (i % 3) * ((Math.PI * 2) / 3)
        const a = brazo + r * 0.55 + (Math.random() - 0.5) * 0.9
        pp[i * 3] = Math.cos(a) * r
        pp[i * 3 + 1] = (Math.random() - 0.5) * 1.1 * (1 - r / 7)
        pp[i * 3 + 2] = Math.sin(a) * r
      }
      const gp = new THREE.BufferGeometry()
      gp.setAttribute("position", new THREE.BufferAttribute(pp, 3))
      grupo.add(new THREE.Points(gp, new THREE.PointsMaterial({ color, size: 0.1, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending })))

      // nodos: esfera de Fibonacci achatada + giro
      const total = gx.nodos.length
      const puntos: TRES.Vector3[] = []
      gx.nodos.forEach((nd, i) => {
        const y = total === 1 ? 0 : 1 - (i / (total - 1)) * 2
        const rad = Math.sqrt(1 - y * y)
        const th = dorada * i + gi
        const R = 3.1 + (i % 3) * 0.55
        const p = new THREE.Vector3(Math.cos(th) * rad * R, y * R * 0.55, Math.sin(th) * rad * R)
        puntos.push(p)
        const tam = nd.destacado ? 0.46 : 0.3
        const malla = new THREE.Mesh(
          new THREE.SphereGeometry(tam, 24, 24),
          new THREE.MeshBasicMaterial({ color: color.clone().lerp(new THREE.Color(0xffffff), 0.35) }),
        )
        malla.position.copy(p)
        malla.userData.id = nd.id
        grupo.add(malla)
        // zona de toque más grande que la esfera
        const toque = new THREE.Mesh(new THREE.SphereGeometry(0.62, 8, 8), new THREE.MeshBasicMaterial({ visible: false }))
        toque.position.copy(p)
        toque.userData.id = nd.id
        grupo.add(toque)
        mallasNodo.push(toque)
        const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: brillo(), color, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }))
        halo.scale.setScalar(tam * 7)
        halo.position.copy(p)
        grupo.add(halo)
        grupoNodo.set(nd.id, { malla, halo, base: tam })
        posNodo.set(nd.id, p.clone().add(centro))
      })

      // hilos del núcleo a cada nodo
      const lp: number[] = []
      puntos.forEach((p) => lp.push(0, 0, 0, p.x, p.y, p.z))
      const lg = new THREE.BufferGeometry()
      lg.setAttribute("position", new THREE.Float32BufferAttribute(lp, 3))
      grupo.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending })))
    })

    // red entre galaxias
    {
      const lp: number[] = []
      const arr = GALAXIAS.map((g) => centros.get(g.id)!)
      arr.forEach((a, i) => {
        const b = arr[(i + 1) % arr.length]
        lp.push(a.x, a.y, a.z, b.x, b.y, b.z)
        const c = arr[(i + 2) % arr.length]
        lp.push(a.x, a.y, a.z, c.x, c.y, c.z)
      })
      const lg = new THREE.BufferGeometry()
      lg.setAttribute("position", new THREE.Float32BufferAttribute(lp, 3))
      escena.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0x5a6378, transparent: true, opacity: 0.16, depthWrite: false })))
    }

    // anillo del nodo seleccionado
    const anillo = new THREE.Mesh(new THREE.RingGeometry(0.62, 0.7, 48), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false }))
    anillo.visible = false
    escena.add(anillo)

    // ── Cámara orbital
    const est = {
      theta: 0.6, phi: 1.22, radio: 31,
      tTheta: 0.6, tPhi: 1.22, tRadio: 31,
      objetivo: new THREE.Vector3(0, 0, 0),
      tObjetivo: new THREE.Vector3(0, 0, 0),
      ultimo: performance.now(),
      arrastrando: false,
    }
    const RMIN = 7, RMAX = 62

    const redimensionar = () => {
      const w = cont.clientWidth, h = cont.clientHeight
      renderer.setSize(w, h, false)
      camara.aspect = w / h
      camara.fov = w / h < 0.8 ? 70 : 55
      camara.updateProjectionMatrix()
    }
    const ro = new ResizeObserver(redimensionar)
    ro.observe(cont)
    redimensionar()

    // ── Entrada: arrastrar / pellizcar / tocar
    const punteros = new Map<number, { x: number; y: number }>()
    let distPellizco = 0
    let movido = 0
    let hoverId: string | null = null
    const ray = new THREE.Raycaster()
    const v2 = new THREE.Vector2()

    const nodoEn = (cx: number, cy: number): string | null => {
      const r = cv.getBoundingClientRect()
      v2.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1)
      ray.setFromCamera(v2, camara)
      const hit = ray.intersectObjects(mallasNodo, false)[0]
      return hit ? (hit.object.userData.id as string) : null
    }

    const abajo = (e: PointerEvent) => {
      cv.setPointerCapture(e.pointerId)
      punteros.set(e.pointerId, { x: e.clientX, y: e.clientY })
      est.arrastrando = true
      movido = 0
      est.ultimo = performance.now()
      if (punteros.size === 2) {
        const [a, b] = [...punteros.values()]
        distPellizco = Math.hypot(a.x - b.x, a.y - b.y)
      }
    }
    const mover = (e: PointerEvent) => {
      const p = punteros.get(e.pointerId)
      if (!p) {
        if (e.pointerType === "mouse") {
          const id = nodoEn(e.clientX, e.clientY)
          if (id !== hoverId) {
            hoverId = id
            cv.style.cursor = id ? "pointer" : "grab"
          }
        }
        return
      }
      const dx = e.clientX - p.x, dy = e.clientY - p.y
      p.x = e.clientX; p.y = e.clientY
      est.ultimo = performance.now()
      if (punteros.size === 1) {
        movido += Math.abs(dx) + Math.abs(dy)
        est.tTheta -= dx * 0.006
        est.tPhi = Math.min(2.4, Math.max(0.5, est.tPhi - dy * 0.005))
      } else if (punteros.size === 2) {
        const [a, b] = [...punteros.values()]
        const d = Math.hypot(a.x - b.x, a.y - b.y)
        if (distPellizco) est.tRadio = Math.min(RMAX, Math.max(RMIN, est.tRadio * (distPellizco / d)))
        distPellizco = d
        movido += 10
      }
    }
    const arriba = (e: PointerEvent) => {
      const eraUno = punteros.size === 1
      punteros.delete(e.pointerId)
      if (punteros.size < 2) distPellizco = 0
      if (punteros.size === 0) est.arrastrando = false
      if (eraUno && movido < 8) {
        const id = nodoEn(e.clientX, e.clientY)
        // se actualiza el estado de React; el motor se entera por seleccionar()
        window.dispatchEvent(new CustomEvent("mapa:toque", { detail: id }))
      }
    }
    cv.addEventListener("pointerdown", abajo)
    cv.addEventListener("pointermove", mover)
    cv.addEventListener("pointerup", arriba)
    cv.addEventListener("pointercancel", arriba)

    // ── API
    motor.current = {
      enfocarGalaxia: (id) => {
        if (!id) {
          est.tObjetivo.set(0, 0, 0); est.tRadio = 31; est.tPhi = 1.22
        } else {
          est.tObjetivo.copy(centros.get(id)!); est.tRadio = 15
        }
      },
      seleccionar: (id) => {
        if (!id) { anillo.visible = false; return }
        const p = posNodo.get(id)
        if (!p) return
        est.tObjetivo.copy(p)
        est.tRadio = Math.min(est.tRadio, 11)
        anillo.visible = true
      },
      zoom: (f) => { est.tRadio = Math.min(RMAX, Math.max(RMIN, est.tRadio * f)) },
    }

    // ── Bucle
    let raf = 0
    let vivo = true
    const t0 = performance.now()
    const tmp = new THREE.Vector3()
    const ancla = new THREE.Vector3()

    const cuadro = () => {
      if (!vivo) return
      raf = requestAnimationFrame(cuadro)
      const ahora = performance.now()
      const t = (ahora - t0) / 1000

      if (!reducir && !est.arrastrando && !selRef.current && ahora - est.ultimo > 3500) est.tTheta += 0.0012
      const k = reducir ? 1 : 0.07
      est.theta += (est.tTheta - est.theta) * k
      est.phi += (est.tPhi - est.phi) * k
      est.radio += (est.tRadio - est.radio) * k
      est.objetivo.lerp(est.tObjetivo, k)

      camara.position.set(
        est.objetivo.x + est.radio * Math.sin(est.phi) * Math.sin(est.theta),
        est.objetivo.y + est.radio * Math.cos(est.phi),
        est.objetivo.z + est.radio * Math.sin(est.phi) * Math.cos(est.theta),
      )
      camara.lookAt(est.objetivo)

      // pulso de los nodos y del anillo
      grupoNodo.forEach((o, id) => {
        const esSel = id === selRef.current
        const esHover = id === hoverId
        const s = o.base * (esSel ? 1.5 : esHover ? 1.3 : 1) * (reducir ? 1 : 1 + Math.sin(t * 2 + o.base * 20) * 0.06)
        o.malla.scale.setScalar(s / o.base)
        o.halo.scale.setScalar(s * 7 * (esSel ? 1.4 : 1))
      })
      if (anillo.visible && selRef.current) {
        const p = posNodo.get(selRef.current)!
        anillo.position.copy(p)
        anillo.quaternion.copy(camara.quaternion)
        anillo.scale.setScalar(1 + (reducir ? 0 : Math.sin(t * 3) * 0.08))
      }

      // etiquetas HTML ancladas a las galaxias y al nodo bajo el cursor
      const w = cont.clientWidth, h = cont.clientHeight
      GALAXIAS.forEach((g) => {
        const el = etiquetasGalaxia.current[g.id]
        if (!el) return
        ancla.copy(centros.get(g.id)!).project(camara)
        const visible = ancla.z < 1 && Math.abs(ancla.x) < 1.1 && Math.abs(ancla.y) < 1.1
        const dist = camara.position.distanceTo(centros.get(g.id)!)
        el.style.opacity = visible ? String(Math.max(0.25, Math.min(1, 40 / dist))) : "0"
        el.style.pointerEvents = visible ? "auto" : "none"
        el.style.transform = `translate(-50%, -50%) translate(${((ancla.x + 1) / 2) * w}px, ${((1 - ancla.y) / 2) * h - 34}px)`
      })
      const eh = etiquetaHover.current
      if (eh) {
        if (hoverId && posNodo.has(hoverId)) {
          tmp.copy(posNodo.get(hoverId)!).project(camara)
          eh.textContent = buscar(GALAXIAS, hoverId)?.n.t ?? ""
          eh.style.opacity = "1"
          eh.style.transform = `translate(-50%, -100%) translate(${((tmp.x + 1) / 2) * w}px, ${((1 - tmp.y) / 2) * h - 16}px)`
        } else eh.style.opacity = "0"
      }

      renderer.render(escena, camara)
    }
    cuadro()
    setListo(true)

    const alToque = (e: Event) => {
      const id = (e as CustomEvent<string | null>).detail
      if (id) seleccionar(id)
      else if (selRef.current) seleccionar(null)
    }
    window.addEventListener("mapa:toque", alToque)

    const visibilidad = () => {
      if (document.hidden) { vivo = false; cancelAnimationFrame(raf) }
      else if (!vivo) { vivo = true; cuadro() }
    }
    document.addEventListener("visibilitychange", visibilidad)

    return () => {
      vivo = false
      cancelAnimationFrame(raf)
      ro.disconnect()
      cv.removeEventListener("pointerdown", abajo)
      cv.removeEventListener("pointermove", mover)
      cv.removeEventListener("pointerup", arriba)
      cv.removeEventListener("pointercancel", arriba)
      window.removeEventListener("mapa:toque", alToque)
      document.removeEventListener("visibilitychange", visibilidad)
      escena.traverse((o) => {
        const m = o as TRES.Mesh
        if (m.geometry) m.geometry.dispose()
        const mat = m.material as TRES.Material | TRES.Material[] | undefined
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose())
        else mat?.dispose()
      })
      renderer.dispose()
      motor.current = null
    }
    }
  }, [seleccionar, GALAXIAS])

  const actual = useMemo(() => (sel ? buscar(GALAXIAS, sel) : null), [sel, GALAXIAS])
  const gFoco = useMemo(() => GALAXIAS.find((g) => g.id === foco) ?? null, [foco, GALAXIAS])

  return (
    <section aria-label={T.section} className="relative bg-[#05060A] text-white overflow-hidden border-y border-white/10">
      <div ref={caja} className="relative h-[78svh] min-h-[520px] max-h-[820px] w-full">
        <canvas ref={lienzo} className="absolute inset-0 w-full h-full cursor-grab touch-none" aria-hidden="true" />

        {/* fondo de luz */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(60% 50% at 50% 55%, rgba(200,35,31,0.10), transparent 70%)" }} />

        {/* etiquetas de galaxias */}
        {GALAXIAS.map((g) => (
          <button
            key={g.id}
            ref={(el) => { etiquetasGalaxia.current[g.id] = el }}
            onClick={() => enfocar(g.id)}
            className="absolute left-0 top-0 z-10 rounded-full border bg-black/55 backdrop-blur px-3 py-1.5 text-[12px] md:text-[13px] font-bold whitespace-nowrap transition-opacity"
            style={{ borderColor: g.color + "88", color: g.color, opacity: 0 }}
          >
            {g.nombre}
          </button>
        ))}
        <div ref={etiquetaHover} aria-hidden="true" className="pointer-events-none absolute left-0 top-0 z-10 max-w-[240px] rounded-lg bg-white text-[#0E1116] px-2.5 py-1.5 text-[12px] font-bold leading-tight shadow-lg transition-opacity" style={{ opacity: 0 }} />

        {/* título */}
        <div className="pointer-events-none absolute left-4 md:left-8 top-4 md:top-6 z-10 max-w-[calc(100%-96px)] md:max-w-[420px]">
          <p className="m-0 text-xs font-bold uppercase tracking-[0.16em] text-[#FF6A63]">{T.kicker}</p>
          <p className="m-0 mt-1 font-tight text-[22px] md:text-[28px] leading-tight font-extrabold">{T.title(TOTAL_NODOS, GALAXIAS.length)}</p>
          <p className="m-0 mt-1 text-[13px] text-[#AEB5C2]">{T.hint}</p>
        </div>

        {/* controles */}
        <div className="absolute right-4 md:right-8 top-4 md:top-6 z-20 flex flex-col gap-2">
          <button onClick={() => motor.current?.zoom(0.75)} aria-label={T.zoomIn} className="w-10 h-10 rounded-xl border border-white/20 bg-black/50 backdrop-blur text-xl font-bold hover:border-[#FF6A63]">+</button>
          <button onClick={() => motor.current?.zoom(1.33)} aria-label={T.zoomOut} className="w-10 h-10 rounded-xl border border-white/20 bg-black/50 backdrop-blur text-xl font-bold hover:border-[#FF6A63]">−</button>
          <button onClick={() => { enfocar(null); setFoco(null) }} aria-label={T.allAria} className="w-10 h-10 rounded-xl border border-white/20 bg-black/50 backdrop-blur text-[11px] font-bold hover:border-[#FF6A63]">{T.all}</button>
        </div>

        {/* galaxias (acceso rápido) */}
        <div className="absolute left-0 right-0 bottom-0 z-10 px-4 md:px-8 pb-4 pt-10 bg-gradient-to-t from-[#05060A] via-[#05060A]/80 to-transparent">
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]" role="group" aria-label={T.goTo}>
            {GALAXIAS.map((g) => (
              <button
                key={g.id}
                onClick={() => enfocar(g.id)}
                aria-pressed={foco === g.id}
                className="shrink-0 rounded-full border px-3.5 py-2 text-[13px] font-semibold transition-colors"
                style={foco === g.id ? { background: g.color, color: "#0B0D12", borderColor: g.color } : { borderColor: "rgba(255,255,255,0.2)", color: "#D3D7DE" }}
              >
                {g.nombre}
              </button>
            ))}
            <a href={T.listHref} className="shrink-0 rounded-full border border-white/20 px-3.5 py-2 text-[13px] font-semibold text-[#D3D7DE] hover:border-[#FF6A63]">{T.list}</a>
          </div>
        </div>

        {/* ficha */}
        {actual && (
          <aside
            role="dialog"
            aria-label={actual.n.t}
            className="absolute z-30 left-3 right-3 bottom-[76px] md:left-auto md:right-8 md:top-[72px] md:bottom-auto md:w-[380px] rounded-2xl border bg-[#0B0D12]/92 backdrop-blur-md p-5 shadow-2xl"
            style={{ borderColor: actual.g.color + "88" }}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="m-0 text-xs font-bold uppercase tracking-[0.14em]" style={{ color: actual.g.color }}>{actual.g.nombre}</p>
              <button onClick={() => seleccionar(null)} aria-label={T.close} className="-mt-1 -mr-1 w-8 h-8 rounded-lg text-lg text-[#AEB5C2] hover:text-white">×</button>
            </div>
            <h2 className="m-0 mt-1 font-tight text-[20px] md:text-[22px] leading-snug font-bold">{actual.n.t}</h2>
            {actual.n.cliente && !actual.n.t.includes(actual.n.cliente) && <p className="m-0 mt-1 text-[13px] text-[#AEB5C2]">{actual.n.cliente}</p>}
            <p className="m-0 mt-3 text-[15px] leading-relaxed text-[#D3D7DE]">{actual.n.d}</p>
            {actual.n.hecho && (
              <p className="m-0 mt-3 rounded-lg px-3 py-2 text-[14px] font-bold" style={{ background: actual.g.color + "22", color: actual.g.color }}>{actual.n.hecho}</p>
            )}
            {actual.n.tags && (
              <ul className="m-0 mt-3 p-0 list-none flex flex-wrap gap-1.5">
                {actual.n.tags.map((t) => <li key={t} className="rounded-full border border-white/15 px-2.5 py-1 text-[12px] text-[#C3C8D1]">{t}</li>)}
              </ul>
            )}
            <Link href={T.ctaHref} className="mt-4 inline-flex w-full justify-center rounded-xl bg-[#C8231F] hover:bg-[#9E1A17] px-4 py-3 text-[15px] font-bold text-white transition-colors">{T.cta}</Link>
          </aside>
        )}

        {!listo && !sinWebgl && <div className="absolute inset-0 grid place-items-center text-sm text-[#AEB5C2]">{T.loading}</div>}
        {sinWebgl && <div className="absolute inset-0 grid place-items-center px-6 text-center text-[15px] text-[#C3C8D1]">{T.noGl}</div>}
      </div>

      {/* detalle del foco actual para lectores de pantalla */}
      <p className="sr-only" aria-live="polite">{gFoco ? `${gFoco.nombre}: ${T.count(gFoco.nodos.length)}` : ""}</p>
    </section>
  )
}
