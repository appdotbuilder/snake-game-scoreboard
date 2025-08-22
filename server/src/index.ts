import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas and handlers
import { submitScoreInputSchema, leaderboardQuerySchema } from './schema';
import { submitScore } from './handlers/submit_score';
import { getLeaderboard } from './handlers/get_leaderboard';
import { getPlayerBestScore } from './handlers/get_player_best_score';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Submit a new score to the leaderboard
  submitScore: publicProcedure
    .input(submitScoreInputSchema)
    .mutation(({ input }) => submitScore(input)),
  
  // Get the leaderboard with optional limit
  getLeaderboard: publicProcedure
    .input(leaderboardQuerySchema)
    .query(({ input }) => getLeaderboard(input)),
  
  // Get the best score for a specific player
  getPlayerBestScore: publicProcedure
    .input(z.string().min(1, "Player name is required"))
    .query(({ input }) => getPlayerBestScore(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`Snake Game Scoreboard TRPC server listening at port: ${port}`);
}

start();