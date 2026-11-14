import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Pa-Hire Po — Smart Job Finder & A4 Resume Studio',
  description:
    'Pa-Hire Po: Automated multi-board job discovery across LinkedIn, JobStreet, and Indeed with live A4 HTML resume tailoring.',
  icons: {
    icon: '/pa-hire-po-logo.jpg',
    shortcut: '/pa-hire-po-logo.jpg',
    apple: '/pa-hire-po-logo.jpg',
  },
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-black text-white font-sans">
        {children}
      </body>
    </html>
  );
}
