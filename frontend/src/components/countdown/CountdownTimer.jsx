'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, Timer, PartyPopper, Sparkles } from 'lucide-react';

export function CountdownTimer({ wedding, className = '' }) {
  const [timeLeft, setTimeLeft] = useState(null);
  const [countdownTarget, setCountdownTarget] = useState(null);

  useEffect(() => {
    if (!wedding) return;

    const calculateTarget = () => {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      
      // Check if wedding has started
      const startDate = new Date(wedding.startDate + 'T00:00:00');
      const endDate = new Date(wedding.endDate + 'T23:59:59');
      
      if (now < startDate) {
        // Wedding hasn't started - countdown to start
        return {
          type: 'wedding-start',
          date: startDate,
          label: 'Wedding starts in',
          emoji: '💒'
        };
      } else if (now <= endDate) {
        // Wedding is ongoing - find next event
        const todayIndex = wedding.days?.findIndex(d => d.date === today);
        
        if (todayIndex >= 0) {
          const todayEvents = wedding.days[todayIndex].events || [];
          const currentTime = now.getHours() * 60 + now.getMinutes();
          
          for (const event of todayEvents) {
            const [hours, minutes] = event.time.split(':').map(Number);
            const eventTime = hours * 60 + minutes;
            
            if (eventTime > currentTime) {
              const eventDate = new Date(today + 'T' + event.time + ':00');
              return {
                type: 'next-event',
                date: eventDate,
                label: `${event.name} starts in`,
                venue: event.venue,
                emoji: '🎉'
              };
            }
          }
        }
        
        // No more events today - check next day
        const nextDayIndex = todayIndex + 1;
        if (nextDayIndex < wedding.days?.length) {
          const nextDay = wedding.days[nextDayIndex];
          const firstEvent = nextDay.events?.[0];
          if (firstEvent) {
            const eventDate = new Date(nextDay.date + 'T' + firstEvent.time + ':00');
            return {
              type: 'next-event',
              date: eventDate,
              label: `${firstEvent.name} starts in`,
              venue: firstEvent.venue,
              emoji: '🎊'
            };
          }
        }
        
        return {
          type: 'ongoing',
          label: 'Wedding in progress!',
          emoji: '🎊'
        };
      }
      
      return null; // Wedding ended
    };

    const target = calculateTarget();
    setCountdownTarget(target);

    if (!target || target.type === 'ongoing' || !target.date) return;

    const updateCountdown = () => {
      const now = new Date();
      const diff = target.date.getTime() - now.getTime();
      
      if (diff <= 0) {
        // Recalculate target
        const newTarget = calculateTarget();
        setCountdownTarget(newTarget);
        return;
      }
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    
    return () => clearInterval(interval);
  }, [wedding]);

  if (!wedding || !countdownTarget) return null;

  // Wedding is ongoing without specific event
  if (countdownTarget.type === 'ongoing') {
    return (
      <Card className={`border-2 border-green-300 bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 shadow-lg overflow-hidden ${className}`}>
        <CardContent className="py-5">
          <div className="flex items-center justify-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center animate-pulse shadow-lg">
                <PartyPopper className="w-7 h-7 text-white" />
              </div>
              <span className="absolute -top-1 -right-1 text-xl animate-bounce">🎊</span>
            </div>
            <div>
              <p className="text-sm text-green-600 font-medium">Happening Now</p>
              <h3 className="font-serif text-xl font-bold text-green-800">{countdownTarget.label}</h3>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!timeLeft) return null;

  const isToday = timeLeft.days === 0;
  const isSoon = timeLeft.days === 0 && timeLeft.hours < 2;

  return (
    <Card className={`border-2 ${
      isSoon ? 'border-amber-400 bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50' :
      isToday ? 'border-primary/40 bg-gradient-to-r from-primary/10 via-amber-50 to-yellow-50' :
      'border-primary/20 bg-gradient-to-r from-white via-amber-50/30 to-white'
    } shadow-lg overflow-hidden animate-fade-in ${className}`}>
      <CardContent className="py-5">
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
          {/* Icon */}
          <div className="relative">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg ${
              isSoon ? 'bg-gradient-to-br from-amber-400 to-orange-500 animate-pulse' :
              'bg-gradient-to-br from-primary to-amber-400'
            }`}>
              <Timer className="w-7 h-7 text-white" />
            </div>
            <span className="absolute -top-1 -right-1 text-xl animate-bounce">{countdownTarget.emoji}</span>
          </div>

          {/* Label */}
          <div className="text-center md:text-left">
            <p className="text-sm text-muted-foreground font-medium">{countdownTarget.label}</p>
            {countdownTarget.venue && (
              <p className="text-xs text-muted-foreground">at {countdownTarget.venue}</p>
            )}
          </div>

          {/* Countdown numbers */}
          <div className="flex items-center gap-3 md:ml-auto">
            {timeLeft.days > 0 && (
              <div className="text-center">
                <div className={`text-3xl md:text-4xl font-bold tabular-nums ${
                  isSoon ? 'text-amber-600' : 'text-primary'
                } animate-countdown`}>
                  {timeLeft.days}
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Days</div>
              </div>
            )}
            {(timeLeft.days > 0 || timeLeft.hours > 0) && (
              <>
                <span className="text-2xl text-muted-foreground font-light">:</span>
                <div className="text-center">
                  <div className={`text-3xl md:text-4xl font-bold tabular-nums ${
                    isSoon ? 'text-amber-600' : 'text-primary'
                  } animate-countdown`}>
                    {String(timeLeft.hours).padStart(2, '0')}
                  </div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Hours</div>
                </div>
              </>
            )}
            <span className="text-2xl text-muted-foreground font-light">:</span>
            <div className="text-center">
              <div className={`text-3xl md:text-4xl font-bold tabular-nums ${
                isSoon ? 'text-amber-600' : 'text-primary'
              } animate-countdown`}>
                {String(timeLeft.minutes).padStart(2, '0')}
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Mins</div>
            </div>
            <span className="text-2xl text-muted-foreground font-light">:</span>
            <div className="text-center">
              <div className={`text-3xl md:text-4xl font-bold tabular-nums ${
                isSoon ? 'text-amber-600 animate-pulse' : 'text-primary'
              }`}>
                {String(timeLeft.seconds).padStart(2, '0')}
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Secs</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
