// src/components/match-history.tsx
import { db } from "@/lib/db";
import { matches } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function MatchHistory() {
  // Busca as últimas 10 partidas
  const history = await db.select().from(matches).orderBy(desc(matches.date)).limit(10);

  if (history.length === 0) return null;

  return (
    <div className="w-full space-y-4">
      <h2 className="text-2xl font-black text-zinc-500 uppercase tracking-widest border-b border-zinc-800 pb-2">
        Histórico de Confrontos
      </h2>

      <div className="grid gap-3">
        {history.map((match) => {
          const isTeam1Win = (match.score1 || 0) > (match.score2 || 0);
          
          return (
            <div key={match.id} className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-4 flex flex-col md:flex-row items-center justify-between gap-4 hover:border-zinc-700 transition">
              
              {/* Data e Mapa */}
              <div className="flex flex-col items-center md:items-start min-w-[100px]">
                <span className="text-xs text-zinc-500 font-mono">
                    {new Date(match.date!).toLocaleDateString('pt-BR')}
                </span>
                <span className="text-sm font-bold text-zinc-300 uppercase bg-zinc-800 px-2 rounded">
                    {match.mapName || 'Indefinido'}
                </span>
              </div>

              {/* Placar */}
              <div className="flex items-center gap-6 flex-1 justify-center">
                
                {/* Time 1 */}
                <div className={`text-right flex-1 ${isTeam1Win ? 'opacity-100' : 'opacity-60'}`}>
                    <div className={`font-black text-lg ${match.team1Name?.includes('VARGÃO') ? 'text-yellow-500' : 'text-blue-400'}`}>
                        {match.team1Name}
                    </div>
                    <div className="text-[10px] text-zinc-500 truncate max-w-[150px] ml-auto">
                        {match.roster1}
                    </div>
                </div>

                {/* Score Box */}
                <div className="bg-black/50 px-4 py-2 rounded border border-zinc-700 font-mono text-2xl font-bold text-white tracking-widest">
                    {match.score1} : {match.score2}
                </div>

                {/* Time 2 */}
                <div className={`text-left flex-1 ${!isTeam1Win ? 'opacity-100' : 'opacity-60'}`}>
                    <div className={`font-black text-lg ${match.team2Name?.includes('VARGÃO') ? 'text-yellow-500' : 'text-white'}`}>
                        {match.team2Name}
                    </div>
                    <div className="text-[10px] text-zinc-500 truncate max-w-[150px]">
                        {match.roster2}
                    </div>
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}