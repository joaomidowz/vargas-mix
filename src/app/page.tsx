// Arquivo: src/app/page.tsx
import { db } from "@/lib/db";
import { players, maps } from "@/db/schema"; // <--- Adicione 'maps' aqui
import { deletePlayer } from "./actions";
import { AddPlayerForm } from "@/components/add-player-form";
import { MapVeto } from "@/components/map-veto"; // <--- Importe o componente novo

export default async function Home() {
  // Buscamos Players E Mapas em paralelo
  const [allPlayers, allMaps] = await Promise.all([
    db.select().from(players),
    db.select().from(maps)
  ]);

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
      <div className="max-w-4xl mx-auto space-y-12"> {/* Aumentei max-w para caber os mapas */}

        {/* Cabeçalho */}
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-black text-yellow-500 tracking-tighter italic transform -skew-x-12">
            VARGAS <span className="text-white">MIX</span>
          </h1>
          <p className="text-zinc-500 font-mono text-sm uppercase tracking-widest">
            Manager System v1.0
          </p>
        </div>

        {/* --- SEÇÃO DE MAPAS (NOVO) --- */}
        <section className="bg-zinc-900/30 p-6 rounded-xl border border-zinc-800 backdrop-blur-sm">
          <MapVeto maps={allMaps} />
        </section>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Coluna da Esquerda: Formulário */}
          <div className="space-y-6">
            <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
              <h2 className="text-xl font-semibold mb-4 text-yellow-500">Novo Operador</h2>
              <AddPlayerForm />
            </div>
          </div>

          {/* Coluna da Direita: Lista */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-zinc-300 flex justify-between">
              <span>Lobby</span>
              <span className="text-zinc-500 text-sm">{allPlayers.length} players</span>
            </h2>

            <div className="grid gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {allPlayers.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between bg-zinc-900 p-3 rounded border-l-4 border-zinc-800 hover:border-yellow-500 transition group"
                >
                  <span className="font-bold text-zinc-300 group-hover:text-white">
                    {player.name}
                  </span>

                  <form action={deletePlayer.bind(null, player.id)}>
                    <button className="text-zinc-600 hover:text-red-500 transition px-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                    </button>
                  </form>
                </div>
              ))}

              {allPlayers.length === 0 && (
                <div className="text-zinc-600 text-center py-8 border-2 border-dashed border-zinc-800 rounded">
                  Lobby vazio.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}