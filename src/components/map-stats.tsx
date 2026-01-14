// src/components/map-stats.tsx
import { db } from "@/lib/db";
import { matches, maps } from "@/db/schema";
import { sql, eq } from "drizzle-orm";

export async function MapStats() {
  // Agrupa partidas por mapa e conta
  const stats = await db
    .select({
        mapName: matches.mapName,
        count: sql<number>`count(*)`
    })
    .from(matches)
    .groupBy(matches.mapName)
    .orderBy(sql`count(*) desc`);
  
  // Pega imagens dos mapas
  const allMaps = await db.select().from(maps);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden h-full">
       <div className="p-4 bg-zinc-950/50 border-b border-zinc-800">
         <h3 className="font-black italic text-blue-400 text-lg uppercase">🗺️ Mapas Mais Jogados</h3>
       </div>
       <div className="p-4 space-y-3">
          {stats.map((stat, i) => {
              const mapInfo = allMaps.find(m => m.name === stat.mapName);
              if (!stat.mapName) return null;
              
              // Barra de progresso visual (baseado no top 1)
              const max = stats[0].count;
              const percent = (stat.count / max) * 100;

              return (
                  <div key={i} className="group relative h-12 rounded-lg overflow-hidden border border-zinc-800">
                      {/* Background Image com Opacidade */}
                      {mapInfo?.imageUrl && (
                          <div 
                            className="absolute inset-0 bg-cover bg-center opacity-20 group-hover:opacity-40 transition"
                            style={{ backgroundImage: `url(${mapInfo.imageUrl})` }}
                          />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-transparent" />
                      
                      <div className="relative z-10 flex items-center justify-between px-4 h-full">
                          <span className="font-black italic text-zinc-200 uppercase text-lg shadow-black drop-shadow-md">{stat.mapName}</span>
                          <div className="flex items-center gap-2">
                              <span className="text-xs text-zinc-500 font-mono">PARTIDAS</span>
                              <span className="text-xl font-bold text-white">{stat.count}</span>
                          </div>
                      </div>
                  </div>
              )
          })}
          {stats.length === 0 && <div className="text-center py-8 text-zinc-600 text-sm">Nenhum mapa registrado ainda.</div>}
       </div>
    </div>
  )
}