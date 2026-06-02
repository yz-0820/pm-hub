import Link from 'next/link';
import { Flame } from 'lucide-react';

interface HotEvent {
  id: number;
  title: string;
  href: string;
  publishedAt: Date;
}

interface HotEventsProps {
  events: HotEvent[];
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  
  if (hours < 1) return '刚刚';
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return `${Math.floor(days / 7)}周前`;
}

export function HotEvents({ events }: HotEventsProps) {
  if (events.length === 0) return null;

  return (
    <div className="mt-6 rounded-[28px] border bg-card/45 p-5 backdrop-blur-sm sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <Flame className="h-5 w-5 text-orange-500" />
        <h2 className="text-xl font-bold sm:text-2xl">近期热点</h2>
      </div>

      <div className="space-y-3">
        {events.map((event) => (
          <Link
            key={event.id}
            href={event.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between gap-3 py-2"
          >
            <span className="line-clamp-1 flex-1 text-sm font-medium text-foreground group-hover:text-primary transition-colors">
              {event.title}
            </span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {formatRelativeTime(event.publishedAt)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
