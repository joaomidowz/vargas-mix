// src/components/map-veto.tsx
'use client'

import { useState, useEffect } from 'react'

type MapData = { id: string; name: string; imageUrl: string | null }

export function MapVeto({ 
  maps, 
  team1Name, 
  team2Name,
  onMapDecided // <--- NOVA PROPRIEDADE: Avisa quando acabou
}: { 
  maps: MapData[], 
  team1Name: string, 
  team2Name: string,
  onMapDecided: (mapName: string) => void
}) {
  const [bannedMaps, setBannedMaps] = useState<string[]>([])
  const [turn, setTurn] = useState<'A' | 'B' | null>(null)
  const [winnerMap, setWinnerMap] = useState<MapData | null>(null)

  // Quando houver um vencedor, avisa o componente pai
  useEffect(() => {
    if (winnerMap) {
        onMapDecided(winnerMap.name)
    }
  }, [winnerMap, onMapDecided])

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
    
    // Se sobrou só 1
    if (newBanned.length === maps.length - 1) {
      const winner = maps.find(m => !newBanned.includes(m.id))
      setWinnerMap(winner || null)
      setTurn(null)
    } else {
      setTurn(turn === 'A' ? 'B' : 'A')
    }
  }

  // Se já tiver mapa decidido, mostramos só ele grande
  if (winnerMap) {
      return (
        <div className="w-full text-center animate-in zoom-in duration-500">
            <h3 className="text-zinc-500 text-sm uppercase tracking-widest mb-2">MAPA DEFINIDO</h3>
            <div className="relative w-full aspect-video md:h-64 md:w-auto mx-auto rounded-xl overflow-hidden border-2 border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.3)] group">
                {winnerMap.imageUrl && <img src={winnerMap.imageUrl} className="absolute inset-0 w-full h-full object-cover" />}
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <span className="text-5xl md:text-6xl font-black text-white italic drop-shadow-lg uppercase">{winnerMap.name}</span>
                </div>
            </div>
        </div>
      )
  }

  // Renderização normal do Veto
  const currentBannerName = turn === 'A' ? team1Name : team2Name;
  const currentBannerColor = turn === 'A' ? 'text-blue-400' : 'text-yellow-500';

  return (
    <div className="w-full space-y-4">
      <div className="flex justify-between items-end border-b border-zinc-800 pb-2">
        <h2 className="text-xl font-bold text-zinc-300">MAP VETO</h2>
        <div className="font-mono text-sm">
            {!turn ? (
                <button onClick={startVeto} className="bg-zinc-100 hover:bg-white text-black font-bold px-4 py-1 rounded animate-pulse">
                    INICIAR VETO
                </button>
            ) : (
                <div className="flex items-center gap-2 bg-zinc-950 px-3 py-1 rounded border border-zinc-800">
                    <span className="text-zinc-500 text-xs">BANINDO:</span>
                    <span className={`font-black text-sm uppercase ${currentBannerColor} max-w-[150px] truncate`}>
                        {currentBannerName}
                    </span>
                </div>
            )}
        </div>
      </div>

      <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 ${!turn ? 'opacity-50 pointer-events-none' : ''}`}>
        {maps.map((map) => {
          const isBanned = bannedMaps.includes(map.id)
          return (
            <button
              key={map.id}
              onClick={() => handleBan(map)}
              disabled={isBanned}
              className={`relative w-full aspect-video rounded-lg overflow-hidden border-2 transition-all ${isBanned ? 'border-red-900/30 grayscale opacity-40' : 'border-zinc-800 hover:scale-[1.02] hover:border-zinc-500'}`}
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