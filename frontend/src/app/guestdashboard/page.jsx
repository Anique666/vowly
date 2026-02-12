'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { 
  Sparkles, Calendar, Clock, MapPin, Send, 
  Loader2, Bot, User, X, MessageCircle,
  Lightbulb, PartyPopper, Timer, Rocket
} from 'lucide-react';
import Link from 'next/link';

export default function GuestDashboardPage() {
  const { toast } = useToast();
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';
  const chatEndRef = useRef(null);

  // State
  const [weddings, setWeddings] = useState([]);
  const [selectedWeddingId, setSelectedWeddingId] = useState('');
  const [wedding, setWedding] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
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
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
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
    setIsLoadingData(true);
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
    } finally {
      setIsLoadingData(false);
    }
  };

  const fetchSuggestions = async (weddingId) => {
    setIsLoadingSuggestions(true);
    try {
      const todayIndex = getTodayDayIndex();
      const response = await fetch(`${backendUrl}/api/ai/guest-day-suggestions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          weddingId, 
          dayIndex: todayIndex >= 0 ? todayIndex : 0 
        }),
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
    const today = getTodayDate();
    return wedding.days.findIndex(day => day.date === today);
  };

  const getTodayEvents = () => {
    if (!wedding?.days) return [];
    const todayIndex = getTodayDayIndex();
    if (todayIndex >= 0) {
      return wedding.days[todayIndex].events || [];
    }
    return wedding.days[0]?.events || [];
  };

  const getTimeUntilNextEvent = () => {
    const events = getTodayEvents();
    if (events.length === 0) return null;

    const now = currentTime;
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTotalMinutes = currentHours * 60 + currentMinutes;

    for (const event of events) {
      const [eventHours, eventMinutes] = event.time.split(':').map(Number);
      const eventTotalMinutes = eventHours * 60 + eventMinutes;

      if (eventTotalMinutes > currentTotalMinutes) {
        const diffMinutes = eventTotalMinutes - currentTotalMinutes;
        const hours = Math.floor(diffMinutes / 60);
        const minutes = diffMinutes % 60;
        return {
          event,
          hours,
          minutes,
          text: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
        };
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
        body: JSON.stringify({ 
          weddingId: selectedWeddingId,
          message: userMessage,
          role: 'guest'
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
            <span className="text-xl font-bold">AI Wedding Ops</span>
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
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
                  <PartyPopper className="w-8 h-8 text-primary" />
                  Guest Dashboard
                </h1>
                <p className="text-muted-foreground">Your personalized wedding day guide</p>
              </div>
              
              <div className="flex items-center gap-4">
                <Select value={selectedWeddingId} onValueChange={setSelectedWeddingId}>
                  <SelectTrigger className="w-[220px] border-primary/20">
                    <SelectValue placeholder="Select wedding" />
                  </SelectTrigger>
                  <SelectContent>
                    {weddings.map(w => (
                      <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setIsChatOpen(!isChatOpen)}
                  className={`border-primary/20 transition-all duration-300 ${isChatOpen ? 'bg-primary text-primary-foreground' : 'text-primary hover:bg-primary hover:text-primary-foreground'}`}
                >
                  <MessageCircle className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : weddings.length === 0 ? (
              /* Empty State */
              <Card className="border-2 border-dashed border-primary/30 animate-fade-in">
                <CardContent className="py-16 text-center">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-amber-100 flex items-center justify-center">
                    <Calendar className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">No Weddings Available</h3>
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
            ) : !wedding ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Wedding Info Card */}
                <Card className="mb-6 border-2 border-primary/20 shadow-lg overflow-hidden animate-fade-in">
                  <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-primary/5 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold mb-1">{wedding.name}</h2>
                        <p className="text-muted-foreground flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {wedding.location}
                        </p>
                      </div>
                      <Badge 
                        variant="secondary" 
                        className={isWeddingDay ? 'bg-green-100 text-green-700 text-lg px-4 py-1 animate-gentle-pulse' : 'bg-primary/10 text-primary'}
                      >
                        {isWeddingDay ? '🎉 Today!' : `${wedding.days?.length || 0} Days`}
                      </Badge>
                    </div>
                  </div>
                </Card>

                {/* Time Until Next Event */}
                {nextEventInfo && (
                  <Card className="mb-6 border-2 border-green-200 bg-gradient-to-r from-green-50 to-white shadow-lg animate-fade-in">
                    <CardContent className="py-6">
                      <div className="flex items-center gap-6">
                        <div className="p-4 bg-green-100 rounded-full animate-gentle-pulse">
                          <Timer className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground mb-1">Next Event</p>
                          <h3 className="text-xl font-bold">{nextEventInfo.event.name}</h3>
                          <p className="text-sm text-muted-foreground">{nextEventInfo.event.venue}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Starts in</p>
                          <p className="text-3xl font-bold text-green-600">{nextEventInfo.text}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Today's Events */}
                <Card className="mb-6 border-primary/20 shadow-lg animate-fade-in">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary" />
                      {isWeddingDay ? "Today's Schedule" : "Upcoming Events"}
                    </CardTitle>
                    <CardDescription>
                      {isWeddingDay 
                        ? `Events for ${wedding.days[todayIndex].date}` 
                        : wedding.days?.[0]?.date ? `Preview: ${wedding.days[0].date}` : 'No events scheduled'}
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
                            <div 
                              key={index} 
                              className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                                isCurrent 
                                  ? 'bg-primary/10 border-primary shadow-md animate-gentle-pulse' 
                                  : isPast 
                                    ? 'bg-gray-50 border-gray-200 opacity-60'
                                    : 'bg-gradient-to-r from-primary/5 to-transparent border-primary/10 hover:border-primary/20'
                              }`}
                            >
                              <div className="flex flex-col items-center">
                                <Badge 
                                  className={`text-sm px-3 py-1 ${
                                    isCurrent 
                                      ? 'bg-primary text-primary-foreground animate-pulse' 
                                      : isPast 
                                        ? 'bg-gray-300 text-gray-600'
                                        : 'bg-primary text-primary-foreground'
                                  }`}
                                >
                                  <Clock className="w-3 h-3 mr-1" />
                                  {event.time}
                                </Badge>
                                {isCurrent && (
                                  <span className="text-xs text-primary font-medium mt-1">NOW</span>
                                )}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold">{event.name}</h4>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {event.venue}
                                </p>
                              </div>
                              {isPast && (
                                <Badge variant="outline" className="text-xs">Completed</Badge>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">No events scheduled</p>
                    )}
                  </CardContent>
                </Card>

                {/* AI Activity Suggestions */}
                <Card className="border-2 border-primary/20 shadow-lg animate-fade-in">
                  <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/10">
                    <CardTitle className="flex items-center gap-2">
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
                      <div className="p-4 bg-gradient-to-r from-amber-50 to-white rounded-lg border border-primary/10">
                        <pre className="whitespace-pre-wrap text-sm font-sans">{suggestions}</pre>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Lightbulb className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                        <p className="text-muted-foreground">No suggestions available</p>
                        <Button 
                          onClick={() => fetchSuggestions(selectedWeddingId)}
                          variant="outline"
                          className="mt-4 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                        >
                          Get Suggestions
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </main>

        {/* Chat Panel */}
        <div 
          className={`fixed top-0 right-0 h-full w-96 bg-white border-l border-primary/20 shadow-2xl z-40 transition-chat ${
            isChatOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          style={{ top: '73px', height: 'calc(100vh - 73px)' }}
        >
          <div className="flex flex-col h-full">
            {/* Chat Header */}
            <div className="p-4 border-b border-primary/20 bg-gradient-to-r from-primary/10 to-primary/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-amber-400 flex items-center justify-center animate-float">
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

            {/* Chat Messages */}
            <ScrollArea className="flex-1 p-4 chat-scrollbar">
              {chatMessages.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-amber-100 flex items-center justify-center animate-float">
                    <span className="text-2xl">🤵</span>
                  </div>
                  <p className="text-muted-foreground text-sm mb-4">How can I help you today?</p>
                  <div className="space-y-2">
                    {[
                      "What should I wear?",
                      "Where is the venue?",
                      "What's the dress code?",
                    ].map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => setChatInput(suggestion)}
                        className="block w-full text-left text-xs p-2 bg-primary/5 hover:bg-primary/10 rounded border border-primary/10 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {chatMessages.map((msg, index) => (
                    <div 
                      key={index} 
                      className={`flex animate-bubble-in ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-start gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                          msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-gradient-to-br from-primary/20 to-amber-100'
                        }`}>
                          {msg.role === 'user' ? <User className="w-4 h-4" /> : <span className="text-xs">🤵</span>}
                        </div>
                        <div className={`p-3 rounded-lg ${
                          msg.role === 'user' 
                            ? 'bg-primary text-primary-foreground' 
                            : msg.isError 
                              ? 'bg-red-50 border border-red-200 text-red-700'
                              : 'bg-gray-100'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {isSendingChat && (
                    <div className="flex justify-start animate-bubble-in">
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

            {/* Chat Input */}
            <form onSubmit={handleSendChat} className="p-4 border-t border-primary/20 bg-white">
              <div className="flex gap-2">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask about the wedding..."
                  className="flex-1 border-primary/20"
                  disabled={isSendingChat || !selectedWeddingId}
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  disabled={isSendingChat || !chatInput.trim() || !selectedWeddingId}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Floating Chat Button when panel is closed */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-primary to-amber-400 shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center z-40 animate-float"
        >
          <MessageCircle className="w-6 h-6 text-white" />
        </button>
      )}
    </div>
  );
}
