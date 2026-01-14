// src/components/lobby-manager.tsx
'use client'

import { useState } from 'react'
import { generateTeamsAction, deletePlayer } from '@/app/actions'

// ... (Tipos e Imports mantidos iguais) ...
type Player = { id: string; name: string; rating: number | null }

export function LobbyManager({ allPlayers }: { allPlayers: Player[] }) {
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [teams, setTeams] = useState<Player[][] | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    // Lógica de Vargão / Selecionar Todos igual ao anterior
    const vargasPlayer = allPlayers.find(p => p.name.toLowerCase().includes('vargas'))
    const isVargasSelected = vargasPlayer ? selectedIds.includes(vargasPlayer.id) : false

    const togglePlayer = (id: string) => {
        selectedIds.includes(id) ? setSelectedIds(selectedIds.filter(pid => pid !== id)) : setSelectedIds([...selectedIds, id])
    }

    const toggleSelectAll = () => {
        selectedIds.length === allPlayers.length ? setSelectedIds([]) : setSelectedIds(allPlayers.map(p => p.id))
    }

    const toggleVargas = () => {
        if (!vargasPlayer) return alert('Cadastre um jogador "Vargas"!')
        togglePlayer(vargasPlayer.id)
    }

    const handleGenerate = async () => {
        if (selectedIds.length < 2) return alert("Mínimo 2 players!")
        setIsLoading(true)
        const result = await generateTeamsAction(selectedIds)
        setTeams(result)
        setIsLoading(false)
    }

    const getTeamName = (index: number) => String.fromCharCode(65 + index); // A, B, C...

    return (
        <div className="space-y-6">

            {/* BARRA DE CONTROLE (Botões) */}
            <div className="flex flex-wrap gap-3 items-center justify-between pb-4 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                    <span className="text-zinc-400 font-mono text-sm bg-zinc-800 px-2 py-1 rounded">{selectedIds.length}/{allPlayers.length}</span>
                    <button onClick={toggleSelectAll} className="text-xs font-semibold text-zinc-500 hover:text-white transition px-2 py-1 rounded hover:bg-zinc-800">
                        {selectedIds.length === allPlayers.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                    </button>
                </div>
                <button onClick={toggleVargas} disabled={!vargasPlayer} className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold transition border ${isVargasSelected ? 'bg-yellow-500 text-black border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.4)]' : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-yellow-500/50 hover:text-yellow-500'}`}>
                    👑 {isVargasSelected ? 'Vargão On' : 'Invocar Vargão'}
                </button>
            </div>

            {/* LISTA DE JOGADORES (Checkboxes) */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {allPlayers.map((player) => {
                    const isSelected = selectedIds.includes(player.id)
                    const isVargas = player.id === vargasPlayer?.id
                    return (
                        <div key={player.id} onClick={() => togglePlayer(player.id)} className={`flex items-center justify-between p-2 rounded cursor-pointer transition select-none text-xs border ${isSelected ? (isVargas ? 'bg-yellow-500/20 border-yellow-500' : 'bg-zinc-800 border-zinc-600') : 'bg-zinc-900/50 border-zinc-800/50 hover:border-zinc-700'}`}>
                            <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded border flex items-center justify-center ${isSelected ? (isVargas ? 'bg-yellow-500 border-yellow-500' : 'bg-zinc-600 border-zinc-600') : 'border-zinc-700'}`}>
                                    {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                </div>
                                <span className={`font-medium ${isSelected ? 'text-white' : 'text-zinc-500'} ${isVargas ? 'font-bold text-yellow-500' : ''}`}>{player.name}</span>
                            </div>
                        </div>
                    )
                })}
            </div>

            <div className="flex justify-center pt-2">
                <button onClick={handleGenerate} disabled={isLoading || selectedIds.length < 2} className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-8 rounded transition shadow-lg w-full md:w-auto">
                    {isLoading ? 'Sorteando...' : 'GERAR TIMES'}
                </button>
            </div>

            {/* --- TIMES GERADOS (ESTILO GRID MENOR + BANNER VS) --- */}
            {teams && (
                <div className="mt-8 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-black text-white italic transform -skew-x-6">RESULTADO</h2>
                        <button onClick={() => setTeams(null)} className="text-xs text-zinc-500 underline">Limpar</button>
                    </div>

                    {/* GRID DE TIMES (Quadradinhos menores) */}
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                        {teams.map((team, index) => (
                            <div key={index} className="bg-zinc-900 border border-zinc-700 rounded overflow-hidden">
                                <div className={`px-3 py-1.5 border-b border-zinc-800 flex justify-between items-center ${index === 0 ? 'bg-blue-900/20' : index === 1 ? 'bg-yellow-900/20' : 'bg-zinc-800'}`}>
                                    <span className={`font-bold text-sm ${index === 0 ? 'text-blue-400' : index === 1 ? 'text-yellow-500' : 'text-zinc-400'}`}>TIME {getTeamName(index)}</span>
                                    <span className="text-[10px] text-zinc-500">{team.length}/5</span>
                                </div>
                                <div className="p-2 space-y-1">
                                    {team.map(p => (
                                        <div key={p.id} className="text-xs text-zinc-300 font-mono truncate px-1">
                                            • {p.name}
                                        </div>
                                    ))}
                                    {[...Array(5 - team.length)].map((_, i) => (
                                        <div key={i} className="text-[10px] text-zinc-700 font-mono italic px-1">-- vazio --</div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* --- BANNER DE CONFRONTO (Seu código) --- */}
                    {teams.length >= 2 && (
                        <div className="mt-6 bg-gradient-to-r from-blue-900/20 to-yellow-900/20 p-4 rounded border border-zinc-700 text-center relative overflow-hidden group">
                            {/* Efeito de luz passando */}
                            <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-10 group-hover:animate-shine" />

                            <h3 className="text-xs text-zinc-400 uppercase tracking-[0.3em] mb-3">Próximo Jogo</h3>
                            <div className="flex items-center justify-center gap-6 text-3xl font-black italic">
                                <span className="text-blue-500 drop-shadow-lg">TIME A</span>
                                <span className="text-zinc-600 text-lg not-italic font-mono">VS</span>
                                <span className="text-yellow-500 drop-shadow-lg">TIME B</span>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}