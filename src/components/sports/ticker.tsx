
'use client';

import { getTickerData, type TickerItem, type Match, type NewsArticle } from '@/app/ticker-actions';
import Image from 'next/image';
import { SoccerBall, Clock, Newspaper, Dot } from 'lucide-react';
import Link from 'next/link';

const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}

const SportItem = ({ item }: { item: Match }) => (
    <div className="flex items-center flex-shrink-0 px-4 py-2 mx-2">
        <div className="flex items-center gap-3">
            <span className="text-sm font-medium">{item.teamA}</span>
            <Image src={item.teamALogo} alt={item.teamA} width={24} height={24} className="h-6 w-6 object-contain"/>
            <span className="text-sm font-bold bg-primary/10 text-primary px-2 py-1 rounded-md">
                {item.status === 'NS' ? 'vs' : `${item.scoreA} - ${item.scoreB}`}
            </span>
            <Image src={item.teamBLogo} alt={item.teamB} width={24} height={24} className="h-6 w-6 object-contain" />
            <span className="text-sm font-medium">{item.teamB}</span>
        </div>
        <div className="ml-4 pl-4 border-l border-border/50 text-xs font-mono text-primary flex items-center gap-1.5">
            {item.status === 'HT' ? (
                <span className='text-amber-500 font-semibold'>HALF TIME</span>
            ) : item.status === 'FT' ? (
                <span className='text-green-500 font-semibold'>FULL TIME</span>
            ) : item.status === 'NS' ? (
                <>
                    <Clock className="h-3 w-3" />
                    <span>{formatTime(item.timestamp)}</span>
                </>
            ) : (
                <>
                    <span className='text-destructive font-semibold'>{item.elapsed}'</span>
                    <SoccerBall className="h-3 w-3 animate-spin text-destructive" />
                </>
            )}
        </div>
    </div>
);

const NewsItem = ({ item }: { item: NewsArticle }) => (
    <div className="flex items-center flex-shrink-0 px-4 py-2 mx-2">
        <span className="text-sm font-medium mr-2 text-muted-foreground">{item.source}</span>
        <Dot className="text-muted-foreground" />
        <Link href={item.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold hover:underline ml-2">
            {item.title}
        </Link>
    </div>
);

export async function Ticker() {
  const items = await getTickerData();

  if (items.length === 0) {
    return (
        <div className="bg-card/80 backdrop-blur-sm border-y">
             <div className="container py-2 text-center text-muted-foreground text-sm">
                No live sports or news at the moment. Check back later!
            </div>
        </div>
    );
  }

  // Duplicate the array to create a seamless loop
  const duplicatedItems = [...items, ...items, ...items]; // Use 3x for smoother long loops
  const tickerType = items[0]?.type === 'sport' ? 'LIVE' : 'NEWS';

  return (
    <div className="relative w-full bg-card/80 backdrop-blur-sm border-y overflow-hidden h-12 flex items-center">
      <div className="flex-shrink-0 bg-primary text-primary-foreground h-full flex items-center px-4 font-bold text-sm tracking-wider z-10">
        {tickerType}
      </div>
      <div className="flex-1 flex absolute left-0 w-full animate-marquee hover:[animation-play-state:paused]">
        <div className="flex w-max items-center">
            {duplicatedItems.map((item, index) => {
                if (item.type === 'sport') {
                    return <SportItem key={`${item.id}-${index}`} item={item.data as Match} />;
                }
                if (item.type === 'news') {
                    return <NewsItem key={`${item.id}-${index}`} item={item.data as NewsArticle} />;
                }
                return null;
            })}
        </div>
      </div>
    </div>
  );
}
