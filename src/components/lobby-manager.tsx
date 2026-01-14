// src/components/lobby-manager.tsx
'use client'

import { useState } from 'react'
import { generateTeamsAction, deletePlayer, saveMatchResultAction } from '@/app/actions'
import { MapVeto } from './map-veto'
import { PlayerList } from './player-list'

type Player = {
    id: string;
    name: string;
    rating: number | null;
    isSub?: boolean | null;       // Adicionado | null
    currentStreak?: number | null; // Adicionado | null
}
type MapData = { id: string; name: string; imageUrl: string | null }
type GameMode = 'RANDOM' | 'VS_VARGAS'

// 1. ATUALIZAMOS O TIPO PARA RECEBER OS ÍNDICES DO BACKEND
type ScheduleItem = {
    id: string;
    round: number;
    team1Name: string;
    team2Name: string;
    isVargasGame: boolean;
    highlight?: boolean;
    team1Index: number; // <--- NOVO
    team2Index: number; // <--- NOVO
}

export function LobbyManager({ allPlayers, allMaps }: { allPlayers: Player[], allMaps: MapData[] }) {
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [lockedIds, setLockedIds] = useState<string[]>([])
    const [mode, setMode] = useState<GameMode>('RANDOM')
    const [isLoading, setIsLoading] = useState(false)

    // ESTADOS DO JOGO
    const [teams, setTeams] = useState<Player[][] | null>(null)
    const [schedule, setSchedule] = useState<ScheduleItem[]>([])
    const [activeMatchIndex, setActiveMatchIndex] = useState(0)
    const [decidedMap, setDecidedMap] = useState<string | null>(null)
    const [showSchedule, setShowSchedule] = useState(false)

    const vargasPlayer = allPlayers.find(p => p.name.toLowerCase().includes('vargas') || p.name.toLowerCase().includes('vargão'))

    // --- FUNÇÕES DE CONTROLE ---
    const handleToggle = (id: string) => {
        selectedIds.includes(id)
            ? (setSelectedIds(selectedIds.filter(p => p !== id)), setLockedIds(lockedIds.filter(p => p !== id)))
            : setSelectedIds([...selectedIds, id])
    }

    const handleSelectAll = () => {
        selectedIds.length === allPlayers.length ? setSelectedIds([]) : setSelectedIds(allPlayers.map(p => p.id))
    }

    const handleLock = (id: string) => {
        if (mode !== 'VS_VARGAS') return
        lockedIds.includes(id)
            ? setLockedIds(lockedIds.filter(p => p !== id))
            : (lockedIds.length < 5 && setLockedIds([...lockedIds, id]))
    }

    const handleDeletePlayer = async (id: string) => {
        await deletePlayer(id)
    }

    // --- MODOS ---
    const setRandomMode = () => { setMode('RANDOM'); setLockedIds([]); resetGame(); }
    const setVargasMode = () => {
        if (!vargasPlayer) return alert("Cadastre 'Vargas'!");
        setMode('VS_VARGAS');
        if (!selectedIds.includes(vargasPlayer.id)) setSelectedIds(prev => [...prev, vargasPlayer.id]);
        setLockedIds([vargasPlayer.id]); resetGame();
    }

    const resetGame = () => {
        setTeams(null); setSchedule([]); setActiveMatchIndex(0); setDecidedMap(null); setShowSchedule(false);
    }

    const handleGenerate = async () => {
        if (selectedIds.length < 2) return alert("Selecione mais jogadores!");
        setIsLoading(true);
        const result = await generateTeamsAction(selectedIds, mode === 'VS_VARGAS' ? lockedIds : [], mode);

        // @ts-ignore (Garante que o TS não reclame dos índices novos vindo do server)
        setSchedule(result.schedule);
        setTeams(result.teams);

        setActiveMatchIndex(0);
        setDecidedMap(null);
        setIsLoading(false);
    }

    const getTeamName = (index: number) => String.fromCharCode(65 + index);
    const currentMatch = schedule[activeMatchIndex];

    return (
        <div className="space-y-6">

            {/* SELETORES DE MODO */}
            <div className="grid grid-cols-2 gap-4 pb-6 border-b border-zinc-800">
                <button onClick={setRandomMode} className={`relative p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${mode === 'RANDOM' ? 'bg-zinc-800 border-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'bg-zinc-900/50 border-zinc-800 text-zinc-500'}`}>
                    <span className="text-2xl">🎲</span><span className="font-bold text-sm uppercase">Aleatório</span>
                </button>
                <button onClick={setVargasMode} className={`relative p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${mode === 'VS_VARGAS' ? 'bg-zinc-800 border-yellow-500 text-white shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 'bg-zinc-900/50 border-zinc-800 text-zinc-500'}`}>
                    <span className="text-2xl">👑</span><span className="font-bold text-sm uppercase">Desafio Vargão</span>
                </button>
            </div>

            <PlayerList
                players={allPlayers}
                selectedIds={selectedIds}
                lockedIds={lockedIds}
                mode={mode}
                onToggle={handleToggle}
                onLock={handleLock}
                onDelete={handleDeletePlayer}
                onSelectAll={handleSelectAll}
            />

            <button onClick={handleGenerate} disabled={isLoading || selectedIds.length < 2} className={`w-full font-bold py-3 px-8 rounded transition shadow-lg uppercase tracking-wider ${mode === 'VS_VARGAS' ? 'bg-yellow-600 hover:bg-yellow-500 text-black' : 'bg-green-600 hover:bg-green-500 text-white'} disabled:opacity-50`}>
                {isLoading ? '...' : 'GERAR TIMES & PARTIDAS'}
            </button>

            {teams && (
                <div className="mt-8 space-y-8 animate-in slide-in-from-bottom-4">

                    {/* VISUALIZAÇÃO DOS TIMES */}
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                        {teams.map((team, index) => {
                            const hasVargasInTeam = team.some(p => p.id === vargasPlayer?.id);
                            // Destaque visual
                            const isHighlight = (mode === 'VS_VARGAS' && index === 0) || (mode === 'RANDOM' && hasVargasInTeam);

                            let displayTitle = `TIME ${getTeamName(index)}`;
                            if (mode === 'VS_VARGAS' && index === 0) displayTitle = "PANELA DO VARGÃO";
                            if (mode === 'RANDOM' && hasVargasInTeam) displayTitle = `TIME ${getTeamName(index)} (VARGÃO)`;

                            return (
                                <div key={index} className={`bg-zinc-900 border rounded overflow-hidden ${isHighlight ? 'border-yellow-500' : 'border-zinc-700'}`}>
                                    <div className={`px-3 py-1.5 border-b flex justify-between items-center ${isHighlight ? 'bg-yellow-500 border-yellow-600' : 'bg-zinc-800 border-zinc-700'}`}>
                                        <span className={`font-bold text-sm truncate pr-2 ${isHighlight ? 'text-black' : 'text-zinc-400'}`}>{displayTitle}</span>
                                        <span className={`text-[10px] ${isHighlight ? 'text-black/70' : 'text-zinc-500'}`}>{team.length}/5</span>
                                    </div>
                                    <div className="p-2 space-y-1">
                                        {team.map(p => (
                                            <div key={p.id} className={`text-xs font-mono truncate px-1 flex items-center gap-2 ${p.id === vargasPlayer?.id ? 'text-yellow-500 font-bold' : 'text-zinc-400'}`}>
                                                {p.id === vargasPlayer?.id && <span>👑</span>}
                                                {p.name}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {currentMatch ? (
                        <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 space-y-6 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>

                            {/* HEADER DA PARTIDA */}
                            <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
                                <h2 className="text-xl font-black text-white italic transform -skew-x-6">PARTIDA EM ANDAMENTO</h2>
                                <span className="bg-green-500 text-white font-bold px-3 py-1 rounded text-sm animate-pulse">JOGO {activeMatchIndex + 1}</span>
                            </div>

                            {/* PLACAR VISUAL */}
                            <div className="flex items-center justify-center gap-4 md:gap-12">
                                <div className={`text-right w-1/2 font-black italic text-2xl md:text-3xl ${currentMatch.team1Name.includes('VARGÃO') ? 'text-yellow-500' : 'text-blue-500'}`}>{currentMatch.team1Name}</div>
                                <span className="text-zinc-700 font-mono text-xl">VS</span>
                                <div className={`text-left w-1/2 font-black italic text-2xl md:text-3xl ${currentMatch.team2Name.includes('VARGÃO') ? 'text-yellow-500' : 'text-white'}`}>{currentMatch.team2Name}</div>
                            </div>

                            {/* VETO DE MAPAS */}
                            {!decidedMap && <div className="bg-black/20 p-4 rounded-lg border border-zinc-800"><MapVeto key={currentMatch.id} maps={allMaps} team1Name={currentMatch.team1Name} team2Name={currentMatch.team2Name} onMapDecided={(mapName) => setDecidedMap(mapName)} /></div>}

                            {/* FORMULÁRIO DE RESULTADO */}
                            {decidedMap && (
                                <div className="bg-green-900/10 border border-green-500/30 p-6 rounded-lg animate-in slide-in-from-bottom-4">

                                    <form action={async (formData) => {
                                        const score1 = Number(formData.get('score1'));
                                        const score2 = Number(formData.get('score2'));
                                        const mapName = formData.get('mapName') as string;

                                        // 2. CORREÇÃO CRÍTICA: USAR OS ÍNDICES DO BACKEND
                                        // Não tentamos mais adivinhar. O schedule diz exatamente quem é T1 e T2.
                                        let t1Players: Player[] = [];
                                        let t2Players: Player[] = [];

                                        if (teams && currentMatch) {
                                            const idx1 = currentMatch.team1Index;
                                            const idx2 = currentMatch.team2Index;

                                            // Segurança: Garante que os índices existem
                                            if (teams[idx1]) t1Players = teams[idx1];
                                            if (teams[idx2]) t2Players = teams[idx2];
                                        }

                                        const t1Ids = t1Players.map(p => p.id);
                                        const t2Ids = t2Players.map(p => p.id);

                                        await saveMatchResultAction({
                                            team1Name: currentMatch.team1Name,
                                            team2Name: currentMatch.team2Name,
                                            score1, score2, mapName,
                                            team1Ids: t1Ids,
                                            team2Ids: t2Ids,
                                            roster1Names: t1Players.map(p => p.name).join(','),
                                            roster2Names: t2Players.map(p => p.name).join(',')
                                        });

                                        setDecidedMap(null);
                                        setActiveMatchIndex(prev => prev + 1);
                                    }}>
                                        <div className="flex flex-col md:flex-row items-end justify-center gap-6">
                                            <div className="w-full md:w-auto">
                                                <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Mapa Definido</label>
                                                <input name="mapName" type="text" value={decidedMap} readOnly className="bg-zinc-950 border border-zinc-700 text-zinc-300 font-bold p-3 rounded w-full md:w-48 text-center cursor-not-allowed focus:outline-none" />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input name="score1" type="number" min="0" className="bg-zinc-950 border border-zinc-700 text-white text-2xl font-bold p-3 rounded w-20 text-center focus:border-green-500 focus:outline-none" placeholder="0" required autoFocus />
                                                <span className="text-zinc-600 font-bold">:</span>
                                                <input name="score2" type="number" min="0" className="bg-zinc-950 border border-zinc-700 text-white text-2xl font-bold p-3 rounded w-20 text-center focus:border-green-500 focus:outline-none" placeholder="0" required />
                                            </div>
                                            <button type="submit" className="bg-green-600 hover:bg-green-500 text-white font-black py-3 px-8 rounded shadow-lg shadow-green-900/20 w-full md:w-auto uppercase tracking-wider">Confirmar & Próximo</button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-zinc-900 border border-zinc-800 rounded-xl">
                            <h2 className="text-3xl font-black text-yellow-500 mb-2">FIM DOS JOGOS!</h2>
                            <p className="text-zinc-400">Todos os confrontos foram registrados.</p>
                            <button onClick={resetGame} className="mt-6 text-zinc-500 underline hover:text-white">Novo Sorteio</button>
                        </div>
                    )}

                    {/* CRONOGRAMA */}
                    {schedule.length > 0 && (
                        <div className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900/30">
                            <button onClick={() => setShowSchedule(!showSchedule)} className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/50 transition text-left">
                                <div className="flex items-center gap-2"><span className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Cronograma Completo ({schedule.length} Jogos)</span></div>
                                <span className="text-xs text-zinc-600">Ver/Ocultar</span>
                            </button>
                            {showSchedule && (
                                <div className="p-4 grid gap-2 animate-in slide-in-from-top-2 border-t border-zinc-800">
                                    {schedule.map((match, idx) => {
                                        const isPast = idx < activeMatchIndex; const isCurrent = idx === activeMatchIndex;
                                        return (
                                            <div key={match.id} className={`flex items-center justify-between p-3 rounded border ${isPast ? 'bg-zinc-950 border-zinc-800 opacity-50 grayscale' : ''} ${isCurrent ? 'bg-yellow-500/10 border-yellow-500/50 ring-1 ring-yellow-500/20' : ''} ${!isPast && !isCurrent ? 'bg-zinc-900 border-zinc-700' : ''}`}>
                                                <div className="flex items-center gap-4">
                                                    <span className={`text-[10px] font-mono border px-1.5 rounded ${isCurrent ? 'bg-yellow-500 text-black border-yellow-600 font-bold' : 'text-zinc-500 border-zinc-800'}`}>JOGO {match.round}</span>
                                                    <div className="flex gap-2 text-sm font-bold italic"><span className={match.team1Name.includes('VARGÃO') ? 'text-yellow-600' : 'text-zinc-400'}>{match.team1Name}</span><span className="text-zinc-600 not-italic font-normal">vs</span><span className={match.team2Name.includes('VARGÃO') ? 'text-yellow-600' : 'text-zinc-300'}>{match.team2Name}</span></div>
                                                </div>
                                                {isPast && <span className="text-[10px] text-green-500 font-bold uppercase">Concluído</span>} {isCurrent && <span className="text-[10px] text-yellow-500 font-bold uppercase animate-pulse">Jogando</span>}
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}