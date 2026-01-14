// src/db/schema.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const players = sqliteTable('players', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  rating: integer('rating').default(3),
  matchesPlayed: integer('matches_played').default(0),
  lastPlayed: text('last_played'), // Data ISO
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const maps = sqliteTable('maps', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  imageUrl: text('image_url').notNull(),
});

// NOVA TABELA DE PARTIDAS
export const matches = sqliteTable('matches', {
  id: text('id').primaryKey(),
  date: text('date').default(sql`CURRENT_TIMESTAMP`),
  mapName: text('map_name'),      // Ex: "Mirage"
  team1Name: text('team1_name'),  // Ex: "Panela do Vargão"
  team2Name: text('team2_name'),  // Ex: "Time B"
  score1: integer('score1'),      // Ex: 13
  score2: integer('score2'),      // Ex: 11
  // Guardamos os nomes dos jogadores como JSON string para histórico rápido
  // Ex: "Fallen, Fer, Cold..."
  roster1: text('roster1'), 
  roster2: text('roster2'),
});