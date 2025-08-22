import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { scoresTable } from '../db/schema';
import { type SubmitScoreInput } from '../schema';
import { submitScore } from '../handlers/submit_score';
import { eq, desc } from 'drizzle-orm';

// Simple test input
const testInput: SubmitScoreInput = {
  player_name: 'TestPlayer',
  score: 1500
};

describe('submitScore', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should submit a score', async () => {
    const result = await submitScore(testInput);

    // Basic field validation
    expect(result.player_name).toEqual('TestPlayer');
    expect(result.score).toEqual(1500);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save score to database', async () => {
    const result = await submitScore(testInput);

    // Query using proper drizzle syntax
    const scores = await db.select()
      .from(scoresTable)
      .where(eq(scoresTable.id, result.id))
      .execute();

    expect(scores).toHaveLength(1);
    expect(scores[0].player_name).toEqual('TestPlayer');
    expect(scores[0].score).toEqual(1500);
    expect(scores[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle zero score', async () => {
    const zeroScoreInput: SubmitScoreInput = {
      player_name: 'ZeroPlayer',
      score: 0
    };

    const result = await submitScore(zeroScoreInput);

    expect(result.player_name).toEqual('ZeroPlayer');
    expect(result.score).toEqual(0);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify in database
    const scores = await db.select()
      .from(scoresTable)
      .where(eq(scoresTable.id, result.id))
      .execute();

    expect(scores[0].score).toEqual(0);
  });

  it('should handle large score values', async () => {
    const largeScoreInput: SubmitScoreInput = {
      player_name: 'HighScorer',
      score: 999999
    };

    const result = await submitScore(largeScoreInput);

    expect(result.player_name).toEqual('HighScorer');
    expect(result.score).toEqual(999999);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should handle multiple submissions correctly', async () => {
    // Submit first score
    const firstResult = await submitScore({
      player_name: 'Player1',
      score: 100
    });

    // Submit second score
    const secondResult = await submitScore({
      player_name: 'Player2',
      score: 200
    });

    // Verify both have unique IDs
    expect(firstResult.id).not.toEqual(secondResult.id);
    expect(firstResult.id).toBeGreaterThan(0);
    expect(secondResult.id).toBeGreaterThan(0);

    // Verify both are in database
    const allScores = await db.select()
      .from(scoresTable)
      .orderBy(desc(scoresTable.created_at))
      .execute();

    expect(allScores).toHaveLength(2);
    expect(allScores.some(s => s.player_name === 'Player1' && s.score === 100)).toBe(true);
    expect(allScores.some(s => s.player_name === 'Player2' && s.score === 200)).toBe(true);
  });

  it('should allow same player to submit multiple scores', async () => {
    const samPlayerInput: SubmitScoreInput = {
      player_name: 'RepeatPlayer',
      score: 500
    };

    // Submit first score
    const firstScore = await submitScore(samPlayerInput);
    
    // Submit second score for same player
    const secondScore = await submitScore({
      ...samPlayerInput,
      score: 750
    });

    // Should have different IDs but same player name
    expect(firstScore.id).not.toEqual(secondScore.id);
    expect(firstScore.player_name).toEqual('RepeatPlayer');
    expect(secondScore.player_name).toEqual('RepeatPlayer');
    expect(firstScore.score).toEqual(500);
    expect(secondScore.score).toEqual(750);

    // Verify both records exist in database
    const playerScores = await db.select()
      .from(scoresTable)
      .where(eq(scoresTable.player_name, 'RepeatPlayer'))
      .execute();

    expect(playerScores).toHaveLength(2);
  });
});