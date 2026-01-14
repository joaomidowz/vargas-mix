// src/app/page.tsx
import { db } from "@/lib/db";
import { players, maps, matches } from "@/db/schema";
import { desc } from "drizzle-orm";
import { AddPlayerForm } from "@/components/add-player-form";
import { LobbyManager } from "@/components/lobby-manager";
import { MatchHistory } from "@/components/match-history";
import { Leaderboard } from "@/components/leaderboard";
import { MapStats } from "@/components/map-stats";
import { AdminPanel } from "@/components/admin-painel";
import { AuthGate } from "@/components/auth-gate"; // <--- IMPORT NOVO

export default async function Home() {
  const [allPlayers, allMaps, matchesHistory] = await Promise.all([
    db.select().from(players),
    db.select().from(maps),
    db.select().from(matches).orderBy(desc(matches.date)).limit(20)
  ]);

  return (
    // ENVELOPAMOS TUDO COM O AUTH GATE
    <AuthGate>
      <main className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* HEADER */}
          <div className="text-center space-y-2 pb-6 border-b border-zinc-800">
            <h1 className="text-5xl md:text-6xl font-black text-yellow-500 tracking-tighter italic transform -skew-x-12">
              VARGAS <span className="text-white">MIX</span>
            </h1>
            <p className="text-zinc-500 font-mono text-sm uppercase tracking-widest">
              MANAGER SYSTEM V2.0
            </p>
          </div>

          {/* ADICIONAR PLAYER */}
          <div className="bg-zinc-900/80 p-4 rounded-xl border border-zinc-800 shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                  <div className="bg-green-500/10 p-2 rounded-full text-green-500">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  </div>
                  <h2 className="font-bold text-zinc-300">Novo Operador</h2>
              </div>
              <AddPlayerForm />
          </div>

          {/* LOBBY MANAGER */}
          <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800 min-h-[300px]">
              <LobbyManager allPlayers={allPlayers} allMaps={allMaps} />
          </div>

          {/* ESTATÍSTICAS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t border-zinc-900">
              <Leaderboard />
              <MapStats />
          </div>

          {/* SEÇÃO FINAL: HISTÓRICO */}
        <div className="pt-8 border-t border-zinc-900">
          <MatchHistory />
        </div>

          {/* ADMIN */}
          <div className="pt-12 pb-4 border-t border-zinc-900 flex flex-col items-center gap-4">
              <p className="text-zinc-600 text-xs text-center">
                  Vargas Mix System © 2024 - Feito para a Elite
              </p>
              <AdminPanel />
          </div>

        </div>
      </main>
    </AuthGate>
  );
}