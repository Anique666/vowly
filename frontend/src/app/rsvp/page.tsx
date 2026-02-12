'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import * as LabelPrimitive from '@radix-ui/react-label';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, MapPin, Calendar, Users, CheckCircle2, Loader2, Check } from 'lucide-react';
import Link from 'next/link';

// Custom Label component inline to avoid JSX/TSX issues
const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className || ''}`}
    {...props}
  />
));
Label.displayName = 'Label';

// Custom Checkbox component
const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={`peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground ${className || ''}`}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
      <Check className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

// Custom RadioGroup components
const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Root className={`grid gap-2 ${className || ''}`} {...props} ref={ref} />
));
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Item
    ref={ref}
    className={`aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className || ''}`}
    {...props}
  >
    <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
      <div className="h-2.5 w-2.5 rounded-full bg-current" />
    </RadioGroupPrimitive.Indicator>
  </RadioGroupPrimitive.Item>
));
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;

interface Event {
  id: string;
  name: string;
  time: string;
  venue: string;
}

interface Day {
  dayIndex: number;
  date: string;
  events: Event[];
}

interface Wedding {
  id: string;
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  days: Day[];
}

function RSVPContent() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';

  // URL params
  const weddingIdParam = searchParams.get('weddingId');
  const emailParam = searchParams.get('email');

  // Wedding data
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [weddingId, setWeddingId] = useState(weddingIdParam || '');
  const [name, setName] = useState('');
  const [email, setEmail] = useState(emailParam || '');
  const [attendingDays, setAttendingDays] = useState<boolean[]>([]);
  const [dietary, setDietary] = useState('veg');
  const [accommodation, setAccommodation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Fetch wedding data
  useEffect(() => {
    if (weddingIdParam) {
      fetchWedding(weddingIdParam);
    } else {
      setLoading(false);
    }
  }, [weddingIdParam]);

  const fetchWedding = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${backendUrl}/api/wedding/${id}`);
      if (!response.ok) {
        throw new Error('Wedding not found');
      }
      const data = await response.json();
      setWedding(data);
      setAttendingDays(new Array(data.days.length).fill(false));
    } catch (err) {
      setError('Wedding not found. Please check the link or enter a valid Wedding ID.');
    } finally {
      setLoading(false);
    }
  };

  const handleFetchWedding = () => {
    if (weddingId.trim()) {
      fetchWedding(weddingId.trim());
    }
  };

  const toggleDay = (index: number) => {
    const newAttendingDays = [...attendingDays];
    newAttendingDays[index] = !newAttendingDays[index];
    setAttendingDays(newAttendingDays);
  };

  // Validation
  const validateForm = (): string | null => {
    if (!name.trim()) return 'Name is required';
    if (!email.trim()) return 'Email is required';
    if (!email.includes('@')) return 'Please enter a valid email address';
    if (!attendingDays.some(d => d)) return 'Please select at least one day you will attend';
    return null;
  };

  // Submit RSVP
  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      toast({
        title: 'Validation Error',
        description: validationError,
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${backendUrl}/api/guest/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weddingId: wedding?.id,
          name: name.trim(),
          email: email.trim(),
          attendingDays,
          dietary,
          accommodation,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to submit RSVP');
      }

      setSubmitted(true);
      toast({
        title: 'RSVP Submitted!',
        description: 'Thank you for your response. We look forward to celebrating with you!',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to submit RSVP',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success state
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-amber-50/30 to-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-2 border-primary/20 shadow-xl">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Thank You!</h2>
            <p className="text-muted-foreground">
              Your RSVP for <strong className="text-foreground">{wedding?.name}</strong> has been submitted successfully.
            </p>
            <p className="text-sm text-muted-foreground">
              We're excited to celebrate with you!
            </p>
            <Link href="/">
              <Button className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground">
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-amber-50/30 to-white">
      {/* Header */}
      <header className="border-b border-primary/20 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold text-foreground">AI Wedding Ops</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/host" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Host</Link>
            <Link href="/rsvp" className="text-sm font-medium text-primary">RSVP</Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Wedding Info Header */}
        {wedding && (
          <div className="text-center mb-8 p-6 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-xl border border-primary/20">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">You're Invited!</h1>
            <h2 className="text-xl md:text-2xl font-semibold text-primary mb-4">{wedding.name}</h2>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4 text-primary" /> {wedding.location}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4 text-primary" /> {wedding.startDate} - {wedding.endDate}
              </span>
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* No wedding ID - Show input */}
        {!loading && !wedding && !error && (
          <Card className="border-2 border-primary/20 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/10">
              <CardTitle className="text-foreground">Enter Wedding Details</CardTitle>
              <CardDescription>Please enter the Wedding ID from your invitation</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="weddingIdInput">Wedding ID</Label>
                <Input
                  id="weddingIdInput"
                  placeholder="Enter Wedding ID"
                  value={weddingId}
                  onChange={(e) => setWeddingId(e.target.value)}
                  className="border-primary/20 focus:border-primary"
                />
              </div>
              <Button
                onClick={handleFetchWedding}
                disabled={!weddingId.trim()}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Find Wedding
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Error state */}
        {error && (
          <Card className="border-2 border-destructive/20 shadow-lg">
            <CardContent className="pt-6 space-y-4">
              <p className="text-destructive text-center">{error}</p>
              <div className="space-y-2">
                <Label htmlFor="weddingIdInput">Try Another Wedding ID</Label>
                <Input
                  id="weddingIdInput"
                  placeholder="Enter Wedding ID"
                  value={weddingId}
                  onChange={(e) => setWeddingId(e.target.value)}
                  className="border-primary/20 focus:border-primary"
                />
              </div>
              <Button
                onClick={handleFetchWedding}
                disabled={!weddingId.trim()}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Find Wedding
              </Button>
            </CardContent>
          </Card>
        )}

        {/* RSVP Form */}
        {wedding && (
          <Card className="border-2 border-primary/20 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/10">
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Users className="w-5 h-5 text-primary" />
                Guest RSVP Form
              </CardTitle>
              <CardDescription>Please fill in your details to confirm attendance</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Name & Email */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Your Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="border-primary/20 focus:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              {/* Days Attending */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Days Attending *</Label>
                <div className="grid gap-3">
                  {wedding.days.map((day, index) => (
                    <label
                      key={index}
                      className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        attendingDays[index]
                          ? 'border-primary bg-primary/5'
                          : 'border-primary/20 hover:border-primary/40 bg-white'
                      }`}
                    >
                      <Checkbox
                        checked={attendingDays[index]}
                        onCheckedChange={() => toggleDay(index)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-foreground">Day {index + 1} - {day.date}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {day.events.map((event, i) => (
                            <span key={i}>
                              {event.name} ({event.time}, {event.venue})
                              {i < day.events.length - 1 && ' • '}
                            </span>
                          ))}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Dietary Preference */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Dietary Preference *</Label>
                <RadioGroup value={dietary} onValueChange={setDietary} className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { value: 'veg', label: 'Vegetarian' },
                    { value: 'non-veg', label: 'Non-Veg' },
                    { value: 'jain', label: 'Jain' },
                    { value: 'vegan', label: 'Vegan' },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all text-sm ${
                        dietary === option.value
                          ? 'border-primary bg-primary/5 text-foreground'
                          : 'border-primary/20 hover:border-primary/40 text-muted-foreground'
                      }`}
                    >
                      <RadioGroupItem value={option.value} id={option.value} className="sr-only" />
                      {option.label}
                    </label>
                  ))}
                </RadioGroup>
              </div>

              {/* Accommodation */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Accommodation Needed?</Label>
                <RadioGroup
                  value={accommodation ? 'yes' : 'no'}
                  onValueChange={(v) => setAccommodation(v === 'yes')}
                  className="grid grid-cols-2 gap-3"
                >
                  {[
                    { value: 'yes', label: 'Yes, I need accommodation' },
                    { value: 'no', label: 'No, I have my own' },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all text-sm ${
                        (accommodation ? 'yes' : 'no') === option.value
                          ? 'border-primary bg-primary/5 text-foreground'
                          : 'border-primary/20 hover:border-primary/40 text-muted-foreground'
                      }`}
                    >
                      <RadioGroupItem value={option.value} id={`accom-${option.value}`} className="sr-only" />
                      {option.label}
                    </label>
                  ))}
                </RadioGroup>
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 text-lg"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" /> Submitting...
                  </span>
                ) : (
                  'Submit RSVP'
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

export default function RSVPPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-white via-amber-50/30 to-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <RSVPContent />
    </Suspense>
  );
}
