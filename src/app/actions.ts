// src/app/actions.ts
'use server'

import { db } from "@/lib/db";
import { players, matches } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { eq, inArray, sql } from "drizzle-orm";

// --- HELPERS GLOBAIS ---

const hasVargas = (team: typeof players.$inferSelect[]) => 
    team.some(p => p.name.toLowerCase().includes('vargas') || p.name.toLowerCase().includes('vargão'));

const getCaptainName = (team: typeof players.$inferSelect[]) => {
    if (!team || team.length === 0) return "TBD";
    const vargas = team.find(p => p.name.toLowerCase().includes('vargas') || p.name.toLowerCase().includes('vargão'));
    if (vargas) return "VARGÃO";
    // Ordena por wins (maior para menor)
    const sorted = [...team].sort((a, b) => (b.wins || 0) - (a.wins || 0));
    return sorted[0].name.toUpperCase();
}

const sortByTime = (a: typeof players.$inferSelect, b: typeof players.$inferSelect) => {
    if (!a.lastPlayed && !b.lastPlayed) return 0.5 - Math.random(); 
    if (!a.lastPlayed) return -1; 
    if (!b.lastPlayed) return 1;  
    return a.lastPlayed.localeCompare(b.lastPlayed); 
}

// --- CRUD PLAYERS ---
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

export async function toggleSubAction(id: string) {
    const player = await db.select().from(players).where(eq(players.id, id)).get();
    if (!player) return;
    await db.update(players).set({ isSub: !player.isSub }).where(eq(players.id, id));
    revalidatePath("/");
}

export async function resetSystemAction(password: string) {
    if (password !== "vargao") return { success: false, message: "Senha incorreta!" };
    await db.update(players).set({ wins: 0, losses: 0, currentStreak: 0, matchesPlayed: 0, lastPlayed: null });
    await db.delete(matches);
    revalidatePath("/");
    return { success: true, message: "Sistema resetado com sucesso!" };
}

// --- GERAÇÃO DE TIMES ---

export async function generateTeamsAction(
  playerIds: string[], 
  lockedIds: string[] = [], 
  mode: 'RANDOM' | 'VS_VARGAS' | 'BRACKET' | '1V1' = 'RANDOM'
) {
    const allPlayers = await db.select().from(players).where(inArray(players.id, playerIds));
    const lockedPlayers = allPlayers.filter(p => lockedIds.includes(p.id));
    const remainingPlayers = allPlayers.filter(p => !lockedIds.includes(p.id));

    // 1. Ordenação Global
    const subPlayers = remainingPlayers.filter(p => p.isSub);
    const normalPlayers = remainingPlayers.filter(p => !p.isSub);
    
    // Usa o Helper global, não redefine
    subPlayers.sort(sortByTime);    
    normalPlayers.sort(sortByTime); 
    
    const poolPlayers = [...subPlayers, ...normalPlayers];

    const teams: typeof allPlayers[] = []; 
    const schedule = [];

    // --- MODO 1V1 ---
    if (mode === '1V1') {
        const combatants = [...lockedPlayers, ...poolPlayers];
        combatants.forEach(p => teams.push([p]));
        let roundCounter = 1;
        for (let i = 0; i < teams.length; i++) {
            for (let j = i + 1; j < teams.length; j++) {
                schedule.push({
                    id: `duel-${roundCounter}`, round: roundCounter,
                    team1Name: teams[i][0].name, team2Name: teams[j][0].name,
                    team1Index: i, team2Index: j, isVargasGame: false, highlight: false
                });
                roundCounter++;
            }
        }
        for (let i = schedule.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [schedule[i], schedule[j]] = [schedule[j], schedule[i]]; }
        schedule.forEach((s, idx) => s.round = idx + 1);
        return { teams, schedule };
    }

    // --- MONTAGEM DE TIMES (5v5) ---
    let teamA = [...lockedPlayers];
    
    // Completa Time A (Panela) com o topo do pool (Subs/Antigos)
    const spotsToFill = 5 - teamA.length;
    if (spotsToFill > 0 && poolPlayers.length > 0) {
        const fillers = poolPlayers.splice(0, spotsToFill);
        teamA = [...teamA, ...fillers];
    }
    teams.push(teamA); // Index 0
    
    // Resto dos times
    for (let i = 0; i < poolPlayers.length; i += 5) {
        teams.push(poolPlayers.slice(i, i + 5));
    }

    // --- MODO BRACKET ---
    if (mode === 'BRACKET') {
        // Se Vargas ficou fora dos times principais, troca com o Time A
        const vargasTeamIndex = teams.findIndex(team => hasVargas(team));
        if (vargasTeamIndex > 3) { 
            const temp = teams[0];
            teams[0] = teams[vargasTeamIndex];
            teams[vargasTeamIndex] = temp;
        }

        const teamNames = teams.map(team => `TEAM ${getCaptainName(team)}`);

        schedule.push({
            id: 'semi-1', round: 1,
            team1Name: teamNames[0], team2Name: teamNames[1] || "W.O.",
            team1Index: 0, team2Index: 1,
            isVargasGame: hasVargas(teams[0]) || hasVargas(teams[1] || []), highlight: false
        });

        if (teams.length > 2) {
            schedule.push({
                id: 'semi-2', round: 2,
                team1Name: teamNames[2], team2Name: teamNames[3] || "W.O.",
                team1Index: 2, team2Index: 3,
                isVargasGame: hasVargas(teams[2]) || hasVargas(teams[3] || []), highlight: false
            });
        }

        schedule.push({
            id: 'final', round: 3,
            team1Name: "VENCEDOR S1", team2Name: "VENCEDOR S2",
            team1Index: -1, team2Index: -1, isVargasGame: true, highlight: true
        });

        return { teams, schedule };
    }

    // --- RANDOM / VS_VARGAS ---
    // Helper local para nomes
    const getTeamTitle = (team: typeof allPlayers) => `TEAM ${getCaptainName(team)}`;

    const vargasIndex = teams.findIndex(team => hasVargas(team));
    
    if (vargasIndex !== -1) {
        const vargasName = (mode === 'VS_VARGAS' && vargasIndex === 0) ? 'PANELA DO VARGÃO' : getTeamTitle(teams[vargasIndex]);
        let round = 1;
        for (let i = 0; i < teams.length; i++) {
            if (i === vargasIndex) continue;
            schedule.push({ 
                id: `gauntlet-${round}`, round: round, 
                team1Name: vargasName, 
                team2Name: getTeamTitle(teams[i]), 
                team1Index: vargasIndex, team2Index: i, 
                isVargasGame: true, highlight: true 
            });
            round++;
        }
    } else {
        let roundCounter = 1;
        for (let i = 0; i < teams.length; i += 2) {
            if (i + 1 < teams.length) {
                schedule.push({ 
                    id: `match-${roundCounter}`, round: roundCounter, 
                    team1Name: getTeamTitle(teams[i]), 
                    team2Name: getTeamTitle(teams[i+1]), 
                    team1Index: i, team2Index: i+1, 
                    isVargasGame: false, highlight: false 
                });
                roundCounter++;
            }
        }
    }
    
    return { teams, schedule };
}

// ... saveMatchResultAction MANTIDO IGUAL ...
export async function saveMatchResultAction(data: {
  team1Name: string, team2Name: string, score1: number, score2: number, mapName: string,
  team1Ids: string[], team2Ids: string[], roster1Names: string, roster2Names: string
}) {
  await db.insert(matches).values({
    id: crypto.randomUUID(), team1Name: data.team1Name, team2Name: data.team2Name,
    score1: data.score1, score2: data.score2, mapName: data.mapName, roster1: data.roster1Names, roster2: data.roster2Names,
  });

  const team1Won = data.score1 > data.score2;
  const team2Won = data.score2 > data.score1; 
  const now = new Date().toISOString();

  if (data.team1Ids.length > 0) {
      await db.update(players).set({
            lastPlayed: now, matchesPlayed: sql`${players.matchesPlayed} + 1`,
            wins: team1Won ? sql`${players.wins} + 1` : players.wins,
            losses: team2Won ? sql`${players.losses} + 1` : players.losses,
            currentStreak: team1Won ? sql`${players.currentStreak} + 1` : (team2Won ? 0 : players.currentStreak)
        }).where(inArray(players.id, data.team1Ids));
  }

  if (data.team2Ids.length > 0) {
      await db.update(players).set({
            lastPlayed: now, matchesPlayed: sql`${players.matchesPlayed} + 1`,
            wins: team2Won ? sql`${players.wins} + 1` : players.wins,
            losses: team1Won ? sql`${players.losses} + 1` : players.losses,
            currentStreak: team2Won ? sql`${players.currentStreak} + 1` : (team1Won ? 0 : players.currentStreak)
        }).where(inArray(players.id, data.team2Ids));
  }
  revalidatePath("/");
}