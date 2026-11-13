"""Musica sintetizada (sin samples ni temas de terceros), misma tecnica que fuentes/conoce-devisebit/musica.py:
bombo, hi-hat, palmas, bajo de sierra, colchon y arpegio con numpy. Parametrizada por duracion, tempo, progresion y estilo."""
import numpy as np, wave
SR = 44100
def hz(m): return 440.0 * 2 ** ((m - 69) / 12)
# progresiones: (raiz del bajo, triada) en notas MIDI
PROG = {
 "Am-F-C-G": [(33, [57, 60, 64]), (29, [53, 57, 60]), (36, [55, 60, 64]), (31, [55, 59, 62])],
 "C-G-Am-F": [(36, [55, 60, 64]), (31, [55, 59, 62]), (33, [57, 60, 64]), (29, [53, 57, 60])],
 "Dm-Bb-F-C": [(38, [57, 62, 65]), (34, [58, 62, 65]), (29, [57, 60, 65]), (36, [55, 60, 64])],
 "Em-C-G-D": [(40, [59, 64, 67]), (36, [60, 64, 67]), (31, [59, 62, 67]), (38, [57, 62, 66])],
 "F-Am-Dm-C": [(29, [57, 60, 65]), (33, [57, 60, 64]), (38, [57, 62, 65]), (36, [55, 60, 64])],
}
def tone(f, d, a=0.2, dec=3.0, saw=False, att=0.01):
    tt = np.arange(int(SR * d)) / SR
    w = (2 * ((tt * f) % 1) - 1) if saw else np.sin(2 * np.pi * f * tt)
    return a * w * np.minimum(1, tt / att) * np.exp(-tt * dec)
def kick(a=0.9):
    tt = np.arange(int(SR * 0.35)) / SR; f = 50 + 90 * np.exp(-tt * 28)
    return a * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 9)
def hat(seed=1):
    tt = np.arange(int(SR * 0.06)) / SR; r = np.random.default_rng(seed).standard_normal(len(tt))
    return 0.12 * np.diff(np.concatenate([[0], r])) * np.exp(-tt * 70)
def clap(seed=2):
    tt = np.arange(int(SR * 0.2)) / SR; return 0.22 * np.random.default_rng(seed).standard_normal(len(tt)) * np.exp(-tt * 22)
def lowpass(x, k):  # un polo, k en (0,1]
    y = np.empty_like(x); acc = 0.0
    for i in range(len(x)): acc += k * (x[i] - acc); y[i] = acc
    return y
def whoosh(d=0.45, a=0.10, seed=5):
    n = int(SR * d); tt = np.arange(n) / n; r = np.random.default_rng(seed).standard_normal(n)
    r = np.convolve(r, np.ones(24) / 24, mode="same")
    return a * 6 * r * np.sin(np.pi * tt) ** 2 * (0.4 + 0.6 * tt)
def ping(f=1318.5, a=0.22):
    return tone(f, 0.5, a, 7) + tone(f * 1.5, 0.5, a * 0.6, 9)
def pop(f=660, a=0.18): return tone(f, 0.12, a, 30)
def pista(T, bpm=112, prog="Am-F-C-G", estilo="reel", seed=0, cortes=(), sfx=()):
    """T: duracion en s. estilo 'reel' (con bateria) o 'demo' (suave). cortes: instantes de cambio de escena (whoosh).
    sfx: lista de (t, 'ping'|'pop'). Devuelve array estereo float (n,2), pico normalizado a 0.85."""
    beat = 60 / bpm; n = int(SR * T); L = np.zeros(n + SR * 4); R = np.zeros(n + SR * 4)
    def add(sig, start, pan=0.0):
        i0 = int(start * SR)
        if i0 < 0 or i0 >= n: return
        L[i0:i0 + len(sig)] += sig * (1 - pan); R[i0:i0 + len(sig)] += sig * (1 + pan)
    P = PROG[prog]; K = kick(0.9 if estilo == "reel" else 0.5); H = hat(seed + 1); C = clap(seed + 2)
    bar = 4 * beat; bars = int(T / bar) + 1; fin = T - 2.2  # el acorde final cae 2.2 s antes del final
    for b in range(bars):
        bt = b * bar; root, ch = P[b % 4]
        if bt >= fin - 0.05: break
        intro = b < 1
        for k in range(4):
            s = bt + k * beat
            if s >= fin - 0.05: break
            if not intro or k == 0: add(K, s)
            if not intro:
                add(H, s + beat / 2, 0.3)
                if estilo == "reel": add(H * 0.5, s + beat / 4, -0.3); add(H * 0.5, s + 3 * beat / 4, -0.3)
                if estilo == "reel" and k in (1, 3): add(C, s, 0.1)
            add(tone(hz(root), beat * 0.9, 0.35, 5, saw=True) * (0.6 if estilo == "reel" else 0.4), s)
            if estilo == "reel": add(tone(hz(root + 12), beat * 0.4, 0.12, 9, saw=True), s + beat / 2)
        for m in ch:
            f = hz(m); add(tone(f, bar + 0.3, 0.07, 0.4, att=0.08), bt, 0.2); add(tone(f * 1.003, bar + 0.3, 0.07, 0.4, att=0.08), bt, -0.2)
        pat = [0, 1, 2, 1, 0, 2, 1, 2] if seed % 2 else [0, 1, 2, 0, 1, 2, 0, 1]
        for k in range(8):
            s = bt + k * beat / 2
            if s >= fin - 0.05: break
            add(tone(hz(ch[pat[k]] + 12), beat * 0.45, 0.07 if estilo == "reel" else 0.09, 10), s, 0.5 if k % 2 else -0.5)
    # subida y acorde final
    d = min(2.0, fin); tt = np.arange(int(SR * d)) / SR
    add(np.random.default_rng(seed + 3).standard_normal(len(tt)) * 0.07 * (tt / d) ** 2, fin - d)
    root = P[0][0]; g = sum(tone(hz(root + s), 2.2, 0.15, 1.5, saw=(s == 0)) for s in (0, 12, 19, 24, 28)); g[:len(K)] += K
    add(g, fin)
    for c in cortes: add(whoosh(seed=seed + 7), c - 0.25, 0.0)
    for t, kind in sfx: add(ping() if kind == "ping" else pop(), t, 0.15)
    L = L[:n]; R = R[:n]
    mx = max(np.abs(L).max(), np.abs(R).max()); t = np.arange(n) / SR
    fade = np.minimum(1, t / 0.25) * np.minimum(1, (T - t) / 0.6)
    return np.stack([L / mx * fade, R / mx * fade], 1) * 0.85
def guardar(st, path):
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(st, -1, 1) * 32767).astype("<i2").tobytes())
if __name__ == "__main__":
    import sys; guardar(pista(float(sys.argv[2]), int(sys.argv[3]) if len(sys.argv) > 3 else 112), sys.argv[1]); print("ok")
