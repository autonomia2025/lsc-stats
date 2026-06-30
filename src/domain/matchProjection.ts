export type MatchEvent = {
  id?: number;
  matchId: number;
  teamId: number | null;
  type: string;
  period: string | null;
  clock: string | null;
  primaryPlayerId: number | null;
  secondaryPlayerId: number | null;
  payload: any;
  timestamp: string | Date;
};

export type MatchProjection = {
  homeScore: number;
  awayScore: number;
  homeFouls: number;
  awayFouls: number;
  homeTimeouts: number;
  awayTimeouts: number;
  currentPeriod: string | null;
  periodState: 'PRE_GAME' | 'IN_PROGRESS' | 'INTERMISSION' | 'FINISHED';
};

const PERIODS = ['Q1', 'Q2', 'Q3', 'Q4', 'OT1', 'OT2', 'OT3'];

export function buildMatchProjection(events: MatchEvent[], homeTeamId: number, awayTeamId: number): MatchProjection {
  let homeScore = 0;
  let awayScore = 0;
  let homeFouls = 0;
  let awayFouls = 0;
  let homeTimeouts = 0;
  let awayTimeouts = 0;
  
  let currentPeriod: string | null = null;
  let periodState: 'PRE_GAME' | 'IN_PROGRESS' | 'INTERMISSION' | 'FINISHED' = 'PRE_GAME';

  // Sort events by timestamp or id if available to ensure correct order
  const sortedEvents = [...events].sort((a, b) => {
    const aId = a.id || 0;
    const bId = b.id || 0;
    return aId - bId;
  });

  for (const event of sortedEvents) {
    if (event.type === 'PERIOD_START') {
      currentPeriod = event.period;
      periodState = 'IN_PROGRESS';
      // Reset fouls for quarters (FIBA rules)
      // Usually team fouls reset each quarter. OT is an extension of Q4 for fouls.
      if (currentPeriod === 'Q1' || currentPeriod === 'Q2' || currentPeriod === 'Q3' || currentPeriod === 'Q4') {
        homeFouls = 0;
        awayFouls = 0;
      }
    } else if (event.type === 'PERIOD_END') {
      periodState = 'INTERMISSION';
    } else if (event.type === 'MATCH_FINISHED') {
      periodState = 'FINISHED';
    } else if (event.type === 'MATCH_OFFICIALIZED') {
      // no change to projection needed for this state yet
    } else if (event.type === 'EVENT_REVERSED') {
      // we will handle this in PR 4
    } else {
      // Points
      if (event.type === 'pt3') {
        if (event.teamId === homeTeamId) homeScore += 3;
        if (event.teamId === awayTeamId) awayScore += 3;
      } else if (event.type === 'pt2') {
        if (event.teamId === homeTeamId) homeScore += 2;
        if (event.teamId === awayTeamId) awayScore += 2;
      } else if (event.type === 'pt1') {
        if (event.teamId === homeTeamId) homeScore += 1;
        if (event.teamId === awayTeamId) awayScore += 1;
      }
      
      // Fouls
      if (event.type.startsWith('foul_')) {
        if (event.teamId === homeTeamId) homeFouls += 1;
        if (event.teamId === awayTeamId) awayFouls += 1;
      }
    }
  }

  return {
    homeScore,
    awayScore,
    homeFouls,
    awayFouls,
    homeTimeouts,
    awayTimeouts,
    currentPeriod,
    periodState
  };
}

export function getNextPeriodAction(projection: MatchProjection): { action: string, label: string, nextPeriod?: string } | null {
  if (projection.periodState === 'PRE_GAME') {
    return { action: 'PERIOD_START', label: 'Iniciar Q1', nextPeriod: 'Q1' };
  }
  
  if (projection.periodState === 'IN_PROGRESS') {
    return { action: 'PERIOD_END', label: `Finalizar ${projection.currentPeriod}`, nextPeriod: projection.currentPeriod! };
  }
  
  if (projection.periodState === 'INTERMISSION') {
    let nextPeriod = 'Q2';
    if (projection.currentPeriod === 'Q1') nextPeriod = 'Q2';
    else if (projection.currentPeriod === 'Q2') nextPeriod = 'Q3';
    else if (projection.currentPeriod === 'Q3') nextPeriod = 'Q4';
    else if (projection.currentPeriod === 'Q4') {
       // Only OT if scores are tied, but for simplicity let operator decide
       // or always offer OT if Q4 is done.
       nextPeriod = 'OT1';
    }
    else if (projection.currentPeriod?.startsWith('OT')) {
       const otNum = parseInt(projection.currentPeriod.replace('OT', ''));
       nextPeriod = `OT${otNum + 1}`;
    }
    
    return { action: 'PERIOD_START', label: `Iniciar ${nextPeriod}`, nextPeriod };
  }
  
  return null;
}
