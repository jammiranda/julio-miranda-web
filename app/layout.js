import './globals.css';

export const metadata = {
  metadataBase: new URL(process.env.APP_URL || 'https://matebot.app'),
  title: 'MateBot — Tu agenda por audio, gratis | by DEVISEBIT',
  description: 'Mandale un audio a MateBot y te ordena turnos, reuniones, cumpleaños y listas. Te avisa a tiempo, se conecta con Google Calendar y lo compartís con tu familia. Gratis. By DEVISEBIT.',
  icons: { icon: '/matebot.svg' },
  openGraph: {
    title: 'MateBot — Tu agenda por audio, gratis',
    description: 'Le hablás como a un amigo y te ordena la semana. By DEVISEBIT.',
    locale: 'es_AR',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es-AR" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
