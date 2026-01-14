// src/components/match-history.tsx
import { db } from "@/lib/db";
import { matches } from "@/db/schema";
import { desc } from "drizzle-orm";
import { HistoryList } from "./history-list"; // Importa o novo componente

export async function MatchHistory() {
    // Busca as últimas 20 partidas (Aumentei o limite)
    const history = await db.select().from(matches).orderBy(desc(matches.date)).limit(20);

    if (history.length === 0) return null;

    return (
        <div className="w-full space-y-4">
            <h2 className="text-2xl font-black text-zinc-500 uppercase tracking-widest border-b border-zinc-800 pb-2 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" /></svg>
                Histórico de Confrontos
            </h2>

            {/* Renderiza a lista interativa passando os dados */}
            <HistoryList history={history} />
        </div>
    );
}