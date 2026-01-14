import { config } from 'dotenv';

// Garante que o .env.local seja lido
config({ path: '.env.local' });

import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'turso',       // <--- MUDANÇA 1: Mudamos de 'sqlite' para 'turso'
  // driver: 'turso',     // <--- MUDANÇA 2: Apague essa linha, não precisa mais
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  },
});