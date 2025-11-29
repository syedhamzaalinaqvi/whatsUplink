
import { getLiveScores, type Match } from '@/app/sports-actions';
import Image from 'next/image';
import { SoccerBall } from 'lucide-react';

export async function ScoreTicker() {
  const matches = await getLiveScores();

  if (matches.length === 0) {
    // Render a placeholder or nothing if no live matches are found
    return (
        <div className="bg-card/80 backdrop-blur-sm border-y">
             <div className="container py-2 text-center text-muted-foreground text-sm">
                No live matches at the moment. Check back later!
            </div>
        </div>
    );
  }

  // Duplicate the array to create a seamless loop
  const duplicatedMatches = [...matches, ...matches];

  return (
    <div className="relative w-full bg-card/80 backdrop-blur-sm border-y overflow-hidden">
      <div className="flex w-max animate-marquee">
        {duplicatedMatches.map((match, index) => (
          <div key={`${match.id}-${index}`} className="flex items-center flex-shrink-0 px-6 py-2 border-r">
            <Image src={match.leagueLogo} alt={match.league} width={16} height={16} className="mr-2 h-4 w-4" />
            <span className="text-xs text-muted-foreground mr-4">{match.league}</span>
            <div className="flex items-center gap-2">
              <Image src={match.teamALogo} alt={match.teamA} width={20} height={20} className="h-5 w-5 object-contain"/>
              <span className="text-sm font-medium">{match.teamA}</span>
              <span className="text-sm font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-md">
                {match.scoreA} - {match.scoreB}
              </span>
              <span className="text-sm font-medium">{match.teamB}</span>
              <Image src={match.teamBLogo} alt={match.teamB} width={20} height={20} className="h-5 w-5 object-contain" />
            </div>
             <div className="ml-4 text-xs font-mono text-destructive flex items-center gap-1.5">
                {match.status === 'HT' ? (
                    <span>HALF TIME</span>
                ) : match.status === 'FT' ? (
                     <span>FULL TIME</span>
                ) : (
                    <>
                        <span>{match.elapsed}'</span>
                        <SoccerBall className="h-3 w-3 animate-spin" />
                    </>
                )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
