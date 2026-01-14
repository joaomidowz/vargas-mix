// src/components/map-veto.tsx
'use client'

import { useState, useEffect } from 'react'

type MapData = { id: string; name: string; imageUrl: string | null }

export function MapVeto({ 
  maps, 
  team1Name = "TIME A", 
  team2Name = "TIME B" 
}: { 
  maps: MapData[], 
  team1Name?: string, 
  team2Name?: string 
}) {
  const [bannedMaps, setBannedMaps] = useState<string[]>([])
  const [turn, setTurn] = useState<'A' | 'B' | null>(null)
  const [winnerMap, setWinnerMap] = useState<MapData | null>(null)

  // Reseta automaticamente se os times mudarem
  useEffect(() => {
    resetVeto()
  }, [team1Name, team2Name])

  const resetVeto = () => {
    setBannedMaps([])
    setTurn(null)
    setWinnerMap(null)
  }

  const startVeto = () => {
    setBannedMaps([])
    setWinnerMap(null)
    const starter = Math.random() > 0.5 ? 'A' : 'B'
    setTurn(starter)
  }

  const handleBan = (map: MapData) => {
    if (!turn || winnerMap || bannedMaps.includes(map.id)) return
    const newBanned = [...bannedMaps, map.id]
    setBannedMaps(newBanned)
    if (newBanned.length === maps.length - 1) {
      setWinnerMap(maps.find(m => !newBanned.includes(m.id)) || null)
      setTurn(null)
    } else {
      setTurn(turn === 'A' ? 'B' : 'A')
    }
  }

  const currentBannerName = turn === 'A' ? team1Name : team2Name;
  const currentBannerColor = turn === 'A' ? 'text-blue-400' : 'text-yellow-500';

  return (
    <div className="w-full space-y-4 relative">
      <div className="flex justify-between items-end border-b border-zinc-800 pb-2">
        <h2 className="text-xl font-bold text-zinc-300">MAP VETO</h2>
        
        <div className="flex items-center gap-4">
            {/* BOTÃO RESETAR SEMPRE VISÍVEL */}
            <button 
                onClick={resetVeto}
                className="text-xs text-zinc-500 hover:text-red-400 underline decoration-dotted underline-offset-4"
            >
                Resetar Veto
            </button>

            <div className="font-mono text-sm">
                {!turn && !winnerMap ? (
                    <button onClick={startVeto} className="bg-zinc-100 hover:bg-white text-black font-bold px-4 py-1 rounded animate-pulse">
                        INICIAR
                    </button>
                ) : winnerMap ? (
                    <span className="text-green-500 font-bold uppercase">DEFINIDO</span>
                ) : (
                    <div className="flex items-center gap-2 bg-zinc-950 px-3 py-1 rounded border border-zinc-800">
                        <span className="text-zinc-500 text-xs">VEZ DE:</span>
                        <span className={`font-black text-sm uppercase ${currentBannerColor} max-w-[150px] truncate`}>
                            {currentBannerName}
                        </span>
                    </div>
                )}
            </div>
        </div>
      </div>

      {winnerMap && (
          <div className="bg-green-500/20 border border-green-500/50 p-4 rounded text-center animate-in zoom-in">
              <p className="text-green-400 text-sm uppercase tracking-widest mb-1">MAPA DO JOGO</p>
              <p className="text-4xl font-black text-white italic">{winnerMap.name}</p>
          </div>
      )}

      <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 ${!turn && !winnerMap ? 'opacity-50 pointer-events-none' : ''}`}>
        {maps.map((map) => {
          const isBanned = bannedMaps.includes(map.id)
          const isWinner = winnerMap?.id === map.id
          return (
            <button
              key={map.id}
              onClick={() => handleBan(map)}
              disabled={isBanned || !!winnerMap}
              className={`relative w-full aspect-video rounded-lg overflow-hidden border-2 transition-all group ${isWinner ? 'border-green-500 scale-105 z-10' : ''} ${isBanned ? 'border-red-900/30 grayscale opacity-40' : 'border-zinc-800 hover:scale-[1.02]'} ${!isBanned && !isWinner && turn === 'A' ? 'hover:border-blue-500' : ''} ${!isBanned && !isWinner && turn === 'B' ? 'hover:border-yellow-500' : ''}`}
            >
              {map.imageUrl ? <img src={map.imageUrl} className="absolute inset-0 w-full h-full object-cover" /> : <div className="bg-zinc-800 absolute inset-0"/>}
              <div className="absolute inset-0 bg-black/40" />
              <div className="absolute bottom-2 left-0 right-0 text-center"><span className={`text-lg font-black uppercase shadow-black drop-shadow-md text-white ${isBanned && 'line-through text-zinc-500'}`}>{map.name}</span></div>
              {isBanned && <div className="absolute inset-0 flex items-center justify-center"><span className="text-red-600/80 text-5xl font-black">X</span></div>}
            </button>
          )
        })}
      </div>
    </div>
  )
}