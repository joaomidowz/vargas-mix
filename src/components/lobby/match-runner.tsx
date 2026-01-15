// src/components/lobby/match-runner.tsx
'use client'

import { useState } from 'react' // Import useState
import { MapVeto } from '../map-veto'
import { saveMatchResultAction } from '@/app/actions'

// ... (Types remain the same) ...
type Player = { id: string; name: string; rating: number; isSub?: boolean; }
type ScheduleItem = {
    id: string; round: number; team1Name: string; team2Name: string;
    team1Index: number; team2Index: number;
}

interface MatchRunnerProps {
  currentMatch: ScheduleItem
  teams: Player[][]
  allMaps: any[]
  activeMatchIndex: number
  decidedMap: string | null
  bracketWinners: { semi1: Player[] | null, semi2: Player[] | null }
  mode: string
  setDecidedMap: (map: string | null) => void
  setBracketWinners: (winners: any) => void
  onMatchComplete: (winner: Player[] | null) => void
  onRedoVeto: () => void
}

// ... (Helper function remains the same) ...
function getTeamDisplayName(team: Player[] | null, defaultName: string) {
    if (!team || team.length === 0) return defaultName;
    const vargas = team.find(p => p.name.toLowerCase().includes('vargas') || p.name.toLowerCase().includes('vargão'));
    if (vargas) return "TEAM VARGÃO";
    return `TEAM ${team[0].name.toUpperCase()}`;
}

export function MatchRunner({
  currentMatch, teams, allMaps, activeMatchIndex, decidedMap, bracketWinners, mode,
  setDecidedMap, onMatchComplete, setBracketWinners, onRedoVeto
}: MatchRunnerProps) {

  // New state to force MapVeto re-render
  const [vetoKey, setVetoKey] = useState(0);

  const handleInternalRedo = () => {
      onRedoVeto(); // Call parent to clear map choice
      setVetoKey(prev => prev + 1); // Increment key to force MapVeto reset
  }

  const isFinal = currentMatch.team1Index === -1

  const leftName = isFinal 
      ? getTeamDisplayName(bracketWinners.semi1, "AGUARDANDO...") 
      : currentMatch.team1Name;

  const rightName = isFinal 
      ? getTeamDisplayName(bracketWinners.semi2, "AGUARDANDO...") 
      : currentMatch.team2Name;

  const currentMapImage = allMaps.find(m => m.name === decidedMap)?.imageUrl;
  const showStandardHeader = !decidedMap;

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden shadow-2xl relative transition-all">
        <div className={`absolute top-0 left-0 w-1 h-full z-20 ${isFinal ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></div>
        
        {showStandardHeader && (
            <>
                <div className="flex justify-between items-center border-b border-zinc-800 pb-4 p-6 bg-zinc-900 z-10 relative">
                    <h2 className="text-xl font-black text-white italic transform -skew-x-6">
                        {isFinal ? '🏆 GRANDE FINAL' : 'PARTIDA EM ANDAMENTO'}
                    </h2>
                    <span className="bg-green-500 text-white font-bold px-3 py-1 rounded text-sm animate-pulse">JOGO {activeMatchIndex + 1}</span>
                </div>

                <div className="flex items-center justify-center gap-4 md:gap-12 py-6 bg-zinc-900 z-10 relative">
                    <div className={`text-right w-1/2 font-black italic text-2xl md:text-3xl ${leftName.includes('VARGÃO') ? 'text-yellow-500' : 'text-blue-500'}`}>
                        {leftName}
                    </div>
                    <span className="text-zinc-700 font-mono text-xl">VS</span>
                    <div className={`text-left w-1/2 font-black italic text-2xl md:text-3xl ${rightName.includes('VARGÃO') ? 'text-yellow-500' : 'text-white'}`}>
                        {rightName}
                    </div>
                </div>

                {isFinal && (
                    <div className="grid grid-cols-2 gap-4 text-center text-xs text-zinc-400 bg-black/20 p-2 mx-6 rounded border border-zinc-800/50 mb-6 z-10 relative">
                        <div>
                            <p className="font-bold text-blue-400 mb-1">ELENCO {leftName}</p>
                            {bracketWinners.semi1 ? bracketWinners.semi1.map(p => p.name).join(', ') : <span className="italic opacity-50">Definindo...</span>}
                        </div>
                        <div>
                            <p className="font-bold text-white mb-1">ELENCO {rightName}</p>
                            {bracketWinners.semi2 ? bracketWinners.semi2.map(p => p.name).join(', ') : <span className="italic opacity-50">Definindo...</span>}
                        </div>
                    </div>
                )}
            </>
        )}

        {!decidedMap ? (
            <div className="p-6 bg-black/20 border-t border-zinc-800 relative z-10">
                {/* KEY PROP ADDED HERE */}
                <MapVeto 
                    key={`${currentMatch.id}-${vetoKey}`} 
                    maps={allMaps} 
                    team1Name={leftName} 
                    team2Name={rightName} 
                    onMapDecided={setDecidedMap} 
                />
            </div>
        ) : (
            <div className="relative w-full overflow-hidden">
                {currentMapImage && (
                    <div className="absolute inset-0 z-0">
                        <img src={currentMapImage} alt="Map Background" className="w-full h-full object-cover opacity-50 blur-[1px] scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/80"></div>
                    </div>
                )}

                <form 
                    action={async (formData) => {
                        const score1 = Number(formData.get('score1'));
                        const score2 = Number(formData.get('score2'));
                        const mapName = formData.get('mapName') as string;

                        let t1Players: Player[] = []; let t2Players: Player[] = [];
                        if (isFinal) {
                            if (bracketWinners.semi1) t1Players = bracketWinners.semi1;
                            if (bracketWinners.semi2) t2Players = bracketWinners.semi2;
                        } else {
                            if (currentMatch.team1Index >= 0 && teams[currentMatch.team1Index]) t1Players = teams[currentMatch.team1Index];
                            if (currentMatch.team2Index >= 0 && teams[currentMatch.team2Index]) t2Players = teams[currentMatch.team2Index];
                        }
                        const winnerPlayers = score1 > score2 ? t1Players : t2Players;
                        if (mode === 'BRACKET') {
                            if (activeMatchIndex === 0) setBracketWinners((prev: any) => ({ ...prev, semi1: winnerPlayers }));
                            if (activeMatchIndex === 1) setBracketWinners((prev: any) => ({ ...prev, semi2: winnerPlayers }));
                        }
                        await saveMatchResultAction({
                            team1Name: leftName, team2Name: rightName, score1, score2, mapName,
                            team1Ids: t1Players.map(p => p.id), team2Ids: t2Players.map(p => p.id),
                            roster1Names: t1Players.map(p => p.name).join(','), roster2Names: t2Players.map(p => p.name).join(',')
                        });
                        onMatchComplete(winnerPlayers);
                    }}
                    className="relative z-10 flex flex-col items-center justify-center gap-8 py-12 px-4"
                >
                    <input type="hidden" name="mapName" value={decidedMap} />
                    
                    <div className="flex flex-col items-center gap-2 animate-in slide-in-from-top-4">
                        <span className="text-zinc-400 font-bold uppercase tracking-[0.3em] text-xs drop-shadow-md">Mapa Decidido</span>
                        <div className="flex items-center gap-3">
                            <h1 className="text-4xl md:text-5xl font-black text-white italic uppercase drop-shadow-2xl tracking-wider">
                                {decidedMap}
                            </h1>
                            <button 
                                type="button" 
                                onClick={handleInternalRedo} // Changed to local handler
                                className="group flex items-center justify-center w-8 h-8 bg-red-500/20 text-red-400 hover:bg-red-600 hover:text-white rounded-full border border-red-500/30 transition-all"
                                title="Refazer Veto"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-rotate-90 transition-transform"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                            </button>
                        </div>
                    </div>

                    <div className="flex w-full items-end justify-center gap-4 md:gap-16 animate-in zoom-in-95 duration-500">
                        <div className="flex flex-col items-center gap-4 flex-1">
                            <div className={`font-black italic text-2xl md:text-4xl text-center drop-shadow-lg ${leftName.includes('VARGÃO') ? 'text-yellow-500' : 'text-blue-400'}`}>
                                {leftName}
                            </div>
                            <input 
                                name="score1" 
                                type="number" 
                                min="0" 
                                placeholder="0"
                                className="bg-black/40 border-4 border-zinc-800/80 text-white text-7xl md:text-8xl font-black p-4 rounded-2xl w-full md:w-48 text-center focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all shadow-2xl backdrop-blur-md placeholder:text-zinc-700/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                                required 
                                autoFocus 
                            />
                        </div>

                        <div className="text-zinc-600 font-mono text-4xl md:text-6xl font-black pb-6 opacity-50">VS</div>

                        <div className="flex flex-col items-center gap-4 flex-1">
                            <div className={`font-black italic text-2xl md:text-4xl text-center drop-shadow-lg ${rightName.includes('VARGÃO') ? 'text-yellow-500' : 'text-white'}`}>
                                {rightName}
                            </div>
                            <input 
                                name="score2" 
                                type="number" 
                                min="0" 
                                placeholder="0"
                                className={`bg-black/40 border-4 border-zinc-800/80 text-white text-7xl md:text-8xl font-black p-4 rounded-2xl w-full md:w-48 text-center focus:outline-none focus:ring-4 transition-all shadow-2xl backdrop-blur-md placeholder:text-zinc-700/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${rightName.includes('VARGÃO') ? 'focus:border-yellow-500 focus:ring-yellow-500/20' : 'focus:border-white focus:ring-white/20'}`}
                                required 
                            />
                        </div>
                    </div>

                    <button type="submit" className="bg-green-600 hover:bg-green-500 text-white font-black py-4 px-16 rounded-xl shadow-lg shadow-green-900/30 uppercase tracking-[0.2em] transition hover:scale-105 active:scale-95 mt-6 text-lg animate-in slide-in-from-bottom-4 border-b-4 border-green-800 hover:border-green-700">
                        Confirmar Resultado
                    </button>
                </form>
            </div>
        )}
    </div>
  )
}