'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Send, Save, Calendar, MapPin, Users, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { ShaadiMiniBot } from '@/components/onboarding/ShaadiBot';

export default function HostPage() {
  const { toast } = useToast();
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';

  // Wedding form state
  const [weddingName, setWeddingName] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [days, setDays] = useState([{ date: '', events: [{ name: '', time: '', venue: '' }] }]);
  const [vendors, setVendors] = useState([
    { type: 'caterer', name: '', email: '' },
    { type: 'decorator', name: '', email: '' }
  ]);

  // Post-save state
  const [savedWeddingId, setSavedWeddingId] = useState(null);
  const [guestEmails, setGuestEmails] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingInvites, setIsSendingInvites] = useState(false);
  const [showMiniBot, setShowMiniBot] = useState(false);

  // Show mini bot after a delay
  useEffect(() => {
    const hasSeenHostTip = localStorage.getItem('shaadi-host-tip-seen');
    if (!hasSeenHostTip) {
      const timer = setTimeout(() => setShowMiniBot(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismissMiniBot = () => {
    setShowMiniBot(false);
    localStorage.setItem('shaadi-host-tip-seen', 'true');
  };

  // Day management
  const addDay = () => {
    setDays([...days, { date: '', events: [{ name: '', time: '', venue: '' }] }]);
  };

  const removeDay = (dayIndex) => {
    if (days.length > 1) {
      setDays(days.filter((_, i) => i !== dayIndex));
    }
  };

  const updateDayDate = (dayIndex, date) => {
    const newDays = [...days];
    newDays[dayIndex].date = date;
    setDays(newDays);
  };

  // Event management
  const addEvent = (dayIndex) => {
    const newDays = [...days];
    newDays[dayIndex].events.push({ name: '', time: '', venue: '' });
    setDays(newDays);
  };

  const removeEvent = (dayIndex, eventIndex) => {
    const newDays = [...days];
    if (newDays[dayIndex].events.length > 1) {
      newDays[dayIndex].events = newDays[dayIndex].events.filter((_, i) => i !== eventIndex);
      setDays(newDays);
    }
  };

  const updateEvent = (dayIndex, eventIndex, field, value) => {
    const newDays = [...days];
    newDays[dayIndex].events[eventIndex][field] = value;
    setDays(newDays);
  };

  // Vendor management
  const updateVendor = (index, field, value) => {
    const newVendors = [...vendors];
    newVendors[index] = { ...newVendors[index], [field]: value };
    setVendors(newVendors);
  };

  // Validation
  const validateForm = () => {
    if (!weddingName.trim()) return 'Wedding name is required';
    if (!location.trim()) return 'Location is required';
    if (!startDate) return 'Start date is required';
    if (!endDate) return 'End date is required';
    
    for (let i = 0; i < days.length; i++) {
      if (!days[i].date) return `Date is required for Day ${i + 1}`;
      for (let j = 0; j < days[i].events.length; j++) {
        if (!days[i].events[j].name.trim()) return `Event name is required for Day ${i + 1}, Event ${j + 1}`;
        if (!days[i].events[j].time) return `Event time is required for Day ${i + 1}, Event ${j + 1}`;
        if (!days[i].events[j].venue.trim()) return `Venue is required for Day ${i + 1}, Event ${j + 1}`;
      }
    }
    
    return null;
  };

  // Save wedding
  const handleSaveWedding = async () => {
    const error = validateForm();
    if (error) {
      toast({
        title: 'Validation Error',
        description: error,
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: weddingName,
        location,
        startDate,
        endDate,
        days: days.map((day, index) => ({
          dayIndex: index,
          date: day.date,
          events: day.events.map(event => ({
            name: event.name,
            time: event.time,
            venue: event.venue,
          })),
        })),
      };

      const response = await fetch(`${backendUrl}/api/wedding/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to save wedding');
      }

      const data = await response.json();
      setSavedWeddingId(data.id);
      
      toast({
        title: 'Wedding Saved!',
        description: `"${weddingName}" has been created successfully.`,
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to save wedding',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Send invites
  const handleSendInvites = async () => {
    if (!savedWeddingId) {
      toast({
        title: 'Error',
        description: 'Please save the wedding first',
        variant: 'destructive',
      });
      return;
    }

    const emails = guestEmails
      .split(',')
      .map(e => e.trim())
      .filter(e => e && e.includes('@'));

    if (emails.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please enter at least one valid email address',
        variant: 'destructive',
      });
      return;
    }

    setIsSendingInvites(true);
    try {
      const response = await fetch(`${backendUrl}/api/email/send-invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weddingId: savedWeddingId,
          guestEmails: emails,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to send invites');
      }

      const data = await response.json();
      
      toast({
        title: 'Invitations Sent!',
        description: `${data.emailsSent} invitation(s) sent successfully.${data.failed.length > 0 ? ` Failed: ${data.failed.join(', ')}` : ''}`,
      });
      
      setGuestEmails('');
    } catch (err) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to send invitations',
        variant: 'destructive',
      });
    } finally {
      setIsSendingInvites(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-amber-50/30 to-white">
      {/* Mini Bot Helper */}
      {showMiniBot && (
        <ShaadiMiniBot 
          message="Start by entering your wedding name and location. Then add your event days with all the ceremonies - Mehendi, Sangeet, and more!" 
          onClose={handleDismissMiniBot}
        />
      )}

      {/* Header */}
      <header className="border-b border-primary/20 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold">AI Wedding Ops</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/host" className="text-sm font-medium text-primary">Host</Link>
            <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Dashboard</Link>
            <Link href="/guestdashboard" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Guest</Link>
            <Link href="/rsvp" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">RSVP</Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Host Setup & Invite Manager</h1>
          <p className="text-muted-foreground">Create your wedding and invite your guests</p>
        </div>

        {/* Wedding Setup Form */}
        <Card className="mb-8 border-2 border-primary/20 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/10">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Calendar className="w-5 h-5 text-primary" />
              Wedding Setup Form
            </CardTitle>
            <CardDescription>Enter your wedding details</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* Basic Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weddingName">Wedding Name *</Label>
                <Input
                  id="weddingName"
                  placeholder="e.g., Royal Wedding 2026"
                  value={weddingName}
                  onChange={(e) => setWeddingName(e.target.value)}
                  className="border-primary/20 focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location" className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" /> Location *
                </Label>
                <Input
                  id="location"
                  placeholder="e.g., Udaipur Palace, Rajasthan"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="border-primary/20 focus:border-primary"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="border-primary/20 focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="border-primary/20 focus:border-primary"
                />
              </div>
            </div>

            {/* Day-wise Events */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold">Day-wise Events</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addDay}
                  className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Day
                </Button>
              </div>

              {days.map((day, dayIndex) => (
                <Card key={dayIndex} className="border border-primary/20 bg-gradient-to-r from-amber-50/50 to-white">
                  <CardContent className="pt-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="font-semibold text-primary">Day {dayIndex + 1}</span>
                        <Input
                          type="date"
                          value={day.date}
                          onChange={(e) => updateDayDate(dayIndex, e.target.value)}
                          className="w-40 border-primary/20"
                        />
                      </div>
                      {days.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDay(dayIndex)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    {day.events.map((event, eventIndex) => (
                      <div key={eventIndex} className="grid md:grid-cols-4 gap-2 items-end pl-4 border-l-2 border-primary/30">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Event Name</Label>
                          <Input
                            placeholder="e.g., Mehendi"
                            value={event.name}
                            onChange={(e) => updateEvent(dayIndex, eventIndex, 'name', e.target.value)}
                            className="border-primary/20"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Time</Label>
                          <Input
                            type="time"
                            value={event.time}
                            onChange={(e) => updateEvent(dayIndex, eventIndex, 'time', e.target.value)}
                            className="border-primary/20"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Venue</Label>
                          <Input
                            placeholder="e.g., Garden"
                            value={event.venue}
                            onChange={(e) => updateEvent(dayIndex, eventIndex, 'venue', e.target.value)}
                            className="border-primary/20"
                          />
                        </div>
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => addEvent(dayIndex)}
                            className="border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                          {day.events.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => removeEvent(dayIndex, eventIndex)}
                              className="border-destructive/30 text-destructive hover:bg-destructive hover:text-white"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Vendors (Optional) */}
            <div className="space-y-4">
              <Label className="text-lg font-semibold">Vendors (Optional)</Label>
              <div className="grid md:grid-cols-2 gap-4">
                {vendors.map((vendor, index) => (
                  <Card key={index} className="border border-primary/10 bg-white">
                    <CardContent className="pt-4 space-y-3">
                      <Label className="text-sm font-medium capitalize text-primary">{vendor.type}</Label>
                      <Input
                        placeholder="Name"
                        value={vendor.name}
                        onChange={(e) => updateVendor(index, 'name', e.target.value)}
                        className="border-primary/20"
                      />
                      <Input
                        placeholder="Email"
                        type="email"
                        value={vendor.email}
                        onChange={(e) => updateVendor(index, 'email', e.target.value)}
                        className="border-primary/20"
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <Button
              onClick={handleSaveWedding}
              disabled={isSaving || !!savedWeddingId}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 text-lg"
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span> Saving...
                </span>
              ) : savedWeddingId ? (
                <span className="flex items-center gap-2">
                  <span>✓</span> Wedding Saved
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Save className="w-5 h-5" /> Save Wedding
                </span>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Invite Guests Section - Only visible after saving */}
        {savedWeddingId && (
          <Card className="border-2 border-primary/20 shadow-lg animate-in slide-in-from-bottom-4">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/10">
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Users className="w-5 h-5 text-primary" />
                Invite Guests
              </CardTitle>
              <CardDescription>Send wedding invitations to your guests</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="guestEmails">Guest Emails (comma-separated)</Label>
                <Textarea
                  id="guestEmails"
                  placeholder="guest1@example.com, guest2@example.com, guest3@example.com"
                  value={guestEmails}
                  onChange={(e) => setGuestEmails(e.target.value)}
                  className="min-h-[100px] border-primary/20 focus:border-primary"
                />
              </div>
              <Button
                onClick={handleSendInvites}
                disabled={isSendingInvites || !guestEmails.trim()}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 text-lg"
              >
                {isSendingInvites ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span> Sending...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send className="w-5 h-5" /> Send Invites
                  </span>
                )}
              </Button>

              {/* RSVP Link Info */}
              <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-primary/20">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">RSVP Link:</strong> Share this link with guests who want to RSVP directly:
                </p>
                <code className="block mt-2 p-2 bg-white rounded text-xs break-all border">
                  {typeof window !== 'undefined' ? `${window.location.origin}/rsvp?weddingId=${savedWeddingId}` : `/rsvp?weddingId=${savedWeddingId}`}
                </code>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
