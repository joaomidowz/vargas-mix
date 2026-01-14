// Arquivo: src/db/schema.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Tabela de Jogadores
export const players = sqliteTable('players', {
  id: text('id').primaryKey(), // Vamos usar UUID gerado no front
  name: text('name').notNull(),
  rating: integer('rating').default(3), // 1 a 5 (opcional)
  matchesPlayed: integer('matches_played').default(0),
  lastPlayed: text('last_played'), // Data ISO (ex: 2023-10-05T10:00:00)
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Tabela de Histórico (Quem jogou contra quem)
export const matches = sqliteTable('matches', {
  id: text('id').primaryKey(),
  date: text('date').default(sql`CURRENT_TIMESTAMP`),
  mapName: text('map_name'),
  // Aqui guardamos um JSON string com os times (ex: {timeA: [...], timeB: [...]})
  teamsData: text('teams_data').notNull(), 
});

export const maps = sqliteTable('maps', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  imageUrl: text('image_url').notNull(), // <--- Campo novo obrigatório
});