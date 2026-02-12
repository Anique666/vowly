'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle2, Activity, Rocket, Sparkles, Calendar, Users, MessageCircle, Heart, ArrowRight, Star, Zap } from 'lucide-react';
import Link from 'next/link';
import { ShaadiBot } from '@/components/onboarding/ShaadiBot';

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 }
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2
    }
  }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 }
};

// Feature card component with animations
function FeatureCard({ feature, index }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={fadeInUp}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Card className="p-6 h-full border-2 border-border hover:border-primary/30 transition-all duration-500 hover:shadow-xl group hover:-translate-y-2 bg-white/80 backdrop-blur-sm">
        <motion.div 
          className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/10 to-amber-100 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300"
          whileHover={{ rotate: 5 }}
        >
          <feature.icon className="w-7 h-7 text-primary" />
        </motion.div>
        <h3 className="text-xl font-semibold mb-3 font-serif">{feature.title}</h3>
        <p className="text-muted-foreground leading-relaxed">
          {feature.description}
        </p>
      </Card>
    </motion.div>
  );
}

export default function Home() {
  const [healthStatus, setHealthStatus] = useState({
    frontend: true,
    backend: false,
  });
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(true);

  // Parallax scroll effects
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, 150]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);

  useEffect(() => {
    checkBackendHealth();
  }, []);

  const checkBackendHealth = async () => {
    setLoading(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';
      const response = await fetch(`${backendUrl}/api/health`);
      const data = await response.json();
      
      setHealthStatus({
        frontend: true,
        backend: response.ok,
        backendMessage: data.message,
      });
    } catch (error) {
      setHealthStatus({
        frontend: true,
        backend: false,
        backendMessage: 'Unable to connect',
      });
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: Calendar,
      title: 'Multi-Day Planning',
      description: 'Organize Mehendi, Sangeet, Wedding & Reception with comprehensive day-wise schedules and event management.',
    },
    {
      icon: Users,
      title: 'Smart Guest Management',
      description: 'Track RSVPs, dietary preferences, and accommodation needs with real-time updates and notifications.',
    },
    {
      icon: MessageCircle,
      title: 'AI-Powered Assistant',
      description: 'Get instant help with vendor coordination, guest queries, and day-of operations with Aarav, your AI copilot.',
    },
    {
      icon: Zap,
      title: 'Vendor Coordination',
      description: 'Manage all your vendors in one place with AI-suggested professionals and automated communication.',
    },
  ];

  const stats = [
    { value: '500+', label: 'Weddings Planned' },
    { value: '10k+', label: 'Happy Guests' },
    { value: '98%', label: 'Satisfaction Rate' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-amber-50/30 to-white overflow-hidden">
      {/* Onboarding */}
      <ShaadiBot 
        showOnboarding={showOnboarding} 
        onDismiss={() => setShowOnboarding(false)} 
      />

      {/* Header */}
      <motion.header 
        className="border-b border-primary/20 bg-white/80 backdrop-blur-md sticky top-0 z-50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <motion.div 
            className="flex items-center gap-2"
            whileHover={{ scale: 1.02 }}
          >
            <Sparkles className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold font-serif">AI Wedding Ops</span>
          </motion.div>
          <nav className="flex items-center gap-6">
            <Link href="/host" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Host</Link>
            <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Dashboard</Link>
            <Link href="/guestdashboard" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Guest</Link>
            <Link href="/rsvp" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">RSVP</Link>
          </nav>
        </div>
      </motion.header>

      {/* Hero Section with Parallax */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background decorations */}
        <motion.div 
          className="absolute top-20 right-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl"
          style={{ y: heroY }}
        />
        <motion.div 
          className="absolute bottom-20 left-10 w-96 h-96 bg-amber-100/50 rounded-full blur-3xl"
          style={{ y: useTransform(scrollY, [0, 500], [0, -100]) }}
        />
        
        <div className="container mx-auto px-4 py-20 relative z-10">
          <motion.div 
            className="max-w-4xl mx-auto text-center"
            style={{ opacity: heroOpacity }}
          >
            {/* Aarav Introduction */}
            <motion.div 
              className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-gradient-to-r from-primary/10 to-amber-100/50 border border-primary/20 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <motion.div 
                className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-amber-400 flex items-center justify-center"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <span className="text-sm">🤵</span>
              </motion.div>
              <span className="text-sm font-medium text-foreground">
                Meet <strong>Aarav</strong>, your AI Wedding Assistant
              </span>
              <Sparkles className="w-4 h-4 text-primary" />
            </motion.div>

            {/* Main Heading */}
            <motion.h1 
              className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground mb-6 tracking-tight font-serif"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
            >
              Your Dream Wedding,
              <br />
              <motion.span 
                className="text-primary inline-block"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, delay: 0.5 }}
              >
                Effortlessly Planned
              </motion.span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p 
              className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              Plan your perfect Indian wedding celebration with AI-powered assistance. 
              Manage guests, vendors, and multi-day events seamlessly in one beautiful platform.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div 
              className="flex flex-wrap items-center justify-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <Link href="/host">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                  <Button 
                    size="lg" 
                    className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 text-base px-8 py-6 rounded-xl"
                  >
                    <Rocket className="w-5 h-5" />
                    Create Your Wedding Ops Hub
                    <ArrowRight className="w-5 h-5 ml-1" />
                  </Button>
                </motion.div>
              </Link>
              <Link href="/dashboard">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="gap-2 border-2 border-primary/30 hover:bg-primary/5 hover:border-primary transition-all duration-300 text-base px-8 py-6 rounded-xl"
                  >
                    <Activity className="w-5 h-5" />
                    View Dashboard
                  </Button>
                </motion.div>
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div 
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <div className="w-6 h-10 border-2 border-primary/30 rounded-full flex justify-center pt-2">
            <motion.div 
              className="w-1.5 h-3 bg-primary/50 rounded-full"
              animate={{ y: [0, 12, 0], opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-primary/5 via-amber-50/50 to-primary/5">
        <div className="container mx-auto px-4">
          <motion.div 
            className="grid grid-cols-3 gap-8 max-w-3xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            {stats.map((stat, index) => (
              <motion.div 
                key={index}
                className="text-center"
                variants={scaleIn}
                transition={{ duration: 0.5 }}
              >
                <div className="text-4xl font-bold text-primary font-serif mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 font-serif">
              Everything You Need for the Perfect Day
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg">
              From planning to celebration, our platform handles every detail with elegance
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <FeatureCard key={index} feature={feature} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Health Status Section - Compact */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <motion.div 
            className="max-w-xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            transition={{ duration: 0.5 }}
          >
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4 border border-border bg-white/80">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-green-100">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Frontend</p>
                    <p className="text-xs text-muted-foreground">Running</p>
                  </div>
                </div>
              </Card>

              <Card className={`p-4 border bg-white/80 ${healthStatus.backend ? 'border-border' : 'border-red-200'}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${healthStatus.backend ? 'bg-green-100' : 'bg-red-100'}`}>
                    {healthStatus.backend ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <Activity className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">Backend</p>
                    <p className="text-xs text-muted-foreground">
                      {loading ? 'Checking...' : (healthStatus.backend ? 'Running' : 'Disconnected')}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div 
            className="max-w-3xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={scaleIn}
            transition={{ duration: 0.6 }}
          >
            <Card className="p-10 border-2 border-primary/20 bg-gradient-to-r from-primary/5 via-amber-50/50 to-primary/5 text-center relative overflow-hidden">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-amber-100/50 rounded-full blur-3xl" />
              
              <div className="relative z-10">
                <motion.div 
                  className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary to-amber-400 flex items-center justify-center"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <span className="text-2xl">🤵</span>
                </motion.div>
                <h3 className="text-3xl font-bold mb-4 font-serif">Ready to Create Magic?</h3>
                <p className="text-muted-foreground mb-8 text-lg max-w-lg mx-auto">
                  Let Aarav guide you through creating your perfect wedding celebration. 
                  Start your journey today.
                </p>
                <Link href="/host">
                  <motion.div 
                    className="inline-block"
                    whileHover={{ scale: 1.05 }} 
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button size="lg" className="gap-2 bg-primary hover:bg-primary/90 text-lg px-10 py-6 rounded-xl">
                      <Sparkles className="w-5 h-5" />
                      Get Started Now
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                  </motion.div>
                </Link>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-primary/10">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © 2026 AI Wedding Ops. Crafted with ❤️ for beautiful celebrations.
          </p>
        </div>
      </footer>
    </div>
  );
}
