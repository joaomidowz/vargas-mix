'use client'

import { Fragment } from 'react'

type Player = { id: string; name: string; }
type ScheduleItem = { team1Name: string; team2Name: string; team1Index: number; team2Index: number; }

interface TournamentBracketProps {
    schedule: ScheduleItem[]
    activeMatchIndex: number
    bracketWinners: { semi1: Player[] | null, semi2: Player[] | null, champion: Player[] | null }
    teams: Player[][]
}

// Helper: Nome do time ou "Team Capitão"
function getTeamDisplayName(team: Player[] | null, defaultName: string) {
    if (!team || team.length === 0) return defaultName;
    const vargas = team.find(p => p.name.toLowerCase().includes('vargas') || p.name.toLowerCase().includes('vargão'));
    if (vargas) return "TEAM VARGÃO";
    return `TEAM ${team[0].name.toUpperCase()}`;
}

// --- SUB-COMPONENTE: CARD DO TIME ---
function TeamCard({ 
    name, 
    players, 
    status // 'winner' | 'loser' | 'neutral' | 'active'
}: { 
    name: string, 
    players: Player[] | undefined, 
    status: 'winner' | 'loser' | 'neutral' | 'active' 
}) {
    const isVargas = name.includes('VARGÃO');
    
    // Cores baseadas no status
    let bgClass = "bg-zinc-900 border-zinc-700 text-zinc-400"; // Neutral
    if (status === 'active') bgClass = "bg-zinc-800 border-zinc-500 text-white ring-1 ring-zinc-500";
    if (status === 'winner') bgClass = "bg-yellow-500 border-yellow-600 text-black shadow-[0_0_15px_rgba(234,179,8,0.2)]";
    if (status === 'loser') bgClass = "bg-zinc-950 border-zinc-800 text-zinc-600 opacity-70";

    return (
        <div className={`group relative flex items-center gap-2 px-3 py-2 border rounded-md transition-all w-48 ${bgClass}`}>
            {/* Ícone */}
            <div className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold
                 ${status === 'winner' ? 'bg-black/20 text-black' : 'bg-black/40 text-inherit'}
            `}>
                {isVargas ? '👑' : name.charAt(5)}
            </div>
            
            <span className="text-xs font-bold truncate flex-1">{name}</span>
            {status === 'winner' && <span className="text-[9px] font-black uppercase">Win</span>}

            {/* --- TOOLTIP (O SEGREDO) --- */}
            {players && players.length > 0 && (
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-50 w-40 bg-zinc-950 border border-zinc-700 rounded-lg shadow-2xl p-2 pointer-events-none animate-in fade-in zoom-in-95 duration-200">
                     <div className="text-[9px] text-zinc-500 uppercase font-bold mb-1 border-b border-zinc-800 pb-1 text-center">Line-up</div>
                     <ul className="space-y-1">
                        {players.map(p => (
                            <li key={p.id} className={`text-[10px] flex items-center gap-1 ${p.name.includes('Vargas') ? 'text-yellow-500 font-bold' : 'text-zinc-300'}`}>
                                {p.name.includes('Vargas') && '👑'} {p.name}
                            </li>
                        ))}
                     </ul>
                     {/* Setinha para baixo */}
                     <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-zinc-700"></div>
                </div>
            )}
        </div>
    )
}

export function TournamentBracket({ schedule, activeMatchIndex, bracketWinners, teams }: TournamentBracketProps) {
    const semi1 = schedule[0];
    const semi2 = schedule[1];

    // Jogadores reais
    const t1Players = teams[semi1.team1Index];
    const t2Players = teams[semi1.team2Index];
    const t3Players = teams[semi2.team1Index];
    const t4Players = teams[semi2.team2Index];

    // Estados dos Jogos
    const semi1Finished = activeMatchIndex > 0;
    const semi2Finished = activeMatchIndex > 1;
    const finalFinished = activeMatchIndex > 2;

    // Helper para definir status visual do card
    const getStatus = (matchActive: boolean, matchFinished: boolean, isThisTeamWinner: boolean) => {
        if (matchFinished) return isThisTeamWinner ? 'winner' : 'loser';
        if (matchActive) return 'active';
        return 'neutral';
    };

    return (
        <div className="w-full overflow-x-auto p-8 bg-zinc-950/30 rounded-xl border border-zinc-800 mb-8 custom-scrollbar">
             <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-8 text-center">Chaveamento</h3>

             <div className="flex items-center justify-center min-w-[600px]">
                
                {/* --- COLUNA 1: SEMIFINAIS --- */}
                <div className="flex flex-col gap-8"> {/* Gap define a altura da chave */}
                    
                    {/* MATCH 1 (SEMI 1) */}
                    <div className="flex flex-col gap-1 relative">
                        <span className="text-[9px] text-zinc-600 font-bold uppercase ml-1">Semifinal 1</span>
                        <TeamCard 
                            name={semi1.team1Name} 
                            players={t1Players} 
                            status={getStatus(activeMatchIndex === 0, semi1Finished, bracketWinners.semi1 === t1Players)} 
                        />
                        <TeamCard 
                            name={semi1.team2Name} 
                            players={t2Players} 
                            status={getStatus(activeMatchIndex === 0, semi1Finished, bracketWinners.semi1 === t2Players)} 
                        />
                        
                        {/* Linha Conectora Saindo da Direita */}
                        <div className={`absolute top-1/2 -right-8 w-8 h-[2px] mt-2 ${semi1Finished ? 'bg-yellow-500' : 'bg-zinc-800'}`}></div>
                        {/* Cotovelo para baixo */}
                        <div className={`absolute top-1/2 -right-8 w-[2px] h-[calc(50%+16px)] mt-2 ${semi1Finished ? 'bg-yellow-500' : 'bg-zinc-800'}`}></div>
                    </div>

                    {/* Espaçador Flexível se quiser afastar mais */}
                    <div className="h-4"></div>

                    {/* MATCH 2 (SEMI 2) */}
                    <div className="flex flex-col gap-1 relative">
                        <span className="text-[9px] text-zinc-600 font-bold uppercase ml-1">Semifinal 2</span>
                        <TeamCard 
                            name={semi2.team1Name} 
                            players={t3Players} 
                            status={getStatus(activeMatchIndex === 1, semi2Finished, bracketWinners.semi2 === t3Players)} 
                        />
                        <TeamCard 
                            name={semi2.team2Name || "W.O."} 
                            players={t4Players} 
                            status={getStatus(activeMatchIndex === 1, semi2Finished, bracketWinners.semi2 === t4Players)} 
                        />

                        {/* Linha Conectora Saindo da Direita */}
                        <div className={`absolute top-1/2 -right-8 w-8 h-[2px] mt-2 ${semi2Finished ? 'bg-yellow-500' : 'bg-zinc-800'}`}></div>
                        {/* Cotovelo para cima */}
                        <div className={`absolute top-1/2 -right-8 w-[2px] h-[calc(50%+16px)] -translate-y-full mt-2 ${semi2Finished ? 'bg-yellow-500' : 'bg-zinc-800'}`}></div>
                    </div>
                </div>

                {/* --- COLUNA 2: CONECTOR CENTRAL --- */}
                <div className="w-16 flex items-center justify-center">
                    {/* A linha horizontal que liga o "meio" das semis à final */}
                    <div className={`w-full h-[2px] ${finalFinished ? 'bg-yellow-500' : 'bg-zinc-800'}`}></div>
                </div>

                {/* --- COLUNA 3: GRANDE FINAL --- */}
                <div className="flex flex-col justify-center relative">
                    <div className="flex flex-col gap-1 relative">
                        <div className="absolute -top-6 left-0 w-full text-center text-[10px] text-yellow-600 font-bold uppercase tracking-wider animate-pulse">🏆 Final</div>
                        
                        <TeamCard 
                            name={getTeamDisplayName(bracketWinners.semi1, "Aguardando...")}
                            players={bracketWinners.semi1 || undefined}
                            status={getStatus(activeMatchIndex === 2, finalFinished, bracketWinners.champion === bracketWinners.semi1)}
                        />
                        
                        {/* VS no meio (Decorativo) */}
                        <div className="flex items-center justify-center -my-3 z-10">
                            <span className="bg-zinc-950 text-[8px] text-zinc-600 px-1 font-bold">VS</span>
                        </div>

                        <TeamCard 
                            name={getTeamDisplayName(bracketWinners.semi2, "Aguardando...")}
                            players={bracketWinners.semi2 || undefined}
                            status={getStatus(activeMatchIndex === 2, finalFinished, bracketWinners.champion === bracketWinners.semi2)}
                        />
                    </div>
                </div>

             </div>
        </div>
    )
}