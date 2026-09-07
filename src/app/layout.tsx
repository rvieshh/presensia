import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Presensia — Absensi QR Sekolah',
  description: 'Sistem absensi digital berbasis QR code dengan dukungan scanner keyboard-wedge',
};

/**
 * Terapkan tema sebelum halaman digambar. Tanpa ini, mode gelap akan
 * berkedip putih sesaat karena React baru berjalan setelah HTML tampil.
 */
const SKRIP_TEMA = `
(function () {
  try {
    var t = localStorage.getItem('presensia-tema');
    if (!t) {
      t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'gelap' : 'terang';
    }
    document.documentElement.dataset.tema = t;
  } catch (e) {
    document.documentElement.dataset.tema = 'terang';
  }
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SKRIP_TEMA }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
