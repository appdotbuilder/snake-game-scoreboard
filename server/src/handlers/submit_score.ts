import { db } from '../db';
import { scoresTable } from '../db/schema';
import { type SubmitScoreInput, type Score } from '../schema';

export const submitScore = async (input: SubmitScoreInput): Promise<Score> => {
  try {
    // Insert score record
    const result = await db.insert(scoresTable)
      .values({
        player_name: input.player_name,
        score: input.score
      })
      .returning()
      .execute();

    // Return the created score (no numeric conversion needed for integer columns)
    return result[0];
  } catch (error) {
    console.error('Score submission failed:', error);
    throw error;
  }
};