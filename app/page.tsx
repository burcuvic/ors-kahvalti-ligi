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
  "sb_publishable_ZcaB2PBtdaBJ6blYdd4wPA_872a5OfE"
);

const ADMIN_PASSWORD = "ors2026";
const MASCOT_SRC = "/ors-mascot.png";
const DASHBOARD_HERO_SRC = "/dashboard-hero.png";

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

const MATCH_FILTERS = ["Açık", "Bugün", "Yarın", "Başlayanlar", "Biten", "Tümü"];

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


const COUNTRY_THEMES: Record<
  string,
  { card: string; glow: string; label: string; name: string }
> = {
  Türkiye: {
    card: "from-red-500 to-red-700",
    glow: "shadow-red-200",
    label: "text-red-700 bg-red-50 border-red-200",
    name: "Ay-Yıldız Ruhlu",
  },
  Brezilya: {
    card: "from-yellow-300 to-green-500",
    glow: "shadow-green-200",
    label: "text-green-700 bg-green-50 border-green-200",
    name: "Samba Tahmincisi",
  },
  Arjantin: {
    card: "from-sky-300 to-blue-500",
    glow: "shadow-sky-200",
    label: "text-sky-700 bg-sky-50 border-sky-200",
    name: "Tango Oracle",
  },
  Almanya: {
    card: "from-slate-900 to-red-600",
    glow: "shadow-slate-200",
    label: "text-slate-800 bg-slate-50 border-slate-200",
    name: "Panzer Disiplini",
  },
  Fransa: {
    card: "from-blue-700 to-red-500",
    glow: "shadow-blue-200",
    label: "text-blue-700 bg-blue-50 border-blue-200",
    name: "Horoz Modu",
  },
  İngiltere: {
    card: "from-red-500 to-slate-100",
    glow: "shadow-red-100",
    label: "text-red-700 bg-red-50 border-red-200",
    name: "It’s Coming Home",
  },
  İspanya: {
    card: "from-red-500 to-yellow-400",
    glow: "shadow-yellow-200",
    label: "text-red-700 bg-yellow-50 border-yellow-200",
    name: "La Roja",
  },
  Hollanda: {
    card: "from-orange-400 to-orange-600",
    glow: "shadow-orange-200",
    label: "text-orange-700 bg-orange-50 border-orange-200",
    name: "Portakal Gücü",
  },
  Portekiz: {
    card: "from-red-600 to-green-600",
    glow: "shadow-green-200",
    label: "text-green-700 bg-green-50 border-green-200",
    name: "Seleção das Quinas",
  },
  Japonya: {
    card: "from-white to-red-400",
    glow: "shadow-red-100",
    label: "text-red-700 bg-red-50 border-red-200",
    name: "Samuray Tahminci",
  },
  Meksika: {
    card: "from-green-500 to-red-500",
    glow: "shadow-green-200",
    label: "text-green-700 bg-green-50 border-green-200",
    name: "El Tri Enerjisi",
  },
  Fas: {
    card: "from-red-600 to-emerald-500",
    glow: "shadow-red-200",
    label: "text-red-700 bg-red-50 border-red-200",
    name: "Atlas Aslanı",
  },
};

function getCountryTheme(team?: string | null) {
  if (!team) {
    return {
      card: "from-amber-300 to-orange-300",
      glow: "shadow-amber-100",
      label: "text-amber-700 bg-amber-50 border-amber-200",
      name: "Tarafsız Kuş",
    };
  }

  return (
    COUNTRY_THEMES[team] || {
      card: "from-amber-300 to-orange-300",
      glow: "shadow-amber-100",
      label: "text-amber-700 bg-amber-50 border-amber-200",
      name: "Sürpriz Takımcı",
    }
  );
}

function ProfileMascotCard({
  player,
  rank,
  streak,
}: {
  player: Player;
  rank: number;
  streak: number;
}) {
  const theme = getCountryTheme(player.champion_team);

  return (
    <div
      className={`relative mb-6 overflow-hidden rounded-[2rem] bg-gradient-to-br ${theme.card} p-4 text-slate-950 shadow-2xl md:p-6 ${theme.glow}`}
    >
      <div className="absolute -right-10 -top-12 h-56 w-56 rounded-full bg-white/25" />
      <div className="absolute -bottom-20 left-8 h-48 w-48 rounded-full bg-white/20" />
      <div className="absolute right-8 bottom-8 hidden text-8xl opacity-20 md:block">🏆</div>

      <div className="relative flex flex-wrap items-center justify-between gap-6">
        <div className="flex flex-wrap items-center gap-5">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-white/50 blur-2xl" />
            <img
              src={MASCOT_SRC}
              alt="ORS maskotu"
              className="relative h-40 w-40 object-contain drop-shadow-2xl md:h-64 md:w-64"
            />
          </div>

          <div>
            <div className="text-sm font-black uppercase tracking-wide opacity-75">
              Oyuncu Kartı
            </div>

            <div className="text-3xl font-black leading-none md:text-4xl">
              {player.name}
            </div>

            <div className="mt-3 text-sm font-black uppercase tracking-wide opacity-70">
              {theme.name}
            </div>

            <div className="mt-3 text-xl font-black">
              {player.champion_team ? (
                <TeamName team={player.champion_team} />
              ) : (
                "Şampiyon seçilmedi"
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/50 bg-white/45 px-3 py-1 text-xs font-black">
                👑 #{rank} sıra
              </span>

              <span className="rounded-full border border-white/50 bg-white/45 px-3 py-1 text-xs font-black">
                🔥 {streak || 0} maç streak
              </span>

              <span className="rounded-full border border-white/50 bg-white/45 px-3 py-1 text-xs font-black">
                🏆 {player.champion_team || "Tarafsız"}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-white/50 bg-white/40 p-5 text-right backdrop-blur">
          <div className="text-sm font-black uppercase opacity-70">Toplam Puan</div>
          <div className="text-5xl font-black md:text-6xl">{player.total_points || 0}</div>
          <div className="mt-1 text-xs font-black opacity-70">
            Başarı %{player.success_rate || 0}
          </div>
        </div>
      </div>
    </div>
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
      borderColor: "border-amber-100",
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
function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Zaten yüklü mü kontrol et
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    const isIOSStandalone = (window.navigator as any).standalone === true;
    if (isStandalone || isIOSStandalone) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);

    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) {
      // iOS Safari için manuel talimat
      alert(
        "📱 Uygulamayı yüklemek için:\n\n1. Safari'de paylaş ikonuna bas (kare + yukarı ok)\n2. Aşağı kaydır\n3. 'Ana Ekrana Ekle' seçeneğine bas"
      );
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  // iOS detect (Chrome iOS dahil — onlar da install prompt göstermez)
  const isIOS =
    typeof window !== "undefined" &&
    /iPad|iPhone|iPod/.test(window.navigator.userAgent);

  return {
    canInstall: !isInstalled && (!!deferredPrompt || isIOS),
    isInstalled,
    promptInstall,
  };
}

export default function Home() {
  const { canInstall, promptInstall } = useInstallPrompt();
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [bonusLogs, setBonusLogs] = useState<BonusLog[]>([]);

  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [loginName, setLoginName] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const [selectedStage, setSelectedStage] = useState("Tümü");
  const [predictionFilter, setPredictionFilter] = useState("Açık");
  const [matchListFilter, setMatchListFilter] = useState("Tümü");

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

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;

    setNotificationsEnabled(Notification.permission === "granted");
  }, []);

  useEffect(() => {
    if (!currentPlayer) return;
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    const checkUpcomingMatches = () => {
      const now = Date.now();
      const notifiedRaw = localStorage.getItem("ors_notified_matches");
      let notified: string[] = [];

      try {
        notified = notifiedRaw ? JSON.parse(notifiedRaw) : [];
      } catch (error) {
        notified = [];
        localStorage.removeItem("ors_notified_matches");
      }

      matches.forEach((match) => {
        if (match.result) return;

        const matchTime = new Date(match.match_time).getTime();
        const diffMinutes = (matchTime - now) / (1000 * 60);

        const alreadyPredicted = predictions.some(
          (p) => p.player_id === currentPlayer.id && p.match_id === match.id
        );

        const notificationKey = `${currentPlayer.id}-${match.id}`;

        if (
          diffMinutes > 0 &&
          diffMinutes <= 60 &&
          !alreadyPredicted &&
          !notified.includes(notificationKey)
        ) {
          new Notification("⏰ Maça 1 saatten az kaldı!", {
            body: `${match.home_team} - ${match.away_team} için tahminini yapmayı unutma ⚽`,
            icon: "/ors-mascot.png",
          });

          const updated = [...notified, notificationKey];
          localStorage.setItem("ors_notified_matches", JSON.stringify(updated));
        }
      });
    };

    checkUpcomingMatches();
    const timer = window.setInterval(checkUpcomingMatches, 60 * 1000);

    return () => window.clearInterval(timer);
  }, [matches, predictions, currentPlayer]);

  const enableNotifications = async () => {
    if (typeof window === "undefined") return;

    if (!("Notification" in window)) {
      alert("Bu tarayıcı bildirim desteklemiyor 😢");
      return;
    }

    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      setNotificationsEnabled(true);

      new Notification("ORS bildirimleri açıldı 🐦", {
        body: "Maça 1 saat kala seni uyaracağım ⚽",
        icon: "/ors-mascot.png",
      });
    } else {
      setNotificationsEnabled(false);
      alert("Bildirim izni verilmedi 😄");
    }
  };

  const login = () => {
    const player = players.find(
      (p) => p.name.toLowerCase() === loginName.trim().toLowerCase()
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
    if (selectedStage === "Tümü") {
      return matches;
    }

    if (selectedStage === "Gruplar") {
      return matches.filter((m) => m.league?.startsWith("Grup"));
    }

    if (selectedStage === "Eleme") {
      return matches.filter((m) =>
        [
          "Son 32",
          "Son 16",
          "Çeyrek Final",
          "Yarı Final",
          "Üçüncülük",
          "Final",
        ].includes(m.league || "")
      );
    }

    if (selectedStage === "Final Haftası") {
      return matches.filter((m) =>
        ["Yarı Final", "Üçüncülük", "Final"].includes(m.league || "")
      );
    }

    return matches;
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
      if (filter === "Biten") return isFinished;
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

  const sortedPlayers = useMemo(() => {
    return [...players].sort(
      (a, b) => Number(b.total_points || 0) - Number(a.total_points || 0)
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

  const getPointsByPlayer = (matchList: Match[], ascending = false) => {
    const data = players.map((player) => {
      const points = matchList.reduce((sum, match) => {
        const pred = predictions.find(
          (p) => p.player_id === player.id && p.match_id === match.id
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
        : b.period_points - a.period_points
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
            (p) => p.player_id === player.id && p.match_id === match.id
          );

          const bonus = bonusLogs
            .filter(
              (b) => b.player_id === player.id && b.match_id === match.id
            )
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
          (p) => p.player_id === profilePlayer.id && p.match_id === match.id
        );

        const bonus = bonusLogs
          .filter(
            (b) => b.player_id === profilePlayer.id && b.match_id === match.id
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
      (p) => p.match_id === matchId && p.prediction !== "YOK"
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
      { onConflict: "player_id,match_id" }
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
          b.reason === `Şampiyon tahmini: ${championWinner}`
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
    overrideResult?: string
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
        (p) => p.player_id === player.id
      );

      let correct = 0;
      let wrong = 0;
      let blank = 0;
      let predictionPoints = 0;

      for (const pred of playerPredictions) {
        const predMatch = matches.find((m) => m.id === pred.match_id);
        const finalResult =
          pred.match_id === overrideMatchId ? overrideResult : predMatch?.result;

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

        await supabase
          .from("predictions")
          .update({ points })
          .eq("id", pred.id);
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
        (p) => p.player_id === player.id && p.match_id === match.id
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
    awayScore?: number
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
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#FFF7E8] p-4 text-slate-900">
        <div className="pointer-events-none fixed left-[-8rem] top-[-8rem] h-80 w-80 rounded-full bg-amber-300/40 blur-3xl" />
        <div className="pointer-events-none fixed right-[-8rem] bottom-[-8rem] h-80 w-80 rounded-full bg-red-300/30 blur-3xl" />
        <div className="relative w-full max-w-md overflow-hidden rounded-[2rem] border-4 border-red-100 bg-white p-8 shadow-2xl shadow-red-100">
          <div className="mb-4 flex justify-center"><img src={MASCOT_SRC} alt="ORS maskotu" className="h-44 w-44 rounded-full object-contain drop-shadow-xl" /></div>

          <h1 className="text-center text-2xl font-black">ORS Kahvaltı Ligi</h1>

          <p className="mb-6 text-center font-bold text-red-500">
            Dünya Kupası Edition
          </p>

          <input
            value={loginName}
            onChange={(e) => setLoginName(e.target.value)}
            placeholder="Kullanıcı adını gir"
            className="mb-4 w-full rounded-2xl border border-amber-100 bg-amber-50/40 p-4 outline-none"
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

  const showStageFilter = activeTab === "tahmin" || activeTab === "maclar";

  return (
    <main className="relative min-h-screen bg-[#FFF7E8] text-slate-900">
      <div className="pointer-events-none fixed left-[-10rem] top-[-10rem] h-96 w-96 rounded-full bg-amber-300/40 blur-3xl" />
      <div className="pointer-events-none fixed right-[-12rem] top-32 h-[28rem] w-[28rem] rounded-full bg-red-300/30 blur-3xl" />
      <div className="pointer-events-none fixed bottom-[-12rem] left-1/3 h-[24rem] w-[24rem] rounded-full bg-orange-200/50 blur-3xl" />

      {/* KOMPAKT STICKY HEADER */}
      <header className="sticky top-0 z-30 border-b border-red-100 bg-white/90 shadow-sm backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-3">
          {/* Üst satır: Logo + İsim + Butonlar */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <img
                src={MASCOT_SRC}
                alt="ORS"
                className="h-10 w-10 shrink-0 rounded-full bg-amber-100 object-contain p-1 shadow-sm md:h-12 md:w-12"
              />
              <div className="min-w-0">
                <div className="truncate text-base font-black leading-tight md:text-lg">
                  ORS Kahvaltı Ligi <span className="text-red-500">🏆</span>
                </div>
                <div className="truncate text-xs font-bold text-slate-500">
                  Hoş geldin{" "}
                  <span className="text-slate-900">{currentPlayer.name}</span>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={enableNotifications}
                title={
                  notificationsEnabled
                    ? "Bildirimler açık"
                    : "Bildirimleri aç"
                }
                className={`rounded-full p-2 text-lg transition ${
                  notificationsEnabled
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-600 hover:bg-red-200"
                }`}
              >
                {notificationsEnabled ? "🔔" : "🔕"}
              </button>

              <button
                onClick={logout}
                className="rounded-full bg-red-500 px-3 py-2 text-xs font-black text-white shadow-md shadow-red-200 md:px-4 md:text-sm"
              >
                Çıkış
              </button>
            </div>
          </div>

          {/* Tab Şeridi - sadece desktop */}
          <div className="mt-3 hidden gap-2 overflow-x-auto md:flex">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`shrink-0 rounded-xl px-4 py-2 text-sm font-black transition ${
                  activeTab === tab
                    ? "bg-red-500 text-white shadow-md shadow-red-200"
                    : "bg-amber-50 text-slate-700 hover:bg-amber-100"
                }`}
              >
                {tab === "dashboard" && "🏠 Dashboard"}
                {tab === "tahmin" && "🎯 Tahmin Yap"}
                {tab === "maclar" && "⚽ Maçlar"}
                {tab === "profil" && "👤 Profil"}
                {tab === "admin" && "👑 Admin"}
              </button>
            ))}
          </div>

          {/* Aşama Filtresi - sadece tahmin ve maçlarda */}
          {showStageFilter && (
            <div className="mt-3">
              <StageFilter
                selectedStage={selectedStage}
                setSelectedStage={setSelectedStage}
              />
            </div>
          )}
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-4 pb-28 md:py-6">
        <TodayMiniPanel matches={matches} />

        {activeTab === "dashboard" && (
          <section className="rounded-[1.75rem] border-4 border-red-50 bg-white p-4 shadow-2xl shadow-red-100/70 md:rounded-[2rem] md:p-6">
            <h2 className="mb-6 text-xl font-black">🏆 Dashboard</h2>
            {canInstall && (
  <button
    onClick={promptInstall}
    className="mb-4 inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-black text-red-600 transition hover:bg-red-100"
  >
    📱 Uygulama olarak yükle
  </button>
)}

            <DashboardHero leaderName={sortedPlayers[0]?.name || "-"} />

            <MatchdayBanner matches={matches} />

            <div className="mb-6 grid gap-3 md:grid-cols-3">
              <MiniDashboardCard
                icon="👑"
                title="Genel Lider"
                value={sortedPlayers[0]?.name || "-"}
                note={`${sortedPlayers[0]?.total_points || 0} puan`}
                tone="amber"
              />

              <MiniDashboardCard
                icon="🥯"
                title="Kahvaltı Hattı"
                value={
                  stageScores
                    .slice(0, 2)
                    .map((p) => p.name)
                    .join(" • ") || "-"
                }
                note="Bu aşamada riskli bölge"
                tone="red"
              />

              <MiniDashboardCard
                icon="⚽"
                title="Açık Maç"
                value={String(openMatchesCount)}
                note="Tahmin için hazır"
                tone="blue"
              />
            </div>

            <ActivityFeed
              players={players}
              matches={matches}
              predictions={predictions}
              bonusLogs={bonusLogs}
            />

            <ScoreTable
              sortedPlayers={sortedPlayers}
              playerStreaks={playerStreaks}
              onProfile={(id) => {
                setProfilePlayerId(id);
                setActiveTab("profil");
              }}
            />
          </section>
        )}

        {activeTab === "tahmin" && (
          <section className="rounded-[1.75rem] border-4 border-red-50 bg-white p-4 shadow-2xl shadow-red-100/70 md:rounded-[2rem] md:p-6">
            <h2 className="mb-6 text-xl font-black">🎯 Tahmin Yap</h2>

            <NotificationInfoCard
              notificationsEnabled={notificationsEnabled}
              enableNotifications={enableNotifications}
            />

            <ChampionPredictionCard
              currentPlayer={currentPlayer}
              tournamentTeams={tournamentTeams}
              championPickLocked={championPickLocked}
              saveChampionPick={saveChampionPick}
            />

            <FilterButtons
              value={predictionFilter}
              onChange={setPredictionFilter}
            />

            {predictionMatches.length === 0 && (
              <div className="rounded-[1.75rem] bg-amber-50 p-6 text-slate-600">
                Bu filtrede maç yok 😄
              </div>
            )}

            <div className="space-y-4">
              {predictionMatches.map((match) => {
                const myPrediction = predictions.find(
                  (p) =>
                    p.match_id === match.id && p.player_id === currentPlayer.id
                );

                const consensus = getConsensus(match.id);
                const isStarted =
                  new Date(match.match_time).getTime() <= Date.now();
                const status = getMatchStatus(match);

                return (
                  <div
                    key={match.id}
                    className={`rounded-3xl border bg-amber-50/40 p-4 transition hover:scale-[1.01] hover:shadow-lg ${status.borderColor}`}
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

                    <div className="my-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-center md:my-4">
                      <div className="text-xl font-black">
                        <TeamName team={match.home_team} />
                      </div>
                      <div className="font-black text-red-500">⚔️</div>
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
                            className={`rounded-2xl py-3 text-lg font-black md:py-3 md:text-base ${
                              myPrediction?.prediction === v
                                ? "bg-amber-400 text-slate-950"
                                : "border border-amber-100 bg-white hover:bg-amber-100"
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
                      <div className="mt-4 rounded-2xl border border-amber-100 bg-white p-4">
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
          <section className="rounded-[1.75rem] border-4 border-red-50 bg-white p-4 shadow-2xl shadow-red-100/70 md:rounded-[2rem] md:p-6">
            <h2 className="mb-6 text-xl font-black">⚽ Maçlar</h2>

            <FilterButtons
              value={matchListFilter}
              onChange={setMatchListFilter}
            />

            <div className="space-y-4">
              {matchListMatches.map((match) => {
                const matchBonuses = bonusLogs.filter(
                  (b) => b.match_id === match.id
                );
                const status = getMatchStatus(match);
                const isStarted =
                  new Date(match.match_time).getTime() <= Date.now();

                return (
                  <div
                    key={match.id}
                    className={`rounded-3xl border bg-amber-50/40 p-4 transition hover:scale-[1.01] hover:shadow-lg ${status.borderColor}`}
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
                            p.match_id === match.id
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
                            (p) => p.id === bonus.player_id
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
          <section className="rounded-[1.75rem] border-4 border-red-50 bg-white p-4 shadow-2xl shadow-red-100/70 md:rounded-[2rem] md:p-6">
            <h2 className="mb-6 text-xl font-black">👤 Profil</h2>

            <div className="mb-6 flex flex-wrap items-center gap-3">
              <span className="font-bold text-slate-500">Oyuncu:</span>
              <select
                value={profilePlayerId}
                onChange={(e) => setProfilePlayerId(e.target.value)}
                className="rounded-2xl border border-amber-100 bg-amber-50/40 p-3 font-black"
              >
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {p.id === currentPlayer.id ? " (sen)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <ProfileMascotCard
              player={profilePlayer}
              rank={
                sortedPlayers.findIndex((p) => p.id === profilePlayer.id) + 1
              }
              streak={playerStreaks[profilePlayer.id] || 0}
            />

            <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
              <StatBox title="PUAN" value={profilePlayer.total_points || 0} />
              <StatBox
                title="DOĞRU"
                value={profilePlayer.correct_count || 0}
              />
              <StatBox
                title="YANLIŞ"
                value={profilePlayer.wrong_count || 0}
              />
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

            <BadgeShowcase
              player={profilePlayer}
              rank={
                sortedPlayers.findIndex((p) => p.id === profilePlayer.id) + 1
              }
              streak={playerStreaks[profilePlayer.id] || 0}
              players={players}
            />

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
                note={`${
                  profileTeamStats?.mostTrustedTeam?.picked || 0
                } kez seçti`}
              />

              <ProfileInsightCard
                title="En İyi Olduğu Aşama"
                value={String(profileBestStage?.stage || "-")}
                note={`${profileBestStage?.points || 0} puan`}
              />
            </div>

            <div className="mb-6 rounded-[1.75rem] border border-amber-100 bg-amber-50/50 p-5">
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

            <div className="rounded-[1.75rem] border border-amber-100 bg-amber-50/50 p-5">
              <h3 className="mb-4 text-xl font-black">📜 Son 10 Tahmin</h3>

              <div className="space-y-2">
                {profilePredictions.slice(0, 10).map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-100 bg-white p-3"
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
          <section className="rounded-[1.75rem] border-4 border-red-50 bg-white p-4 shadow-2xl shadow-red-100/70 md:rounded-[2rem] md:p-6">
            <h2 className="mb-6 text-xl font-black">👑 Admin Paneli</h2>

            {!adminUnlocked ? (
              <div className="max-w-md rounded-[1.75rem] border border-amber-100 bg-amber-50/50 p-5">
                <h3 className="mb-3 text-xl font-black">Admin Şifresi</h3>

                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Admin şifresi"
                  className="mb-3 w-full rounded-2xl border border-amber-100 bg-white p-3"
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

                <div className="mb-6 rounded-[1.75rem] border border-amber-100 bg-amber-50/50 p-5">
                  <h3 className="mb-4 text-xl font-black">
                    📂 Toplu Maç Yükle
                  </h3>

                  <input
                    type="file"
                    accept=".csv"
                    onChange={importWeeklyExcel}
                    className="w-full rounded-2xl border border-amber-100 bg-white p-3"
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
                    className="rounded-2xl border border-amber-100 bg-amber-50/40 p-3"
                  />

                  <input
                    value={awayTeam}
                    onChange={(e) => setAwayTeam(e.target.value)}
                    placeholder="Deplasman"
                    className="rounded-2xl border border-amber-100 bg-amber-50/40 p-3"
                  />

                  <input
                    type="datetime-local"
                    value={matchTime}
                    onChange={(e) => setMatchTime(e.target.value)}
                    className="rounded-2xl border border-amber-100 bg-amber-50/40 p-3"
                  />

                  <input
                    value={league}
                    onChange={(e) => setLeague(e.target.value)}
                    placeholder="Aşama: Grup A / Final"
                    className="rounded-2xl border border-amber-100 bg-amber-50/40 p-3"
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
                        className={`rounded-2xl border bg-amber-50/40 p-4 ${status.borderColor}`}
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
                            className="rounded-xl border border-amber-100 bg-white p-3"
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
                            className="rounded-xl border border-amber-100 bg-white p-3"
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

                        <div className="mt-4 rounded-2xl border border-amber-100 bg-white p-3">
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
                              className="rounded-xl border border-amber-100 bg-amber-50/40 p-3"
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
                                    playerId:
                                      prev[match.id]?.playerId || "",
                                    points: e.target.value,
                                    reason: prev[match.id]?.reason || "",
                                  },
                                }))
                              }
                              className="rounded-xl border border-amber-100 bg-amber-50/40 p-3"
                            />

                            <input
                              placeholder="Açıklama"
                              value={bonusInputs[match.id]?.reason || ""}
                              onChange={(e) =>
                                setBonusInputs((prev) => ({
                                  ...prev,
                                  [match.id]: {
                                    playerId:
                                      prev[match.id]?.playerId || "",
                                    points: prev[match.id]?.points || "",
                                    reason: e.target.value,
                                  },
                                }))
                              }
                              className="rounded-xl border border-amber-100 bg-amber-50/40 p-3"
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

      <FloatingMascot
        text={`Bugün ${
          applyTimeFilter(matches, "Bugün").length
        } maç var. Tahminleri kaçırma 😄`}
      />
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAdmin={!!currentPlayer.is_admin}
      />
      <div className="mt-4 flex items-center justify-center gap-1 text-m font-black text-slate-800">
        <span></span>
        <span>crafted by burcuvic</span>
        <span>2026</span>
      </div>
    </main>
  );
}

function MascotEmpty({ text }: { text: string }) {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-[1.75rem] border border-amber-100 bg-amber-50 p-5 text-slate-700">
      <img
        src={MASCOT_SRC}
        alt="ORS maskotu"
        className="h-28 w-28 object-contain drop-shadow-lg"
      />
      <div>
        <div className="text-lg font-black">Maskot diyor ki:</div>
        <div className="font-bold">{text}</div>
      </div>
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
    <div className="mb-6 flex gap-2 overflow-x-auto pb-1 md:flex-wrap">
      {MATCH_FILTERS.map((filter) => (
        <button
          key={filter}
          onClick={() => onChange(filter)}
          className={`shrink-0 rounded-2xl px-4 py-2 font-black transition ${
            value === filter
              ? "bg-red-500 text-white shadow-lg shadow-red-200"
              : "bg-amber-50 text-slate-700 hover:bg-amber-100"
          }`}
        >
          {filter}
        </button>
      ))}
    </div>
  );
}

function getPlayerBadges({
  player,
  rank,
  streak,
  players,
}: {
  player: Player;
  rank: number;
  streak: number;
  players: Player[];
}) {
  const maxBlank = Math.max(
    ...players.map((p) => Number(p.intentional_blank || 0)),
    0
  );
  const maxBonus = Math.max(
    ...players.map((p) => Number(p.bonus_points || 0)),
    0
  );

  const badges: { icon: string; title: string; note: string; color: string }[] =
    [];

  if (rank === 1) {
    badges.push({
      icon: "👑",
      title: "Lider",
      note: "Zirvede geziyor",
      color: "bg-amber-100 text-amber-800 border-amber-200",
    });
  }

  if (streak >= 5) {
    badges.push({
      icon: "🔥",
      title: "Alev Adam",
      note: `${streak} maçlık seri`,
      color: "bg-red-100 text-red-700 border-red-200",
    });
  } else if (streak >= 3) {
    badges.push({
      icon: "⚡",
      title: "Formda",
      note: `${streak} maçlık seri`,
      color: "bg-orange-100 text-orange-700 border-orange-200",
    });
  }

  if (Number(player.success_rate || 0) >= 70) {
    badges.push({
      icon: "🧠",
      title: "Oracle",
      note: "Tahmin gücü yüksek",
      color: "bg-purple-100 text-purple-700 border-purple-200",
    });
  }

  if (Number(player.intentional_blank || 0) === maxBlank && maxBlank > 0) {
    badges.push({
      icon: "🥯",
      title: "Kahvaltıdan Kaçan",
      note: `${maxBlank} maç kaçırdı`,
      color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    });
  }

  if (Number(player.bonus_points || 0) === maxBonus && maxBonus > 0) {
    badges.push({
      icon: "🎁",
      title: "Bonus Avcısı",
      note: `${maxBonus} ek puan`,
      color: "bg-green-100 text-green-700 border-green-200",
    });
  }

  if (badges.length === 0) {
    badges.push({
      icon: "🐣",
      title: "Isınıyor",
      note: "Büyük patlama bekleniyor",
      color: "bg-slate-100 text-slate-700 border-slate-200",
    });
  }

  return badges.slice(0, 5);
}

function BadgeShowcase({
  player,
  rank,
  streak,
  players,
}: {
  player: Player;
  rank: number;
  streak: number;
  players: Player[];
}) {
  const badges = getPlayerBadges({ player, rank, streak, players });

  return (
    <div className="mb-6 rounded-[2rem] border border-amber-100 bg-white p-5 shadow-xl shadow-red-100/50">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-xl font-black">🏅 Rozet Vitrini</h3>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">
          {badges.length} rozet
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {badges.map((badge) => (
          <div
            key={badge.title}
            className={`rounded-[1.5rem] border p-4 ${badge.color}`}
          >
            <div className="text-3xl">{badge.icon}</div>
            <div className="mt-2 text-lg font-black">{badge.title}</div>
            <div className="text-sm font-bold opacity-80">{badge.note}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivityFeed({
  players,
  matches,
  predictions,
  bonusLogs,
}: {
  players: Player[];
  matches: Match[];
  predictions: Prediction[];
  bonusLogs: BonusLog[];
}) {
  const feed = useMemo(() => {
    const predictionItems = predictions
      .map((prediction) => {
        const player = players.find((p) => p.id === prediction.player_id);
        const match = matches.find((m) => m.id === prediction.match_id);
        if (!player || !match) return null;

        return {
          id: `p-${prediction.id}`,
          time: new Date(match.match_time).getTime(),
          icon:
            prediction.points > 0
              ? "✅"
              : prediction.points < 0
              ? "🥯"
              : "🎯",
          title:
            prediction.points > 0
              ? `${player.name} doğru bildi`
              : prediction.points < 0
              ? `${player.name} puan kaybetti`
              : `${player.name} tahmin yaptı`,
          detail: `${match.home_team} - ${match.away_team} • ${prediction.prediction}`,
          score: prediction.points,
        };
      })
      .filter(Boolean);

    const bonusItems = bonusLogs
      .slice(0, 20)
      .map((bonus) => {
        const player = players.find((p) => p.id === bonus.player_id);
        if (!player) return null;

        return {
          id: `b-${bonus.id}`,
          time: new Date(bonus.created_at).getTime(),
          icon: "🎁",
          title: `${player.name} bonus aldı`,
          detail: bonus.reason || "Ek puan",
          score: bonus.points,
        };
      })
      .filter(Boolean);

    return [...predictionItems, ...bonusItems]
      .sort((a: any, b: any) => b.time - a.time)
      .slice(0, 8);
  }, [players, matches, predictions, bonusLogs]);

  if (feed.length === 0) {
    return (
      <MascotEmpty text="Henüz hareket yok. İlk tahmini yapan tarihe geçer 😄" />
    );
  }

  return (
    <div className="mb-6 rounded-[2rem] border border-amber-100 bg-white p-5 shadow-xl shadow-red-100/50">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-xl font-black">📣 Son Hareketler</h3>
        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-600">
          Canlı feed
        </span>
      </div>

      <div className="space-y-2">
        {feed.map((item: any) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-3 rounded-[1.25rem] bg-amber-50/60 p-3"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl shadow-sm">
                {item.icon}
              </div>
              <div>
                <div className="font-black">{item.title}</div>
                <div className="text-xs font-bold text-slate-500">
                  {item.detail}
                </div>
              </div>
            </div>

            <div
              className={`rounded-full px-3 py-1 text-sm font-black ${
                Number(item.score || 0) > 0
                  ? "bg-green-100 text-green-700"
                  : Number(item.score || 0) < 0
                  ? "bg-red-100 text-red-700"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {Number(item.score || 0) > 0 ? "+" : ""}
              {item.score || 0}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MatchdayBanner({ matches }: { matches: Match[] }) {
  const todayMatches = matches
    .filter((match) => {
      const now = new Date();
      const matchDate = new Date(match.match_time);
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      return matchDate >= today && matchDate < tomorrow;
    })
    .sort(
      (a, b) =>
        new Date(a.match_time).getTime() - new Date(b.match_time).getTime()
    );

  if (todayMatches.length === 0) return null;

  const firstMatch = todayMatches[0];

  return (
    <div className="mb-6 overflow-hidden rounded-[1.75rem] border-2 border-orange-200 bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 p-[2px] shadow-xl shadow-orange-100">
      <div className="rounded-[1.6rem] bg-white p-4 md:p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-red-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-red-600">
              🔥 Matchday
            </div>

            <h3 className="text-2xl font-black text-slate-950">
              Bugün {todayMatches.length} maç var
            </h3>

            <p className="mt-1 font-bold text-slate-500">
              İlk maç:{" "}
              <span className="text-red-500">
                {firstMatch.home_team} vs {firstMatch.away_team}
              </span>
            </p>
          </div>

          <div className="hidden text-6xl md:block">⚽🔥</div>
        </div>
      </div>
    </div>
  );
}

function MiniDashboardCard({
  icon,
  title,
  value,
  note,
  tone,
}: {
  icon: string;
  title: string;
  value: string;
  note: string;
  tone: "amber" | "red" | "blue";
}) {
  const styles = {
    amber: "bg-gradient-to-br from-amber-300 to-orange-300 shadow-amber-100",
    red: "bg-red-50 shadow-red-50",
    blue: "bg-blue-50 shadow-blue-50",
  };

  return (
    <div className={`rounded-[1.5rem] p-4 shadow-lg ${styles[tone]}`}>
      <div className="text-3xl">{icon}</div>
      <div className="mt-3 text-sm font-black uppercase tracking-wide text-slate-500">
        {title}
      </div>
      <div className="mt-1 truncate text-xl font-black text-slate-950">
        {value}
      </div>
      <div className="mt-1 text-xs font-bold text-slate-500">{note}</div>
    </div>
  );
}

function NotificationInfoCard({
  notificationsEnabled,
  enableNotifications,
}: {
  notificationsEnabled: boolean;
  enableNotifications: () => void;
}) {
  return (
    <div className="mb-6 rounded-[1.75rem] border border-red-100 bg-white p-4 shadow-xl shadow-red-100/50">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-sm font-black uppercase tracking-wide text-red-500">
            Maç Hatırlatıcısı
          </div>
          <div className="mt-1 text-xl font-black text-slate-950">
            Maça 1 saat kala uyarayım mı?
          </div>
          <div className="mt-1 text-sm font-bold text-slate-500">
            Site açıkken tahmin yapmadığın maçlar için bildirim gönderirim ⚽
          </div>
        </div>

        <button
          onClick={enableNotifications}
          className={`rounded-2xl px-4 py-3 font-black transition ${
            notificationsEnabled
              ? "bg-green-100 text-green-700"
              : "bg-red-500 text-white shadow-lg shadow-red-200"
          }`}
        >
          {notificationsEnabled ? "🔔 Açık" : "🔔 Bildirim Aç"}
        </button>
      </div>
    </div>
  );
}

function ChampionPredictionCard({
  currentPlayer,
  tournamentTeams,
  championPickLocked,
  saveChampionPick,
}: {
  currentPlayer: Player;
  tournamentTeams: string[];
  championPickLocked: boolean;
  saveChampionPick: (team: string) => void;
}) {
  const selectedTeam = currentPlayer.champion_team || "";
  const selectedTheme = getCountryTheme(selectedTeam);

  return (
    <div
      className={`mb-6 overflow-hidden rounded-[2rem] border-4 border-red-50 bg-gradient-to-br ${selectedTheme.card} p-[2px] shadow-2xl ${selectedTheme.glow}`}
    >
      <div className="relative overflow-hidden rounded-[1.85rem] bg-white/85 p-5 backdrop-blur md:p-6">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-amber-200/40" />
        <div className="absolute right-5 top-5 hidden text-7xl opacity-20 md:block">
          🏆
        </div>

        <div className="relative grid gap-5 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <div>
            <div className="mb-2 inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-red-600">
              Turnuva Tahmini
            </div>

            <h3 className="text-2xl font-black text-slate-950 md:text-3xl">
              Şampiyonunu seç, +100 puanı kovala
            </h3>

            <p className="mt-2 font-bold text-slate-500">
              Bu tahmin turnuva başlamadan kilitlenir. Doğru ülkeyi seçersen
              finalde büyük kahvaltı bonusu gelir 😍
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <select
                value={selectedTeam}
                disabled={championPickLocked}
                onChange={(e) => saveChampionPick(e.target.value)}
                className="min-w-[220px] rounded-2xl border border-amber-200 bg-white p-3 font-black text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                <option value="">Şampiyon ülke seç</option>
                {tournamentTeams.map((team) => (
                  <option key={team} value={team}>
                    {team}
                  </option>
                ))}
              </select>

              <span className="rounded-full bg-amber-100 px-3 py-2 text-sm font-black text-amber-700">
                {championPickLocked
                  ? "🔒 Şampiyon tahminleri kilitlendi"
                  : "⏳ Kilitlenme: 11 Haziran 19:00"}
              </span>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/70 bg-white/60 p-4 shadow-xl">
            <div className="text-xs font-black uppercase tracking-wide text-slate-500">
              Seçili Şampiyon
            </div>

            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-3xl">
                🏆
              </div>

              <div>
                <div className="text-2xl font-black text-slate-950">
                  {selectedTeam ? (
                    <TeamName team={selectedTeam} />
                  ) : (
                    "Henüz yok"
                  )}
                </div>
                <div className="mt-1 text-sm font-bold text-slate-500">
                  {selectedTeam
                    ? `${selectedTheme.name} modu`
                    : "Bir ülke seç"}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-black text-red-600">
              Doğru çıkarsa +100 puan 😎
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardHero({ leaderName }: { leaderName: string }) {
  return (
    <div className="mb-6 overflow-hidden rounded-[1.75rem] border-4 border-red-50 bg-white shadow-xl shadow-red-100/60">
      <div className="grid items-center md:grid-cols-[1.25fr_0.75fr]">
        <div className="p-4 md:p-6">
          <div className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-red-600">
            Ana Sayfa
          </div>

          <h3 className="mt-4 text-3xl font-black leading-tight text-slate-950 md:text-4xl">
            ORS World Cup Arenasına Hoş Geldin
          </h3>

          <p className="mt-3 max-w-xl font-bold text-slate-500">
            Tahminlerini yap, puanları topla ve arkadaşlarını geç. Dünya
            Kupası heyecanı ORS Kahvaltı Ligi’nde başladı ⚽🔥
          </p>
        </div>

        <div className="relative flex min-h-[180px] items-center justify-center overflow-hidden md:min-h-[240px]">
          <img
            src={DASHBOARD_HERO_SRC}
            alt="ORS lider maskotu"
            className="mx-auto h-[72%] w-[72%] object-contain object-center drop-shadow-2xl"
          />
        </div>
      </div>
    </div>
  );
}

function StageFilter({
  selectedStage,
  setSelectedStage,
}: {
  selectedStage: string;
  setSelectedStage: (stage: string) => void;
}) {
  const filters = [
    { label: "Tüm Maçlar", value: "Tümü", icon: "🌍" },
    { label: "Grup Maçları", value: "Gruplar", icon: "🏟️" },
    { label: "Eleme Maçları", value: "Eleme", icon: "⚔️" },
    { label: "Final Haftası", value: "Final Haftası", icon: "🏆" },
  ];

  return (
    <div className="rounded-2xl border border-amber-100 bg-gradient-to-r from-amber-50 to-red-50 p-2">
      <div className="flex gap-2 overflow-x-auto">
        {filters.map((filter) => {
          const active = selectedStage === filter.value;

          return (
            <button
              key={filter.value}
              onClick={() => setSelectedStage(filter.value)}
              className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-black transition md:text-sm ${
                active
                  ? "bg-red-500 text-white shadow-md shadow-red-200"
                  : "bg-white text-slate-700 hover:bg-amber-100"
              }`}
            >
              <span className="mr-1">{filter.icon}</span>
              {filter.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MobileBottomNav({
  activeTab,
  setActiveTab,
  isAdmin,
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isAdmin: boolean;
}) {
  const items = [
    { key: "dashboard", label: "Ana", icon: "🏠" },
    { key: "tahmin", label: "Tahmin", icon: "🎯" },
    { key: "maclar", label: "Maçlar", icon: "⚽" },
    { key: "profil", label: "Profil", icon: "👤" },
    ...(isAdmin ? [{ key: "admin", label: "Admin", icon: "👑" }] : []),
  ];

  return (
    <nav className="fixed inset-x-3 bottom-3 z-50 rounded-[1.5rem] border border-red-100 bg-white/95 p-1.5 shadow-2xl shadow-red-100 backdrop-blur md:hidden">
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
        }}
      >
        {items.map((item) => (
          <button
            key={item.key}
            onClick={() => setActiveTab(item.key)}
            className={`rounded-2xl px-2 py-1.5 text-center text-xs font-black transition ${
              activeTab === item.key
                ? "bg-red-500 text-white shadow-lg shadow-red-200"
                : "text-slate-500"
            }`}
          >
            <div className="text-lg leading-none">{item.icon}</div>
            <div className="mt-1">{item.label}</div>
          </button>
        ))}
      </div>
    </nav>
  );
}

function FloatingMascot({ text }: { text: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-28 right-3 z-40 md:hidden">
      {open && (
        <div className="mb-2 max-w-[220px] rounded-2xl border border-amber-100 bg-white p-3 text-sm font-bold text-slate-700 shadow-xl">
          {text}
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-full border-4 border-white bg-amber-100 p-1 shadow-2xl shadow-red-100"
      >
        <img
          src={MASCOT_SRC}
          alt="ORS maskotu"
          className="h-12 w-12 object-contain"
        />
      </button>
    </div>
  );
}

function TodayMiniPanel({ matches }: { matches: Match[] }) {
  const todayMatches = matches.filter((match) => {
    const now = new Date();
    const matchDate = new Date(match.match_time);
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    return matchDate >= today && matchDate < tomorrow;
  });

  if (todayMatches.length === 0) return null;

  const firstMatch = todayMatches[0];

  return (
    <div className="mb-4 rounded-[1.5rem] border border-red-100 bg-white p-3 shadow-xl shadow-red-100 md:hidden">
      <div className="text-xs font-black uppercase tracking-wide text-red-500">
        Bugünün Maçları
      </div>
      <div className="mt-1 text-lg font-black">
        🔥 {todayMatches.length} maç var
      </div>
      <div className="mt-1 text-sm font-bold text-slate-500">
        İlk maç:{" "}
        {new Date(firstMatch.match_time).toLocaleTimeString("tr-TR", {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </div>
    </div>
  );
}

function StatBox({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-amber-50/40 p-4">
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
    <div className="rounded-[1.75rem] border border-amber-100 bg-amber-50/50 p-5">
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
  onProfile,
}: {
  sortedPlayers: Player[];
  playerStreaks: Record<string, number>;
  onProfile: (id: string) => void;
}) {
  return (
    <div className="overflow-auto">
      <table className="w-full min-w-[950px]">
        <thead>
          <tr className="border-b border-amber-100 text-left text-slate-500">
            <th className="pb-3">#</th>
            <th className="pb-3">İsim</th>
            <th className="pb-3">Doğru</th>
            <th className="pb-3">Yanlış</th>
            <th className="pb-3">Tahmin Yok</th>
            <th className="pb-3">Ek Puan</th>
            <th className="pb-3">Puan</th>
            <th className="pb-3">Başarı</th>
            <th className="pb-3">Streak</th>
            <th className="pb-3">Şampiyon</th>
          </tr>
        </thead>

        <tbody>
          {sortedPlayers.map((p, index) => (
            <tr
              key={p.id}
              className="cursor-pointer border-b border-slate-100 hover:bg-amber-100"
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
