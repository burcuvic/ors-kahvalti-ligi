import { Match, Player, BracketMatch } from "./types";

export const TEAMS = {
  TUR: { code: "TUR", name: "Türkiye", flag: "🇹🇷", color: "#E30A17" },
  BRA: { code: "BRA", name: "Brezilya", flag: "🇧🇷", color: "#FFDF00" },
  ARG: { code: "ARG", name: "Arjantin", flag: "🇦🇷", color: "#75AADB" },
  FRA: { code: "FRA", name: "Fransa", flag: "🇫🇷", color: "#0055A4" },
  GER: { code: "GER", name: "Almanya", flag: "🇩🇪", color: "#000000" },
  ESP: { code: "ESP", name: "İspanya", flag: "🇪🇸", color: "#AA151B" },
  POR: { code: "POR", name: "Portekiz", flag: "🇵🇹", color: "#006633" },
  ENG: { code: "ENG", name: "İngiltere", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", color: "#FFFFFF" },
  ITA: { code: "ITA", name: "İtalya", flag: "🇮🇹", color: "#0066CC" },
  NED: { code: "NED", name: "Hollanda", flag: "🇳🇱", color: "#FF6600" },
  CRO: { code: "CRO", name: "Hırvatistan", flag: "🇭🇷", color: "#FF0000" },
  BEL: { code: "BEL", name: "Belçika", flag: "🇧🇪", color: "#FFD700" },
  URU: { code: "URU", name: "Uruguay", flag: "🇺🇾", color: "#5DADE2" },
  MEX: { code: "MEX", name: "Meksika", flag: "🇲🇽", color: "#006847" },
  JPN: { code: "JPN", name: "Japonya", flag: "🇯🇵", color: "#BC002D" },
  USA: { code: "USA", name: "ABD", flag: "🇺🇸", color: "#3C3B6E" },
};

const futureTime = (hoursFromNow: number) => {
  const d = new Date();
  d.setHours(d.getHours() + hoursFromNow);
  return d.toISOString();
};

export const MATCHES: Match[] = [
  {
    id: "m1",
    home: TEAMS.TUR,
    away: TEAMS.BRA,
    kickoff: futureTime(6),
    group: "A Grubu",
    venue: "Lusail Stadyumu",
  },
  {
    id: "m2",
    home: TEAMS.ARG,
    away: TEAMS.FRA,
    kickoff: futureTime(28),
    group: "B Grubu",
    venue: "Al Bayt Stadyumu",
  },
  {
    id: "m3",
    home: TEAMS.GER,
    away: TEAMS.ESP,
    kickoff: futureTime(52),
    group: "C Grubu",
    venue: "Ahmed Bin Ali",
  },
  {
    id: "m4",
    home: TEAMS.POR,
    away: TEAMS.ENG,
    kickoff: futureTime(76),
    group: "D Grubu",
    venue: "Education City",
  },
  {
    id: "m5",
    home: TEAMS.ITA,
    away: TEAMS.NED,
    kickoff: futureTime(100),
    group: "E Grubu",
    venue: "Khalifa International",
  },
  {
    id: "m6",
    home: TEAMS.CRO,
    away: TEAMS.BEL,
    kickoff: futureTime(124),
    group: "F Grubu",
    venue: "Stadium 974",
  },
];

export const PLAYERS: Player[] = [
  { id: "p1", name: "Burcu Aktaş", initials: "BA", emoji: "👑", points: 47, correct: 16, wrong: 3, streak: 5, team: "Quality" },
  { id: "p2", name: "Mustafa Şahin", initials: "MŞ", emoji: "🔥", points: 41, correct: 14, wrong: 5, streak: 3, team: "Üretim" },
  { id: "p3", name: "Nazlı Bıyıklı", initials: "NB", emoji: "⚡", points: 38, correct: 13, wrong: 5, streak: 2, team: "Tedarik" },
  { id: "p4", name: "Barış Yılmaz", initials: "BY", emoji: "📊", points: 35, correct: 12, wrong: 6, streak: 1, team: "Maliyet" },
  { id: "p5", name: "Emre Kaya", initials: "EK", emoji: "🎯", points: 32, correct: 11, wrong: 7, streak: 0, team: "Üretim" },
  { id: "p6", name: "Selin Demir", initials: "SD", emoji: "🚀", points: 29, correct: 10, wrong: 8, streak: 1, team: "Lojistik" },
  { id: "p7", name: "Cem Öztürk", initials: "CÖ", emoji: "⚽", points: 26, correct: 9, wrong: 9, streak: 0, team: "IT" },
  { id: "p8", name: "Deniz Arslan", initials: "DA", emoji: "🎲", points: 23, correct: 8, wrong: 10, streak: 0, team: "Satınalma" },
  { id: "p9", name: "Ayşe Çelik", initials: "AÇ", emoji: "🌟", points: 19, correct: 7, wrong: 11, streak: 0, team: "İK" },
  { id: "p10", name: "Kerem Tunç", initials: "KT", emoji: "💪", points: 15, correct: 6, wrong: 12, streak: 0, team: "Bakım" },
  { id: "p11", name: "Furkan Aksoy", initials: "FA", emoji: "🥖", points: 8, correct: 4, wrong: 14, streak: 0, team: "Lojistik" },
  { id: "p12", name: "Pınar Doğan", initials: "PD", emoji: "🫖", points: 5, correct: 3, wrong: 15, streak: 0, team: "Muhasebe" },
];

export const BRACKET: BracketMatch[] = [
  { id: "r16-1", round: "R16", home: TEAMS.BRA, away: TEAMS.MEX, homeScore: 2, awayScore: 0, winner: "home" },
  { id: "r16-2", round: "R16", home: TEAMS.ARG, away: TEAMS.JPN, homeScore: 3, awayScore: 1, winner: "home" },
  { id: "r16-3", round: "R16", home: TEAMS.FRA, away: TEAMS.USA, homeScore: 2, awayScore: 1, winner: "home" },
  { id: "r16-4", round: "R16", home: TEAMS.TUR, away: TEAMS.URU, homeScore: 1, awayScore: 0, winner: "home" },
  { id: "qf-1", round: "QF", home: TEAMS.BRA, away: TEAMS.ARG, homeScore: 1, awayScore: 2, winner: "away" },
  { id: "qf-2", round: "QF", home: TEAMS.FRA, away: TEAMS.TUR, homeScore: 1, awayScore: 2, winner: "away" },
  { id: "sf-1", round: "SF", home: TEAMS.ARG, away: TEAMS.TUR },
  { id: "f-1", round: "F" },
];
