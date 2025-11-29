
import { getTickerData, type TickerItem, type Match, type NewsArticle } from '@/app/ticker-actions';
import Image from 'next/image';
import { SoccerBall, Clock, Newspaper } from 'lucide-react';
import Link from 'next/link';

const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}

const SportItem = ({ item }: { item: Match }) => (
    <div className="flex items-center flex-shrink-0 px-6 py-2 border-r h-full">
        <Image src={item.leagueLogo} alt={item.league} width={16} height={16} className="mr-2 h-4 w-4" />
        <span className="text-xs text-muted-foreground mr-4">{item.league}</span>
        <div className="flex items-center gap-2">
            <Image src={item.teamALogo} alt={item.teamA} width={20} height={20} className="h-5 w-5 object-contain"/>
            <span className="text-sm font-medium">{item.teamA}</span>
            <span className="text-sm font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-md">
            {item.status === 'NS' ? 'vs' : `${item.scoreA} - ${item.scoreB}`}
            </span>
            <span className="text-sm font-medium">{item.teamB}</span>
            <Image src={item.teamBLogo} alt={item.teamB} width={20} height={20} className="h-5 w-5 object-contain" />
        </div>
        <div className="ml-4 text-xs font-mono text-primary flex items-center gap-1.5">
            {item.status === 'HT' ? (
                <span className='text-amber-500'>HALF TIME</span>
            ) : item.status === 'FT' ? (
                <span className='text-green-500'>FULL TIME</span>
            ) : item.status === 'NS' ? (
                <>
                    <Clock className="h-3 w-3" />
                    <span>{formatTime(item.timestamp)}</span>
                </>
            ) : (
                <>
                    <span className='text-destructive'>{item.elapsed}'</span>
                    <SoccerBall className="h-3 w-3 animate-spin text-destructive" />
                </>
            )}
        </div>
    </div>
);

const NewsItem = ({ item }: { item: NewsArticle }) => (
    <div className="flex items-center flex-shrink-0 px-6 py-2 border-r h-full">
        <Newspaper className="h-4 w-4 text-muted-foreground mr-3" />
        <span className="text-sm text-muted-foreground mr-2 font-semibold">Tech News:</span>
        <Link href={item.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline">
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
  const duplicatedItems = [...items, ...items];

  return (
    <div className="relative w-full bg-card/80 backdrop-blur-sm border-y overflow-hidden h-10 flex items-center">
      <div className="flex w-max animate-marquee hover:[animation-play-state:paused]">
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
  );
}
