// src/app/page.tsx
import { db } from "@/lib/db";
import { players, maps, matches } from "@/db/schema";
import { desc } from "drizzle-orm";
import { MatchHistory } from "@/components/match-history";
import { Leaderboard } from "@/components/leaderboard";
import { MapStats } from "@/components/map-stats";
import Link from "next/link";
import { getTournamentStateAction } from "@/app/actions";
import { TournamentViewer } from "@/components/tournament-viewer";

export default async function PublicPage() {
  const [allPlayers, allMaps, tournamentState] = await Promise.all([
    db.select().from(players),
    db.select().from(maps),
    getTournamentStateAction()
  ]);

  const transformedPlayers = allPlayers
    .filter(player => player.rating !== null)
    .map(player => ({
      ...player,
      rating: player.rating ?? 0,
      matchesPlayed: player.matchesPlayed ?? 0,
      wins: player.wins ?? 0,
      losses: player.losses ?? 0,
      currentStreak: player.currentStreak ?? 0,
      isSub: player.isSub ?? undefined
    }));

  // Lógica para extrair TODOS os próximos jogos
  let nextMatchesInfo = [];
  if (tournamentState) {
    try {
      const parsedState = JSON.parse(tournamentState);
      if (parsedState.schedule && parsedState.schedule.length > 0) {
        const activeIndex = parsedState.activeMatchIndex;
        if (activeIndex < parsedState.schedule.length) {
          // Pega do próximo jogo até o final (sem limite)
          nextMatchesInfo = parsedState.schedule.slice(activeIndex + 1);
        }
      }
    } catch (e) { console.error(e); }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* HEADER */}
        <div className="flex justify-between items-end border-b border-zinc-800 pb-6">
          <div>
            <h1 className="text-5xl md:text-6xl font-black text-yellow-500 tracking-tighter italic transform -skew-x-12">
              VARGAS <span className="text-white">MIX</span>
            </h1>
            <p className="text-zinc-500 font-mono text-sm uppercase tracking-widest mt-2">Central de Jogos - Ao Vivo</p>
          </div>
          <Link href="/admin" className="group flex items-center gap-2 text-xs font-bold bg-zinc-900 text-zinc-500 px-4 py-2 rounded-full border border-zinc-800 hover:border-yellow-500 hover:text-yellow-500 transition">
            <span>Área do Vargão</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LOBBY EM MODO SOMENTE LEITURA */}
          <div className="lg:col-span-2 bg-zinc-900/30 p-6 rounded-xl border border-zinc-800 shadow-2xl min-h-[400px]">
            <TournamentViewer allMaps={allMaps} />
          </div>

          {/* COLUNA LATERAL - NA SEQUÊNCIA */}
          <div className="space-y-6">
            <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800 h-full flex flex-col">
              <h3 className="text-zinc-400 text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2 shrink-0">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span> Na Sequência
              </h3>

              {/* Lista com scroll caso tenha muitos jogos */}
              <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                {nextMatchesInfo.length > 0 ? (
                  nextMatchesInfo.map((match: any, idx: number) => (
                    <div key={idx} className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 hover:border-zinc-700 transition flex flex-col gap-3 shadow-sm">
                      <div className="flex justify-between text-[10px] text-zinc-500 font-mono border-b border-zinc-800/50 pb-2">
                        <span className="bg-zinc-900 px-2 py-0.5 rounded text-zinc-400">JOGO {match.round}</span>
                        <span className="text-blue-500 font-bold tracking-wider">EM BREVE</span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-bold text-zinc-300">
                        <span className={`truncate max-w-[40%] ${match.team1Name.includes('VENCEDOR') ? 'text-zinc-600 italic font-normal' : ''}`}>
                          {match.team1Name}
                        </span>
                        <span className="text-zinc-700 text-xs px-2">vs</span>
                        <span className={`truncate max-w-[40%] text-right ${match.team2Name.includes('VENCEDOR') ? 'text-zinc-600 italic font-normal' : ''}`}>
                          {match.team2Name}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 text-zinc-600 space-y-2">
                    <span className="text-3xl grayscale opacity-20">📭</span>
                    <p className="text-xs">Nenhum jogo na fila.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* ESTATÍSTICAS E HISTÓRICO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t border-zinc-900">
          <Leaderboard />
          <MapStats />
        </div>

        <div className="pt-8 border-t border-zinc-900">
          <MatchHistory />
        </div>

        <div className="pt-12 pb-4 border-t border-zinc-900 flex flex-col items-center gap-4">
          <p className="text-zinc-600 text-xs text-center">
            Vargas Mix System © 2026 - by Midowz
          </p>
        </div>
      </div>
    </main>
  );
}