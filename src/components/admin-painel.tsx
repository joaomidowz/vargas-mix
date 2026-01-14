// src/components/admin-panel.tsx
'use client'

import { useState } from 'react'
import { resetSystemAction } from '@/app/actions'
import { AlertModal } from './alert-modal'

export function AdminPanel() {
    const [isOpen, setIsOpen] = useState(false)
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    // Estado para controlar o Modal de Confirmação
    const [showConfirmModal, setShowConfirmModal] = useState(false)

    // 1. Ao submeter o formulário de senha, primeiro abrimos o Modal
    const handleSubmitPassword = (e: React.FormEvent) => {
        e.preventDefault()
        if (!password) return
        setError('')
        setShowConfirmModal(true) // Abre o modal de confirmação
    }

    // 2. Se o usuário confirmar no Modal, executamos o reset
    const handleConfirmReset = async () => {
        setIsLoading(true)
        setError('')

        const result = await resetSystemAction(password)

        if (result.success) {
            alert("Season Resetada com Sucesso! 👑")
            setIsOpen(false)
            setShowConfirmModal(false)
            setPassword('')
        } else {
            setError(result.message || 'Erro desconhecido')
            setShowConfirmModal(false) // Fecha o modal mas mantém o painel aberto pra tentar de novo
        }
        setIsLoading(false)
    }

    return (
        <>
            {/* MODAL DE CONFIRMAÇÃO DO RESET */}
            <AlertModal
                isOpen={showConfirmModal}
                title="ZERAR O SISTEMA?"
                description="ATENÇÃO: Esta ação é irreversível. O Ranking, Vitórias, Derrotas e Histórico de Partidas serão apagados permanentemente."
                confirmText="Sim, ZERAR TUDO"
                cancelText="Cancelar"
                variant="danger"
                isLoading={isLoading}
                onConfirm={handleConfirmReset}
                onCancel={() => setShowConfirmModal(false)}
            />

            {/* Botão Discreto no Rodapé */}
            <button
                onClick={() => setIsOpen(true)}
                className="text-xs text-zinc-700 hover:text-red-500 font-mono uppercase tracking-widest border border-transparent hover:border-red-900/30 px-3 py-1 rounded transition"
            >
                🔒 Reset Season do Vargão (Admin) 
            </button>

            {/* Modal de Senha (Painel Principal) */}
            {isOpen && !showConfirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
                    <div className="bg-zinc-900 border border-zinc-700 p-8 rounded-xl shadow-2xl max-w-sm w-full space-y-6 relative">

                        {/* Botão Fechar */}
                        <button
                            onClick={() => { setIsOpen(false); setPassword(''); setError(''); }}
                            className="absolute top-4 right-4 text-zinc-500 hover:text-white"
                        >
                            ✕
                        </button>

                        <div className="text-center space-y-2">
                            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                            </div>
                            <h3 className="text-2xl font-black text-white italic uppercase transform -skew-x-6">Acesso Restrito</h3>
                            <p className="text-zinc-400 text-sm">
                                Digite a senha mestre para zerar a Season e resetar o Ranking.
                            </p>
                        </div>

                        <form onSubmit={handleSubmitPassword} className="space-y-4">
                            <input
                                type="password"
                                placeholder=""
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-black border border-zinc-700 text-white p-3 rounded text-center tracking-widest focus:border-red-500 focus:outline-none placeholder:tracking-normal font-mono"
                                autoFocus
                            />

                            {error && <p className="text-red-500 text-xs text-center font-bold animate-pulse bg-red-500/10 py-1 rounded border border-red-500/20">{error}</p>}

                            <button
                                type="submit"
                                className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded shadow-lg shadow-red-900/20 transition uppercase tracking-wider"
                            >
                                CONTINUAR
                            </button>
                        </form>

                    </div>
                </div>
            )}
        </>
    )
}