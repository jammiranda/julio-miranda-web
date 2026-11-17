'use client';
import { useEffect } from 'react';

// Animaciones: aparición suave al hacer scroll y la charla del teléfono en loop.
// El contenido es visible por defecto; solo se oculta lo que todavía no entró en pantalla.
export default function Animations() {
  useEffect(() => {
    const root = document.documentElement;
    const els = [...document.querySelectorAll('[data-reveal]')];
    const vh = window.innerHeight;
    els.forEach((el) => { if (el.getBoundingClientRect().top > vh * 0.92) el.classList.add('pre'); });
    root.classList.add('rv');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.remove('pre'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    els.forEach((el) => el.classList.contains('pre') && io.observe(el));

    const phone = document.querySelector('.phone .screen');
    let timers = [];
    const play = () => {
      const steps = [...phone.querySelectorAll('[data-step]')];
      timers.forEach(clearTimeout); timers = [];
      steps.forEach((s) => s.classList.add('wait'));
      steps.forEach((s, i) => timers.push(setTimeout(() => s.classList.remove('wait'), 500 + i * 1200)));
      timers.push(setTimeout(play, 500 + steps.length * 1200 + 5000));
    };
    let pio;
    if (phone && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      pio = new IntersectionObserver(([e]) => { if (e.isIntersecting) { play(); pio.disconnect(); } }, { threshold: 0.35 });
      pio.observe(phone);
    }
    return () => { io.disconnect(); pio && pio.disconnect(); timers.forEach(clearTimeout); };
  }, []);
  return null;
}
