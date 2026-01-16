// src/components/lobby-manager.tsx
'use client'

import { useState, useEffect } from 'react'
import { generateTeamsAction, deletePlayer, saveTournamentStateAction, getTournamentStateAction } from '@/app/actions'
import { LobbySetup } from './lobby/lobby-setup'
import { MatchRunner } from './lobby/match-runner'
import { TournamentBracket } from './lobby/tournament-bracket'

type Player = { 
    id: string; 
    name: string; 
    rating: number; 
    isSub?: boolean; 
    currentStreak?: number; 
    wins?: number | null; 
}
type MapData = { id: string; name: string; imageUrl: string | null }
type GameMode = 'RANDOM' | 'VS_VARGAS' | 'BRACKET' | '1V1'
type ScheduleItem = { id: string; round: number; team1Name: string; team2Name: string; team1Index: number; team2Index: number; isVargasGame: boolean; }

function getTeamDisplayName(team: Player[] | null, defaultName: string) {
    if (!team || team.length === 0) return defaultName;
    const vargas = team.find(p => p.name.toLowerCase().includes('vargas') || p.name.toLowerCase().includes('vargão'));
    if (vargas) return "TEAM VARGÃO";
    const sorted = [...team].sort((a, b) => (b.wins ?? 0) - (a.wins ?? 0));
    return `TEAM ${sorted[0].name.toUpperCase()}`;
}

// 👇 CORREÇÃO 1: Adicionei a tipagem correta para as props, incluindo isReadOnly
interface LobbyManagerProps {
    allPlayers: Player[];
    allMaps: MapData[];
    initialState?: string | null;
    isReadOnly?: boolean; 
}

export function LobbyManager({ allPlayers, allMaps, initialState, isReadOnly = false }: LobbyManagerProps) {
    
    const parsedState = initialState ? JSON.parse(initialState) : {};

    const [selectedIds, setSelectedIds] = useState<string[]>(parsedState.selectedIds || [])
    const [lockedIds, setLockedIds] = useState<string[]>(parsedState.lockedIds || [])
    const [mode, setMode] = useState<GameMode>(parsedState.mode || 'RANDOM')
    const [isLoading, setIsLoading] = useState(false)

    // Estados do Jogo
    const [teams, setTeams] = useState<Player[][] | null>(parsedState.teams || null)
    const [schedule, setSchedule] = useState<ScheduleItem[]>(parsedState.schedule || [])
    const [activeMatchIndex, setActiveMatchIndex] = useState(parsedState.activeMatchIndex || 0)
    const [decidedMap, setDecidedMap] = useState<string | null>(parsedState.decidedMap || null)
    
    // 👇 CORREÇÃO 2: O estado agora nasce com q1 e q2 tipados corretamente
    const [bracketWinners, setBracketWinners] = useState<{ 
        q1: Player[] | null, 
        q2: Player[] | null, 
        semi1: Player[] | null, 
        semi2: Player[] | null, 
        champion: Player[] | null 
    }>(parsedState.bracketWinners || { q1: null, q2: null, semi1: null, semi2: null, champion: null })

    const vargasPlayer = allPlayers.find(p => p.name.toLowerCase().includes('vargas') || p.name.toLowerCase().includes('vargão'))

    // Polling para Viewer (atualiza a cada 3s se for readOnly)
    useEffect(() => {
        if (isReadOnly) {
            const interval = setInterval(async () => {
                const json = await getTournamentStateAction();
                if (json) {
                    const parsed = JSON.parse(json);
                    if (parsed.teams) {
                        setTeams(parsed.teams);
                        setSchedule(parsed.schedule);
                        setActiveMatchIndex(parsed.activeMatchIndex);
                        setDecidedMap(parsed.decidedMap);
                        setBracketWinners(parsed.bracketWinners);
                        setMode(parsed.mode);
                    } else {
                        setTeams(null);
                    }
                }
            }, 3000);
            return () => clearInterval(interval);
        }
    }, [isReadOnly]);

    // Admin salva no banco ao mudar algo
    useEffect(() => {
        if (!isReadOnly && teams) {
            const state = { teams, schedule, activeMatchIndex, decidedMap, bracketWinners, mode, selectedIds, lockedIds };
            saveTournamentStateAction(JSON.stringify(state));
        }
    }, [teams, schedule, activeMatchIndex, decidedMap, bracketWinners, mode, selectedIds, lockedIds, isReadOnly]);

    // Handlers
    const handleToggle = (id: string) => { if(isReadOnly) return; selectedIds.includes(id) ? (setSelectedIds(selectedIds.filter(p => p !== id)), setLockedIds(lockedIds.filter(p => p !== id))) : setSelectedIds([...selectedIds, id]) }
    const handleSelectAll = () => { if(isReadOnly) return; selectedIds.length === allPlayers.length ? setSelectedIds([]) : setSelectedIds(allPlayers.map(p => p.id)) }
    const handleDeletePlayer = async (id: string) => { if(!isReadOnly) await deletePlayer(id) }
    const handleLock = (id: string) => { if(isReadOnly) return; if (mode !== 'VS_VARGAS' && mode !== 'BRACKET') return; lockedIds.includes(id) ? setLockedIds(lockedIds.filter(p => p !== id)) : (lockedIds.length < 5 && setLockedIds([...lockedIds, id])) }
    const setVargasMode = () => { if(isReadOnly) return; if (!vargasPlayer) return alert("Cadastre 'Vargas' primeiro!"); setMode('VS_VARGAS'); if (!selectedIds.includes(vargasPlayer.id)) setSelectedIds(prev => [...prev, vargasPlayer.id]); setLockedIds([vargasPlayer.id]); setTeams(null); }
    
    const resetGame = () => {
        if(isReadOnly) return;
        if (!confirm("Tem certeza? Isso vai limpar o banco de dados.")) return;
        saveTournamentStateAction(""); 
        setTeams(null); setSchedule([]); setActiveMatchIndex(0); setDecidedMap(null); setBracketWinners({ q1: null, q2: null, semi1: null, semi2: null, champion: null });
    }
    const handleRedoVeto = () => { if(!isReadOnly) setDecidedMap(null); }

    const handleGenerate = async () => {
        if(isReadOnly) return;
        if (selectedIds.length < 2) return alert("Selecione mais jogadores!");
        setIsLoading(true);
        const result = await generateTeamsAction(selectedIds, mode === 'VS_VARGAS' || mode === 'BRACKET' ? lockedIds : [], mode);
        // @ts-ignore
        setTeams(result.teams);
        // @ts-ignore
        setSchedule(result.schedule);
        setActiveMatchIndex(0); setDecidedMap(null); setBracketWinners({ q1: null, q2: null, semi1: null, semi2: null, champion: null });
        setIsLoading(false);
    }

    const currentMatch = schedule[activeMatchIndex];

    return (
        <div className="transition-all duration-500">
            {!teams ? (
                isReadOnly ? (
                    <div className="flex flex-col items-center justify-center py-24 space-y-4 animate-in zoom-in-95">
                        <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-800 animate-pulse">
                            <span className="text-4xl grayscale opacity-50">⏳</span>
                        </div>
                        <h2 className="text-2xl font-black text-zinc-500 uppercase tracking-widest">Aguardando Início</h2>
                    </div>
                ) : (
                    <LobbySetup 
                        allPlayers={allPlayers} selectedIds={selectedIds} lockedIds={lockedIds} mode={mode} isLoading={isLoading}
                        setMode={setMode} onToggle={handleToggle} onLock={handleLock} onDelete={handleDeletePlayer} onSelectAll={handleSelectAll} 
                        onGenerate={handleGenerate} onSetVargasMode={setVargasMode} 
                    />
                )
            ) : (
                <div className="space-y-8 animate-in slide-in-from-bottom-4">
                    <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                        <span className="text-zinc-500 text-xs uppercase tracking-widest font-bold flex items-center gap-2">
                            Modo: {mode}
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" title="Online"></span>
                            {isReadOnly && <span className="bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded text-[10px]">AO VIVO</span>}
                        </span>
                        {!isReadOnly && (
                            <button onClick={resetGame} className="text-xs text-red-500 hover:text-red-400 bg-red-500/10 px-3 py-1.5 rounded transition flex items-center gap-1">
                                ↺ Resetar Torneio
                            </button>
                        )}
                    </div>

                    {mode === 'BRACKET' && <TournamentBracket schedule={schedule} activeMatchIndex={activeMatchIndex} bracketWinners={bracketWinners} teams={teams} />}

                    {mode !== 'BRACKET' && (
                        <div className={`grid gap-3 ${mode === '1V1' ? 'grid-cols-2 md:grid-cols-4 lg:grid-cols-5' : 'grid-cols-2 lg:grid-cols-3'}`}>
                            {teams.map((team, index) => {
                                const hasVargasInTeam = team.some(p => p.id === vargasPlayer?.id);
                                let displayTitle = "";
                                if (mode === '1V1') displayTitle = `DUELISTA ${index + 1}`;
                                else if (mode === 'VS_VARGAS' && index === 0) displayTitle = "PANELA DO VARGÃO";
                                else displayTitle = getTeamDisplayName(team, `TIME ${index + 1}`);
                                const isHighlight = hasVargasInTeam;
                                return (
                                    <div key={index} className={`bg-zinc-900 border rounded overflow-hidden ${isHighlight ? 'border-yellow-500' : 'border-zinc-700'}`}>
                                        <div className={`px-2 py-1 border-b flex justify-between items-center ${isHighlight ? 'bg-yellow-500 border-yellow-600' : 'bg-zinc-800 border-zinc-700'}`}>
                                            <span className={`font-bold text-[10px] truncate ${isHighlight ? 'text-black' : 'text-zinc-400'}`}>{displayTitle}</span>
                                            {mode !== '1V1' && <span className={`text-[10px] ${isHighlight ? 'text-black/70' : 'text-zinc-500'}`}>{team.length}/5</span>}
                                        </div>
                                        <div className="p-2 space-y-1">
                                            {team.map(p => <div key={p.id} className={`text-xs font-mono truncate px-1 flex items-center gap-2 ${p.id === vargasPlayer?.id ? 'text-yellow-500 font-bold' : 'text-zinc-400'}`}>{p.name}</div>)}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {currentMatch ? (
                        <div className={isReadOnly ? "pointer-events-none" : ""}>
                            <MatchRunner
                                currentMatch={currentMatch} teams={teams} allMaps={allMaps} activeMatchIndex={activeMatchIndex}
                                decidedMap={decidedMap} bracketWinners={bracketWinners} mode={mode}
                                setDecidedMap={!isReadOnly ? setDecidedMap : () => {}}
                                setBracketWinners={!isReadOnly ? setBracketWinners : () => {}}
                                onRedoVeto={!isReadOnly ? handleRedoVeto : () => {}}
                                onMatchComplete={!isReadOnly ? (winner) => {
                                    setDecidedMap(null);
                                    setActiveMatchIndex((prev: number) => prev + 1);
                                    if (mode === 'BRACKET' && winner) {
                                        // 👇 LÓGICA CORRIGIDA E SEM ERROS DE TIPO
                                        if (currentMatch.id === 'quartas-1') setBracketWinners(prev => ({ ...prev, q1: winner }));
                                        else if (currentMatch.id === 'quartas-2') setBracketWinners(prev => ({ ...prev, q2: winner }));
                                        else if (currentMatch.id === 'semi-1') setBracketWinners(prev => ({ ...prev, semi1: winner }));
                                        else if (currentMatch.id === 'semi-2') setBracketWinners(prev => ({ ...prev, semi2: winner }));
                                        else if (currentMatch.id === 'final') setBracketWinners(prev => ({ ...prev, champion: winner }));
                                    }
                                } : () => {}}
                            />
                            {isReadOnly && decidedMap && (
                                <div className="absolute inset-0 z-50 flex items-center justify-center">
                                    <div className="bg-black/80 px-6 py-3 rounded-xl border border-yellow-500/50 backdrop-blur-md animate-bounce">
                                        <span className="text-yellow-500 font-bold uppercase tracking-widest text-sm">Aguardando Placar...</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-zinc-900 border border-zinc-800 rounded-xl">
                            {mode === 'BRACKET' && bracketWinners.champion ? (
                                <h2 className="text-3xl font-black text-yellow-500 mb-2 uppercase">{getTeamDisplayName(bracketWinners.champion, "CAMPEÃO")} <br /> FOI CAMPEÃO!</h2>
                            ) : (
                                <h2 className="text-3xl font-black text-zinc-500 mb-2">FIM DOS JOGOS!</h2>
                            )}
                            {!isReadOnly && <button onClick={resetGame} className="mt-8 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 px-8 rounded shadow-lg uppercase transition">Novo Sorteio</button>}
                        </div>
                    )}
                    
                    {schedule.length > 0 && (
                        <div className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900/30 p-4 mt-8">
                            <p className="text-xs font-bold text-zinc-500 uppercase mb-3">Histórico de Partidas</p>
                            <div className="space-y-2">
                                {schedule.map((m, idx) => {
                                    const isCurrent = idx === activeMatchIndex;
                                    let t1Name = m.team1Name; let t2Name = m.team2Name;
                                    if (mode === 'BRACKET') {
                                        if (t1Name === "VENCEDOR Q1" && bracketWinners.q1) t1Name = getTeamDisplayName(bracketWinners.q1, "VENCEDOR Q1");
                                        if (t1Name === "VENCEDOR Q2" && bracketWinners.q2) t1Name = getTeamDisplayName(bracketWinners.q2, "VENCEDOR Q2");
                                        if (t1Name === "VENCEDOR S1" && bracketWinners.semi1) t1Name = getTeamDisplayName(bracketWinners.semi1, "VENCEDOR S1");
                                        
                                        if (t2Name === "VENCEDOR Q1" && bracketWinners.q1) t2Name = getTeamDisplayName(bracketWinners.q1, "VENCEDOR Q1");
                                        if (t2Name === "VENCEDOR Q2" && bracketWinners.q2) t2Name = getTeamDisplayName(bracketWinners.q2, "VENCEDOR Q2");
                                        if (t2Name === "VENCEDOR S2" && bracketWinners.semi2) t2Name = getTeamDisplayName(bracketWinners.semi2, "VENCEDOR S2");
                                    }
                                    return (
                                        <div key={m.id} className={`text-xs p-3 rounded flex justify-between items-center border transition-all ${isCurrent ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30' : 'text-zinc-500 bg-zinc-950/50 border-zinc-800/50'}`}>
                                            <div className="flex items-center gap-3">
                                                <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500">JOGO {idx + 1}</span>
                                                <span className={t1Name.includes('VARGÃO') ? 'text-yellow-600 font-bold' : ''}>{t1Name}</span>
                                                <span className="text-zinc-700 font-bold">vs</span>
                                                <span className={t2Name.includes('VARGÃO') ? 'text-yellow-600 font-bold' : ''}>{t2Name}</span>
                                            </div>
                                            {idx < activeMatchIndex && <span className="text-green-500 font-bold">✅</span>}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}