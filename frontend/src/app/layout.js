import { Cormorant_Garamond, Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';

const cormorant = Cormorant_Garamond({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata = {
  title: 'AI Wedding Ops | Elegant Wedding Planning',
  description: 'Complete wedding planning platform for managing guests, vendors, and events with AI assistance',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${inter.variable}`}>
      <body className="font-sans antialiased bg-white">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
