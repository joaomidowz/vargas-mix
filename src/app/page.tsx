// src/app/page.tsx
import { db } from "@/lib/db";
import { players, maps } from "@/db/schema";
import { AddPlayerForm } from "@/components/add-player-form";
import { LobbyManager } from "@/components/lobby-manager";
import { MapVeto } from "@/components/map-veto";

export default async function Home() {
  const [allPlayers, allMaps] = await Promise.all([
    db.select().from(players),
    db.select().from(maps)
  ]);

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* 1. O TÍTULO (Restaurado conforme pedido) */}
        <div className="text-center space-y-2 pb-6 border-b border-zinc-800">
          <h1 className="text-5xl md:text-6xl font-black text-yellow-500 tracking-tighter italic transform -skew-x-12">
            VARGAS <span className="text-white">MIX</span>
          </h1>
          <p className="text-zinc-500 font-mono text-sm uppercase tracking-widest">
            MANAGER SYSTEM V1.0
          </p>
        </div>

        {/* 2. ADICIONAR PLAYER */}
        <div className="bg-zinc-900/80 p-4 rounded-xl border border-zinc-800 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
                <div className="bg-green-500/10 p-2 rounded-full text-green-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </div>
                <h2 className="font-bold text-zinc-300">Novo Operador</h2>
            </div>
            <AddPlayerForm />
        </div>

        {/* 3. LOBBY & TIMES (Agora com o Banner VS) */}
        <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800 min-h-[300px]">
            <LobbyManager allPlayers={allPlayers} />
        </div>

        {/* 4. MAP VETOS (Com lógica de turnos) */}
        <section className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
             <MapVeto maps={allMaps} />
        </section>

        {/* 5. PRÓXIMOS JOGOS (Placeholder) */}
        <div className="bg-zinc-900/30 border-2 border-dashed border-zinc-800 rounded-xl p-8 text-center opacity-50">
            <h3 className="text-xl font-bold text-zinc-600">Próximos Jogos</h3>
            <p className="text-sm text-zinc-700">Histórico em breve...</p>
        </div>

      </div>
    </main>
  );
}