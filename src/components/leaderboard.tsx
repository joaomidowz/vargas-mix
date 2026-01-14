// src/components/leaderboard.tsx
import { db } from "@/lib/db";
import { players } from "@/db/schema";
import { desc, sql } from "drizzle-orm";

export async function Leaderboard() {
  // Pega top 10 por vitórias
  const topPlayers = await db.select().from(players).orderBy(desc(players.wins)).limit(10);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="p-4 bg-zinc-950/50 border-b border-zinc-800 flex items-center justify-between">
         <h3 className="font-black italic text-yellow-500 text-lg uppercase">🏆 Hall da Fama</h3>
         <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Top 10 Vencedores</span>
      </div>
      <div className="divide-y divide-zinc-800">
          <div className="grid grid-cols-4 px-4 py-2 text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
              <div className="col-span-2">Jogador</div>
              <div className="text-center">V / D</div>
              <div className="text-right">Winrate</div>
          </div>
          {topPlayers.map((p, i) => {
             const total = (p.wins || 0) + (p.losses || 0);
             const winrate = total > 0 ? Math.round(((p.wins || 0) / total) * 100) : 0;
             const isOnFire = (p.currentStreak || 0) >= 2;

             return (
                 <div key={p.id} className="grid grid-cols-4 px-4 py-3 text-sm items-center hover:bg-zinc-800/50 transition">
                     <div className="col-span-2 flex items-center gap-3">
                         <span className={`font-mono text-xs w-4 ${i < 3 ? 'text-yellow-500 font-bold' : 'text-zinc-600'}`}>#{i+1}</span>
                         <span className={`font-medium ${i===0 ? 'text-yellow-400' : 'text-zinc-300'}`}>
                             {p.name}
                             {isOnFire && <span className="ml-2 text-xs animate-pulse" title={`${p.currentStreak} vitorias seguidas`}>🔥 {p.currentStreak}</span>}
                         </span>
                     </div>
                     <div className="text-center font-mono text-xs text-zinc-400">
                         <span className="text-green-400">{p.wins}</span> - <span className="text-red-400">{p.losses}</span>
                     </div>
                     <div className="text-right font-mono font-bold text-zinc-300">
                         {winrate}%
                     </div>
                 </div>
             )
          })}
      </div>
    </div>
  )
}