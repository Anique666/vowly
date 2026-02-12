'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle2, Activity, Zap, Rocket } from 'lucide-react';

interface HealthStatus {
  frontend: boolean;
  backend: boolean;
  backendMessage?: string;
}

export default function Home() {
  const [healthStatus, setHealthStatus] = useState<HealthStatus>({
    frontend: true,
    backend: false,
  });
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10 -translate-x-1/2 translate-y-1/2" />

        <div className="container mx-auto px-4 py-16 sm:py-24">
          {/* Header */}
          <div className="text-center mb-16 sm:mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Ready for Hackathons</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 tracking-tight">
              Next.js 14 + FastAPI
              <br />
              <span className="text-primary">Starter Template</span>
            </h1>
            
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Modern, fast, and production-ready starter template with TypeScript, 
              Tailwind CSS, shadcn/ui, and FastAPI backend.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button 
                size="lg" 
                className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300"
                data-testid="get-started-btn"
              >
                <Rocket className="w-5 h-5" />
                Get Started
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={checkBackendHealth}
                className="gap-2 border-primary/20 hover:bg-primary/5 hover:border-primary transition-all duration-300"
                data-testid="check-health-btn"
              >
                <Activity className="w-5 h-5" />
                Check Health
              </Button>
            </div>
          </div>

          {/* Health Status Cards */}
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6 mb-16" data-testid="health-status-section">
            {/* Frontend Health */}
            <Card className="p-6 border-2 border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Frontend Status</h3>
                  <p className="text-sm text-muted-foreground">Next.js 14 App Router</p>
                </div>
                <div className="p-2 rounded-full bg-green-100">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-medium text-green-700" data-testid="frontend-status">
                  Running
                </span>
              </div>
            </Card>

            {/* Backend Health */}
            <Card className={`p-6 border-2 transition-all duration-300 hover:shadow-lg ${
              healthStatus.backend 
                ? 'border-border hover:border-primary/30' 
                : 'border-destructive/20 hover:border-destructive/40'
            }`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Backend Status</h3>
                  <p className="text-sm text-muted-foreground">FastAPI Server</p>
                </div>
                <div className={`p-2 rounded-full ${
                  healthStatus.backend ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {healthStatus.backend ? (
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  ) : (
                    <Activity className="w-6 h-6 text-red-600" />
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  healthStatus.backend ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                }`} />
                <span className={`text-sm font-medium ${
                  healthStatus.backend ? 'text-green-700' : 'text-red-700'
                }`} data-testid="backend-status">
                  {loading ? 'Checking...' : (healthStatus.backend ? 'Running' : 'Disconnected')}
                </span>
              </div>
              {healthStatus.backendMessage && (
                <p className="text-xs text-muted-foreground mt-2" data-testid="backend-message">
                  {healthStatus.backendMessage}
                </p>
              )}
            </Card>
          </div>

          {/* Features Grid */}
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12 text-foreground">
              Everything You Need
            </h2>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <Card 
                  key={index} 
                  className="p-6 border-2 border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg group"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors duration-300">
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
        </div>
      </div>
    </div>
  );
}

const features = [
  {
    icon: CheckCircle2,
    title: 'TypeScript',
    description: 'Full type safety across frontend and backend for better developer experience.',
  },
  {
    icon: Zap,
    title: 'Fast Development',
    description: 'Hot reload, modern tooling, and optimized build process for rapid iteration.',
  },
  {
    icon: Activity,
    title: 'Health Checks',
    description: 'Built-in health monitoring endpoints for both frontend and backend services.',
  },
  {
    icon: Rocket,
    title: 'Production Ready',
    description: 'CORS configured, best practices implemented, ready to deploy.',
  },
  {
    icon: CheckCircle2,
    title: 'shadcn/ui',
    description: 'Beautiful, accessible components built with Radix UI and Tailwind CSS.',
  },
  {
    icon: Zap,
    title: 'Modern Stack',
    description: 'Next.js 14 App Router, FastAPI, and cutting-edge web technologies.',
  },
];
