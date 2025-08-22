import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { scoresTable } from '../db/schema';
import { type LeaderboardQuery } from '../schema';
import { getLeaderboard } from '../handlers/get_leaderboard';

// Test query inputs
const defaultQuery: LeaderboardQuery = {
  limit: 10
};

const customLimitQuery: LeaderboardQuery = {
  limit: 5
};

const maxLimitQuery: LeaderboardQuery = {
  limit: 100
};

describe('getLeaderboard', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no scores exist', async () => {
    const result = await getLeaderboard(defaultQuery);

    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return scores ordered by highest score first', async () => {
    // Create test scores with different values
    const testScores = [
      { player_name: 'Alice', score: 100 },
      { player_name: 'Bob', score: 250 },
      { player_name: 'Charlie', score: 150 },
      { player_name: 'David', score: 300 },
      { player_name: 'Eve', score: 200 }
    ];

    // Insert test data
    await db.insert(scoresTable).values(testScores).execute();

    const result = await getLeaderboard(defaultQuery);

    expect(result).toHaveLength(5);
    
    // Verify scores are in descending order
    expect(result[0].player_name).toEqual('David');
    expect(result[0].score).toEqual(300);
    expect(result[1].player_name).toEqual('Bob');
    expect(result[1].score).toEqual(250);
    expect(result[2].player_name).toEqual('Eve');
    expect(result[2].score).toEqual(200);
    expect(result[3].player_name).toEqual('Charlie');
    expect(result[3].score).toEqual(150);
    expect(result[4].player_name).toEqual('Alice');
    expect(result[4].score).toEqual(100);

    // Verify all scores are descending
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].score).toBeGreaterThanOrEqual(result[i].score);
    }
  });

  it('should respect the limit parameter', async () => {
    // Create more scores than the limit
    const testScores = Array.from({ length: 8 }, (_, i) => ({
      player_name: `Player${i + 1}`,
      score: (i + 1) * 10
    }));

    await db.insert(scoresTable).values(testScores).execute();

    const result = await getLeaderboard(customLimitQuery);

    expect(result).toHaveLength(5);
    expect(result.every(score => typeof score.score === 'number')).toBe(true);
    
    // Verify it returns the top 5 scores
    expect(result[0].score).toEqual(80);
    expect(result[1].score).toEqual(70);
    expect(result[2].score).toEqual(60);
    expect(result[3].score).toEqual(50);
    expect(result[4].score).toEqual(40);
  });

  it('should handle default limit correctly', async () => {
    // Create exactly 10 scores
    const testScores = Array.from({ length: 10 }, (_, i) => ({
      player_name: `Player${i + 1}`,
      score: (i + 1) * 5
    }));

    await db.insert(scoresTable).values(testScores).execute();

    const result = await getLeaderboard(defaultQuery);

    expect(result).toHaveLength(10);
    expect(result[0].score).toEqual(50);
    expect(result[9].score).toEqual(5);
  });

  it('should handle maximum limit boundary', async () => {
    // Create more than 100 scores
    const testScores = Array.from({ length: 150 }, (_, i) => ({
      player_name: `Player${i + 1}`,
      score: Math.floor(Math.random() * 1000)
    }));

    await db.insert(scoresTable).values(testScores).execute();

    const result = await getLeaderboard(maxLimitQuery);

    expect(result).toHaveLength(100);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all required score fields', async () => {
    const testScore = {
      player_name: 'TestPlayer',
      score: 500
    };

    await db.insert(scoresTable).values([testScore]).execute();

    const result = await getLeaderboard(defaultQuery);

    expect(result).toHaveLength(1);
    const score = result[0];
    
    expect(score.id).toBeDefined();
    expect(typeof score.id).toBe('number');
    expect(score.player_name).toEqual('TestPlayer');
    expect(score.score).toEqual(500);
    expect(typeof score.score).toBe('number');
    expect(score.created_at).toBeInstanceOf(Date);
  });

  it('should handle tied scores consistently', async () => {
    // Create scores with same values
    const testScores = [
      { player_name: 'Player1', score: 100 },
      { player_name: 'Player2', score: 200 },
      { player_name: 'Player3', score: 200 },
      { player_name: 'Player4', score: 100 },
      { player_name: 'Player5', score: 300 }
    ];

    await db.insert(scoresTable).values(testScores).execute();

    const result = await getLeaderboard(defaultQuery);

    expect(result).toHaveLength(5);
    
    // Verify highest score comes first
    expect(result[0].score).toEqual(300);
    
    // Verify tied scores maintain order (200s before 100s)
    const scores = result.map(r => r.score);
    expect(scores).toEqual([300, 200, 200, 100, 100]);
  });

  it('should fetch fewer results than limit when not enough scores exist', async () => {
    // Create only 3 scores but request 10
    const testScores = [
      { player_name: 'Alice', score: 100 },
      { player_name: 'Bob', score: 200 },
      { player_name: 'Charlie', score: 150 }
    ];

    await db.insert(scoresTable).values(testScores).execute();

    const result = await getLeaderboard(defaultQuery);

    expect(result).toHaveLength(3);
    expect(result[0].score).toEqual(200);
    expect(result[1].score).toEqual(150);
    expect(result[2].score).toEqual(100);
  });
});