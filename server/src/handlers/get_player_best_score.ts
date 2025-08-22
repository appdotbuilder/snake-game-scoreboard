import { db } from '../db';
import { scoresTable } from '../db/schema';
import { type Score } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const getPlayerBestScore = async (playerName: string): Promise<Score | null> => {
  try {
    const result = await db.select()
      .from(scoresTable)
      .where(eq(scoresTable.player_name, playerName))
      .orderBy(desc(scoresTable.score))
      .limit(1)
      .execute();

    if (result.length === 0) {
      return null;
    }

    return result[0];
  } catch (error) {
    console.error('Failed to get player best score:', error);
    throw error;
  }
};