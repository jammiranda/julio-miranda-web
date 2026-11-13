"""Voz en off (edge-tts es-AR) + linea de tiempo. Uso: python3 voz.py  -> ../trabajo/voz/*.mp3, ../trabajo/timeline.json y timeline.js
La linea de tiempo trae: escenas (cortes cuantizados al pulso de la musica), grupos de subtitulos con el instante de cada palabra,
y 'env' = volumen de la voz cuadro a cuadro (lo usa la boca de Bit)."""
import asyncio, os, json, pathlib, subprocess, re, math, certifi, numpy as np
if os.path.exists("/root/.ccr/ca-bundle.crt"): certifi.where = lambda: "/root/.ccr/ca-bundle.crt"
import edge_tts
from guion import ESCENAS, VOZ, RITMO, BPM, COLA, EXTRA
D = pathlib.Path(__file__).parent; W = D.parent / "trabajo"; V = W / "voz"; V.mkdir(parents=True, exist_ok=True)
PAD_IN, FPS, SR, BEAT = 0.14, 30, 44100, 60 / BPM
async def tts(text, out):
    c = edge_tts.Communicate(text, VOZ, rate=RITMO, proxy=os.environ.get("HTTPS_PROXY"), boundary="WordBoundary"); w = []
    with open(out, "wb") as f:
        async for ch in c.stream():
            if ch["type"] == "audio": f.write(ch["data"])
            elif ch["type"] == "WordBoundary": w.append((ch["offset"] / 1e7, (ch["offset"] + ch["duration"]) / 1e7, ch["text"]))
    return w
def dec(p): return np.frombuffer(subprocess.check_output(["ffmpeg", "-v", "error", "-i", str(p), "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"]), "<f4").astype(float)
def nw(s): return len([x for x in s.split() if re.search(r"\w", x)])
async def main():
    t = 0.0; scenes = []; caps = []; vz = []; words = []
    for i, (sid, chunks) in enumerate(ESCENAS):
        mp3 = V / f"{sid}.mp3"; meta = V / f"{sid}.json"; text = " ".join(c[0] for c in chunks); key = text + RITMO + VOZ
        if not (mp3.exists() and meta.exists() and json.load(open(meta))["text"] == key):
            json.dump({"text": key, "w": await tts(text, mp3)}, open(meta, "w"))
        w = json.load(open(meta))["w"]; fin = w[-1][1] + 0.12; v0 = t + PAD_IN; counts = [nw(c[0]) for c in chunks]
        assert sum(counts) == len(w), (sid, sum(counts), [x[2] for x in w])
        words += [{"t0": round(v0 + a, 3), "t1": round(v0 + b, 3), "w": x} for a, b, x in w]
        k = 0
        for j, (c, n) in enumerate(zip(chunks, counts)):
            ws = w[k:k + n]; k += n; b = w[k][0] if k < len(w) else fin + 0.25
            dw = c[1].split(); m = len(dw)   # instante de cada palabra mostrada: reparte las habladas entre las mostradas
            tw = [round(v0 + ws[min(n - 1, q * n // max(1, m))][0] - 0.05, 3) for q in range(m)]
            caps.append({"t0": round(v0 + ws[0][0] - 0.05, 3), "t1": round(v0 + b - 0.05, 3), "s": sid, "k": j, "w": dw, "tw": tw})
        end = PAD_IN + fin + 0.10 + (COLA if i == len(ESCENAS) - 1 else 0) + EXTRA.get(sid, 0)
        end = math.ceil((t + end) / BEAT - 0.15) * BEAT     # corte sobre el pulso de la musica
        scenes.append({"id": sid, "start": round(t, 4), "end": round(end, 4)}); vz.append({"file": str(mp3), "at": round(v0, 3), "fin": round(fin, 3)}); t = end
    n = int(t * SR); v = np.zeros(n)
    for z in vz:
        x = dec(z["file"])[:int(SR * (z["fin"] + 0.2))]; i0 = int(SR * z["at"]); x = x[:n - i0]; v[i0:i0 + len(x)] += x
    v /= np.abs(v).max(); hop = SR // FPS
    env = [float(np.sqrt((v[i * hop:(i + 1) * hop] ** 2).mean())) for i in range(int(t * FPS))]; mx = np.percentile(env, 95)
    env = [round(min(1, e / mx), 3) for e in env]
    tl = {"dur": round(t, 4), "bpm": BPM, "voz_id": VOZ, "scenes": scenes, "caps": caps, "words": words, "env": env, "voz": vz}
    json.dump(tl, open(W / "timeline.json", "w"), ensure_ascii=False, indent=1)
    open(W / "timeline.js", "w").write("window.TL=" + json.dumps({k: tl[k] for k in ("dur", "bpm", "scenes", "caps", "words", "env")}, ensure_ascii=False) + ";")
    print(f"total {t:.2f} s  " + " ".join(f"{s['id']}={s['start']:.2f}-{s['end']:.2f}" for s in scenes))
    for c in caps: print(f"  {c['t0']:6.2f} {c['t1']:6.2f} {c['s']:6} {' '.join(c['w'])}")
asyncio.run(main())
