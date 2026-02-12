'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, Trash2, Send, Save, Calendar, MapPin, Users, Sparkles, 
  Loader2, UserPlus, Mail, Phone, Building, Lightbulb, CheckCircle,
  X, ArrowRight, AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { ShaadiMiniBot } from '@/components/onboarding/ShaadiBot';

const VENDOR_ROLES = [
  { value: 'catering', label: 'Catering' },
  { value: 'photography', label: 'Photography' },
  { value: 'decoration', label: 'Decoration' },
  { value: 'music', label: 'Music/DJ' },
  { value: 'makeup', label: 'Makeup & Hair' },
  { value: 'venue', label: 'Venue' },
  { value: 'transport', label: 'Transport' },
  { value: 'mehendi', label: 'Mehendi Artist' },
  { value: 'pandit', label: 'Pandit/Priest' },
  { value: 'other', label: 'Other' },
];

// Debug logging helper
const debugLog = (message, data) => {
  if (process.env.NODE_ENV === 'development' || typeof window !== 'undefined') {
    console.log(`[HOST DEBUG] ${message}:`, data);
  }
};

export default function HostPage() {
  const { toast } = useToast();
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';

  // Wedding form state
  const [weddingName, setWeddingName] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [days, setDays] = useState([{ date: '', events: [{ name: '', time: '', venue: '' }] }]);
  
  // Dynamic vendors state
  const [vendors, setVendors] = useState([]);

  // Guest invites state
  const [guests, setGuests] = useState([{ name: '', email: '' }]);

  // Post-save state
  const [savedWeddingId, setSavedWeddingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingInvites, setIsSendingInvites] = useState(false);
  const [showMiniBot, setShowMiniBot] = useState(false);
  const [invitesSentCount, setInvitesSentCount] = useState(0);

  // Vendor suggestions state
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [suggestedVendors, setSuggestedVendors] = useState([]);
  const [showSuggestionsModal, setShowSuggestionsModal] = useState(false);
  const [suggestionLocation, setSuggestionLocation] = useState('');
  const [suggestionError, setSuggestionError] = useState('');

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
  const addVendor = () => {
    setVendors([...vendors, { role: 'catering', name: '', phone: '', email: '' }]);
  };

  const removeVendor = (index) => {
    setVendors(vendors.filter((_, i) => i !== index));
  };

  const updateVendor = (index, field, value) => {
    const newVendors = [...vendors];
    newVendors[index] = { ...newVendors[index], [field]: value };
    setVendors(newVendors);
  };

  // Guest management
  const addGuest = () => {
    setGuests([...guests, { name: '', email: '' }]);
  };

  const removeGuest = (index) => {
    if (guests.length > 1) {
      setGuests(guests.filter((_, i) => i !== index));
    }
  };

  const updateGuest = (index, field, value) => {
    const newGuests = [...guests];
    newGuests[index] = { ...newGuests[index], [field]: value };
    setGuests(newGuests);
  };

  // Extract city/region from location string
  const extractCity = (locationStr) => {
    if (!locationStr || typeof locationStr !== 'string') return '';
    // Try to extract city name - usually before the comma or the first word
    const parts = locationStr.split(',').map(p => p.trim());
    // Return the first part (typically the city) or the whole string if no comma
    return parts[0] || locationStr.trim();
  };

  // Validate location for vendor suggestions
  const isValidLocation = (loc) => {
    if (!loc || typeof loc !== 'string') return false;
    const trimmed = loc.trim();
    // Must be at least 2 characters and contain some letters
    return trimmed.length >= 2 && /[a-zA-Z]/.test(trimmed);
  };

  // Suggest vendors by location - FIXED
  const handleSuggestVendors = async () => {
    // Validate location
    if (!isValidLocation(location)) {
      toast({
        title: 'Location Required',
        description: 'Please enter a valid wedding location (city/area) to get vendor suggestions.',
        variant: 'destructive',
      });
      return;
    }

    const city = extractCity(location);
    setSuggestionLocation(city);
    setSuggestionError('');
    setIsLoadingSuggestions(true);
    setSuggestedVendors([]);
    setShowSuggestionsModal(true);

    debugLog('Starting vendor suggestion', { location, city });

    try {
      // First set the location for the planner with the extracted city
      const setDetailsPayload = { location: city };
      debugLog('Setting planner details', setDetailsPayload);

      const setDetailsRes = await fetch(`${backendUrl}/api/ai/planner/set-details`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(setDetailsPayload),
      });

      if (!setDetailsRes.ok) {
        debugLog('Set details failed', { status: setDetailsRes.status });
        throw new Error('Failed to set location details');
      }

      const setDetailsData = await setDetailsRes.json();
      debugLog('Set details response', setDetailsData);

      // Get suggestions for different vendor types
      const vendorTypes = ['catering', 'photography', 'decoration'];
      const suggestions = [];

      for (const type of vendorTypes) {
        debugLog(`Fetching ${type} suggestions for ${city}`, {});

        const response = await fetch(`${backendUrl}/api/ai/planner/search-vendor`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vendor_type: type }),
        });

        debugLog(`${type} suggestion response status`, { status: response.status });

        if (response.ok) {
          const data = await response.json();
          debugLog(`${type} suggestions data`, data);

          // Check if suggestions are actually relevant to the location
          const result = data.result || '';
          const isRelevant = result.toLowerCase().includes(city.toLowerCase()) || 
                           result.toLowerCase().includes(location.toLowerCase().split(',')[0]);

          if (result && result.trim().length > 20) {
            suggestions.push({
              type,
              suggestions: result,
              isRelevant,
            });
          }
        }
      }

      if (suggestions.length === 0) {
        setSuggestionError(`No reliable nearby vendor suggestions found for ${city}. Try entering a more specific location or major city.`);
      }

      setSuggestedVendors(suggestions);
    } catch (err) {
      debugLog('Vendor suggestion error', { error: err.message });
      setSuggestionError(`Failed to get vendor suggestions: ${err.message}`);
      toast({
        title: 'Error',
        description: `Failed to get vendor suggestions: ${err.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // Add suggested vendor
  const addSuggestedVendor = (type) => {
    setVendors([...vendors, { role: type, name: '', phone: '', email: '' }]);
    toast({
      title: 'Vendor Added',
      description: `A ${type} vendor slot has been added. Fill in the details.`,
    });
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

      debugLog('Saving wedding', payload);

      const response = await fetch(`${backendUrl}/api/wedding/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      debugLog('Wedding save response', { status: response.status, data });

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to save wedding');
      }

      setSavedWeddingId(data.id);

      // Save vendors if any
      for (const vendor of vendors) {
        if (vendor.name.trim()) {
          const vendorPayload = {
            weddingId: data.id,
            name: vendor.name,
            serviceType: vendor.role,
            email: vendor.email || null,
            phoneNumber: vendor.phone || null,
            attendingDays: days.map(() => true),
          };
          debugLog('Saving vendor', vendorPayload);

          await fetch(`${backendUrl}/api/vendors`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(vendorPayload),
          });
        }
      }
      
      toast({
        title: 'Wedding Saved!',
        description: `"${weddingName}" has been created successfully.`,
      });
    } catch (err) {
      debugLog('Wedding save error', { error: err.message });
      toast({
        title: 'Error',
        description: err.message || 'Failed to save wedding',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Send invites - FIXED
  const handleSendInvites = async () => {
    if (!savedWeddingId) {
      toast({
        title: 'Error',
        description: 'Please save the wedding first before sending invites.',
        variant: 'destructive',
      });
      return;
    }

    // Validate guests - filter only valid emails
    const validGuests = guests.filter(g => {
      const email = g.email?.trim();
      return email && email.includes('@') && email.includes('.');
    });

    if (validGuests.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please enter at least one valid email address (e.g., name@example.com)',
        variant: 'destructive',
      });
      return;
    }

    setIsSendingInvites(true);
    setInvitesSentCount(0);

    try {
      const payload = {
        weddingId: savedWeddingId,
        guestEmails: validGuests.map(g => g.email.trim()),
      };

      debugLog('Sending invites request', payload);

      const response = await fetch(`${backendUrl}/api/email/send-invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      debugLog('Send invites response', { status: response.status, data });

      if (!response.ok) {
        const errorMessage = data.detail || data.message || 'Failed to send invites';
        throw new Error(errorMessage);
      }

      // Success!
      const sentCount = data.emailsSent || 0;
      const failedEmails = data.failed || [];
      const errorDetails = data.errorDetails || '';
      setInvitesSentCount(sentCount);

      if (failedEmails.length > 0 && sentCount === 0) {
        // All emails failed
        let errorMessage = `Failed to send invites.`;
        if (errorDetails.includes('sandbox') || errorDetails.includes('verify a domain')) {
          errorMessage = 'Email service is in sandbox mode. Please verify a domain on Resend to send to other recipients.';
        } else if (errorDetails) {
          errorMessage = errorDetails;
        }
        toast({
          title: 'Email Delivery Issue',
          description: errorMessage,
          variant: 'destructive',
        });
      } else if (failedEmails.length > 0) {
        toast({
          title: 'Partial Success',
          description: `Sent ${sentCount} invite(s). Failed to send to: ${failedEmails.join(', ')}`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: '✅ Invitations Sent!',
          description: `Successfully sent ${sentCount} invitation(s) to your guests.`,
        });
      }
      
      // Clear guest list after successful send
      if (sentCount > 0) {
        setGuests([{ name: '', email: '' }]);
      }

    } catch (err) {
      debugLog('Send invites error', { error: err.message });
      
      let userMessage = err.message;
      
      // Provide more user-friendly error messages
      if (err.message.includes('validation')) {
        userMessage = 'Invalid email format. Please check the email addresses.';
      } else if (err.message.includes('not found')) {
        userMessage = 'Wedding not found. Please save the wedding first.';
      } else if (err.message.includes('RESEND') || err.message.includes('API')) {
        userMessage = 'Email service error. Please try again later or contact support.';
      }

      toast({
        title: 'Failed to Send Invites',
        description: userMessage,
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
            <span className="text-xl font-bold font-serif">AI Wedding Ops</span>
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-3 font-serif">Host Setup & Invite Manager</h1>
            <p className="text-muted-foreground">Create your wedding and invite your guests</p>
          </div>

          {/* Wedding Setup Form */}
          <Card className="mb-8 border-2 border-primary/20 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/10">
              <CardTitle className="flex items-center gap-2 font-serif">
                <Calendar className="w-5 h-5 text-primary" />
                Wedding Setup Form
              </CardTitle>
              <CardDescription>Enter your wedding details</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <MapPin className="w-4 h-4" />
                    Location * <span className="text-xs text-muted-foreground ml-1">(City, Region)</span>
                  </Label>
                  <Input
                    id="location"
                    placeholder="e.g., Mumbai, India or Bengaluru"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="border-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <Label className="text-lg font-semibold font-serif">Day-wise Events</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addDay} className="gap-1 border-primary/30 text-primary">
                    <Plus className="w-4 h-4" />
                    Add Day
                  </Button>
                </div>

                <AnimatePresence>
                  {days.map((day, dayIndex) => (
                    <motion.div
                      key={dayIndex}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="border border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
                        <CardContent className="pt-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Badge className="bg-primary text-primary-foreground">Day {dayIndex + 1}</Badge>
                              <Input
                                type="date"
                                value={day.date}
                                onChange={(e) => updateDayDate(dayIndex, e.target.value)}
                                className="w-40 border-primary/20"
                              />
                            </div>
                            {days.length > 1 && (
                              <Button type="button" variant="ghost" size="icon" onClick={() => removeDay(dayIndex)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>

                          {/* Events */}
                          <div className="space-y-3 pl-4 border-l-2 border-primary/20">
                            {day.events.map((event, eventIndex) => (
                              <div key={eventIndex} className="grid grid-cols-12 gap-2 items-center">
                                <div className="col-span-4">
                                  <Input
                                    placeholder="e.g., Mehendi"
                                    value={event.name}
                                    onChange={(e) => updateEvent(dayIndex, eventIndex, 'name', e.target.value)}
                                    className="border-primary/20"
                                  />
                                </div>
                                <div className="col-span-3">
                                  <Input
                                    type="time"
                                    value={event.time}
                                    onChange={(e) => updateEvent(dayIndex, eventIndex, 'time', e.target.value)}
                                    className="border-primary/20"
                                  />
                                </div>
                                <div className="col-span-4">
                                  <Input
                                    placeholder="e.g., Garden"
                                    value={event.venue}
                                    onChange={(e) => updateEvent(dayIndex, eventIndex, 'venue', e.target.value)}
                                    className="border-primary/20"
                                  />
                                </div>
                                <div className="col-span-1 flex justify-end">
                                  {day.events.length > 1 && (
                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeEvent(dayIndex, eventIndex)} className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50">
                                      <X className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                            <Button type="button" variant="ghost" size="sm" onClick={() => addEvent(dayIndex)} className="text-primary hover:bg-primary/10">
                              <Plus className="w-4 h-4 mr-1" />
                              Add Event
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>

          {/* Vendors Section */}
          <Card className="mb-8 border-2 border-primary/20 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-primary/5 border-b border-primary/10">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 font-serif">
                    <Building className="w-5 h-5 text-purple-600" />
                    Vendors
                  </CardTitle>
                  <CardDescription>Add and manage your wedding vendors</CardDescription>
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSuggestVendors}
                  disabled={isLoadingSuggestions || !isValidLocation(location)}
                  className="gap-2 border-purple-300 text-purple-700 hover:bg-purple-50 disabled:opacity-50"
                >
                  {isLoadingSuggestions ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Lightbulb className="w-4 h-4" />
                  )}
                  Suggest Vendors Near Venue
                </Button>
              </div>
              {!isValidLocation(location) && (
                <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Enter a valid location above to enable vendor suggestions
                </p>
              )}
            </CardHeader>
            <CardContent className="pt-6">
              <AnimatePresence>
                {vendors.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Building className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="mb-3">No vendors added yet</p>
                    <Button type="button" variant="outline" onClick={addVendor} className="gap-2 border-primary/30">
                      <Plus className="w-4 h-4" />
                      Add Your First Vendor
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {vendors.map((vendor, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3 }}
                        className="grid grid-cols-12 gap-3 items-center p-4 bg-gradient-to-r from-purple-50/50 to-transparent rounded-lg border border-purple-100"
                      >
                        <div className="col-span-3">
                          <Select value={vendor.role} onValueChange={(v) => updateVendor(index, 'role', v)}>
                            <SelectTrigger className="border-purple-200">
                              <SelectValue placeholder="Role" />
                            </SelectTrigger>
                            <SelectContent>
                              {VENDOR_ROLES.map((role) => (
                                <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-3">
                          <Input
                            placeholder="Vendor Name"
                            value={vendor.name}
                            onChange={(e) => updateVendor(index, 'name', e.target.value)}
                            className="border-purple-200"
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            placeholder="Phone"
                            value={vendor.phone}
                            onChange={(e) => updateVendor(index, 'phone', e.target.value)}
                            className="border-purple-200"
                          />
                        </div>
                        <div className="col-span-3">
                          <Input
                            type="email"
                            placeholder="Email"
                            value={vendor.email}
                            onChange={(e) => updateVendor(index, 'email', e.target.value)}
                            className="border-purple-200"
                          />
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeVendor(index)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                    <Button type="button" variant="outline" onClick={addVendor} className="gap-2 border-purple-300 text-purple-700 hover:bg-purple-50">
                      <Plus className="w-4 h-4" />
                      Add Another Vendor
                    </Button>
                  </div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Save Wedding Button */}
          <div className="flex justify-center mb-8">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button 
                onClick={handleSaveWedding} 
                disabled={isSaving}
                size="lg"
                className="gap-2 bg-primary hover:bg-primary/90 text-lg px-10 py-6 rounded-xl shadow-lg"
              >
                {isSaving ? (
                  <><Loader2 className="w-5 h-5 animate-spin" />Saving...</>
                ) : (
                  <><Save className="w-5 h-5" />Save Wedding</>
                )}
              </Button>
            </motion.div>
          </div>

          {/* Invite Guests Section - Shows after saving */}
          {savedWeddingId && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="border-2 border-green-200 shadow-lg bg-gradient-to-r from-green-50 to-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-800 font-serif">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Wedding Saved! Now Invite Your Guests
                  </CardTitle>
                  <CardDescription>Add guest emails and send personalized invitations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Success message for sent invites */}
                  {invitesSentCount > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 bg-green-100 border border-green-300 rounded-lg flex items-center gap-3"
                    >
                      <CheckCircle className="w-6 h-6 text-green-600" />
                      <span className="text-green-800 font-medium">
                        Successfully sent {invitesSentCount} invitation(s) to your guests!
                      </span>
                    </motion.div>
                  )}

                  <AnimatePresence>
                    {guests.map((guest, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3 }}
                        className="grid grid-cols-12 gap-3 items-center"
                      >
                        <div className="col-span-5">
                          <Input
                            placeholder="Guest Name (optional)"
                            value={guest.name}
                            onChange={(e) => updateGuest(index, 'name', e.target.value)}
                            className="border-green-200"
                          />
                        </div>
                        <div className="col-span-6">
                          <Input
                            type="email"
                            placeholder="Email Address *"
                            value={guest.email}
                            onChange={(e) => updateGuest(index, 'email', e.target.value)}
                            className="border-green-200"
                          />
                        </div>
                        <div className="col-span-1 flex justify-end">
                          {guests.length > 1 && (
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeGuest(index)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  <div className="flex items-center gap-4">
                    <Button type="button" variant="outline" onClick={addGuest} className="gap-2 border-green-300 text-green-700 hover:bg-green-50">
                      <UserPlus className="w-4 h-4" />
                      Add Guest
                    </Button>
                    <Button
                      onClick={handleSendInvites}
                      disabled={isSendingInvites}
                      className="gap-2 bg-green-600 hover:bg-green-700"
                    >
                      {isSendingInvites ? (
                        <><Loader2 className="w-4 h-4 animate-spin" />Sending Invites...</>
                      ) : (
                        <><Send className="w-4 h-4" />Send Invitations</>
                      )}
                    </Button>
                  </div>

                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Invitations include the wedding details and a personalized RSVP link.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      </main>

      {/* Vendor Suggestions Modal - IMPROVED */}
      <Dialog open={showSuggestionsModal} onOpenChange={setShowSuggestionsModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-serif">
              <Lightbulb className="w-5 h-5 text-primary" />
              Vendor Suggestions
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <span>Suggestions near: <strong className="text-foreground">{suggestionLocation || location}</strong></span>
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingSuggestions ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Finding vendors in {suggestionLocation}...</span>
            </div>
          ) : suggestionError ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 mx-auto text-amber-500 mb-4" />
              <p className="text-amber-700">{suggestionError}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Try specifying a major city like Mumbai, Delhi, or Bengaluru.
              </p>
            </div>
          ) : suggestedVendors.length > 0 ? (
            <div className="space-y-6">
              {suggestedVendors.map((category, idx) => (
                <div key={idx} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold capitalize text-lg">{category.type}</h4>
                    <Button size="sm" variant="outline" onClick={() => addSuggestedVendor(category.type)} className="gap-1 border-primary/30 text-primary">
                      <Plus className="w-4 h-4" />
                      Add {category.type}
                    </Button>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-primary/5 to-transparent rounded-lg border border-primary/10">
                    <pre className="whitespace-pre-wrap text-sm font-sans">{category.suggestions}</pre>
                  </div>
                  {!category.isRelevant && (
                    <p className="text-xs text-amber-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      AI suggestions may include vendors outside the specified location
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Building className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>No vendor suggestions available.</p>
              <p className="text-sm mt-2">Try entering a more specific location.</p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSuggestionsModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
