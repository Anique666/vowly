'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Sparkles, Calendar, Users, Utensils, Home, Send, 
  FileText, MessageCircle, ChevronRight, Loader2,
  UserCheck, UserX, Bot, User, X, PanelRightOpen, PanelRightClose
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { toast } = useToast();
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';
  const chatEndRef = useRef(null);

  // State
  const [weddings, setWeddings] = useState([]);
  const [selectedWeddingId, setSelectedWeddingId] = useState('');
  const [wedding, setWedding] = useState(null);
  const [guests, setGuests] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // AI State
  const [vendorBrief, setVendorBrief] = useState('');
  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);
  const [isDraftingMessage, setIsDraftingMessage] = useState(false);
  const [vendorMessage, setVendorMessage] = useState('');

  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);

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
        description: 'Failed to load weddings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWeddingData = async (weddingId) => {
    setIsLoadingData(true);
    try {
      // Fetch wedding, guests, and vendors in parallel
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
      
      // Reset AI states
      setVendorBrief('');
      setVendorMessage('');
      setChatMessages([]);
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

  // Calculate guest stats for a specific day
  const getGuestStatsForDay = (dayIndex) => {
    const attendingGuests = guests.filter(g => g.attendingDays && g.attendingDays[dayIndex] === true);
    const notAttending = guests.filter(g => g.attendingDays && g.attendingDays[dayIndex] === false);
    
    const dietaryBreakdown = {
      veg: attendingGuests.filter(g => g.dietary === 'veg').length,
      'non-veg': attendingGuests.filter(g => g.dietary === 'non-veg').length,
      jain: attendingGuests.filter(g => g.dietary === 'jain').length,
      vegan: attendingGuests.filter(g => g.dietary === 'vegan').length,
    };

    const needAccommodation = attendingGuests.filter(g => g.accommodation === true).length;

    return {
      attending: attendingGuests.length,
      notAttending: notAttending.length,
      total: guests.length,
      dietaryBreakdown,
      needAccommodation,
    };
  };

  // Get vendor stats
  const getVendorStats = () => {
    const confirmed = vendors.filter(v => v.attendingDays && v.attendingDays.some(d => d === true)).length;
    const pending = vendors.filter(v => !v.attendingDays || v.attendingDays.length === 0).length;
    return { confirmed, pending, total: vendors.length };
  };

  // Generate vendor brief
  const handleGenerateVendorBrief = async () => {
    if (!selectedWeddingId) return;
    
    setIsGeneratingBrief(true);
    setVendorBrief('');
    try {
      const response = await fetch(`${backendUrl}/api/ai/generate-vendor-brief`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weddingId: selectedWeddingId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to generate brief');
      }

      const data = await response.json();
      setVendorBrief(data.result);
      toast({
        title: 'Brief Generated!',
        description: 'Vendor brief has been generated successfully.',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to generate vendor brief.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingBrief(false);
    }
  };

  // Draft vendor message
  const handleDraftVendorMessage = async () => {
    if (!selectedWeddingId) return;
    
    setIsDraftingMessage(true);
    setVendorMessage('');
    try {
      const response = await fetch(`${backendUrl}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          weddingId: selectedWeddingId,
          message: 'Draft a professional message to send to all vendors with key wedding details, timeline, and expectations.',
          role: 'host'
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to draft message');
      }

      const data = await response.json();
      setVendorMessage(data.result);
      toast({
        title: 'Message Drafted!',
        description: 'Vendor message has been drafted successfully.',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to draft vendor message.',
        variant: 'destructive',
      });
    } finally {
      setIsDraftingMessage(false);
    }
  };

  // Send chat message
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

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to get response');
      }

      const data = await response.json();
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.result }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.',
        isError: true 
      }]);
      toast({
        title: 'Chat Error',
        description: err.message || 'Failed to get AI response.',
        variant: 'destructive',
      });
    } finally {
      setIsSendingChat(false);
    }
  };

  const stats = wedding ? getGuestStatsForDay(selectedDayIndex) : null;
  const vendorStats = getVendorStats();

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
            <Link href="/dashboard" className="text-sm font-medium text-primary">Dashboard</Link>
            <Link href="/rsvp" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">RSVP</Link>
          </nav>
        </div>
      </header>

      <div className="flex">
        {/* Main Content */}
        <main className={`flex-1 container mx-auto px-4 py-8 transition-all ${isChatOpen ? 'mr-96' : ''}`}>
          <div className="max-w-6xl mx-auto">
            {/* Title & Wedding Selector */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Wedding Dashboard</h1>
                <p className="text-muted-foreground">Manage your wedding, guests, and vendors</p>
              </div>
              
              <div className="flex items-center gap-4">
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
                
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setIsChatOpen(!isChatOpen)}
                  className="border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  {isChatOpen ? <PanelRightClose className="w-5 h-5" /> : <PanelRightOpen className="w-5 h-5" />}
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : !wedding ? (
              <Card className="border-2 border-dashed border-primary/30">
                <CardContent className="py-16 text-center">
                  <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Wedding Selected</h3>
                  <p className="text-muted-foreground mb-4">Create a wedding or select one to view the dashboard</p>
                  <Link href="/host">
                    <Button className="bg-primary hover:bg-primary/90">Create Wedding</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Wedding Info Card */}
                <Card className="mb-6 border-2 border-primary/20 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-2xl text-foreground">{wedding.name}</CardTitle>
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
                  <Tabs 
                    value={selectedDayIndex.toString()} 
                    onValueChange={(v) => setSelectedDayIndex(parseInt(v))}
                    className="mb-6"
                  >
                    <TabsList className="bg-white border border-primary/20 p-1 h-auto flex-wrap">
                      {wedding.days.map((day, index) => (
                        <TabsTrigger 
                          key={index} 
                          value={index.toString()}
                          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2"
                        >
                          <Calendar className="w-4 h-4 mr-2" />
                          Day {index + 1} - {day.date}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {wedding.days.map((day, index) => (
                      <TabsContent key={index} value={index.toString()} className="mt-6">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                          {/* Guest Count */}
                          <Card className="border-primary/20">
                            <CardContent className="pt-6">
                              <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-full">
                                  <Users className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Guests Attending</p>
                                  <p className="text-2xl font-bold text-foreground">
                                    {stats?.attending || 0}
                                    <span className="text-sm font-normal text-muted-foreground">/{stats?.total || 0}</span>
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Dietary Breakdown */}
                          <Card className="border-primary/20">
                            <CardContent className="pt-6">
                              <div className="flex items-center gap-4">
                                <div className="p-3 bg-green-100 rounded-full">
                                  <Utensils className="w-6 h-6 text-green-600" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm text-muted-foreground mb-1">Dietary</p>
                                  <div className="flex flex-wrap gap-1">
                                    <Badge variant="outline" className="text-xs">Veg: {stats?.dietaryBreakdown?.veg || 0}</Badge>
                                    <Badge variant="outline" className="text-xs">Non-Veg: {stats?.dietaryBreakdown?.['non-veg'] || 0}</Badge>
                                    {(stats?.dietaryBreakdown?.jain || 0) > 0 && (
                                      <Badge variant="outline" className="text-xs">Jain: {stats?.dietaryBreakdown?.jain}</Badge>
                                    )}
                                    {(stats?.dietaryBreakdown?.vegan || 0) > 0 && (
                                      <Badge variant="outline" className="text-xs">Vegan: {stats?.dietaryBreakdown?.vegan}</Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Accommodation */}
                          <Card className="border-primary/20">
                            <CardContent className="pt-6">
                              <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-100 rounded-full">
                                  <Home className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Need Accommodation</p>
                                  <p className="text-2xl font-bold text-foreground">{stats?.needAccommodation || 0}</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Vendor Status */}
                          <Card className="border-primary/20">
                            <CardContent className="pt-6">
                              <div className="flex items-center gap-4">
                                <div className="p-3 bg-purple-100 rounded-full">
                                  <UserCheck className="w-6 h-6 text-purple-600" />
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Vendors</p>
                                  <div className="flex items-center gap-2">
                                    <span className="text-2xl font-bold text-foreground">{vendorStats.confirmed}</span>
                                    <span className="text-sm text-green-600">confirmed</span>
                                    {vendorStats.pending > 0 && (
                                      <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                                        {vendorStats.pending} pending
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Events for the day */}
                        <Card className="border-primary/20 mb-6">
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <Calendar className="w-5 h-5 text-primary" />
                              Events for Day {index + 1}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {day.events && day.events.length > 0 ? (
                                day.events.map((event, eventIndex) => (
                                  <div key={eventIndex} className="flex items-center gap-4 p-3 bg-gradient-to-r from-primary/5 to-transparent rounded-lg border border-primary/10">
                                    <Badge className="bg-primary text-primary-foreground">{event.time}</Badge>
                                    <div className="flex-1">
                                      <p className="font-medium">{event.name}</p>
                                      <p className="text-sm text-muted-foreground">{event.venue}</p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                                  </div>
                                ))
                              ) : (
                                <p className="text-muted-foreground text-center py-4">No events scheduled for this day</p>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>
                    ))}
                  </Tabs>
                )}

                {/* Vendors List */}
                <Card className="border-primary/20 mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserCheck className="w-5 h-5 text-primary" />
                      Vendors ({vendors.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {vendors.length > 0 ? (
                      <div className="space-y-3">
                        {vendors.map((vendor, index) => (
                          <div key={vendor.id || index} className="flex items-center justify-between p-3 bg-white border border-primary/10 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${vendor.attendingDays?.some(d => d) ? 'bg-green-500' : 'bg-amber-400'}`} />
                              <div>
                                <p className="font-medium">{vendor.name}</p>
                                <p className="text-sm text-muted-foreground">{vendor.serviceType}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {vendor.email && (
                                <Badge variant="outline" className="text-xs">{vendor.email}</Badge>
                              )}
                              <Badge 
                                variant={vendor.attendingDays?.some(d => d) ? 'default' : 'secondary'}
                                className={vendor.attendingDays?.some(d => d) ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}
                              >
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

                {/* AI Actions */}
                <Card className="border-2 border-primary/20 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/10">
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      AI Actions
                    </CardTitle>
                    <CardDescription>Use AI to generate briefs and draft messages</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-4">
                      <Button 
                        onClick={handleGenerateVendorBrief}
                        disabled={isGeneratingBrief}
                        className="bg-primary hover:bg-primary/90"
                      >
                        {isGeneratingBrief ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <FileText className="w-4 h-4 mr-2" />
                            Generate Vendor Brief
                          </>
                        )}
                      </Button>
                      
                      <Button 
                        onClick={handleDraftVendorMessage}
                        disabled={isDraftingMessage}
                        variant="outline"
                        className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                      >
                        {isDraftingMessage ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Drafting...
                          </>
                        ) : (
                          <>
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Draft Vendor Message
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Vendor Brief Output */}
                    {vendorBrief && (
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Generated Vendor Brief
                        </Label>
                        <div className="p-4 bg-gradient-to-r from-primary/5 to-transparent border border-primary/20 rounded-lg max-h-64 overflow-y-auto">
                          <pre className="whitespace-pre-wrap text-sm">{vendorBrief}</pre>
                        </div>
                      </div>
                    )}

                    {/* Vendor Message Output */}
                    {vendorMessage && (
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <MessageCircle className="w-4 h-4" />
                          Drafted Vendor Message
                        </Label>
                        <div className="p-4 bg-gradient-to-r from-blue-50 to-transparent border border-blue-200 rounded-lg max-h-64 overflow-y-auto">
                          <pre className="whitespace-pre-wrap text-sm">{vendorMessage}</pre>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </main>

        {/* Chat Panel - Slide-in from right */}
        <div 
          className={`fixed top-0 right-0 h-full w-96 bg-white border-l border-primary/20 shadow-2xl transform transition-transform duration-300 z-40 ${
            isChatOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          style={{ top: '73px', height: 'calc(100vh - 73px)' }}
        >
          <div className="flex flex-col h-full">
            {/* Chat Header */}
            <div className="p-4 border-b border-primary/20 bg-gradient-to-r from-primary/10 to-primary/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">AI Wedding Assistant</h3>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsChatOpen(false)}
                  className="h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Ask me anything about your wedding</p>
            </div>

            {/* Chat Messages */}
            <ScrollArea className="flex-1 p-4">
              {chatMessages.length === 0 ? (
                <div className="text-center py-8">
                  <Bot className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground text-sm">Start a conversation about your wedding!</p>
                  <div className="mt-4 space-y-2">
                    <p className="text-xs text-muted-foreground">Try asking:</p>
                    <div className="space-y-1">
                      {[
                        "What's the guest count for each day?",
                        "Summarize dietary requirements",
                        "What vendors need confirmation?",
                      ].map((suggestion, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setChatInput(suggestion);
                          }}
                          className="block w-full text-left text-xs p-2 bg-primary/5 hover:bg-primary/10 rounded border border-primary/10 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {chatMessages.map((msg, index) => (
                    <div 
                      key={index} 
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-start gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'
                        }`}>
                          {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                        </div>
                        <div className={`p-3 rounded-lg ${
                          msg.role === 'user' 
                            ? 'bg-primary text-primary-foreground' 
                            : msg.isError 
                              ? 'bg-red-50 border border-red-200 text-red-700'
                              : 'bg-gray-100 text-foreground'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {isSendingChat && (
                    <div className="flex justify-start">
                      <div className="flex items-start gap-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-primary/10 text-primary">
                          <Bot className="w-4 h-4" />
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
                  placeholder="Ask about your wedding..."
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
    </div>
  );
}
