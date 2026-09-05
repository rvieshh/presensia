import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Presensia — Absensi QR Sekolah',
  description: 'Sistem absensi digital berbasis QR code dengan dukungan scanner keyboard-wedge',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
