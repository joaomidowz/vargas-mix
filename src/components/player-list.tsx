// src/components/player-list.tsx
'use client'

import { useState } from 'react'
import { AlertModal } from './alert-modal'

type Player = { id: string; name: string; rating: number | null }
type GameMode = 'RANDOM' | 'VS_VARGAS'

interface PlayerListProps {
  players: Player[]
  selectedIds: string[]
  lockedIds: string[]
  mode: GameMode
  onToggle: (id: string) => void
  onLock: (id: string) => void
  onDelete: (id: string) => Promise<void>
  onSelectAll: () => void
}

export function PlayerList({ 
  players, 
  selectedIds, 
  lockedIds, 
  mode, 
  onToggle, 
  onLock, 
  onDelete,
  onSelectAll 
}: PlayerListProps) {
  
  const [searchTerm, setSearchTerm] = useState('')
  const [playerToDelete, setPlayerToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const filteredPlayers = players.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
  
  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    const aSel = selectedIds.includes(a.id); const bSel = selectedIds.includes(b.id);
    if (aSel && !bSel) return -1; if (!aSel && bSel) return 1;
    return a.name.localeCompare(b.name);
  })

  const requestDelete = (id: string) => setPlayerToDelete(id)

  const confirmDelete = async () => {
    if (!playerToDelete) return
    setIsDeleting(true)
    await onDelete(playerToDelete)
    setIsDeleting(false)
    setPlayerToDelete(null)
  }

  return (
    <>
      <AlertModal 
        isOpen={!!playerToDelete}
        title="Remover Jogador?"
        description="O jogador será excluído permanentemente. Se ele apenas faltou hoje, desmarque-o na lista."
        confirmText="Sim, Remover"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setPlayerToDelete(null)}
      />

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col h-[500px]">
        
        <div className="p-4 border-b border-zinc-800 flex flex-col gap-4 bg-zinc-900/50">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input 
              type="text" placeholder="Buscar jogador..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 text-sm pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-zinc-600 transition"
            />
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
               <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Selecionados: <span className="text-white">{selectedIds.length}</span></span>
               {mode === 'VS_VARGAS' && <span className="text-[10px] bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded border border-yellow-500/20 font-mono">PANELA: {lockedIds.length}/5</span>}
            </div>
            <button onClick={onSelectAll} className="text-xs text-zinc-400 hover:text-white underline decoration-zinc-700 hover:decoration-white underline-offset-4 transition">{selectedIds.length === players.length ? 'Desmarcar Todos' : 'Selecionar Todos'}</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
          {sortedPlayers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {sortedPlayers.map((player) => {
                const isSelected = selectedIds.includes(player.id)
                const isLocked = lockedIds.includes(player.id)
                
                // --- LÓGICA DE PROTEÇÃO DO VARGAS ---
                const isVargas = player.name.toLowerCase().includes('vargas') || player.name.toLowerCase().includes('vargão') || player.name.toLowerCase() === 'admin';

                let containerClass = "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700"
                let iconClass = "border-zinc-700 bg-zinc-900"
                let textClass = "text-zinc-500"

                if (isSelected) {
                  containerClass = "border-zinc-600 bg-zinc-800 shadow-sm"
                  iconClass = "border-zinc-500 bg-zinc-600 text-white"
                  textClass = "text-zinc-200"
                }

                if (isLocked) {
                  containerClass = "border-yellow-500/50 bg-yellow-500/10"
                  iconClass = "border-yellow-500 bg-yellow-500 text-black"
                  textClass = "text-yellow-500 font-bold"
                }

                // Se for o Vargas, damos um destaque sutil mesmo desmarcado
                if (isVargas && !isSelected) {
                    textClass = "text-yellow-600/70 font-medium"
                }

                return (
                  <div key={player.id} onClick={() => onToggle(player.id)} className={`group flex items-center justify-between p-2 rounded border transition-all cursor-pointer select-none h-[42px] ${containerClass}`}>
                    <div className="flex items-center gap-2 overflow-hidden w-full">
                      <div className={`w-4 h-4 min-w-[16px] rounded flex items-center justify-center border transition-colors ${iconClass}`}>
                        {isSelected && <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                      </div>
                      
                      <span className={`text-xs truncate ${textClass} flex items-center gap-1 w-full`}>
                        {(isLocked || isVargas) && <span>👑</span>} 
                        {player.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 ml-1">
                       {/* LÓGICA DE CADEADO DA PANELA */}
                       {mode === 'VS_VARGAS' && isSelected && (
                          <button onClick={(e) => { e.stopPropagation(); onLock(player.id) }} className={`p-1 rounded hover:bg-black/20 transition ${isLocked ? 'text-yellow-500' : 'text-zinc-600 hover:text-yellow-500 opacity-0 group-hover:opacity-100'}`} title={isLocked ? "Remover da Panela" : "Adicionar à Panela"}>
                             <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                          </button>
                       )}
                       
                       {/* LÓGICA DE EXCLUSÃO (PROTEÇÃO DO VARGAS) */}
                       {!isSelected && (
                          isVargas ? (
                             // SE FOR O VARGAS, MOSTRA ESCUDO E BLOQUEIA CLICK
                             <div className="p-1 text-zinc-700 cursor-not-allowed opacity-50" title="Este jogador não pode ser excluído">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                             </div>
                          ) : (
                             // SE FOR MORTAL COMUM, MOSTRA LIXEIRA NO HOVER
                             <button 
                                onClick={(e) => { e.stopPropagation(); requestDelete(player.id) }} 
                                className="p-1 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded transition opacity-0 group-hover:opacity-100" 
                                title="Excluir Jogador"
                             >
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                             </button>
                          )
                       )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-zinc-600 gap-2">
              <span className="text-sm">Nenhum jogador encontrado</span>
            </div>
          )}
        </div>
      </div>
    </>
  )
}