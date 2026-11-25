/*
 * Logo DEVISEBIT 3D girando — componente reutilizable para cualquier web.
 * Uso:
 *   <script src="https://sistema.devisebit.com/marca/logo-3d.js" defer></script>
 *   <devisebit-logo-3d size="150"></devisebit-logo-3d>
 * Atributos opcionales: size (px, por defecto 150), speed (segundos por vuelta, 7),
 * glow (color del brillo, #e30613), static (sin animación).
 * Respeta "reducir movimiento" del sistema operativo.
 */
(() => {
  if (customElements.get('devisebit-logo-3d')) return;
  const SRC = new URL('devisebit-isotipo.png', document.currentScript?.src || 'https://sistema.devisebit.com/marca/').href;
  class Logo3D extends HTMLElement {
    static get observedAttributes() { return ['size', 'speed', 'glow', 'static']; }
    connectedCallback() { this.render(); }
    attributeChangedCallback() { if (this.isConnected) this.render(); }
    render() {
      const size = parseInt(this.getAttribute('size') || '150', 10);
      const speed = parseFloat(this.getAttribute('speed') || '7');
      const glow = this.getAttribute('glow') || '#e30613';
      const still = this.hasAttribute('static');
      const root = this.shadowRoot || this.attachShadow({ mode: 'open' });
      root.innerHTML = `<style>
        :host{display:inline-block;width:${size}px;height:${size}px;perspective:${size * 4.7}px}
        .spin{width:100%;height:100%;position:relative;transform-style:preserve-3d;animation:s ${speed}s linear infinite}
        img{position:absolute;inset:0;width:100%;height:100%;backface-visibility:visible;filter:drop-shadow(0 ${size / 15}px ${size / 5}px color-mix(in srgb, ${glow} 45%, transparent))}
        img:nth-child(2){transform:translateZ(-${size / 19}px);filter:brightness(.4)}
        img:nth-child(3){transform:translateZ(-${size / 38}px);filter:brightness(.6)}
        @keyframes s{to{transform:rotateY(360deg)}}
        ${still ? '.spin{animation:none}' : ''}
        @media (prefers-reduced-motion:reduce){.spin{animation:none}}
      </style><div class="spin" role="img" aria-label="DEVISEBIT"><img src="${SRC}" alt=""><img src="${SRC}" alt=""><img src="${SRC}" alt=""></div>`;
    }
  }
  customElements.define('devisebit-logo-3d', Logo3D);
})();
