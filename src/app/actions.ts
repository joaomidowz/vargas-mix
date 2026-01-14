// src/app/actions.ts
'use server'

import { db } from "@/lib/db";
import { players, matches } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { eq, inArray, sql } from "drizzle-orm";

type GameMode = 'RANDOM' | 'VS_VARGAS';

export async function addPlayer(formData: FormData) {
  const name = formData.get("name") as string;
  if (!name) return;
  await db.insert(players).values({ id: crypto.randomUUID(), name, rating: 3 });
  revalidatePath("/");
}

export async function deletePlayer(id: string) {
  await db.delete(players).where(eq(players.id, id));
  revalidatePath("/");
}

// Helper para achar o Vargas num time
const hasVargas = (team: typeof players.$inferSelect[]) => 
    team.some(p => p.name.toLowerCase().includes('vargas') || p.name.toLowerCase().includes('vargão'));

export async function generateTeamsAction(
  playerIds: string[], 
  lockedIds: string[] = [], 
  mode: GameMode = 'RANDOM'
) {
  // 1. Busca e Prepara Dados
  const allPlayers = await db.select().from(players).where(inArray(players.id, playerIds));
  const lockedPlayers = allPlayers.filter(p => lockedIds.includes(p.id));
  const poolPlayers = allPlayers.filter(p => !lockedIds.includes(p.id));

  // Embaralha Pool
  for (let i = poolPlayers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [poolPlayers[i], poolPlayers[j]] = [poolPlayers[j], poolPlayers[i]];
  }

  // 2. Monta Times
  const teams: typeof allPlayers[] = [];
  const MAX_PER_TEAM = 5;

  let teamA = [...lockedPlayers];
  const slotsNeeded = MAX_PER_TEAM - teamA.length;
  if (slotsNeeded > 0) {
    const fillers = poolPlayers.splice(0, slotsNeeded);
    teamA = [...teamA, ...fillers];
  }
  teams.push(teamA); // Index 0 (Sempre contém a Panela se houver)

  for (let i = 0; i < poolPlayers.length; i += MAX_PER_TEAM) {
    teams.push(poolPlayers.slice(i, i + MAX_PER_TEAM));
  }

  // 3. GERA CRONOGRAMA UNIVERSAL
  const schedule = [];
  
  // Função para dar nome bonito
  const getTeamName = (index: number, team: typeof allPlayers) => {
    // Se for modo Panela explícito e for o time 0
    if (mode === 'VS_VARGAS' && index === 0) return 'PANELA DO VARGÃO';
    
    // Se for Random e tiver Vargas
    if (hasVargas(team)) return `TIME ${String.fromCharCode(65 + index)} (VARGÃO)`;
    
    return `TIME ${String.fromCharCode(65 + index)}`;
  }

  // Lógica: Onde está o Vargão?
  const vargasTeamIndex = teams.findIndex(team => hasVargas(team));

  if (vargasTeamIndex !== -1) {
    // --- LÓGICA REI DA MESA (Vargão vs Todos) ---
    // O time do Vargas joga contra todos os outros
    const vargasTeamName = getTeamName(vargasTeamIndex, teams[vargasTeamIndex]);
    
    let round = 1;
    for (let i = 0; i < teams.length; i++) {
        if (i === vargasTeamIndex) continue; // Não joga contra si mesmo

        schedule.push({
            id: `gauntlet-${round}`,
            round: round,
            team1Name: vargasTeamName, // Time do Vargão sempre na esquerda
            team2Name: getTeamName(i, teams[i]),
            isVargasGame: true,
            highlight: true
        });
        round++;
    }
  } else {
    // --- LÓGICA TORNEIO PADRÃO (Sem Vargas selecionado) ---
    let roundCounter = 1;
    for (let i = 0; i < teams.length; i += 2) {
        if (i + 1 < teams.length) {
            schedule.push({
                id: `match-${roundCounter}`,
                round: roundCounter,
                team1Name: getTeamName(i, teams[i]),
                team2Name: getTeamName(i+1, teams[i+1]),
                isVargasGame: false,
                highlight: false
            });
            roundCounter++;
        }
    }
  }

  return { teams, schedule };
}

export async function saveMatchResultAction(data: {
  team1Name: string,
  team2Name: string,
  score1: number,
  score2: number,
  mapName: string,
  playersIds: string[], // IDs de TODOS que jogaram para atualizar o lastPlayed
  roster1Names: string, // Nomes formatados do time 1
  roster2Names: string  // Nomes formatados do time 2
}) {
  
  // 1. Salvar a partida no histórico
  await db.insert(matches).values({
    id: crypto.randomUUID(),
    team1Name: data.team1Name,
    team2Name: data.team2Name,
    score1: data.score1,
    score2: data.score2,
    mapName: data.mapName,
    roster1: data.roster1Names,
    roster2: data.roster2Names,
  });

  // 2. Atualizar o 'lastPlayed' dos jogadores envolvidos
  if (data.playersIds.length > 0) {
    await db.update(players)
      .set({ 
        lastPlayed: new Date().toISOString(),
        matchesPlayed: sql`${players.matchesPlayed} + 1` // Incrementa contador
      })
      .where(inArray(players.id, data.playersIds));
  }

  revalidatePath("/");
}

// Adicione ao final de src/app/actions.ts

export async function deleteMatchAction(matchId: string) {
  await db.delete(matches).where(eq(matches.id, matchId));
  revalidatePath("/");
}