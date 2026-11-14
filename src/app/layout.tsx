import type { Metadata, Viewport } from 'next';
import {
  JetBrains_Mono,
  Plus_Jakarta_Sans,
  Source_Sans_3,
} from 'next/font/google';
import './globals.css';

const displayFont = Plus_Jakarta_Sans({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['600', '700'],
});

const sansFont = Source_Sans_3({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const monoFont = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['500', '600'],
});

export const metadata: Metadata = {
  title: 'Pa-Hire Po — Multi-Board Job Finder & Resume Studio (AI)',
  description:
    'Pa-Hire Po: Multi-board job search across LinkedIn, JobStreet, and Indeed with live match analysis and AI-powered dynamic Resume Studio.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/pa-hire-po.ico', sizes: 'any' },
      { url: '/pa-hire-po-logo.jpg', type: 'image/jpeg' },
    ],
    shortcut: '/pa-hire-po.ico',
    apple: '/pa-hire-po-logo.jpg',
  },
};

export const viewport: Viewport = {
  colorScheme: 'light dark',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${displayFont.variable} ${sansFont.variable} ${monoFont.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[var(--background)] text-[var(--foreground)] font-sans">
        {children}
      </body>
    </html>
  );
}
