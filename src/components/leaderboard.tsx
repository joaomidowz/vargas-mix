// src/components/leaderboard.tsx
import { db } from "@/lib/db";
import { players } from "@/db/schema";
import { desc, sql } from "drizzle-orm";

export async function Leaderboard() {
  // Busca TODOS os jogadores que tenham jogado pelo menos 1 partida
  const allPlayers = await db.select().from(players).orderBy(desc(players.wins));
  
  // Filtra apenas quem jogou
  const activePlayers = allPlayers.filter(p => (p.matchesPlayed || 0) > 0);

  // Ordena por Winrate (Aproveitamento) para ser mais justo, ou por Vitórias.
  // Vamos ordenar por Vitórias primeiro, e Winrate como desempate.
  activePlayers.sort((a, b) => {
      if ((a.wins || 0) !== (b.wins || 0)) return (b.wins || 0) - (a.wins || 0); // Quem tem mais wins
      // Calculo de winrate para desempate
      const totalA = (a.wins || 0) + (a.losses || 0);
      const wrA = totalA > 0 ? (a.wins || 0) / totalA : 0;
      const totalB = (b.wins || 0) + (b.losses || 0);
      const wrB = totalB > 0 ? (b.wins || 0) / totalB : 0;
      return wrB - wrA;
  });

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col h-full max-h-[500px]">
      <div className="p-4 bg-zinc-950/50 border-b border-zinc-800 flex items-center justify-between shrink-0">
         <div className="flex items-center gap-2">
            <span className="text-2xl">📊</span>
            <div>
                <h3 className="font-black italic text-white text-lg uppercase leading-none">Classificação Geral</h3>
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Season Atual</span>
            </div>
         </div>
      </div>

      {/* CABEÇALHO DA TABELA */}
      <div className="grid grid-cols-12 px-4 py-2 text-[9px] uppercase font-bold text-zinc-500 tracking-wider bg-zinc-950/30 border-b border-zinc-800 shrink-0">
          <div className="col-span-1 text-center">#</div>
          <div className="col-span-4">Operador</div>
          <div className="col-span-2 text-center">Jogos</div>
          <div className="col-span-2 text-center">V / D</div>
          <div className="col-span-2 text-right">Winrate</div>
          <div className="col-span-1 text-center">🔥</div>
      </div>

      {/* LISTA COM SCROLL */}
      <div className="overflow-y-auto custom-scrollbar">
          {activePlayers.map((p, i) => {
             const total = (p.wins || 0) + (p.losses || 0);
             const winrate = total > 0 ? Math.round(((p.wins || 0) / total) * 100) : 0;
             
             // Cores do Winrate
             let wrColor = "text-zinc-400";
             if (winrate >= 60) wrColor = "text-green-400";
             if (winrate >= 80) wrColor = "text-green-300 font-bold shadow-green-500/50";
             if (winrate <= 40) wrColor = "text-red-400";
             if (winrate <= 20) wrColor = "text-red-600";

             const isVargas = p.name.toLowerCase().includes('vargas') || p.name.toLowerCase().includes('vargão');

             return (
                 <div key={p.id} className={`grid grid-cols-12 px-4 py-2 text-xs items-center border-b border-zinc-800/50 hover:bg-zinc-800/40 transition ${isVargas ? 'bg-yellow-500/5' : ''}`}>
                     
                     {/* Posição */}
                     <div className="col-span-1 text-center font-mono">
                        {i === 0 && '🥇'}
                        {i === 1 && '🥈'}
                        {i === 2 && '🥉'}
                        {i > 2 && <span className="text-zinc-600">#{i+1}</span>}
                     </div>

                     {/* Nome */}
                     <div className="col-span-4 truncate font-medium flex items-center gap-1">
                         <span className={isVargas ? 'text-yellow-500' : 'text-zinc-300'}>{p.name}</span>
                         {p.isSub && !isVargas && <span className="text-[9px]" title="Sub">⭐</span>}
                     </div>

                     {/* Jogos Totais */}
                     <div className="col-span-2 text-center text-zinc-500 font-mono">
                         {p.matchesPlayed}
                     </div>

                     {/* V / D */}
                     <div className="col-span-2 text-center font-mono tracking-tighter">
                         <span className="text-green-500 font-bold">{p.wins}</span>
                         <span className="text-zinc-600 mx-1">/</span>
                         <span className="text-red-500">{p.losses}</span>
                     </div>

                     {/* Winrate */}
                     <div className={`col-span-2 text-right font-mono ${wrColor}`}>
                         {winrate}%
                     </div>

                     {/* Streak */}
                     <div className="col-span-1 text-center text-[10px]">
                         {(p.currentStreak || 0) >= 2 ? (
                            <span className="animate-pulse">🔥{p.currentStreak}</span>
                         ) : (
                            <span className="text-zinc-700">-</span>
                         )}
                     </div>
                 </div>
             )
          })}
          
          {activePlayers.length === 0 && (
              <div className="p-8 text-center text-zinc-600 text-sm">
                  Nenhuma partida registrada na season ainda.
              </div>
          )}
      </div>
    </div>
  )
}