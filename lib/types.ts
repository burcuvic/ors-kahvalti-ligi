export type Pick = "1" | "X" | "2";

export interface Team {
  code: string;
  name: string;
  flag: string;
  color: string;
}

export interface Match {
  id: string;
  home: Team;
  away: Team;
  kickoff: string;
  group: string;
  venue: string;
  locked?: boolean;
}

export interface Player {
  id: string;
  name: string;
  initials: string;
  emoji: string;
  points: number;
  correct: number;
  wrong: number;
  streak: number;
  team: string;
}

export interface BracketTeam {
  code: string;
  name: string;
  flag: string;
}

export interface BracketMatch {
  id: string;
  round: "R16" | "QF" | "SF" | "F";
  home?: BracketTeam;
  away?: BracketTeam;
  homeScore?: number;
  awayScore?: number;
  winner?: "home" | "away";
}
