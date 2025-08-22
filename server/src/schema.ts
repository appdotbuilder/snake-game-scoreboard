import { z } from 'zod';

// Score schema for database records
export const scoreSchema = z.object({
  id: z.number(),
  player_name: z.string(),
  score: z.number().int().nonnegative(),
  created_at: z.coerce.date()
});

export type Score = z.infer<typeof scoreSchema>;

// Input schema for submitting new scores
export const submitScoreInputSchema = z.object({
  player_name: z.string().min(1, "Player name is required").max(50, "Player name must be 50 characters or less"),
  score: z.number().int().nonnegative().min(0, "Score must be non-negative")
});

export type SubmitScoreInput = z.infer<typeof submitScoreInputSchema>;

// Query parameters for leaderboard
export const leaderboardQuerySchema = z.object({
  limit: z.number().int().positive().max(100).optional().default(10)
});

export type LeaderboardQuery = z.infer<typeof leaderboardQuerySchema>;