// Arquivo: src/components/add-player-form.tsx
'use client'

import { useRef } from 'react'
import { addPlayer } from '@/app/actions'
import { SubmitButton } from './submit-button'

export function AddPlayerForm() {
  const formRef = useRef<HTMLFormElement>(null)

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await addPlayer(formData)
        formRef.current?.reset()
      }}
      className="flex gap-2"
    >
      <input
        name="name"
        type="text"
        placeholder="Nome do jogador (ex: Fallen)"
        className="flex-1 bg-zinc-950 border border-zinc-700 rounded p-2 focus:outline-none focus:border-yellow-500 transition text-zinc-100"
        required
      />
      <SubmitButton />
    </form>
  )
}