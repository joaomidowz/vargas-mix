// src/components/history-list.tsx
'use client'

import { useState } from 'react'
import { deleteMatchAction } from '@/app/actions'
import { AlertModal } from './alert-modal' // <--- Importe o componente novo

type Match = {
    id: string;
    date: string | null;
    mapName: string | null;
    team1Name: string | null;
    team2Name: string | null;
    score1: number | null;
    score2: number | null;
    roster1: string | null;
    roster2: string | null;
}

export function HistoryList({ history }: { history: Match[] }) {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // Estado que controla qual ID está sendo deletado no momento (abre o modal)
    const [matchToDelete, setMatchToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    }

    // 1. Ao clicar no botão de lixeira, apenas setamos o ID no estado
    const requestDelete = (id: string) => {
        setMatchToDelete(id);
    }

    // 2. A função real que o Modal vai chamar
    const confirmDelete = async () => {
        if (!matchToDelete) return;

        setIsDeleting(true);
        await deleteMatchAction(matchToDelete);
        setIsDeleting(false);
        setMatchToDelete(null); // Fecha o modal
    }

    return (
        <>
            {/* Componente de Modal (Fica invisível até ter um matchToDelete) */}
            <AlertModal
                isOpen={!!matchToDelete}
                title="Excluir Partida?"
                description="Essa ação é irreversível. O histórico dessa partida será apagado permanentemente."
                onConfirm={confirmDelete}
                onCancel={() => setMatchToDelete(null)}
                isLoading={isDeleting}
                confirmText="Sim, Excluir"
                variant="danger"
            />

            <div className="grid gap-3">
                {history.map((match) => {
                    const isTeam1Win = (match.score1 || 0) > (match.score2 || 0);
                    const isOpen = expandedId === match.id;

                    const roster1List = match.roster1 && match.roster1 !== "Ver detalhes" ? match.roster1.split(',') : [];
                    const roster2List = match.roster2 && match.roster2 !== "Ver detalhes" ? match.roster2.split(',') : [];

                    return (
                        <div key={match.id} className={`bg-zinc-900/40 border rounded-lg transition overflow-hidden ${isOpen ? 'border-zinc-600 bg-zinc-900' : 'border-zinc-800 hover:border-zinc-700'}`}>

                            {/* CABEÇALHO (Igual ao anterior) */}
                            <div className="p-4 flex flex-col md:flex-row items-center justify-between gap-4 cursor-pointer select-none" onClick={() => toggleExpand(match.id)}>
                                {/* ... (Conteúdo visual do card mantido igual) ... */}
                                {/* ... (Pode manter o código do card que você já tem aqui) ... */}

                                {/* Vou resumir o card pra focar na lógica, mantenha seu layout visual: */}
                                <div className="flex flex-col items-center md:items-start min-w-[100px]">
                                    <span className="text-xs text-zinc-500 font-mono">{match.date ? new Date(match.date).toLocaleDateString('pt-BR') : '-'}</span>
                                    <span className="text-sm font-bold text-zinc-300 uppercase bg-zinc-800 px-2 rounded mt-1">{match.mapName || 'Indefinido'}</span>
                                </div>

                                <div className="flex items-center gap-6 flex-1 justify-center w-full md:w-auto">
                                    <div className={`text-right flex-1 font-black text-lg truncate ${match.team1Name?.includes('VARGÃO') ? 'text-yellow-500' : 'text-blue-400'} ${!isTeam1Win && 'opacity-50'}`}>{match.team1Name}</div>
                                    <div className="bg-black/50 px-3 py-1 rounded border border-zinc-700 font-mono text-xl font-bold text-white whitespace-nowrap shadow-inner">{match.score1} : {match.score2}</div>
                                    <div className={`text-left flex-1 font-black text-lg truncate ${match.team2Name?.includes('VARGÃO') ? 'text-yellow-500' : 'text-white'} ${isTeam1Win && 'opacity-50'}`}>{match.team2Name}</div>
                                </div>

                                <div className="text-zinc-600">
                                    <svg className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180 text-yellow-500' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </div>
                            </div>

                            {/* DROPDOWN EXPANDIDO */}
                            {isOpen && (
                                <div className="bg-zinc-950/50 border-t border-zinc-800 p-6 animate-in slide-in-from-top-2">
                                    <div className="grid grid-cols-2 gap-8 mb-6">
                                        <div className="text-right space-y-1">
                                            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 border-b border-zinc-800 pb-1">Line-up {match.team1Name}</h4>
                                            {roster1List.length > 0 ? roster1List.map((name, i) => <div key={i} className="text-sm text-zinc-300 font-mono">{name.trim()}</div>) : <span className="text-xs text-zinc-600 italic">Sem registros</span>}
                                        </div>
                                        <div className="text-left space-y-1">
                                            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 border-b border-zinc-800 pb-1">Line-up {match.team2Name}</h4>
                                            {roster2List.length > 0 ? roster2List.map((name, i) => <div key={i} className="text-sm text-zinc-300 font-mono">{name.trim()}</div>) : <span className="text-xs text-zinc-600 italic">Sem registros</span>}
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-4 border-t border-zinc-800/50">
                                        {/* BOTÃO QUE CHAMA O MODAL */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                requestDelete(match.id); // <--- Chama o modal aqui
                                            }}
                                            className="text-xs flex items-center gap-2 text-red-500 hover:text-white hover:bg-red-600 px-3 py-2 rounded transition font-bold uppercase tracking-wider"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                                            Excluir Partida
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </>
    )
}