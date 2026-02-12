'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar, Users, Utensils, Home, Send, 
  ChevronRight, Loader2, Bot, User, X, 
  AlertTriangle, Edit, CheckCircle,
  Timer, Clock, PartyPopper, MessageCircle, Building
} from 'lucide-react';
import { BotanicalHeader, BotanicalFooter } from '@/components/botanical/Layout';

// Parse date string to Date object
const parseWeddingDate = (dateStr) => {
  if (!dateStr) return null;
  if (dateStr instanceof Date && !isNaN(dateStr)) return dateStr;
  let date = new Date(dateStr + 'T00:00:00');
  if (!isNaN(date.getTime())) return date;
  const ddmmyyyy = dateStr.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (ddmmyyyy) { date = new Date(`${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}T00:00:00`); if (!isNaN(date.getTime())) return date; }
  const mmddyyyy = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (mmddyyyy) { date = new Date(`${mmddyyyy[3]}-${mmddyyyy[1]}-${mmddyyyy[2]}T00:00:00`); if (!isNaN(date.getTime())) return date; }
  return null;
};

// Calculate countdown values
const calculateCountdown = (targetDate) => {
  if (!targetDate || isNaN(targetDate.getTime())) return null;
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();
  if (diff <= 0) return { isPast: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
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

  const [weddings, setWeddings] = useState([]);
  const [selectedWeddingId, setSelectedWeddingId] = useState('');
  const [wedding, setWedding] = useState(null);
  const [guests, setGuests] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [countdownLabel, setCountdownLabel] = useState('');
  const [countdownVenue, setCountdownVenue] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [showVendorComplaintModal, setShowVendorComplaintModal] = useState(false);
  const [selectedVendorForComplaint, setSelectedVendorForComplaint] = useState(null);
  const [vendorComplaintText, setVendorComplaintText] = useState('');
  const [isSubmittingVendorComplaint, setIsSubmittingVendorComplaint] = useState(false);

  useEffect(() => { fetchWeddings(); }, []);
  useEffect(() => { if (selectedWeddingId) fetchWeddingData(selectedWeddingId); }, [selectedWeddingId]);

  const updateCountdown = useCallback(() => {
    if (!wedding) { setCountdown(null); setCountdownLabel(''); setCountdownVenue(''); return; }
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const startDate = parseWeddingDate(wedding.startDate);
    const endDate = parseWeddingDate(wedding.endDate);
    if (!startDate) { setCountdown(null); setCountdownLabel('Invalid wedding date'); return; }
    const endDateTime = endDate ? new Date(endDate.getTime() + 24 * 60 * 60 * 1000 - 1) : null;

    if (now < startDate) {
      const result = calculateCountdown(startDate);
      if (result) { setCountdown(result); setCountdownLabel('Wedding starts in'); setCountdownVenue(''); }
      return;
    }

    if (endDateTime && now <= endDateTime) {
      const todayIndex = wedding.days?.findIndex(d => d.date === today);
      if (todayIndex >= 0 && wedding.days[todayIndex].events) {
        const todayEvents = wedding.days[todayIndex].events;
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        for (const event of todayEvents) {
          if (!event.time) continue;
          const [eventHours, eventMinutes] = event.time.split(':').map(Number);
          if (isNaN(eventHours) || isNaN(eventMinutes)) continue;
          const eventTotalMinutes = eventHours * 60 + eventMinutes;
          if (eventTotalMinutes > currentMinutes) {
            const eventDate = new Date(today + 'T' + event.time + ':00');
            const result = calculateCountdown(eventDate);
            if (result && !result.isPast) { setCountdown(result); setCountdownLabel(`${event.name} starts in`); setCountdownVenue(event.venue || ''); return; }
          }
        }
      }
      const nextDayIndex = (todayIndex >= 0 ? todayIndex : -1) + 1;
      if (wedding.days && nextDayIndex < wedding.days.length) {
        const nextDay = wedding.days[nextDayIndex];
        const firstEvent = nextDay.events?.[0];
        if (firstEvent && nextDay.date && firstEvent.time) {
          const eventDate = new Date(nextDay.date + 'T' + firstEvent.time + ':00');
          const result = calculateCountdown(eventDate);
          if (result && !result.isPast) { setCountdown(result); setCountdownLabel(`${firstEvent.name} starts in`); setCountdownVenue(firstEvent.venue || ''); return; }
        }
      }
      setCountdown({ isLive: true }); setCountdownLabel('Wedding is live!'); setCountdownVenue(''); return;
    }
    setCountdown({ isPast: true }); setCountdownLabel('Wedding has concluded'); setCountdownVenue('');
  }, [wedding]);

  useEffect(() => {
    updateCountdown();
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    countdownIntervalRef.current = setInterval(updateCountdown, 1000);
    return () => { if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current); };
  }, [updateCountdown]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  const fetchWeddings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/weddings`);
      if (!response.ok) throw new Error('Failed to fetch weddings');
      const data = await response.json();
      setWeddings(data);
      if (data.length > 0) setSelectedWeddingId(data[0].id);
    } catch (err) { toast({ title: 'Error', description: 'Failed to load weddings.', variant: 'destructive' }); }
    finally { setIsLoading(false); }
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
      setWedding(weddingData); setGuests(guestsData); setVendors(vendorsData); setSelectedDayIndex(0); setChatMessages([]);
    } catch (err) { toast({ title: 'Error', description: 'Failed to load wedding data.', variant: 'destructive' }); }
  };

  const getGuestStatsForDay = (dayIndex) => {
    const attendingGuests = guests.filter(g => g.attendingDays && g.attendingDays[dayIndex] === true);
    const dietaryBreakdown = { veg: attendingGuests.filter(g => g.dietary === 'veg').length, 'non-veg': attendingGuests.filter(g => g.dietary === 'non-veg').length };
    const needAccommodation = attendingGuests.filter(g => g.accommodation === true).length;
    return { attending: attendingGuests.length, total: guests.length, dietaryBreakdown, needAccommodation };
  };

  const getVendorStats = () => {
    const confirmed = vendors.filter(v => v.attendingDays && v.attendingDays.some(d => d === true)).length;
    return { confirmed, total: vendors.length };
  };

  const openVendorComplaint = (vendor) => { setSelectedVendorForComplaint(vendor); setVendorComplaintText(''); setShowVendorComplaintModal(true); };

  const submitVendorComplaint = async () => {
    if (!vendorComplaintText.trim() || !selectedVendorForComplaint) return;
    setIsSubmittingVendorComplaint(true);
    try {
      await fetch(`${backendUrl}/api/ai/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ weddingId: selectedWeddingId, message: `Draft a professional complaint message to a ${selectedVendorForComplaint.serviceType} vendor about: "${vendorComplaintText}"`, role: 'host' }) });
      if (selectedVendorForComplaint.email) {
        await fetch(`${backendUrl}/api/email/send-invites`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ weddingId: selectedWeddingId, guestEmails: [selectedVendorForComplaint.email] }) });
      }
      toast({ title: 'Complaint Sent!', description: `Message sent to ${selectedVendorForComplaint.name}` });
      setShowVendorComplaintModal(false); setVendorComplaintText('');
    } catch (err) { toast({ title: 'Error', description: 'Failed to send complaint.', variant: 'destructive' }); }
    finally { setIsSubmittingVendorComplaint(false); }
  };

  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedWeddingId) return;
    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsSendingChat(true);
    try {
      const response = await fetch(`${backendUrl}/api/ai/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ weddingId: selectedWeddingId, message: userMessage, role: 'host' }) });
      if (!response.ok) throw new Error('Failed to get response');
      const data = await response.json();
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.result }]);
    } catch (err) { setChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.', isError: true }]); }
    finally { setIsSendingChat(false); }
  };

  const stats = wedding ? getGuestStatsForDay(selectedDayIndex) : null;
  const vendorStats = getVendorStats();

  const renderCountdown = () => {
    if (!countdown) return null;
    if (countdown.isPast) {
      return (
        <div className="card-botanical mb-6 border-muted-foreground/20 bg-secondary/50">
          <div className="flex items-center justify-center gap-4 py-2">
            <div className="p-3 rounded-full bg-muted"><CheckCircle className="w-5 h-5 text-muted-foreground" /></div>
            <span className="text-muted-foreground font-medium">{countdownLabel}</span>
          </div>
        </div>
      );
    }
    if (countdown.isLive) {
      return (
        <div className="card-botanical mb-6 border-primary/30 bg-primary/5">
          <div className="flex items-center justify-center gap-4 py-2">
            <div className="p-3 rounded-full bg-primary animate-pulse"><PartyPopper className="w-5 h-5 text-white" /></div>
            <span className="text-lg font-serif font-medium text-primary">{countdownLabel}</span>
          </div>
        </div>
      );
    }
    const { days, hours, minutes, seconds } = countdown;
    return (
      <div className="card-botanical mb-6 border-primary/20">
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-primary"><Timer className="w-5 h-5 text-white" /></div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">{countdownLabel}</p>
              {countdownVenue && <p className="text-xs text-muted-foreground">at {countdownVenue}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3 md:ml-auto">
            {days > 0 && (<><div className="text-center"><div className="text-3xl md:text-4xl font-serif font-semibold text-primary tabular-nums">{days}</div><div className="text-xs text-muted-foreground uppercase tracking-wider">Days</div></div><span className="text-xl text-muted-foreground/50">:</span></>)}
            <div className="text-center"><div className="text-3xl md:text-4xl font-serif font-semibold text-primary tabular-nums">{String(hours).padStart(2, '0')}</div><div className="text-xs text-muted-foreground uppercase tracking-wider">Hrs</div></div>
            <span className="text-xl text-muted-foreground/50">:</span>
            <div className="text-center"><div className="text-3xl md:text-4xl font-serif font-semibold text-primary tabular-nums">{String(minutes).padStart(2, '0')}</div><div className="text-xs text-muted-foreground uppercase tracking-wider">Min</div></div>
            <span className="text-xl text-muted-foreground/50">:</span>
            <div className="text-center"><div className="text-3xl md:text-4xl font-serif font-semibold text-primary tabular-nums">{String(seconds).padStart(2, '0')}</div><div className="text-xs text-muted-foreground uppercase tracking-wider">Sec</div></div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <BotanicalHeader />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <BotanicalFooter />
      </div>
    );
  }

  if (weddings.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <BotanicalHeader />
        <main className="pt-24 pb-20">
          <div className="max-w-xl mx-auto px-6 text-center">
            <Calendar className="w-16 h-16 mx-auto text-muted-foreground/30 mb-6" />
            <h1 className="text-3xl font-serif mb-4">No Weddings Found</h1>
            <p className="text-muted-foreground mb-8">Create your first wedding to get started.</p>
            <a href="/host" className="btn-botanical">Create Wedding</a>
          </div>
        </main>
        <BotanicalFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <BotanicalHeader />

      <main className="pt-24 pb-20">
        <div className="max-w-6xl mx-auto px-6">
          {/* Header */}
          <motion.div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div>
              <p className="label-botanical mb-2">Dashboard</p>
              <h1 className="text-3xl md:text-4xl font-serif">Wedding Dashboard</h1>
            </div>
            <Select value={selectedWeddingId} onValueChange={setSelectedWeddingId}>
              <SelectTrigger className="input-botanical w-full md:w-64">
                <SelectValue placeholder="Select Wedding" />
              </SelectTrigger>
              <SelectContent>
                {weddings.map((w) => (<SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </motion.div>

          {/* Countdown */}
          {renderCountdown()}

          {/* Wedding Info Card */}
          {wedding && (
            <motion.div className="card-botanical mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-serif font-medium">{wedding.name}</h2>
                  <p className="text-muted-foreground text-sm">{wedding.location} • {wedding.startDate} to {wedding.endDate}</p>
                </div>
                <span className="text-sm bg-primary/10 text-primary px-3 py-1.5 rounded-full font-medium">{wedding.days?.length || 0} Days</span>
              </div>
            </motion.div>
          )}

          {/* Day Tabs */}
          {wedding?.days && wedding.days.length > 0 && (
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {wedding.days.map((day, idx) => (
                <button key={idx} onClick={() => setSelectedDayIndex(idx)} className={`pill-toggle whitespace-nowrap ${selectedDayIndex === idx ? 'pill-toggle-active' : 'pill-toggle-inactive border border-border'}`}>
                  <Calendar className="w-4 h-4" /> Day {idx + 1} - {day.date}
                </button>
              ))}
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <motion.div className="card-botanical" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10"><Users className="w-5 h-5 text-primary" /></div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Guests</p>
                  <p className="text-2xl font-serif font-semibold">{stats?.attending || 0}<span className="text-base text-muted-foreground">/{stats?.total || 0}</span></p>
                </div>
              </div>
            </motion.div>
            <motion.div className="card-botanical" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10"><Utensils className="w-5 h-5 text-primary" /></div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Dietary</p>
                  <p className="text-sm font-medium">Veg: {stats?.dietaryBreakdown?.veg || 0} • Non-Veg: {stats?.dietaryBreakdown?.['non-veg'] || 0}</p>
                </div>
              </div>
            </motion.div>
            <motion.div className="card-botanical" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10"><Home className="w-5 h-5 text-primary" /></div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Accommodation</p>
                  <p className="text-2xl font-serif font-semibold">{stats?.needAccommodation || 0}</p>
                </div>
              </div>
            </motion.div>
            <motion.div className="card-botanical" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10"><Building className="w-5 h-5 text-primary" /></div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Vendors</p>
                  <p className="text-2xl font-serif font-semibold">{vendorStats.confirmed}<span className="text-sm text-primary ml-1">confirmed</span></p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Events Section */}
          {wedding?.days && wedding.days[selectedDayIndex] && (
            <motion.div className="card-botanical mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-primary" />
                <h3 className="font-serif text-lg">Events for Day {selectedDayIndex + 1}</h3>
              </div>
              <div className="space-y-3">
                {wedding.days[selectedDayIndex].events?.map((event, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-4 bg-secondary/50 rounded-xl border border-border group hover:border-primary/30 transition-colors">
                    <div className="text-center bg-primary text-white px-3 py-2 rounded-lg text-sm font-medium min-w-[60px]">{event.time}</div>
                    <div className="flex-1">
                      <p className="font-medium">{event.name}</p>
                      <p className="text-sm text-muted-foreground">{event.venue}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Vendors Section */}
          {vendors.length > 0 && (
            <motion.div className="card-botanical" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-primary" />
                  <h3 className="font-serif text-lg">Vendors</h3>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {vendors.map((vendor, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl border border-border">
                    <div>
                      <p className="font-medium">{vendor.name || 'Unnamed Vendor'}</p>
                      <p className="text-sm text-muted-foreground capitalize">{vendor.serviceType}</p>
                    </div>
                    <button onClick={() => openVendorComplaint(vendor)} className="btn-botanical-outline text-xs py-1.5 px-3">
                      <AlertTriangle className="w-3 h-3" /> Report Issue
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Chat FAB */}
      <motion.button onClick={() => setIsChatOpen(true)} className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow z-40" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <MessageCircle className="w-6 h-6" />
      </motion.button>

      {/* Chat Drawer */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="fixed inset-y-0 right-0 w-full md:w-96 bg-white border-l border-border shadow-2xl z-50 flex flex-col">
            <div className="p-4 border-b border-border flex items-center justify-between bg-primary text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"><Bot className="w-5 h-5" /></div>
                <div><p className="font-medium">AI Assistant</p><p className="text-xs text-white/70">Ask me anything about your wedding</p></div>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 chat-scrollbar">
              {chatMessages.length === 0 && (
                <div className="text-center py-10 text-muted-foreground">
                  <Bot className="w-12 h-12 mx-auto mb-4 text-primary/30" />
                  <p>Hi! I&apos;m your wedding assistant.</p>
                  <p className="text-sm">Ask me anything about your celebration.</p>
                </div>
              )}
              {chatMessages.map((msg, idx) => (
                <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl ${msg.role === 'user' ? 'bg-primary text-white rounded-br-md' : 'bg-secondary text-foreground rounded-bl-md'}`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </motion.div>
              ))}
              {isSendingChat && (<div className="flex justify-start"><div className="bg-secondary p-3 rounded-2xl rounded-bl-md"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div></div>)}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={handleSendChat} className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Type your message..." className="input-botanical flex-1" disabled={isSendingChat} />
                <button type="submit" disabled={isSendingChat || !chatInput.trim()} className="btn-botanical px-4"><Send className="w-4 h-4" /></button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Vendor Complaint Modal */}
      <Dialog open={showVendorComplaintModal} onOpenChange={setShowVendorComplaintModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">Report Issue</DialogTitle>
            <DialogDescription>Describe the issue with {selectedVendorForComplaint?.name}</DialogDescription>
          </DialogHeader>
          <Textarea value={vendorComplaintText} onChange={(e) => setVendorComplaintText(e.target.value)} placeholder="Describe the issue..." className="input-botanical min-h-[120px]" />
          <DialogFooter>
            <button onClick={() => setShowVendorComplaintModal(false)} className="btn-botanical-outline">Cancel</button>
            <button onClick={submitVendorComplaint} disabled={isSubmittingVendorComplaint || !vendorComplaintText.trim()} className="btn-botanical">
              {isSubmittingVendorComplaint ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BotanicalFooter />
    </div>
  );
}
