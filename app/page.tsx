"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

const supabase = createClient(
  "https://mqjgemndxkuufjaeyhjb.supabase.co",
  "sb_publishable_ZcaB2PBtdaBJ6blYdd4wPA_872a5OfE",
);

const ADMIN_PASSWORD = "ors2026";

type Player = {
  id: string;
  name: string;
  team: string | null;
  is_admin: boolean;
  correct_count?: number;
  wrong_count?: number;
  force_majeure?: number;
  intentional_blank?: number;
  bonus_points?: number;
  total_points?: number;
  success_rate?: number;
  champion_team?: string | null;
};

type Match = {
  id: string;
  home_team: string;
  away_team: string;
  match_time: string;
  result: string | null;
  week_no?: number | null;
  breakfast_round?: string | null;
  league?: string | null;
  home_score?: number | null;
  away_score?: number | null;
};

type Prediction = {
  id: string;
  player_id: string;
  match_id: string;
  prediction: string;
  points: number;
};

type BonusLog = {
  id: string;
  player_id: string;
  match_id: string | null;
  points: number;
  reason: string | null;
  created_at: string;
};

const STAGES = [
  "Tümü",
  "Gruplar",
  "Son 32",
  "Son 16",
  "Çeyrek Final",
  "Yarı Final",
  "Üçüncülük",
  "Final",
];

const MATCH_FILTERS = [
  "Açık",
  "Bugün",
  "Yarın",
  "Başlayanlar",
  "Kapalı",
  "Tümü",
];

const PLAYER_COLORS = [
  "#f59e0b",
  "#ef4444",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#6366f1",
  "#84cc16",
];

const TEAM_FLAG_CODES: Record<string, string> = {
  Türkiye: "tr",
  Brezilya: "br",
  Arjantin: "ar",
  Almanya: "de",
  Fransa: "fr",
  İngiltere: "gb-eng",
  İspanya: "es",
  Hollanda: "nl",
  Belçika: "be",
  Portekiz: "pt",
  Uruguay: "uy",
  Japonya: "jp",
  ABD: "us",
  Meksika: "mx",
  Fas: "ma",
  İsviçre: "ch",
  Hırvatistan: "hr",
  Senegal: "sn",
  Kolombiya: "co",
  "Güney Kore": "kr",
  "Çek Cumhuriyeti": "cz",
  Kanada: "ca",
  "Bosna-Hersek": "ba",
  Paraguay: "py",
  Katar: "qa",
  Haiti: "ht",
  İskoçya: "gb-sct",
  Avustralya: "au",
  Curaçao: "cw",
  "Fildişi Sahili": "ci",
  Ekvador: "ec",
  İsveç: "se",
  Tunus: "tn",
  "Cape Verde": "cv",
  Mısır: "eg",
  "Suudi Arabistan": "sa",
  İran: "ir",
  "Yeni Zelanda": "nz",
  Irak: "iq",
  Norveç: "no",
  Cezayir: "dz",
  Avusturya: "at",
  Ürdün: "jo",
  "DR Kongo": "cd",
  Özbekistan: "uz",
  Gana: "gh",
  Panama: "pa",
  "Güney Afrika": "za",
};

function flagUrl(team: string) {
  const code = TEAM_FLAG_CODES[team.trim()];
  if (!code) return "";
  return `https://flagcdn.com/w40/${code}.png`;
}

function TeamName({ team }: { team: string }) {
  const url = flagUrl(team);

  return (
    <span className="inline-flex items-center justify-center gap-2">
      {url ? (
        <img
          src={url}
          alt={team}
          className="h-4 w-6 rounded-[3px] object-cover shadow-sm"
        />
      ) : (
        <span className="text-sm">🏳️</span>
      )}
      <span>{team}</span>
    </span>
  );
}

function getMatchStatus(match: Match) {
  const now = Date.now();
  const matchTime = new Date(match.match_time).getTime();
  const diffMs = matchTime - now;
  const absDiff = Math.abs(diffMs);
  const hours = Math.floor(absDiff / (1000 * 60 * 60));
  const mins = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));
  const days = Math.floor(hours / 24);

  if (match.result) {
    return {
      status: "finished" as const,
      label: "Sonuçlandı",
      color: "bg-slate-200 text-slate-600",
      borderColor: "border-slate-200",
    };
  }

  if (diffMs < 0) {
    let timeText = "";
    if (days > 0) timeText = `${days} gün önce bitti`;
    else if (hours > 0) timeText = `${hours} saat önce bitti`;
    else timeText = `${mins} dk önce bitti`;

    return {
      status: "needsScore" as const,
      label: `🔴 SKOR BEKLİYOR — ${timeText}`,
      color: "bg-red-500 text-white",
      borderColor: "border-red-500 ring-2 ring-red-300",
    };
  }

  if (diffMs < 24 * 60 * 60 * 1000) {
    let timeText = "";
    if (hours > 0) timeText = `${hours}s ${mins}dk sonra`;
    else timeText = `${mins} dk sonra`;

    return {
      status: "upcoming" as const,
      label: `🟡 YAKINDA — ${timeText} başlıyor`,
      color: "bg-amber-100 text-amber-800",
      borderColor: "border-amber-300",
    };
  }

  let timeText = "";
  if (days > 0) timeText = `${days} gün sonra`;
  else timeText = `${hours} saat sonra`;

  return {
    status: "open" as const,
    label: `🟢 Açık — ${timeText}`,
    color: "bg-emerald-100 text-emerald-700",
    borderColor: "border-emerald-200",
  };
}

export default function Home() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [bonusLogs, setBonusLogs] = useState<BonusLog[]>([]);

  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [loginName, setLoginName] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");

  const [selectedStage, setSelectedStage] = useState("Tümü");
  const [predictionFilter, setPredictionFilter] = useState("Açık");
  const [matchListFilter, setMatchListFilter] = useState("Tümü");
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const [profilePlayerId, setProfilePlayerId] = useState("");

  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [championWinner, setChampionWinner] = useState("");

  const CHAMPION_PICK_DEADLINE = new Date("2026-06-11T19:00:00Z");
  const championPickLocked = Date.now() >= CHAMPION_PICK_DEADLINE.getTime();

  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [matchTime, setMatchTime] = useState("");
  const [league, setLeague] = useState("");

  const [scoreInputs, setScoreInputs] = useState<
    Record<string, { home: string; away: string }>
  >({});

  const [bonusInputs, setBonusInputs] = useState<
    Record<string, { playerId: string; points: string; reason: string }>
  >({});

  const loadData = async () => {
    const { data: playersData } = await supabase.from("players").select("*");

    const { data: matchesData } = await supabase
      .from("matches")
      .select("*")
      .order("match_time", { ascending: true });

    const { data: predictionsData } = await supabase
      .from("predictions")
      .select("*");

    const { data: bonusData } = await supabase
      .from("bonus_logs")
      .select("*")
      .order("created_at", { ascending: false });

    setPlayers(playersData || []);
    setMatches(matchesData || []);
    setPredictions(predictionsData || []);
    setBonusLogs(bonusData || []);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("ors-live-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "matches" },
        () => loadData(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "predictions" },
        () => loadData(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "players" },
        () => loadData(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bonus_logs" },
        () => loadData(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const savedId = localStorage.getItem("ors_current_player_id");
    if (!savedId || players.length === 0) return;

    const player = players.find((p) => p.id === savedId);
    if (player) {
      setCurrentPlayer(player);
      setProfilePlayerId(player.id);
    }
  }, [players]);

  useEffect(() => {
    if (!currentPlayer) return;
    const fresh = players.find((p) => p.id === currentPlayer.id);
    if (fresh) setCurrentPlayer(fresh);
  }, [players, currentPlayer]);

  const login = () => {
    const player = players.find(
      (p) => p.name.toLowerCase() === loginName.trim().toLowerCase(),
    );

    if (!player) {
      alert("Bu kullanıcı sistemde tanımlı değil 😄");
      return;
    }

    setCurrentPlayer(player);
    setProfilePlayerId(player.id);
    localStorage.setItem("ors_current_player_id", player.id);
  };

  const logout = () => {
    localStorage.removeItem("ors_current_player_id");
    setCurrentPlayer(null);
    setLoginName("");
    setActiveTab("dashboard");
    setAdminUnlocked(false);
    setAdminPassword("");
  };

  const tournamentTeams = useMemo(() => {
    const blocked = [
      "Kazananı",
      "Mağlubu",
      "3.",
      "A ",
      "B ",
      "C ",
      "D ",
      "E ",
      "F ",
      "G ",
      "H ",
      "I ",
      "J ",
      "K ",
      "L ",
    ];

    const teams = new Set<string>();

    matches.forEach((m) => {
      [m.home_team, m.away_team].forEach((team) => {
        const isPlaceholder = blocked.some((b) => team.includes(b));
        if (!isPlaceholder) teams.add(team);
      });
    });

    return Array.from(teams).sort((a, b) => a.localeCompare(b, "tr"));
  }, [matches]);

  const filteredMatches = useMemo(() => {
    if (selectedStage === "Tümü") return matches;

    if (selectedStage === "Gruplar") {
      return matches.filter((m) => m.league?.startsWith("Grup"));
    }

    return matches.filter((m) => m.league === selectedStage);
  }, [matches, selectedStage]);

  const applyTimeFilter = (matchList: Match[], filter: string) => {
    const now = new Date();

    return matchList.filter((match) => {
      const matchDate = new Date(match.match_time);

      const today = new Date(now);
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      const nextDay = new Date(today);
      nextDay.setDate(today.getDate() + 2);

      const isToday = matchDate >= today && matchDate < tomorrow;
      const isTomorrow = matchDate >= tomorrow && matchDate < nextDay;
      const isStarted = matchDate.getTime() <= now.getTime();
      const isFinished = !!match.result;

      if (filter === "Tümü") return true;
      if (filter === "Bugün") return isToday;
      if (filter === "Yarın") return isTomorrow;
      if (filter === "Başlayanlar") return isStarted && !isFinished;
      if (filter === "Kapalı") return isStarted || isFinished;
      if (filter === "Açık") return !isStarted && !isFinished;

      return true;
    });
  };

  const predictionMatches = useMemo(() => {
    return applyTimeFilter(filteredMatches, predictionFilter);
  }, [filteredMatches, predictionFilter]);

  const matchListMatches = useMemo(() => {
    return applyTimeFilter(filteredMatches, matchListFilter);
  }, [filteredMatches, matchListFilter]);

  const openMatchesCount = useMemo(() => {
    return applyTimeFilter(filteredMatches, "Açık").length;
  }, [filteredMatches]);

  const todayMatches = useMemo(() => {
    return applyTimeFilter(filteredMatches, "Bugün");
  }, [filteredMatches]);

  const oneHourWarningMatches = useMemo(() => {
    const now = Date.now();

    return filteredMatches.filter((match) => {
      const matchTime = new Date(match.match_time).getTime();
      const diffMinutes = (matchTime - now) / (1000 * 60);

      return diffMinutes > 0 && diffMinutes <= 60 && !match.result;
    });
  }, [filteredMatches]);

  const enableNotifications = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      alert("Bu tarayıcı bildirimleri desteklemiyor 😅");
      return;
    }

    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      setNotificationsEnabled(true);
      localStorage.setItem("ors_notifications_enabled", "true");
      alert("Bildirimler açıldı 🔔");
    } else {
      alert("Bildirim izni verilmedi 😄");
    }
  };

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    const saved = localStorage.getItem("ors_notifications_enabled") === "true";

    if (saved && Notification.permission === "granted") {
      setNotificationsEnabled(true);
    }
  }, []);

  useEffect(() => {
    if (!notificationsEnabled) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    oneHourWarningMatches.forEach((match) => {
      const notificationKey = `ors_notified_${match.id}`;
      const alreadyNotified = localStorage.getItem(notificationKey);

      if (alreadyNotified) return;

      new Notification("ORS Kahvaltı Ligi 🔔", {
        body: `${match.home_team} - ${match.away_team} maçı 1 saat içinde başlıyor. Tahmini unutma!`,
      });

      localStorage.setItem(notificationKey, "true");
    });
  }, [notificationsEnabled, oneHourWarningMatches]);

  const sortedPlayers = useMemo(() => {
    return [...players].sort(
      (a, b) => Number(b.total_points || 0) - Number(a.total_points || 0),
    );
  }, [players]);

  const playerStreaks = useMemo(() => {
    const streaks: Record<string, number> = {};

    players.forEach((player) => {
      const playerPredictions = predictions
        .filter((p) => p.player_id === player.id)
        .sort((a, b) => {
          const ma = matches.find((m) => m.id === a.match_id);
          const mb = matches.find((m) => m.id === b.match_id);

          return (
            new Date(mb?.match_time || 0).getTime() -
            new Date(ma?.match_time || 0).getTime()
          );
        });

      let streak = 0;

      for (const pred of playerPredictions) {
        const match = matches.find((m) => m.id === pred.match_id);
        if (!match?.result) continue;

        if (pred.points > 0) streak++;
        else break;
      }

      streaks[player.id] = streak;
    });

    return streaks;
  }, [players, predictions, matches]);

  const playerBadges = useMemo(() => {
    const badges: Record<string, string[]> = {};

    const leaderId = sortedPlayers[0]?.id;
    const maxBlank = Math.max(
      0,
      ...players.map((p) => Number(p.intentional_blank || 0)),
    );
    const maxWrong = Math.max(
      0,
      ...players.map((p) => Number(p.wrong_count || 0)),
    );
    const maxBonus = Math.max(
      0,
      ...players.map((p) => Number(p.bonus_points || 0)),
    );

    players.forEach((player) => {
      const list: string[] = [];
      const streak = playerStreaks[player.id] || 0;
      const success = Number(player.success_rate || 0);
      const correct = Number(player.correct_count || 0);
      const blank = Number(player.intentional_blank || 0);
      const wrong = Number(player.wrong_count || 0);
      const bonus = Number(player.bonus_points || 0);

      if (player.id === leaderId) list.push("👑 GOAT");
      if (streak >= 5) list.push("🔥 Alev Adam");
      if (success >= 70 && correct >= 5) list.push("🔮 Oracle");
      if (blank > 0 && blank === maxBlank) list.push("🥯 Kahvaltı Felaketi");
      if (wrong > 0 && wrong === maxWrong) list.push("💀 Risk Kurbanı");
      if (bonus > 0 && bonus === maxBonus) list.push("✨ Bonus Avcısı");
      if (correct >= 10) list.push("🧠 Tahmin Ustası");

      badges[player.id] = list.length > 0 ? list : ["🌱 Yükselen Yıldız"];
    });

    return badges;
  }, [players, sortedPlayers, playerStreaks]);

  const getPointsByPlayer = (matchList: Match[], ascending = false) => {
    const data = players.map((player) => {
      const points = matchList.reduce((sum, match) => {
        const pred = predictions.find(
          (p) => p.player_id === player.id && p.match_id === match.id,
        );

        const bonus = bonusLogs
          .filter((b) => b.player_id === player.id && b.match_id === match.id)
          .reduce((bonusSum, b) => bonusSum + Number(b.points || 0), 0);

        return sum + Number(pred?.points || 0) + bonus;
      }, 0);

      return { ...player, period_points: points };
    });

    return data.sort((a, b) =>
      ascending
        ? a.period_points - b.period_points
        : b.period_points - a.period_points,
    );
  };

  const stageScores = useMemo(() => {
    return getPointsByPlayer(filteredMatches, true);
  }, [players, predictions, bonusLogs, filteredMatches]);

  const stageChartData = useMemo(() => {
    if (players.length === 0) return [];

    const stages = [
      "Gruplar",
      "Son 32",
      "Son 16",
      "Çeyrek Final",
      "Yarı Final",
      "Üçüncülük",
      "Final",
    ];

    const cumulative: Record<string, number> = {};
    players.forEach((p) => {
      cumulative[p.id] = 0;
    });

    return stages.map((stage) => {
      const stageMatches =
        stage === "Gruplar"
          ? matches.filter((m) => m.league?.startsWith("Grup"))
          : matches.filter((m) => m.league === stage);

      const row: Record<string, string | number> = { stage };

      players.forEach((player) => {
        const points = stageMatches.reduce((sum, match) => {
          const pred = predictions.find(
            (p) => p.player_id === player.id && p.match_id === match.id,
          );

          const bonus = bonusLogs
            .filter((b) => b.player_id === player.id && b.match_id === match.id)
            .reduce((bonusSum, b) => bonusSum + Number(b.points || 0), 0);

          return sum + Number(pred?.points || 0) + bonus;
        }, 0);

        cumulative[player.id] += points;
        row[player.name] = cumulative[player.id];
      });

      return row;
    });
  }, [matches, players, predictions, bonusLogs]);

  const profilePlayer = useMemo(() => {
    return players.find((p) => p.id === profilePlayerId) || currentPlayer;
  }, [profilePlayerId, players, currentPlayer]);

  const profilePredictions = useMemo(() => {
    if (!profilePlayer) return [];

    return predictions
      .filter((p) => p.player_id === profilePlayer.id)
      .map((p) => {
        const match = matches.find((m) => m.id === p.match_id);
        return { ...p, match };
      })
      .filter((p) => p.match)
      .sort((a, b) => {
        const at = new Date(a.match!.match_time).getTime();
        const bt = new Date(b.match!.match_time).getTime();
        return bt - at;
      });
  }, [profilePlayer, predictions, matches]);

  const profileStageData = useMemo(() => {
    if (!profilePlayer) return [];

    return STAGES.filter((s) => s !== "Tümü").map((stage) => {
      const stageMatches =
        stage === "Gruplar"
          ? matches.filter((m) => m.league?.startsWith("Grup"))
          : matches.filter((m) => m.league === stage);

      const points = stageMatches.reduce((sum, match) => {
        const pred = predictions.find(
          (p) => p.player_id === profilePlayer.id && p.match_id === match.id,
        );

        const bonus = bonusLogs
          .filter(
            (b) => b.player_id === profilePlayer.id && b.match_id === match.id,
          )
          .reduce((bonusSum, b) => bonusSum + Number(b.points || 0), 0);

        return sum + Number(pred?.points || 0) + bonus;
      }, 0);

      return { stage, points };
    });
  }, [profilePlayer, matches, predictions, bonusLogs]);

  const profileTeamStats = useMemo(() => {
    if (!profilePlayer) return null;

    const teamStats: Record<
      string,
      { team: string; correct: number; wrong: number; picked: number }
    > = {};

    profilePredictions.forEach((p) => {
      if (!p.match || !p.match.result || p.prediction === "YOK") return;

      const pickedTeam =
        p.prediction === "1"
          ? p.match.home_team
          : p.prediction === "2"
            ? p.match.away_team
            : null;

      if (!pickedTeam) return;

      if (!teamStats[pickedTeam]) {
        teamStats[pickedTeam] = {
          team: pickedTeam,
          correct: 0,
          wrong: 0,
          picked: 0,
        };
      }

      teamStats[pickedTeam].picked++;

      if (p.prediction === p.match.result) {
        teamStats[pickedTeam].correct++;
      } else {
        teamStats[pickedTeam].wrong++;
      }
    });

    const list = Object.values(teamStats);

    return {
      bestTeam: [...list].sort((a, b) => b.correct - a.correct)[0],
      worstTeam: [...list].sort((a, b) => b.wrong - a.wrong)[0],
      mostTrustedTeam: [...list].sort((a, b) => b.picked - a.picked)[0],
    };
  }, [profilePlayer, profilePredictions]);

  const profileBestStage = useMemo(() => {
    const rows = profileStageData.filter((row) => Number(row.points) !== 0);
    return [...rows].sort((a, b) => Number(b.points) - Number(a.points))[0];
  }, [profileStageData]);

  const getConsensus = (matchId: string) => {
    const matchPreds = predictions.filter(
      (p) => p.match_id === matchId && p.prediction !== "YOK",
    );

    const total = matchPreds.length;
    if (total === 0) return { "1": 0, X: 0, "2": 0, total: 0 };

    const c = { "1": 0, X: 0, "2": 0 };

    matchPreds.forEach((p) => {
      if (p.prediction in c) c[p.prediction as "1" | "X" | "2"]++;
    });

    return {
      "1": Math.round((c["1"] / total) * 100),
      X: Math.round((c.X / total) * 100),
      "2": Math.round((c["2"] / total) * 100),
      total,
    };
  };

  const makePrediction = async (match: Match, prediction: string) => {
    if (!currentPlayer) return;

    if (new Date(match.match_time).getTime() <= Date.now()) {
      alert("Maç saati geldiği için tahmin kapandı 😄");
      return;
    }

    if (match.result) {
      alert("Bu maç sonuçlanmış.");
      return;
    }

    const { error } = await supabase.from("predictions").upsert(
      {
        player_id: currentPlayer.id,
        match_id: match.id,
        prediction,
        points: 0,
      },
      { onConflict: "player_id,match_id" },
    );

    if (error) {
      alert(error.message);
      return;
    }

    await loadData();
  };

  const saveChampionPick = async (team: string) => {
    if (!currentPlayer) return;

    if (championPickLocked) {
      alert("Şampiyon tahmini kilitlendi 🔒");
      return;
    }

    const { error } = await supabase
      .from("players")
      .update({ champion_team: team })
      .eq("id", currentPlayer.id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadData();
    alert(`Şampiyon tahminin kaydedildi: ${team} 🏆`);
  };

  const awardChampionBonus = async () => {
    if (!currentPlayer?.is_admin || !adminUnlocked) return;

    if (!championWinner) {
      alert("Şampiyon ülkeyi seç 😄");
      return;
    }

    if (!confirm(`${championWinner} seçenlere +100 puan verilsin mi?`)) return;

    const winners = players.filter((p) => p.champion_team === championWinner);

    for (const player of winners) {
      const alreadyAwarded = bonusLogs.some(
        (b) =>
          b.player_id === player.id &&
          b.reason === `Şampiyon tahmini: ${championWinner}`,
      );

      if (alreadyAwarded) continue;

      await supabase.from("bonus_logs").insert({
        player_id: player.id,
        match_id: null,
        points: 100,
        reason: `Şampiyon tahmini: ${championWinner}`,
      });

      await supabase
        .from("players")
        .update({
          bonus_points: Number(player.bonus_points || 0) + 100,
          total_points: Number(player.total_points || 0) + 100,
        })
        .eq("id", player.id);
    }

    await loadData();
    alert(`${winners.length} kişiye şampiyon bonusu işlendi 🏆`);
  };

  const recalculateAllScores = async (
    overrideMatchId?: string,
    overrideResult?: string,
  ) => {
    const { data: latestPlayers } = await supabase.from("players").select("*");
    const { data: latestPredictions } = await supabase
      .from("predictions")
      .select("*");
    const { data: latestBonusLogs } = await supabase
      .from("bonus_logs")
      .select("*");

    const playerList = latestPlayers || [];
    const predictionList = latestPredictions || [];
    const bonusList = latestBonusLogs || [];

    for (const player of playerList) {
      const playerPredictions = predictionList.filter(
        (p) => p.player_id === player.id,
      );

      let correct = 0;
      let wrong = 0;
      let blank = 0;
      let predictionPoints = 0;

      for (const pred of playerPredictions) {
        const predMatch = matches.find((m) => m.id === pred.match_id);
        const finalResult =
          pred.match_id === overrideMatchId
            ? overrideResult
            : predMatch?.result;

        if (!finalResult) continue;

        let points = -3;

        if (pred.prediction === "YOK") {
          blank++;
          points = -3;
        } else if (pred.prediction === finalResult) {
          correct++;
          points = 3;
        } else {
          wrong++;
          points = -1;
        }

        predictionPoints += points;

        await supabase.from("predictions").update({ points }).eq("id", pred.id);
      }

      const bonusPoints = bonusList
        .filter((b) => b.player_id === player.id)
        .reduce((sum, b) => sum + Number(b.points || 0), 0);

      const totalAnswered = correct + wrong;
      const successRate =
        totalAnswered > 0
          ? Number(((correct / totalAnswered) * 100).toFixed(1))
          : 0;

      await supabase
        .from("players")
        .update({
          correct_count: correct,
          wrong_count: wrong,
          intentional_blank: blank,
          bonus_points: bonusPoints,
          total_points: predictionPoints + bonusPoints,
          success_rate: successRate,
        })
        .eq("id", player.id);
    }
  };

  const addMissingNoPredictionsForMatch = async (match: Match) => {
    for (const player of players) {
      const exists = predictions.some(
        (p) => p.player_id === player.id && p.match_id === match.id,
      );

      if (!exists) {
        await supabase.from("predictions").insert({
          player_id: player.id,
          match_id: match.id,
          prediction: "YOK",
          points: -3,
        });
      }
    }
  };

  const updateResult = async (
    match: Match,
    result: string,
    homeScore?: number,
    awayScore?: number,
  ) => {
    if (!currentPlayer?.is_admin || !adminUnlocked) return;

    await addMissingNoPredictionsForMatch(match);

    await supabase
      .from("matches")
      .update({
        result,
        home_score: homeScore ?? null,
        away_score: awayScore ?? null,
      })
      .eq("id", match.id);

    await recalculateAllScores(match.id, result);
    await loadData();
  };

  const submitScore = async (match: Match) => {
    const score = scoreInputs[match.id];

    if (!score?.home || !score?.away) {
      alert("Skorları gir 😄");
      return;
    }

    const home = Number(score.home);
    const away = Number(score.away);

    if (Number.isNaN(home) || Number.isNaN(away)) {
      alert("Skorlar sayı olmalı 😄");
      return;
    }

    const result = home > away ? "1" : home < away ? "2" : "X";
    await updateResult(match, result, home, away);
  };

  const addBonusToMatch = async (match: Match) => {
    if (!currentPlayer?.is_admin || !adminUnlocked) return;

    const input = bonusInputs[match.id];

    if (!input?.playerId || !input?.points) {
      alert("Oyuncu ve puan gir 😄");
      return;
    }

    const bonusPoint = Number(input.points);

    if (Number.isNaN(bonusPoint)) {
      alert("Ek puan sayı olmalı 😄");
      return;
    }

    const player = players.find((p) => p.id === input.playerId);
    if (!player) return;

    await supabase.from("bonus_logs").insert({
      player_id: player.id,
      match_id: match.id,
      points: bonusPoint,
      reason: input.reason || null,
    });

    await recalculateAllScores();
    setBonusInputs((prev) => ({
      ...prev,
      [match.id]: { playerId: "", points: "", reason: "" },
    }));

    await loadData();
  };

  const deleteMatch = async (id: string) => {
    if (!currentPlayer?.is_admin || !adminUnlocked) return;
    if (!confirm("Bu maçı silmek istiyor musun?")) return;

    await supabase.from("matches").delete().eq("id", id);
    await recalculateAllScores();
    await loadData();
  };

  const importWeeklyExcel = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();

    const lines = text
      .split(/\r?\n/)
      .map((r) => r.trim())
      .filter(Boolean);

    if (lines.length < 2) {
      alert("CSV boş görünüyor 😄");
      return;
    }

    const splitRow = (row: string) => {
      if (row.includes(";")) return row.split(";").map((x) => x.trim());
      if (row.includes("\t")) return row.split("\t").map((x) => x.trim());
      return row.split(",").map((x) => x.trim());
    };

    let added = 0;

    for (const row of lines.slice(1)) {
      const cols = splitRow(row);

      const home = cols[0]?.trim();
      const away = cols[1]?.trim();
      const stage = cols[2]?.trim();
      const time = cols[3]?.trim();

      if (!home || !away || !stage || !time) continue;

      const { error } = await supabase.from("matches").insert({
        week_no: 999,
        home_team: home,
        away_team: away,
        breakfast_round: "Dünya Kupası 2026",
        league: stage,
        match_time: time,
        result: null,
      });

      if (!error) added++;
    }

    e.target.value = "";
    await loadData();
    alert(`${added} maç yüklendi 😄`);
  };

  const addMatch = async () => {
    if (!currentPlayer?.is_admin || !adminUnlocked) return;

    if (!homeTeam || !awayTeam || !matchTime || !league) {
      alert("Maç bilgilerini doldur 😄");
      return;
    }

    const { error } = await supabase.from("matches").insert({
      home_team: homeTeam.trim(),
      away_team: awayTeam.trim(),
      match_time: matchTime,
      week_no: 999,
      breakfast_round: "Dünya Kupası 2026",
      league: league.trim(),
      result: null,
    });

    if (error) {
      alert(error.message);
      return;
    }

    setHomeTeam("");
    setAwayTeam("");
    setMatchTime("");
    setLeague("");
    await loadData();
  };

  if (!currentPlayer) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4 text-slate-900">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
          <div className="mb-4 text-center text-5xl">🥯⚽</div>

          <h1 className="text-center text-xl font-black">ORS Kahvaltı Ligi</h1>

          <p className="mb-6 text-center font-bold text-amber-500">
            Dünya Kupası Edition
          </p>

          <input
            value={loginName}
            onChange={(e) => setLoginName(e.target.value)}
            placeholder="Kullanıcı adını gir"
            className="mb-4 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 outline-none"
          />

          <button
            onClick={login}
            className="w-full rounded-2xl bg-amber-400 p-4 font-black text-slate-950"
          >
            Giriş Yap
          </button>
        </div>
      </main>
    );
  }

  const tabs = [
    "dashboard",
    "tahmin",
    "maclar",
    "profil",
    currentPlayer.is_admin ? "admin" : "",
  ].filter(Boolean);

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <header className="mb-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
          <h1 className="text-4xl font-black leading-none md:text-5xl">
            ORS Kahvaltı Ligi
          </h1>

          <p className="mb-6 text-3xl font-black text-amber-500 md:text-4xl">
            Dünya Kupası Edition 🏆
          </p>

          <p className="mb-6 font-bold text-slate-600">
            Hoş geldin <b>{currentPlayer.name}</b> 😄
          </p>

          <div className="mb-6 flex flex-wrap gap-3">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-2xl px-5 py-3 font-black transition ${
                  activeTab === tab
                    ? "bg-amber-400 text-slate-950"
                    : "bg-slate-100 text-slate-700 hover:bg-amber-50"
                }`}
              >
                {tab === "dashboard" && "Dashboard"}
                {tab === "tahmin" && "Tahmin Yap"}
                {tab === "maclar" && "Maçlar"}
                {tab === "profil" && "Profil"}
                {tab === "admin" && "Admin"}
              </button>
            ))}

            <button
              onClick={logout}
              className="rounded-2xl bg-red-500 px-5 py-3 font-black text-white"
            >
              Çıkış
            </button>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="mr-2 flex items-center gap-2">
              <span className="text-lg">🏆</span>
              <span className="text-sm font-black uppercase tracking-wide text-slate-500">
                Turnuva Aşaması
              </span>
            </div>

            {STAGES.map((stage) => (
              <button
                key={stage}
                onClick={() => setSelectedStage(stage)}
                className={`rounded-xl px-4 py-2 font-black transition ${
                  selectedStage === stage
                    ? "bg-amber-400 text-slate-950"
                    : "bg-white text-slate-700 hover:bg-amber-50"
                }`}
              >
                {stage}
              </button>
            ))}
          </div>
        </header>

        {activeTab === "dashboard" && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
            <h2 className="mb-6 text-xl font-black">🏆 Dashboard</h2>

            <div className="mb-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl bg-amber-400 p-5 text-slate-950 transition hover:scale-[1.01]">
                <div className="text-4xl">👑</div>
                <div className="text-xl font-black">Genel Lider</div>
                <div className="animate-pulse text-xl font-black">
                  👑 {sortedPlayers[0]?.name || "-"}
                </div>
              </div>

              <div className="rounded-3xl bg-red-100 p-5">
                <div className="text-4xl">🥯</div>
                <div className="text-xl font-black">
                  {selectedStage === "Tümü"
                    ? "Turnuva Kahvaltı Hattı"
                    : `${selectedStage} Kahvaltı Hattı`}
                </div>

                {stageScores.slice(0, 2).map((p) => (
                  <div key={p.id} className="text-xl font-black text-red-600">
                    {p.name}
                  </div>
                ))}
              </div>

              <div className="rounded-3xl bg-slate-100 p-5">
                <div className="text-4xl">⚽</div>
                <div className="text-xl font-black">Açık Maç</div>
                <div className="text-xl font-black text-blue-600">
                  {openMatchesCount}
                </div>
              </div>
            </div>

            <div className="mb-6 rounded-3xl border border-amber-200 bg-amber-50 p-5">
              <h3 className="mb-3 text-xl font-black">🏆 Şampiyon Tahmini</h3>

              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={currentPlayer.champion_team || ""}
                  disabled={championPickLocked}
                  onChange={(e) => saveChampionPick(e.target.value)}
                  className="rounded-2xl border border-amber-200 bg-white p-3 font-black disabled:cursor-not-allowed disabled:bg-slate-100"
                >
                  <option value="">Şampiyon ülke seç</option>
                  {tournamentTeams.map((team) => (
                    <option key={team} value={team}>
                      {team}
                    </option>
                  ))}
                </select>

                <span className="font-bold text-slate-600">
                  {championPickLocked
                    ? "Şampiyon tahmini kilitlendi 🔒"
                    : "Doğru çıkarsa +100 puan 😍"}
                </span>
              </div>
            </div>

            <div className="mb-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="mb-4 text-xl font-black">📈 Turnuva Grafiği</h3>

              {stageChartData.length === 0 ? (
                <div className="py-8 text-center text-slate-500">
                  Henüz veri yok 😄
                </div>
              ) : (
                <div className="w-full" style={{ height: 420 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stageChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="stage" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip />
                      <Legend />
                      {players.map((p, idx) => (
                        <Line
                          key={p.id}
                          type="monotone"
                          dataKey={p.name}
                          stroke={PLAYER_COLORS[idx % PLAYER_COLORS.length]}
                          strokeWidth={p.id === currentPlayer.id ? 4 : 2}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <ScoreTable
              sortedPlayers={sortedPlayers}
              playerStreaks={playerStreaks}
              playerBadges={playerBadges}
              onProfile={(id) => {
                setProfilePlayerId(id);
                setActiveTab("profil");
              }}
            />
          </section>
        )}

        {activeTab === "tahmin" && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
            <h2 className="mb-6 text-xl font-black">🎯 Tahmin Yap</h2>

            <FilterButtons
              value={predictionFilter}
              onChange={setPredictionFilter}
            />

            <MatchAlertPanel
              todayMatches={todayMatches}
              oneHourWarningMatches={oneHourWarningMatches}
              notificationsEnabled={notificationsEnabled}
              onEnableNotifications={enableNotifications}
            />

            {predictionMatches.length === 0 && (
              <div className="rounded-3xl bg-slate-50 p-6 text-slate-600">
                Bu filtrede maç yok 😄
              </div>
            )}

            <div className="space-y-4">
              {predictionMatches.map((match) => {
                const myPrediction = predictions.find(
                  (p) =>
                    p.match_id === match.id && p.player_id === currentPlayer.id,
                );

                const consensus = getConsensus(match.id);
                const isStarted =
                  new Date(match.match_time).getTime() <= Date.now();
                const status = getMatchStatus(match);

                return (
                  <div
                    key={match.id}
                    className={`rounded-3xl border bg-slate-50 p-4 transition hover:scale-[1.01] hover:shadow-lg ${status.borderColor}`}
                  >
                    <div className="flex flex-wrap justify-between gap-3 text-sm text-slate-500">
                      <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-black text-slate-950">
                        {match.league || "Dünya Kupası"}
                      </span>
                      <span>
                        {new Date(match.match_time).toLocaleString("tr-TR")}
                      </span>
                    </div>

                    <div className="mt-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${status.color}`}
                      >
                        {status.label}
                      </span>
                    </div>

                    <div className="my-4 grid grid-cols-[1fr_auto_1fr] items-center text-center">
                      <div className="text-xl font-black">
                        <TeamName team={match.home_team} />
                      </div>
                      <div className="font-black text-amber-500">⚔️</div>
                      <div className="text-xl font-black">
                        <TeamName team={match.away_team} />
                      </div>
                    </div>

                    {isStarted || match.result ? (
                      <div className="rounded-2xl bg-white p-3 text-center font-black text-slate-500">
                        Tahmin kapandı 🔒
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        {["1", "X", "2"].map((v) => (
                          <button
                            key={v}
                            onClick={() => makePrediction(match, v)}
                            className={`rounded-2xl py-3 font-black ${
                              myPrediction?.prediction === v
                                ? "bg-amber-400 text-slate-950"
                                : "border border-slate-200 bg-white hover:bg-amber-50"
                            }`}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    )}

                    {myPrediction && (
                      <p className="mt-3 text-sm font-bold text-amber-600">
                        Tahminin: {myPrediction.prediction}
                      </p>
                    )}

                    {myPrediction && (
                      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <div className="text-sm font-black text-slate-700">
                            🗣️ Diğerleri ne dedi?
                          </div>
                          <div className="text-xs font-bold text-slate-500">
                            {consensus.total} tahmin
                          </div>
                        </div>

                        <div className="space-y-2">
                          {(["1", "X", "2"] as const).map((v) => {
                            const pct = consensus[v];

                            return (
                              <div key={v} className="flex items-center gap-2">
                                <div className="w-8 text-center text-sm font-black">
                                  {v}
                                </div>
                                <div className="relative h-6 flex-1 overflow-hidden rounded-full bg-slate-100">
                                  <div
                                    className="h-full rounded-full bg-amber-400"
                                    style={{ width: `${pct}%` }}
                                  />
                                  <div className="absolute inset-0 flex items-center justify-end pr-2 text-xs font-black">
                                    %{pct}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {activeTab === "maclar" && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
            <h2 className="mb-6 text-xl font-black">⚽ Maçlar</h2>

            <FilterButtons
              value={matchListFilter}
              onChange={setMatchListFilter}
            />

            <div className="space-y-4">
              {matchListMatches.map((match) => {
                const matchBonuses = bonusLogs.filter(
                  (b) => b.match_id === match.id,
                );
                const status = getMatchStatus(match);
                const isStarted =
                  new Date(match.match_time).getTime() <= Date.now();

                return (
                  <div
                    key={match.id}
                    className={`rounded-3xl border bg-slate-50 p-4 transition hover:scale-[1.01] hover:shadow-lg ${status.borderColor}`}
                  >
                    <div className="flex flex-wrap justify-between gap-3 text-sm text-slate-500">
                      <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-black text-slate-950">
                        {match.league || "Dünya Kupası"}
                      </span>
                      <span>
                        {new Date(match.match_time).toLocaleString("tr-TR")}
                      </span>
                    </div>

                    <div className="mt-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${status.color}`}
                      >
                        {status.label}
                      </span>
                    </div>

                    <div className="my-3 text-xl font-black">
                      <TeamName team={match.home_team} /> -{" "}
                      <TeamName team={match.away_team} />
                    </div>

                    <div className="mb-3 font-black text-amber-600">
                      Sonuç:{" "}
                      {match.home_score !== null &&
                      match.home_score !== undefined
                        ? `${match.home_score} - ${match.away_score} (${match.result})`
                        : match.result || "Bekleniyor"}
                    </div>

                    <div className="grid gap-2 md:grid-cols-2">
                      {players.map((player) => {
                        const pred = predictions.find(
                          (p) =>
                            p.player_id === player.id &&
                            p.match_id === match.id,
                        );

                        return (
                          <div
                            key={player.id}
                            className="flex justify-between rounded-xl border border-slate-100 bg-white px-3 py-2"
                          >
                            <span>{player.name}</span>
                            <span className="font-black">
                              {!isStarted && !match.result
                                ? "Gizli 🔒"
                                : pred
                                  ? `${pred.prediction} (${pred.points})`
                                  : "Yok"}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {matchBonuses.length > 0 && (
                      <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3">
                        <div className="mb-2 font-black">
                          🏆 Bu Maçın Ek Puanları
                        </div>

                        {matchBonuses.map((bonus) => {
                          const player = players.find(
                            (p) => p.id === bonus.player_id,
                          );

                          return (
                            <div
                              key={bonus.id}
                              className="flex justify-between border-b border-amber-100 py-1"
                            >
                              <span>
                                {player?.name || "Oyuncu"}{" "}
                                <span className="text-slate-500">
                                  {bonus.reason ? `• ${bonus.reason}` : ""}
                                </span>
                              </span>

                              <span className="font-black text-amber-700">
                                {bonus.points > 0 ? "+" : ""}
                                {bonus.points}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {activeTab === "profil" && profilePlayer && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
            <h2 className="mb-6 text-xl font-black">👤 Profil</h2>

            <div className="mb-6 flex flex-wrap items-center gap-3">
              <span className="font-bold text-slate-500">Oyuncu:</span>
              <select
                value={profilePlayerId}
                onChange={(e) => setProfilePlayerId(e.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-3 font-black"
              >
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {p.id === currentPlayer.id ? " (sen)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-6 rounded-3xl bg-gradient-to-br from-amber-400 to-amber-300 p-6 text-slate-950">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-bold opacity-70">OYUNCU</div>
                  <div className="text-xl font-black">{profilePlayer.name}</div>
                  <div className="mt-2 font-bold">
                    Şampiyon Tahmini:{" "}
                    {profilePlayer.champion_team ? (
                      <TeamName team={profilePlayer.champion_team} />
                    ) : (
                      "Seçilmedi"
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-bold opacity-70">SIRALAMA</div>
                  <div className="text-5xl font-black">
                    #
                    {sortedPlayers.findIndex((p) => p.id === profilePlayer.id) +
                      1}
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
              <StatBox title="PUAN" value={profilePlayer.total_points || 0} />
              <StatBox title="DOĞRU" value={profilePlayer.correct_count || 0} />
              <StatBox title="YANLIŞ" value={profilePlayer.wrong_count || 0} />
              <StatBox
                title="YOK"
                value={profilePlayer.intentional_blank || 0}
              />
              <StatBox
                title="EK PUAN"
                value={profilePlayer.bonus_points || 0}
              />
              <StatBox
                title="BAŞARI"
                value={`%${profilePlayer.success_rate || 0}`}
              />
            </div>

            <div className="mb-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <div className="mb-3 text-xs font-black uppercase tracking-wide text-slate-500">
                Oyuncu Rozetleri
              </div>
              <div className="flex flex-wrap gap-2">
                {(playerBadges[profilePlayer.id] || ["🌱 Yükselen Yıldız"]).map(
                  (badge) => (
                    <span
                      key={badge}
                      className="rounded-full bg-amber-100 px-3 py-2 text-sm font-black text-amber-800"
                    >
                      {badge}
                    </span>
                  ),
                )}
              </div>
            </div>

            <div className="mb-6 grid gap-3 md:grid-cols-4">
              <ProfileInsightCard
                title="En Çok Doğru Bildiği Ülke"
                value={profileTeamStats?.bestTeam?.team || "-"}
                note={`${profileTeamStats?.bestTeam?.correct || 0} doğru`}
              />

              <ProfileInsightCard
                title="En Çok Yandığı Ülke"
                value={profileTeamStats?.worstTeam?.team || "-"}
                note={`${profileTeamStats?.worstTeam?.wrong || 0} yanlış`}
              />

              <ProfileInsightCard
                title="En Çok Güvendiği Ülke"
                value={profileTeamStats?.mostTrustedTeam?.team || "-"}
                note={`${profileTeamStats?.mostTrustedTeam?.picked || 0} kez seçti`}
              />

              <ProfileInsightCard
                title="En İyi Olduğu Aşama"
                value={String(profileBestStage?.stage || "-")}
                note={`${profileBestStage?.points || 0} puan`}
              />
            </div>

            <div className="mb-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="mb-4 text-xl font-black">📊 Aşama Aşama</h3>

              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={profileStageData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="stage" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip />
                    <Bar
                      dataKey="points"
                      fill="#f59e0b"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="mb-4 text-xl font-black">📜 Son 10 Tahmin</h3>

              <div className="space-y-2">
                {profilePredictions.slice(0, 10).map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3"
                  >
                    <div>
                      <div className="font-black">
                        {p.match?.home_team && (
                          <TeamName team={p.match.home_team} />
                        )}{" "}
                        -{" "}
                        {p.match?.away_team && (
                          <TeamName team={p.match.away_team} />
                        )}
                      </div>
                      <div className="text-xs text-slate-500">
                        {p.match?.league || "-"}
                      </div>
                    </div>

                    <div className="text-sm font-bold">
                      Tahmin: {p.prediction}
                    </div>
                    <div className="text-sm font-bold">
                      Sonuç: {p.match?.result || "—"}
                    </div>

                    <div className="rounded-lg bg-slate-100 px-3 py-1 text-sm font-black">
                      {p.match?.result
                        ? `${p.points > 0 ? "+" : ""}${p.points}`
                        : "Bekliyor"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {activeTab === "admin" && currentPlayer.is_admin && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
            <h2 className="mb-6 text-xl font-black">👑 Admin Paneli</h2>

            {!adminUnlocked ? (
              <div className="max-w-md rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <h3 className="mb-3 text-xl font-black">Admin Şifresi</h3>

                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Admin şifresi"
                  className="mb-3 w-full rounded-2xl border border-slate-200 bg-white p-3"
                />

                <button
                  onClick={() => {
                    if (adminPassword === ADMIN_PASSWORD) {
                      setAdminUnlocked(true);
                    } else {
                      alert("Şifre yanlış 😄");
                    }
                  }}
                  className="rounded-2xl bg-slate-950 px-6 py-3 font-black text-white"
                >
                  Admin Panelini Aç
                </button>
              </div>
            ) : (
              <>
                <div className="mb-6 rounded-3xl border border-amber-200 bg-amber-50 p-5">
                  <h3 className="mb-4 text-xl font-black">
                    🏆 Şampiyon Bonusunu İşle
                  </h3>

                  <div className="flex flex-wrap gap-3">
                    <select
                      value={championWinner}
                      onChange={(e) => setChampionWinner(e.target.value)}
                      className="rounded-2xl border border-amber-200 bg-white p-3 font-black"
                    >
                      <option value="">Şampiyon ülke seç</option>
                      {tournamentTeams.map((team) => (
                        <option key={team} value={team}>
                          {team}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={awardChampionBonus}
                      className="rounded-2xl bg-amber-400 px-5 py-3 font-black text-slate-950"
                    >
                      Doğru bilenlere +100 ver
                    </button>
                  </div>
                </div>

                <div className="mb-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <h3 className="mb-4 text-xl font-black">
                    📂 Toplu Maç Yükle
                  </h3>

                  <input
                    type="file"
                    accept=".csv"
                    onChange={importWeeklyExcel}
                    className="w-full rounded-2xl border border-slate-200 bg-white p-3"
                  />

                  <p className="mt-2 text-sm text-slate-500">
                    CSV formatı: Ev Sahibi, Deplasman, Aşama, Tarih
                  </p>
                </div>

                <div className="mb-8 grid gap-3 md:grid-cols-5">
                  <input
                    value={homeTeam}
                    onChange={(e) => setHomeTeam(e.target.value)}
                    placeholder="Ev sahibi"
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                  />

                  <input
                    value={awayTeam}
                    onChange={(e) => setAwayTeam(e.target.value)}
                    placeholder="Deplasman"
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                  />

                  <input
                    type="datetime-local"
                    value={matchTime}
                    onChange={(e) => setMatchTime(e.target.value)}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                  />

                  <input
                    value={league}
                    onChange={(e) => setLeague(e.target.value)}
                    placeholder="Aşama: Grup A / Final"
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                  />

                  <button
                    onClick={addMatch}
                    className="rounded-2xl bg-slate-950 font-black text-white"
                  >
                    Maç Ekle
                  </button>
                </div>

                <FilterButtons
                  value={matchListFilter}
                  onChange={setMatchListFilter}
                />

                <div className="space-y-3">
                  {matchListMatches.map((match) => {
                    const status = getMatchStatus(match);

                    return (
                      <div
                        key={match.id}
                        className={`rounded-2xl border bg-slate-50 p-4 ${status.borderColor}`}
                      >
                        <div className="mb-1 text-xl font-black">
                          <TeamName team={match.home_team} /> -{" "}
                          <TeamName team={match.away_team} />
                        </div>

                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-black text-slate-950">
                            {match.league || "Dünya Kupası"}
                          </span>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-black ${status.color}`}
                          >
                            {status.label}
                          </span>
                        </div>

                        <div className="grid gap-2 md:grid-cols-5">
                          <input
                            type="number"
                            placeholder={`${match.home_team} skor`}
                            value={scoreInputs[match.id]?.home || ""}
                            onChange={(e) =>
                              setScoreInputs((prev) => ({
                                ...prev,
                                [match.id]: {
                                  home: e.target.value,
                                  away: prev[match.id]?.away || "",
                                },
                              }))
                            }
                            className="rounded-xl border border-slate-200 bg-white p-3"
                          />

                          <input
                            type="number"
                            placeholder={`${match.away_team} skor`}
                            value={scoreInputs[match.id]?.away || ""}
                            onChange={(e) =>
                              setScoreInputs((prev) => ({
                                ...prev,
                                [match.id]: {
                                  home: prev[match.id]?.home || "",
                                  away: e.target.value,
                                },
                              }))
                            }
                            className="rounded-xl border border-slate-200 bg-white p-3"
                          />

                          <button
                            onClick={() => submitScore(match)}
                            className="rounded-xl bg-amber-400 py-2 font-black text-slate-950"
                          >
                            Skoru Kaydet/Düzelt
                          </button>

                          <button
                            onClick={() => updateResult(match, "X")}
                            className="rounded-xl bg-red-500 py-2 font-black text-white"
                          >
                            Sonuç X
                          </button>

                          <button
                            onClick={() => deleteMatch(match.id)}
                            className="rounded-xl bg-slate-950 py-2 font-black text-white"
                          >
                            Sil
                          </button>
                        </div>

                        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3">
                          <div className="mb-2 font-black">
                            🏆 Maça Ek Puan Ver
                          </div>

                          <div className="grid gap-2 md:grid-cols-4">
                            <select
                              value={bonusInputs[match.id]?.playerId || ""}
                              onChange={(e) =>
                                setBonusInputs((prev) => ({
                                  ...prev,
                                  [match.id]: {
                                    playerId: e.target.value,
                                    points: prev[match.id]?.points || "",
                                    reason: prev[match.id]?.reason || "",
                                  },
                                }))
                              }
                              className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                            >
                              <option value="">Oyuncu seç</option>
                              {players.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name}
                                </option>
                              ))}
                            </select>

                            <input
                              type="number"
                              placeholder="Ek puan"
                              value={bonusInputs[match.id]?.points || ""}
                              onChange={(e) =>
                                setBonusInputs((prev) => ({
                                  ...prev,
                                  [match.id]: {
                                    playerId: prev[match.id]?.playerId || "",
                                    points: e.target.value,
                                    reason: prev[match.id]?.reason || "",
                                  },
                                }))
                              }
                              className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                            />

                            <input
                              placeholder="Açıklama"
                              value={bonusInputs[match.id]?.reason || ""}
                              onChange={(e) =>
                                setBonusInputs((prev) => ({
                                  ...prev,
                                  [match.id]: {
                                    playerId: prev[match.id]?.playerId || "",
                                    points: prev[match.id]?.points || "",
                                    reason: e.target.value,
                                  },
                                }))
                              }
                              className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                            />

                            <button
                              onClick={() => addBonusToMatch(match)}
                              className="rounded-xl bg-amber-400 font-black text-slate-950"
                            >
                              Ek Puan Ver
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </section>
        )}
      </div>
    </main>
  );
}

function MatchAlertPanel({
  todayMatches,
  oneHourWarningMatches,
  notificationsEnabled,
  onEnableNotifications,
}: {
  todayMatches: Match[];
  oneHourWarningMatches: Match[];
  notificationsEnabled: boolean;
  onEnableNotifications: () => void;
}) {
  return (
    <div className="mb-6 space-y-3">
      <div className="rounded-3xl border border-blue-100 bg-blue-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-black text-blue-900">📅 Günün Maçları</div>
            <div className="text-sm font-bold text-blue-700">
              {todayMatches.length > 0
                ? `${todayMatches.length} maç bugün oynanıyor.`
                : "Bugün maç yok."}
            </div>
          </div>

          {!notificationsEnabled && (
            <button
              onClick={onEnableNotifications}
              className="rounded-2xl bg-blue-600 px-4 py-2 font-black text-white"
            >
              Bildirimleri Aç 🔔
            </button>
          )}
        </div>

        {todayMatches.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {todayMatches.slice(0, 6).map((match) => (
              <span
                key={match.id}
                className="rounded-full bg-white px-3 py-1 text-xs font-black text-blue-800"
              >
                <TeamName team={match.home_team} /> -{" "}
                <TeamName team={match.away_team} />
              </span>
            ))}
          </div>
        )}
      </div>

      {oneHourWarningMatches.length > 0 && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-4">
          <div className="font-black text-red-700">⏰ Son Çağrı</div>
          <div className="mt-1 text-sm font-bold text-red-600">
            1 saat içinde başlayacak maç var. Tahminleri kaçırma!
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {oneHourWarningMatches.map((match) => (
              <span
                key={match.id}
                className="rounded-full bg-white px-3 py-1 text-xs font-black text-red-700"
              >
                <TeamName team={match.home_team} /> -{" "}
                <TeamName team={match.away_team} />
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FilterButtons({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {MATCH_FILTERS.map((filter) => (
        <button
          key={filter}
          onClick={() => onChange(filter)}
          className={`rounded-2xl px-4 py-2 font-black transition ${
            value === filter
              ? "bg-amber-400 text-slate-950"
              : "bg-slate-100 text-slate-700 hover:bg-amber-50"
          }`}
        >
          {filter}
        </button>
      ))}
    </div>
  );
}

function StatBox({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <div className="text-xs font-bold text-slate-500">{title}</div>
      <div className="text-xl font-black text-slate-900">{value}</div>
    </div>
  );
}

function ProfileInsightCard({
  title,
  value,
  note,
}: {
  title: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <div className="text-xs font-black uppercase tracking-wide text-slate-500">
        {title}
      </div>
      <div className="mt-2 text-xl font-black text-slate-950">
        {value !== "-" ? <TeamName team={value} /> : "-"}
      </div>
      <div className="mt-1 text-sm font-bold text-amber-600">{note}</div>
    </div>
  );
}

function ScoreTable({
  sortedPlayers,
  playerStreaks,
  playerBadges,
  onProfile,
}: {
  sortedPlayers: Player[];
  playerStreaks: Record<string, number>;
  playerBadges: Record<string, string[]>;
  onProfile: (id: string) => void;
}) {
  return (
    <div className="overflow-auto">
      <table className="w-full min-w-[1100px]">
        <thead>
          <tr className="border-b border-slate-200 text-left text-slate-500">
            <th className="pb-3">#</th>
            <th className="pb-3">İsim</th>
            <th className="pb-3">Doğru</th>
            <th className="pb-3">Yanlış</th>
            <th className="pb-3">Tahmin Yok</th>
            <th className="pb-3">Ek Puan</th>
            <th className="pb-3">Puan</th>
            <th className="pb-3">Başarı</th>
            <th className="pb-3">Streak</th>
            <th className="pb-3">Rozetler</th>
            <th className="pb-3">Şampiyon</th>
          </tr>
        </thead>

        <tbody>
          {sortedPlayers.map((p, index) => (
            <tr
              key={p.id}
              className="cursor-pointer border-b border-slate-100 hover:bg-amber-50"
              onClick={() => onProfile(p.id)}
            >
              <td className="py-3 font-black">
                {index === 0
                  ? "🥇"
                  : index === 1
                    ? "🥈"
                    : index === 2
                      ? "🥉"
                      : index + 1}
              </td>
              <td className="py-3 font-black text-blue-600 underline">
                {p.name}
              </td>
              <td className="py-3 font-black text-green-600">
                {p.correct_count || 0}
              </td>
              <td className="py-3 font-black text-red-600">
                {p.wrong_count || 0}
              </td>
              <td className="py-3 font-black text-orange-500">
                {p.intentional_blank || 0}
              </td>
              <td className="py-3 font-black text-amber-600">
                {p.bonus_points || 0}
              </td>
              <td className="py-3 text-xl font-black text-blue-600">
                {p.total_points || 0}
              </td>
              <td className="py-3 font-black">%{p.success_rate || 0}</td>
              <td className="py-3 font-black">
                {(playerStreaks[p.id] || 0) >= 5
                  ? `🔥 ${playerStreaks[p.id]}`
                  : playerStreaks[p.id] || 0}
              </td>
              <td className="py-3">
                <div className="flex max-w-[220px] flex-wrap gap-1">
                  {(playerBadges[p.id] || []).slice(0, 2).map((badge) => (
                    <span
                      key={badge}
                      className="rounded-full bg-amber-100 px-2 py-1 text-xs font-black text-amber-800"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              </td>
              <td className="py-3 font-black">
                {p.champion_team ? <TeamName team={p.champion_team} /> : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
