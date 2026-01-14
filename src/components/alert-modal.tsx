// src/components/alert-modal.tsx
'use client'

import { useEffect } from "react"

interface AlertModalProps {
  isOpen: boolean
  title: string
  description: string
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'info' // Para mudar a cor do botão (Vermelho ou Azul/Verde)
}

export function AlertModal({
  isOpen,
  title,
  description,
  onConfirm,
  onCancel,
  isLoading = false,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = 'danger'
}: AlertModalProps) {
  
  // Fecha ao apertar ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    if (isOpen) window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen, onCancel])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-xl shadow-2xl max-w-sm w-full space-y-6 animate-in zoom-in-95 duration-200" role="dialog">
        
        {/* Ícone e Texto */}
        <div className="text-center space-y-2">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${variant === 'danger' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
            {variant === 'danger' ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            )}
          </div>
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <p className="text-zinc-400 text-sm leading-relaxed">
            {description}
          </p>
        </div>

        {/* Botões */}
        <div className="flex gap-3 pt-2">
          <button 
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-lg font-bold transition disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 text-white py-3 rounded-lg font-bold transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 ${
                variant === 'danger' 
                ? 'bg-red-600 hover:bg-red-500 shadow-red-900/20' 
                : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/20'
            }`}
          >
            {isLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {isLoading ? 'Processando...' : confirmText}
          </button>
        </div>

      </div>
    </div>
  )
}