'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Heart, Calendar, Users, Sparkles, Camera, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { BotanicalFooter } from '@/components/botanical/Layout';

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 }
  }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 }
};

export default function Home() {
  const { isAuthenticated, isOrganizer, isGuest } = useAuth();
  const router = useRouter();

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (isAuthenticated) {
      if (isOrganizer) {
        router.push('/dashboard');
      } else if (isGuest) {
        router.push('/guestdashboard');
      }
    }
  }, [isAuthenticated, isOrganizer, isGuest, router]);

  const features = [
    { icon: Calendar, title: 'Multi-Day Events', desc: 'Plan every ceremony from Mehendi to Reception' },
    { icon: Users, title: 'Guest Management', desc: 'Track RSVPs, dietary needs & accommodations' },
    { icon: Sparkles, title: 'AI Assistant', desc: 'Get intelligent help with planning & operations' },
    { icon: Camera, title: 'Photo Album', desc: 'Capture and share wedding memories' },
  ];

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Minimal Header */}
      <motion.header 
        className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-center">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="text-2xl font-serif font-medium text-foreground tracking-tight">
              vowly
            </span>
          </Link>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-6 text-center">
          {/* Main Heading */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.p 
              className="text-sm uppercase tracking-widest text-primary font-medium mb-6"
              variants={fadeInUp}
            >
              Welcome to Vowly
            </motion.p>
            
            <motion.h1 
              className="text-5xl md:text-6xl lg:text-7xl font-serif font-normal leading-tight mb-6"
              variants={fadeInUp}
            >
              Plan your perfect
              <br />
              <span className="italic text-primary">wedding celebration</span>
            </motion.h1>

            <motion.p 
              className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed"
              variants={fadeInUp}
            >
              AI-powered wedding planning for modern couples. Manage guests, vendors, and multi-day events in one elegant platform.
            </motion.p>
          </motion.div>

          {/* Three CTAs */}
          <motion.div 
            className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            {/* Get Started as Organizer */}
            <motion.div variants={scaleIn}>
              <Link href="/auth/organizer?mode=signup">
                <motion.button
                  className="group relative w-full md:w-auto px-8 py-4 bg-primary text-white font-medium rounded-full overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary/20"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="relative z-10 flex items-center gap-2 justify-center">
                    Get started as organizer
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </span>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.button>
              </Link>
            </motion.div>

            {/* Continue as Organizer */}
            <motion.div variants={scaleIn}>
              <Link href="/auth/organizer?mode=login">
                <motion.button
                  className="group w-full md:w-auto px-8 py-4 border-2 border-border text-foreground font-medium rounded-full transition-all duration-300 hover:border-primary hover:text-primary"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="flex items-center gap-2 justify-center">
                    Continue as organizer
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </span>
                </motion.button>
              </Link>
            </motion.div>

            {/* RSVP as Guest */}
            <motion.div variants={scaleIn}>
              <Link href="/auth/guest">
                <motion.button
                  className="group w-full md:w-auto px-8 py-4 border-2 border-border text-foreground font-medium rounded-full transition-all duration-300 hover:border-primary hover:text-primary"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="flex items-center gap-2 justify-center">
                    RSVP as a guest
                    <Heart className="w-5 h-5 transition-transform group-hover:scale-110" />
                  </span>
                </motion.button>
              </Link>
            </motion.div>
          </motion.div>

        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            <p className="text-sm uppercase tracking-widest text-primary font-medium mb-4">Features</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-normal mb-4">
              Everything you need for
              <br />
              <span className="italic">your special day</span>
            </h2>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="group p-6 bg-white rounded-2xl border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300"
                whileHover={{ y: -4 }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-serif text-lg font-medium mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-normal mb-6">
              Ready to plan something
              <br />
              <span className="italic text-primary">beautiful?</span>
            </h2>
            <p className="text-muted-foreground mb-10 max-w-lg mx-auto">
              Whether you&apos;re planning an intimate ceremony or a grand celebration, Vowly is here to help make it perfect.
            </p>
            <Link href="/auth/organizer?mode=signup">
              <motion.button
                className="group px-10 py-5 bg-primary text-white font-medium rounded-full text-lg transition-all duration-300 hover:shadow-xl hover:shadow-primary/20"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="flex items-center gap-2">
                  Start planning for free
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </span>
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      <BotanicalFooter />
    </div>
  );
}
