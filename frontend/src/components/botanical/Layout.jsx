'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, LogOut, Image } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function BotanicalHeader() {
  const pathname = usePathname();
  const { user, isAuthenticated, isOrganizer, isGuest, logout } = useAuth();
  
  const organizerLinks = [
    { href: '/host', label: 'Setup' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/postwedding', label: 'Album' },
  ];

  const guestLinks = [
    { href: '/guestdashboard', label: 'Dashboard' },
    { href: '/postwedding', label: 'Album' },
    { href: '/rsvp', label: 'RSVP' },
  ];

  const navLinks = isOrganizer ? organizerLinks : isGuest ? guestLinks : [];

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
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor"/>
            </svg>
          </div>
          <span className="text-xl font-serif font-medium text-foreground group-hover:text-primary transition-colors tracking-tight">
            vowly
          </span>
        </Link>

        {/* Navigation */}
        {isAuthenticated && navLinks.length > 0 && (
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
        )}

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <span className="hidden md:inline text-sm text-muted-foreground">
                {user?.name}
              </span>
              <motion.button
                onClick={logout}
                className="btn-botanical-outline text-sm py-2 px-4"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">Logout</span>
              </motion.button>
            </>
          ) : (
            <Link href="/auth/organizer">
              <motion.button
                className="btn-botanical text-sm"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </Link>
          )}
        </div>
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
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor"/>
                </svg>
              </div>
              <span className="text-xl font-serif font-medium tracking-tight">vowly</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              Plan your perfect wedding with AI-powered assistance. Create unforgettable celebrations with ease.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-medium mb-4 text-sm uppercase tracking-wider text-foreground">For Organizers</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/auth/organizer" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Get Started
                </Link>
              </li>
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
            </ul>
          </div>

          {/* Features */}
          <div>
            <h4 className="font-medium mb-4 text-sm uppercase tracking-wider text-foreground">For Guests</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/auth/guest" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Guest Login
                </Link>
              </li>
              <li>
                <Link href="/rsvp" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  RSVP
                </Link>
              </li>
              <li>
                <Link href="/guestdashboard" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Guest Portal
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; 2026 Vowly. All rights reserved.
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
