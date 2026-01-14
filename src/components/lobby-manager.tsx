// src/components/lobby-manager.tsx
'use client'

import { useState } from 'react'
import { generateTeamsAction, deletePlayer, saveMatchResultAction } from '@/app/actions'
import { MapVeto } from './map-veto'

type Player = { id: string; name: string; rating: number | null }
type MapData = { id: string; name: string; imageUrl: string | null }
type GameMode = 'RANDOM' | 'VS_VARGAS'

type ScheduleItem = {
    id: string;
    round: number;
    team1Name: string;
    team2Name: string;
    isVargasGame: boolean;
    highlight?: boolean;
}

export function LobbyManager({ allPlayers, allMaps }: { allPlayers: Player[], allMaps: MapData[] }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [lockedIds, setLockedIds] = useState<string[]>([]) 
  const [mode, setMode] = useState<GameMode>('RANDOM')
  const [isLoading, setIsLoading] = useState(false)

  // ESTADOS DO JOGO
  const [teams, setTeams] = useState<Player[][] | null>(null)
  const [schedule, setSchedule] = useState<ScheduleItem[]>([])
  
  // SEQUENCIA
  const [activeMatchIndex, setActiveMatchIndex] = useState(0)
  const [decidedMap, setDecidedMap] = useState<string | null>(null)

  // ESTADO VISUAL NOVO: MOSTRAR/ESCONDER CRONOGRAMA
  const [showSchedule, setShowSchedule] = useState(false)

  const vargasPlayer = allPlayers.find(p => p.name.toLowerCase().includes('vargas') || p.name.toLowerCase().includes('vargão'))

  // --- FUNÇÕES AUXILIARES (Mesmas de antes) ---
  const togglePlayer = (id: string) => { selectedIds.includes(id) ? (setSelectedIds(selectedIds.filter(p=>p!==id)), setLockedIds(lockedIds.filter(p=>p!==id))) : setSelectedIds([...selectedIds, id]) }
  const toggleSelectAll = () => selectedIds.length === allPlayers.length ? setSelectedIds([]) : setSelectedIds(allPlayers.map(p => p.id))
  const toggleLock = (e: React.MouseEvent, id: string) => { e.stopPropagation(); if (mode !== 'VS_VARGAS') return; lockedIds.includes(id) ? setLockedIds(lockedIds.filter(p=>p!==id)) : (lockedIds.length < 5 && setLockedIds([...lockedIds, id])) }

  const setRandomMode = () => { setMode('RANDOM'); setLockedIds([]); resetGame(); }
  const setVargasMode = () => { 
      if (!vargasPlayer) return alert("Cadastre 'Vargas'!"); 
      setMode('VS_VARGAS'); 
      if (!selectedIds.includes(vargasPlayer.id)) setSelectedIds(prev=>[...prev, vargasPlayer.id]); 
      setLockedIds([vargasPlayer.id]); resetGame();
  }

  const resetGame = () => {
      setTeams(null);
      setSchedule([]);
      setActiveMatchIndex(0);
      setDecidedMap(null);
      setShowSchedule(false);
  }

  const handleGenerate = async () => {
    if (selectedIds.length < 2) return alert("Selecione mais jogadores!");
    setIsLoading(true);
    const result = await generateTeamsAction(selectedIds, mode === 'VS_VARGAS' ? lockedIds : [], mode);
    setTeams(result.teams);
    setSchedule(result.schedule);
    setActiveMatchIndex(0);
    setDecidedMap(null);
    setIsLoading(false);
  }

  const getTeamName = (index: number) => String.fromCharCode(65 + index);
  const currentMatch = schedule[activeMatchIndex];

  return (
    <div className="space-y-6">
      
      {/* HEADER E CONTROLES DE SELEÇÃO */}
      <div className="grid grid-cols-2 gap-4 pb-6 border-b border-zinc-800">
        <button onClick={setRandomMode} className={`relative p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${mode === 'RANDOM' ? 'bg-zinc-800 border-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'bg-zinc-900/50 border-zinc-800 text-zinc-500'}`}>
           <span className="text-2xl">🎲</span><span className="font-bold text-sm uppercase">Aleatório</span>
        </button>
        <button onClick={setVargasMode} className={`relative p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${mode === 'VS_VARGAS' ? 'bg-zinc-800 border-yellow-500 text-white shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 'bg-zinc-900/50 border-zinc-800 text-zinc-500'}`}>
           <span className="text-2xl">👑</span><span className="font-bold text-sm uppercase">Desafio Vargão</span>
        </button>
      </div>

      <div className="flex justify-between items-center">
         <div className="flex items-center gap-2">
            <span className="text-zinc-400 text-xs bg-zinc-800 px-2 py-1 rounded">{selectedIds.length} Players</span>
            <button onClick={toggleSelectAll} className="text-xs text-zinc-500 hover:text-white underline">Todos/Nenhum</button>
         </div>
         {mode === 'VS_VARGAS' && <span className="text-xs text-yellow-500 font-bold bg-yellow-500/10 px-2 py-1 rounded border border-yellow-500/20">Panela: {lockedIds.length}/5</span>}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          {allPlayers.map((player) => {
            const isSel = selectedIds.includes(player.id); const isLock = lockedIds.includes(player.id);
            return (
              <div key={player.id} onClick={() => togglePlayer(player.id)} className={`flex items-center justify-between p-2 rounded cursor-pointer border text-xs group ${isLock ? 'bg-yellow-500/20 border-yellow-500' : isSel ? 'bg-zinc-800 border-zinc-600' : 'bg-zinc-900/50 border-zinc-800 opacity-60'}`}>
                <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded border flex items-center justify-center ${isSel ? 'bg-zinc-500 border-zinc-500' : 'border-zinc-700'}`}>{isSel && <div className="w-1.5 h-1.5 bg-white rounded-full"/>}</div>
                    <span className={`font-medium truncate ${isLock ? 'text-yellow-500 font-bold' : 'text-zinc-300'}`}>{player.name}</span>
                </div>
                <div className="flex gap-1">{mode === 'VS_VARGAS' && isSel && <button onClick={(e) => toggleLock(e, player.id)} className="text-zinc-500 hover:text-yellow-500 p-1">🔒</button>} {!isSel && <button onClick={(e)=>{e.stopPropagation(); deletePlayer(player.id)}} className="text-zinc-700 hover:text-red-500 p-1">✕</button>}</div>
              </div>
            )
          })}
      </div>

      <button onClick={handleGenerate} disabled={isLoading || selectedIds.length < 2} className={`w-full font-bold py-3 px-8 rounded transition shadow-lg uppercase tracking-wider ${mode === 'VS_VARGAS' ? 'bg-yellow-600 hover:bg-yellow-500 text-black' : 'bg-green-600 hover:bg-green-500 text-white'} disabled:opacity-50`}>
         {isLoading ? '...' : 'GERAR TIMES & PARTIDAS'}
      </button>

      {/* --- ÁREA DE JOGO ATIVO --- */}
      {teams && (
        <div className="mt-8 space-y-8 animate-in slide-in-from-bottom-4">
          
          {/* TIMES DEFINIDOS (VISUAL) */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {teams.map((team, index) => {
                const hasVargasInTeam = team.some(p => p.id === vargasPlayer?.id);
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

          {/* PARTIDA ATIVA */}
          {currentMatch ? (
             <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 space-y-6 shadow-2xl relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
                 <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
                    <h2 className="text-xl font-black text-white italic transform -skew-x-6">
                        PARTIDA EM ANDAMENTO
                    </h2>
                    <span className="bg-green-500 text-white font-bold px-3 py-1 rounded text-sm animate-pulse">
                        JOGO {activeMatchIndex + 1}
                    </span>
                 </div>

                 {/* PLACAR */}
                 <div className="flex items-center justify-center gap-4 md:gap-12">
                     <div className={`text-right w-1/2 font-black italic text-2xl md:text-3xl ${currentMatch.team1Name.includes('VARGÃO') ? 'text-yellow-500' : 'text-blue-500'}`}>
                         {currentMatch.team1Name}
                     </div>
                     <span className="text-zinc-700 font-mono text-xl">VS</span>
                     <div className={`text-left w-1/2 font-black italic text-2xl md:text-3xl ${currentMatch.team2Name.includes('VARGÃO') ? 'text-yellow-500' : 'text-white'}`}>
                         {currentMatch.team2Name}
                     </div>
                 </div>

                 {/* VETO */}
                 {!decidedMap && (
                     <div className="bg-black/20 p-4 rounded-lg border border-zinc-800">
                         <MapVeto 
                            key={currentMatch.id} 
                            maps={allMaps} 
                            team1Name={currentMatch.team1Name} 
                            team2Name={currentMatch.team2Name}
                            onMapDecided={(mapName) => setDecidedMap(mapName)}
                         />
                     </div>
                 )}

                 {/* REGISTRAR */}
                 {decidedMap && (
                    <div className="bg-green-900/10 border border-green-500/30 p-6 rounded-lg animate-in slide-in-from-bottom-4">
                        <form action={async (formData) => {
                            const score1 = Number(formData.get('score1'));
                            const score2 = Number(formData.get('score2'));
                            const mapName = formData.get('mapName') as string;
                            await saveMatchResultAction({
                                team1Name: currentMatch.team1Name, team2Name: currentMatch.team2Name,
                                score1, score2, mapName, playersIds: selectedIds, roster1Names: "Ver detalhes", roster2Names: "Ver detalhes"
                            });
                            setDecidedMap(null);
                            setActiveMatchIndex(prev => prev + 1);
                        }}>
                            <div className="flex flex-col md:flex-row items-end justify-center gap-6">
                                <div className="w-full md:w-auto">
                                    <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Mapa Definido</label>
                                    <input name="mapName" type="text" value={decidedMap} readOnly className="bg-zinc-950 border border-zinc-700 text-zinc-300 font-bold p-3 rounded w-full md:w-48 text-center cursor-not-allowed focus:outline-none"/>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input name="score1" type="number" min="0" className="bg-zinc-950 border border-zinc-700 text-white text-2xl font-bold p-3 rounded w-20 text-center focus:border-green-500 focus:outline-none" placeholder="0" required autoFocus />
                                    <span className="text-zinc-600 font-bold">:</span>
                                    <input name="score2" type="number" min="0" className="bg-zinc-950 border border-zinc-700 text-white text-2xl font-bold p-3 rounded w-20 text-center focus:border-green-500 focus:outline-none" placeholder="0" required />
                                </div>
                                <button type="submit" className="bg-green-600 hover:bg-green-500 text-white font-black py-3 px-8 rounded shadow-lg shadow-green-900/20 w-full md:w-auto uppercase tracking-wider">
                                    Confirmar & Próximo
                                </button>
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

          {/* --- CRONOGRAMA COLLAPSIBLE (SANFONA) --- */}
          {schedule.length > 0 && (
              <div className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900/30">
                  <button 
                    onClick={() => setShowSchedule(!showSchedule)}
                    className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/50 transition text-left"
                  >
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-400 text-xs font-bold uppercase tracking-widest">
                            Cronograma Completo ({schedule.length} Jogos)
                        </span>
                        {/* Ícone Chevron Simples */}
                        <svg 
                            className={`w-4 h-4 text-zinc-500 transition-transform ${showSchedule ? 'rotate-180' : ''}`} 
                            xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                      <span className="text-xs text-zinc-600">Clique para ver/ocultar</span>
                  </button>

                  {/* Conteúdo Expansível */}
                  {showSchedule && (
                    <div className="p-4 grid gap-2 animate-in slide-in-from-top-2 border-t border-zinc-800">
                        {schedule.map((match, idx) => {
                            // Status do jogo na lista
                            const isPast = idx < activeMatchIndex;
                            const isCurrent = idx === activeMatchIndex;
                            
                            return (
                                <div 
                                    key={match.id} 
                                    className={`
                                        flex items-center justify-between p-3 rounded border
                                        ${isPast ? 'bg-zinc-950 border-zinc-800 opacity-50 grayscale' : ''}
                                        ${isCurrent ? 'bg-yellow-500/10 border-yellow-500/50 ring-1 ring-yellow-500/20' : ''}
                                        ${!isPast && !isCurrent ? 'bg-zinc-900 border-zinc-700' : ''}
                                    `}
                                >
                                    <div className="flex items-center gap-4">
                                        <span className={`
                                            text-[10px] font-mono border px-1.5 rounded
                                            ${isCurrent ? 'bg-yellow-500 text-black border-yellow-600 font-bold' : 'text-zinc-500 border-zinc-800'}
                                        `}>
                                            JOGO {match.round}
                                        </span>
                                        <div className="flex gap-2 text-sm font-bold italic">
                                            <span className={match.team1Name.includes('VARGÃO') ? 'text-yellow-600' : 'text-zinc-400'}>{match.team1Name}</span>
                                            <span className="text-zinc-600 not-italic font-normal">vs</span>
                                            <span className={match.team2Name.includes('VARGÃO') ? 'text-yellow-600' : 'text-zinc-300'}>{match.team2Name}</span>
                                        </div>
                                    </div>
                                    
                                    {isPast && <span className="text-[10px] text-green-500 font-bold uppercase">Concluído</span>}
                                    {isCurrent && <span className="text-[10px] text-yellow-500 font-bold uppercase animate-pulse">Jogando Agora</span>}
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