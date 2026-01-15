// src/components/lobby/lobby-setup.tsx
'use client'

import { PlayerList } from '../player-list'

type GameMode = 'RANDOM' | 'VS_VARGAS' | 'BRACKET' | '1V1'
type Player = { id: string; name: string; rating: number; isSub?: boolean; currentStreak?: number; }

interface LobbySetupProps {
    allPlayers: Player[]
    selectedIds: string[]
    lockedIds: string[]
    mode: GameMode
    isLoading: boolean
    setMode: (m: GameMode) => void
    onToggle: (id: string) => void
    onLock: (id: string) => void
    onDelete: (id: string) => Promise<void>
    onSelectAll: () => void
    onGenerate: () => void
    onSetVargasMode: () => void
}

export function LobbySetup({
    allPlayers, selectedIds, lockedIds, mode, isLoading,
    setMode, onToggle, onLock, onDelete, onSelectAll, onGenerate, onSetVargasMode
}: LobbySetupProps) {

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pb-6 border-b border-zinc-800">
                <button onClick={() => setMode('RANDOM')} className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${mode === 'RANDOM' ? 'bg-zinc-800 border-green-500 text-white shadow-lg' : 'bg-zinc-900/50 border-zinc-800 text-zinc-500'}`}>
                    <span className="text-xl">🎲</span><span className="font-bold text-[10px] uppercase">Aleatório</span>
                </button>
                <button onClick={onSetVargasMode} className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${mode === 'VS_VARGAS' ? 'bg-zinc-800 border-yellow-500 text-white shadow-lg' : 'bg-zinc-900/50 border-zinc-800 text-zinc-500'}`}>
                    <span className="text-xl">👑</span><span className="font-bold text-[10px] uppercase">Vargão</span>
                </button>
                <button onClick={() => setMode('BRACKET')} className={`col-span-2 md:col-span-1 p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${mode === 'BRACKET' ? 'bg-zinc-800 border-blue-500 text-white shadow-lg' : 'bg-zinc-900/50 border-zinc-800 text-zinc-500'}`}>
                    <span className="text-xl">🏆</span><span className="font-bold text-[10px] uppercase">Torneio</span>
                </button>
            </div>

            <PlayerList
                players={allPlayers}
                selectedIds={selectedIds}
                lockedIds={lockedIds}
                mode={mode}
                onToggle={onToggle}
                onLock={onLock}
                onDelete={onDelete}
                onSelectAll={onSelectAll}
            />

            <button
                onClick={onGenerate}
                disabled={isLoading || selectedIds.length < 2}
                className={`w-full font-bold py-3 px-8 rounded transition shadow-lg uppercase tracking-wider ${mode === 'VS_VARGAS' ? 'bg-yellow-600 hover:bg-yellow-500 text-black' : 'bg-green-600 hover:bg-green-500 text-white'} disabled:opacity-50`}
            >
                {isLoading ? '...' : 'GERAR TIMES & PARTIDAS'}
            </button>
        </div>
    )
}