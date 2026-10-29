import numpy as np, wave
sr=44100; T=64.0; bpm=120; beat=60/bpm
n=int(sr*T); t=np.arange(n)/sr; L=np.zeros(n); R=np.zeros(n)
def add(sig, start, pan=0.0):
    i0=int(start*sr); i1=min(n,i0+len(sig))
    if i0>=n: return
    s=sig[:i1-i0]; L[i0:i1]+=s*(1-pan)/1; R[i0:i1]+=s*(1+pan)/1
def kick():
    d=0.35; tt=np.arange(int(sr*d))/sr; f=50+90*np.exp(-tt*28)
    return 0.9*np.sin(2*np.pi*np.cumsum(f)/sr)*np.exp(-tt*9)
def hat():
    d=0.06; tt=np.arange(int(sr*d))/sr; r=np.random.default_rng(1).standard_normal(len(tt))
    r=np.diff(np.concatenate([[0],r])); return 0.12*r*np.exp(-tt*70)
def clap():
    d=0.2; tt=np.arange(int(sr*d))/sr; r=np.random.default_rng(2).standard_normal(len(tt))
    return 0.25*r*np.exp(-tt*22)
def tone(f,d,a=0.2,dec=3,saw=False):
    tt=np.arange(int(sr*d))/sr
    w=(2*((tt*f)%1)-1) if saw else np.sin(2*np.pi*f*tt)
    env=np.minimum(1,tt/0.01)*np.exp(-tt*dec)
    return a*w*env
# acordes Am F C G (raíces bajo)
roots=[55.0,43.65,65.41,49.0]
chords=[[220,261.63,329.63],[174.61,220,261.63],[196,261.63,329.63],[196,246.94,293.66]]
bars=int(T/(4*beat))+1
K=kick(); H=hat(); C=clap()
for b in range(bars):
    bt=b*4*beat; ch=b%4
    intro = bt<5; outro = bt>=58
    for k in range(4):
        s=bt+k*beat
        if not intro or k in (0,): add(K, s) if not (outro and bt>60) else None
        if not intro: add(H, s+beat/2, 0.3); add(H*0.5, s+beat/4, -0.3); add(H*0.5, s+3*beat/4, -0.3)
        if k in (1,3) and not intro: add(C, s, 0.1)
        # bajo
        add(tone(roots[ch], beat*0.9, 0.35, 5, saw=True)*0.6, s)
        add(tone(roots[ch]*2, beat*0.4, 0.12, 9, saw=True), s+beat/2)
    # pad
    for f in chords[ch]:
        add(tone(f, 4*beat+0.3, 0.07, 0.4), bt, 0.2); add(tone(f*1.003, 4*beat+0.3, 0.07, 0.4), bt, -0.2)
    # arpegio
    for k in range(8):
        f=chords[ch][k%3]*2
        add(tone(f, beat*0.45, 0.07, 10), bt+k*beat/2, 0.5 if k%2 else -0.5)
# riser antes del cierre
s0=55.5; d=2.0; tt=np.arange(int(sr*d))/sr; r=np.random.default_rng(3).standard_normal(len(tt))*0.08*(tt/d)**2
add(r, s0)
mx=np.max(np.abs(np.stack([L,R]))); L/=mx; R/=mx
fade=np.minimum(1,t/0.5)*np.minimum(1,(T-t)/2.5)
st=np.stack([L*fade,R*fade],1)*0.85
with wave.open('musica.wav','wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(sr); w.writeframes((np.clip(st,-1,1)*32767).astype('<i2').tobytes())
print("ok")
