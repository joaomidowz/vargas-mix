// Arquivo: src/app/actions.ts
'use server'

import { db } from "@/lib/db";
import { players } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { eq, inArray } from "drizzle-orm";

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

// Adicione ao final de src/app/actions.ts
export async function generateTeamsAction(playerIds: string[]) {
  const selectedPlayers = await db
    .select()
    .from(players)
    .where(inArray(players.id, playerIds));

  // 1. Embaralhar (Fisher-Yates)
  for (let i = selectedPlayers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [selectedPlayers[i], selectedPlayers[j]] = [selectedPlayers[j], selectedPlayers[i]];
  }

  // 2. Fatiar em times de 5 (Chunks)
  const teams: typeof selectedPlayers[] = [];
  const MAX_PER_TEAM = 5;

  for (let i = 0; i < selectedPlayers.length; i += MAX_PER_TEAM) {
    const chunk = selectedPlayers.slice(i, i + MAX_PER_TEAM);
    teams.push(chunk);
  }

  // Retorna um array de arrays: [ [timeA], [timeB], [timeC]... ]
  return teams;
}