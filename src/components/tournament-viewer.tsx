'use client'

import { useState, useEffect } from 'react'
import { getTournamentStateAction } from '@/app/actions'
import { TournamentBracket } from './lobby/tournament-bracket'

type Player = { id: string; name: string; rating: number; isSub?: boolean; currentStreak?: number; wins?: number | null; }
type ScheduleItem = {
    id: string;
    round: number;
    team1Name: string;
    team2Name: string;
    team1Index: number;
    team2Index: number;
    isVargasGame: boolean;
    // 👇 ADICIONE ESSES 3 CAMPOS NOVOS 👇
    score1?: number;
    score2?: number;
    mapName?: string;
}
type GameMode = 'RANDOM' | 'VS_VARGAS' | 'BRACKET' | '1V1'

function getTeamDisplayName(team: Player[] | null, defaultName: string) {
    if (!team || team.length === 0) return defaultName;
    const vargas = team.find(p => p.name.toLowerCase().includes('vargas') || p.name.toLowerCase().includes('vargão'));
    if (vargas) return "TEAM VARGÃO";
    const sorted = [...team].sort((a, b) => (b.wins ?? 0) - (a.wins ?? 0));
    return `TEAM ${sorted[0].name.toUpperCase()}`;
}

export function TournamentViewer({ allMaps }: { allMaps: any[] }) {
    const [teams, setTeams] = useState<Player[][] | null>(null)
    const [schedule, setSchedule] = useState<ScheduleItem[]>([])
    const [activeMatchIndex, setActiveMatchIndex] = useState(0)
    const [decidedMap, setDecidedMap] = useState<string | null>(null)
    const [bracketWinners, setBracketWinners] = useState<any>({ q1: null, q2: null, semi1: null, semi2: null, champion: null })
    const [mode, setMode] = useState<GameMode>('RANDOM')

    useEffect(() => {
        const fetchState = async () => {
            const json = await getTournamentStateAction();
            if (json) {
                try {
                    const parsed = JSON.parse(json);
                    if (parsed && parsed.teams && parsed.teams.length > 0) {
                        setTeams(parsed.teams);
                        setSchedule(parsed.schedule);
                        setActiveMatchIndex(parsed.activeMatchIndex);
                        setDecidedMap(parsed.decidedMap);
                        setBracketWinners(parsed.bracketWinners);
                        setMode(parsed.mode);
                    } else {
                        setTeams(null);
                    }
                } catch (e) { console.error(e); }
            } else {
                setTeams(null);
            }
        };
        fetchState();
        const interval = setInterval(fetchState, 3000);
        return () => clearInterval(interval);
    }, []);

    if (!teams) {
        return (
            <div className="flex flex-col items-center justify-center py-24 space-y-6 animate-in zoom-in-95">
                <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-800 animate-pulse">
                    <span className="text-4xl grayscale opacity-50">⏳</span>
                </div>
                <h2 className="text-2xl font-black text-zinc-500 uppercase tracking-widest">Aguardando Início</h2>
            </div>
        )
    }

    const currentMatch = schedule[activeMatchIndex];
    const getMatchNames = () => {
        if (!currentMatch) return { t1: "", t2: "" };
        let t1 = currentMatch.team1Name;
        let t2 = currentMatch.team2Name;
        if (mode === 'BRACKET') {
            if (t1 === "VENCEDOR Q1" && bracketWinners.q1) t1 = getTeamDisplayName(bracketWinners.q1, t1);
            if (t1 === "VENCEDOR Q2" && bracketWinners.q2) t1 = getTeamDisplayName(bracketWinners.q2, t1);
            if (t1 === "VENCEDOR S1" && bracketWinners.semi1) t1 = getTeamDisplayName(bracketWinners.semi1, t1);

            if (t2 === "VENCEDOR Q1" && bracketWinners.q1) t2 = getTeamDisplayName(bracketWinners.q1, t2);
            if (t2 === "VENCEDOR Q2" && bracketWinners.q2) t2 = getTeamDisplayName(bracketWinners.q2, t2);
            if (t2 === "VENCEDOR S2" && bracketWinners.semi2) t2 = getTeamDisplayName(bracketWinners.semi2, t2);
        }
        return { t1, t2 };
    }
    const { t1: currentT1, t2: currentT2 } = getMatchNames();
    const currentMapImage = allMaps.find(m => m.name === decidedMap)?.imageUrl;

    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 transition-all">

            <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                <span className="text-zinc-500 text-xs uppercase tracking-widest font-bold flex items-center gap-2">
                    Modo: {mode}
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_red]" title="AO VIVO"></span>
                </span>
                <span className="text-[10px] bg-zinc-900 px-2 py-1 rounded text-zinc-500 border border-zinc-800">Espectador</span>
            </div>

            {mode === 'BRACKET' && (
                <TournamentBracket schedule={schedule} activeMatchIndex={activeMatchIndex} bracketWinners={bracketWinners} teams={teams} />
            )}

            {mode !== 'BRACKET' && (
                <div className={`grid gap-3 ${mode === '1V1' ? 'grid-cols-2 md:grid-cols-4 lg:grid-cols-5' : 'grid-cols-2 lg:grid-cols-3'}`}>
                    {teams.map((team, index) => {
                        const isVargas = team.some(p => p.name.toLowerCase().includes('vargas'));
                        let displayTitle = mode === '1V1' ? `DUELISTA ${index + 1}` : getTeamDisplayName(team, `TIME ${index + 1}`);
                        if (mode === 'VS_VARGAS' && index === 0) displayTitle = "PANELA DO VARGÃO";

                        return (
                            <div key={index} className={`bg-zinc-900 border rounded overflow-hidden ${isVargas ? 'border-yellow-500/50' : 'border-zinc-800'}`}>
                                <div className={`px-2 py-1 border-b flex justify-between items-center ${isVargas ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-zinc-800/50 border-zinc-700/50'}`}>
                                    <span className={`font-bold text-[10px] truncate ${isVargas ? 'text-yellow-500' : 'text-zinc-400'}`}>{displayTitle}</span>
                                </div>
                                <div className="p-2 space-y-1">
                                    {team.map(p => (
                                        <div key={p.id} className={`text-xs font-mono truncate px-1 flex items-center gap-2 ${p.name.toLowerCase().includes('vargas') ? 'text-yellow-500 font-bold' : 'text-zinc-400'}`}>
                                            {p.name}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* CARD PARTIDA EM ANDAMENTO */}
            {currentMatch ? (
                <div className="bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden shadow-2xl relative transition-all min-h-[300px] flex flex-col">

                    {/* IMAGEM DO MAPA NO FUNDO (Cobre Tudo) */}
                    {decidedMap && currentMapImage && (
                        <div className="absolute inset-0 z-0">
                            <img
                                src={currentMapImage}
                                alt={decidedMap}
                                className="w-full h-full object-cover opacity-40 blur-[2px] scale-105 transform transition-transform duration-1000"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/60"></div>
                        </div>
                    )}

                    {/* Barra lateral verde */}
                    <div className="absolute top-0 left-0 w-1 h-full z-20 bg-green-500 animate-pulse shadow-[0_0_15px_#22c55e]"></div>

                    {/* Header */}
                    <div className="flex justify-between items-center border-b border-white/10 pb-4 p-6 z-10 relative bg-black/20 backdrop-blur-sm">
                        <h2 className="text-xl font-black text-white italic transform -skew-x-6 drop-shadow-lg">
                            PARTIDA EM ANDAMENTO
                        </h2>
                        <span className="bg-green-600 text-white font-bold px-3 py-1 rounded text-sm animate-pulse shadow-lg border border-green-400/50">
                            JOGO {currentMatch.round}
                        </span>
                    </div>

                    {/* Área VS */}
                    <div className="flex-1 flex flex-col justify-center items-center py-8 z-10 relative">
                        <div className="flex w-full items-center justify-center gap-4 md:gap-12 px-4">
                            <div className={`text-right w-1/2 font-black italic text-3xl md:text-5xl drop-shadow-2xl ${currentT1.includes('VARGÃO') ? 'text-yellow-500' : 'text-blue-400'}`}>
                                {currentT1}
                            </div>
                            <span className="text-white/80 font-mono text-3xl font-bold opacity-80">VS</span>
                            <div className={`text-left w-1/2 font-black italic text-3xl md:text-5xl drop-shadow-2xl ${currentT2.includes('VARGÃO') ? 'text-yellow-500' : 'text-white'}`}>
                                {currentT2}
                            </div>
                        </div>

                        {/* Nome do Mapa (Centralizado em baixo) */}
                        <div className="mt-8 flex flex-col items-center animate-in slide-in-from-bottom-4 fade-in duration-700">
                            {decidedMap ? (
                                <>
                                    <span className="text-[10px] text-zinc-300 uppercase tracking-[0.3em] font-bold mb-1 drop-shadow-md">Mapa Decidido</span>
                                    <span className="text-4xl font-black text-white uppercase drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] border-b-4 border-green-500 pb-1 px-4">
                                        {decidedMap}
                                    </span>
                                </>
                            ) : (
                                <span className="bg-black/50 text-zinc-400 px-4 py-2 rounded-full text-xs uppercase tracking-widest border border-white/10 backdrop-blur-md animate-pulse">
                                    Aguardando Vetos...
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-12 bg-zinc-900 border border-zinc-800 rounded-xl">
                    {mode === 'BRACKET' && bracketWinners.champion ? (
                        <div className="animate-in zoom-in duration-500">
                            <div className="text-6xl mb-4">🏆</div>
                            <h2 className="text-4xl font-black text-yellow-500 mb-2 uppercase">
                                {getTeamDisplayName(bracketWinners.champion, "CAMPEÃO")} <br /> FOI CAMPEÃO!
                            </h2>
                        </div>
                    ) : (
                        <h2 className="text-3xl font-black text-zinc-500 mb-2">FIM DOS JOGOS!</h2>
                    )}
                </div>
            )}

            {/* Histórico */}
            {schedule.length > 0 && (
                <div className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900/30 p-4">
                    <p className="text-xs font-bold text-zinc-500 uppercase mb-3">Histórico</p>
                    <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                        {schedule.map((m, idx) => {
                            const isCurrent = idx === activeMatchIndex;
                            const isPast = idx < activeMatchIndex; // Jogo já acabou

                            // Resolução de Nomes (Lógica que você já tinha)
                            let t1 = m.team1Name; let t2 = m.team2Name;
                            if (mode === 'BRACKET') {
                                if (t1.includes("VENCEDOR") && bracketWinners.q1 && t1.includes("Q1")) t1 = getTeamDisplayName(bracketWinners.q1, t1);
                                if (t1.includes("VENCEDOR") && bracketWinners.q2 && t1.includes("Q2")) t1 = getTeamDisplayName(bracketWinners.q2, t1);
                                if (t1.includes("VENCEDOR") && bracketWinners.semi1 && t1.includes("S1")) t1 = getTeamDisplayName(bracketWinners.semi1, t1);

                                if (t2.includes("VENCEDOR") && bracketWinners.q1 && t2.includes("Q1")) t2 = getTeamDisplayName(bracketWinners.q1, t2);
                                if (t2.includes("VENCEDOR") && bracketWinners.q2 && t2.includes("Q2")) t2 = getTeamDisplayName(bracketWinners.q2, t2);
                                if (t2.includes("VENCEDOR") && bracketWinners.semi2 && t2.includes("S2")) t2 = getTeamDisplayName(bracketWinners.semi2, t2);
                            }

                            // Cores do Placar (Verde para vencedor, Vermelho para perdedor)
                            const s1Color = (m.score1 ?? 0) > (m.score2 ?? 0) ? 'text-green-500' : 'text-red-500/70';
                            const s2Color = (m.score2 ?? 0) > (m.score1 ?? 0) ? 'text-green-500' : 'text-red-500/70';

                            return (
                                <div key={m.id} className={`text-xs p-3 rounded flex justify-between items-center border transition-all ${isCurrent ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30' : 'text-zinc-500 bg-zinc-950/50 border-zinc-800/50'}`}>
                                    <div className="flex flex-col gap-1 w-full">
                                        {/* Linha dos Times e VS */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 text-[10px]">JOGO {m.round}</span>
                                                <span className={t1.includes('VARGÃO') ? 'text-yellow-600 font-bold' : ''}>{t1}</span>
                                                <span className="text-zinc-700 font-bold text-[10px]">vs</span>
                                                <span className={t2.includes('VARGÃO') ? 'text-yellow-600 font-bold' : ''}>{t2}</span>
                                            </div>

                                            {/* Ícone de Check se não tiver placar ainda */}
                                            {isPast && m.score1 === undefined && <span className="text-green-500 font-bold">✅</span>}
                                            {isCurrent && <span className="animate-pulse text-yellow-500 text-[10px]">🔄 JOGANDO</span>}
                                        </div>

                                        {/* Linha do Placar e Mapa (Só aparece se já acabou e tem dados) */}
                                        {isPast && m.score1 !== undefined && (
                                            <div className="flex items-center justify-end gap-3 mt-1 border-t border-white/5 pt-1">
                                                {m.mapName && (
                                                    <span className="text-[9px] uppercase tracking-wider text-zinc-600 font-bold mr-auto">
                                                        🗺️ {m.mapName}
                                                    </span>
                                                )}
                                                <div className="flex items-center gap-1 font-mono text-sm font-bold bg-black/40 px-2 rounded border border-white/5">
                                                    <span className={s1Color}>{m.score1}</span>
                                                    <span className="text-zinc-600">:</span>
                                                    <span className={s2Color}>{m.score2}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}