'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Sparkles, Calendar, Users, Utensils, Home, Send, 
  ChevronRight, Loader2, UserCheck, Bot, User, X, 
  AlertTriangle, Edit, CheckCircle, Rocket, MessageCircle,
  Timer, Clock, PartyPopper
} from 'lucide-react';
import Link from 'next/link';

// Parse date string to Date object - handles various formats
const parseWeddingDate = (dateStr) => {
  if (!dateStr) return null;
  
  // If already a valid Date
  if (dateStr instanceof Date && !isNaN(dateStr)) return dateStr;
  
  // Try ISO format first (YYYY-MM-DD)
  let date = new Date(dateStr + 'T00:00:00');
  if (!isNaN(date.getTime())) return date;
  
  // Try DD-MM-YYYY format
  const ddmmyyyy = dateStr.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (ddmmyyyy) {
    date = new Date(`${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}T00:00:00`);
    if (!isNaN(date.getTime())) return date;
  }
  
  // Try MM/DD/YYYY format
  const mmddyyyy = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (mmddyyyy) {
    date = new Date(`${mmddyyyy[3]}-${mmddyyyy[1]}-${mmddyyyy[2]}T00:00:00`);
    if (!isNaN(date.getTime())) return date;
  }
  
  return null;
};

// Calculate countdown values safely
const calculateCountdown = (targetDate) => {
  if (!targetDate || isNaN(targetDate.getTime())) {
    return null;
  }

  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();

  if (diff <= 0) {
    return { isPast: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { isPast: false, days, hours, minutes, seconds };
};

export default function DashboardPage() {
  const { toast } = useToast();
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';
  const chatEndRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  // State
  const [weddings, setWeddings] = useState([]);
  const [selectedWeddingId, setSelectedWeddingId] = useState('');
  const [wedding, setWedding] = useState(null);
  const [guests, setGuests] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Countdown state - FIXED
  const [countdown, setCountdown] = useState(null);
  const [countdownLabel, setCountdownLabel] = useState('');
  const [countdownVenue, setCountdownVenue] = useState('');

  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);

  // Complaint State
  const [isComplaintMode, setIsComplaintMode] = useState(false);
  const [complaintText, setComplaintText] = useState('');
  const [draftedComplaint, setDraftedComplaint] = useState('');
  const [isEditingDraft, setIsEditingDraft] = useState(false);
  const [targetVendor, setTargetVendor] = useState(null);

  // Vendor complaint modal
  const [showVendorComplaintModal, setShowVendorComplaintModal] = useState(false);
  const [selectedVendorForComplaint, setSelectedVendorForComplaint] = useState(null);
  const [vendorComplaintText, setVendorComplaintText] = useState('');
  const [isSubmittingVendorComplaint, setIsSubmittingVendorComplaint] = useState(false);

  // Fetch all weddings on mount
  useEffect(() => {
    fetchWeddings();
  }, []);

  // Fetch wedding data when selection changes
  useEffect(() => {
    if (selectedWeddingId) {
      fetchWeddingData(selectedWeddingId);
    }
  }, [selectedWeddingId]);

  // Countdown timer - FIXED with proper cleanup
  const updateCountdown = useCallback(() => {
    if (!wedding) {
      setCountdown(null);
      setCountdownLabel('');
      setCountdownVenue('');
      return;
    }

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Parse wedding dates
    const startDate = parseWeddingDate(wedding.startDate);
    const endDate = parseWeddingDate(wedding.endDate);

    // Validate dates
    if (!startDate) {
      setCountdown(null);
      setCountdownLabel('Invalid wedding date');
      return;
    }

    // Set end of day for end date comparison
    const endDateTime = endDate ? new Date(endDate.getTime() + 24 * 60 * 60 * 1000 - 1) : null;

    // Check if wedding hasn't started yet
    if (now < startDate) {
      const result = calculateCountdown(startDate);
      if (result) {
        setCountdown(result);
        setCountdownLabel('Wedding starts in');
        setCountdownVenue('');
      }
      return;
    }

    // Check if wedding is ongoing (between start and end date)
    if (endDateTime && now <= endDateTime) {
      // Find today's events
      const todayIndex = wedding.days?.findIndex(d => d.date === today);
      
      if (todayIndex >= 0 && wedding.days[todayIndex].events) {
        const todayEvents = wedding.days[todayIndex].events;
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        
        // Find next upcoming event today
        for (const event of todayEvents) {
          if (!event.time) continue;
          
          const [eventHours, eventMinutes] = event.time.split(':').map(Number);
          if (isNaN(eventHours) || isNaN(eventMinutes)) continue;
          
          const eventTotalMinutes = eventHours * 60 + eventMinutes;
          
          if (eventTotalMinutes > currentMinutes) {
            // Create target date/time for this event
            const eventDate = new Date(today + 'T' + event.time + ':00');
            const result = calculateCountdown(eventDate);
            
            if (result && !result.isPast) {
              setCountdown(result);
              setCountdownLabel(`${event.name} starts in`);
              setCountdownVenue(event.venue || '');
              return;
            }
          }
        }
      }
      
      // All events for today have passed, check next day
      const nextDayIndex = (todayIndex >= 0 ? todayIndex : -1) + 1;
      if (wedding.days && nextDayIndex < wedding.days.length) {
        const nextDay = wedding.days[nextDayIndex];
        const firstEvent = nextDay.events?.[0];
        
        if (firstEvent && nextDay.date && firstEvent.time) {
          const eventDate = new Date(nextDay.date + 'T' + firstEvent.time + ':00');
          const result = calculateCountdown(eventDate);
          
          if (result && !result.isPast) {
            setCountdown(result);
            setCountdownLabel(`${firstEvent.name} starts in`);
            setCountdownVenue(firstEvent.venue || '');
            return;
          }
        }
      }
      
      // Wedding is ongoing but no more events
      setCountdown({ isLive: true });
      setCountdownLabel('Wedding is live!');
      setCountdownVenue('');
      return;
    }

    // Wedding has ended
    setCountdown({ isPast: true });
    setCountdownLabel('Wedding has concluded');
    setCountdownVenue('');
  }, [wedding]);

  // Setup countdown interval
  useEffect(() => {
    // Initial update
    updateCountdown();

    // Clear existing interval
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    // Set up new interval - update every second
    countdownIntervalRef.current = setInterval(updateCountdown, 1000);

    // Cleanup
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [updateCountdown]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const fetchWeddings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/weddings`);
      if (!response.ok) throw new Error('Failed to fetch weddings');
      const data = await response.json();
      setWeddings(data);
      if (data.length > 0) {
        setSelectedWeddingId(data[0].id);
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to load weddings.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWeddingData = async (weddingId) => {
    try {
      const [weddingRes, guestsRes, vendorsRes] = await Promise.all([
        fetch(`${backendUrl}/api/wedding/${weddingId}`),
        fetch(`${backendUrl}/api/guest/list?weddingId=${weddingId}`),
        fetch(`${backendUrl}/api/vendor/list?weddingId=${weddingId}`),
      ]);

      if (!weddingRes.ok) throw new Error('Failed to fetch wedding');
      
      const weddingData = await weddingRes.json();
      const guestsData = guestsRes.ok ? await guestsRes.json() : [];
      const vendorsData = vendorsRes.ok ? await vendorsRes.json() : [];

      setWedding(weddingData);
      setGuests(guestsData);
      setVendors(vendorsData);
      setSelectedDayIndex(0);
      setChatMessages([]);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to load wedding data.',
        variant: 'destructive',
      });
    }
  };

  // Calculate guest stats for a specific day
  const getGuestStatsForDay = (dayIndex) => {
    const attendingGuests = guests.filter(g => g.attendingDays && g.attendingDays[dayIndex] === true);
    
    const dietaryBreakdown = {
      veg: attendingGuests.filter(g => g.dietary === 'veg').length,
      'non-veg': attendingGuests.filter(g => g.dietary === 'non-veg').length,
      jain: attendingGuests.filter(g => g.dietary === 'jain').length,
      vegan: attendingGuests.filter(g => g.dietary === 'vegan').length,
    };

    const needAccommodation = attendingGuests.filter(g => g.accommodation === true).length;

    return {
      attending: attendingGuests.length,
      total: guests.length,
      dietaryBreakdown,
      needAccommodation,
    };
  };

  const getVendorStats = () => {
    const confirmed = vendors.filter(v => v.attendingDays && v.attendingDays.some(d => d === true)).length;
    const pending = vendors.filter(v => !v.attendingDays || v.attendingDays.length === 0).length;
    return { confirmed, pending, total: vendors.length };
  };

  // Chatbot complaint flow
  const handleStartComplaint = () => {
    setIsComplaintMode(true);
    setComplaintText('');
    setDraftedComplaint('');
    setIsEditingDraft(false);
    setTargetVendor(null);
  };

  const handleSubmitComplaint = async () => {
    if (!complaintText.trim() || !selectedWeddingId) return;

    setIsSendingChat(true);
    setChatMessages(prev => [...prev, { 
      role: 'user', 
      content: `🚨 Issue: ${complaintText}`,
      isComplaint: true 
    }]);

    try {
      const response = await fetch(`${backendUrl}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          weddingId: selectedWeddingId,
          message: `I need to report an issue: "${complaintText}". Please identify which vendor role this relates to (catering, photography, decoration, music, etc.) and draft a professional but firm message. Also suggest if I should contact them immediately.`,
          role: 'host'
        }),
      });

      if (!response.ok) throw new Error('Failed to draft complaint');

      const data = await response.json();
      setDraftedComplaint(data.result);
      
      // Try to identify vendor type from response
      const vendorTypes = ['catering', 'photography', 'decoration', 'music', 'makeup', 'venue', 'transport'];
      const foundType = vendorTypes.find(t => data.result.toLowerCase().includes(t));
      const matchingVendor = foundType ? vendors.find(v => v.serviceType?.toLowerCase() === foundType) : null;
      
      if (matchingVendor) {
        setTargetVendor(matchingVendor);
      }

      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.result,
        isDraft: true,
        targetVendor: matchingVendor,
        actions: ['edit', 'send']
      }]);
      
      setIsComplaintMode(false);
      setComplaintText('');
    } catch (err) {
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I couldn\'t draft that message. Please try again.',
        isError: true 
      }]);
    } finally {
      setIsSendingChat(false);
    }
  };

  const handleSendToVendor = async () => {
    if (!targetVendor) {
      toast({
        title: 'No Vendor Identified',
        description: 'Could not identify the relevant vendor. Please select manually.',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (targetVendor.email) {
        await fetch(`${backendUrl}/api/email/send-invites`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            weddingId: selectedWeddingId,
            guestEmails: [targetVendor.email],
          }),
        });
      }

      toast({
        title: 'Message Sent!',
        description: `Message sent to ${targetVendor.name} (${targetVendor.email || 'No email'})`,
      });
      
      setChatMessages(prev => [...prev, { 
        role: 'system', 
        content: `✅ Message sent to ${targetVendor.name}!`,
      }]);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to send message to vendor.',
        variant: 'destructive',
      });
    }
  };

  // Direct vendor complaint
  const openVendorComplaint = (vendor) => {
    setSelectedVendorForComplaint(vendor);
    setVendorComplaintText('');
    setShowVendorComplaintModal(true);
  };

  const submitVendorComplaint = async () => {
    if (!vendorComplaintText.trim() || !selectedVendorForComplaint) return;

    setIsSubmittingVendorComplaint(true);
    try {
      const response = await fetch(`${backendUrl}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          weddingId: selectedWeddingId,
          message: `Draft a professional complaint message to a ${selectedVendorForComplaint.serviceType} vendor about: "${vendorComplaintText}"`,
          role: 'host'
        }),
      });

      if (!response.ok) throw new Error('Failed to generate message');

      if (selectedVendorForComplaint.email) {
        await fetch(`${backendUrl}/api/email/send-invites`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            weddingId: selectedWeddingId,
            guestEmails: [selectedVendorForComplaint.email],
          }),
        });
      }

      toast({
        title: 'Complaint Sent!',
        description: `Message sent to ${selectedVendorForComplaint.name}`,
      });

      setShowVendorComplaintModal(false);
      setVendorComplaintText('');
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to send complaint.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingVendorComplaint(false);
    }
  };

  // Regular chat
  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedWeddingId) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsSendingChat(true);

    try {
      const response = await fetch(`${backendUrl}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          weddingId: selectedWeddingId,
          message: userMessage,
          role: 'host'
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.result }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.',
        isError: true 
      }]);
    } finally {
      setIsSendingChat(false);
    }
  };

  const stats = wedding ? getGuestStatsForDay(selectedDayIndex) : null;
  const vendorStats = getVendorStats();

  // Render countdown component
  const renderCountdown = () => {
    if (!countdown) return null;

    // Wedding has ended
    if (countdown.isPast) {
      return (
        <Card className="mb-6 border-2 border-gray-200 bg-gradient-to-r from-gray-50 to-white shadow-lg">
          <CardContent className="py-5">
            <div className="flex items-center justify-center gap-4">
              <div className="p-3 rounded-full bg-gray-200">
                <CheckCircle className="w-6 h-6 text-gray-500" />
              </div>
              <span className="text-lg font-medium text-gray-600">{countdownLabel}</span>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Wedding is live
    if (countdown.isLive) {
      return (
        <Card className="mb-6 border-2 border-green-300 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg">
          <CardContent className="py-5">
            <div className="flex items-center justify-center gap-4">
              <div className="p-3 rounded-full bg-green-500 animate-pulse">
                <PartyPopper className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-green-700">🎉 {countdownLabel}</span>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Active countdown
    const { days, hours, minutes, seconds } = countdown;

    return (
      <Card className="mb-6 border-2 border-primary/20 shadow-lg bg-gradient-to-r from-primary/5 via-amber-50/50 to-primary/5">
        <CardContent className="py-5">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-gradient-to-br from-primary to-amber-400">
                <Timer className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">{countdownLabel}</p>
                {countdownVenue && <p className="text-xs text-muted-foreground">at {countdownVenue}</p>}
              </div>
            </div>

            <div className="flex items-center gap-3 md:ml-auto">
              {days > 0 && (
                <>
                  <div className="text-center">
                    <div className="text-3xl md:text-4xl font-bold text-primary tabular-nums">{days}</div>
                    <div className="text-xs text-muted-foreground uppercase">Days</div>
                  </div>
                  <span className="text-xl text-muted-foreground">:</span>
                </>
              )}
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary tabular-nums">{String(hours).padStart(2, '0')}</div>
                <div className="text-xs text-muted-foreground uppercase">Hrs</div>
              </div>
              <span className="text-xl text-muted-foreground">:</span>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary tabular-nums">{String(minutes).padStart(2, '0')}</div>
                <div className="text-xs text-muted-foreground uppercase">Min</div>
              </div>
              <span className="text-xl text-muted-foreground">:</span>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary tabular-nums">{String(seconds).padStart(2, '0')}</div>
                <div className="text-xs text-muted-foreground uppercase">Sec</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-amber-50/30 to-white">
      {/* Header */}
      <header className="border-b border-primary/20 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold font-serif">AI Wedding Ops</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/host" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Host</Link>
            <Link href="/dashboard" className="text-sm font-medium text-primary">Dashboard</Link>
            <Link href="/guestdashboard" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Guest</Link>
            <Link href="/postwedding" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Photos</Link>
          </nav>
        </div>
      </header>

      <div className="flex">
        {/* Main Content */}
        <main className={`flex-1 container mx-auto px-4 py-8 transition-all duration-300 ${isChatOpen ? 'mr-96' : ''}`}>
          <div className="max-w-6xl mx-auto">
            {/* Title & Wedding Selector */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2 font-serif">Wedding Dashboard</h1>
                <p className="text-muted-foreground">Manage your wedding, guests, and vendors</p>
              </div>
              
              <Select value={selectedWeddingId} onValueChange={setSelectedWeddingId}>
                <SelectTrigger className="w-[250px] border-primary/20">
                  <SelectValue placeholder="Select a wedding" />
                </SelectTrigger>
                <SelectContent>
                  {weddings.map(w => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : weddings.length === 0 ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="border-2 border-dashed border-primary/30">
                  <CardContent className="py-16 text-center">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-amber-100 flex items-center justify-center">
                      <Calendar className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3 font-serif">No Weddings Yet</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      Create your first wedding to start managing guests, vendors, and events.
                    </p>
                    <Link href="/host">
                      <Button className="gap-2 bg-primary hover:bg-primary/90">
                        <Rocket className="w-5 h-5" />
                        Create Your Wedding
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ) : wedding && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                {/* Countdown Timer - FIXED */}
                {renderCountdown()}

                {/* Wedding Info Card */}
                <Card className="mb-6 border-2 border-primary/20 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-2xl font-serif">{wedding.name}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <span>{wedding.location}</span>
                          <span>•</span>
                          <span>{wedding.startDate} to {wedding.endDate}</span>
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="bg-primary/10 text-primary">
                        {wedding.days?.length || 0} Days
                      </Badge>
                    </div>
                  </CardHeader>
                </Card>

                {/* Day Selector Tabs */}
                {wedding.days && wedding.days.length > 0 && (
                  <Tabs value={selectedDayIndex.toString()} onValueChange={(v) => setSelectedDayIndex(parseInt(v))} className="mb-6">
                    <TabsList className="bg-white border border-primary/20 p-1 h-auto flex-wrap">
                      {wedding.days.map((day, index) => (
                        <TabsTrigger key={index} value={index.toString()} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2">
                          <Calendar className="w-4 h-4 mr-2" />
                          Day {index + 1} - {day.date}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {wedding.days.map((day, index) => (
                      <TabsContent key={index} value={index.toString()} className="mt-6">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                          <Card className="border-primary/20 hover:shadow-md transition-shadow">
                            <CardContent className="pt-6">
                              <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-full">
                                  <Users className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Guests</p>
                                  <p className="text-2xl font-bold">{stats?.attending || 0}<span className="text-sm font-normal text-muted-foreground">/{stats?.total || 0}</span></p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          <Card className="border-primary/20 hover:shadow-md transition-shadow">
                            <CardContent className="pt-6">
                              <div className="flex items-center gap-4">
                                <div className="p-3 bg-green-100 rounded-full">
                                  <Utensils className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground mb-1">Dietary</p>
                                  <div className="flex flex-wrap gap-1">
                                    <Badge variant="outline" className="text-xs">Veg: {stats?.dietaryBreakdown?.veg || 0}</Badge>
                                    <Badge variant="outline" className="text-xs">Non-Veg: {stats?.dietaryBreakdown?.['non-veg'] || 0}</Badge>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          <Card className="border-primary/20 hover:shadow-md transition-shadow">
                            <CardContent className="pt-6">
                              <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-100 rounded-full">
                                  <Home className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Accommodation</p>
                                  <p className="text-2xl font-bold">{stats?.needAccommodation || 0}</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          <Card className="border-primary/20 hover:shadow-md transition-shadow">
                            <CardContent className="pt-6">
                              <div className="flex items-center gap-4">
                                <div className="p-3 bg-purple-100 rounded-full">
                                  <UserCheck className="w-6 h-6 text-purple-600" />
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Vendors</p>
                                  <div className="flex items-center gap-2">
                                    <span className="text-2xl font-bold">{vendorStats.confirmed}</span>
                                    <span className="text-sm text-green-600">confirmed</span>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Events */}
                        <Card className="border-primary/20 mb-6">
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2 font-serif">
                              <Clock className="w-5 h-5 text-primary" />
                              Events for Day {index + 1}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {day.events?.length > 0 ? day.events.map((event, eventIndex) => (
                                <div key={eventIndex} className="flex items-center gap-4 p-3 bg-gradient-to-r from-primary/5 to-transparent rounded-lg border border-primary/10">
                                  <Badge className="bg-primary text-primary-foreground">{event.time}</Badge>
                                  <div className="flex-1">
                                    <p className="font-medium">{event.name}</p>
                                    <p className="text-sm text-muted-foreground">{event.venue}</p>
                                  </div>
                                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                                </div>
                              )) : (
                                <p className="text-muted-foreground text-center py-4">No events scheduled</p>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>
                    ))}
                  </Tabs>
                )}

                {/* Vendors List with Report Issue Button */}
                <Card className="border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-serif">
                      <UserCheck className="w-5 h-5 text-primary" />
                      Vendors ({vendors.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {vendors.length > 0 ? (
                      <div className="space-y-3">
                        {vendors.map((vendor, index) => (
                          <div key={vendor.id || index} className="flex items-center justify-between p-3 bg-white border border-primary/10 rounded-lg hover:border-primary/20 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${vendor.attendingDays?.some(d => d) ? 'bg-green-500' : 'bg-amber-400'}`} />
                              <div>
                                <p className="font-medium">{vendor.name}</p>
                                <p className="text-sm text-muted-foreground">{vendor.serviceType}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => openVendorComplaint(vendor)}
                                className="gap-1 text-amber-700 border-amber-300 hover:bg-amber-50"
                              >
                                <AlertTriangle className="w-4 h-4" />
                                Report Issue
                              </Button>
                              <Badge variant={vendor.attendingDays?.some(d => d) ? 'default' : 'secondary'} className={vendor.attendingDays?.some(d => d) ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                                {vendor.attendingDays?.some(d => d) ? 'Confirmed' : 'Pending'}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">No vendors added yet</p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </main>

        {/* Chat Panel */}
        <AnimatePresence>
          {isChatOpen && (
            <motion.div 
              className="fixed top-0 right-0 h-full w-96 bg-white border-l border-primary/20 shadow-2xl z-40"
              style={{ top: '73px', height: 'calc(100vh - 73px)' }}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <div className="flex flex-col h-full">
                <div className="p-4 border-b border-primary/20 bg-gradient-to-r from-primary/10 to-primary/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-amber-400 flex items-center justify-center">
                        <span className="text-sm">🤵</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">Aarav - Host Assistant</h3>
                        <p className="text-xs text-muted-foreground">AI Wedding Copilot</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setIsChatOpen(false)} className="h-8 w-8">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="p-3 border-b border-primary/10 bg-amber-50/50">
                  <p className="text-xs text-muted-foreground mb-2">Quick Actions</p>
                  <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-amber-700 border-amber-300 hover:bg-amber-100" onClick={handleStartComplaint}>
                    <AlertTriangle className="w-4 h-4" />
                    Report Issue to Vendor
                  </Button>
                </div>

                {isComplaintMode && (
                  <motion.div className="p-4 border-b border-primary/10 bg-red-50" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                    <p className="text-sm font-medium text-red-700 mb-2">Describe the issue:</p>
                    <Textarea value={complaintText} onChange={(e) => setComplaintText(e.target.value)} placeholder="e.g., Caterer is late by 30 minutes" className="mb-2 border-red-200 focus:border-red-400" rows={2} />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSubmitComplaint} disabled={!complaintText.trim() || isSendingChat} className="bg-red-600 hover:bg-red-700">
                        {isSendingChat ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Draft Message'}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setIsComplaintMode(false)}>Cancel</Button>
                    </div>
                  </motion.div>
                )}

                <ScrollArea className="flex-1 p-4">
                  {chatMessages.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-amber-100 flex items-center justify-center">
                        <span className="text-2xl">🤵</span>
                      </div>
                      <p className="text-muted-foreground text-sm mb-4">How can I help with your wedding?</p>
                      <div className="space-y-2">
                        {["Summarize guest dietary needs", "What vendors need follow-up?", "Draft a reminder message"].map((suggestion, i) => (
                          <button key={i} onClick={() => setChatInput(suggestion)} className="block w-full text-left text-xs p-2 bg-primary/5 hover:bg-primary/10 rounded border border-primary/10 transition-colors">
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {chatMessages.map((msg, index) => (
                        <motion.div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : msg.role === 'system' ? 'justify-center' : 'justify-start'}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                          {msg.role === 'system' ? (
                            <div className="text-xs text-center text-green-600 bg-green-50 px-3 py-1.5 rounded-full">{msg.content}</div>
                          ) : (
                            <div className={`flex items-start gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-gradient-to-br from-primary/20 to-amber-100'}`}>
                                {msg.role === 'user' ? <User className="w-4 h-4" /> : <span className="text-xs">🤵</span>}
                              </div>
                              <div>
                                <div className={`p-3 rounded-lg ${msg.role === 'user' ? msg.isComplaint ? 'bg-red-500 text-white' : 'bg-primary text-primary-foreground' : msg.isError ? 'bg-red-50 border border-red-200 text-red-700' : msg.isDraft ? 'bg-blue-50 border border-blue-200' : 'bg-gray-100'}`}>
                                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                </div>
                                {msg.isDraft && (
                                  <div className="flex gap-2 mt-2">
                                    <Button size="sm" variant="outline" onClick={() => setIsEditingDraft(!isEditingDraft)} className="h-7 text-xs">
                                      <Edit className="w-3 h-3 mr-1" /> Edit
                                    </Button>
                                    <Button size="sm" onClick={handleSendToVendor} className="h-7 text-xs bg-green-600 hover:bg-green-700">
                                      <Send className="w-3 h-3 mr-1" /> Send to Vendor
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      ))}
                      {isSendingChat && !isComplaintMode && (
                        <div className="flex justify-start">
                          <div className="flex items-start gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/20 to-amber-100 flex items-center justify-center">
                              <span className="text-xs">🤵</span>
                            </div>
                            <div className="p-3 rounded-lg bg-gray-100">
                              <Loader2 className="w-4 h-4 animate-spin" />
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>
                  )}
                </ScrollArea>

                <form onSubmit={handleSendChat} className="p-4 border-t border-primary/20 bg-white">
                  <div className="flex gap-2">
                    <Input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Ask about your wedding..." className="flex-1 border-primary/20" disabled={isSendingChat || !selectedWeddingId || isComplaintMode} />
                    <Button type="submit" size="icon" disabled={isSendingChat || !chatInput.trim() || !selectedWeddingId || isComplaintMode} className="bg-primary hover:bg-primary/90">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Chat Button */}
      <motion.button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center z-50 ${isChatOpen ? 'bg-gray-700' : 'bg-gradient-to-br from-primary to-amber-400'}`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        {isChatOpen ? <X className="w-6 h-6 text-white" /> : <MessageCircle className="w-6 h-6 text-white" />}
      </motion.button>

      {/* Vendor Complaint Modal */}
      <Dialog open={showVendorComplaintModal} onOpenChange={setShowVendorComplaintModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-serif">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              Report Issue to {selectedVendorForComplaint?.name}
            </DialogTitle>
            <DialogDescription>
              Describe the issue and we'll send a professional message to the {selectedVendorForComplaint?.serviceType} vendor.
            </DialogDescription>
          </DialogHeader>
          
          <Textarea value={vendorComplaintText} onChange={(e) => setVendorComplaintText(e.target.value)} placeholder="e.g., The decorator hasn't arrived yet..." rows={4} className="border-amber-200" />

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVendorComplaintModal(false)}>Cancel</Button>
            <Button onClick={submitVendorComplaint} disabled={!vendorComplaintText.trim() || isSubmittingVendorComplaint} className="bg-amber-600 hover:bg-amber-700">
              {isSubmittingVendorComplaint ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              Send Complaint
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
