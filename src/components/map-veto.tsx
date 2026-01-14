// Arquivo: src/components/map-veto.tsx
'use client'

import { useState } from 'react'

type MapData = {
    id: string
    name: string
    imageUrl: string | null
}

export function MapVeto({ maps }: { maps: MapData[] }) {
    const [bannedMaps, setBannedMaps] = useState<string[]>([])

    const toggleBan = (id: string) => {
        if (bannedMaps.includes(id)) {
            setBannedMaps(bannedMaps.filter((mapId) => mapId !== id))
        } else {
            setBannedMaps([...bannedMaps, id])
        }
    }

    const remaining = maps.length - bannedMaps.length

    return (
        <div className="w-full space-y-4">
            <div className="flex justify-between items-end">
                <h2 className="text-xl font-semibold text-zinc-300 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-500"><circle cx="12" cy="12" r="10" /><line x1="4.93" x2="19.07" y1="4.93" y2="19.07" /></svg>
                    Fase de Veto
                </h2>
                <span className="text-sm bg-zinc-800 px-3 py-1 rounded-full text-yellow-500 font-mono border border-zinc-700">
                    Restam: {remaining}
                </span>
            </div>

            {/* Grid ajustado para aspect-ratio 16/9 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {maps.map((map) => {
                    const isBanned = bannedMaps.includes(map.id)

                    return (
                        <button
                            key={map.id}
                            onClick={() => toggleBan(map.id)}
                            // MUDANÇA AQUI: Removemos h-32/h-40 e usamos aspect-video
                            className={`
                relative w-full aspect-video rounded-lg overflow-hidden border-2 transition-all duration-300 group shadow-lg
                ${isBanned
                                    ? 'border-red-900/50 scale-95 opacity-40 grayscale'
                                    : 'border-zinc-800 hover:border-yellow-500/80 hover:scale-[1.02] hover:shadow-yellow-500/20'}
              `}
                        >
                            {/* Imagem com fallback caso o caminho esteja errado */}
                            {map.imageUrl ? (
                                <img
                                    src={map.imageUrl}
                                    alt={map.name}
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                            ) : (
                                <div className="absolute inset-0 bg-zinc-800 flex items-center justify-center text-zinc-600">Sem Imagem</div>
                            )}


                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                            <div className="absolute bottom-3 left-0 right-0 text-center">
                                <span className={`
                  text-lg font-black tracking-widest uppercase drop-shadow-md
                  ${isBanned ? 'text-red-400 line-through decoration-4 decoration-red-600' : 'text-white'}
                `}>
                                    {map.name}
                                </span>
                            </div>

                            {isBanned && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none backdrop-blur-[2px]">
                                    <span className="text-red-600/80 text-7xl font-black rotate-12 drop-shadow-2xl">
                                        X
                                    </span>
                                </div>
                            )}
                        </button>
                    )
                })}
            </div>

            {bannedMaps.length > 0 && (
                <div className="flex justify-end">
                    <button
                        onClick={() => setBannedMaps([])}
                        className="text-xs text-zinc-400 hover:text-yellow-500 transition flex items-center gap-1"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 12" /></svg>
                        Resetar Vetos
                    </button>
                </div>
            )}
        </div>
    )
}