'use client';

import Link from 'next/link';
import { Flame } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface HotEvent {
  id: number;
  title: string;
  href: string;
  publishedAt: Date;
}

interface HotEventsProps {
  events: HotEvent[];
  className?: string;
}

function useRelativeTime(date: Date): string {
  const [relativeTime, setRelativeTime] = useState<string>('');

  useEffect(() => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) setRelativeTime('刚刚');
    else if (hours < 24) setRelativeTime(`${hours}小时前`);
    else if (days < 7) setRelativeTime(`${days}天前`);
    else setRelativeTime(`${Math.floor(days / 7)}周前`);
  }, [date]);

  return relativeTime;
}

function EventItem({ event }: { event: HotEvent }) {
  const relativeTime = useRelativeTime(event.publishedAt);

  return (
    <Link
      href={event.href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center justify-between gap-3 py-2"
    >
      <span className="line-clamp-1 flex-1 text-sm font-medium text-foreground group-hover:text-primary transition-colors">
        {event.title}
      </span>
      <span className="shrink-0 text-xs text-muted-foreground" suppressHydrationWarning>
        {relativeTime}
      </span>
    </Link>
  );
}

export function HotEvents({ events, className }: HotEventsProps) {
  if (events.length === 0) return null;

  return (
    <div className={cn('mt-6 rounded-[28px] border bg-card/45 p-5 backdrop-blur-sm sm:p-6', className)}>
      <div className="mb-4 flex items-center gap-2">
        <Flame className="h-5 w-5 text-red-500" />
        <h2 className="text-[22px] font-bold sm:text-2xl">近期热点</h2>
      </div>

      <div className="space-y-3">
        {events.map((event) => (
          <EventItem key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}
