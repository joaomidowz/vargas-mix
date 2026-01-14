// src/components/auth-gate.tsx
'use client'

import { useState, useEffect } from 'react'

export function AuthGate({ children }: { children: React.ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [password, setPassword] = useState('')
    const [error, setError] = useState(false)
    const [isLoading, setIsLoading] = useState(true) // Começa carregando para verificar localStorage

    useEffect(() => {
        // Verifica se já tem a senha salva no navegador
        const saved = localStorage.getItem('vargas_access')
        if (saved === process.env.NEXT_PUBLIC_SITE_PASSWORD) {
            setIsAuthenticated(true)
        }
        setIsLoading(false)
    }, [])

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault()

        // Compara com a variável do .env.local
        if (password === process.env.NEXT_PUBLIC_SITE_PASSWORD) {
            localStorage.setItem('vargas_access', password) // Salva pra não pedir de novo
            setIsAuthenticated(true)
            setError(false)
        } else {
            setError(true)
            // Balança a tela ou vibra (opcional)
            setTimeout(() => setError(false), 500)
        }
    }

    // Enquanto verifica o localStorage, mostra uma tela preta limpa
    if (isLoading) return <div className="min-h-screen bg-zinc-950" />

    // Se estiver logado, libera o conteúdo do site (Lobby, etc)
    if (isAuthenticated) {
        return <>{children}</>
    }

    // TELA DE LOGIN (BLOQUEIO)
    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-500">

                {/* Logo / Título */}
                <div className="text-center space-y-2">
                    <div className="w-20 h-20 bg-yellow-500/10 text-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-yellow-500/20 shadow-[0_0_30px_rgba(234,179,8,0.2)]">
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></svg>
                    </div>
                    <h1 className="text-4xl font-black text-white italic transform -skew-x-6 tracking-tighter">
                        VARGAS <span className="text-yellow-500">MIX</span>
                    </h1>
                    <p className="text-zinc-500 font-mono text-sm uppercase tracking-widest">
                        Acesso Restrito
                    </p>
                </div>

                {/* Formulário */}
                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="relative group">
                        <input
                            type="password"
                            placeholder="Digite a senha de acesso..."
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={`w-full bg-zinc-900/50 border text-white p-4 rounded-xl text-center tracking-widest text-lg focus:outline-none transition-all placeholder:text-zinc-600 placeholder:tracking-normal placeholder:text-sm
                ${error ? 'border-red-500 shake' : 'border-zinc-800 focus:border-yellow-500 focus:shadow-[0_0_20px_rgba(234,179,8,0.1)]'}
              `}
                            autoFocus
                        />
                        {error && (
                            <p className="absolute -bottom-6 left-0 right-0 text-center text-red-500 text-xs font-bold animate-pulse">
                                SENHA INCORRETA
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-black py-4 rounded-xl shadow-lg shadow-yellow-900/20 transition uppercase tracking-wider text-sm"
                    >
                        Entrar no Sistema
                    </button>
                </form>

                <p className="text-center text-zinc-700 text-xs pt-8">
                    Sistema Protegido &copy; 2024
                </p>
            </div>

            {/* CSS para animação de erro (Shake) */}
            <style jsx>{`
        .shake {
          animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }
      `}</style>
        </div>
    )
}