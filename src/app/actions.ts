// src/app/actions.ts
'use server'

import { db } from "@/lib/db";
import { players, matches } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { eq, inArray, sql } from "drizzle-orm";

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
  
  export async function deleteMatchAction(matchId: string) {
    await db.delete(matches).where(eq(matches.id, matchId));
    revalidatePath("/");
  }

const hasVargas = (team: typeof players.$inferSelect[]) => 
    team.some(p => p.name.toLowerCase().includes('vargas') || p.name.toLowerCase().includes('vargão'));

function shuffleArray<T>(array: T[]) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

export async function toggleSubAction(id: string) {
  const player = await db.select().from(players).where(eq(players.id, id)).get();
  
  if (!player) return;

  await db.update(players)
    .set({ isSub: !player.isSub })
    .where(eq(players.id, id));

  revalidatePath("/");
}

const sortByTime = (a: typeof players.$inferSelect, b: typeof players.$inferSelect) => {
    if (!a.lastPlayed && !b.lastPlayed) return 0.5 - Math.random(); // Ambos novos? Sorteia
    if (!a.lastPlayed) return -1; // A nunca jogou -> A primeiro
    if (!b.lastPlayed) return 1;  // B nunca jogou -> B primeiro
    return a.lastPlayed.localeCompare(b.lastPlayed); // Data mais antiga primeiro
}

export async function generateTeamsAction(
  playerIds: string[], 
  lockedIds: string[] = [], 
  mode: 'RANDOM' | 'VS_VARGAS' = 'RANDOM'
) {
    const allPlayers = await db.select().from(players).where(inArray(players.id, playerIds));
    
    // 1. Separa a Panela (Travados)
    const lockedPlayers = allPlayers.filter(p => lockedIds.includes(p.id));
    
    // 2. Pega o resto
    const remainingPlayers = allPlayers.filter(p => !lockedIds.includes(p.id));

    // 3. Separa SUBS dos NORMAIS
    const subPlayers = remainingPlayers.filter(p => p.isSub);
    const normalPlayers = remainingPlayers.filter(p => !p.isSub);

    // 4. ORDENAÇÃO POR TEMPO (ROTAÇÃO JUSTA)
    // Em vez de shuffleArray, usamos o sort
    subPlayers.sort(sortByTime);    // Subs que esperaram mais entram primeiro entre os subs
    normalPlayers.sort(sortByTime); // Normais que esperaram mais entram primeiro entre os normais

    // 5. Junta o Pool: SUBS PRIMEIRO, depois NORMAIS
    const poolPlayers = [...subPlayers, ...normalPlayers];

    // --- DAQUI PRA BAIXO TUDO IGUAL ---
    const teams: typeof allPlayers[] = []; 
    
    let teamA = [...lockedPlayers];
    
    // Completa o Time A
    if ((5 - teamA.length) > 0) {
        teamA = [...teamA, ...poolPlayers.splice(0, 5 - teamA.length)];
    }
    teams.push(teamA);
    
    // Cria os outros times na ordem da fila
    for (let i = 0; i < poolPlayers.length; i += 5) {
        teams.push(poolPlayers.slice(i, i + 5));
    }
    
    // --- GERA O SCHEDULE ---
    const schedule = [];
    const getTeamName = (index: number, team: typeof allPlayers) => {
        if (mode === 'VS_VARGAS' && index === 0) return 'PANELA DO VARGÃO';
        if (hasVargas(team)) return `TIME ${String.fromCharCode(65 + index)} (VARGÃO)`;
        return `TIME ${String.fromCharCode(65 + index)}`;
    }

    const vargasTeamIndex = teams.findIndex(team => hasVargas(team));
    
    if (vargasTeamIndex !== -1) {
        const vargasTeamName = getTeamName(vargasTeamIndex, teams[vargasTeamIndex]);
        let round = 1;
        for (let i = 0; i < teams.length; i++) {
            if (i === vargasTeamIndex) continue;
            schedule.push({ 
                id: `gauntlet-${round}`, 
                round: round, 
                team1Name: vargasTeamName, 
                team2Name: getTeamName(i, teams[i]), 
                isVargasGame: true, 
                highlight: true 
            });
            round++;
        }
    } else {
        let roundCounter = 1;
        for (let i = 0; i < teams.length; i += 2) {
            if (i + 1 < teams.length) {
                const t1Has = hasVargas(teams[i]); 
                const t2Has = hasVargas(teams[i+1]);
                schedule.push({ 
                    id: `match-${roundCounter}`, 
                    round: roundCounter, 
                    team1Name: getTeamName(i, teams[i]), 
                    team2Name: getTeamName(i+1, teams[i+1]), 
                    isVargasGame: t1Has || t2Has, 
                    highlight: t1Has || t2Has 
                });
                roundCounter++;
            }
        }
    }
    
    return { teams, schedule };
}


// --- AÇÃO DE SALVAR COM ATUALIZAÇÃO DE RANKING ---
export async function saveMatchResultAction(data: {
  team1Name: string,
  team2Name: string,
  score1: number,
  score2: number,
  mapName: string,
  team1Ids: string[], // AGORA RECEBEMOS OS IDS SEPARADOS
  team2Ids: string[], // PARA SABER QUEM GANHOU/PERDEU
  roster1Names: string,
  roster2Names: string
}) {
  
  // 1. Salvar Partida
  await db.insert(matches).values({
    id: crypto.randomUUID(),
    team1Name: data.team1Name, team2Name: data.team2Name,
    score1: data.score1, score2: data.score2,
    mapName: data.mapName, roster1: data.roster1Names, roster2: data.roster2Names,
  });

  // 2. Determinar Vencedor
  const team1Won = data.score1 > data.score2;
  const team2Won = data.score2 > data.score1; // Empate não conta streak

  const now = new Date().toISOString();

  // 3. Atualizar Time 1
  if (data.team1Ids.length > 0) {
      await db.update(players)
        .set({
            lastPlayed: now,
            matchesPlayed: sql`${players.matchesPlayed} + 1`,
            wins: team1Won ? sql`${players.wins} + 1` : players.wins,
            losses: team2Won ? sql`${players.losses} + 1` : players.losses,
            // Se ganhou, aumenta streak. Se perdeu, zera. Se empatou, mantém.
            currentStreak: team1Won ? sql`${players.currentStreak} + 1` : (team2Won ? 0 : players.currentStreak)
        })
        .where(inArray(players.id, data.team1Ids));
  }

  // 4. Atualizar Time 2
  if (data.team2Ids.length > 0) {
      await db.update(players)
        .set({
            lastPlayed: now,
            matchesPlayed: sql`${players.matchesPlayed} + 1`,
            wins: team2Won ? sql`${players.wins} + 1` : players.wins,
            losses: team1Won ? sql`${players.losses} + 1` : players.losses,
            currentStreak: team2Won ? sql`${players.currentStreak} + 1` : (team1Won ? 0 : players.currentStreak)
        })
        .where(inArray(players.id, data.team2Ids));
  }

  revalidatePath("/");
}

export async function resetSystemAction(password: string) {
    if (password !== "vargao") {
    return { success: false, message: "Senha incorreta! Sai daqui impostor." };
  }

  
  await db.update(players).set({
    wins: 0,
    losses: 0,
    currentStreak: 0,
    matchesPlayed: 0,
    lastPlayed: null
  });

  
  await db.delete(matches);

  revalidatePath("/");
  return { success: true, message: "Sistema resetado com sucesso! Nova season iniciada." };
}