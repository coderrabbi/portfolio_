import type { Metadata } from 'next';
import '@fontsource-variable/space-grotesk';
import '@fontsource-variable/inter';
import './globals.css';
import './polish.css';
export const metadata: Metadata = {
  title: 'Golam Rabbi — Creative Developer',
  description: 'Creative development, full-stack engineering, and WordPress experiences.',
  icons: {
    icon: [
      { url: '/favicon.svg?v=coder-rabbi', type: 'image/svg+xml' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
