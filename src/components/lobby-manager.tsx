// src/components/lobby-manager.tsx
'use client'

import { useState } from 'react'
import { generateTeamsAction, deletePlayer } from '@/app/actions'
import { MapVeto } from './map-veto' // <--- Importe o MapVeto aqui!

type Player = { id: string; name: string; rating: number | null }
// Precisamos receber os mapas aqui também
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

// Agora o LobbyManager recebe 'allMaps' também
export function LobbyManager({ allPlayers, allMaps }: { allPlayers: Player[], allMaps: MapData[] }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [lockedIds, setLockedIds] = useState<string[]>([]) 
  const [mode, setMode] = useState<GameMode>('RANDOM')
  const [isLoading, setIsLoading] = useState(false)

  // Resultados
  const [teams, setTeams] = useState<Player[][] | null>(null)
  const [schedule, setSchedule] = useState<ScheduleItem[]>([])

  const vargasPlayer = allPlayers.find(p => p.name.toLowerCase().includes('vargas') || p.name.toLowerCase().includes('vargão'))

  // ... (Funções de Toggle iguais ao anterior) ...
  const togglePlayer = (id: string) => {
    selectedIds.includes(id) ? (setSelectedIds(selectedIds.filter(p=>p!==id)), setLockedIds(lockedIds.filter(p=>p!==id))) : setSelectedIds([...selectedIds, id])
  }
  const toggleSelectAll = () => selectedIds.length === allPlayers.length ? setSelectedIds([]) : setSelectedIds(allPlayers.map(p => p.id))
  
  const toggleLock = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); if (mode !== 'VS_VARGAS') return;
    lockedIds.includes(id) ? setLockedIds(lockedIds.filter(p=>p!==id)) : (lockedIds.length < 5 && setLockedIds([...lockedIds, id]))
  }

  const setRandomMode = () => { setMode('RANDOM'); setLockedIds([]); setTeams(null); setSchedule([]); }
  const setVargasMode = () => { 
      if (!vargasPlayer) return alert("Cadastre 'Vargas'!"); 
      setMode('VS_VARGAS'); 
      if (!selectedIds.includes(vargasPlayer.id)) setSelectedIds(prev=>[...prev, vargasPlayer.id]); 
      setLockedIds([vargasPlayer.id]); setTeams(null); setSchedule([]);
  }

  const handleGenerate = async () => {
    if (selectedIds.length < 2) return alert("Selecione mais jogadores!");
    setIsLoading(true);
    const result = await generateTeamsAction(selectedIds, mode === 'VS_VARGAS' ? lockedIds : [], mode);
    setTeams(result.teams);
    setSchedule(result.schedule);
    setIsLoading(false);
  }

  const getTeamName = (index: number) => String.fromCharCode(65 + index);

  return (
    <div className="space-y-6">
      
      {/* SELETOR DE MODO */}
      <div className="grid grid-cols-2 gap-4 pb-6 border-b border-zinc-800">
        <button onClick={setRandomMode} className={`relative p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${mode === 'RANDOM' ? 'bg-zinc-800 border-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'bg-zinc-900/50 border-zinc-800 text-zinc-500'}`}>
           <span className="text-2xl">🎲</span><span className="font-bold text-sm uppercase">Vargão Aleatório</span>
        </button>
        <button onClick={setVargasMode} className={`relative p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${mode === 'VS_VARGAS' ? 'bg-zinc-800 border-yellow-500 text-white shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 'bg-zinc-900/50 border-zinc-800 text-zinc-500'}`}>
           <span className="text-2xl">👑</span><span className="font-bold text-sm uppercase">Time do Vargão</span>
        </button>
      </div>

      {/* BARRA LISTA */}
      <div className="flex justify-between items-center">
         <div className="flex items-center gap-2">
            <span className="text-zinc-400 text-xs bg-zinc-800 px-2 py-1 rounded">{selectedIds.length} Players</span>
            <button onClick={toggleSelectAll} className="text-xs text-zinc-500 hover:text-white underline">Todos/Nenhum</button>
         </div>
         {mode === 'VS_VARGAS' && <span className="text-xs text-yellow-500 font-bold bg-yellow-500/10 px-2 py-1 rounded border border-yellow-500/20">Panela: {lockedIds.length}/5</span>}
      </div>

      {/* LISTA PLAYERS */}
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
         {isLoading ? '...' : 'GERAR'}
      </button>

      {/* RESULTADOS */}
      {teams && (
        <div className="mt-8 space-y-8 animate-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
            <h2 className="text-xl font-black text-white italic transform -skew-x-6">TIMES</h2>
            <button onClick={() => {setTeams(null); setSchedule([])}} className="text-xs text-zinc-500 underline">Limpar</button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {teams.map((team, index) => {
                // VERIFICA SE O TIME TEM O VARGAS (MESMO NO RANDOM)
                const hasVargasInTeam = team.some(p => p.id === vargasPlayer?.id);
                // É Panela se for modo Panela Index 0 OU se for Random e tiver Vargas
                const isHighlight = (mode === 'VS_VARGAS' && index === 0) || (mode === 'RANDOM' && hasVargasInTeam);
                
                // Nome do time dinâmico
                let displayTitle = `TIME ${getTeamName(index)}`;
                if (mode === 'VS_VARGAS' && index === 0) displayTitle = "PANELA DO VARGÃO";
                if (mode === 'RANDOM' && hasVargasInTeam) displayTitle = `TIME ${getTeamName(index)} (VARGÃO)`;

                return (
                  <div key={index} className={`bg-zinc-900 border rounded overflow-hidden ${isHighlight ? 'border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.2)]' : 'border-zinc-700'}`}>
                    {/* CABEÇALHO DO CARD */}
                    <div className={`px-3 py-1.5 border-b flex justify-between items-center ${isHighlight ? 'bg-yellow-500 border-yellow-600' : 'bg-zinc-800 border-zinc-700'}`}>
                        <span className={`font-bold text-sm truncate pr-2 ${isHighlight ? 'text-black' : 'text-zinc-400'}`}>
                            {displayTitle}
                        </span>
                        <span className={`text-[10px] ${isHighlight ? 'text-black/70' : 'text-zinc-500'}`}>{team.length}/5</span>
                    </div>
                    {/* LISTA DO CARD */}
                    <div className="p-2 space-y-1">
                        {team.map(p => (
                             // CORRIGIDO: Se for Panela/Highlight, texto preto ou escuro para contraste no amarelo? 
                             // Não, o body do card ainda é preto (bg-zinc-900), só o header é amarelo.
                             // Então mantemos texto claro, mas destacamos o Vargas.
                             <div key={p.id} className={`text-xs font-mono truncate px-1 flex items-center gap-2 ${p.id === vargasPlayer?.id ? 'text-yellow-500 font-bold' : 'text-zinc-400'}`}>
                                 {p.id === vargasPlayer?.id && <span>👑</span>}
                                 {p.name}
                             </div>
                        ))}
                         {[...Array(5 - team.length)].map((_, i) => <div key={i} className="text-[10px] text-zinc-700 italic px-1">-- vaga --</div>)}
                    </div>
                  </div>
                )
            })}
          </div>

          {/* CRONOGRAMA */}
          {schedule.length > 0 && (
             <div className="space-y-4">
                <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest border-l-2 border-yellow-500 pl-2">JOGOS</h3>
                <div className="grid gap-3">
                    {schedule.map((match) => (
                        <div key={match.id} className={`relative p-4 rounded border flex flex-col md:flex-row items-center justify-between gap-4 ${match.isVargasGame ? 'bg-yellow-900/10 border-yellow-500/30' : 'bg-zinc-900 border-zinc-700'}`}>
                            <div className="absolute top-2 left-2 text-[10px] text-zinc-600 font-mono border border-zinc-700 px-1 rounded">JOGO 0{match.round}</div>
                            <div className="flex items-center justify-center w-full gap-4 mt-2 md:mt-0">
                                <div className={`text-right w-1/2 font-black italic text-lg ${match.team1Name.includes('VARGÃO') ? 'text-yellow-500' : 'text-blue-400'}`}>{match.team1Name}</div>
                                <span className="text-zinc-600 font-mono text-sm">VS</span>
                                <div className={`text-left w-1/2 font-black italic text-lg ${match.team2Name.includes('VARGÃO') ? 'text-yellow-500' : 'text-white'}`}>{match.team2Name}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* --- VETO DE MAPAS INTEGRADO --- */}
                {/* Só aparece se tiver times e pegamos o JOGO 01 como referência */}
                <div className="pt-8 border-t border-zinc-800">
                    <MapVeto 
                        maps={allMaps} 
                        team1Name={schedule[0]?.team1Name || "TIME A"} 
                        team2Name={schedule[0]?.team2Name || "TIME B"} 
                    />
                </div>
             </div>
          )}
        </div>
      )}
    </div>
  )
}