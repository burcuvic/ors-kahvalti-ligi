"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://mqjgemndxkuufjaeyhjb.supabase.co",
  "sb_publishable_ZcaB2PBtdaBJ6blYdd4wPA_872a5OfE",
);

const ADMIN_PASSWORD = "ors2026";
const MASCOT_SRC = "/ors-mascot.png";

type Player = {
  id: string;
  name: string;
  team?: string | null;
  heart_team?: string | null;
  is_admin?: boolean | null;
  login_code?: string | null;
  is_active?: boolean | null;
};

type Season = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  is_archived: boolean;
  is_closed?: boolean | null;
};

type Match = {
  id: string;
  home_team: string;
  away_team: string;
  match_time: string;
  result?: string | null;
  breakfast_round?: string | null;
  league?: string | null;
  home_score?: number | null;
  away_score?: number | null;
  season_id?: string | null;
  week_no?: number | null;
  match_type?: string | null;
  cup_name?: string | null;
  is_knockout?: boolean | null;
  tie_leg?: string | null;
  match_status?: string | null;
  extra_time_played?: boolean | null;
  penalty_played?: boolean | null;
  extra_home_score?: number | null;
  extra_away_score?: number | null;
  penalty_home_score?: number | null;
  penalty_away_score?: number | null;
  advancing_team?: string | null;
  is_published?: boolean | null;
  admin_note?: string | null;
};

type OldPrediction = {
  id: string;
  player_id: string;
  match_id: string;
  prediction: string;
  points: number;
  is_joker?: boolean | null;
};

type ScorePrediction = {
  id?: string;
  season_id: string;
  player_id: string;
  match_id: string;
  home_goals: number;
  away_goals: number;
  advancing_team?: string | null;
  is_joker?: boolean | null;
  total_points?: number | null;
  breakdown?: Record<string, any> | null;
};

type LeagueTeam = {
  id: string;
  league: string;
  team_name: string;
  is_active?: boolean | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  text_color?: string | null;
  logo_url?: string | null;
  manual_form?: string | null;
  nickname?: string | null;
  profile_title?: string | null;
  fan_phrase?: string | null;
};

type PlayerFavorite = {
  id?: string;
  season_id: string;
  player_id: string;
  league: string;
  team_name: string;
};

type EuroPrediction = {
  id?: string;
  season_id: string;
  player_id: string;
  competition: string;
  team_name: string;
  is_locked?: boolean | null;
};

type LeagueWinner = {
  id?: string;
  season_id: string;
  league: string;
  winner_team: string;
  bonus_points: number;
  bonus_applied?: boolean | null;
};

type SeasonSetting = {
  id?: string;
  season_id: string;
  active_week: number;
};

type AdminPoint = {
  id?: string;
  season_id: string;
  player_id: string;
  points: number;
  point_type: string;
  description: string;
  week_no?: number | null;
  created_at?: string | null;
};

type TabKey =
  | "dashboard"
  | "predict"
  | "matches"
  | "profile"
  | "compare"
  | "teams"
  | "stats"
  | "rules"
  | "admin";

const REQUIRED_FAVORITE_LEAGUES = [
  "Süper Lig",
  "Premier Lig",
  "La Liga",
  "Serie A",
  "Ligue 1",
  "Bundesliga",
  "TFF 1. Lig",
];

const EURO_COMPETITIONS = [
  { name: "Şampiyonlar Ligi", points: 75 },
  { name: "Avrupa Ligi", points: 50 },
  { name: "Konferans Ligi", points: 25 },
];

const MATCH_TYPES = [
  "Normal",
  "Derbi",
  "Büyük Maç",
  "Avrupa Gecesi",
  "Kritik Maç",
  "Milli Maç",
  "Kupa Maçı",
];

const LEAGUES = [
  ...REQUIRED_FAVORITE_LEAGUES,
  "Şampiyonlar Ligi",
  "Avrupa Ligi",
  "Konferans Ligi",
  "Kupa Maçları",
  "Milli Takım",
];

const QUICK_SCORES = ["0-0", "1-0", "1-1", "2-1", "2-0", "0-1", "1-2", "3-1"];
const GOAL_OPTIONS = Array.from({ length: 10 }, (_, i) => i);

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function getTeamStyle(team?: LeagueTeam | null) {
  return {
    background: team?.primary_color || "#fff7ed",
    color: team?.text_color || "#7c2d12",
    borderColor: team?.secondary_color || "#fed7aa",
  };
}

function TeamPill({ team, name }: { team?: LeagueTeam | null; name: string }) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-black shadow-sm"
      style={getTeamStyle(team)}
    >
      <span
        className="h-3 w-3 rounded-full border border-white/70"
        style={{ background: team?.secondary_color || "#fb923c" }}
      />
      {team?.logo_url ? <img src={team.logo_url} alt="" className="h-4 w-4 rounded-full object-contain" /> : null}
      {name}
    </span>
  );
}

function findTeam(leagueTeams: LeagueTeam[], name?: string | null, league?: string | null) {
  const n = normalize(name);
  return leagueTeams.find((t) => normalize(t.team_name) === n && (!league || t.league === league))
    || leagueTeams.find((t) => normalize(t.team_name) === n);
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isStarted(match: Match) {
  return new Date(match.match_time).getTime() <= Date.now();
}

function isPlayed(match: Match) {
  return (
    match.match_status === "played" ||
    match.result ||
    (typeof match.home_score === "number" && typeof match.away_score === "number")
  );
}

function outcome(home: number, away: number) {
  if (home > away) return "1";
  if (home < away) return "2";
  return "X";
}

function kg(home: number, away: number) {
  return home > 0 && away > 0 ? "VAR" : "YOK";
}

function over25(home: number, away: number) {
  return home + away > 2.5 ? "ÜST" : "ALT";
}

function matchMultiplier(match: Match) {
  const type = match.match_type || "Normal";
  return type === "Normal" ? 1 : 1.5;
}

function normalize(value?: string | null) {
  return String(value || "").trim().toLocaleLowerCase("tr-TR");
}

function competitionBonus(competition: string) {
  return EURO_COMPETITIONS.find((c) => c.name === competition)?.points || 20;
}

function scorePrediction(
  prediction: ScorePrediction | undefined,
  match: Match,
  favorites: PlayerFavorite[],
) {
  if (!isPlayed(match)) {
    return {
      total: 0,
      detail: "Maç sonucu girilmedi.",
      base: 0,
      favoriteBonus: 0,
      tourBonus: 0,
      exact: false,
      resultCorrect: false,
    };
  }

  if (!prediction) {
    return {
      total: -3,
      detail: "Tahmin yok: -3",
      base: -3,
      favoriteBonus: 0,
      tourBonus: 0,
      exact: false,
      resultCorrect: false,
      missing: true,
    };
  }

  const realHome = Number(match.home_score ?? 0);
  const realAway = Number(match.away_score ?? 0);
  const predHome = Number(prediction.home_goals);
  const predAway = Number(prediction.away_goals);

  let base = 0;
  const parts: string[] = [];
  const exact = predHome === realHome && predAway === realAway;
  const resultCorrect = outcome(predHome, predAway) === outcome(realHome, realAway);

  if (exact) {
    base += 5;
    parts.push("Tam skor +5");
  }
  if (resultCorrect) {
    base += 3;
    parts.push("Sonuç +3");
  }
  if (predHome === realHome) {
    base += 1;
    parts.push("Ev gol +1");
  }
  if (predAway === realAway) {
    base += 1;
    parts.push("Dep gol +1");
  }
  if (kg(predHome, predAway) === kg(realHome, realAway)) {
    base += 1;
    parts.push("KG +1");
  }
  if (over25(predHome, predAway) === over25(realHome, realAway)) {
    base += 1;
    parts.push("2.5 +1");
  }

  const hasFavoriteTeam = favorites.some(
    (fav) =>
      normalize(fav.team_name) === normalize(match.home_team) ||
      normalize(fav.team_name) === normalize(match.away_team),
  );

  const isNational = normalize(match.league).includes("milli");
  const favoriteBonus = hasFavoriteTeam && resultCorrect && !isNational ? 1 : 0;
  if (favoriteBonus) parts.push("Favori +1");

  const tourBonus =
    prediction.advancing_team &&
    match.advancing_team &&
    normalize(prediction.advancing_team) === normalize(match.advancing_team)
      ? 2
      : 0;
  if (tourBonus) parts.push("Turu geçen +2");

  const multiplier = matchMultiplier(match);
  const joker = prediction.is_joker ? 2 : 1;
  const multiplied = Math.round(base * multiplier * joker);
  const total = multiplied + favoriteBonus + tourBonus;

  if (multiplier > 1) parts.push(`${match.match_type} x${multiplier}`);
  if (joker > 1) parts.push("Joker x2");

  return {
    total,
    detail: parts.join(" | ") || "Puan yok",
    base,
    favoriteBonus,
    tourBonus,
    exact,
    resultCorrect,
    missing: false,
  };
}

function getWeeks(matches: Match[], activeWeek: number) {
  const weeks: number[] = Array.from(
    new Set<number>(matches.map((m: Match) => Number(m.week_no || 1)).filter(Boolean) as number[]),
  );
  weeks.sort((a: number, b: number) => a - b);
  return weeks.length ? weeks : [activeWeek || 1];
}

function AppButton({
  children,
  onClick,
  disabled,
  kind = "primary",
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  kind?: "primary" | "soft" | "danger" | "ghost";
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cx(
        "rounded-2xl px-4 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-40",
        kind === "primary" && "bg-orange-500 text-white shadow hover:bg-orange-600",
        kind === "soft" && "bg-orange-100 text-orange-700 hover:bg-orange-200",
        kind === "danger" && "bg-rose-500 text-white hover:bg-rose-600",
        kind === "ghost" && "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50",
      )}
    >
      {children}
    </button>
  );
}

export default function Page() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [oldPredictions, setOldPredictions] = useState<OldPrediction[]>([]);
  const [scorePredictions, setScorePredictions] = useState<ScorePrediction[]>([]);
  const [leagueTeams, setLeagueTeams] = useState<LeagueTeam[]>([]);
  const [favorites, setFavorites] = useState<PlayerFavorite[]>([]);
  const [euroPredictions, setEuroPredictions] = useState<EuroPrediction[]>([]);
  const [leagueWinners, setLeagueWinners] = useState<LeagueWinner[]>([]);
  const [seasonSettings, setSeasonSettings] = useState<SeasonSetting[]>([]);
  const [adminPoints, setAdminPoints] = useState<AdminPoint[]>([]);

  const [loginName, setLoginName] = useState("");
  const [loginCode, setLoginCode] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [tab, setTab] = useState<TabKey>("dashboard");
  const [selectedSeasonId, setSelectedSeasonId] = useState("");
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [leagueFilter, setLeagueFilter] = useState("Tümü");
  const [typeFilter, setTypeFilter] = useState("Tümü");
  const [predictionStatusFilter, setPredictionStatusFilter] = useState("Tümü");
  const [viewedPlayerId, setViewedPlayerId] = useState<string>("");

  const activeSeason = useMemo(
    () => seasons.find((s) => s.is_active) || seasons[0],
    [seasons],
  );
  const selectedSeason = useMemo(
    () => seasons.find((s) => s.id === selectedSeasonId) || activeSeason,
    [seasons, selectedSeasonId, activeSeason],
  );
  const activeSetting = useMemo(
    () => seasonSettings.find((s) => s.season_id === selectedSeason?.id),
    [seasonSettings, selectedSeason?.id],
  );
  const activeWeek = activeSetting?.active_week || 1;
  const isArchive = selectedSeason?.is_archived;
  const isClosed = selectedSeason?.is_closed;

  const activeMatches = useMemo(
    () => matches.filter((m) => m.season_id === selectedSeason?.id),
    [matches, selectedSeason?.id],
  );

  const visibleMatches = useMemo(() => {
    return activeMatches
      .filter((m) => m.is_published !== false)
      .filter((m) => Number(m.week_no || 1) === selectedWeek)
      .filter((m) => leagueFilter === "Tümü" || m.league === leagueFilter)
      .filter((m) => typeFilter === "Tümü" || (m.match_type || "Normal") === typeFilter)
      .sort((a, b) => new Date(a.match_time).getTime() - new Date(b.match_time).getTime());
  }, [activeMatches, selectedWeek, leagueFilter, typeFilter]);

  const currentFavorites = useMemo(
    () => favorites.filter((f) => f.season_id === selectedSeason?.id),
    [favorites, selectedSeason?.id],
  );

  const currentEuroPredictions = useMemo(
    () => euroPredictions.filter((f) => f.season_id === selectedSeason?.id),
    [euroPredictions, selectedSeason?.id],
  );

  const currentScorePredictions = useMemo(
    () => scorePredictions.filter((p) => p.season_id === selectedSeason?.id),
    [scorePredictions, selectedSeason?.id],
  );

  const activePlayers = useMemo(
    () => players.filter((p) => p.is_active !== false),
    [players],
  );

  const myFavorites = useMemo(
    () => currentFavorites.filter((f) => f.player_id === currentPlayer?.id),
    [currentFavorites, currentPlayer?.id],
  );

  const favoriteComplete = REQUIRED_FAVORITE_LEAGUES.every((league) =>
    myFavorites.some((f) => f.league === league && f.team_name),
  );

  const weeks = useMemo(() => getWeeks(activeMatches, activeWeek), [activeMatches, activeWeek]);

  async function loadAll() {
    setLoading(true);
    setMessage("");

    const readTable = async (label: string, query: any) => {
      const { data, error } = await query;
      if (error) {
        console.warn(`${label} okunamadı:`, error.message);
        return [];
      }
      return data || [];
    };

    try {
      const playersData = await readTable("players", supabase.from("players").select("*").order("name"));
      const seasonsData = await readTable("seasons", supabase.from("seasons").select("*").order("created_at"));
      const settingsData = await readTable("season_settings", supabase.from("season_settings").select("*"));
      const matchesData = await readTable("matches", supabase.from("matches").select("*").order("match_time"));
      const teamsData = await readTable("league_teams", supabase.from("league_teams").select("*").order("league").order("team_name"));

      // Bunlar yardımcı tablolar. Birinde hata olursa ana ekranı boşaltmasın.
      const oldPredData = await readTable("predictions", supabase.from("predictions").select("*"));
      const scorePredData = await readTable("score_predictions", supabase.from("score_predictions").select("*"));
      const favData = await readTable("player_favorites", supabase.from("player_favorites").select("*"));
      const euroData = await readTable("european_champion_predictions", supabase.from("european_champion_predictions").select("*"));
      const winnerData = await readTable("league_winners", supabase.from("league_winners").select("*"));
      const adminPointsData = await readTable("admin_points", supabase.from("admin_points").select("*").order("created_at", { ascending: false }));

      setPlayers(playersData as Player[]);
      setSeasons(seasonsData as Season[]);
      setMatches(matchesData as Match[]);
      setLeagueTeams(teamsData as LeagueTeam[]);
      setSeasonSettings(settingsData as SeasonSetting[]);

      setOldPredictions(oldPredData as OldPrediction[]);
      setScorePredictions(scorePredData as ScorePrediction[]);
      setFavorites(favData as PlayerFavorite[]);
      setEuroPredictions(euroData as EuroPrediction[]);
      setLeagueWinners(winnerData as LeagueWinner[]);
      setAdminPoints(adminPointsData as AdminPoint[]);

      const active = (seasonsData as Season[]).find((s) => s.is_active) || (seasonsData as Season[])[0];
      if (!selectedSeasonId && active) {
        setSelectedSeasonId(active.id);
        const setting = (settingsData as SeasonSetting[]).find((s) => s.season_id === active.id);
        setSelectedWeek(setting?.active_week || 1);
      }

      if (!(playersData as Player[]).length && !(teamsData as LeagueTeam[]).length) {
        setMessage("Veriler boş görünüyor. Supabase tabloları veya RLS izinleri kontrol edilmeli.");
      }
    } catch (error: any) {
      setMessage(error?.message || "Veriler yüklenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (activeSetting?.active_week) setSelectedWeek(activeSetting.active_week);
  }, [selectedSeasonId]);

  async function login() {
    const typedName = loginName.trim();
    const typedCode = loginCode.trim();

    if (!typedName) {
      setMessage("Oyuncu adını yazalım.");
      return;
    }

    // Önce ekrandaki güncel listeden bul; bulamazsa direkt Supabase'den tekrar ara.
    // Böylece cache/state boş kalırsa giriş ekranı trip atmaz.
    let player: Player | null = players.find((p) => normalize(p.name) === normalize(typedName)) || null;

    if (!player) {
      const { data, error } = await supabase
        .from("players")
        .select("*")
        .ilike("name", typedName)
        .maybeSingle();

      if (error) {
        setMessage(error.message || "Oyuncu kontrol edilirken hata oluştu.");
        return;
      }
      player = (data as Player | null) || null;
    }

    if (!player) {
      // Türkçe karakter / boşluk farkları için son güvenli arama.
      const { data, error } = await supabase.from("players").select("*");
      if (error) {
        setMessage(error.message || "Oyuncu listesi okunamadı.");
        return;
      }
      player = ((data || []) as Player[]).find((p) => normalize(p.name) === normalize(typedName)) || null;
      if (data?.length) setPlayers(data as Player[]);
    }

    if (!player) {
      setMessage("Oyuncu bulunamadı. İsmi listedeki gibi yazalım.");
      return;
    }

    if (player.is_active === false && !isArchive) {
      setMessage("Bu oyuncu aktif sezonda pasif görünüyor.");
      return;
    }

    if ((player.login_code || "").trim() && (player.login_code || "").trim() !== typedCode) {
      setMessage("Giriş kodu hatalı görünüyor.");
      return;
    }

    setCurrentPlayer(player);
    setIsAdminMode(false);
    setTab("dashboard");
    setMessage(`Hoş geldin ${player.name} ⚽`);
  }

  function adminLogin() {
    if (adminPassword !== ADMIN_PASSWORD) {
      setMessage("Admin şifresi hatalı.");
      return;
    }
    setIsAdminMode(true);
    setTab("admin");
    setMessage("Admin modu açıldı.");
  }

  function logout() {
    setCurrentPlayer(null);
    setIsAdminMode(false);
    setLoginCode("");
    setAdminPassword("");
    setTab("dashboard");
  }

  function predictionFor(playerId: string, matchId: string) {
    return currentScorePredictions.find((p) => p.player_id === playerId && p.match_id === matchId);
  }

  function favoriteListFor(playerId: string) {
    return currentFavorites.filter((f) => f.player_id === playerId);
  }

  function seasonBonusFor(playerId: string) {
    const favs = favoriteListFor(playerId);
    let total = 0;
    const details: string[] = [];

    leagueWinners
      .filter((w) => w.season_id === selectedSeason?.id && w.bonus_applied)
      .forEach((winner) => {
        const euroPred = currentEuroPredictions.find(
          (p) => p.player_id === playerId && p.competition === winner.league,
        );
        if (euroPred && normalize(euroPred.team_name) === normalize(winner.winner_team)) {
          const p = competitionBonus(winner.league);
          total += p;
          details.push(`${winner.league} +${p}`);
          return;
        }

        const fav = favs.find(
          (f) => f.league === winner.league && normalize(f.team_name) === normalize(winner.winner_team),
        );
        if (fav) {
          total += winner.bonus_points || 20;
          details.push(`${winner.league} +${winner.bonus_points || 20}`);
        }
      });

    return { total, details };
  }

  function supportedTeamBonusFor(player: Player) {
    const heartTeam = normalize(player.heart_team);
    if (!heartTeam) return { total: 0, winPoints: 0, championPoints: 0, details: [] as string[] };

    let winPoints = 0;
    const details: string[] = [];

    activeMatches.filter(isPlayed).forEach((match) => {
      const homeWins = Number(match.home_score ?? 0) > Number(match.away_score ?? 0);
      const awayWins = Number(match.away_score ?? 0) > Number(match.home_score ?? 0);
      const supportedWon =
        (normalize(match.home_team) === heartTeam && homeWins) ||
        (normalize(match.away_team) === heartTeam && awayWins);
      if (supportedWon) winPoints += 1;
    });

    let championPoints = 0;
    leagueWinners
      .filter((w) => w.season_id === selectedSeason?.id && w.bonus_applied)
      .forEach((winner) => {
        if (normalize(winner.winner_team) === heartTeam) {
          championPoints += 25;
          details.push(`${winner.league} tuttuğu takım şampiyonluğu +25`);
        }
      });

    const total = winPoints + championPoints;
    if (winPoints) details.unshift(`Tuttuğu takım galibiyetleri +${winPoints}`);
    return { total, winPoints, championPoints, details };
  }

  const scoreRows = useMemo(() => {
    return activePlayers.map((player) => {
      let total = 0;
      let exact = 0;
      let resultCorrect = 0;
      let missing = 0;
      let jokerPoints = 0;
      let favoritePoints = 0;
      let playedCount = 0;
      const playerFavs = favoriteListFor(player.id);

      activeMatches.filter(isPlayed).forEach((match) => {
        playedCount += 1;
        const pred = predictionFor(player.id, match.id);
        const s = scorePrediction(pred, match, playerFavs);
        total += s.total;
        if (s.exact) exact += 1;
        if (s.resultCorrect) resultCorrect += 1;
        if (s.missing) missing += 1;
        if (pred?.is_joker) jokerPoints += Math.max(0, s.total - s.base);
        favoritePoints += s.favoriteBonus || 0;
      });

      const seasonBonus = seasonBonusFor(player.id);
      total += seasonBonus.total;
      favoritePoints += seasonBonus.total;
      const supportedTeamBonus = supportedTeamBonusFor(player);
      total += supportedTeamBonus.total;
      const matchPoints = total - favoritePoints - supportedTeamBonus.total;
      const adminPointTotal = adminPoints
        .filter((p) => p.season_id === selectedSeason?.id && p.player_id === player.id)
        .reduce((sum, p) => sum + Number(p.points || 0), 0);
      total += adminPointTotal;

      return {
        player,
        total,
        matchPoints,
        adminPointTotal,
        supportedTeamPoints: supportedTeamBonus.total,
        supportedTeamWinPoints: supportedTeamBonus.winPoints,
        supportedTeamChampionPoints: supportedTeamBonus.championPoints,
        supportedTeamDetails: supportedTeamBonus.details.join(", "),
        exact,
        resultCorrect,
        missing,
        jokerPoints,
        favoritePoints,
        seasonBonus: seasonBonus.total,
        seasonBonusDetails: seasonBonus.details.join(", "),
        playedCount,
      };
    }).sort((a, b) => b.total - a.total || b.exact - a.exact || b.resultCorrect - a.resultCorrect);
  }, [activePlayers, activeMatches, currentScorePredictions, currentFavorites, leagueWinners, currentEuroPredictions, selectedSeason?.id, adminPoints]);

  const myRank = currentPlayer ? scoreRows.findIndex((r) => r.player.id === currentPlayer.id) + 1 : 0;
  const myRow = currentPlayer ? scoreRows.find((r) => r.player.id === currentPlayer.id) : undefined;

  async function savePrediction(match: Match, home: number, away: number, advancingTeam?: string | null, joker?: boolean) {
    if (!currentPlayer || !selectedSeason) return;
    if (isClosed) {
      setMessage("Sezon kapalı, tahmin düzenlenemez.");
      return;
    }
    if (isStarted(match)) {
      setMessage("Bu maç başladı; tahmin kilitlendi.");
      return;
    }
    if (!favoriteComplete) {
      setMessage("Önce profilinden zorunlu favori takımlarını seçmelisin.");
      setTab("profile");
      return;
    }

    const week = Number(match.week_no || 1);
    const existingWeekJoker = currentScorePredictions.find(
      (p) =>
        p.player_id === currentPlayer.id &&
        p.is_joker &&
        activeMatches.find((m) => m.id === p.match_id && Number(m.week_no || 1) === week),
    );

    const payload = {
      season_id: selectedSeason.id,
      player_id: currentPlayer.id,
      match_id: match.id,
      home_goals: home,
      away_goals: away,
      advancing_team: advancingTeam || null,
      is_joker: Boolean(joker),
      updated_at: new Date().toISOString(),
    };

    if (joker && existingWeekJoker && existingWeekJoker.match_id !== match.id) {
      await supabase
        .from("score_predictions")
        .update({ is_joker: false, updated_at: new Date().toISOString() })
        .eq("season_id", selectedSeason.id)
        .eq("player_id", currentPlayer.id)
        .eq("match_id", existingWeekJoker.match_id);
    }

    const { data, error } = await supabase
      .from("score_predictions")
      .upsert(payload, { onConflict: "season_id,player_id,match_id" })
      .select("*")
      .maybeSingle();

    if (error) {
      setMessage(error.message);
      return false;
    }

    // Tahmin kaydından sonra tüm ekranı yeniden yükleme.
    // Sadece ilgili tahminleri local state içinde güncelle; kullanıcı aynı ekranda devam etsin.
    const savedPrediction = (data || payload) as ScorePrediction;
    setScorePredictions((prev) => {
      let next = prev.map((p) => {
        if (
          joker &&
          existingWeekJoker &&
          existingWeekJoker.match_id !== match.id &&
          p.season_id === selectedSeason.id &&
          p.player_id === currentPlayer.id &&
          p.match_id === existingWeekJoker.match_id
        ) {
          return { ...p, is_joker: false };
        }
        return p;
      });

      const index = next.findIndex(
        (p) =>
          p.season_id === selectedSeason.id &&
          p.player_id === currentPlayer.id &&
          p.match_id === match.id,
      );

      if (index >= 0) {
        next[index] = { ...next[index], ...savedPrediction };
      } else {
        next = [...next, savedPrediction];
      }
      return next;
    });

    return true;
  }

  async function saveFavorite(league: string, teamName: string) {
    if (!currentPlayer || !selectedSeason) return;
    if (isFavoriteLeagueLocked(league) && !isAdminMode) {
      setMessage("Bu lig için favori seçimi kilitlendi.");
      return;
    }
    const { error } = await supabase.from("player_favorites").upsert(
      {
        season_id: selectedSeason.id,
        player_id: currentPlayer.id,
        league,
        team_name: teamName,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "season_id,player_id,league" },
    );
    if (error) setMessage(error.message);
    else {
      setMessage("Favori kaydedildi 💛");
      await loadAll();
    }
  }


  async function saveHeartTeam(teamName: string) {
    if (!currentPlayer) return;
    const { error } = await supabase.from("players").update({ heart_team: teamName || null }).eq("id", currentPlayer.id);
    if (error) setMessage(error.message);
    else {
      setCurrentPlayer({ ...currentPlayer, heart_team: teamName || null });
      setMessage("Tuttuğun takım kaydedildi ❤️");
      await loadAll();
    }
  }

  function isFavoriteLeagueLocked(league: string) {
    const first = activeMatches
      .filter((m) => m.league === league)
      .sort((a, b) => new Date(a.match_time).getTime() - new Date(b.match_time).getTime())[0];
    return first ? isStarted(first) : false;
  }

  function isEuroLocked(competition: string) {
    const first = activeMatches
      .filter((m) => m.league === competition)
      .sort((a, b) => new Date(a.match_time).getTime() - new Date(b.match_time).getTime())[0];
    return first ? isStarted(first) : false;
  }

  async function saveEuroPrediction(competition: string, teamName: string) {
    if (!currentPlayer || !selectedSeason) return;
    if (isEuroLocked(competition) && !isAdminMode) {
      setMessage("Bu kupanın lig aşaması başladı; şampiyon tahmini kilitlendi.");
      return;
    }
    const { error } = await supabase.from("european_champion_predictions").upsert(
      {
        season_id: selectedSeason.id,
        player_id: currentPlayer.id,
        competition,
        team_name: teamName,
        is_locked: isEuroLocked(competition),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "season_id,player_id,competition" },
    );
    if (error) setMessage(error.message);
    else {
      setMessage("Avrupa kupası şampiyon tahmini kaydedildi 🏆");
      await loadAll();
    }
  }

  function teamOptions(league: string) {
    return leagueTeams.filter((t) => t.league === league && t.is_active !== false);
  }

  function predictionVisibilityText(match: Match) {
    if (!isStarted(match)) return "Tahminler maç saatine kadar gizli.";
    if (!isPlayed(match)) return "Maç başladı; tahminler görünür, puanlar sonuç sonrası.";
    return "Sonuç girildi; tahmin ve puanlar görünür.";
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_32%),linear-gradient(135deg,#ecfdf5_0%,#fff7ed_45%,#fff1f2_100%)] text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <header className="mb-6 rounded-[2rem] bg-white/85 p-5 shadow-xl ring-1 ring-orange-100 backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <img src={MASCOT_SRC} alt="ORS" className="h-16 w-16 rounded-3xl bg-orange-100 object-contain p-2" />
              <div>
                <div className="text-xs font-black uppercase tracking-[0.25em] text-orange-500">World Cup arşiv + 2026-2027 sezonu</div>
                <h1 className="text-3xl font-black tracking-tight text-slate-900">ORS Kahvaltı Ligi</h1>
                <p className="text-sm text-slate-500">Skor tahmini, haftalık joker, favoriler ve sezonluk Avrupa bonusları ⚽</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedSeason?.id || ""}
                onChange={(e) => {
                  setSelectedSeasonId(e.target.value);
                  const setting = seasonSettings.find((s) => s.season_id === e.target.value);
                  setSelectedWeek(setting?.active_week || 1);
                }}
                className="rounded-2xl border border-orange-200 bg-white px-4 py-2 text-sm font-bold outline-none"
              >
                {seasons.map((season) => (
                  <option key={season.id} value={season.id}>{season.name}</option>
                ))}
              </select>
              <AppButton kind="ghost" onClick={loadAll}>🔄 Güncelle</AppButton>
              {currentPlayer ? <AppButton kind="soft" onClick={logout}>Çıkış</AppButton> : null}
            </div>
          </div>

          {message ? <div className="mt-4 rounded-2xl bg-orange-100 px-4 py-3 text-sm font-semibold text-orange-800">{message}</div> : null}
        </header>

        {!currentPlayer && !isAdminMode ? (
          <section className="grid gap-4">
            <div className="rounded-[2rem] bg-white p-6 shadow-xl ring-1 ring-orange-100">
              <h2 className="text-xl font-black">Oyuncu girişi</h2>
              <p className="mt-1 text-sm text-slate-500">İsim + kişisel giriş kodu ile tahmin ekranına gir.</p>
              <div className="mt-5 grid gap-3">
                <input value={loginName} onChange={(e) => setLoginName(e.target.value)} placeholder="Adın" className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-400" />
                <input value={loginCode} onChange={(e) => setLoginCode(e.target.value)} placeholder="Giriş kodu" className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-400" />
                <AppButton onClick={login}>Giriş yap</AppButton>
              </div>
            </div>
          </section>
        ) : null}

        {(currentPlayer || isAdminMode) && (
          <>
            <nav className="mb-5 flex gap-2 overflow-x-auto rounded-[2rem] bg-white/80 p-2 shadow ring-1 ring-orange-100">
              {[
                ["dashboard", "🏠 Dashboard"],
                ["predict", "⚽ Tahmin Yap"],
                ["matches", "📋 Maçlar"],
                ["profile", "👤 Profil"],
                ["compare", "🆚 Karşılaştır"],
                ["teams", "🏟️ Takımlar"],
                ["stats", "📊 İstatistikler"],
                ["rules", "📜 Kurallar"],
                ...(((currentPlayer?.is_admin || normalize(currentPlayer?.name) === "burcu" || isAdminMode)) ? [["admin", isAdminMode ? "⚙️ Admin" : "🔐 Admin"]] : []),
              ].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => { if (key === "profile") setViewedPlayerId(""); setTab(key as TabKey); }}
                  className={cx(
                    "shrink-0 rounded-2xl px-4 py-2 text-sm font-black transition",
                    tab === key ? "bg-orange-500 text-white shadow" : "text-slate-600 hover:bg-orange-100",
                  )}
                >
                  {label}
                </button>
              ))}
            </nav>

            {loading ? (
              <div className="rounded-[2rem] bg-white p-8 text-center font-bold shadow">Yükleniyor...</div>
            ) : (
              <>
                {tab === "dashboard" && (
                  <Dashboard
                    scoreRows={scoreRows}
                    currentPlayer={currentPlayer}
                    myRank={myRank}
                    myRow={myRow}
                    selectedSeason={selectedSeason}
                    activeWeek={activeWeek}
                    activeMatches={activeMatches}
                    leagueTeams={leagueTeams}
                    onViewProfile={(playerId: string) => { setViewedPlayerId(playerId); setTab("profile"); }}
                  />
                )}
                {tab === "predict" && (
                  <PredictTab
                    isArchive={Boolean(isArchive)}
                    isClosed={Boolean(isClosed)}
                    currentPlayer={currentPlayer}
                    favoriteComplete={favoriteComplete}
                    selectedWeek={selectedWeek}
                    setSelectedWeek={setSelectedWeek}
                    weeks={weeks}
                    leagueFilter={leagueFilter}
                    setLeagueFilter={setLeagueFilter}
                    typeFilter={typeFilter}
                    setTypeFilter={setTypeFilter}
                    predictionStatusFilter={predictionStatusFilter}
                    setPredictionStatusFilter={setPredictionStatusFilter}
                    visibleMatches={visibleMatches}
                    predictions={currentScorePredictions}
                    savePrediction={savePrediction}
                    activeMatches={activeMatches}
                    leagueTeams={leagueTeams}
                  />
                )}
                {tab === "matches" && (
                  <MatchesTab
                    selectedWeek={selectedWeek}
                    setSelectedWeek={setSelectedWeek}
                    weeks={weeks}
                    leagueFilter={leagueFilter}
                    setLeagueFilter={setLeagueFilter}
                    typeFilter={typeFilter}
                    setTypeFilter={setTypeFilter}
                    predictionStatusFilter={predictionStatusFilter}
                    setPredictionStatusFilter={setPredictionStatusFilter}
                    visibleMatches={visibleMatches}
                    players={activePlayers}
                    predictions={currentScorePredictions}
                    favorites={currentFavorites}
                    oldPredictions={oldPredictions}
                    isArchive={Boolean(isArchive)}
                    visibilityText={predictionVisibilityText}
                    leagueTeams={leagueTeams}
                  />
                )}
                {tab === "profile" && currentPlayer && (
                  <ProfileTab
                    currentPlayer={currentPlayer}
                    profilePlayer={players.find((p) => p.id === viewedPlayerId) || currentPlayer}
                    isOwnProfile={(players.find((p) => p.id === viewedPlayerId) || currentPlayer).id === currentPlayer.id}
                    selectedSeason={selectedSeason}
                    allFavorites={currentFavorites}
                    allPredictions={currentScorePredictions}
                    euroPredictions={currentEuroPredictions}
                    teamOptions={teamOptions}
                    saveFavorite={saveFavorite}
                    saveEuroPrediction={saveEuroPrediction}
                    saveHeartTeam={saveHeartTeam}
                    isFavoriteLeagueLocked={isFavoriteLeagueLocked}
                    isEuroLocked={isEuroLocked}
                    activeMatches={activeMatches}
                    leagueTeams={leagueTeams}
                  />
                )}
                {tab === "compare" && <CompareTab scoreRows={scoreRows} />}
                {tab === "teams" && <TeamsTab leagueTeams={leagueTeams} />}
                {tab === "stats" && <StatsTab scoreRows={scoreRows} activeMatches={activeMatches} predictions={currentScorePredictions} favorites={currentFavorites} players={activePlayers} />}
                {tab === "rules" && <RulesTab />}
                {tab === "admin" && (currentPlayer?.is_admin || normalize(currentPlayer?.name) === "burcu") && !isAdminMode && (
                  <section className="rounded-[2rem] bg-white p-6 shadow-xl ring-1 ring-orange-100">
                    <h2 className="text-xl font-black">🔐 Admin kilidi</h2>
                    <p className="mt-1 text-sm text-slate-500">Burcu hesabındasın; admin paneli için ikinci şifreyi gir.</p>
                    <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]">
                      <input value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} placeholder="Admin şifresi" type="password" className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-400" />
                      <AppButton onClick={adminLogin}>Admin panelini aç</AppButton>
                    </div>
                  </section>
                )}
                {tab === "admin" && isAdminMode && selectedSeason && (
                  <AdminTab
                    selectedSeason={selectedSeason}
                    seasons={seasons}
                    activeWeek={activeWeek}
                    leagueTeams={leagueTeams}
                    players={players}
                    matches={activeMatches}
                    leagueWinners={leagueWinners.filter((w) => w.season_id === selectedSeason.id)}
                    adminPoints={adminPoints.filter((p) => p.season_id === selectedSeason.id)}
                    predictions={currentScorePredictions}
                    favorites={currentFavorites}
                    reload={loadAll}
                    setMessage={setMessage}
                  />
                )}
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function Dashboard({ scoreRows, currentPlayer, myRank, myRow, selectedSeason, activeWeek, activeMatches, onViewProfile }: any) {
  const weekMatches = activeMatches.filter((m: Match) => Number(m.week_no || 1) === activeWeek);
  const played = activeMatches.filter(isPlayed).length;
  const leader = scoreRows[0];

  return (
    <div className="grid gap-5">
      <section className="grid gap-4 md:grid-cols-4">
        <InfoCard title="Aktif Hafta" value={`Hafta ${activeWeek}`} note={`${weekMatches.length} maç yayında`} />
        <InfoCard title="Lider" value={leader?.player.name || "-"} note={`${leader?.total || 0} puan`} />
        <InfoCard title="Oynanan Maç" value={played} note={selectedSeason?.name || ""} />
        <InfoCard title="Benim Sıram" value={currentPlayer ? `${myRank}.` : "-"} note={myRow ? `${myRow.total} puan` : "Giriş yap"} />
      </section>

      <section className="rounded-[2rem] bg-white p-5 shadow-xl ring-1 ring-orange-100">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black">Puan Tablosu</h2>
            <p className="text-sm text-slate-500">Şeffaf tablo: maç puanı, admin puanı ve toplam ayrı görünür.</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-slate-400">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">Oyuncu</th>
                <th className="p-3">Maç Puanı</th>
                <th className="p-3">Favori Puanı</th>
                <th className="p-3">Tuttuğu Takım</th>
                <th className="p-3">Admin Puanı</th>
                <th className="p-3">Toplam</th>
                <th className="p-3">Tam Skor</th>
                <th className="p-3">Doğru Sonuç</th>
                <th className="p-3">Tahmin Yok</th>
                <th className="p-3">Sezon Bonus</th>
              </tr>
            </thead>
            <tbody>
              {scoreRows.map((row: any, index: number) => (
                <tr key={row.player.id} className="border-t border-slate-100">
                  <td className="p-3 font-black">{index + 1}</td>
                  <td className="p-3 font-bold"><button onClick={() => onViewProfile(row.player.id)} className="font-black text-slate-800 underline decoration-orange-300 underline-offset-4 hover:text-orange-600">{index === 0 ? "👑 " : ""}{row.player.name}</button></td>
                  <td className="p-3 font-black text-slate-700">{row.matchPoints}</td>
                  <td className="p-3 font-black text-pink-600" title={row.seasonBonusDetails}>{row.favoritePoints}</td>
                  <td className="p-3 font-black text-emerald-600" title={row.supportedTeamDetails}>{row.supportedTeamPoints}</td>
                  <td className={cx("p-3 font-black", row.adminPointTotal > 0 ? "text-green-600" : row.adminPointTotal < 0 ? "text-rose-600" : "text-slate-400")}>{row.adminPointTotal}</td>
                  <td className="p-3 text-lg font-black text-orange-600">{row.total}</td>
                  <td className="p-3">{row.exact}</td>
                  <td className="p-3">{row.resultCorrect}</td>
                  <td className="p-3">{row.missing}</td>
                  <td className="p-3" title={row.seasonBonusDetails}>{row.seasonBonus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function InfoCard({ title, value, note }: any) {
  return (
    <div className="rounded-[2rem] bg-white p-5 shadow-xl ring-1 ring-orange-100">
      <div className="text-xs font-black uppercase tracking-wider text-orange-400">{title}</div>
      <div className="mt-2 text-3xl font-black text-slate-900">{value}</div>
      <div className="mt-1 text-sm text-slate-500">{note}</div>
    </div>
  );
}

function Filters({ selectedWeek, setSelectedWeek, weeks, leagueFilter, setLeagueFilter, typeFilter, setTypeFilter, predictionStatusFilter, setPredictionStatusFilter, showPredictionStatus = false }: any) {
  return (
    <div className="mb-4 grid gap-2 rounded-[2rem] bg-white p-3 shadow ring-1 ring-orange-100 md:grid-cols-4">
      <select value={selectedWeek} onChange={(e) => setSelectedWeek(Number(e.target.value))} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-bold">
        {weeks.map((w: number) => <option key={w} value={w}>Hafta {w}</option>)}
      </select>
      <select value={leagueFilter} onChange={(e) => setLeagueFilter(e.target.value)} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-bold">
        <option>Tümü</option>
        {LEAGUES.map((l) => <option key={l}>{l}</option>)}
      </select>
      <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-bold">
        <option>Tümü</option>
        {MATCH_TYPES.map((l) => <option key={l}>{l}</option>)}
      </select>
      {showPredictionStatus ? (
        <select value={predictionStatusFilter} onChange={(e) => setPredictionStatusFilter(e.target.value)} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-bold">
          <option>Tümü</option>
          <option>Tahmin yapıldı</option>
          <option>Tahmin bekliyor</option>
          <option>Kilitlendi</option>
        </select>
      ) : null}
    </div>
  );
}

function predictionCardStatus(match: Match, prediction?: ScorePrediction) {
  if (isStarted(match)) return "Kilitlendi";
  if (prediction) return "Tahmin yapıldı";
  return "Tahmin bekliyor";
}

function formatDayHeader(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Tarih yok";
  return d.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" });
}

function groupMatchesByDay(matches: Match[]) {
  return matches.reduce((acc: Record<string, Match[]>, match) => {
    const key = formatDayHeader(match.match_time);
    acc[key] = acc[key] || [];
    acc[key].push(match);
    return acc;
  }, {});
}



function normalizeForm(value?: string | null) {
  const tokens = String(value || "")
    .toUpperCase()
    .replaceAll(",", " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((x) => (x.startsWith("W") || x.startsWith("G") ? "W" : x.startsWith("D") || x.startsWith("B") ? "D" : x.startsWith("L") || x.startsWith("M") ? "L" : ""))
    .filter(Boolean)
    .slice(0, 5);
  return tokens;
}

function formStats(form: string[]) {
  const w = form.filter((x) => x === "W").length;
  const d = form.filter((x) => x === "D").length;
  const l = form.filter((x) => x === "L").length;
  return { w, d, l, score: w * 3 + d };
}

function formDots(form: string[]) {
  if (!form.length) return <span className="text-slate-400">Form yok</span>;
  return <span className="tracking-wide">{form.map((x, i) => x === "W" ? <span key={i}>🟢 </span> : x === "D" ? <span key={i}>⚪ </span> : <span key={i}>🔴 </span>)}</span>;
}

function getTeamForm(teamName: string, league: string | null | undefined, leagueTeams: LeagueTeam[], activeMatches: Match[]) {
  const normalizedTeam = normalize(teamName);
  const played = activeMatches
    .filter(isPlayed)
    .filter((m) => normalize(m.home_team) === normalizedTeam || normalize(m.away_team) === normalizedTeam)
    .sort((a, b) => new Date(b.match_time).getTime() - new Date(a.match_time).getTime())
    .slice(0, 5)
    .map((m) => {
      const home = Number(m.home_score ?? 0);
      const away = Number(m.away_score ?? 0);
      const isHome = normalize(m.home_team) === normalizedTeam;
      if (home === away) return "D";
      const teamWon = isHome ? home > away : away > home;
      return teamWon ? "W" : "L";
    });
  if (played.length) return played;
  const team = findTeam(leagueTeams, teamName, league);
  return normalizeForm(team?.manual_form);
}

function smartRandomScore(homeForm: string[], awayForm: string[]) {
  const homePower = formStats(homeForm).score + 1;
  const awayPower = formStats(awayForm).score;
  const diff = homePower - awayPower;
  const homeWin = ["1-0", "2-0", "2-1", "3-1"];
  const awayWin = ["0-1", "1-2", "0-2", "1-3"];
  const draw = ["0-0", "1-1", "2-2"];
  let pool = [...homeWin, ...awayWin, ...draw];
  if (diff >= 5) pool = [...homeWin, ...homeWin, ...homeWin, ...draw, "1-2"];
  else if (diff >= 2) pool = [...homeWin, ...homeWin, ...draw, ...awayWin.slice(0, 1)];
  else if (diff <= -5) pool = [...awayWin, ...awayWin, ...awayWin, ...draw, "2-1"];
  else if (diff <= -2) pool = [...awayWin, ...awayWin, ...draw, ...homeWin.slice(0, 1)];
  else pool = [...draw, ...draw, ...homeWin.slice(0, 2), ...awayWin.slice(0, 2)];
  const pick = pool[Math.floor(Math.random() * pool.length)] || "1-1";
  const [h, a] = pick.split("-").map(Number);
  return { home: h, away: a, confidence: Math.abs(diff) };
}

function badgeCountsForPlayer(playerId: string, activeMatches: Match[], predictions: ScorePrediction[], favs: PlayerFavorite[]) {
  const counts: Record<string, number> = {};
  activeMatches.filter(isPlayed).forEach((match) => {
    const pred = predictions.find((p) => p.player_id === playerId && p.match_id === match.id);
    const s = scorePrediction(pred, match, favs);
    if (s.exact) counts["🎯 Tam Skorcu"] = (counts["🎯 Tam Skorcu"] || 0) + 1;
    if (pred?.is_joker && s.total > 0) counts["🃏 Joker Ustası"] = (counts["🃏 Joker Ustası"] || 0) + 1;
    if (s.favoriteBonus) counts["❤️ Favori Fanatiği"] = (counts["❤️ Favori Fanatiği"] || 0) + 1;
    if ((match.match_type || "") === "Derbi" && s.resultCorrect) counts["🏟️ Derbi Kahini"] = (counts["🏟️ Derbi Kahini"] || 0) + 1;
    if ((match.match_type || "").includes("Avrupa") && s.resultCorrect) counts["🌍 Avrupa Uzmanı"] = (counts["🌍 Avrupa Uzmanı"] || 0) + 1;
  });
  return counts;
}

function StatMiniCard({ icon, value, label }: any) {
  return (
    <div className="rounded-3xl bg-white/90 p-4 text-center shadow-sm ring-1 ring-white/70 backdrop-blur">
      <div className="text-lg">{icon}</div>
      <div className="mt-1 text-2xl font-black text-slate-900">{value}</div>
      <div className="text-[11px] font-black uppercase tracking-wide text-slate-400">{label}</div>
    </div>
  );
}

function PredictTab(props: any) {
  const { isArchive, isClosed, currentPlayer, favoriteComplete, visibleMatches, predictions, savePrediction, activeMatches, leagueTeams, predictionStatusFilter } = props;
  if (isArchive) return <Notice title="Arşiv sezonu" text="Bu sezon kapalı. Eski tahminler Maçlar ekranında görüntülenir." />;
  if (!currentPlayer) return <Notice title="Giriş gerekli" text="Tahmin yapmak için oyuncu girişi yapmalısın." />;
  if (isClosed) return <Notice title="Sezon kapalı" text="Sezon kapatıldığı için yeni tahmin alınmıyor." />;
  if (!favoriteComplete) return <Notice title="Favoriler eksik" text="Tahmin ekranı açılmadan önce Profil sekmesinden zorunlu lig favorilerini seçmelisin." />;

  const weekMatches = activeMatches
    .filter((m: Match) => m.is_published !== false)
    .filter((m: Match) => Number(m.week_no || 1) === props.selectedWeek);

  const myWeekPredictions = predictions.filter((p: ScorePrediction) => {
    const match = weekMatches.find((m: Match) => m.id === p.match_id);
    return p.player_id === currentPlayer.id && Boolean(match);
  });

  const weekJoker = myWeekPredictions.find((p: ScorePrediction) => p.is_joker);
  const predictedCount = myWeekPredictions.length;
  const missingCount = Math.max(weekMatches.length - predictedCount, 0);

  const displayMatches = visibleMatches.filter((match: Match) => {
    if (!predictionStatusFilter || predictionStatusFilter === "Tümü") return true;
    const pred = predictions.find((p: ScorePrediction) => p.player_id === currentPlayer.id && p.match_id === match.id);
    return predictionCardStatus(match, pred) === predictionStatusFilter;
  });

  const grouped = groupMatchesByDay(displayMatches);

  return (
    <div>
      <Filters {...props} showPredictionStatus />

      <section className="mb-5 overflow-hidden rounded-[2.2rem] bg-gradient-to-br from-emerald-900 via-emerald-800 to-slate-950 p-5 text-white shadow-2xl ring-1 ring-emerald-700/40">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-200">ORS Kahvaltı Ligi</div>
            <h2 className="mt-1 text-2xl font-black tracking-tight">HAFTA {props.selectedWeek} TAHMİN MERKEZİ</h2>
            <p className="mt-1 text-sm font-semibold text-emerald-100/80">Maç başlamadan skorunu değiştir, jokerini başka maça taşı.</p>
          </div>
          <span className={cx("rounded-2xl px-3 py-1 text-xs font-black shadow", weekJoker ? "bg-orange-500 text-white" : "bg-white/15 text-emerald-50 ring-1 ring-white/20")}>🃏 Joker {weekJoker ? "Kullanıldı" : "Kullanılmadı"}</span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatMiniCard icon="⚽" value={weekMatches.length} label="Maç" />
          <StatMiniCard icon="✅" value={predictedCount} label="Tahmin" />
          <StatMiniCard icon="⚠️" value={missingCount} label="Eksik" />
          <StatMiniCard icon="🃏" value={weekJoker ? "Var" : "Yok"} label="Joker" />
        </div>
        {missingCount > 0 ? (
          <div className="mt-4 rounded-2xl bg-amber-300/15 px-4 py-3 text-sm font-bold text-amber-100 ring-1 ring-amber-200/20">
            ⚠️ Bu hafta {missingCount} maç için tahminin eksik.
          </div>
        ) : (
          <div className="mt-4 rounded-2xl bg-emerald-300/15 px-4 py-3 text-sm font-bold text-emerald-100 ring-1 ring-emerald-200/20">
            ✅ Bu haftanın tüm tahminleri tamam. Kahvaltı kupası kokusu geldi.
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <AppButton kind="soft" onClick={async () => {
            const mode = window.confirm("Tamam dersen tüm açık tahminleri yeniden oluştururum. İptal dersen sadece eksikleri doldururum.") ? "all" : "missing";
            const openMatches = weekMatches.filter((m: Match) => !isStarted(m));
            const candidates: Array<{ match: Match; home: number; away: number; confidence: number }> = [];
            openMatches.forEach((match: Match) => {
              const existing = predictions.find((p: ScorePrediction) => p.player_id === currentPlayer.id && p.match_id === match.id);
              if (mode === "missing" && existing) return;
              const hForm = getTeamForm(match.home_team, match.league, leagueTeams || [], activeMatches);
              const aForm = getTeamForm(match.away_team, match.league, leagueTeams || [], activeMatches);
              const r = smartRandomScore(hForm, aForm);
              candidates.push({ match, ...r });
            });
            if (!candidates.length) return;
            const jokerPick = candidates.sort((a, b) => b.confidence - a.confidence)[0];
            for (const item of candidates) {
              await savePrediction(item.match, item.home, item.away, null, item.match.id === jokerPick.match.id);
            }
          }}>🎲 Haftayı rastgele doldur</AppButton>
        </div>
      </section>

      <div className="grid gap-5">
        {Object.entries(grouped).map(([day, matches]) => (
          <section key={day} className="grid gap-3">
            <h3 className="flex items-center justify-between rounded-2xl bg-white/80 px-4 py-3 text-sm font-black text-slate-700 shadow-sm ring-1 ring-emerald-100">
              <span>📅 {day}</span>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] text-emerald-700">{(matches as Match[]).length} maç</span>
            </h3>
            <div className="grid gap-4 lg:grid-cols-2">
              {(matches as Match[]).map((match: Match) => (
                <PredictionCard key={match.id} match={match} prediction={predictions.find((p: ScorePrediction) => p.player_id === currentPlayer.id && p.match_id === match.id)} savePrediction={savePrediction} leagueTeams={leagueTeams} activeMatches={activeMatches} />
              ))}
            </div>
          </section>
        ))}
      </div>

      {displayMatches.length === 0 ? <Notice title="Maç bulunamadı" text="Seçili filtrelerde gösterilecek maç yok." /> : null}
    </div>
  );
}

function PredictionCard({ match, prediction, savePrediction, leagueTeams, activeMatches }: any) {
  const [home, setHome] = useState<number>(prediction?.home_goals ?? 0);
  const [away, setAway] = useState<number>(prediction?.away_goals ?? 0);
  const [advancing, setAdvancing] = useState<string>(prediction?.advancing_team || "");
  const [joker, setJoker] = useState<boolean>(Boolean(prediction?.is_joker));
  const [quickOpen, setQuickOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">(prediction ? "saved" : "idle");
  const locked = isStarted(match);
  const homeTeamLook = findTeam(leagueTeams || [], match.home_team, match.league);
  const awayTeamLook = findTeam(leagueTeams || [], match.away_team, match.league);
  const status = predictionCardStatus(match, prediction);
  const homeForm = getTeamForm(match.home_team, match.league, leagueTeams || [], activeMatches || []);
  const awayForm = getTeamForm(match.away_team, match.league, leagueTeams || [], activeMatches || []);
  const homeStats = formStats(homeForm);
  const awayStats = formStats(awayForm);

  useEffect(() => {
    setHome(prediction?.home_goals ?? 0);
    setAway(prediction?.away_goals ?? 0);
    setAdvancing(prediction?.advancing_team || "");
    setJoker(Boolean(prediction?.is_joker));
  }, [prediction?.id, prediction?.home_goals, prediction?.away_goals, prediction?.is_joker, prediction?.advancing_team]);

  async function saveWithCardState(h: number, a: number, adv: string | null, useJoker: boolean) {
    setSaveState("saving");
    const ok = await savePrediction(match, h, a, adv, useJoker);
    setSaveState(ok ? "saved" : "error");
  }

  function quick(value: string) {
    const [h, a] = value.split("-").map(Number);
    setHome(h);
    setAway(a);
    void saveWithCardState(h, a, advancing || null, joker);
  }

  function saveCurrent(nextJoker = joker) {
    void saveWithCardState(home, away, advancing || null, nextJoker);
  }

  return (
    <div className="overflow-hidden rounded-[2rem] bg-white shadow-xl ring-1 ring-emerald-100">
      <div
        className="h-1.5"
        style={{ background: `linear-gradient(90deg, ${homeTeamLook?.primary_color || "#10b981"}, ${awayTeamLook?.primary_color || "#fb923c"})` }}
      />
      <div className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-[11px] font-black uppercase tracking-wide text-slate-400">
          {match.league || "Lig yok"} · Hafta {match.week_no || 1} · {formatDate(match.match_time)} · {match.match_type || "Normal"}
        </div>
        <span className={cx(
          "rounded-2xl px-2.5 py-1 text-[11px] font-black",
          status === "Kilitlendi" && "bg-slate-200 text-slate-600",
          status === "Tahmin yapıldı" && "bg-green-100 text-green-700",
          status === "Tahmin bekliyor" && "bg-amber-100 text-amber-700",
        )}>
          {status === "Kilitlendi" ? "🔒 Tahmin kapandı" : status === "Tahmin yapıldı" ? "✅ Tahmin kaydedildi" : "⚠️ Tahmin bekliyor"}
        </span>
      </div>

      <div className="mt-4 flex flex-col items-center justify-center gap-2 md:flex-row md:gap-4">
        <TeamPill team={homeTeamLook} name={match.home_team} />
        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black text-slate-400">VS</span>
        <TeamPill team={awayTeamLook} name={match.away_team} />
      </div>

      <div className="mt-4 grid items-center gap-3 md:grid-cols-[1fr_auto_1fr]">
        <div className="flex items-center justify-between gap-2 rounded-2xl bg-slate-50 p-2 md:justify-end">
          <span className="truncate text-xs font-black text-slate-600 md:max-w-[130px]">{match.home_team}</span>
          <select disabled={locked} value={home} onChange={(e) => setHome(Number(e.target.value))} className="h-12 w-16 rounded-2xl border border-slate-200 bg-white text-center text-xl font-black shadow-sm disabled:bg-slate-100">
            {GOAL_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <span className="hidden text-lg font-black text-slate-400 md:block">-</span>
        <div className="flex items-center justify-between gap-2 rounded-2xl bg-slate-50 p-2">
          <select disabled={locked} value={away} onChange={(e) => setAway(Number(e.target.value))} className="h-12 w-16 rounded-2xl border border-slate-200 bg-white text-center text-xl font-black shadow-sm disabled:bg-slate-100">
            {GOAL_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          <span className="truncate text-xs font-black text-slate-600 md:max-w-[130px]">{match.away_team}</span>
        </div>
      </div>

      <div className="mt-3 grid gap-2 rounded-2xl bg-emerald-50/70 p-3 text-xs font-bold text-slate-600 md:grid-cols-2">
        <div><span className="font-black">{match.home_team} form:</span> {formDots(homeForm)}<div className="mt-1 text-[11px] text-slate-500">Son 5 maç: {homeStats.w}G {homeStats.d}B {homeStats.l}M</div></div>
        <div><span className="font-black">{match.away_team} form:</span> {formDots(awayForm)}<div className="mt-1 text-[11px] text-slate-500">Son 5 maç: {awayStats.w}G {awayStats.d}B {awayStats.l}M</div></div>
      </div>

      {match.is_knockout && match.tie_leg !== "first" ? (
        <div className="mt-3">
          <label className="text-[11px] font-black text-slate-500">Turu geçen takım</label>
          <select disabled={locked} value={advancing} onChange={(e) => setAdvancing(e.target.value)} className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm font-bold disabled:bg-slate-100">
            <option value="">Seç</option>
            <option>{match.home_team}</option>
            <option>{match.away_team}</option>
          </select>
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <AppButton kind={joker ? "primary" : "soft"} disabled={locked} onClick={() => { const next = !joker; setJoker(next); saveCurrent(next); }}>{joker ? "🃏 Joker seçildi" : "🃏 Joker yap"}</AppButton>
        <AppButton kind="ghost" disabled={locked} onClick={() => { const r = smartRandomScore(homeForm, awayForm); setHome(r.home); setAway(r.away); void saveWithCardState(r.home, r.away, advancing || null, joker); }}>🎲 Rastgele</AppButton>
        <AppButton kind="ghost" disabled={locked} onClick={() => setQuickOpen(!quickOpen)}>⚡ Hızlı skorlar</AppButton>
        <AppButton disabled={locked || saveState === "saving"} onClick={() => saveCurrent()}>{saveState === "saving" ? "Kaydediliyor..." : "Tahmini kaydet"}</AppButton>
      </div>

      <div className={cx(
        "mt-3 rounded-2xl px-3 py-2 text-xs font-black",
        saveState === "saving" && "bg-amber-50 text-amber-700",
        saveState === "saved" && "bg-green-50 text-green-700",
        saveState === "error" && "bg-rose-50 text-rose-700",
        saveState === "idle" && "hidden",
      )}>
        {saveState === "saving" ? "Kaydediliyor..." : saveState === "saved" ? "Kaydedildi ✅" : "Kaydedilemedi, tekrar dene."}
      </div>

      {quickOpen ? (
        <div className="mt-3 flex flex-wrap gap-2 rounded-2xl bg-orange-50 p-3">
          {QUICK_SCORES.map((s) => <button disabled={locked} key={s} onClick={() => quick(s)} className="rounded-xl bg-white px-3 py-1 text-xs font-black text-orange-700 shadow-sm disabled:opacity-40">{s}</button>)}
        </div>
      ) : null}

      <div className="mt-4 rounded-2xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">
        Puan: Tam skor +5 · Sonuç +3{joker ? " · Joker x2" : ""}{match.match_type !== "Normal" ? ` · ${match.match_type} x1.5` : ""}
        <button onClick={() => setDetailOpen(!detailOpen)} className="ml-2 font-black text-orange-600">{detailOpen ? "Detayı kapat" : "Detay göster"}</button>
        {detailOpen ? (
          <div className="mt-2 grid gap-1 text-[11px] font-semibold text-slate-500">
            <span>Ev gol +1 · Dep gol +1</span>
            <span>KG Var/Yok +1 · 2.5 Üst/Alt +1</span>
            <span>Favori takım bonusu +1</span>
            {match.is_knockout && match.tie_leg !== "first" ? <span>Eleme/kupa tur tahmini +2</span> : null}
          </div>
        ) : null}
      </div>
      </div>
    </div>
  );
}

function MatchesTab(props: any) {
  const { visibleMatches, players, predictions, favorites, isArchive, oldPredictions, visibilityText, leagueTeams } = props;
  return (
    <div>
      <Filters {...props} />
      <div className="grid gap-4">
        {visibleMatches.map((match: Match) => {
          const homeTeamLook = findTeam(leagueTeams || [], match.home_team, match.league);
          const awayTeamLook = findTeam(leagueTeams || [], match.away_team, match.league);
          return (
          <div key={match.id} className="rounded-[2rem] bg-white p-5 shadow-xl ring-1 ring-orange-100">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="text-xs font-black uppercase text-orange-400">Hafta {match.week_no || 1} • {match.league || "-"} • {match.match_type || "Normal"}</div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <TeamPill team={homeTeamLook} name={match.home_team} />
                  <span className="font-black text-slate-400">-</span>
                  <TeamPill team={awayTeamLook} name={match.away_team} />
                </div>
                <p className="text-sm text-slate-500">{formatDate(match.match_time)} • {visibilityText(match)}</p>
              </div>
              <div className="rounded-2xl bg-slate-100 px-4 py-2 text-center font-black">
                {isPlayed(match) ? `${match.home_score} - ${match.away_score}` : "Sonuç yok"}
              </div>
            </div>

            {!isStarted(match) ? null : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[700px] text-sm">
                  <thead className="text-left text-xs uppercase text-slate-400">
                    <tr><th className="p-2">Oyuncu</th><th className="p-2">Tahmin</th><th className="p-2">Joker</th><th className="p-2">Puan</th><th className="p-2">Detay</th></tr>
                  </thead>
                  <tbody>
                    {players.map((player: Player) => {
                      if (isArchive) {
                        const old = oldPredictions.find((p: OldPrediction) => p.player_id === player.id && p.match_id === match.id);
                        return <tr key={player.id} className="border-t border-slate-100"><td className="p-2 font-bold">{player.name}</td><td className="p-2">{old?.prediction || "-"}</td><td className="p-2">{old?.is_joker ? "🃏" : ""}</td><td className="p-2 font-black">{old?.points || 0}</td><td className="p-2 text-slate-500">World Cup arşiv</td></tr>;
                      }
                      const pred = predictions.find((p: ScorePrediction) => p.player_id === player.id && p.match_id === match.id);
                      const playerFavs = favorites.filter((f: PlayerFavorite) => f.player_id === player.id);
                      const s = scorePrediction(pred, match, playerFavs);
                      return <tr key={player.id} className="border-t border-slate-100"><td className="p-2 font-bold">{player.name}</td><td className="p-2">{pred ? `${pred.home_goals}-${pred.away_goals}` : "YOK"}{pred?.advancing_team ? ` / Tur: ${pred.advancing_team}` : ""}</td><td className="p-2">{pred?.is_joker ? "🃏" : ""}</td><td className="p-2 font-black text-orange-600">{isPlayed(match) ? s.total : "-"}</td><td className="p-2 text-slate-500">{isPlayed(match) ? s.detail : "Sonuç bekleniyor"}</td></tr>;
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          );
        })}
      </div>
    </div>
  );
}

function ProfileTab({ currentPlayer, profilePlayer, isOwnProfile, selectedSeason, allFavorites, allPredictions, euroPredictions, teamOptions, saveFavorite, saveEuroPrediction, saveHeartTeam, isFavoriteLeagueLocked, isEuroLocked, activeMatches, leagueTeams }: any) {
  const [historyWeek, setHistoryWeek] = useState("Son 5");
  const [historyLeague, setHistoryLeague] = useState("Tümü");
  const [historyResult, setHistoryResult] = useState("Tümü");
  const playerFavorites = allFavorites.filter((f: PlayerFavorite) => f.player_id === profilePlayer.id);
  const playerEuroPredictions = euroPredictions.filter((p: EuroPrediction) => p.player_id === profilePlayer.id);
  const playerPred = (matchId: string) => allPredictions.find((p: ScorePrediction) => p.player_id === profilePlayer.id && p.match_id === matchId);
  const badges = badgeCountsForPlayer(profilePlayer.id, activeMatches, allPredictions, playerFavorites);
  const completed = activeMatches.filter(isPlayed).sort((a: Match, b: Match) => new Date(b.match_time).getTime() - new Date(a.match_time).getTime());
  const filteredHistory = completed
    .filter((m: Match) => historyWeek === "Son 5" || Number(m.week_no || 1) === Number(historyWeek))
    .filter((m: Match) => historyLeague === "Tümü" || m.league === historyLeague)
    .filter((m: Match) => {
      if (historyResult === "Tümü") return true;
      const pred = playerPred(m.id);
      const s = scorePrediction(pred, m, playerFavorites);
      if (historyResult === "Tam skor") return s.exact;
      if (historyResult === "Doğru sonuç") return s.resultCorrect && !s.exact;
      if (historyResult === "Yanlış") return pred && !s.resultCorrect;
      if (historyResult === "Tahmin yok") return !pred;
      return true;
    });
  const shownHistory = historyWeek === "Son 5" && historyLeague === "Tümü" && historyResult === "Tümü" ? filteredHistory.slice(0, 5) : filteredHistory;
  const allTeamNames: string[] = Array.from(new Set<string>(leagueTeams.map((t: LeagueTeam) => String(t.team_name || ""))))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "tr-TR"));
  const weeks: number[] = Array.from(new Set(activeMatches.map((m: Match) => Number(m.week_no || 1)).filter(Boolean))) as number[];
  weeks.sort((a: number, b: number) => a - b);
  const heartTeamInfo = profilePlayer.heart_team ? leagueTeams.find((t: LeagueTeam) => normalize(t.team_name) === normalize(profilePlayer.heart_team)) : null;
  const heartPrimary = heartTeamInfo?.primary_color || "#10b981";
  const heartSecondary = heartTeamInfo?.secondary_color || "#f97316";
  const heartNickname = heartTeamInfo?.nickname || "";
  const heartPhrase = heartTeamInfo?.fan_phrase || "";
  const profileStats = completed.reduce((acc: any, match: Match) => {
    const pred = playerPred(match.id);
    const s = scorePrediction(pred, match, playerFavorites);
    acc.total += s.total || 0;
    acc.played += 1;
    if (s.exact) acc.exact += 1;
    if (s.resultCorrect) acc.resultCorrect += 1;
    if (s.missing) acc.missing += 1;
    if (pred?.is_joker) acc.joker += 1;
    acc.favorite += s.favoriteBonus || 0;
    return acc;
  }, { total: 0, played: 0, exact: 0, resultCorrect: 0, missing: 0, joker: 0, favorite: 0 });

  return (
    <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-[2rem] bg-white p-5 shadow-xl ring-1 ring-orange-100">
        <div className="overflow-hidden rounded-[1.5rem] bg-white ring-1 ring-emerald-100">
          <div className="h-4" style={{ background: `linear-gradient(90deg, ${heartPrimary}, ${heartSecondary})` }} />
          <div className="p-5">
          <div className="text-xs font-black uppercase tracking-wider text-emerald-600">ORS Kahvaltı Ligi Oyuncu Kartı</div>
          <h2 className="mt-2 text-3xl font-black text-slate-900">{profilePlayer.name}</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">{selectedSeason?.name}</p>
          <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm font-bold text-slate-700">
            ❤️ Tuttuğu takım: {profilePlayer.heart_team ? <span className="font-black" style={{ color: heartPrimary }}>{profilePlayer.heart_team}</span> : <span className="text-slate-400">Henüz seçilmedi</span>}
            {heartNickname ? <div className="mt-1 text-xs font-black uppercase tracking-wide text-slate-500">{heartNickname}</div> : null}
            {heartPhrase ? <div className="mt-1 text-xs font-semibold italic text-slate-400">“{heartPhrase}”</div> : null}
          </div>
          {isOwnProfile ? (
            <select value={profilePlayer.heart_team || ""} onChange={(e) => saveHeartTeam(e.target.value)} className="mt-3 w-full rounded-2xl border border-emerald-100 bg-white px-3 py-2 text-sm font-bold">
              <option value="">Tuttuğun takım seç, opsiyonel</option>
              {allTeamNames.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          ) : null}
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-100">
            <div className="text-xs font-black uppercase tracking-wider text-emerald-600">Tahmin Puanı</div>
            <div className="mt-1 text-2xl font-black text-emerald-700">{profileStats.total}</div>
          </div>
          <div className="rounded-2xl bg-orange-50 p-4 ring-1 ring-orange-100">
            <div className="text-xs font-black uppercase tracking-wider text-orange-500">Tam Skor</div>
            <div className="mt-1 text-2xl font-black text-orange-600">{profileStats.exact}</div>
          </div>
          <div className="rounded-2xl bg-blue-50 p-4 ring-1 ring-blue-100">
            <div className="text-xs font-black uppercase tracking-wider text-blue-500">Doğru Sonuç</div>
            <div className="mt-1 text-2xl font-black text-blue-600">{profileStats.resultCorrect}</div>
          </div>
          <div className="rounded-2xl bg-rose-50 p-4 ring-1 ring-rose-100">
            <div className="text-xs font-black uppercase tracking-wider text-rose-500">Tahmin Yok</div>
            <div className="mt-1 text-2xl font-black text-rose-600">{profileStats.missing}</div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-600">
          <div className="flex flex-wrap gap-3">
            <span>📌 Sonuçlanan maç: <b>{profileStats.played}</b></span>
            <span>🃏 Joker kullanılan: <b>{profileStats.joker}</b></span>
            <span>❤️ Favori bonusu: <b>{profileStats.favorite}</b></span>
          </div>
        </div>

        <h3 className="mt-6 font-black">🏅 Rozet vitrini</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.entries(badges).length ? Object.entries(badges).map(([name, count]) => (
            <span key={name} className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-700">{name} x{count as number}</span>
          )) : <span className="rounded-2xl bg-slate-50 px-3 py-2 text-sm font-bold text-slate-400">Henüz rozet yok; top çizgiden döndü.</span>}
        </div>

        <h3 className="mt-6 font-black">Lig favorileri</h3>
        <p className="mt-1 text-sm text-slate-500">Favori takım maçında doğru sonuç +1. Lig şampiyonu olursa +20.</p>
        <div className="mt-4 grid gap-3">
          {REQUIRED_FAVORITE_LEAGUES.map((league) => {
            const fav = playerFavorites.find((f: PlayerFavorite) => f.league === league);
            const locked = isFavoriteLeagueLocked(league);
            return (
              <div key={league} className="rounded-2xl border border-slate-100 p-3">
                <div className="mb-2 flex justify-between text-sm font-black"><span>{league}</span><span className={locked ? "text-slate-400" : "text-green-600"}>{locked ? "Kilitli" : "Açık"}</span></div>
                {isOwnProfile ? (
                  <select disabled={locked} value={fav?.team_name || ""} onChange={(e) => saveFavorite(league, e.target.value)} className="w-full rounded-2xl border border-slate-200 px-3 py-2 font-bold disabled:bg-slate-100">
                    <option value="">Favori seç</option>
                    {teamOptions(league).map((t: LeagueTeam) => <option key={t.id}>{t.team_name}</option>)}
                  </select>
                ) : <div className="text-sm font-black text-slate-700">{fav?.team_name || "Seçilmedi"}</div>}
              </div>
            );
          })}
        </div>

        <h3 className="mt-6 font-black">🏆 Avrupa kupası şampiyon tahminleri</h3>
        <div className="mt-4 grid gap-3">
          {EURO_COMPETITIONS.map((comp) => {
            const pred = playerEuroPredictions.find((p: EuroPrediction) => p.competition === comp.name);
            const locked = isEuroLocked(comp.name);
            const options = teamOptions(comp.name);
            return (
              <div key={comp.name} className="rounded-2xl border border-slate-100 p-3">
                <div className="mb-2 flex justify-between text-sm font-black"><span>{comp.name} +{comp.points}</span><span className={locked ? "text-slate-400" : "text-green-600"}>{locked ? "Kilitli" : "Açık"}</span></div>
                {isOwnProfile ? (
                  <select disabled={locked} value={pred?.team_name || ""} onChange={(e) => saveEuroPrediction(comp.name, e.target.value)} className="w-full rounded-2xl border border-slate-200 px-3 py-2 font-bold disabled:bg-slate-100">
                    <option value="">Şampiyon seç</option>
                    {options.map((t: LeagueTeam) => <option key={t.id}>{t.team_name}</option>)}
                  </select>
                ) : <div className="text-sm font-black text-slate-700">{pred?.team_name || "Seçilmedi"}</div>}
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-[2rem] bg-white p-5 shadow-xl ring-1 ring-orange-100">
        <h2 className="text-xl font-black">📋 Sonuçlanmış tahmin geçmişi</h2>
        <p className="mt-1 text-sm text-slate-500">Varsayılan son 5 maç; filtre seçince tüm eşleşen sonuçlar görünür.</p>
        <div className="mt-4 grid gap-2 md:grid-cols-3">
          <select value={historyWeek} onChange={(e)=>setHistoryWeek(e.target.value)} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-bold"><option>Son 5</option>{weeks.map((w:number)=><option key={w} value={w}>Hafta {w}</option>)}</select>
          <select value={historyLeague} onChange={(e)=>setHistoryLeague(e.target.value)} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-bold"><option>Tümü</option>{LEAGUES.map((l)=><option key={l}>{l}</option>)}</select>
          <select value={historyResult} onChange={(e)=>setHistoryResult(e.target.value)} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-bold"><option>Tümü</option><option>Tam skor</option><option>Doğru sonuç</option><option>Yanlış</option><option>Tahmin yok</option></select>
        </div>
        <div className="mt-4 grid gap-3">
          {shownHistory.map((match: Match) => {
            const pred = playerPred(match.id);
            const s = scorePrediction(pred, match, playerFavorites);
            return (
              <div key={match.id} className="rounded-2xl border border-slate-100 p-3 text-sm">
                <div className="flex flex-wrap justify-between gap-2">
                  <div className="font-black">Hafta {match.week_no || 1} • {match.home_team} - {match.away_team}</div>
                  <div className="font-black text-orange-600">{match.home_score}-{match.away_score}</div>
                </div>
                <div className="mt-1 text-slate-500">Tahmin: {pred ? `${pred.home_goals}-${pred.away_goals}` : "YOK"} {pred?.is_joker ? "🃏" : ""} • Puan: {s.total}</div>
                <div className="mt-1 text-xs text-slate-400">{s.detail}</div>
              </div>
            );
          })}
          {!shownHistory.length ? <div className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-400">Gösterilecek sonuçlanmış tahmin yok.</div> : null}
        </div>
      </section>
    </div>
  );
}

function CompareTab({ scoreRows }: any) {
  return (
    <section className="rounded-[2rem] bg-white p-5 shadow-xl ring-1 ring-orange-100">
      <h2 className="text-xl font-black">🆚 Karşılaştırma</h2>
      <p className="mt-1 text-sm text-slate-500">Oyuncuların temel performans kıyaslaması.</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {scoreRows.map((row: any) => (
          <div key={row.player.id} className="rounded-2xl border border-slate-100 p-4">
            <div className="text-lg font-black">{row.player.name}</div>
            <div className="mt-2 text-3xl font-black text-orange-600">{row.total}</div>
            <div className="mt-2 text-sm text-slate-500">Tam skor {row.exact} • Doğru sonuç {row.resultCorrect} • Tahmin yok {row.missing}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function TeamsTab({ leagueTeams }: any) {
  const grouped = LEAGUES.map((league) => ({ league, teams: leagueTeams.filter((t: LeagueTeam) => t.league === league) })).filter((g) => g.teams.length);
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {grouped.map((group) => (
        <section key={group.league} className="rounded-[2rem] bg-white p-5 shadow-xl ring-1 ring-orange-100">
          <h2 className="text-xl font-black">{group.league}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {group.teams.map((team: LeagueTeam) => <TeamPill key={team.id} team={team} name={team.team_name} />)}
          </div>
        </section>
      ))}
    </div>
  );
}

function StatsTab({ scoreRows, activeMatches, predictions, favorites, players }: any) {
  const hardest = activeMatches.filter(isPlayed).map((match: Match) => {
    const correct = players.filter((p: Player) => {
      const pred = predictions.find((x: ScorePrediction) => x.player_id === p.id && x.match_id === match.id);
      if (!pred) return false;
      return scorePrediction(pred, match, favorites.filter((f: PlayerFavorite) => f.player_id === p.id)).resultCorrect;
    }).length;
    return { match, correct };
  }).sort((a: any, b: any) => a.correct - b.correct)[0];

  return (
    <div className="grid gap-5">
      <section className="grid gap-4 md:grid-cols-4">
        <InfoCard title="Tam skor kralı" value={scoreRows[0]?.exact ? scoreRows.sort((a:any,b:any)=>b.exact-a.exact)[0]?.player.name : "-"} note="En çok tam skor" />
        <InfoCard title="Joker puanı" value={scoreRows.sort((a:any,b:any)=>b.jokerPoints-a.jokerPoints)[0]?.player.name || "-"} note="Jokerden en çok katkı" />
        <InfoCard title="Favori puanı" value={scoreRows.sort((a:any,b:any)=>b.favoritePoints-a.favoritePoints)[0]?.player.name || "-"} note="Favori bonusu" />
        <InfoCard title="Zor maç" value={hardest ? `${hardest.match.home_team}-${hardest.match.away_team}` : "-"} note={hardest ? `${hardest.correct} kişi bildi` : "Sonuç bekleniyor"} />
      </section>
      <section className="rounded-[2rem] bg-white p-5 shadow-xl ring-1 ring-orange-100 overflow-x-auto">
        <h2 className="text-xl font-black">Detaylı oyuncu tablosu</h2>
        <table className="mt-4 w-full min-w-[900px] text-left text-sm">
          <thead className="text-xs uppercase text-slate-400"><tr><th className="p-2">Oyuncu</th><th>Puan</th><th>Maç</th><th>Tam Skor</th><th>Doğru Sonuç</th><th>Joker Puanı</th><th>Favori Puanı</th><th>Sezon Bonus</th><th>Tahmin Yok</th></tr></thead>
          <tbody>{scoreRows.map((r:any)=><tr key={r.player.id} className="border-t border-slate-100"><td className="p-2 font-bold">{r.player.name}</td><td className="font-black text-orange-600">{r.total}</td><td>{r.playedCount}</td><td>{r.exact}</td><td>{r.resultCorrect}</td><td>{r.jokerPoints}</td><td>{r.favoritePoints}</td><td title={r.seasonBonusDetails}>{r.seasonBonus}</td><td>{r.missing}</td></tr>)}</tbody>
        </table>
      </section>
    </div>
  );
}

function RulesTab() {
  const rules = [
    ["Skor Tahmini", "Her maç için 0-9 arası ev/deplasman golü seçilir. Maç başlamadan değiştirilebilir."],
    ["Puanlama", "Tam skor +5, maç sonucu +3, ev gol +1, deplasman gol +1, KG Var/Yok +1, 2.5 Üst/Alt +1."],
    ["Joker", "Her oyuncunun haftada 1 joker hakkı vardır. Joker maç puanını x2 yapar. Kullanılmazsa yanar."],
    ["Maç Tipi Çarpanı", "Derbi, Büyük Maç, Avrupa Gecesi, Kritik Maç, Milli Maç ve Kupa Maçı x1.5 çarpan alır."],
    ["Favori Takım", "Favori takımın hangi kulüp maçında oynarsa oynasın, sonucu doğru bilirsen +1 gelir. Milli maçlarda favori bonusu yok."],
    ["Lig Şampiyon Bonusu", "Favori takımın kendi ligini kazanırsa sezon sonunda admin bonusu uygular: +20."],
    ["Avrupa Şampiyon Tahmini", "Şampiyonlar Ligi +75, Avrupa Ligi +50, Konferans Ligi +25. Lig aşaması başladığında kilitlenir."],
    ["Kupa / Eleme", "90 dakika skoru puanlanır. Turu geçen takım doğru bilinirse +2 eklenir. Bu +2 çarpanlara girmez."],
    ["Tahmin Kilidi", "Maç saatinde skor, joker ve tur tahmini otomatik kilitlenir."],
    ["Tahmin Yapmayan", "Sonuç girilen maçta tahmin yoksa -3 puan yazılır."],
  ];
  return <section className="rounded-[2rem] bg-white p-5 shadow-xl ring-1 ring-orange-100"><h2 className="text-2xl font-black">📜 Kurallar</h2><div className="mt-5 grid gap-3">{rules.map(([t,d])=><div key={t} className="rounded-2xl bg-orange-50 p-4"><div className="font-black text-orange-800">{t}</div><div className="mt-1 text-sm text-slate-600">{d}</div></div>)}</div></section>;
}

function Notice({ title, text }: any) {
  return <div className="rounded-[2rem] bg-white p-8 text-center shadow-xl ring-1 ring-orange-100"><h2 className="text-2xl font-black">{title}</h2><p className="mt-2 text-slate-500">{text}</p></div>;
}

function AdminTab({ selectedSeason, seasons, activeWeek, leagueTeams, players, matches, leagueWinners, adminPoints, predictions, favorites, reload, setMessage }: any) {
  const [adminTab, setAdminTab] = useState("matches");
  const [newMatch, setNewMatch] = useState({ week_no: activeWeek, match_time: "", home_team: "", away_team: "", league: "Süper Lig", match_type: "Normal", cup_name: "", is_knockout: false, tie_leg: "none" });
  const [csvText, setCsvText] = useState("");
  const [teamLeague, setTeamLeague] = useState("Süper Lig");
  const [teamName, setTeamName] = useState("");
  const [teamPrimaryColor, setTeamPrimaryColor] = useState("#64748b");
  const [teamSecondaryColor, setTeamSecondaryColor] = useState("#f8fafc");
  const [teamTextColor, setTeamTextColor] = useState("#ffffff");
  const [teamLogoUrl, setTeamLogoUrl] = useState("");
  const [newPlayerName, setNewPlayerName] = useState("");
  const [winnerLeague, setWinnerLeague] = useState("Süper Lig");
  const [winnerTeam, setWinnerTeam] = useState("");
  const [adminWeekFilter, setAdminWeekFilter] = useState<number | "Tümü">("Tümü");
  const [adminLeagueFilter, setAdminLeagueFilter] = useState("Tümü");
  const [adminStatusFilter, setAdminStatusFilter] = useState("Tümü");
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [bonusPlayerId, setBonusPlayerId] = useState(players[0]?.id || "");
  const [bonusType, setBonusType] = useState("Bonus");
  const [bonusPoints, setBonusPoints] = useState(0);
  const [bonusDescription, setBonusDescription] = useState("");
  const [bonusWeek, setBonusWeek] = useState<number | "">(activeWeek || 1);
  const [showAllBonus, setShowAllBonus] = useState(false);

  const adminWeeks: number[] = Array.from(new Set<number>(matches.map((m: Match) => Number(m.week_no || 1)).filter(Boolean) as number[]));
  adminWeeks.sort((a: number, b: number) => a - b);
  const adminFilteredMatches = matches
    .filter((m: Match) => adminWeekFilter === "Tümü" || Number(m.week_no || 1) === adminWeekFilter)
    .filter((m: Match) => adminLeagueFilter === "Tümü" || m.league === adminLeagueFilter)
    .filter((m: Match) => adminStatusFilter === "Tümü" || (m.match_status || "scheduled") === adminStatusFilter)
    .sort((a: Match, b: Match) => new Date(a.match_time).getTime() - new Date(b.match_time).getTime());

  async function addMatch() {
    const { error } = await supabase.from("matches").insert({ ...newMatch, season_id: selectedSeason.id, is_published: true, match_status: "scheduled" });
    if (error) setMessage(error.message); else { setMessage("Maç eklendi ✅"); reload(); }
  }

  async function saveMatchEdit() {
    if (!editingMatch) return;
    const { id, home_team, away_team, match_time, league, week_no, match_type, cup_name, is_knockout, tie_leg } = editingMatch;
    const { error } = await supabase.from("matches").update({
      home_team,
      away_team,
      match_time,
      league,
      week_no,
      match_type,
      cup_name: cup_name || null,
      is_knockout: Boolean(is_knockout),
      tie_leg: tie_leg || "none",
    }).eq("id", id);
    if (error) setMessage(error.message); else { setEditingMatch(null); setMessage("Maç bilgileri güncellendi ✅"); reload(); }
  }

  async function saveResult(match: Match, home: number, away: number, status = "played", advancing?: string, adminNote?: string) {
    const homeNum = Number(home);
    const awayNum = Number(away);

    if (!Number.isFinite(homeNum) || !Number.isFinite(awayNum)) {
      setMessage("Skor kaydedilemedi: Ev sahibi ve deplasman golü seçilmeli.");
      return;
    }

    // Admin skor girip Kaydet'e bastığında status yanlışlıkla "Oynanmadı" kaldıysa
    // maçı otomatik Oynandı sayalım. Ertelendi / İptal seçildiyse sonuç puanlanmaz.
    const finalStatus = status === "scheduled" ? "played" : status;
    const result = finalStatus === "played" || finalStatus === "forfeit" ? outcome(homeNum, awayNum) : null;

    const payload: Record<string, any> = {
      home_score: homeNum,
      away_score: awayNum,
      result,
      match_status: finalStatus,
      advancing_team: advancing || match.advancing_team || null,
      admin_note: adminNote || null,
    };

    let { error } = await supabase.from("matches").update(payload).eq("id", match.id);

    // Eski tabloda admin_note kolonu yoksa sonuç kaydını tamamen bozmasın.
    if (error && String(error.message || "").toLowerCase().includes("admin_note")) {
      const fallbackPayload = { ...payload };
      delete fallbackPayload.admin_note;
      const retry = await supabase.from("matches").update(fallbackPayload).eq("id", match.id);
      error = retry.error;
    }

    // Eski tabloda match_status/admin_note kolonlarından biri sorun çıkarırsa minimal sonuç kaydı dene.
    if (error && (
      String(error.message || "").toLowerCase().includes("match_status") ||
      String(error.message || "").toLowerCase().includes("admin_note")
    )) {
      const retry = await supabase.from("matches").update({
        home_score: homeNum,
        away_score: awayNum,
        result,
      }).eq("id", match.id);
      error = retry.error;
    }

    if (error) {
      setMessage(`Sonuç kaydedilemedi: ${error.message}`);
    } else {
      setMessage("Sonuç/durum kaydedildi ✅");
      reload();
    }
  }

  async function deleteMatch(match: Match) {
    const ok = window.confirm(`${match.home_team} - ${match.away_team} maçını silmek istediğine emin misin? Bu maça ait tahminler de silinir.`);
    if (!ok) return;
    const { error } = await supabase.from("matches").delete().eq("id", match.id);
    if (error) setMessage(error.message); else { setMessage("Maç silindi ✅"); reload(); }
  }

  async function setActiveWeek(value: number) {
    const { error } = await supabase.from("season_settings").upsert({ season_id: selectedSeason.id, active_week: value, updated_at: new Date().toISOString() }, { onConflict: "season_id" });
    if (error) setMessage(error.message); else { setMessage(`Aktif hafta ${value} yapıldı ✅`); reload(); }
  }

  async function addTeam() {
    const { error } = await supabase.from("league_teams").insert({ league: teamLeague, team_name: teamName, primary_color: teamPrimaryColor, secondary_color: teamSecondaryColor, text_color: teamTextColor, logo_url: teamLogoUrl || null, manual_form: "", nickname: "" });
    if (error) setMessage(error.message); else { setTeamName(""); setTeamLogoUrl(""); setMessage("Takım eklendi ✅"); reload(); }
  }

  async function updateTeamLook(team: LeagueTeam, patch: Partial<LeagueTeam>) {
    const { error } = await supabase.from("league_teams").update(patch).eq("id", team.id);
    if (error) setMessage(error.message); else { setMessage("Takım bilgisi güncellendi ✅"); reload(); }
  }

  async function addPlayer() {
    const code = normalize(newPlayerName).replaceAll(" ", "").slice(0, 8) + Math.floor(10 + Math.random() * 90);
    const { error } = await supabase.from("players").insert({ name: newPlayerName, login_code: code, is_active: true, is_admin: false });
    if (error) setMessage(error.message); else { setMessage(`Oyuncu eklendi. Kod: ${code}`); setNewPlayerName(""); reload(); }
  }

  async function togglePlayer(player: Player) {
    const { error } = await supabase.from("players").update({ is_active: player.is_active === false }).eq("id", player.id);
    if (error) setMessage(error.message); else reload();
  }

  async function importCsv() {
    const lines = csvText.trim().split(/\r?\n/).filter(Boolean);
    const rows = lines.slice(1).map((line) => {
      const [week, match_time, home_team, away_team, league, match_type, cup_name, is_knockout, tie_leg] = line.split(",").map((x) => x?.trim());
      return { season_id: selectedSeason.id, week_no: Number(week), match_time, home_team, away_team, league, match_type: match_type || "Normal", cup_name: cup_name || null, is_knockout: is_knockout === "true", tie_leg: tie_leg || "none", is_published: true, match_status: "scheduled" };
    });
    const { error } = await supabase.from("matches").insert(rows);
    if (error) setMessage(error.message); else { setMessage(`${rows.length} maç yüklendi ✅`); setCsvText(""); reload(); }
  }

  async function saveWinner(apply = false) {
    const euro = EURO_COMPETITIONS.find((c) => c.name === winnerLeague);
    const { error } = await supabase.from("league_winners").upsert({ season_id: selectedSeason.id, league: winnerLeague, winner_team: winnerTeam, bonus_points: euro?.points || 20, bonus_applied: apply, updated_at: new Date().toISOString() }, { onConflict: "season_id,league" });
    if (error) setMessage(error.message); else { setMessage(apply ? "Kazanan kaydedildi ve bonus aktif edildi ✅" : "Kazanan kaydedildi ✅"); reload(); }
  }

  async function saveAdminPoint() {
    if (!bonusPlayerId || !bonusDescription.trim()) {
      setMessage("Oyuncu, puan ve açıklama gerekli.");
      return;
    }
    const { error } = await supabase.from("admin_points").insert({
      season_id: selectedSeason.id,
      player_id: bonusPlayerId,
      point_type: bonusType,
      points: Number(bonusPoints),
      description: bonusDescription.trim(),
      week_no: bonusWeek === "" ? null : Number(bonusWeek),
    });
    if (error) setMessage(error.message); else { setMessage("Ek puan kaydedildi ✅"); setBonusDescription(""); setBonusPoints(0); reload(); }
  }

  const tabGroups = [
    { title: "Maç Yönetimi", items: [["matches", "Maçlar"], ["results", "Sonuçlar"], ["predictions", "Tahminler"], ["csv", "CSV"]] },
    { title: "Oyuncu Yönetimi", items: [["players", "Oyuncular"], ["bonus", "Ek Puan"]] },
    { title: "Sezon Yönetimi", items: [["teams", "Takımlar"], ["season", "Sezon"]] },
  ];

  return (
    <div className="grid gap-5">
      <section className="rounded-[2rem] bg-white p-4 shadow ring-1 ring-orange-100">
        <h2 className="mb-3 text-lg font-black">Admin kontrol merkezi</h2>
        <div className="grid gap-3 lg:grid-cols-3">
          {tabGroups.map((group) => (
            <div key={group.title} className="rounded-2xl bg-orange-50/60 p-3">
              <div className="mb-2 text-xs font-black uppercase tracking-wider text-orange-500">{group.title}</div>
              <div className="flex flex-wrap gap-2">
                {group.items.map(([key, label]) => <button key={key} onClick={()=>setAdminTab(key)} className={cx("rounded-2xl px-4 py-2 text-sm font-black", adminTab===key?"bg-orange-500 text-white shadow":"bg-white text-slate-600 hover:bg-orange-100")}>{label}</button>)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {(adminTab === "matches" || adminTab === "results") && (
        <section className="rounded-[2rem] bg-white p-4 shadow ring-1 ring-orange-100">
          <div className="grid gap-2 md:grid-cols-3">
            <select value={adminWeekFilter} onChange={e=>setAdminWeekFilter(e.target.value === "Tümü" ? "Tümü" : Number(e.target.value))} className="rounded-2xl border p-3 text-sm font-bold"><option>Tümü</option>{adminWeeks.map((w:number)=><option key={w} value={w}>Hafta {w}</option>)}</select>
            <select value={adminLeagueFilter} onChange={e=>setAdminLeagueFilter(e.target.value)} className="rounded-2xl border p-3 text-sm font-bold"><option>Tümü</option>{LEAGUES.map(l=><option key={l}>{l}</option>)}</select>
            <select value={adminStatusFilter} onChange={e=>setAdminStatusFilter(e.target.value)} className="rounded-2xl border p-3 text-sm font-bold"><option value="Tümü">Tümü</option><option value="scheduled">Oynanmadı</option><option value="played">Oynandı</option><option value="postponed">Ertelendi</option><option value="cancelled">İptal</option><option value="forfeit">Hükmen</option></select>
          </div>
        </section>
      )}

      {adminTab === "matches" && (
        <section className="rounded-[2rem] bg-white p-5 shadow-xl ring-1 ring-orange-100">
          <h2 className="text-xl font-black">Maç ekle / düzenle / sil</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <input type="number" value={newMatch.week_no} onChange={e=>setNewMatch({...newMatch, week_no:Number(e.target.value)})} className="rounded-2xl border p-3" placeholder="Hafta"/>
            <input value={newMatch.match_time} onChange={e=>setNewMatch({...newMatch, match_time:e.target.value})} className="rounded-2xl border p-3" placeholder="2026-08-14T21:30:00+03:00"/>
            <select value={newMatch.league} onChange={e=>setNewMatch({...newMatch, league:e.target.value})} className="rounded-2xl border p-3">{LEAGUES.map(l=><option key={l}>{l}</option>)}</select>
            <input value={newMatch.home_team} onChange={e=>setNewMatch({...newMatch, home_team:e.target.value})} className="rounded-2xl border p-3" placeholder="Ev sahibi"/>
            <input value={newMatch.away_team} onChange={e=>setNewMatch({...newMatch, away_team:e.target.value})} className="rounded-2xl border p-3" placeholder="Deplasman"/>
            <select value={newMatch.match_type} onChange={e=>setNewMatch({...newMatch, match_type:e.target.value})} className="rounded-2xl border p-3">{MATCH_TYPES.map(l=><option key={l}>{l}</option>)}</select>
            <input value={newMatch.cup_name} onChange={e=>setNewMatch({...newMatch, cup_name:e.target.value})} className="rounded-2xl border p-3" placeholder="Kupa adı, opsiyonel"/>
            <select value={newMatch.tie_leg} onChange={e=>setNewMatch({...newMatch, tie_leg:e.target.value})} className="rounded-2xl border p-3"><option value="none">none</option><option value="single">single</option><option value="first">first</option><option value="second">second</option></select>
            <label className="flex items-center gap-2 font-bold"><input type="checkbox" checked={newMatch.is_knockout} onChange={e=>setNewMatch({...newMatch, is_knockout:e.target.checked})}/> Eleme/kupa</label>
            <AppButton onClick={addMatch}>Maç ekle</AppButton>
          </div>

          {editingMatch ? (
            <div className="mt-6 rounded-[2rem] bg-slate-50 p-4 ring-1 ring-slate-100">
              <h3 className="font-black">Düzenleniyor: {editingMatch.home_team} - {editingMatch.away_team}</h3>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <input type="number" value={editingMatch.week_no || 1} onChange={e=>setEditingMatch({...editingMatch, week_no:Number(e.target.value)})} className="rounded-2xl border p-3" />
                <input value={editingMatch.match_time || ""} onChange={e=>setEditingMatch({...editingMatch, match_time:e.target.value})} className="rounded-2xl border p-3" />
                <select value={editingMatch.league || "Süper Lig"} onChange={e=>setEditingMatch({...editingMatch, league:e.target.value})} className="rounded-2xl border p-3">{LEAGUES.map(l=><option key={l}>{l}</option>)}</select>
                <input value={editingMatch.home_team || ""} onChange={e=>setEditingMatch({...editingMatch, home_team:e.target.value})} className="rounded-2xl border p-3" />
                <input value={editingMatch.away_team || ""} onChange={e=>setEditingMatch({...editingMatch, away_team:e.target.value})} className="rounded-2xl border p-3" />
                <select value={editingMatch.match_type || "Normal"} onChange={e=>setEditingMatch({...editingMatch, match_type:e.target.value})} className="rounded-2xl border p-3">{MATCH_TYPES.map(l=><option key={l}>{l}</option>)}</select>
                <input value={editingMatch.cup_name || ""} onChange={e=>setEditingMatch({...editingMatch, cup_name:e.target.value})} className="rounded-2xl border p-3" placeholder="Kupa adı" />
                <select value={editingMatch.tie_leg || "none"} onChange={e=>setEditingMatch({...editingMatch, tie_leg:e.target.value})} className="rounded-2xl border p-3"><option value="none">none</option><option value="single">single</option><option value="first">first</option><option value="second">second</option></select>
                <label className="flex items-center gap-2 font-bold"><input type="checkbox" checked={Boolean(editingMatch.is_knockout)} onChange={e=>setEditingMatch({...editingMatch, is_knockout:e.target.checked})}/> Eleme/kupa</label>
              </div>
              <div className="mt-3 flex gap-2"><AppButton onClick={saveMatchEdit}>Değişiklikleri kaydet</AppButton><AppButton kind="ghost" onClick={()=>setEditingMatch(null)}>Vazgeç</AppButton></div>
            </div>
          ) : null}

          <div className="mt-8">
            <div className="flex items-center justify-between gap-3"><h3 className="font-black">Filtrelenen maçlar</h3><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">{adminFilteredMatches.length} maç</span></div>
            <div className="mt-3 grid gap-2">
              {adminFilteredMatches.length === 0 ? <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">Maç yok.</div> : adminFilteredMatches.map((m: Match) => (
                <div key={m.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 p-3">
                  <div>
                    <div className="font-black">{m.home_team} - {m.away_team}</div>
                    <div className="mt-1 text-xs font-bold text-slate-500">Hafta {m.week_no || "-"} • {m.league || "-"} • {formatDate(m.match_time)} • {m.match_type || "Normal"} • {statusLabel(m.match_status)}</div>
                    {m.admin_note ? <div className="mt-1 text-xs font-semibold text-slate-500">Not: {m.admin_note}</div> : null}
                  </div>
                  <div className="flex gap-2"><AppButton kind="ghost" onClick={()=>setEditingMatch(m)}>Düzenle</AppButton><AppButton kind="danger" onClick={()=>deleteMatch(m)}>Sil</AppButton></div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {adminTab === "results" && <section className="rounded-[2rem] bg-white p-5 shadow-xl ring-1 ring-orange-100"><h2 className="text-xl font-black">Sonuç gir / durum değiştir</h2><div className="mt-4 grid gap-3">{adminFilteredMatches.map((m: Match)=><AdminResultRow key={m.id} match={m} saveResult={saveResult}/>)}</div></section>}

      {adminTab === "predictions" && <AdminPredictionsPanel matches={adminFilteredMatches} players={players.filter((p: Player)=>p.is_active !== false)} predictions={predictions || []} favorites={favorites || []} />}

      {adminTab === "csv" && <section className="rounded-[2rem] bg-white p-5 shadow-xl ring-1 ring-orange-100"><h2 className="text-xl font-black">CSV maç yükle</h2><p className="mt-1 text-sm text-slate-500">Format: week,match_time,home_team,away_team,league,match_type,cup_name,is_knockout,tie_leg</p><textarea value={csvText} onChange={e=>setCsvText(e.target.value)} className="mt-4 h-64 w-full rounded-2xl border p-4 font-mono text-sm" placeholder="week,match_time,home_team,away_team,league,match_type,cup_name,is_knockout,tie_leg"/><div className="mt-3"><AppButton onClick={importCsv}>Onayla ve tahmine aç</AppButton></div></section>}

      {adminTab === "bonus" && (
        <section className="rounded-[2rem] bg-white p-5 shadow-xl ring-1 ring-orange-100">
          <h2 className="text-xl font-black">Ek puan / ceza / düzeltme</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-5">
            <select value={bonusPlayerId} onChange={e=>setBonusPlayerId(e.target.value)} className="rounded-2xl border p-3"><option value="">Oyuncu seç</option>{players.map((p:Player)=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
            <select value={bonusType} onChange={e=>setBonusType(e.target.value)} className="rounded-2xl border p-3"><option>Bonus</option><option>Ceza</option><option>Düzeltme</option></select>
            <input type="number" value={bonusPoints} onChange={e=>setBonusPoints(Number(e.target.value))} className="rounded-2xl border p-3" placeholder="+5 / -3" />
            <input type="number" value={bonusWeek} onChange={e=>setBonusWeek(e.target.value === "" ? "" : Number(e.target.value))} className="rounded-2xl border p-3" placeholder="Hafta" />
            <AppButton onClick={saveAdminPoint}>Kaydet</AppButton>
            <input value={bonusDescription} onChange={e=>setBonusDescription(e.target.value)} className="rounded-2xl border p-3 md:col-span-5" placeholder="Açıklama: Eksik puan düzeltmesi / haftalık bonus vb." />
          </div>

          <div className="mt-6 flex items-center justify-between"><h3 className="font-black">Ek Puan Geçmişi</h3><AppButton kind="ghost" onClick={()=>setShowAllBonus(!showAllBonus)}>{showAllBonus ? "Son 10 kaydı göster" : "Tümünü göster"}</AppButton></div>
          <div className="mt-3 grid gap-2">
            {(showAllBonus ? adminPoints : adminPoints.slice(0, 10)).map((item: AdminPoint) => {
              const player = players.find((p:Player)=>p.id===item.player_id);
              return <div key={item.id} className="rounded-2xl border border-slate-100 p-3 text-sm"><b>{player?.name || "Oyuncu"}</b> • {item.point_type} • <span className={cx("font-black", item.points >= 0 ? "text-green-600" : "text-rose-600")}>{item.points > 0 ? "+" : ""}{item.points}</span> • Hafta {item.week_no || "-"}<div className="mt-1 text-xs text-slate-500">{item.description}</div></div>;
            })}
            {adminPoints.length === 0 ? <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">Ek puan kaydı yok.</div> : null}
          </div>
        </section>
      )}

      {adminTab === "teams" && (
        <section className="rounded-[2rem] bg-white p-5 shadow-xl ring-1 ring-orange-100">
          <h2 className="text-xl font-black">Takımlar & renkler</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <select value={teamLeague} onChange={e=>setTeamLeague(e.target.value)} className="rounded-2xl border p-3">{LEAGUES.map(l=><option key={l}>{l}</option>)}</select>
            <input value={teamName} onChange={e=>setTeamName(e.target.value)} className="rounded-2xl border p-3" placeholder="Takım adı"/>
            <label className="rounded-2xl border p-3 text-xs font-bold text-slate-500">Ana renk<input type="color" value={teamPrimaryColor} onChange={e=>setTeamPrimaryColor(e.target.value)} className="mt-1 h-9 w-full"/></label>
            <label className="rounded-2xl border p-3 text-xs font-bold text-slate-500">İkinci renk<input type="color" value={teamSecondaryColor} onChange={e=>setTeamSecondaryColor(e.target.value)} className="mt-1 h-9 w-full"/></label>
            <label className="rounded-2xl border p-3 text-xs font-bold text-slate-500">Yazı rengi<input type="color" value={teamTextColor} onChange={e=>setTeamTextColor(e.target.value)} className="mt-1 h-9 w-full"/></label>
            <input value={teamLogoUrl} onChange={e=>setTeamLogoUrl(e.target.value)} className="rounded-2xl border p-3 md:col-span-2" placeholder="Logo URL, opsiyonel"/>
            <AppButton onClick={addTeam}>Ekle</AppButton>
          </div>
          <div className="mt-5 grid gap-3">
            {leagueTeams.filter((t:LeagueTeam)=>t.league===teamLeague).map((t:LeagueTeam)=>(
              <div key={t.id} className="grid gap-3 rounded-2xl border border-slate-100 p-3 md:grid-cols-[1fr_140px_120px_120px_120px_150px_auto] md:items-center">
                <TeamPill team={t} name={t.team_name} />
                <input defaultValue={t.nickname || ""} onBlur={e=>updateTeamLook(t,{nickname:e.currentTarget.value || null})} className="rounded-2xl border p-2 text-xs" placeholder="Lakap: Cimbom Bom"/>
                <label className="text-xs font-bold text-slate-500">Ana<input type="color" defaultValue={t.primary_color || "#64748b"} onBlur={e=>updateTeamLook(t,{primary_color:e.currentTarget.value})} className="mt-1 h-8 w-full"/></label>
                <label className="text-xs font-bold text-slate-500">İkinci<input type="color" defaultValue={t.secondary_color || "#f8fafc"} onBlur={e=>updateTeamLook(t,{secondary_color:e.currentTarget.value})} className="mt-1 h-8 w-full"/></label>
                <label className="text-xs font-bold text-slate-500">Yazı<input type="color" defaultValue={t.text_color || "#ffffff"} onBlur={e=>updateTeamLook(t,{text_color:e.currentTarget.value})} className="mt-1 h-8 w-full"/></label>
                <input defaultValue={t.manual_form || ""} onBlur={e=>updateTeamLook(t,{manual_form:e.currentTarget.value})} className="rounded-2xl border p-2 text-xs" placeholder="Form: W W D L W"/>
                <input defaultValue={t.logo_url || ""} onBlur={e=>updateTeamLook(t,{logo_url:e.currentTarget.value || null})} className="rounded-2xl border p-2 text-xs" placeholder="Logo URL"/>
              </div>
            ))}
          </div>
        </section>
      )}

      {adminTab === "players" && <section className="rounded-[2rem] bg-white p-5 shadow-xl ring-1 ring-orange-100"><h2 className="text-xl font-black">Oyuncular</h2><div className="mt-4 flex gap-2"><input value={newPlayerName} onChange={e=>setNewPlayerName(e.target.value)} className="rounded-2xl border p-3" placeholder="Oyuncu adı"/><AppButton onClick={addPlayer}>Oyuncu ekle</AppButton></div><div className="mt-4 grid gap-2 md:grid-cols-2">{players.map((p:Player)=><div key={p.id} className="flex items-center justify-between rounded-2xl border p-3"><div><div className="font-black">{p.name}</div><div className="text-xs text-slate-500">Kod: {p.login_code || "-"}</div></div><AppButton kind="ghost" onClick={()=>togglePlayer(p)}>{p.is_active===false?"Aktifleştir":"Pasifleştir"}</AppButton></div>)}</div></section>}

      {adminTab === "season" && <section className="rounded-[2rem] bg-white p-5 shadow-xl ring-1 ring-orange-100"><h2 className="text-xl font-black">Sezon yönetimi</h2><div className="mt-4 flex flex-wrap gap-2"><input type="number" defaultValue={activeWeek} onBlur={e=>setActiveWeek(Number(e.target.value))} className="rounded-2xl border p-3"/><span className="rounded-2xl bg-orange-50 px-4 py-3 font-bold text-orange-700">Aktif hafta</span></div><h3 className="mt-6 font-black">Lig / kupa kazananı</h3><div className="mt-3 flex flex-wrap gap-2"><select value={winnerLeague} onChange={e=>setWinnerLeague(e.target.value)} className="rounded-2xl border p-3">{[...REQUIRED_FAVORITE_LEAGUES, ...EURO_COMPETITIONS.map(c=>c.name)].map(l=><option key={l}>{l}</option>)}</select><input value={winnerTeam} onChange={e=>setWinnerTeam(e.target.value)} className="rounded-2xl border p-3" placeholder="Kazanan takım"/><AppButton kind="soft" onClick={()=>saveWinner(false)}>Kaydet</AppButton><AppButton onClick={()=>saveWinner(true)}>Bonusları uygula</AppButton></div><div className="mt-4 grid gap-2">{leagueWinners.map((w:LeagueWinner)=><div key={w.id || w.league} className="rounded-2xl border p-3 text-sm"><b>{w.league}</b>: {w.winner_team} / +{w.bonus_points} / {w.bonus_applied?"Uygulandı":"Bekliyor"}</div>)}</div></section>}
    </div>
  );
}

function statusLabel(status?: string | null) {
  if (status === "played") return "Oynandı";
  if (status === "postponed") return "Ertelendi";
  if (status === "cancelled") return "İptal";
  if (status === "forfeit") return "Hükmen";
  return "Oynanmadı";
}


function AdminPredictionsPanel({ matches, players, predictions, favorites }: any) {
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(matches[0]?.id || null);
  const [playerFilter, setPlayerFilter] = useState("Tümü");
  const shownPlayers = players.filter((p: Player) => playerFilter === "Tümü" || p.id === playerFilter);
  const playedCount = matches.filter(isPlayed).length;
  const totalRows = matches.length * shownPlayers.length;
  const filledRows = matches.reduce((sum: number, match: Match) => {
    return sum + shownPlayers.filter((player: Player) => predictions.some((pred: ScorePrediction) => pred.player_id === player.id && pred.match_id === match.id)).length;
  }, 0);

  return (
    <section className="rounded-[2rem] bg-white p-5 shadow-xl ring-1 ring-orange-100">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-black">👀 Admin tahmin ekranı</h2>
          <p className="mt-1 text-sm text-slate-500">Admin olarak maç başlamadan da herkesin tahminini görebilirsin. Kullanıcı ekranında gizlilik kuralı devam eder.</p>
        </div>
        <select value={playerFilter} onChange={(e)=>setPlayerFilter(e.target.value)} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-bold">
          <option value="Tümü">Tüm oyuncular</option>
          {players.map((p: Player)=><option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <InfoCard title="Filtrelenen Maç" value={matches.length} note={`${playedCount} sonuçlandı`} />
        <InfoCard title="Tahmin Doluluk" value={`${filledRows}/${totalRows || 0}`} note="Bu filtrede girilen tahmin" />
        <InfoCard title="Eksik Tahmin" value={Math.max(0, (totalRows || 0) - filledRows)} note="Admin görünümü" />
      </div>

      <div className="mt-5 grid gap-3">
        {matches.map((match: Match) => {
          const matchPredCount = shownPlayers.filter((player: Player) => predictions.some((pred: ScorePrediction) => pred.player_id === player.id && pred.match_id === match.id)).length;
          const open = expandedMatchId === match.id;
          return (
            <div key={match.id} className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
              <button onClick={()=>setExpandedMatchId(open ? null : match.id)} className="flex w-full flex-col gap-2 p-4 text-left hover:bg-orange-50/50 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-xs font-black uppercase tracking-wider text-orange-500">Hafta {match.week_no || 1} • {match.league || "-"} • {formatDate(match.match_time)} • {statusLabel(match.match_status)}</div>
                  <div className="mt-1 text-lg font-black text-slate-900">{match.home_team} <span className="text-slate-300">vs</span> {match.away_team}</div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {isPlayed(match) ? <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">Sonuç: {match.home_score}-{match.away_score}</span> : <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-700">Tahmine açık/admin görür</span>}
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{matchPredCount}/{shownPlayers.length} tahmin</span>
                  <span className="text-lg">{open ? "⌃" : "⌄"}</span>
                </div>
              </button>

              {open ? (
                <div className="border-t border-slate-100 p-4">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-left text-sm">
                      <thead className="text-xs uppercase tracking-wider text-slate-400"><tr><th className="p-2">Oyuncu</th><th>Tahmin</th><th>Joker</th><th>Durum</th><th>Puan</th><th>Detay</th></tr></thead>
                      <tbody>
                        {shownPlayers.map((player: Player) => {
                          const pred = predictions.find((x: ScorePrediction) => x.player_id === player.id && x.match_id === match.id);
                          const playerFavs = favorites.filter((f: PlayerFavorite) => f.player_id === player.id);
                          const s = isPlayed(match) ? scorePrediction(pred, match, playerFavs) : null;
                          return (
                            <tr key={player.id} className="border-t border-slate-100">
                              <td className="p-2 font-black text-slate-800">{player.name}</td>
                              <td className="font-black">{pred ? `${pred.home_goals}-${pred.away_goals}` : <span className="text-slate-300">YOK</span>}</td>
                              <td>{pred?.is_joker ? <span className="rounded-full bg-purple-100 px-2 py-1 text-xs font-black text-purple-700">🃏 Joker</span> : <span className="text-slate-300">-</span>}</td>
                              <td>{pred ? <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-black text-emerald-700">Tahmin var</span> : <span className="rounded-full bg-rose-100 px-2 py-1 text-xs font-black text-rose-700">Eksik</span>}</td>
                              <td className="font-black text-orange-600">{s ? s.total : "-"}</td>
                              <td className="max-w-[320px] text-xs text-slate-400">{s ? s.detail : "Maç sonuçlanınca puan hesaplanır."}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
        {matches.length === 0 ? <div className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-400">Bu filtreye uygun maç yok.</div> : null}
      </div>
    </section>
  );
}

function AdminResultRow({ match, saveResult }: any) {
  const [home, setHome] = useState(match.home_score ?? 0);
  const [away, setAway] = useState(match.away_score ?? 0);
  const [status, setStatus] = useState(match.match_status || "played");
  const [note, setNote] = useState(match.admin_note || "");
  const [adv, setAdv] = useState(match.advancing_team || "");

  return (
    <div className="rounded-2xl border border-slate-100 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="font-black">{match.home_team} - {match.away_team}</div>
          <div className="text-xs font-bold text-slate-500">{formatDate(match.match_time)} • {statusLabel(status)}</div>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500">Hafta {match.week_no || "-"}</span>
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-[90px_30px_90px_160px_1fr_auto] md:items-center">
        <select value={home} onChange={e=>setHome(Number(e.target.value))} className="rounded-xl border p-2">{GOAL_OPTIONS.map(g=><option key={g}>{g}</option>)}</select>
        <span className="text-center font-black">-</span>
        <select value={away} onChange={e=>setAway(Number(e.target.value))} className="rounded-xl border p-2">{GOAL_OPTIONS.map(g=><option key={g}>{g}</option>)}</select>
        <select value={status} onChange={e=>setStatus(e.target.value)} className="rounded-xl border p-2"><option value="scheduled">Oynanmadı</option><option value="played">Oynandı</option><option value="postponed">Ertelendi</option><option value="cancelled">İptal</option><option value="forfeit">Hükmen</option></select>
        {match.is_knockout ? <select value={adv} onChange={e=>setAdv(e.target.value)} className="rounded-xl border p-2"><option value="">Turu geçen</option><option>{match.home_team}</option><option>{match.away_team}</option></select> : <input value={note} onChange={e=>setNote(e.target.value)} className="rounded-xl border p-2" placeholder="Admin notu" />}
        <AppButton onClick={()=>saveResult(match, home, away, status, adv, note)}>Kaydet</AppButton>
      </div>
      {match.is_knockout ? <input value={note} onChange={e=>setNote(e.target.value)} className="mt-2 w-full rounded-xl border p-2" placeholder="Admin notu" /> : null}
    </div>
  );
}
