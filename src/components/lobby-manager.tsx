// src/components/lobby-manager.tsx
'use client'

import { useState, useEffect } from 'react' // <--- useEffect é essencial aqui
import { generateTeamsAction, deletePlayer } from '@/app/actions'
import { LobbySetup } from './lobby/lobby-setup'
import { MatchRunner } from './lobby/match-runner'
import { TournamentBracket } from './lobby/tournament-bracket'

// ... (Types e Helper getTeamDisplayName mantidos IGUAIS) ...
type Player = { id: string; name: string; rating: number; isSub?: boolean; currentStreak?: number; wins?: number | null; }
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

export function LobbyManager({ allPlayers, allMaps }: { allPlayers: Player[], allMaps: MapData[] }) {
    // --- ESTADOS ---
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [lockedIds, setLockedIds] = useState<string[]>([])
    const [mode, setMode] = useState<GameMode>('RANDOM')
    const [isLoading, setIsLoading] = useState(false)

    // Estados do Jogo Ativo
    const [teams, setTeams] = useState<Player[][] | null>(null)
    const [schedule, setSchedule] = useState<ScheduleItem[]>([])
    const [activeMatchIndex, setActiveMatchIndex] = useState(0)
    const [decidedMap, setDecidedMap] = useState<string | null>(null)
    const [bracketWinners, setBracketWinners] = useState<{ semi1: Player[] | null, semi2: Player[] | null, champion: Player[] | null }>({ semi1: null, semi2: null, champion: null })

    const vargasPlayer = allPlayers.find(p => p.name.toLowerCase().includes('vargas') || p.name.toLowerCase().includes('vargão'))

    // --- 1. EFEITO PARA CARREGAR O JOGO SALVO AO ABRIR ---
    useEffect(() => {
        const savedGame = localStorage.getItem('vargas-mix-save');
        if (savedGame) {
            try {
                const parsed = JSON.parse(savedGame);
                // Só restaura se tiver times gerados
                if (parsed.teams && parsed.teams.length > 0) {
                    setTeams(parsed.teams);
                    setSchedule(parsed.schedule);
                    setActiveMatchIndex(parsed.activeMatchIndex);
                    setDecidedMap(parsed.decidedMap);
                    setBracketWinners(parsed.bracketWinners);
                    setMode(parsed.mode);
                    setSelectedIds(parsed.selectedIds || []);
                    setLockedIds(parsed.lockedIds || []);
                }
            } catch (e) {
                console.error("Erro ao carregar save:", e);
                localStorage.removeItem('vargas-mix-save'); // Limpa se estiver corrompido
            }
        }
    }, []);

    // --- 2. EFEITO PARA SALVAR AUTOMATICAMENTE A CADA MUDANÇA ---
    useEffect(() => {
        // Só salva se o jogo já começou (teams existe)
        if (teams) {
            const gameState = {
                teams,
                schedule,
                activeMatchIndex,
                decidedMap,
                bracketWinners,
                mode,
                selectedIds,
                lockedIds
            };
            localStorage.setItem('vargas-mix-save', JSON.stringify(gameState));
        }
    }, [teams, schedule, activeMatchIndex, decidedMap, bracketWinners, mode, selectedIds, lockedIds]);


    // --- HANDLERS ---
    const handleToggle = (id: string) => { selectedIds.includes(id) ? (setSelectedIds(selectedIds.filter(p => p !== id)), setLockedIds(lockedIds.filter(p => p !== id))) : setSelectedIds([...selectedIds, id]) }
    const handleSelectAll = () => { selectedIds.length === allPlayers.length ? setSelectedIds([]) : setSelectedIds(allPlayers.map(p => p.id)) }
    const handleDeletePlayer = async (id: string) => await deletePlayer(id)

    const handleLock = (id: string) => {
        if (mode !== 'VS_VARGAS' && mode !== 'BRACKET') return;
        lockedIds.includes(id) ? setLockedIds(lockedIds.filter(p => p !== id)) : (lockedIds.length < 5 && setLockedIds([...lockedIds, id]))
    }

    const setVargasMode = () => {
        if (!vargasPlayer) return alert("Cadastre 'Vargas' primeiro!");
        setMode('VS_VARGAS');
        if (!selectedIds.includes(vargasPlayer.id)) setSelectedIds(prev => [...prev, vargasPlayer.id]);
        setLockedIds([vargasPlayer.id]);
        // Não chamamos resetGame aqui direto para não apagar o save se foi um clique acidental, 
        // mas a UI vai mudar para o Setup e o usuario vai clicar em gerar dnv
        setTeams(null);
    }

    // --- 3. RESET AGORA LIMPA O STORAGE TAMBÉM ---
    const resetGame = () => {
        if (!confirm("Tem certeza? Isso vai apagar o progresso atual.")) return;

        localStorage.removeItem('vargas-mix-save'); // <--- AQUI A MÁGICA

        setTeams(null);
        setSchedule([]);
        setActiveMatchIndex(0);
        setDecidedMap(null);
        setBracketWinners({ semi1: null, semi2: null, champion: null });
    }

    const handleRedoVeto = () => {
        setDecidedMap(null);
    }

    const handleGenerate = async () => {
        if (selectedIds.length < 2) return alert("Selecione mais jogadores!");
        setIsLoading(true);
        const result = await generateTeamsAction(selectedIds, mode === 'VS_VARGAS' || mode === 'BRACKET' ? lockedIds : [], mode);
        // @ts-ignore
        setTeams(result.teams);
        // @ts-ignore
        setSchedule(result.schedule);
        setActiveMatchIndex(0); setDecidedMap(null);
        setBracketWinners({ semi1: null, semi2: null, champion: null });
        setIsLoading(false);
    }

    const currentMatch = schedule[activeMatchIndex];

    return (
        <div className="transition-all duration-500">
            {!teams ? (
                <LobbySetup
                    allPlayers={allPlayers} selectedIds={selectedIds} lockedIds={lockedIds} mode={mode} isLoading={isLoading}
                    setMode={setMode} onToggle={handleToggle} onLock={handleLock} onDelete={handleDeletePlayer} onSelectAll={handleSelectAll}
                    onGenerate={handleGenerate} onSetVargasMode={setVargasMode}
                />
            ) : (
                <div className="space-y-8 animate-in slide-in-from-bottom-4">

                    <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                        <span className="text-zinc-500 text-xs uppercase tracking-widest font-bold flex items-center gap-2">
                            Modo: {mode}
                            {/* Indicador visual de que está salvo */}
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" title="Jogo Salvo Automaticamente"></span>
                        </span>

                        <button onClick={resetGame} className="text-xs text-red-500 hover:text-red-400 hover:bg-red-500/10 px-3 py-1.5 rounded transition flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
                            Novo Sorteio (Reset)
                        </button>
                    </div>

                    {mode === 'BRACKET' && (
                        <TournamentBracket schedule={schedule} activeMatchIndex={activeMatchIndex} bracketWinners={bracketWinners} teams={teams} />
                    )}

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
                                        {team.map(p => (
                                            <div key={p.id} className={`text-xs font-mono truncate px-1 flex items-center gap-2 ${p.id === vargasPlayer?.id ? 'text-yellow-500 font-bold' : 'text-zinc-400'}`}>
                                                {p.name}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {currentMatch ? (
                        <MatchRunner
                            currentMatch={currentMatch} teams={teams} allMaps={allMaps} activeMatchIndex={activeMatchIndex}
                            decidedMap={decidedMap} bracketWinners={bracketWinners} mode={mode}
                            setDecidedMap={setDecidedMap} setBracketWinners={setBracketWinners}
                            onRedoVeto={handleRedoVeto}
                            onMatchComplete={(winnerTeam) => {
                                setDecidedMap(null);
                                setActiveMatchIndex(prev => prev + 1);
                                if (currentMatch.team1Index === -1 && winnerTeam) {
                                    setBracketWinners(prev => ({ ...prev, champion: winnerTeam }));
                                }
                            }}
                        />
                    ) : (
                        <div className="text-center py-12 bg-zinc-900 border border-zinc-800 rounded-xl animate-in zoom-in-95">
                            {mode === 'BRACKET' && bracketWinners.champion ? (
                                <>
                                    <div className="text-6xl mb-4">🏆</div>
                                    <h2 className="text-3xl font-black text-yellow-500 mb-2 uppercase">
                                        {getTeamDisplayName(bracketWinners.champion, "CAMPEÃO")} <br /> FOI CAMPEÃO!
                                    </h2>
                                    <p className="text-zinc-400">Parabéns a todos os envolvidos.</p>
                                </>
                            ) : (
                                <>
                                    <h2 className="text-3xl font-black text-zinc-500 mb-2">FIM DOS JOGOS!</h2>
                                    <p className="text-zinc-400">Todos os confrontos foram registrados.</p>
                                </>
                            )}
                            <button onClick={resetGame} className="mt-8 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 px-8 rounded shadow-lg uppercase tracking-wider transition">
                                Novo Sorteio (Reset)
                            </button>
                        </div>
                    )}

                    {/* ... (Cronograma mantido igual) ... */}
                    {schedule.length > 0 && (
                        <div className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900/30 p-4 mt-8">
                            <p className="text-xs font-bold text-zinc-500 uppercase mb-3">Histórico de Partidas</p>
                            <div className="space-y-2">
                                {schedule.map((m, idx) => {
                                    const isPast = idx < activeMatchIndex;
                                    const isCurrent = idx === activeMatchIndex;
                                    let t1Name = m.team1Name; let t2Name = m.team2Name;
                                    if (mode === 'BRACKET' && m.team1Index === -1) {
                                        t1Name = getTeamDisplayName(bracketWinners.semi1, t1Name);
                                        t2Name = getTeamDisplayName(bracketWinners.semi2, t2Name);
                                    }
                                    return (
                                        <div key={m.id} className={`text-xs p-3 rounded flex justify-between items-center border transition-all ${isCurrent ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.1)]' : (isPast ? 'text-zinc-500 bg-zinc-950/50 border-zinc-800/50' : 'text-zinc-600 border-transparent')}`}>
                                            <div className="flex items-center gap-3">
                                                <span className={`font-mono font-bold px-1.5 py-0.5 rounded ${isCurrent ? 'bg-yellow-500/20 text-yellow-600' : 'bg-zinc-800 text-zinc-500'}`}>JOGO {m.round}</span>
                                                <span className={t1Name.includes('VARGÃO') ? 'text-yellow-600 font-bold' : ''}>{t1Name}</span>
                                                <span className="text-zinc-700 font-bold">vs</span>
                                                <span className={t2Name.includes('VARGÃO') ? 'text-yellow-600 font-bold' : ''}>{t2Name}</span>
                                            </div>
                                            {isPast && <span className="text-green-500 font-bold">✅</span>}
                                            {isCurrent && <span className="animate-pulse text-yellow-500">🔄 JOGANDO</span>}
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