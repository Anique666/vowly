'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useRequireAuth, useAuth } from '@/context/AuthContext';
import { 
  Plus, Trash2, Send, Save, Calendar, MapPin, 
  Loader2, UserPlus, Mail, Building, Lightbulb, CheckCircle,
  X, ArrowRight, AlertCircle
} from 'lucide-react';
import { BotanicalHeader, BotanicalFooter } from '@/components/botanical/Layout';

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

const debugLog = (message, data) => {
  if (process.env.NODE_ENV === 'development' || typeof window !== 'undefined') {
    console.log(`[HOST DEBUG] ${message}:`, data);
  }
};

export default function HostPage() {
  // Route protection - require organizer auth
  const { loading: authLoading } = useRequireAuth('organizer');
  const { updateWeddingId } = useAuth();
  
  const { toast } = useToast();
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';

  const [weddingName, setWeddingName] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [days, setDays] = useState([{ date: '', events: [{ name: '', time: '', venue: '' }] }]);
  const [vendors, setVendors] = useState([]);
  const [guests, setGuests] = useState([{ name: '', email: '' }]);
  const [savedWeddingId, setSavedWeddingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingInvites, setIsSendingInvites] = useState(false);
  const [invitesSentCount, setInvitesSentCount] = useState(0);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [suggestedVendors, setSuggestedVendors] = useState([]);
  const [showSuggestionsModal, setShowSuggestionsModal] = useState(false);
  const [suggestionLocation, setSuggestionLocation] = useState('');
  const [suggestionError, setSuggestionError] = useState('');

  // Day management
  const addDay = () => setDays([...days, { date: '', events: [{ name: '', time: '', venue: '' }] }]);
  const removeDay = (dayIndex) => { if (days.length > 1) setDays(days.filter((_, i) => i !== dayIndex)); };
  const updateDayDate = (dayIndex, date) => { const newDays = [...days]; newDays[dayIndex].date = date; setDays(newDays); };

  // Event management
  const addEvent = (dayIndex) => { const newDays = [...days]; newDays[dayIndex].events.push({ name: '', time: '', venue: '' }); setDays(newDays); };
  const removeEvent = (dayIndex, eventIndex) => { const newDays = [...days]; if (newDays[dayIndex].events.length > 1) { newDays[dayIndex].events = newDays[dayIndex].events.filter((_, i) => i !== eventIndex); setDays(newDays); } };
  const updateEvent = (dayIndex, eventIndex, field, value) => { const newDays = [...days]; newDays[dayIndex].events[eventIndex][field] = value; setDays(newDays); };

  // Vendor management
  const addVendor = () => setVendors([...vendors, { role: 'catering', name: '', phone: '', email: '' }]);
  const removeVendor = (index) => setVendors(vendors.filter((_, i) => i !== index));
  const updateVendor = (index, field, value) => { const newVendors = [...vendors]; newVendors[index] = { ...newVendors[index], [field]: value }; setVendors(newVendors); };

  // Guest management
  const addGuest = () => setGuests([...guests, { name: '', email: '' }]);
  const removeGuest = (index) => { if (guests.length > 1) setGuests(guests.filter((_, i) => i !== index)); };
  const updateGuest = (index, field, value) => { const newGuests = [...guests]; newGuests[index] = { ...newGuests[index], [field]: value }; setGuests(newGuests); };

  const extractCity = (locationStr) => {
    if (!locationStr || typeof locationStr !== 'string') return '';
    const parts = locationStr.split(',').map(p => p.trim());
    return parts[0] || locationStr.trim();
  };

  const isValidLocation = (loc) => {
    if (!loc || typeof loc !== 'string') return false;
    const trimmed = loc.trim();
    return trimmed.length >= 2 && /[a-zA-Z]/.test(trimmed);
  };

  const handleSuggestVendors = async () => {
    if (!isValidLocation(location)) {
      toast({ title: 'Location Required', description: 'Please enter a valid location to get vendor suggestions.', variant: 'destructive' });
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
      const setDetailsRes = await fetch(`${backendUrl}/api/ai/planner/set-details`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location: city }),
      });
      if (!setDetailsRes.ok) throw new Error('Failed to set location details');

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
          const result = data.result || '';
          const isRelevant = result.toLowerCase().includes(city.toLowerCase());
          if (result && result.trim().length > 20) {
            suggestions.push({ type, suggestions: result, isRelevant });
          }
        }
      }
      if (suggestions.length === 0) {
        setSuggestionError(`No vendor suggestions found for ${city}. Try a major city.`);
      }
      setSuggestedVendors(suggestions);
    } catch (err) {
      debugLog('Vendor suggestion error', { error: err.message });
      setSuggestionError(`Failed to get vendor suggestions: ${err.message}`);
      toast({ title: 'Error', description: `Failed to get vendor suggestions: ${err.message}`, variant: 'destructive' });
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const addSuggestedVendor = (type) => {
    setVendors([...vendors, { role: type, name: '', phone: '', email: '' }]);
    toast({ title: 'Vendor Added', description: `A ${type} vendor slot has been added.` });
  };

  const validateForm = () => {
    if (!weddingName.trim()) return 'Wedding name is required';
    if (!location.trim()) return 'Location is required';
    if (!startDate) return 'Start date is required';
    if (!endDate) return 'End date is required';
    for (let i = 0; i < days.length; i++) {
      if (!days[i].date) return `Date is required for Day ${i + 1}`;
      for (let j = 0; j < days[i].events.length; j++) {
        if (!days[i].events[j].name.trim()) return `Event name required for Day ${i + 1}, Event ${j + 1}`;
        if (!days[i].events[j].time) return `Time required for Day ${i + 1}, Event ${j + 1}`;
        if (!days[i].events[j].venue.trim()) return `Venue required for Day ${i + 1}, Event ${j + 1}`;
      }
    }
    return null;
  };

  const handleSaveWedding = async () => {
    const error = validateForm();
    if (error) { toast({ title: 'Validation Error', description: error, variant: 'destructive' }); return; }
    setIsSaving(true);
    try {
      const payload = {
        name: weddingName, location, startDate, endDate,
        days: days.map((day, index) => ({
          dayIndex: index, date: day.date,
          events: day.events.map(event => ({ name: event.name, time: event.time, venue: event.venue })),
        })),
      };
      const response = await fetch(`${backendUrl}/api/wedding/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Failed to save wedding');
      setSavedWeddingId(data.id);

      for (const vendor of vendors) {
        if (vendor.name.trim()) {
          await fetch(`${backendUrl}/api/vendors`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              weddingId: data.id, name: vendor.name, serviceType: vendor.role,
              email: vendor.email || null, phoneNumber: vendor.phone || null,
              attendingDays: days.map(() => true),
            }),
          });
        }
      }
      toast({ title: 'Wedding Saved!', description: `"${weddingName}" has been created successfully.` });
    } catch (err) {
      toast({ title: 'Error', description: err.message || 'Failed to save wedding', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendInvites = async () => {
    if (!savedWeddingId) { toast({ title: 'Error', description: 'Please save the wedding first.', variant: 'destructive' }); return; }
    const validGuests = guests.filter(g => { const email = g.email?.trim(); return email && email.includes('@') && email.includes('.'); });
    if (validGuests.length === 0) { toast({ title: 'Validation Error', description: 'Please enter at least one valid email address.', variant: 'destructive' }); return; }
    setIsSendingInvites(true);
    setInvitesSentCount(0);
    try {
      const payload = { weddingId: savedWeddingId, guestEmails: validGuests.map(g => g.email.trim()) };
      const response = await fetch(`${backendUrl}/api/email/send-invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || data.message || 'Failed to send invites');

      const sentCount = data.emailsSent || 0;
      const failedEmails = data.failed || [];
      const errorDetails = data.errorDetails || '';
      setInvitesSentCount(sentCount);

      if (failedEmails.length > 0 && sentCount === 0) {
        let errorMessage = 'Failed to send invites.';
        if (errorDetails) {
          errorMessage = errorDetails;
        }
        toast({ title: 'Email Delivery Issue', description: errorMessage, variant: 'destructive' });
      } else if (failedEmails.length > 0) {
        toast({ title: 'Partial Success', description: `Sent ${sentCount} invite(s). Failed: ${failedEmails.join(', ')}`, variant: 'destructive' });
      } else {
        toast({ title: 'Invitations Sent!', description: `Successfully sent ${sentCount} invitation(s).` });
      }
      if (sentCount > 0) setGuests([{ name: '', email: '' }]);
    } catch (err) {
      toast({ title: 'Failed to Send Invites', description: err.message, variant: 'destructive' });
    } finally {
      setIsSendingInvites(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <BotanicalHeader />

      <main className="pt-24 pb-20">
        <div className="max-w-3xl mx-auto px-6">
          {/* Page Header */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="label-botanical mb-3">Wedding Setup</p>
            <h1 className="text-4xl md:text-5xl font-serif font-normal mb-4">
              Create your <span className="italic">celebration</span>
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Fill in the details below to set up your wedding and start inviting guests.
            </p>
          </motion.div>

          {/* Wedding Form */}
          <motion.div
            className="card-botanical mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="flex items-center gap-2 mb-6">
              <Calendar className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-serif">Wedding Details</h2>
            </div>

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weddingName" className="text-sm font-medium">Wedding Name</Label>
                  <Input
                    id="weddingName"
                    placeholder="e.g., Sarah & John Wedding"
                    value={weddingName}
                    onChange={(e) => setWeddingName(e.target.value)}
                    className="input-botanical"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-sm font-medium flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> Location
                  </Label>
                  <Input
                    id="location"
                    placeholder="e.g., Mumbai, India"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="input-botanical"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate" className="text-sm font-medium">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="input-botanical"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate" className="text-sm font-medium">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="input-botanical"
                  />
                </div>
              </div>

              {/* Day-wise Events */}
              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif text-lg">Day-wise Events</h3>
                  <button onClick={addDay} className="btn-botanical-outline text-sm py-2 px-4">
                    <Plus className="w-4 h-4" /> Add Day
                  </button>
                </div>

                <AnimatePresence>
                  {days.map((day, dayIndex) => (
                    <motion.div
                      key={dayIndex}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-4 p-4 bg-secondary/50 rounded-xl border border-border"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-medium bg-primary text-white px-2.5 py-1 rounded-full">
                            Day {dayIndex + 1}
                          </span>
                          <Input
                            type="date"
                            value={day.date}
                            onChange={(e) => updateDayDate(dayIndex, e.target.value)}
                            className="input-botanical w-40 text-sm"
                          />
                        </div>
                        {days.length > 1 && (
                          <button onClick={() => removeDay(dayIndex)} className="text-destructive hover:bg-destructive/10 p-2 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="space-y-3 pl-3 border-l-2 border-primary/20">
                        {day.events.map((event, eventIndex) => (
                          <div key={eventIndex} className="grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-4">
                              <Input
                                placeholder="Event name"
                                value={event.name}
                                onChange={(e) => updateEvent(dayIndex, eventIndex, 'name', e.target.value)}
                                className="input-botanical text-sm"
                              />
                            </div>
                            <div className="col-span-3">
                              <Input
                                type="time"
                                value={event.time}
                                onChange={(e) => updateEvent(dayIndex, eventIndex, 'time', e.target.value)}
                                className="input-botanical text-sm"
                              />
                            </div>
                            <div className="col-span-4">
                              <Input
                                placeholder="Venue"
                                value={event.venue}
                                onChange={(e) => updateEvent(dayIndex, eventIndex, 'venue', e.target.value)}
                                className="input-botanical text-sm"
                              />
                            </div>
                            <div className="col-span-1 flex justify-end">
                              {day.events.length > 1 && (
                                <button onClick={() => removeEvent(dayIndex, eventIndex)} className="text-destructive hover:bg-destructive/10 p-1.5 rounded-lg transition-colors">
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                        <button onClick={() => addEvent(dayIndex)} className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
                          <Plus className="w-4 h-4" /> Add Event
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          {/* Vendors Section */}
          <motion.div
            className="card-botanical mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-serif">Vendors</h2>
              </div>
              <button
                onClick={handleSuggestVendors}
                disabled={isLoadingSuggestions || !isValidLocation(location)}
                className="btn-botanical-outline text-sm py-2 px-4 disabled:opacity-50"
              >
                {isLoadingSuggestions ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lightbulb className="w-4 h-4" />}
                AI Suggestions
              </button>
            </div>

            {!isValidLocation(location) && (
              <p className="text-xs text-muted-foreground mb-4 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Enter a location above to enable AI vendor suggestions
              </p>
            )}

            <AnimatePresence>
              {vendors.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Building className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="mb-3">No vendors added yet</p>
                  <button onClick={addVendor} className="btn-botanical-outline text-sm py-2 px-4">
                    <Plus className="w-4 h-4" /> Add Vendor
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {vendors.map((vendor, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="grid grid-cols-12 gap-3 items-center p-3 bg-secondary/50 rounded-xl border border-border"
                    >
                      <div className="col-span-3">
                        <Select value={vendor.role} onValueChange={(v) => updateVendor(index, 'role', v)}>
                          <SelectTrigger className="input-botanical text-sm">
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
                        <Input placeholder="Name" value={vendor.name} onChange={(e) => updateVendor(index, 'name', e.target.value)} className="input-botanical text-sm" />
                      </div>
                      <div className="col-span-2">
                        <Input placeholder="Phone" value={vendor.phone} onChange={(e) => updateVendor(index, 'phone', e.target.value)} className="input-botanical text-sm" />
                      </div>
                      <div className="col-span-3">
                        <Input type="email" placeholder="Email" value={vendor.email} onChange={(e) => updateVendor(index, 'email', e.target.value)} className="input-botanical text-sm" />
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <button onClick={() => removeVendor(index)} className="text-destructive hover:bg-destructive/10 p-2 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                  <button onClick={addVendor} className="btn-botanical-outline text-sm py-2 px-4">
                    <Plus className="w-4 h-4" /> Add Vendor
                  </button>
                </div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Save Button */}
          <motion.div
            className="flex justify-center mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <motion.button
              onClick={handleSaveWedding}
              disabled={isSaving}
              className="btn-botanical text-base px-10 py-4"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isSaving ? <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</> : <><Save className="w-5 h-5" /> Save Wedding</>}
            </motion.button>
          </motion.div>

          {/* Invite Guests Section */}
          {savedWeddingId && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="card-botanical border-primary/30"
            >
              <div className="flex items-center gap-2 mb-6">
                <CheckCircle className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-serif">Wedding Saved! Invite Guests</h2>
              </div>

              {invitesSentCount > 0 && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-4 bg-primary/10 border border-primary/20 rounded-xl flex items-center gap-3 mb-6">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium">Successfully sent {invitesSentCount} invitation(s)!</span>
                </motion.div>
              )}

              <AnimatePresence>
                {guests.map((guest, index) => (
                  <motion.div key={index} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="grid grid-cols-12 gap-3 items-center mb-3">
                    <div className="col-span-5">
                      <Input placeholder="Guest Name (optional)" value={guest.name} onChange={(e) => updateGuest(index, 'name', e.target.value)} className="input-botanical text-sm" />
                    </div>
                    <div className="col-span-6">
                      <Input type="email" placeholder="Email Address *" value={guest.email} onChange={(e) => updateGuest(index, 'email', e.target.value)} className="input-botanical text-sm" />
                    </div>
                    <div className="col-span-1 flex justify-end">
                      {guests.length > 1 && (
                        <button onClick={() => removeGuest(index)} className="text-destructive hover:bg-destructive/10 p-2 rounded-lg transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              <div className="flex items-center gap-4 mt-4">
                <button onClick={addGuest} className="btn-botanical-outline text-sm py-2 px-4">
                  <UserPlus className="w-4 h-4" /> Add Guest
                </button>
                <button onClick={handleSendInvites} disabled={isSendingInvites} className="btn-botanical text-sm py-2 px-4">
                  {isSendingInvites ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : <><Send className="w-4 h-4" /> Send Invitations</>}
                </button>
              </div>

              <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" /> Invitations include wedding details and a personalized RSVP link.
              </p>
            </motion.div>
          )}
        </div>
      </main>

      {/* Vendor Suggestions Modal */}
      <Dialog open={showSuggestionsModal} onOpenChange={setShowSuggestionsModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Vendor Suggestions</DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" /> Suggestions near: <strong>{suggestionLocation || location}</strong>
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingSuggestions ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Finding vendors in {suggestionLocation}...</span>
            </div>
          ) : suggestionError ? (
            <div className="text-center py-8">
              <AlertCircle className="w-10 h-10 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{suggestionError}</p>
            </div>
          ) : suggestedVendors.length > 0 ? (
            <div className="space-y-6">
              {suggestedVendors.map((category, idx) => (
                <div key={idx} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-serif font-medium capitalize text-lg">{category.type}</h4>
                    <button onClick={() => addSuggestedVendor(category.type)} className="btn-botanical-outline text-xs py-1.5 px-3">
                      <Plus className="w-3 h-3" /> Add {category.type}
                    </button>
                  </div>
                  <div className="p-4 bg-secondary/50 rounded-xl border border-border">
                    <pre className="whitespace-pre-wrap text-sm font-sans text-muted-foreground">{category.suggestions}</pre>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Building className="w-10 h-10 mx-auto mb-4 text-muted-foreground/50" />
              <p>No vendor suggestions available.</p>
            </div>
          )}

          <DialogFooter>
            <button onClick={() => setShowSuggestionsModal(false)} className="btn-botanical-outline">Close</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BotanicalFooter />
    </div>
  );
}
