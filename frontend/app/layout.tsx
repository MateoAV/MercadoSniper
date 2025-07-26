import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ClientToaster from '@/components/ClientToaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MercadoSniper - Intelligent Price Tracking for MercadoLibre Colombia',
  description: 'Track car prices on MercadoLibre Colombia and get notified when prices drop below your target. Smart alerts, historical data, and real-time monitoring.',
  keywords: 'MercadoLibre, price tracking, car prices, Colombia, price alerts, deal finder',
  authors: [{ name: 'MercadoSniper Team' }],
  openGraph: {
    title: 'MercadoSniper - Smart Price Tracking',
    description: 'Get notified when car prices drop on MercadoLibre Colombia',
    url: 'https://mercadosniper.com',
    siteName: 'MercadoSniper',
    locale: 'es_CO',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MercadoSniper - Smart Price Tracking',
    description: 'Get notified when car prices drop on MercadoLibre Colombia',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full">
      <body className={`${inter.className} h-full antialiased`}>
        <div className="min-h-full bg-gray-50">
          {children}
        </div>
        <ClientToaster />
      </body>
    </html>
  );
} 