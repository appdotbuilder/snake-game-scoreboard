import { db } from '../db';
import { scoresTable } from '../db/schema';
import { type Score, type LeaderboardQuery } from '../schema';
import { desc } from 'drizzle-orm';

export const getLeaderboard = async (query: LeaderboardQuery): Promise<Score[]> => {
  try {
    // Build query to get top scores ordered by score descending
    const results = await db.select()
      .from(scoresTable)
      .orderBy(desc(scoresTable.score))
      .limit(query.limit)
      .execute();

    // Return the results as-is since score is integer (no conversion needed)
    return results;
  } catch (error) {
    console.error('Leaderboard fetch failed:', error);
    throw error;
  }
};