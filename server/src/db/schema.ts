import { serial, text, pgTable, timestamp, integer } from 'drizzle-orm/pg-core';

export const scoresTable = pgTable('scores', {
  id: serial('id').primaryKey(),
  player_name: text('player_name').notNull(),
  score: integer('score').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript types for the table schema
export type Score = typeof scoresTable.$inferSelect; // For SELECT operations
export type NewScore = typeof scoresTable.$inferInsert; // For INSERT operations

// Important: Export all tables for proper query building
export const tables = { scores: scoresTable };