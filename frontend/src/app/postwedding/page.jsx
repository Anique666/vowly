'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Camera, Image as ImageIcon, X, Loader2, ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { BotanicalHeader, BotanicalFooter } from '@/components/botanical/Layout';

export default function PostWeddingPage() {
  const { toast } = useToast();
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';

  const [weddings, setWeddings] = useState([]);
  const [selectedWeddingId, setSelectedWeddingId] = useState('');
  const [wedding, setWedding] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  useEffect(() => { fetchWeddings(); }, []);
  useEffect(() => { if (selectedWeddingId) fetchWeddingAndPhotos(selectedWeddingId); }, [selectedWeddingId]);

  const fetchWeddings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/weddings`);
      if (!response.ok) throw new Error('Failed');
      const data = await response.json();
      setWeddings(data);
      if (data.length > 0) setSelectedWeddingId(data[0].id);
    } catch (err) { toast({ title: 'Error', description: 'Failed to load weddings.', variant: 'destructive' }); }
    finally { setIsLoading(false); }
  };

  const fetchWeddingAndPhotos = async (weddingId) => {
    setIsLoadingPhotos(true);
    try {
      const [weddingRes, photosRes] = await Promise.all([
        fetch(`${backendUrl}/api/wedding/${weddingId}`),
        fetch(`${backendUrl}/api/photos?wedding_id=${weddingId}`),
      ]);
      if (weddingRes.ok) setWedding(await weddingRes.json());
      if (photosRes.ok) setPhotos(await photosRes.json());
      else setPhotos([]);
    } catch (err) { toast({ title: 'Error', description: 'Failed to load photos.', variant: 'destructive' }); setPhotos([]); }
    finally { setIsLoadingPhotos(false); }
  };

  const openLightbox = (index) => { setSelectedPhotoIndex(index); setIsLightboxOpen(true); };
  const closeLightbox = () => { setIsLightboxOpen(false); setSelectedPhotoIndex(null); };
  const navigatePhoto = (direction) => { if (selectedPhotoIndex === null) return; const newIndex = direction === 'next' ? (selectedPhotoIndex + 1) % photos.length : selectedPhotoIndex === 0 ? photos.length - 1 : selectedPhotoIndex - 1; setSelectedPhotoIndex(newIndex); };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white"><BotanicalHeader />
        <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        <BotanicalFooter />
      </div>
    );
  }

  if (weddings.length === 0) {
    return (
      <div className="min-h-screen bg-white"><BotanicalHeader />
        <main className="pt-24 pb-20 text-center max-w-xl mx-auto px-6">
          <Camera className="w-16 h-16 mx-auto text-muted-foreground/30 mb-6" />
          <h1 className="text-3xl font-serif mb-4">No Weddings Found</h1>
          <p className="text-muted-foreground">Create a wedding to start your photo gallery.</p>
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
              <p className="label-botanical mb-2">Photo Gallery</p>
              <h1 className="text-3xl md:text-4xl font-serif flex items-center gap-3">
                <Camera className="w-8 h-8 text-primary" />
                Wedding Memories
              </h1>
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

          {/* Wedding Info */}
          {wedding && (
            <motion.div className="card-botanical mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <h2 className="text-2xl font-serif font-medium mb-2">{wedding.name}</h2>
              <p className="text-muted-foreground">{wedding.location} • {wedding.startDate}</p>
            </motion.div>
          )}

          {/* Photo Grid */}
          {isLoadingPhotos ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : photos.length === 0 ? (
            <motion.div className="card-botanical text-center py-16" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <ImageIcon className="w-16 h-16 mx-auto text-muted-foreground/30 mb-6" />
              <h3 className="text-xl font-serif mb-2">No Photos Yet</h3>
              <p className="text-muted-foreground">Photos will appear here after the celebration.</p>
            </motion.div>
          ) : (
            <motion.div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" initial="hidden" animate="visible" variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } }}>
              {photos.map((photo, index) => (
                <motion.div key={photo.id || index} variants={{ hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1 } }} className="aspect-square relative group cursor-pointer overflow-hidden rounded-2xl border border-border" onClick={() => openLightbox(index)}>
                  <img src={photo.url} alt={photo.caption || `Photo ${index + 1}`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <Heart className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </main>

      {/* Lightbox */}
      <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
        <DialogContent className="max-w-5xl p-0 bg-black/95 border-0">
          <button onClick={closeLightbox} className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
          {photos.length > 1 && (
            <>
              <button onClick={() => navigatePhoto('prev')} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button onClick={() => navigatePhoto('next')} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
          {selectedPhotoIndex !== null && photos[selectedPhotoIndex] && (
            <div className="flex items-center justify-center p-8 min-h-[70vh]">
              <img src={photos[selectedPhotoIndex].url} alt={photos[selectedPhotoIndex].caption || ''} className="max-w-full max-h-[70vh] object-contain rounded-lg" />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <BotanicalFooter />
    </div>
  );
}
