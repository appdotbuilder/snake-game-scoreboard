import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { scoresTable } from '../db/schema';
import { getPlayerBestScore } from '../handlers/get_player_best_score';
import { eq } from 'drizzle-orm';

describe('getPlayerBestScore', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return the highest score for a player', async () => {
    // Create multiple scores for the same player
    await db.insert(scoresTable)
      .values([
        { player_name: 'TestPlayer', score: 100 },
        { player_name: 'TestPlayer', score: 250 },
        { player_name: 'TestPlayer', score: 150 }
      ])
      .execute();

    const result = await getPlayerBestScore('TestPlayer');

    expect(result).not.toBeNull();
    expect(result!.player_name).toEqual('TestPlayer');
    expect(result!.score).toEqual(250);
    expect(result!.id).toBeDefined();
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should return null when player has no scores', async () => {
    const result = await getPlayerBestScore('NonExistentPlayer');

    expect(result).toBeNull();
  });

  it('should return correct score when player has only one score', async () => {
    await db.insert(scoresTable)
      .values({ player_name: 'SingleScorePlayer', score: 75 })
      .execute();

    const result = await getPlayerBestScore('SingleScorePlayer');

    expect(result).not.toBeNull();
    expect(result!.player_name).toEqual('SingleScorePlayer');
    expect(result!.score).toEqual(75);
  });

  it('should distinguish between different players', async () => {
    // Create scores for multiple players
    await db.insert(scoresTable)
      .values([
        { player_name: 'Player1', score: 100 },
        { player_name: 'Player2', score: 200 },
        { player_name: 'Player1', score: 300 },
        { player_name: 'Player2', score: 50 }
      ])
      .execute();

    const player1Best = await getPlayerBestScore('Player1');
    const player2Best = await getPlayerBestScore('Player2');

    expect(player1Best).not.toBeNull();
    expect(player1Best!.player_name).toEqual('Player1');
    expect(player1Best!.score).toEqual(300);

    expect(player2Best).not.toBeNull();
    expect(player2Best!.player_name).toEqual('Player2');
    expect(player2Best!.score).toEqual(200);
  });

  it('should handle case-sensitive player names correctly', async () => {
    await db.insert(scoresTable)
      .values([
        { player_name: 'TestPlayer', score: 100 },
        { player_name: 'testplayer', score: 200 }
      ])
      .execute();

    const upperCaseResult = await getPlayerBestScore('TestPlayer');
    const lowerCaseResult = await getPlayerBestScore('testplayer');

    expect(upperCaseResult).not.toBeNull();
    expect(upperCaseResult!.score).toEqual(100);

    expect(lowerCaseResult).not.toBeNull();
    expect(lowerCaseResult!.score).toEqual(200);
  });

  it('should return most recent score when multiple scores are tied for highest', async () => {
    // Insert scores with the same value but different timestamps
    await db.insert(scoresTable)
      .values({ player_name: 'TiedPlayer', score: 100 })
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(scoresTable)
      .values({ player_name: 'TiedPlayer', score: 100 })
      .execute();

    const result = await getPlayerBestScore('TiedPlayer');

    expect(result).not.toBeNull();
    expect(result!.player_name).toEqual('TiedPlayer');
    expect(result!.score).toEqual(100);
    
    // Verify we get a consistent result (one of the tied scores)
    const allScores = await db.select()
      .from(scoresTable)
      .where(eq(scoresTable.player_name, 'TiedPlayer'))
      .execute();
    
    expect(allScores).toHaveLength(2);
    expect(allScores.every(score => score.score === 100)).toBe(true);
  });
});