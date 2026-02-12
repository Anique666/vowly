'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export function BotanicalHeader() {
  const pathname = usePathname();
  
  const navLinks = [
    { href: '/host', label: 'Setup' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/guestdashboard', label: 'Guests' },
    { href: '/rsvp', label: 'RSVP' },
  ];

  const isActive = (href) => pathname === href;

  return (
    <motion.header 
      className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-border/50"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-white">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/>
            </svg>
          </div>
          <span className="text-lg font-serif font-medium text-foreground group-hover:text-primary transition-colors">
            Wedding Ops
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors ${
                isActive(link.href)
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* CTA Button */}
        <Link href="/host">
          <motion.button
            className="btn-botanical text-sm"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Get Started
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </Link>
      </div>
    </motion.header>
  );
}

export function BotanicalFooter() {
  return (
    <footer className="bg-secondary/50 border-t border-border">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-white">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/>
                </svg>
              </div>
              <span className="text-lg font-serif font-medium">Wedding Ops</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              Elegant AI-powered wedding planning for modern couples. Create unforgettable celebrations with ease.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-medium mb-4 text-sm uppercase tracking-wider text-foreground">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/host" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Create Wedding
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/rsvp" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  RSVP
                </Link>
              </li>
            </ul>
          </div>

          {/* Features */}
          <div>
            <h4 className="font-medium mb-4 text-sm uppercase tracking-wider text-foreground">Features</h4>
            <ul className="space-y-3">
              <li>
                <span className="text-sm text-muted-foreground">AI Assistant</span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">Guest Management</span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">Vendor Coordination</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; 2026 Wedding Ops. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
