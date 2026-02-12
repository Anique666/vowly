'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Sparkles, Camera, Image as ImageIcon, X, Loader2, 
  ChevronLeft, ChevronRight, Heart, Download
} from 'lucide-react';
import Link from 'next/link';

export default function PostWeddingPage() {
  const { toast } = useToast();
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';

  // State
  const [weddings, setWeddings] = useState([]);
  const [selectedWeddingId, setSelectedWeddingId] = useState('');
  const [wedding, setWedding] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);

  // Lightbox state
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Fetch all weddings on mount
  useEffect(() => {
    fetchWeddings();
  }, []);

  // Fetch photos when wedding selection changes
  useEffect(() => {
    if (selectedWeddingId) {
      fetchWeddingAndPhotos(selectedWeddingId);
    }
  }, [selectedWeddingId]);

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

  const fetchWeddingAndPhotos = async (weddingId) => {
    setIsLoadingPhotos(true);
    try {
      // Fetch wedding details and photos in parallel
      const [weddingRes, photosRes] = await Promise.all([
        fetch(`${backendUrl}/api/wedding/${weddingId}`),
        fetch(`${backendUrl}/api/photos?wedding_id=${weddingId}`),
      ]);

      if (weddingRes.ok) {
        const weddingData = await weddingRes.json();
        setWedding(weddingData);
      }

      if (photosRes.ok) {
        const photosData = await photosRes.json();
        setPhotos(photosData);
      } else {
        setPhotos([]);
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to load photos.',
        variant: 'destructive',
      });
      setPhotos([]);
    } finally {
      setIsLoadingPhotos(false);
    }
  };

  const openLightbox = (index) => {
    setSelectedPhotoIndex(index);
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
    setSelectedPhotoIndex(null);
  };

  const goToPrevious = () => {
    setSelectedPhotoIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
  };

  const goToNext = () => {
    setSelectedPhotoIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isLightboxOpen) return;
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === 'Escape') closeLightbox();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, photos.length]);

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
            <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Dashboard</Link>
            <Link href="/guestdashboard" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Guest</Link>
            <Link href="/postwedding" className="text-sm font-medium text-primary">Photos</Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Title & Wedding Selector */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
                <Camera className="w-8 h-8 text-primary" />
                Wedding Photos
              </h1>
              <p className="text-muted-foreground">Cherish the memories from your special day</p>
            </div>
            
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
          </div>

          {/* Wedding Info */}
          {wedding && (
            <Card className="mb-8 border-2 border-primary/20 shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-primary/5 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-1">{wedding.name}</h2>
                    <p className="text-muted-foreground">
                      {wedding.location} • {wedding.startDate} to {wedding.endDate}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                    <span className="text-lg font-semibold">{photos.length} Photos</span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Loading State */}
          {(isLoading || isLoadingPhotos) && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Loading photos...</span>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !isLoadingPhotos && photos.length === 0 && (
            <Card className="border-2 border-dashed border-primary/30">
              <CardContent className="py-16 text-center">
                <ImageIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Photos Yet</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Photos from the wedding will appear here once they're uploaded. 
                  Check back after the celebration!
                </p>
                <div className="flex items-center justify-center gap-4">
                  <Link href="/dashboard">
                    <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                      Go to Dashboard
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Photo Gallery Grid */}
          {!isLoading && !isLoadingPhotos && photos.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((photo, index) => (
                <div 
                  key={photo.id} 
                  className="group relative aspect-square rounded-lg overflow-hidden border-2 border-primary/10 shadow-md hover:shadow-xl transition-all cursor-pointer hover:border-primary/30"
                  onClick={() => openLightbox(index)}
                >
                  <img 
                    src={photo.url} 
                    alt={photo.caption || `Wedding photo ${index + 1}`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      {photo.caption && (
                        <p className="text-white text-sm truncate">{photo.caption}</p>
                      )}
                      {photo.dayIndex !== undefined && (
                        <p className="text-white/70 text-xs">Day {photo.dayIndex + 1}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Lightbox Dialog */}
      <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none">
          <DialogTitle className="sr-only">Photo Viewer</DialogTitle>
          <div className="relative w-full h-[90vh] flex items-center justify-center">
            {/* Close Button */}
            <Button 
              variant="ghost" 
              size="icon"
              className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
              onClick={closeLightbox}
            >
              <X className="w-6 h-6" />
            </Button>

            {/* Navigation Buttons */}
            {photos.length > 1 && (
              <>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20 h-12 w-12"
                  onClick={goToPrevious}
                >
                  <ChevronLeft className="w-8 h-8" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20 h-12 w-12"
                  onClick={goToNext}
                >
                  <ChevronRight className="w-8 h-8" />
                </Button>
              </>
            )}

            {/* Image */}
            {selectedPhotoIndex !== null && photos[selectedPhotoIndex] && (
              <div className="flex flex-col items-center max-w-full max-h-full">
                <img 
                  src={photos[selectedPhotoIndex].url} 
                  alt={photos[selectedPhotoIndex].caption || 'Wedding photo'}
                  className="max-w-full max-h-[80vh] object-contain"
                />
                {photos[selectedPhotoIndex].caption && (
                  <p className="text-white text-center mt-4 text-lg">
                    {photos[selectedPhotoIndex].caption}
                  </p>
                )}
                <p className="text-white/50 text-sm mt-2">
                  {selectedPhotoIndex + 1} / {photos.length}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
