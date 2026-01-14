// Arquivo: src/components/submit-button.tsx
'use client'

import { useFormStatus } from 'react-dom'

export function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className={`
        font-bold py-2 px-6 rounded transition flex items-center gap-2
        ${pending 
          ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed' 
          : 'bg-yellow-600 hover:bg-yellow-500 text-black'}
      `}
    >
      {pending ? (
        <>
          {/* Spinner simples com CSS */}
          <div className="h-4 w-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
          Salvando...
        </>
      ) : (
        'Adicionar'
      )}
    </button>
  )
}