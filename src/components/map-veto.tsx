// src/components/map-veto.tsx
'use client'

import { useState } from 'react'

type MapData = { id: string; name: string; imageUrl: string | null }

export function MapVeto({ maps }: { maps: MapData[] }) {
    const [bannedMaps, setBannedMaps] = useState<string[]>([])
    const [turn, setTurn] = useState<'A' | 'B' | null>(null) // Quem está banindo agora?
    const [winnerMap, setWinnerMap] = useState<MapData | null>(null)

    // Iniciar o Sorteio de Lados
    const startVeto = () => {
        setBannedMaps([])
        setWinnerMap(null)
        // Randomiza 50/50 quem começa
        const starter = Math.random() > 0.5 ? 'A' : 'B'
        setTurn(starter)
    }

    const handleBan = (map: MapData) => {
        if (!turn || winnerMap || bannedMaps.includes(map.id)) return

        const newBanned = [...bannedMaps, map.id]
        setBannedMaps(newBanned)

        // Verifica se sobrou só 1
        if (newBanned.length === maps.length - 1) {
            const winner = maps.find(m => !newBanned.includes(m.id))
            setWinnerMap(winner || null)
            setTurn(null) // Acabou o jogo
        } else {
            // Passa a vez
            setTurn(turn === 'A' ? 'B' : 'A')
        }
    }

    const remaining = maps.length - bannedMaps.length

    return (
        <div className="w-full space-y-4">
            {/* HEADER DO VETO */}
            <div className="flex justify-between items-end border-b border-zinc-800 pb-2">
                <h2 className="text-xl font-bold text-zinc-300 flex items-center gap-2">
                    MAP VETO
                </h2>

                {/* Mostrador de Turno */}
                <div className="font-mono text-sm">
                    {!turn && !winnerMap ? (
                        <button
                            onClick={startVeto}
                            className="bg-zinc-100 hover:bg-white text-black font-bold px-4 py-1 rounded transition animate-pulse"
                        >
                            INICIAR SORTEIO DE LADOS
                        </button>
                    ) : winnerMap ? (
                        <span className="text-green-500 font-bold uppercase">MAPA DEFINIDO</span>
                    ) : (
                        <div className="flex items-center gap-2 bg-zinc-950 px-3 py-1 rounded border border-zinc-800">
                            <span className="text-zinc-500 text-xs">BANINDO:</span>
                            <span className={`font-black text-lg ${turn === 'A' ? 'text-blue-500' : 'text-yellow-500'}`}>
                                TIME {turn}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* MENSAGEM DE VITÓRIA DO MAPA */}
            {winnerMap && (
                <div className="bg-green-500/20 border border-green-500/50 p-4 rounded text-center animate-in zoom-in duration-300">
                    <p className="text-green-400 text-sm uppercase tracking-widest mb-1">O MAPA ESCOLHIDO FOI</p>
                    <p className="text-4xl font-black text-white italic">{winnerMap.name}</p>
                </div>
            )}

            {/* GRID DE MAPAS */}
            <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 ${!turn && !winnerMap ? 'opacity-50 pointer-events-none' : ''}`}>
                {maps.map((map) => {
                    const isBanned = bannedMaps.includes(map.id)
                    const isWinner = winnerMap?.id === map.id

                    return (
                        <button
                            key={map.id}
                            onClick={() => handleBan(map)}
                            disabled={isBanned || !!winnerMap}
                            className={`
                relative w-full aspect-video rounded-lg overflow-hidden border-2 transition-all duration-300 group
                ${isWinner ? 'border-green-500 ring-4 ring-green-500/20 scale-105 z-10' : ''}
                ${isBanned
                                    ? 'border-red-900/30 grayscale opacity-40 cursor-not-allowed'
                                    : 'border-zinc-800 hover:scale-[1.02] cursor-pointer'}
                ${!isBanned && !isWinner && turn === 'A' ? 'hover:border-blue-500 hover:shadow-[0_0_15px_rgba(59,130,246,0.4)]' : ''}
                ${!isBanned && !isWinner && turn === 'B' ? 'hover:border-yellow-500 hover:shadow-[0_0_15px_rgba(234,179,8,0.4)]' : ''}
              `}
                        >
                            {/* Imagem */}
                            {map.imageUrl ? (
                                <img src={map.imageUrl} alt={map.name} className="absolute inset-0 w-full h-full object-cover" />
                            ) : (
                                <div className="absolute inset-0 bg-zinc-800 flex items-center justify-center text-zinc-600">Sem Foto</div>
                            )}

                            {/* Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />

                            {/* Nome */}
                            <div className="absolute bottom-2 left-0 right-0 text-center">
                                <span className={`text-lg font-black tracking-widest uppercase shadow-black drop-shadow-md ${isBanned ? 'text-zinc-600 line-through' : 'text-white'}`}>
                                    {map.name}
                                </span>
                            </div>

                            {/* Marca de Banido */}
                            {isBanned && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[1px]">
                                    <span className="text-red-600/80 text-5xl font-black rotate-12">X</span>
                                </div>
                            )}
                        </button>
                    )
                })}
            </div>

            {/* Botão Resetar */}
            {(bannedMaps.length > 0 || winnerMap) && (
                <div className="flex justify-center pt-2">
                    <button onClick={() => { setBannedMaps([]); setTurn(null); setWinnerMap(null); }} className="text-xs text-zinc-500 hover:text-white underline">
                        Reiniciar Vetos
                    </button>
                </div>
            )}
        </div>
    )
}