import type { Metadata, Viewport } from 'next';
import './globals.css';

const siteName = 'Pingboard';
const description = 'A tiny shared whiteboard for ideas, doodles and little moments. Create a board and make something together.';

export const metadata: Metadata = {
  title: {
    default: 'Pingboard — Make something together',
    template: '%s · Pingboard',
  },
  description,
  applicationName: siteName,
  keywords: ['online whiteboard', 'collaborative drawing', 'shared canvas', 'doodles', 'real-time collaboration'],
  category: 'productivity',
  openGraph: {
    type: 'website',
    siteName,
    title: 'Pingboard — Make something together',
    description,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pingboard — Make something together',
    description,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#f6f5f1',
  colorScheme: 'light',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
