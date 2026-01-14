// Arquivo: src/app/actions.ts
'use server'

import { db } from "@/lib/db";
import { players } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

// Adicionar Jogador
export async function addPlayer(formData: FormData) {
  const name = formData.get("name") as string;
  
  if (!name) return;

  await db.insert(players).values({
    id: crypto.randomUUID(), // Gera um ID único
    name: name,
    rating: 3, // Valor padrão
  });

  // Atualiza a tela automaticamente
  revalidatePath("/");
}

// Deletar Jogador
export async function deletePlayer(id: string) {
  await db.delete(players).where(eq(players.id, id));
  revalidatePath("/");
}