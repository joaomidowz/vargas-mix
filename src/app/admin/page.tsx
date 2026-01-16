import { db } from "@/lib/db";
import { players, maps, matches } from "@/db/schema";
import { desc } from "drizzle-orm";
import { AddPlayerForm } from "@/components/add-player-form";
import { LobbyManager } from "@/components/lobby-manager";
import { MatchHistory } from "@/components/match-history";
import { Leaderboard } from "@/components/leaderboard";
import { MapStats } from "@/components/map-stats";
import { AdminPanel } from "@/components/admin-painel";
import { AuthGate } from "@/components/auth-gate";
import Link from "next/link";
import { getTournamentStateAction } from "@/app/actions"; // <--- 1. IMPORT NECESSÁRIO
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminPage() {
    // 2. BUSCAR DADOS DO BANCO (Incluindo o save do torneio)
    const [allPlayers, allMaps, matchesHistory, tournamentState] = await Promise.all([
        db.select().from(players),
        db.select().from(maps),
        db.select().from(matches).orderBy(desc(matches.date)).limit(20),
        getTournamentStateAction() // <--- Pega o estado salvo
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

    return (
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

                    <Link href="/" className="group flex items-center gap-2 text-xs font-bold bg-zinc-900 text-zinc-500 px-4 py-2 rounded-full border border-zinc-800 hover:border-yellow-500 hover:text-yellow-500 transition">
                        <span className="group-hover:-translate-x-1 transition-transform">←</span>
                        <span>Voltar Área Spec</span>
                    </Link>

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
                        <LobbyManager
                            allPlayers={transformedPlayers}
                            allMaps={allMaps}
                            initialState={tournamentState} // <--- 3. PASSA O ESTADO AQUI
                        />
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
                            Vargas Mix System © 2026 - by Midowz
                        </p>
                        <AdminPanel />
                    </div>

                </div>
            </main>
        </AuthGate>
    );
}