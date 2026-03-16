import './global.css';
import { Outfit, Plus_Jakarta_Sans } from 'next/font/google';
import Script from 'next/script';

import { Providers } from './providers/index';
import { cn } from '@/shared/lib/utils';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://inbox0.com';

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'inbox-0 – Important emails, delivered to your WhatsApp',
  description:
    'Stop drowning in your inbox. inbox-0 uses AI to learn what matters to you and delivers smart email summaries right to WhatsApp. Get to zero, stay focused.',
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: 'inbox-0 – Important emails, delivered to your WhatsApp',
    description:
      'Stop drowning in your inbox. inbox-0 uses AI to deliver smart email summaries to WhatsApp. Get to zero, stay focused.',
    url: SITE_URL,
    siteName: 'inbox-0',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'inbox-0 – AI Email Filtering to WhatsApp' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'inbox-0 – Important emails, delivered to your WhatsApp',
    description:
      'Stop drowning in your inbox. inbox-0 uses AI to deliver smart email summaries to WhatsApp. Get to zero, stay focused.',
    images: ['/og-image.png'],
  },
};

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={cn(
          outfit.variable,
          plusJakartaSans.variable,
          plusJakartaSans.className
        )}
      >
        <Script
          src="https://tally.so/widgets/embed.js"
          strategy="lazyOnload"
        />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
