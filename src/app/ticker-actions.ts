
'use server';

import { unstable_cache } from 'next/cache';

export type TickerItem = {
  id: string;
  type: 'sport' | 'news';
  data: Match | NewsArticle;
};

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

export type NewsArticle = {
  title: string;
  url: string;
  source: string;
};

const getNews = async (): Promise<NewsArticle[]> => {
    const apiKey = process.env.NEWS_API_KEY;
    if (!apiKey) {
      console.error('NewsAPI.org key is not configured.');
      return [];
    }

    // Fetching from a few reliable tech sources to ensure content is always available.
    const sources = 'techcrunch,the-verge,wired,ars-technica';
    const url = `https://newsapi.org/v2/top-headlines?sources=${sources}&apiKey=${apiKey}`;

    try {
        const response = await fetch(url, {
            // NewsAPI doesn't require extra headers, just the key in the URL.
        });

        if (!response.ok) {
            const errorBody = await response.json();
            console.error(`NewsAPI request failed with status: ${response.status}`, errorBody.message);
            return [];
        }

        const data = await response.json();
        if (!data.articles || data.articles.length === 0) {
            return [];
        }

        return data.articles.slice(0, 15).map((article: any) => ({
            title: article.title,
            url: article.url,
            source: article.source.name,
        }));

    } catch (error) {
        console.error('Error fetching news from NewsAPI.org:', error);
        return [];
    }
}

const getSportsFixtures = async (): Promise<Match[]> => {
    const apiKey = process.env.RAPIDAPI_KEY;
    if (!apiKey) {
      console.error('RapidAPI key is not configured for sports.');
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
                console.error(`Sports API request failed for params "${params}" with status: ${response.status}`);
                return [];
            }

            const data = await response.json();
            
            if (!data.response || data.response.length === 0) {
                return [];
            }
            
            return data.response.map((item: any) => ({
                id: String(item.fixture.id),
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

        } catch (error) {
            console.error(`Error fetching sports fixtures with params "${params}":`, error);
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
    
    // 3. If no live or upcoming, return empty
    return [];
}


// This function is cached to avoid hitting the API rate limit.
// It will only refetch data every 10 minutes.
export const getTickerData = unstable_cache(
  async (): Promise<TickerItem[]> => {
    
    const sportsData = await getSportsFixtures();
    if (sportsData.length > 0) {
        return sportsData.map(match => ({
            id: match.id,
            type: 'sport',
            data: match,
        }));
    }
    
    const newsData = await getNews();
    if (newsData.length > 0) {
        return newsData.map((article, index) => ({
            id: `news-${index}`,
            type: 'news',
            data: article,
        }));
    }

    return []; // Return empty if both fail
  },
  ['ticker-data'], // cache key
  { revalidate: 600 } // revalidate every 10 minutes
);

