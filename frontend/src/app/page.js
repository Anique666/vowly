'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle2, Activity, Zap, Rocket, Sparkles, Calendar, Users, MessageCircle, Heart } from 'lucide-react';
import Link from 'next/link';
import { ShaadiBot } from '@/components/onboarding/ShaadiBot';

export default function Home() {
  const [healthStatus, setHealthStatus] = useState({
    frontend: true,
    backend: false,
  });
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(true);

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
      title: 'Multi-Day Events',
      description: 'Plan Mehendi, Sangeet, Wedding & Reception with day-wise schedules.',
    },
    {
      icon: Users,
      title: 'Guest Management',
      description: 'Track RSVPs, dietary preferences, and accommodation needs.',
    },
    {
      icon: MessageCircle,
      title: 'AI Assistant',
      description: 'Get instant help with vendor coordination and guest queries.',
    },
    {
      icon: Heart,
      title: 'Beautiful Memories',
      description: 'Share photos and celebrate moments with your guests.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-amber-50/30 to-white">
      {/* Onboarding */}
      <ShaadiBot 
        showOnboarding={showOnboarding} 
        onDismiss={() => setShowOnboarding(false)} 
      />

      {/* Header */}
      <header className="border-b border-primary/20 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold">AI Wedding Ops</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/host" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Host</Link>
            <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Dashboard</Link>
            <Link href="/guestdashboard" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Guest</Link>
            <Link href="/rsvp" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">RSVP</Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10 -translate-x-1/2 translate-y-1/2" />

        <div className="container mx-auto px-4 py-16 sm:py-24">
          <div className="text-center mb-16 sm:mb-20">
            {/* Aarav introduction */}
            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-gradient-to-r from-primary/10 to-amber-100/50 border border-primary/20 mb-8 animate-fade-in">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-amber-400 flex items-center justify-center">
                <span className="text-sm">🤵</span>
              </div>
              <span className="text-sm font-medium text-foreground">
                Hi! I'm <strong>Aarav</strong>, your AI Wedding Assistant
              </span>
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 tracking-tight animate-fade-in">
              Your Dream Wedding,
              <br />
              <span className="text-primary">Effortlessly Planned</span>
            </h1>
            
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-8 animate-fade-in">
              Plan your perfect Indian wedding celebration with AI-powered assistance. 
              Manage guests, vendors, and multi-day events - all in one beautiful platform.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 animate-fade-in">
              <Link href="/host">
                <Button 
                  size="lg" 
                  className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <Rocket className="w-5 h-5" />
                  Start Planning
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="gap-2 border-primary/30 hover:bg-primary/5 hover:border-primary transition-all duration-300"
                >
                  <Activity className="w-5 h-5" />
                  View Dashboard
                </Button>
              </Link>
            </div>
          </div>

          {/* Health Status Cards - Smaller */}
          <div className="max-w-2xl mx-auto grid grid-cols-2 gap-4 mb-16">
            <Card className="p-4 border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-full bg-green-100">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Frontend</p>
                  <p className="text-xs text-muted-foreground">Running</p>
                </div>
              </div>
            </Card>

            <Card className={`p-4 border transition-all duration-300 hover:shadow-md ${
              healthStatus.backend ? 'border-border hover:border-primary/30' : 'border-red-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-full ${healthStatus.backend ? 'bg-green-100' : 'bg-red-100'}`}>
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

          {/* Features Grid */}
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">
              Everything You Need
            </h2>
            <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
              From planning to celebration, we've got you covered
            </p>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <Card 
                  key={index} 
                  className="p-6 border-2 border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg group hover:-translate-y-1"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </Card>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="max-w-3xl mx-auto mt-20 text-center">
            <Card className="p-8 border-2 border-primary/20 bg-gradient-to-r from-primary/5 via-amber-50/50 to-primary/5">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-amber-400 flex items-center justify-center animate-float">
                  <span className="text-xl">🤵</span>
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-3">Ready to Start?</h3>
              <p className="text-muted-foreground mb-6">
                Let Aarav guide you through creating your perfect wedding celebration.
              </p>
              <Link href="/host">
                <Button size="lg" className="gap-2 bg-primary hover:bg-primary/90">
                  <Sparkles className="w-5 h-5" />
                  Create Your Wedding
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
