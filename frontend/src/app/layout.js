import { Playfair_Display, Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata = {
  title: 'AI Wedding Ops - Wedding Management System',
  description: 'Complete wedding planning platform for managing guests, vendors, and events with AI assistance',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body className="font-sans antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
