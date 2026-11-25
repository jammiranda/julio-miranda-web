// MateCuentas · landing 3D (three.js). Si no hay WebGL, quedan los logos planos.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mouse = { x: 0, y: 0 };
addEventListener('pointermove', (e) => { mouse.x = (e.clientX / innerWidth) * 2 - 1; mouse.y = (e.clientY / innerHeight) * 2 - 1; }, { passive: true });

// Mate de la familia (misma forma que MateBot), con color y accesorio propio.
function makeMate({ color, color2, coin }) {
  const g = new THREE.Group();
  const prof = [[0, -1], [0.42, -0.96], [0.76, -0.78], [0.95, -0.42], [0.99, -0.05], [0.92, 0.3], [0.78, 0.55], [0.7, 0.72], [0.72, 0.8]].map(([x, y]) => new THREE.Vector2(x, y));
  const body = new THREE.Mesh(new THREE.LatheGeometry(new THREE.SplineCurve(prof).getPoints(80), 128),
    new THREE.MeshPhysicalMaterial({ color, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.12, sheen: 0.5, sheenColor: new THREE.Color(color2) }));
  g.add(body);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.065, 24, 96), new THREE.MeshStandardMaterial({ color: 0x14241a, metalness: 0.6, roughness: 0.35 }));
  ring.rotation.x = Math.PI / 2; ring.position.y = 0.8; g.add(ring);
  const yerba = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.68, 0.04, 64), new THREE.MeshStandardMaterial({ color: 0x6d8f1f, roughness: 0.95 }));
  yerba.position.y = 0.79; g.add(yerba);
  const bomb = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: 0xe8e8e8, metalness: 1, roughness: 0.18 });
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.5, 24), metal); tube.position.y = 0.75; bomb.add(tube);
  let tip;
  if (coin) { tip = coinMesh(0.2); tip.rotation.x = Math.PI / 2; tip.position.y = 1.58; }
  else tip = new THREE.Mesh(new THREE.SphereGeometry(0.1, 32, 32), new THREE.MeshPhysicalMaterial({ color: 0xff1e2d, roughness: 0.2, clearcoat: 1, emissive: 0x550005 }));
  if (!coin) tip.position.y = 1.52;
  bomb.add(tip); bomb.position.set(0.18, 0.55, -0.1); bomb.rotation.z = -0.38; g.add(bomb);
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25, emissive: 0x222222 });
  const eyes = [-0.22, 0.22].map((x) => { const e = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.13, 8, 24), eyeMat); e.position.set(x, -0.08, 0.93); g.add(e); return e; });
  return { g, eyes, bomb, tip };
}

let coinTex;
function coinTexture() {
  if (coinTex) return coinTex;
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  const gr = x.createRadialGradient(90, 80, 20, 128, 128, 128); gr.addColorStop(0, '#ffe794'); gr.addColorStop(0.6, '#f5b82e'); gr.addColorStop(1, '#b97c08');
  x.fillStyle = gr; x.fillRect(0, 0, 256, 256);
  x.strokeStyle = 'rgba(122,82,0,.55)'; x.lineWidth = 10; x.beginPath(); x.arc(128, 128, 104, 0, Math.PI * 2); x.stroke();
  x.fillStyle = '#7a5200'; x.font = '900 150px Arial Black, Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('$', 128, 138);
  coinTex = new THREE.CanvasTexture(c); coinTex.colorSpace = THREE.SRGBColorSpace; return coinTex;
}
function coinMesh(r = 0.22) {
  const face = new THREE.MeshStandardMaterial({ map: coinTexture(), metalness: 0.55, roughness: 0.28 });
  const edge = new THREE.MeshStandardMaterial({ color: 0xd9a01e, metalness: 0.8, roughness: 0.3 });
  return new THREE.Mesh(new THREE.CylinderGeometry(r, r, r * 0.22, 48), [edge, face, face]);
}

function stage(el, camZ = 6.3) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping;
  el.appendChild(renderer.domElement); el.classList.add('live');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 60); camera.position.set(0, 0.45, camZ); camera.lookAt(0, 0.35, 0);
  const resize = () => { const w = el.clientWidth, h = el.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); };
  new ResizeObserver(resize).observe(el); resize();
  let visible = false; new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { rootMargin: '80px' }).observe(el);
  return { renderer, scene, camera, isVisible: () => visible };
}
function blinker() { let next = 2 + Math.random() * 2; return (t) => { if (t > next) { const k = (t - next) / 0.16; if (k >= 1) { next = t + 2.5 + Math.random() * 2.5; return 1; } return Math.abs(1 - 2 * k) * 0.9 + 0.1; } return 1; }; }

// ---------- Hero: MateCuentas con monedas en órbita ----------
function hero(el) {
  const { renderer, scene, camera, isVisible } = stage(el, 7.2);
  scene.add(new THREE.AmbientLight(0xffffff, 0.8));
  const key = new THREE.DirectionalLight(0xffffff, 2.8); key.position.set(-2.5, 3, 4); scene.add(key);
  const rim = new THREE.DirectionalLight(0xf5c14a, 2.6); rim.position.set(3, 1.5, -3); scene.add(rim);
  const fill = new THREE.PointLight(0x3fcf7c, 1.4, 10); fill.position.set(-3, -2, 2); scene.add(fill);
  const m = makeMate({ color: 0x17a352, color2: 0x7dffb0, coin: true }); scene.add(m.g);
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.95, 48), new THREE.MeshBasicMaterial({ color: 0x0f2418, transparent: true, opacity: 0.14 }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -1.38; scene.add(shadow);
  const coins = Array.from({ length: 9 }, (_, i) => { const c = coinMesh(0.17 + (i % 3) * 0.03); c.userData = { a: (i / 9) * Math.PI * 2, r: 1.75 + (i % 2) * 0.35, y: -0.3 + (i % 3) * 0.45, s: 0.35 + (i % 4) * 0.08, spin: 1 + Math.random() * 2 }; scene.add(c); return c; });
  const drop = coinMesh(0.16); scene.add(drop); let dropT = 0;
  const blink = blinker(); const t0 = performance.now();
  const loop = (now) => {
    requestAnimationFrame(loop);
    if (!isVisible()) return;
    const t = (now - t0) / 1000; const k = reduce ? 0 : 1;
    m.g.rotation.y += ((Math.sin(t * 0.5) * 0.4 + mouse.x * 0.45) * k - m.g.rotation.y) * 0.05;
    m.g.rotation.x += (mouse.y * 0.12 * k - m.g.rotation.x) * 0.05;
    m.g.position.y = Math.sin(t * 1.3) * 0.08 * k;
    shadow.scale.setScalar(1 - Math.sin(t * 1.3) * 0.06 * k);
    m.bomb.rotation.z = -0.38 + Math.sin(t * 2.1) * 0.05 * k; m.tip.rotation.z = t * 1.5 * k;
    const s = blink(t); m.eyes.forEach((e) => (e.scale.y = s));
    for (const c of coins) { const u = c.userData; const a = u.a + t * u.s * k; c.position.set(Math.cos(a) * u.r, u.y + Math.sin(t * 1.4 + u.a) * 0.12, Math.sin(a) * u.r * 0.55); c.rotation.set(Math.PI / 2 + Math.sin(t + u.a) * 0.4, t * u.spin * k, 0); }
    // una moneda cae dentro del mate cada tanto
    dropT = (t % 3.2) / 3.2; const p = Math.min(1, dropT * 1.6);
    drop.position.set(0.05, 2.6 - p * 2.0, 0.05); drop.rotation.set(t * 4, t * 3, 0); drop.visible = dropT < 0.62 && !reduce;
    renderer.render(scene, camera);
  };
  requestAnimationFrame(loop);
}

// ---------- MateBot entrando por la ventana ----------
function window3d(el) {
  const { renderer, scene, camera, isVisible } = stage(el, 8.2);
  scene.add(new THREE.AmbientLight(0xffffff, 0.75));
  const key = new THREE.DirectionalLight(0xffffff, 3); key.position.set(-2.5, 3, 4); scene.add(key);
  const rim = new THREE.DirectionalLight(0xff2a36, 3.2); rim.position.set(3, 1.5, -3); scene.add(rim);
  const m = makeMate({ color: 0xe30613, color2: 0xff8a8a, coin: false }); scene.add(m.g);
  m.g.position.set(3.4, -0.2, 0); m.g.rotation.z = 0.5;
  const blink = blinker(); const t0 = performance.now(); let enter = 0; let seen = false;
  const io = new IntersectionObserver(([e]) => { if (e.isIntersecting && e.intersectionRatio > 0.35) seen = true; }, { threshold: [0, 0.35, 0.6] }); io.observe(el);
  const loop = (now) => {
    requestAnimationFrame(loop);
    if (!isVisible()) return;
    const t = (now - t0) / 1000;
    if (seen) enter = Math.min(1, enter + (reduce ? 1 : 0.012));
    const e = 1 - Math.pow(1 - enter, 3); // ease out
    const hop = Math.sin(Math.min(1, enter) * Math.PI) * 0.6;
    m.g.position.x = 3.4 - e * 3.3; m.g.position.y = -0.2 + hop + (enter >= 1 ? Math.sin(t * 1.6) * 0.07 : 0);
    m.g.rotation.z = 0.5 * (1 - e) + (enter >= 1 ? Math.sin(t * 0.9) * 0.05 : 0);
    m.g.rotation.y += ((-0.5 + e * 0.5 + mouse.x * 0.35) - m.g.rotation.y) * 0.06;
    m.bomb.rotation.z = -0.38 + Math.sin(t * 2.4) * 0.05;
    const s = blink(t); m.eyes.forEach((x) => (x.scale.y = s));
    renderer.render(scene, camera);
  };
  requestAnimationFrame(loop);
}

try {
  const test = document.createElement('canvas');
  if (!(test.getContext('webgl2') || test.getContext('webgl'))) throw new Error('sin webgl');
  const h = document.getElementById('hero3d'); if (h) hero(h);
  const w = document.getElementById('win3d'); if (w) window3d(w);
} catch (e) { document.documentElement.classList.add('no3d'); }
