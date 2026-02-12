'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import { 
  Sparkles, Calendar, Clock, MapPin, Send, 
  Loader2, User, X, MessageCircle,
  Lightbulb, PartyPopper, Timer, Rocket, Bot
} from 'lucide-react';
import Link from 'next/link';

// Format AI text with proper structure
function FormattedAIResponse({ text }) {
  // Clean up the text for better display
  const cleanedText = text
    .replace(/\*\*/g, '**') // Keep markdown bold
    .replace(/\n{3,}/g, '\n\n') // Normalize multiple newlines
    .replace(/^\s*[-•]\s*/gm, '• ') // Normalize bullet points
    .trim();

  return (
    <div className="prose prose-sm max-w-none">
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="list-disc pl-4 mb-3 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-4 mb-3 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="text-sm">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
          h1: ({ children }) => <h1 className="text-lg font-bold mb-2 font-serif">{children}</h1>,
          h2: ({ children }) => <h2 className="text-base font-semibold mb-2">{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-semibold mb-1">{children}</h3>,
        }}
      >
        {cleanedText}
      </ReactMarkdown>
    </div>
  );
}

export default function GuestDashboardPage() {
  const { toast } = useToast();
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';
  const chatEndRef = useRef(null);

  // State
  const [weddings, setWeddings] = useState([]);
  const [selectedWeddingId, setSelectedWeddingId] = useState('');
  const [wedding, setWedding] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // AI Suggestions State
  const [suggestions, setSuggestions] = useState('');
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

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
      const response = await fetch(`${backendUrl}/api/wedding/${weddingId}`);
      if (!response.ok) throw new Error('Failed to fetch wedding');
      const weddingData = await response.json();
      setWedding(weddingData);
      setSuggestions('');
      setChatMessages([]);
      fetchSuggestions(weddingId);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to load wedding data.',
        variant: 'destructive',
      });
    }
  };

  const fetchSuggestions = async (weddingId) => {
    setIsLoadingSuggestions(true);
    try {
      const todayIndex = getTodayDayIndex();
      const response = await fetch(`${backendUrl}/api/ai/guest-day-suggestions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weddingId, dayIndex: todayIndex >= 0 ? todayIndex : 0 }),
      });

      if (!response.ok) throw new Error('Failed to get suggestions');
      const data = await response.json();
      setSuggestions(data.result);
    } catch (err) {
      console.error('Failed to fetch suggestions:', err);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const getTodayDate = () => currentTime.toISOString().split('T')[0];

  const getTodayDayIndex = () => {
    if (!wedding?.days) return -1;
    return wedding.days.findIndex(day => day.date === getTodayDate());
  };

  const getTodayEvents = () => {
    if (!wedding?.days) return [];
    const todayIndex = getTodayDayIndex();
    if (todayIndex >= 0) return wedding.days[todayIndex].events || [];
    return wedding.days[0]?.events || [];
  };

  const getTimeUntilNextEvent = () => {
    const events = getTodayEvents();
    if (events.length === 0) return null;

    const now = currentTime;
    const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

    for (const event of events) {
      const [eventHours, eventMinutes] = event.time.split(':').map(Number);
      const eventTotalMinutes = eventHours * 60 + eventMinutes;

      if (eventTotalMinutes > currentTotalMinutes) {
        const diffMinutes = eventTotalMinutes - currentTotalMinutes;
        const hours = Math.floor(diffMinutes / 60);
        const minutes = diffMinutes % 60;
        return { event, hours, minutes, text: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m` };
      }
    }
    return null;
  };

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
        body: JSON.stringify({ weddingId: selectedWeddingId, message: userMessage, role: 'guest' }),
      });

      if (!response.ok) throw new Error('Failed to get response');
      const data = await response.json();
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.result }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.', isError: true }]);
    } finally {
      setIsSendingChat(false);
    }
  };

  const todayEvents = getTodayEvents();
  const nextEventInfo = getTimeUntilNextEvent();
  const todayIndex = getTodayDayIndex();
  const isWeddingDay = todayIndex >= 0;

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
            <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Dashboard</Link>
            <Link href="/guestdashboard" className="text-sm font-medium text-primary">Guest</Link>
            <Link href="/postwedding" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Photos</Link>
          </nav>
        </div>
      </header>

      <div className="flex">
        {/* Main Content */}
        <main className={`flex-1 container mx-auto px-4 py-8 transition-all duration-300 ${isChatOpen ? 'mr-96' : ''}`}>
          <div className="max-w-4xl mx-auto">
            {/* Title & Wedding Selector */}
            <motion.div 
              className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3 font-serif">
                  <PartyPopper className="w-8 h-8 text-primary" />
                  Guest Dashboard
                </h1>
                <p className="text-muted-foreground">Your personalized wedding day guide</p>
              </div>
              
              <Select value={selectedWeddingId} onValueChange={setSelectedWeddingId}>
                <SelectTrigger className="w-[220px] border-primary/20">
                  <SelectValue placeholder="Select wedding" />
                </SelectTrigger>
                <SelectContent>
                  {weddings.map(w => (<SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </motion.div>

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
                    <h3 className="text-2xl font-bold mb-3 font-serif">No Weddings Available</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      There are no weddings to view yet. If you're a host, create one to get started!
                    </p>
                    <Link href="/host">
                      <Button className="gap-2 bg-primary hover:bg-primary/90">
                        <Rocket className="w-5 h-5" />
                        Create a Wedding
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ) : wedding && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                {/* Wedding Info Card */}
                <Card className="mb-6 border-2 border-primary/20 shadow-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-primary/5 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold mb-1 font-serif">{wedding.name}</h2>
                        <p className="text-muted-foreground flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {wedding.location}
                        </p>
                      </div>
                      <Badge variant="secondary" className={isWeddingDay ? 'bg-green-100 text-green-700 text-lg px-4 py-1' : 'bg-primary/10 text-primary'}>
                        {isWeddingDay ? '🎉 Today!' : `${wedding.days?.length || 0} Days`}
                      </Badge>
                    </div>
                  </div>
                </Card>

                {/* Time Until Next Event */}
                {nextEventInfo && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <Card className="mb-6 border-2 border-green-200 bg-gradient-to-r from-green-50 to-white shadow-lg">
                      <CardContent className="py-6">
                        <div className="flex items-center gap-6">
                          <div className="p-4 bg-green-100 rounded-full">
                            <Timer className="w-8 h-8 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-muted-foreground mb-1">Next Event</p>
                            <h3 className="text-xl font-bold font-serif">{nextEventInfo.event.name}</h3>
                            <p className="text-sm text-muted-foreground">{nextEventInfo.event.venue}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Starts in</p>
                            <p className="text-3xl font-bold text-green-600">{nextEventInfo.text}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Today's Events */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <Card className="mb-6 border-primary/20 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 font-serif">
                        <Calendar className="w-5 h-5 text-primary" />
                        {isWeddingDay ? "Today's Schedule" : "Upcoming Events"}
                      </CardTitle>
                      <CardDescription>
                        {isWeddingDay ? `Events for ${wedding.days[todayIndex].date}` : wedding.days?.[0]?.date ? `Preview: ${wedding.days[0].date}` : 'No events scheduled'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {todayEvents.length > 0 ? (
                        <div className="space-y-4">
                          {todayEvents.map((event, index) => {
                            const [eventHours] = event.time.split(':').map(Number);
                            const currentHours = currentTime.getHours();
                            const isPast = isWeddingDay && eventHours < currentHours;
                            const isCurrent = isWeddingDay && eventHours === currentHours;
                            
                            return (
                              <motion.div 
                                key={index} 
                                className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${isCurrent ? 'bg-primary/10 border-primary shadow-md' : isPast ? 'bg-gray-50 border-gray-200 opacity-60' : 'bg-gradient-to-r from-primary/5 to-transparent border-primary/10'}`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                              >
                                <div className="flex flex-col items-center">
                                  <Badge className={`text-sm px-3 py-1 ${isCurrent ? 'bg-primary text-primary-foreground animate-pulse' : isPast ? 'bg-gray-300 text-gray-600' : 'bg-primary text-primary-foreground'}`}>
                                    <Clock className="w-3 h-3 mr-1" />
                                    {event.time}
                                  </Badge>
                                  {isCurrent && <span className="text-xs text-primary font-medium mt-1">NOW</span>}
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold">{event.name}</h4>
                                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {event.venue}
                                  </p>
                                </div>
                                {isPast && <Badge variant="outline" className="text-xs">Completed</Badge>}
                              </motion.div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-8">No events scheduled</p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                {/* AI Activity Suggestions - Improved formatting */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                  <Card className="border-2 border-primary/20 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/10">
                      <CardTitle className="flex items-center gap-2 font-serif">
                        <Lightbulb className="w-5 h-5 text-primary" />
                        Activity Suggestions
                      </CardTitle>
                      <CardDescription>Personalized recommendations for your day</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      {isLoadingSuggestions ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
                          <span className="text-muted-foreground">Getting suggestions...</span>
                        </div>
                      ) : suggestions ? (
                        <div className="p-5 bg-gradient-to-r from-amber-50/80 to-white rounded-lg border border-primary/10">
                          <FormattedAIResponse text={suggestions} />
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Lightbulb className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                          <p className="text-muted-foreground">No suggestions available</p>
                          <Button onClick={() => fetchSuggestions(selectedWeddingId)} variant="outline" className="mt-4 border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                            Get Suggestions
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
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
                        <h3 className="font-semibold text-sm">Wedding Concierge</h3>
                        <p className="text-xs text-muted-foreground">Ask me anything!</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setIsChatOpen(false)} className="h-8 w-8">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <ScrollArea className="flex-1 p-4">
                  {chatMessages.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-amber-100 flex items-center justify-center">
                        <span className="text-2xl">🤵</span>
                      </div>
                      <p className="text-muted-foreground text-sm mb-4">How can I help you today?</p>
                      <div className="space-y-2">
                        {["What should I wear?", "Where is the venue?", "What's the dress code?"].map((suggestion, i) => (
                          <button key={i} onClick={() => setChatInput(suggestion)} className="block w-full text-left text-xs p-2 bg-primary/5 hover:bg-primary/10 rounded border border-primary/10 transition-colors">
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {chatMessages.map((msg, index) => (
                        <motion.div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                          <div className={`flex items-start gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-gradient-to-br from-primary/20 to-amber-100'}`}>
                              {msg.role === 'user' ? <User className="w-4 h-4" /> : <span className="text-xs">🤵</span>}
                            </div>
                            <div className={`p-3 rounded-lg ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : msg.isError ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-gray-100'}`}>
                              {msg.role === 'assistant' && !msg.isError ? (
                                <FormattedAIResponse text={msg.content} />
                              ) : (
                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                      {isSendingChat && (
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
                    <Input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Ask about the wedding..." className="flex-1 border-primary/20" disabled={isSendingChat || !selectedWeddingId} />
                    <Button type="submit" size="icon" disabled={isSendingChat || !chatInput.trim() || !selectedWeddingId} className="bg-primary hover:bg-primary/90">
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
    </div>
  );
}
