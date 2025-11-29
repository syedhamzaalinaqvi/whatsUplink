
'use server';

import { unstable_cache } from 'next/cache';

export type Match = {
  id: string;
  teamA: string;
  teamALogo: string;
  teamB: string;
  teamBLogo: string;
  scoreA: number | null;
  scoreB: number | null;
  status: string;
  elapsed: number | null;
  league: string;
  leagueLogo: string;
  timestamp: number;
};

// This function is cached to avoid hitting the API rate limit.
// It will only refetch data every 10 minutes.
export const getLiveScores = unstable_cache(
  async (): Promise<Match[]> => {
    const apiKey = process.env.RAPIDAPI_KEY;
    if (!apiKey) {
      console.error('RapidAPI key is not configured.');
      return [];
    }
    
    const fetchFixtures = async (params: string) => {
        try {
            const response = await fetch(
                `https://api-football-v1.p.rapidapi.com/v3/fixtures?${params}`,
                {
                    headers: {
                        'x-rapidapi-host': 'api-football-v1.p.rapidapi.com',
                        'x-rapidapi-key': apiKey,
                    },
                }
            );

            if (!response.ok) {
                console.error(`API request failed for params "${params}" with status: ${response.status}`);
                return [];
            }

            const data = await response.json();
            
            if (!data.response || data.response.length === 0) {
                return [];
            }
            
            const matches: Match[] = data.response.map((item: any) => ({
                id: item.fixture.id,
                teamA: item.teams.home.name,
                teamALogo: item.teams.home.logo,
                teamB: item.teams.away.name,
                teamBLogo: item.teams.away.logo,
                scoreA: item.goals.home,
                scoreB: item.goals.away,
                status: item.fixture.status.short,
                elapsed: item.fixture.status.elapsed,
                league: item.league.name,
                leagueLogo: item.league.logo,
                timestamp: item.fixture.timestamp
            }));
            
            return matches;

        } catch (error) {
            console.error(`Error fetching fixtures with params "${params}":`, error);
            return [];
        }
    }

    // 1. Try to get live matches first
    const liveMatches = await fetchFixtures('live=all');
    if (liveMatches.length > 0) {
        return liveMatches;
    }

    // 2. If no live matches, get today's upcoming matches
    const today = new Date().toISOString().split('T')[0];
    const upcomingMatches = await fetchFixtures(`date=${today}&status=NS`);
    if (upcomingMatches.length > 0) {
        return upcomingMatches.sort((a, b) => a.timestamp - b.timestamp); // Sort by soonest first
    }

    // 3. If no live or upcoming matches, return empty
    return [];
  },
  ['live-scores'], // cache key
  { revalidate: 600 } // revalidate every 10 minutes
);
