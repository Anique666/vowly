'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { ArrowRight, Calendar, Users, MessageCircle, Zap, CheckCircle2, Activity } from 'lucide-react';
import Link from 'next/link';
import { BotanicalHeader, BotanicalFooter } from '@/components/botanical/Layout';
import { Card } from '@/components/ui/card';

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 }
  }
};

// Service card component
function ServiceCard({ title, description, features, index }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={fadeInUp}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="card-botanical card-botanical-hover"
    >
      <h3 className="text-xl font-serif font-medium mb-3">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed mb-4">{description}</p>
      <ul className="space-y-2">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            {feature}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

export default function Home() {
  const [healthStatus, setHealthStatus] = useState({ frontend: true, backend: false });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('hosts');

  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 400], [1, 0.95]);

  useEffect(() => {
    checkBackendHealth();
  }, []);

  const checkBackendHealth = async () => {
    setLoading(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';
      const response = await fetch(`${backendUrl}/api/health`);
      const data = await response.json();
      setHealthStatus({ frontend: true, backend: response.ok, backendMessage: data.message });
    } catch (error) {
      setHealthStatus({ frontend: true, backend: false, backendMessage: 'Unable to connect' });
    } finally {
      setLoading(false);
    }
  };

  const services = [
    {
      title: 'Multi-Day Planning',
      description: 'Organize every ceremony from Mehendi to Reception with detailed day-wise schedules.',
      features: ['Event scheduling', 'Timeline management'],
    },
    {
      title: 'Guest Management',
      description: 'Track RSVPs, dietary preferences, and accommodation with real-time updates.',
      features: ['RSVP tracking', 'Dietary preferences'],
    },
    {
      title: 'AI Assistant',
      description: 'Get intelligent help with planning, vendor coordination, and day-of operations.',
      features: ['Smart suggestions', '24/7 availability'],
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <BotanicalHeader />

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center pt-20">
        <div className="max-w-7xl mx-auto px-6 w-full">
          <motion.div 
            className="max-w-4xl mx-auto text-center"
            style={{ opacity: heroOpacity, scale: heroScale }}
          >
            {/* Toggle Tabs */}
            <motion.div 
              className="inline-flex items-center bg-secondary rounded-full p-1 mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <button
                onClick={() => setActiveTab('hosts')}
                className={`pill-toggle ${activeTab === 'hosts' ? 'pill-toggle-active' : 'pill-toggle-inactive'}`}
              >
                For Hosts
              </button>
              <button
                onClick={() => setActiveTab('guests')}
                className={`pill-toggle ${activeTab === 'guests' ? 'pill-toggle-active' : 'pill-toggle-inactive'}`}
              >
                For Guests
              </button>
            </motion.div>

            {/* Main Heading */}
            <motion.h1 
              className="heading-botanical mb-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              {activeTab === 'hosts' ? (
                <>
                  Create your perfect
                  <br />
                  <span className="heading-botanical-italic">wedding celebration.</span>
                </>
              ) : (
                <>
                  Celebrate with
                  <br />
                  <span className="heading-botanical-italic">ease and joy.</span>
                </>
              )}
            </motion.h1>

            {/* Subtitle */}
            <motion.p 
              className="text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              {activeTab === 'hosts' 
                ? 'Plan your dream Indian wedding with AI-powered assistance. Manage guests, vendors, and multi-day events in one elegant platform.'
                : 'RSVP with ease, view event schedules, and stay connected with every celebration detail at your fingertips.'
              }
            </motion.p>

            {/* CTA Buttons */}
            <motion.div 
              className="flex flex-wrap items-center justify-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <Link href={activeTab === 'hosts' ? '/host' : '/rsvp'}>
                <motion.button
                  className="btn-botanical text-base px-8 py-4"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {activeTab === 'hosts' ? 'Start Planning' : 'Submit RSVP'}
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </Link>
              <Link href={activeTab === 'hosts' ? '/dashboard' : '/guestdashboard'}>
                <motion.button
                  className="btn-botanical-outline text-base px-8 py-4"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {activeTab === 'hosts' ? 'View Dashboard' : 'Guest Portal'}
                </motion.button>
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div 
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <div className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex justify-center pt-2">
            <motion.div 
              className="w-1 h-2.5 bg-muted-foreground/50 rounded-full"
              animate={{ y: [0, 10, 0], opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </section>

      {/* Label Section */}
      <section className="py-6 border-y border-border bg-secondary/30">
        <div className="max-w-7xl mx-auto px-6">
          <p className="label-botanical text-center">Our Features</p>
        </div>
      </section>

      {/* Services Section */}
      <section className="section-botanical">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-normal mb-4">
              Curated planning tools for
              <br />
              <span className="italic">every celebration.</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              From intimate gatherings to grand celebrations, we provide everything you need.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {services.map((service, index) => (
              <ServiceCard key={index} {...service} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section className="section-botanical bg-secondary/30">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="text-3xl md:text-4xl font-serif font-normal mb-4">
              Experience tailored to you
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Whether you&apos;re hosting or attending, we have you covered.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Host Card */}
            <motion.div
              className="card-botanical card-botanical-hover"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <h3 className="text-xl font-serif font-medium mb-2">For Hosts</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Full control over your wedding planning with AI assistance.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Complete event management
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  AI-powered vendor suggestions
                </li>
              </ul>
              <Link href="/host">
                <button className="btn-botanical w-full justify-center">
                  Start Planning
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </motion.div>

            {/* Guest Card */}
            <motion.div
              className="card-botanical card-botanical-hover relative"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              transition={{ delay: 0.1 }}
            >
              <div className="absolute -top-3 right-4">
                <span className="text-xs bg-primary text-white px-3 py-1 rounded-full font-medium">
                  Popular
                </span>
              </div>
              <h3 className="text-xl font-serif font-medium mb-2">For Guests</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Easy RSVP and event information at your fingertips.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Simple RSVP process
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Real-time schedule updates
                </li>
              </ul>
              <Link href="/rsvp">
                <button className="btn-botanical-outline w-full justify-center">
                  Submit RSVP
                </button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Status Section */}
      <section className="py-12">
        <div className="max-w-xl mx-auto px-6">
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4 border border-border bg-white">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-50">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Frontend</p>
                  <p className="text-xs text-muted-foreground">Running</p>
                </div>
              </div>
            </Card>
            <Card className={`p-4 border bg-white ${healthStatus.backend ? 'border-border' : 'border-red-200'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${healthStatus.backend ? 'bg-green-50' : 'bg-red-50'}`}>
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
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-botanical">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            className="max-w-2xl mx-auto text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <p className="label-botanical mb-4">Get Started</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-normal mb-6">
              Let&apos;s plan something
              <br />
              <span className="italic">beautiful together.</span>
            </h2>
            <p className="text-muted-foreground mb-10 max-w-md mx-auto">
              Whether you&apos;re planning an intimate ceremony or a grand celebration, we&apos;re here to help make it perfect.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/host">
                <motion.button
                  className="btn-botanical text-base px-8 py-4"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Create Your Wedding
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </Link>
              <Link href="/dashboard">
                <motion.button
                  className="btn-botanical-outline text-base px-8 py-4"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  View Demo
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <BotanicalFooter />
    </div>
  );
}
