"""Voz (edge-tts es-AR) + linea de tiempo por pieza. Uso: python3 voz.py [pieza ...] -> ../trabajo/<pieza>/voz/*.mp3, timeline.json, timeline.js
Cortes de escena cuantizados al pulso; instante de cada palabra; 'env' = volumen de la voz por cuadro (lo usa el anillo de voz de Bit)."""
import sys, asyncio, os, json, pathlib, subprocess, re, math, certifi, numpy as np
if os.path.exists("/root/.ccr/ca-bundle.crt"): certifi.where = lambda: "/root/.ccr/ca-bundle.crt"
import edge_tts
from guiones import G, VOZ, RITMO, BPM, COLA, grupos
D = pathlib.Path(__file__).parent; PAD_IN, FPS, SR, BEAT = 0.14, 30, 44100, 60 / BPM
async def tts(text, out):
    for intento in range(4):
        try:
            c = edge_tts.Communicate(text, VOZ, rate=RITMO, proxy=os.environ.get("HTTPS_PROXY"), boundary="WordBoundary"); w = []
            with open(out, "wb") as f:
                async for ch in c.stream():
                    if ch["type"] == "audio": f.write(ch["data"])
                    elif ch["type"] == "WordBoundary": w.append((ch["offset"] / 1e7, (ch["offset"] + ch["duration"]) / 1e7, ch["text"]))
            if w: return w
        except Exception as e: print("  reintento tts:", e); await asyncio.sleep(2)
    raise SystemExit("sin voz")
def dec(p): return np.frombuffer(subprocess.check_output(["ffmpeg", "-v", "error", "-i", str(p), "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"]), "<f4").astype(float)
def nw(s): return len([x for x in s.split() if re.search(r"\w", x)])
async def pieza(name):
    W = D.parent / "trabajo" / name; V = W / "voz"; V.mkdir(parents=True, exist_ok=True); esc = G[name]
    t = 0.0; scenes = []; caps = []; vz = []; words = []
    for i, (sid, chunks) in enumerate(esc):
        gr = grupos(chunks); mp3 = V / f"{sid}.mp3"; meta = V / f"{sid}.json"; text = " ".join(g[0] for g in gr); key = text + RITMO + VOZ
        if not (mp3.exists() and meta.exists() and json.load(open(meta))["text"] == key): json.dump({"text": key, "w": await tts(text, mp3)}, open(meta, "w"))
        w = json.load(open(meta))["w"]; fin = w[-1][1] + 0.12; v0 = t + PAD_IN; counts = [nw(g[0]) for g in gr]
        if sum(counts) != len(w):   # si el motor de voz separa distinto las palabras, se reparten por proporcion
            print(f"  aviso {name}/{sid}: {sum(counts)} palabras escritas, {len(w)} dichas"); tot = sum(counts); acc = 0; idx = []
            for n in counts: idx.append(min(len(w) - 1, round(acc * len(w) / tot))); acc += n
        else: idx = [sum(counts[:j]) for j in range(len(counts))]
        words += [{"t0": round(v0 + a, 3), "t1": round(v0 + b, 3), "w": x} for a, b, x in w]
        for j, (dicho, mostrado) in enumerate(gr):
            i0 = idx[j]; i1 = idx[j + 1] if j + 1 < len(idx) else len(w); ws = w[i0:max(i1, i0 + 1)]; n = len(ws); b = w[i1][0] if i1 < len(w) else fin + 0.25
            dw = mostrado.split(); m = len(dw); tw = [round(v0 + ws[min(n - 1, q * n // max(1, m))][0] - 0.05, 3) for q in range(m)]
            caps.append({"t0": round(v0 + ws[0][0] - 0.05, 3), "t1": round(v0 + b - 0.05, 3), "s": sid, "k": j, "w": dw, "tw": tw})
        end = PAD_IN + fin + 0.10 + (COLA if i == len(esc) - 1 else 0); end = math.ceil((t + end) / BEAT - 0.15) * BEAT
        scenes.append({"id": sid, "start": round(t, 4), "end": round(end, 4)}); vz.append({"file": str(mp3), "at": round(v0, 3), "fin": round(fin, 3)}); t = end
    n = int(t * SR); v = np.zeros(n)
    for z in vz:
        x = dec(z["file"])[:int(SR * (z["fin"] + 0.2))]; i0 = int(SR * z["at"]); x = x[:n - i0]; v[i0:i0 + len(x)] += x
    v /= np.abs(v).max(); hop = SR // FPS; env = [float(np.sqrt((v[i * hop:(i + 1) * hop] ** 2).mean())) for i in range(int(t * FPS))]; mx = np.percentile(env, 95); env = [round(min(1, e / mx), 3) for e in env]
    tl = {"name": name, "dur": round(t, 4), "bpm": BPM, "voz_id": VOZ, "scenes": scenes, "caps": caps, "words": words, "env": env, "voz": vz}
    json.dump(tl, open(W / "timeline.json", "w"), ensure_ascii=False, indent=1)
    open(W / "timeline.js", "w").write("window.TL=" + json.dumps({k: tl[k] for k in ("name", "dur", "bpm", "scenes", "caps", "words", "env")}, ensure_ascii=False) + ";")
    print(f"{name}: {t:.2f} s  " + " ".join(f"{s['id']}={s['end']-s['start']:.1f}" for s in scenes))
async def main():
    for nme in (sys.argv[1:] or list(G)): await pieza(nme)
asyncio.run(main())
