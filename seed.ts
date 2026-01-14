// Arquivo: seed.ts
import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { maps } from './src/db/schema';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const db = drizzle(client);

async function main() {
  console.log('Atualizando mapas para imagens locais...');
  
  // Agora usamos caminhos que começam com / (raiz do diretório public)
  // Certifique-se que os nomes dos arquivos batem com os que você salvou!
  const cs2Maps = [
    { id: 'mirage', name: 'Mirage', imageUrl: '/maps/mirage.jpg' },
    { id: 'inferno', name: 'Inferno', imageUrl: '/maps/inferno.jpg' },
    { id: 'nuke', name: 'Nuke', imageUrl: '/maps/nuke.jpg' },
    { id: 'overpass', name: 'Overpass', imageUrl: '/maps/overpass.jpg' },
    { id: 'ancient', name: 'Ancient', imageUrl: '/maps/ancient.jpg' },
    { id: 'anubis', name: 'Anubis', imageUrl: '/maps/anubis.jpg' },
    { id: 'dust2', name: 'Dust II', imageUrl: '/maps/dust2.jpg' },
  ];

  await db.delete(maps); 
  
  for (const map of cs2Maps) {
    await db.insert(maps).values(map).onConflictDoUpdate({
        target: maps.id,
        set: { imageUrl: map.imageUrl }
    });
  }
  
  console.log('✅ Mapas atualizados com caminhos locais!');
}

main().catch((err) => { console.error(err); process.exit(1); });