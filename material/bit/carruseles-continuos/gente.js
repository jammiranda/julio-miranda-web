// Peatones: siluetas propias en SVG con ciclo de caminata (cadera, rodilla, tobillo, brazos en contrafase). Sin rasgos: no representan a nadie.
// new Persona(svgGroupPadre, {alto, color, variante}) ; .pose(xPie, ySuelo, fase(vueltas), dir)
class Persona {
  constructor(parent, o = {}) {
    this.o = Object.assign({ alto: 330, color: '#0A0C12', var: '', luz: '#FF6A63', paso: .82 }, o); const NS = 'http://www.w3.org/2000/svg';
    this.g = document.createElementNS(NS, 'g'); parent.appendChild(this.g); const c = this.o.color;
    this.g.innerHTML = `<g fill="none" stroke="${c}" stroke-linecap="round" stroke-linejoin="round">
<path data-k="a1"/><path data-k="l1"/><path data-k="f1"/><path data-k="torso"/><path data-k="falda" fill="${c}"/><path data-k="bolso" fill="${c}"/><circle data-k="cab" fill="${c}" stroke="none"/><path data-k="pelo" fill="${c}" stroke="none"/><path data-k="gorro" fill="${c}" stroke="none"/>
<path data-k="l0"/><path data-k="f0"/><path data-k="a0"/></g><g data-k="tel" style="display:none"><circle r=".2" fill="${this.o.luz}" opacity=".16"/><rect x="-.022" y="-.04" width=".044" height=".08" rx=".008" fill="#EAF6FF"/></g>
<path data-k="borde" fill="none" stroke="${this.o.luz}" stroke-opacity="${o.borde || 0}" stroke-width=".012" stroke-linecap="round"/>`;
    this.k = {}; this.g.querySelectorAll('[data-k]').forEach(e => this.k[e.dataset.k] = e);
  }
  pose(x, suelo, fase, dir = 1) {
    const fuera = x < -1300 || x > 2400; this.g.style.display = fuera ? 'none' : ''; if (fuera) return;   // lejos de cuadro no se dibuja (evita capas gigantes con desenfoque)
    const H = this.o.alto, v = this.o.var, k = this.k, S = (e, d, w) => { e.setAttribute('d', d); if (w) e.setAttribute('stroke-width', w); }, T2 = Math.PI * 2, wr = x => Math.atan2(Math.sin(x), Math.cos(x)), G = (x, s2) => Math.exp(-x * x / s2);
    // pierna: muslo en vaiven, rodilla que flexiona en el balanceo y amortigua al apoyar, pie que apoya el talon y despega con la punta
    const L1 = .245, L2 = .245, leg = i => { const f = (fase + i * .5) * T2, th = .06 + .44 * Math.sin(f), kn = .06 + .78 * G(wr(f + .55), .5) + .2 * G(wr(f - 2.15), .3);
      const hxo = .014 * Math.sin(f), kx = hxo + L1 * Math.sin(th), ky = L1 * Math.cos(th), ax = kx + L2 * Math.sin(th - kn), ay = ky + L2 * Math.cos(th - kn), fa = -1.0 * G(wr(f + 1.9), .35) + .32 * G(wr(f - 1.35), .18);
      return { hxo, kx, ky, ax, ay, tx: ax + .088 * Math.cos(fa), ty: ay - .088 * Math.sin(fa), f }; };
    const A = leg(0), B = leg(1), drop = Math.max(A.ay, B.ay, A.ty, B.ty), hy = -drop - .03, lean = v.includes('tel') ? .06 : .035;   // la cadera baja lo justo para que el punto mas bajo toque el suelo: da el rebote doble del paso
    [A, B].forEach((l, i) => { S(k['l' + i], `M${l.hxo},${hy} L${l.kx},${hy + l.ky} L${l.ax},${hy + l.ay}`, .078); S(k['f' + i], `M${l.ax - .012},${hy + l.ay + .008} L${l.tx},${hy + l.ty + .008}`, .05); });
    const sy = hy - .33, inc = lean + .008 * Math.sin(fase * 2 * T2);
    S(k.torso, `M0,${hy - .03} L${inc},${sy}`, v.includes('abrigo') ? .2 : .165);
    S(k.falda, v.includes('abrigo') ? `M-.1,${hy - .06} L.1,${hy - .06} L${.125 + .02 * Math.sin(fase * T2)},${hy + .16} L${-.115 + .02 * Math.sin(fase * T2)},${hy + .16} Z` : '', .02);
    S(k.bolso, v.includes('bolso') ? `M-.04,${sy + .2} l-.13,0 l0,.12 l.13,0 Z M${inc},${sy} L-.1,${sy + .2}` : '', .022);
    const hx = inc + .03, hcy = sy - .115 + .006 * Math.sin(fase * 2 * T2 + 1); k.cab.setAttribute('cx', hx); k.cab.setAttribute('cy', hcy); k.cab.setAttribute('r', .072);
    S(k.pelo, v.includes('pelo') ? `M${hx - .07},${hcy - .02} q-.04,.1 -.03,.2 q.05,.02 .08,-.02 q0,-.1 .02,-.16 Z` : '');
    S(k.gorro, v.includes('gorro') ? `M${hx - .078},${hcy - .02} q.07,-.12 .15,-.01 l.07,.012 l0,.02 l-.22,0 Z` : '');
    for (let i = 0; i < 2; i++) { const f = (fase + i * .5) * T2; let ua = -.5 * Math.sin(f), fa = ua + .22 + .5 * Math.max(0, -Math.sin(f)); const tel = v.includes('tel') && i === 0, sxo = inc - .012 * Math.sin(f);
      if (tel) { ua = .55; fa = 2.05 + .03 * Math.sin(f * 2); }
      const ex = sxo + .165 * Math.sin(ua), ey = sy + .03 + .165 * Math.cos(ua), wx = ex + .16 * Math.sin(fa), wy = ey + .16 * Math.cos(fa); S(k['a' + i], `M${sxo},${sy + .03} L${ex},${ey} L${wx},${wy} l${.012 * Math.sin(fa)},${.012 * Math.cos(fa)}`, .058);
      if (tel) { k.tel.style.display = ''; k.tel.setAttribute('transform', `translate(${wx + .02} ${wy - .03}) rotate(18)`); this.tel = [x + dir * (wx + .02) * H, suelo + (wy - .03) * H]; } }
    S(k.borde, this.o.borde ? `M${inc + .1},${sy + .02} L${.1},${hy - .05}` : '');
    this.g.setAttribute('transform', `translate(${x} ${suelo}) scale(${dir * H} ${H})`); this.cabeza = [x + dir * hx * H, suelo + hcy * H];
  }
  // avance por vuelta de ciclo (px), para que los pies no patinen
  get avance() { return this.o.paso * this.o.alto; }
}
