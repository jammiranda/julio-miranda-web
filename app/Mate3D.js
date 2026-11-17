'use client';
import { useEffect, useRef, useState } from 'react';

// Mate 3D animado de MateBot (three.js). Si el dispositivo no soporta WebGL, muestra el logo plano.
export default function Mate3D({ size = 420 }) {
  const ref = useRef(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    let raf, renderer, cleanup = () => {};
    (async () => {
      try {
        const THREE = await import('three');
        const el = ref.current;
        if (!el) return;
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        el.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
        camera.position.set(0, 0.45, 6.3);
        camera.lookAt(0, 0.35, 0);

        // Luces: key blanca, relleno suave y contraluz roja de marca
        scene.add(new THREE.AmbientLight(0xffffff, 0.75));
        const key = new THREE.DirectionalLight(0xffffff, 3); key.position.set(-2.5, 3, 4); scene.add(key);
        const rim = new THREE.DirectionalLight(0xff2a36, 3.2); rim.position.set(3, 1.5, -3); scene.add(rim);
        const fill = new THREE.PointLight(0x8db33a, 1.2, 10); fill.position.set(-3, -2, 2); scene.add(fill);

        const mate = new THREE.Group();
        scene.add(mate);

        // Calabaza del mate (torno)
        const prof = [[0, -1], [0.42, -0.96], [0.76, -0.78], [0.95, -0.42], [0.99, -0.05], [0.92, 0.3], [0.78, 0.55], [0.7, 0.72], [0.72, 0.8]]
          .map(([x, y]) => new THREE.Vector2(x, y));
        const smooth = new THREE.SplineCurve(prof).getPoints(80);
        const body = new THREE.Mesh(
          new THREE.LatheGeometry(smooth, 128),
          new THREE.MeshPhysicalMaterial({ color: 0xe30613, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.15, sheen: 0.4 }),
        );
        mate.add(body);

        // Virola y yerba
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.065, 24, 96),
          new THREE.MeshStandardMaterial({ color: 0x1b1b1b, metalness: 0.6, roughness: 0.35 }));
        ring.rotation.x = Math.PI / 2; ring.position.y = 0.8; mate.add(ring);
        const yerba = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.68, 0.04, 64),
          new THREE.MeshStandardMaterial({ color: 0x6d8f1f, roughness: 0.95 }));
        yerba.position.y = 0.79; mate.add(yerba);

        // Bombilla
        const bomb = new THREE.Group();
        const metal = new THREE.MeshStandardMaterial({ color: 0xe8e8e8, metalness: 1, roughness: 0.18 });
        const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.5, 24), metal);
        tube.position.y = 0.75; bomb.add(tube);
        const tip = new THREE.Mesh(new THREE.SphereGeometry(0.1, 32, 32),
          new THREE.MeshPhysicalMaterial({ color: 0xff1e2d, roughness: 0.2, clearcoat: 1, emissive: 0x550005 }));
        tip.position.y = 1.52; bomb.add(tip);
        bomb.position.set(0.18, 0.55, -0.1); bomb.rotation.z = -0.38; mate.add(bomb);

        // Ojos
        const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25, emissive: 0x222222 });
        const eyes = [-0.22, 0.22].map((x) => {
          const e = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.13, 8, 24), eyeMat);
          e.position.set(x, -0.08, 0.93); mate.add(e); return e;
        });

        // Sombra suave
        const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.9, 48),
          new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.16 }));
        shadow.rotation.x = -Math.PI / 2; shadow.position.y = -1.35; scene.add(shadow);

        const mouse = { x: 0, y: 0 };
        const onMove = (e) => {
          mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
          mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
        };
        window.addEventListener('pointermove', onMove, { passive: true });

        const resize = () => {
          const w = el.clientWidth, h = el.clientHeight;
          renderer.setSize(w, h, false);
          camera.aspect = w / h; camera.updateProjectionMatrix();
        };
        const ro = new ResizeObserver(resize); ro.observe(el); resize();

        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const t0 = performance.now();
        let nextBlink = 2.5;
        const loop = (now) => {
          const t = (now - t0) / 1000;
          const m = reduce ? 0 : 1;
          mate.rotation.y += ((Math.sin(t * 0.6) * 0.45 + mouse.x * 0.35) * m - mate.rotation.y) * 0.06;
          mate.rotation.x += ((mouse.y * 0.12) * m - mate.rotation.x) * 0.06;
          mate.position.y = Math.sin(t * 1.3) * 0.08 * m;
          shadow.scale.setScalar(1 - Math.sin(t * 1.3) * 0.06 * m);
          bomb.rotation.z = -0.38 + Math.sin(t * 2.1) * 0.04 * m;
          // parpadeo
          let s = 1;
          if (t > nextBlink) { const k = (t - nextBlink) / 0.16; s = k < 1 ? Math.abs(1 - 2 * k) * 0.9 + 0.1 : 1; if (k >= 1) nextBlink = t + 2.5 + Math.random() * 2.5; }
          eyes.forEach((e) => (e.scale.y = s));
          renderer.render(scene, camera);
          raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);

        cleanup = () => {
          cancelAnimationFrame(raf); ro.disconnect();
          window.removeEventListener('pointermove', onMove);
          renderer.dispose(); renderer.domElement.remove();
        };
      } catch (e) {
        setFallback(true);
      }
    })();
    return () => cleanup();
  }, []);

  return (
    <div className="mate3d" style={{ width: '100%', maxWidth: size, aspectRatio: '1 / 1' }} ref={ref} aria-label="MateBot, un mate rojo con ojos" role="img">
      {fallback && <img src="/matebot.svg" alt="" style={{ width: '100%' }} />}
    </div>
  );
}
