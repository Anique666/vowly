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
  X, ArrowRight
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

  // Vendor suggestions state
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [suggestedVendors, setSuggestedVendors] = useState([]);
  const [showSuggestionsModal, setShowSuggestionsModal] = useState(false);

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

  // Suggest vendors by location
  const handleSuggestVendors = async () => {
    if (!location.trim()) {
      toast({
        title: 'Location Required',
        description: 'Please enter a wedding location first to get vendor suggestions.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoadingSuggestions(true);
    setSuggestedVendors([]);
    setShowSuggestionsModal(true);

    try {
      // First set the location for the planner
      await fetch(`${backendUrl}/api/ai/planner/set-details`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location }),
      });

      // Get suggestions for different vendor types
      const vendorTypes = ['catering', 'photography', 'decoration'];
      const suggestions = [];

      for (const type of vendorTypes) {
        const response = await fetch(`${backendUrl}/api/ai/planner/search-vendor`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vendor_type: type }),
        });

        if (response.ok) {
          const data = await response.json();
          suggestions.push({
            type,
            suggestions: data.result,
          });
        }
      }

      setSuggestedVendors(suggestions);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to get vendor suggestions. Please try again.',
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

      // Save vendors if any
      for (const vendor of vendors) {
        if (vendor.name.trim()) {
          await fetch(`${backendUrl}/api/vendors`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              weddingId: data.id,
              name: vendor.name,
              serviceType: vendor.role,
              email: vendor.email || null,
              phoneNumber: vendor.phone || null,
              attendingDays: days.map(() => true),
            }),
          });
        }
      }
      
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

    const validGuests = guests.filter(g => g.email && g.email.includes('@'));
    if (validGuests.length === 0) {
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
          guestEmails: validGuests.map(g => g.email),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to send invites');
      }

      const data = await response.json();
      
      toast({
        title: 'Invitations Sent!',
        description: `${data.emailsSent} invitation(s) sent successfully.`,
      });
      
      setGuests([{ name: '', email: '' }]);
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
                    Location *
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
                  disabled={isLoadingSuggestions}
                  className="gap-2 border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  {isLoadingSuggestions ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Lightbulb className="w-4 h-4" />
                  )}
                  Suggest Vendors Near Venue
                </Button>
              </div>
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
                  <CardDescription>Add guest details and send invitations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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
                            placeholder="Guest Name"
                            value={guest.name}
                            onChange={(e) => updateGuest(index, 'name', e.target.value)}
                            className="border-green-200"
                          />
                        </div>
                        <div className="col-span-6">
                          <Input
                            type="email"
                            placeholder="Email Address"
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
                        <><Loader2 className="w-4 h-4 animate-spin" />Sending...</>
                      ) : (
                        <><Send className="w-4 h-4" />Send Invitations</>
                      )}
                    </Button>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    Invitations will include the wedding ID and RSVP link for guests to respond.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      </main>

      {/* Vendor Suggestions Modal */}
      <Dialog open={showSuggestionsModal} onOpenChange={setShowSuggestionsModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-serif">
              <Lightbulb className="w-5 h-5 text-primary" />
              Vendor Suggestions for {location || 'Your Location'}
            </DialogTitle>
            <DialogDescription>
              AI-generated vendor recommendations. Click to add them to your list.
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingSuggestions ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Finding vendors near you...</span>
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
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No suggestions available. Try again.
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
