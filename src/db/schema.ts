// src/db/schema.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const players = sqliteTable('players', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  rating: integer('rating').default(3),
  matchesPlayed: integer('matches_played').default(0),
  lastPlayed: text('last_played'),
  wins: integer('wins').default(0),
  losses: integer('losses').default(0),
  currentStreak: integer('current_streak').default(0),
  
  // NOVA COLUNA VIP
  isSub: integer('is_sub', { mode: 'boolean' }).default(false),

  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// ... (resto do arquivo matches e maps continua igual)
export const maps = sqliteTable('maps', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  imageUrl: text('image_url').notNull(),
});

export const matches = sqliteTable('matches', {
  id: text('id').primaryKey(),
  date: text('date').default(sql`CURRENT_TIMESTAMP`),
  mapName: text('map_name'),
  team1Name: text('team1_name'),  
  team2Name: text('team2_name'),  
  score1: integer('score1'),      
  score2: integer('score2'),      
  roster1: text('roster1'), 
  roster2: text('roster2'),
});

export const tournamentState = sqliteTable("tournament_state", {
  id: integer("id").primaryKey(), // Sempre será 1
  data: text("data"), // Aqui vai o JSON com times, bracket, placar, etc
  updatedAt: text("updated_at"),
});