
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

    try {
      const response = await fetch(
        'https://api-football-v1.p.rapidapi.com/v3/fixtures?live=all',
        {
          headers: {
            'x-rapidapi-host': 'api-football-v1.p.rapidapi.com',
            'x-rapidapi-key': apiKey,
          },
        }
      );

      if (!response.ok) {
        console.error(`API request failed with status: ${response.status}`);
        return [];
      }

      const data = await response.json();
      
      if (!data.response || data.response.length === 0) {
        return [];
      }

      // Map the API response to our simplified Match type
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
        leagueLogo: item.league.logo
      }));

      return matches;

    } catch (error) {
      console.error('Error fetching live scores:', error);
      return [];
    }
  },
  ['live-scores'], // cache key
  { revalidate: 600 } // revalidate every 10 minutes
);
