import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'MateBot — Tu agenda por audio, gratis. By DEVISEBIT';

export default function OG() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', background: 'radial-gradient(circle at 88% 12%, #5a0007 0%, #0a0a0a 55%)', color: '#fff', padding: '0 80px', fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div style={{ fontSize: 24, color: '#a3a3a3', letterSpacing: 4 }}>MATEBOT · BY DEVISEBIT</div>
          <div style={{ fontSize: 78, fontWeight: 800, lineHeight: 1.02, marginTop: 18, display: 'flex', flexDirection: 'column' }}>
            <span>Le hablás.</span><span style={{ color: '#ff3b47' }}>Él te ordena</span><span>la semana.</span>
          </div>
          <div style={{ fontSize: 30, color: '#d4d4d4', marginTop: 18 }}>Tu agenda por audio, gratis, en Telegram.</div>
        </div>
        <svg width="360" height="360" viewBox="0 0 200 200">
          <rect x="118" y="18" width="9" height="78" rx="4.5" fill="#e5e5e5" transform="rotate(22 122 57)" />
          <circle cx="141" cy="16" r="9" fill="#E30613" stroke="#fff" strokeWidth="3" />
          <ellipse cx="100" cy="66" rx="44" ry="11" fill="#6d8f1f" />
          <path d="M56 66 C52 84 34 104 36 132 C38 166 66 186 100 186 C134 186 162 166 164 132 C166 104 148 84 144 66 Z" fill="#E30613" />
          <rect x="52" y="58" width="96" height="14" rx="7" fill="#1a1a1a" />
          <rect x="74" y="116" width="16" height="26" rx="8" fill="#fff" />
          <rect x="110" y="116" width="16" height="26" rx="8" fill="#fff" />
        </svg>
      </div>
    ),
    size,
  );
}
