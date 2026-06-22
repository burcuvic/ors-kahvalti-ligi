"use client";

import { ChangeEvent, createContext, useContext, useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";

const supabase = createClient(
  "https://mqjgemndxkuufjaeyhjb.supabase.co",
  "sb_publishable_ZcaB2PBtdaBJ6blYdd4wPA_872a5OfE",
);

const ADMIN_PASSWORD = "ors2026";
const MASCOT_SRC = "/ors-mascot.png";
const APP_URL = "https://ors-kahvalti-ligi.vercel.app";

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
  login_code?: string | null;
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
  is_joker?: boolean | null;
};

type BonusLog = {
  id: string;
  player_id: string;
  match_id: string | null;
  points: number;
  reason: string | null;
  created_at: string;
};

type TeamStatusValue = "active" | "risk" | "eliminated" | "champion";

type TeamStatus = {
  id?: string;
  team_name: string;
  status: TeamStatusValue;
  updated_at?: string | null;
};

type TeamStatusMap = Record<string, TeamStatusValue>;

const TeamStatusContext = createContext<TeamStatusMap>({});

const normalizeTeamName = (team?: string | null) =>
  String(team || "").trim().toLocaleLowerCase("tr-TR");

const TEAM_STATUS_LABELS: Record<TeamStatusValue, string> = {
  active: "Devam ediyor",
  risk: "Riskli",
  eliminated: "Elendi",
  champion: "Şampiyon",
};

const TEAM_STATUS_EMOJIS: Record<TeamStatusValue, string> = {
  active: "✅",
  risk: "⚠️",
  eliminated: "❌",
  champion: "🏆",
};

const TEAM_STATUS_STYLES: Record<TeamStatusValue, string> = {
  active: "bg-green-100 text-green-700 border-green-200",
  risk: "bg-amber-100 text-amber-700 border-amber-200",
  eliminated: "bg-slate-200 text-slate-500 border-slate-300",
  champion: "bg-yellow-100 text-yellow-800 border-yellow-300",
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
const MATCH_FILTERS = ["Açık", "Bugün", "Yarın", "Başlayanlar", "Tümü"];

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
  return code ? `https://flagcdn.com/w40/${code}.png` : "";
}

function TeamName({
  team,
  showStatus = false,
}: {
  team: string;
  showStatus?: boolean;
}) {
  const url = flagUrl(team);
  const teamStatuses = useContext(TeamStatusContext);
  const status = teamStatuses[normalizeTeamName(team)] || "active";
  const eliminated = status === "eliminated";
  const risk = status === "risk";
  const champion = status === "champion";

  return (
    <span
      className={`inline-flex items-center justify-center gap-2 ${
        eliminated ? "opacity-45 grayscale" : ""
      }`}
      title={`${team} - ${TEAM_STATUS_LABELS[status]}`}
    >
      {url ? (
        <img
          src={url}
          alt={team}
          className={`h-4 w-6 rounded-[3px] object-cover shadow-sm ${
            eliminated ? "grayscale" : ""
          }`}
        />
      ) : (
        <span className="text-sm">🏳️</span>
      )}
      <span className={eliminated ? "line-through decoration-2" : ""}>
        {team}
      </span>
      {(showStatus || eliminated || risk || champion) && (
        <span
          className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${TEAM_STATUS_STYLES[status]}`}
        >
          {TEAM_STATUS_EMOJIS[status]} {TEAM_STATUS_LABELS[status]}
        </span>
      )}
    </span>
  );
}

const COUNTRY_THEMES: Record<
  string,
  { card: string; glow: string; name: string }
> = {
  Türkiye: {
    card: "from-red-500 to-red-700",
    glow: "shadow-red-200",
    name: "Ay-Yıldız Ruhlu",
  },
  Brezilya: {
    card: "from-yellow-300 to-green-500",
    glow: "shadow-green-200",
    name: "Samba Tahmincisi",
  },
  Arjantin: {
    card: "from-sky-300 to-blue-500",
    glow: "shadow-sky-200",
    name: "Tango Oracle",
  },
  Almanya: {
    card: "from-slate-900 to-red-600",
    glow: "shadow-slate-200",
    name: "Panzer Disiplini",
  },
  Fransa: {
    card: "from-blue-700 to-red-500",
    glow: "shadow-blue-200",
    name: "Horoz Modu",
  },
  İngiltere: {
    card: "from-red-500 to-slate-100",
    glow: "shadow-red-100",
    name: "It's Coming Home",
  },
  İspanya: {
    card: "from-red-500 to-yellow-400",
    glow: "shadow-yellow-200",
    name: "La Roja",
  },
  Hollanda: {
    card: "from-orange-400 to-orange-600",
    glow: "shadow-orange-200",
    name: "Portakal Gücü",
  },
  Portekiz: {
    card: "from-red-600 to-green-600",
    glow: "shadow-green-200",
    name: "Seleção das Quinas",
  },
  Japonya: {
    card: "from-white to-red-400",
    glow: "shadow-red-100",
    name: "Samuray Tahminci",
  },
  Meksika: {
    card: "from-green-500 to-red-500",
    glow: "shadow-green-200",
    name: "El Tri Enerjisi",
  },
  Fas: {
    card: "from-red-600 to-emerald-500",
    glow: "shadow-red-200",
    name: "Atlas Aslanı",
  },
};

function getCountryTheme(team?: string | null) {
  if (!team)
    return {
      card: "from-amber-300 to-orange-300",
      glow: "shadow-amber-100",
      name: "Tarafsız Kuş",
    };
  return (
    COUNTRY_THEMES[team] || {
      card: "from-amber-300 to-orange-300",
      glow: "shadow-amber-100",
      name: "Sürpriz Takımcı",
    }
  );
}

// === WHATSAPP ===
function shareToWhatsApp(message: string) {
  window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
}

function shareUpcomingMatches(matches: Match[]) {
  const now = Date.now();
  const twoDaysLater = now + 48 * 60 * 60 * 1000;
  const upcoming = matches
    .filter((m) => {
      const t = new Date(m.match_time).getTime();
      return t >= now && t <= twoDaysLater && !m.result;
    })
    .sort(
      (a, b) =>
        new Date(a.match_time).getTime() - new Date(b.match_time).getTime(),
    );
  if (upcoming.length === 0) {
    alert("Önümüzdeki 2 günde maç yok 😄");
    return;
  }
  const grouped: Record<string, Match[]> = {};
  upcoming.forEach((m) => {
    const dateKey = new Date(m.match_time).toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "long",
      weekday: "long",
    });
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(m);
  });
  let message = `🥯 ORS Kahvaltı Ligi 🏆\n\n⏰ Önümüzdeki 2 günün maçları:\n\n`;
  for (const [date, matchList] of Object.entries(grouped)) {
    message += `📅 ${date}\n`;
    matchList.forEach((m) => {
      const time = new Date(m.match_time).toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit",
      });
      message += `• ${time} — ${m.home_team} vs ${m.away_team}\n`;
    });
    message += `\n`;
  }
  message += `👉 Tahminini yap, simitten kaç!\n${APP_URL}`;
  shareToWhatsApp(message);
}

function shareMatchReminder(match: Match) {
  const date = new Date(match.match_time).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
  const message = `⚽ ${match.home_team} vs ${match.away_team}\n📅 ${date}\n🏆 ${match.league || "Dünya Kupası"}\n\nTahminini yap, simitten kaç! 🥯\n\n👉 ${APP_URL}`;
  shareToWhatsApp(message);
}

// === GÜNÜN ÖZETİ ===

// === FUTBOL GÜNÜ ===
// Gece 02:00 / 04:00 maçları takvimde ertesi gün olsa bile
// uygulamada aynı "maç günü" içinde kalsın diye gün 06:00'da değişir.
const FOOTBALL_DAY_START_HOUR = 6;

function getFootballDayRange(offsetDays = 0, baseDate = new Date()) {
  const start = new Date(baseDate);
  start.setHours(FOOTBALL_DAY_START_HOUR, 0, 0, 0);

  if (baseDate.getHours() < FOOTBALL_DAY_START_HOUR) {
    start.setDate(start.getDate() - 1);
  }

  start.setDate(start.getDate() + offsetDays);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
}

function getSelectedFootballDayRange(dateString: string) {
  const [year, month, day] = dateString.split("-").map(Number);
  const start = new Date(
    year,
    month - 1,
    day,
    FOOTBALL_DAY_START_HOUR,
    0,
    0,
    0,
  );
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

function getFootballDayKey(date: Date) {
  const d = new Date(date);

  // Futbol günü 06:00'da başlasın:
  // 00:00 - 05:59 arası hâlâ bir önceki güne ait sayılsın.
  if (d.getHours() < FOOTBALL_DAY_START_HOUR) {
    d.setDate(d.getDate() - 1);
  }

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getPredictionCalculatedPoints(
  pred: Prediction | undefined | null,
  match: Match | undefined | null,
) {
  if (!pred) return 0;
  if (!match?.result) return Number(pred.points || 0);

  const prediction = String(pred.prediction || "").trim();
  const result = String(match.result || "").trim();

  if (prediction === "YOK") return -3;
  if (prediction === "BILINMIYOR") return 0;

  if (prediction === result) {
    return pred.is_joker ? 6 : 3;
  }

  return pred.is_joker ? -2 : -1;
}

function isPredictionCorrect(
  pred: Prediction | undefined | null,
  match: Match | undefined | null,
) {
  if (!pred || !match?.result) return false;
  const prediction = String(pred.prediction || "").trim();
  const result = String(match.result || "").trim();
  return (
    prediction !== "YOK" && prediction !== "BILINMIYOR" && prediction === result
  );
}

function getPredictionPointLabel(
  pred: Prediction | undefined | null,
  match: Match | undefined | null,
) {
  const points = getPredictionCalculatedPoints(pred, match);
  return points > 0 ? `+${points}` : String(points);
}

function getPlayerFinishedPredictions(
  playerId: string,
  matches: Match[],
  predictions: Prediction[],
) {
  return predictions
    .filter((pred) => pred.player_id === playerId)
    .map((pred) => ({
      ...pred,
      match: matches.find((m) => m.id === pred.match_id),
    }))
    .filter((pred) => pred.match?.result)
    .sort(
      (a, b) =>
        new Date(a.match!.match_time).getTime() -
        new Date(b.match!.match_time).getTime(),
    );
}

function getLastFiveForm(
  playerId: string,
  matches: Match[],
  predictions: Prediction[],
) {
  const finished = getPlayerFinishedPredictions(
    playerId,
    matches,
    predictions,
  ).slice(-5);

  return finished.map((pred, index) => {
    const match = pred.match!;
    const points = getPredictionCalculatedPoints(pred, match);
    const correct = isPredictionCorrect(pred, match);
    const label = `${index + 1}. maç`;
    const date = new Date(match.match_time).toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "short",
    });

    return {
      label,
      date,
      points,
      correct,
      prediction: pred.prediction,
      result: match.result || "—",
      is_joker: !!pred.is_joker,
      matchName: `${match.home_team} - ${match.away_team}`,
      icon: correct ? "✅" : points === 0 ? "➖" : "❌",
    };
  });
}

function getFormSummary(form: ReturnType<typeof getLastFiveForm>) {
  const totalPoints = form.reduce((sum, item) => sum + item.points, 0);
  const correct = form.filter((item) => item.correct).length;
  const total = form.length;

  if (total === 0)
    return {
      text: "Bekliyor",
      cls: "bg-slate-100 text-slate-500",
      note: "Henüz sonuçlanan maç yok",
    };
  if (correct >= 4 || totalPoints >= 9)
    return {
      text: "Formda",
      cls: "bg-emerald-100 text-emerald-700",
      note: `${correct}/${total} doğru • ${totalPoints > 0 ? "+" : ""}${totalPoints} puan`,
    };
  if (correct <= 1 || totalPoints <= 0)
    return {
      text: "Düşüşte",
      cls: "bg-red-100 text-red-600",
      note: `${correct}/${total} doğru • ${totalPoints > 0 ? "+" : ""}${totalPoints} puan`,
    };
  return {
    text: "Dengeli",
    cls: "bg-amber-100 text-amber-700",
    note: `${correct}/${total} doğru • ${totalPoints > 0 ? "+" : ""}${totalPoints} puan`,
  };
}

function getChampionLiveStatus(
  team: string | null | undefined,
  matches: Match[],
) {
  if (!team)
    return {
      text: "Seçilmedi",
      cls: "bg-slate-100 text-slate-500",
      detail: "Şampiyon tahmini yok",
    };

  const knockoutStages = [
    "Son 32",
    "Son 16",
    "Çeyrek Final",
    "Yarı Final",
    "Final",
  ];
  const teamMatches = matches.filter(
    (m) => m.home_team === team || m.away_team === team,
  );
  const finishedTeamMatches = teamMatches.filter((m) => m.result);
  const finalMatch = matches.find(
    (m) => (m.league || m.breakfast_round) === "Final" && m.result,
  );

  if (finalMatch) {
    const champion =
      finalMatch.result === "1"
        ? finalMatch.home_team
        : finalMatch.result === "2"
          ? finalMatch.away_team
          : null;
    if (champion === team)
      return {
        text: "Şampiyon",
        cls: "bg-yellow-100 text-yellow-700",
        detail: "Tahmin kupaya gitti 🏆",
      };
  }

  const lostKnockout = finishedTeamMatches.some((m) => {
    const stage = m.league || m.breakfast_round || "";
    if (!knockoutStages.includes(stage)) return false;
    const teamIsHome = m.home_team === team;
    const teamWon =
      (teamIsHome && m.result === "1") || (!teamIsHome && m.result === "2");
    return !teamWon;
  });

  if (lostKnockout)
    return {
      text: "Elendi",
      cls: "bg-red-100 text-red-600",
      detail: "Şampiyon tahmini patladı",
    };

  const groupMatches = teamMatches.filter(
    (m) => m.league?.startsWith("Grup") && m.result,
  );
  const groupPoints = groupMatches.reduce((sum, m) => {
    const teamIsHome = m.home_team === team;
    const teamWon =
      (teamIsHome && m.result === "1") || (!teamIsHome && m.result === "2");
    const draw = m.result === "X";
    return sum + (teamWon ? 3 : draw ? 1 : 0);
  }, 0);
  const groupGoalDiff = groupMatches.reduce((sum, m) => {
    const hs = Number(m.home_score || 0);
    const as = Number(m.away_score || 0);
    return sum + (m.home_team === team ? hs - as : as - hs);
  }, 0);

  if (groupMatches.length >= 2 && (groupPoints <= 1 || groupGoalDiff < -2)) {
    return {
      text: "Riskli",
      cls: "bg-amber-100 text-amber-700",
      detail: `${groupPoints} grup puanı • averaj ${groupGoalDiff > 0 ? "+" : ""}${groupGoalDiff}`,
    };
  }

  const hasUpcoming = teamMatches.some(
    (m) => !m.result && new Date(m.match_time).getTime() > Date.now(),
  );
  if (
    !hasUpcoming &&
    teamMatches.length > 0 &&
    finishedTeamMatches.length === teamMatches.length &&
    groupMatches.length >= 3
  ) {
    return {
      text: "Riskli",
      cls: "bg-amber-100 text-amber-700",
      detail: "Grup sonrası durumu kontrol et",
    };
  }

  return {
    text: "Yaşıyor",
    cls: "bg-emerald-100 text-emerald-700",
    detail: groupMatches.length
      ? `${groupPoints} grup puanı • devam ediyor`
      : "Turnuvada devam ediyor",
  };
}

function getBreakfastLinePlayers(players: Player[]) {
  const sortedAsc = [...players].sort(
    (a, b) => Number(a.total_points || 0) - Number(b.total_points || 0),
  );

  if (sortedAsc.length <= 2) return sortedAsc;

  const secondLowestScore = Number(sortedAsc[1]?.total_points || 0);

  return sortedAsc.filter(
    (player) => Number(player.total_points || 0) <= secondLowestScore,
  );
}

function shareDailySummary(
  players: Player[],
  matches: Match[],
  predictions: Prediction[],
) {
  const now = new Date();

  // Özet artık bugünün değil, bir önceki futbol gününün raporunu verir.
  // Futbol günü 06:00'da değiştiği için gece 02:00 / 04:00 maçları
  // hâlâ önceki akşamın maçları gibi aynı özete dahil olur.
  const yesterdayRange = getFootballDayRange(-1, now);

  const summaryMatches = matches.filter((m) => {
    const t = new Date(m.match_time);
    return t >= yesterdayRange.start && t < yesterdayRange.end;
  });

  const finishedMatches = summaryMatches.filter((m) => m.result);

  const sorted = [...players].sort(
    (a, b) => Number(b.total_points || 0) - Number(a.total_points || 0),
  );
  const lider = sorted[0];
  const kurbanlar = getBreakfastLinePlayers(players);

  // Dünün kahini: önceki futbol gününde en çok doğru bilen oyuncu
  const dayStats = players.map((p) => {
    let correct = 0;
    let total = 0;

    finishedMatches.forEach((m) => {
      const pred = predictions.find(
        (pr) => pr.player_id === p.id && pr.match_id === m.id,
      );

      if (
        pred &&
        pred.prediction !== "YOK" &&
        pred.prediction !== "BILINMIYOR"
      ) {
        total++;
        if (pred.prediction === m.result) correct++;
      }
    });

    return { player: p, correct, total };
  });

  const dayKahin = [...dayStats]
    .filter((s) => s.total > 0)
    .sort((a, b) => {
      if (b.correct !== a.correct) return b.correct - a.correct;
      return b.total - a.total;
    })[0];

  const dayKurban = [...dayStats]
    .filter((s) => s.total > 0)
    .sort((a, b) => {
      if (a.correct !== b.correct) return a.correct - b.correct;
      return b.total - a.total;
    })[0];

  const openCount = matches.filter((m) => {
    return !m.result && new Date(m.match_time).getTime() > Date.now();
  }).length;

  const dateStr = yesterdayRange.start.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
    weekday: "long",
  });

  let message = `🌅 ORS Kahvaltı Ligi — Dünün Özeti\n📅 ${dateStr}\n\n`;
  message += `🏆 Genel Lider: ${lider?.name || "—"} (${lider?.total_points || 0} puan)\n`;
  message += `🥯 Kahvaltı Hattı: ${kurbanlar.map((p) => p.name).join(", ") || "—"}\n\n`;

  if (finishedMatches.length > 0) {
    message += `🔥 Dünün Kahini: ${dayKahin?.player.name || "—"} (${dayKahin?.correct || 0}/${dayKahin?.total || 0})\n`;

    if (dayKurban && dayKurban.correct < dayKurban.total) {
      message += `💔 Dün Yandı: ${dayKurban.player.name} (${dayKurban.correct}/${dayKurban.total})\n`;
    }

    message += `\n⚽ Dün ${finishedMatches.length} maç oynandı\n`;
  } else {
    message += `⚽ Dün sonuçlanan maç yok\n`;
  }

  message += `📊 Açık maç: ${openCount}\n\n`;
  message += `👉 ${APP_URL}`;

  shareToWhatsApp(message);
}

// === PDF RAPORU ===
async function downloadPDFReport(
  players: Player[],
  matches: Match[],
  predictions: Prediction[],
) {
  const jsPDFModule = await import("jspdf");
  const autoTableModule = await import("jspdf-autotable");
  const jsPDF = jsPDFModule.default;
  const autoTable = autoTableModule.default;

  const doc = new jsPDF();

  // Başlık
  doc.setFontSize(24);
  doc.setTextColor(220, 38, 38);
  doc.text("ORS Kahvalti Ligi", 105, 20, { align: "center" });

  doc.setFontSize(14);
  doc.setTextColor(245, 158, 11);
  doc.text("World Cup 2026 Edition", 105, 30, { align: "center" });

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  const dateStr = new Date().toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  doc.text(`Rapor Tarihi: ${dateStr}`, 105, 38, { align: "center" });

  // Genel Sıralama
  const sorted = [...players].sort(
    (a, b) => Number(b.total_points || 0) - Number(a.total_points || 0),
  );

  autoTable(doc, {
    startY: 50,
    head: [
      [
        "#",
        "Oyuncu",
        "Dogru",
        "Yanlis",
        "Tahmin Yok",
        "Ek Puan",
        "PUAN",
        "Basari",
        "Sampiyon",
      ],
    ],
    body: sorted.map((p, i) => [
      i + 1,
      p.name,
      p.correct_count || 0,
      p.wrong_count || 0,
      p.intentional_blank || 0,
      p.bonus_points || 0,
      p.total_points || 0,
      `%${p.success_rate || 0}`,
      p.champion_team || "-",
    ]),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [239, 68, 68], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [254, 243, 199] },
    columnStyles: { 6: { fontStyle: "bold", textColor: [37, 99, 235] } },
  });

  // İstatistikler
  const finalY = (doc as any).lastAutoTable?.finalY || 50;

  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text("Turnuva Istatistikleri", 14, finalY + 15);

  const finishedMatches = matches.filter((m) => m.result).length;
  const allPredictions = predictions.length;
  const championPicks: Record<string, string[]> = {};
  players.forEach((p) => {
    if (p.champion_team) {
      if (!championPicks[p.champion_team]) championPicks[p.champion_team] = [];
      championPicks[p.champion_team].push(p.name);
    }
  });

  autoTable(doc, {
    startY: finalY + 20,
    head: [["Metrik", "Deger"]],
    body: [
      ["Toplam mac", String(matches.length)],
      ["Oynanan mac", String(finishedMatches)],
      ["Toplam tahmin", String(allPredictions)],
      ["Aktif oyuncu", String(players.length)],
    ],
    styles: { fontSize: 10, cellPadding: 4 },
    headStyles: {
      fillColor: [245, 158, 11],
      textColor: [30, 41, 59],
      fontStyle: "bold",
    },
  });

  // Şampiyon tahminleri
  const finalY2 = (doc as any).lastAutoTable?.finalY || finalY;

  doc.setFontSize(14);
  doc.text("Sampiyon Tahminleri", 14, finalY2 + 15);

  autoTable(doc, {
    startY: finalY2 + 20,
    head: [["Ulke", "Secen Oyuncular"]],
    body: Object.entries(championPicks).map(([team, names]) => [
      team,
      names.join(", "),
    ]),
    styles: { fontSize: 10, cellPadding: 4 },
    headStyles: { fillColor: [225, 29, 72], textColor: 255, fontStyle: "bold" },
  });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `ors-kahvalti-ligi.vercel.app | Olusturulma: ${new Date().toLocaleString("tr-TR")}`,
    105,
    285,
    { align: "center" },
  );

  // İndir
  doc.save(`ORS-Kahvalti-Ligi-${new Date().toISOString().slice(0, 10)}.pdf`);
}

// === MAÇ DURUMU ===
function getMatchStatus(match: Match) {
  const now = Date.now();
  const matchTime = new Date(match.match_time).getTime();
  const diffMs = matchTime - now;
  const absDiff = Math.abs(diffMs);
  const hours = Math.floor(absDiff / (1000 * 60 * 60));
  const mins = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));
  const days = Math.floor(hours / 24);

  if (match.result)
    return {
      status: "finished" as const,
      label: "Sonuçlandı",
      color: "bg-slate-200 text-slate-600",
      borderColor: "border-amber-100",
    };
  if (diffMs < 0) {
    let timeText =
      days > 0
        ? `${days} gün önce bitti`
        : hours > 0
          ? `${hours} saat önce bitti`
          : `${mins} dk önce bitti`;
    return {
      status: "needsScore" as const,
      label: `🔴 SKOR BEKLİYOR — ${timeText}`,
      color: "bg-red-500 text-white",
      borderColor: "border-red-500 ring-2 ring-red-300",
    };
  }
  if (diffMs < 24 * 60 * 60 * 1000) {
    let timeText = hours > 0 ? `${hours}s ${mins}dk sonra` : `${mins} dk sonra`;
    return {
      status: "upcoming" as const,
      label: `🟡 YAKINDA — ${timeText} başlıyor`,
      color: "bg-amber-100 text-amber-800",
      borderColor: "border-amber-300",
    };
  }
  let timeText = days > 0 ? `${days} gün sonra` : `${hours} saat sonra`;
  return {
    status: "open" as const,
    label: `🟢 Açık — ${timeText}`,
    color: "bg-emerald-100 text-emerald-700",
    borderColor: "border-emerald-200",
  };
}

// === İSTATİSTİKLER ===
function computeStats(
  players: Player[],
  matches: Match[],
  predictions: Prediction[],
) {
  const playerSuccess = players
    .map((p) => {
      const finishedPreds = predictions.filter((pred) => {
        if (pred.player_id !== p.id) return false;
        const match = matches.find((m) => m.id === pred.match_id);
        return match?.result && pred.prediction !== "YOK";
      });
      const correct = finishedPreds.filter((pred) => {
        const match = matches.find((m) => m.id === pred.match_id);
        return match?.result === pred.prediction;
      }).length;
      const rate =
        finishedPreds.length > 0
          ? Math.round((correct / finishedPreds.length) * 100)
          : 0;
      return { player: p, rate, finished: finishedPreds.length, correct };
    })
    .filter((x) => x.finished >= 1);

  const kahin = [...playerSuccess].sort((a, b) => b.rate - a.rate)[0];
  const kurban = [...playerSuccess].sort((a, b) => a.rate - b.rate)[0];

  const allValidPreds = predictions.filter(
    (p) => p.prediction !== "YOK" && p.prediction !== "BILINMIYOR",
  );
  const totalPreds = allValidPreds.length;
  const distPct = {
    "1":
      totalPreds > 0
        ? Math.round(
            (allValidPreds.filter((p) => p.prediction === "1").length /
              totalPreds) *
              100,
          )
        : 0,
    X:
      totalPreds > 0
        ? Math.round(
            (allValidPreds.filter((p) => p.prediction === "X").length /
              totalPreds) *
              100,
          )
        : 0,
    "2":
      totalPreds > 0
        ? Math.round(
            (allValidPreds.filter((p) => p.prediction === "2").length /
              totalPreds) *
              100,
          )
        : 0,
  };

  const matchMajority: Record<string, string> = {};
  matches.forEach((m) => {
    const matchPreds = predictions.filter(
      (p) => p.match_id === m.id && p.prediction !== "YOK",
    );
    if (matchPreds.length < 3) return;
    const counts = { "1": 0, X: 0, "2": 0 };
    matchPreds.forEach((p) => {
      if (p.prediction in counts) counts[p.prediction as "1" | "X" | "2"]++;
    });
    const max = Math.max(counts["1"], counts.X, counts["2"]);
    if (counts["1"] === max) matchMajority[m.id] = "1";
    else if (counts.X === max) matchMajority[m.id] = "X";
    else matchMajority[m.id] = "2";
  });

  const herdScore = players
    .map((p) => {
      const playerPreds = predictions.filter(
        (pred) => pred.player_id === p.id && pred.prediction !== "YOK",
      );
      let matchesMajority = 0,
        total = 0;
      playerPreds.forEach((pred) => {
        if (matchMajority[pred.match_id]) {
          total++;
          if (pred.prediction === matchMajority[pred.match_id])
            matchesMajority++;
        }
      });
      const herdPct =
        total > 0 ? Math.round((matchesMajority / total) * 100) : 0;
      return { player: p, herdPct, total };
    })
    .filter((x) => x.total >= 3);

  const suruUyesi = [...herdScore].sort((a, b) => b.herdPct - a.herdPct)[0];
  const asi = [...herdScore].sort((a, b) => a.herdPct - b.herdPct)[0];

  const championPicks: Record<string, string[]> = {};
  players.forEach((p) => {
    if (p.champion_team) {
      if (!championPicks[p.champion_team]) championPicks[p.champion_team] = [];
      championPicks[p.champion_team].push(p.name);
    }
  });

  return { kahin, kurban, distPct, suruUyesi, asi, championPicks };
}

// === MAÇ MİZAH BAŞLIKLARI ===
function getMatchVibe(
  match: Match,
  predictions: Prediction[],
  players: Player[],
): string {
  const matchPreds = predictions.filter(
    (p) => p.match_id === match.id && p.prediction !== "YOK",
  );
  const total = matchPreds.length;
  if (total === 0)
    return "🐣 Henüz kimse tahmin yapmamış. İlk hamle senin olsun!";
  if (total === 1) return "🦅 Tek tahmin var, herkesi mi bekliyorlar?";

  const counts = { "1": 0, X: 0, "2": 0 };
  matchPreds.forEach((p) => {
    if (p.prediction in counts) counts[p.prediction as "1" | "X" | "2"]++;
  });
  const pct1 = Math.round((counts["1"] / total) * 100);
  const pctX = Math.round((counts.X / total) * 100);
  const pct2 = Math.round((counts["2"] / total) * 100);
  const maxPct = Math.max(pct1, pctX, pct2);

  const sortedByPts = [...players].sort(
    (a, b) => Number(b.total_points || 0) - Number(a.total_points || 0),
  );
  const lider = sortedByPts[0];
  const kurban = sortedByPts[sortedByPts.length - 1];
  const liderPred = matchPreds.find((p) => p.player_id === lider?.id);
  const kurbanPred = matchPreds.find((p) => p.player_id === kurban?.id);

  const aykiri =
    counts["1"] === 1
      ? matchPreds.find((p) => p.prediction === "1")
      : counts.X === 1 && total >= 4
        ? matchPreds.find((p) => p.prediction === "X")
        : counts["2"] === 1
          ? matchPreds.find((p) => p.prediction === "2")
          : null;

  if (maxPct >= 80) {
    if (pct1 === maxPct)
      return `🐑 %${pct1} "${match.home_team}" diyor, kimse karşı çıkmıyor. Sürü etkisi mi, gerçek mi?`;
    if (pct2 === maxPct)
      return `🐑 %${pct2} "${match.away_team}" diyor, ofis ittifak halinde. Şaşırırsak şaşırırız!`;
    if (pctX === maxPct)
      return `🤔 %${pctX} beraberlik dedi — anlaşan anlaşmıyor anlaşılan`;
  }

  if (maxPct >= 60 && aykiri) {
    const aykiriPlayer = players.find((p) => p.id === aykiri.player_id);
    if (aykiriPlayer) {
      const yon = maxPct === pct1 ? "1" : maxPct === pct2 ? "2" : "X";
      return `⚡ Herkes ${yon} derken ${aykiriPlayer.name} tek başına ${aykiri.prediction} dedi — ya kahin ya inatçı`;
    }
  }

  if (maxPct < 45)
    return `🎲 Tam karışık maç: %${pct1}-%${pctX}-%${pct2}. Kim haklı çıkacak, akşam kahvaltısı belirleyecek`;

  if (Math.abs(pct1 - pct2) <= 10 && pctX < 25) {
    return `⚖️ İkiye bölündü ofis: %${pct1} "${match.home_team}" / %${pct2} "${match.away_team}". Sabah çay tartışması garanti`;
  }

  if (
    liderPred &&
    kurbanPred &&
    liderPred.prediction !== kurbanPred.prediction
  ) {
    return `👑 Lider ${lider.name} ${liderPred.prediction} dedi, sondaki ${kurban.name} ${kurbanPred.prediction} dedi. Tersi mi oynanır acaba?`;
  }

  if (maxPct >= 55) {
    if (pct1 === maxPct)
      return `📊 ${match.home_team} favori (%${pct1}), ama sürpriz hep mümkün`;
    if (pct2 === maxPct)
      return `📊 ${match.away_team} favori (%${pct2}), deplasmanda fark yaratabilir`;
    if (pctX === maxPct)
      return `📊 %${pctX} beraberlik bekliyor, savunma maçı olabilir`;
  }

  return `🎯 Dengeli dağılım: %${pct1} - %${pctX} - %${pct2}. Kafa karıştırıcı maç`;
}

// === PROFİL KARTI ===
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
          <div className="text-sm font-black uppercase opacity-70">
            Toplam Puan
          </div>
          <div className="text-5xl font-black md:text-6xl">
            {player.total_points || 0}
          </div>
          <div className="mt-1 text-xs font-black opacity-70">
            Başarı %{player.success_rate || 0}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ANA UYGULAMA
// ============================================================
export default function Home() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [bonusLogs, setBonusLogs] = useState<BonusLog[]>([]);
  const [teamStatuses, setTeamStatuses] = useState<TeamStatus[]>([]);

  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [loginName, setLoginName] = useState("");
  const [loginCode, setLoginCode] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  const [selectedStage, setSelectedStage] = useState("Tümü");
  const [predictionFilter, setPredictionFilter] = useState("Açık");
  const [matchListFilter, setMatchListFilter] = useState("Tümü");
  const [selectedMatchDate, setSelectedMatchDate] = useState("");
  const [adminScoreSearch, setAdminScoreSearch] = useState("");
  const [adminScoreFilter, setAdminScoreFilter] = useState("Skor Bekleyenler");

  const [profilePlayerId, setProfilePlayerId] = useState("");
  const [compareLeftId, setCompareLeftId] = useState("");
  const [compareRightId, setCompareRightId] = useState("");

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
    try {
      setRefreshing(true);

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
      const { data: teamStatusData } = await supabase
        .from("team_statuses")
        .select("*")
        .order("team_name", { ascending: true });

      setPlayers(playersData || []);
      setMatches(matchesData || []);
      setPredictions(predictionsData || []);
      setBonusLogs(bonusData || []);
      setTeamStatuses((teamStatusData || []) as TeamStatus[]);
      setLastUpdatedAt(new Date());
    } finally {
      setRefreshing(false);
    }
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
    if (!compareLeftId && players[0]) setCompareLeftId(players[0].id);
    if (!compareRightId && players[1]) setCompareRightId(players[1].id);
  }, [players, compareLeftId, compareRightId]);

  useEffect(() => {
    if (!currentPlayer) return;
    const fresh = players.find((p) => p.id === currentPlayer.id);
    if (fresh) setCurrentPlayer(fresh);
  }, [players, currentPlayer]);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    setNotificationsEnabled(Notification.permission === "granted");
  }, []);

  useEffect(() => {
    if (
      !currentPlayer ||
      typeof window === "undefined" ||
      !("Notification" in window)
    )
      return;
    if (Notification.permission !== "granted") return;

    const checkUpcomingMatches = () => {
      const now = Date.now();
      const notifiedRaw = localStorage.getItem("ors_notified_matches");
      const notified: string[] = notifiedRaw ? JSON.parse(notifiedRaw) : [];

      matches.forEach((match) => {
        if (match.result) return;
        const matchTime = new Date(match.match_time).getTime();
        const diffMinutes = (matchTime - now) / (1000 * 60);
        const alreadyPredicted = predictions.some(
          (p) => p.player_id === currentPlayer.id && p.match_id === match.id,
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
          localStorage.setItem(
            "ors_notified_matches",
            JSON.stringify([...notified, notificationKey]),
          );
        }
      });
    };

    checkUpcomingMatches();
    const timer = window.setInterval(checkUpcomingMatches, 60 * 1000);
    return () => window.clearInterval(timer);
  }, [matches, predictions, currentPlayer]);

  const enableNotifications = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
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
    const normalizedName = loginName.trim().toLocaleLowerCase("tr-TR");
    const enteredCode = loginCode.trim();

    const player = players.find(
      (p) => p.name.trim().toLocaleLowerCase("tr-TR") === normalizedName,
    );

    if (!player) {
      alert("Bu kullanıcı sistemde tanımlı değil 😄");
      return;
    }

    if (!player.login_code) {
      alert("Bu oyuncu için giriş şifresi henüz tanımlanmamış 😄");
      return;
    }

    if (String(player.login_code).trim() !== enteredCode) {
      alert("Kullanıcı adı veya şifre yanlış 😄");
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
    setLoginCode("");
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

  const teamStatusMap = useMemo(() => {
    const map: TeamStatusMap = {};
    teamStatuses.forEach((item) => {
      if (!item.team_name) return;
      map[normalizeTeamName(item.team_name)] = item.status || "active";
    });
    return map;
  }, [teamStatuses]);

  const getTeamStatusValue = (team: string) =>
    teamStatusMap[normalizeTeamName(team)] || "active";

  const filteredMatches = useMemo(() => {
    if (selectedStage === "Tümü") return matches;
    if (selectedStage === "Gruplar")
      return matches.filter((m) => m.league?.startsWith("Grup"));
    return matches.filter((m) => m.league === selectedStage);
  }, [matches, selectedStage]);

  const applyTimeFilter = (matchList: Match[], filter: string) => {
    const now = new Date();
    const todayRange = getFootballDayRange(0, now);
    const tomorrowRange = getFootballDayRange(1, now);

    return matchList.filter((match) => {
      const matchDate = new Date(match.match_time);
      const isToday =
        matchDate >= todayRange.start && matchDate < todayRange.end;
      const isTomorrow =
        matchDate >= tomorrowRange.start && matchDate < tomorrowRange.end;
      const isStarted = matchDate.getTime() <= now.getTime();
      const isFinished = !!match.result;

      if (filter === "Tümü") return true;
      if (filter === "Bugün") return isToday;
      if (filter === "Yarın") return isTomorrow;
      if (filter === "Başlayanlar") return isStarted && !isFinished;
      if (filter === "Açık") return !isStarted && !isFinished;
      return true;
    });
  };

  const predictionMatches = useMemo(
    () => applyTimeFilter(filteredMatches, predictionFilter),
    [filteredMatches, predictionFilter],
  );
  const matchListMatches = useMemo(() => {
    if (!selectedMatchDate)
      return applyTimeFilter(filteredMatches, matchListFilter);

    const selectedRange = getSelectedFootballDayRange(selectedMatchDate);
    const datedMatches = filteredMatches.filter((match) => {
      const matchDate = new Date(match.match_time);
      return matchDate >= selectedRange.start && matchDate < selectedRange.end;
    });

    // Tarih seçiliyken Bugün/Yarın yerine seçili futbol günü esas alınır.
    // Açık/Başlayanlar filtreleri ise seçili tarih içinde ayrıca daraltma yapar.
    if (matchListFilter === "Açık" || matchListFilter === "Başlayanlar") {
      return applyTimeFilter(datedMatches, matchListFilter);
    }

    return datedMatches;
  }, [filteredMatches, matchListFilter, selectedMatchDate]);
  const adminScoreMatches = useMemo(() => {
    const now = Date.now();
    const q = adminScoreSearch.trim().toLocaleLowerCase("tr-TR");

    let list = filteredMatches;

    if (adminScoreFilter === "Skor Bekleyenler") {
      list = list.filter(
        (match) => !match.result && new Date(match.match_time).getTime() <= now,
      );
    } else if (adminScoreFilter === "Sonuçlananlar") {
      list = list.filter((match) => !!match.result);
    } else {
      list = applyTimeFilter(list, adminScoreFilter);
    }

    if (!q) return list;

    return list.filter((match) => {
      const haystack = [
        match.home_team,
        match.away_team,
        match.league || "",
        match.breakfast_round || "",
        String(match.week_no || ""),
      ]
        .join(" ")
        .toLocaleLowerCase("tr-TR");

      return haystack.includes(q);
    });
  }, [filteredMatches, adminScoreFilter, adminScoreSearch]);
  const openMatchesCount = useMemo(
    () => applyTimeFilter(filteredMatches, "Açık").length,
    [filteredMatches],
  );

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
        if (getPredictionCalculatedPoints(pred, match) > 0) streak++;
        else break;
      }
      streaks[player.id] = streak;
    });
    return streaks;
  }, [players, predictions, matches]);

  const jokerScores = useMemo(() => {
    const scores: Record<string, number> = {};
    players.forEach((player) => {
      const jokerPreds = predictions.filter(
        (pred) => pred.player_id === player.id && pred.is_joker,
      );
      const jokerCorrect = jokerPreds.filter((pred) => {
        const match = matches.find((m) => m.id === pred.match_id);
        return isPredictionCorrect(pred, match);
      }).length;
      const jokerWrong = jokerPreds.filter((pred) => {
        const match = matches.find((m) => m.id === pred.match_id);
        return (
          !!match?.result &&
          String(pred.prediction || "").trim() !==
            String(match.result || "").trim() &&
          pred.prediction !== "YOK" &&
          pred.prediction !== "BILINMIYOR"
        );
      }).length;
      scores[player.id] = jokerCorrect * 2 - jokerWrong;
    });
    return scores;
  }, [players, predictions, matches]);

  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => {
      const pointsDiff =
        Number(b.total_points || 0) - Number(a.total_points || 0);
      if (pointsDiff !== 0) return pointsDiff;

      const successDiff =
        Number(b.success_rate || 0) - Number(a.success_rate || 0);
      if (successDiff !== 0) return successDiff;

      const correctDiff =
        Number(b.correct_count || 0) - Number(a.correct_count || 0);
      if (correctDiff !== 0) return correctDiff;

      const wrongDiff = Number(a.wrong_count || 0) - Number(b.wrong_count || 0);
      if (wrongDiff !== 0) return wrongDiff;

      const blankDiff =
        Number(a.intentional_blank || 0) - Number(b.intentional_blank || 0);
      if (blankDiff !== 0) return blankDiff;

      const streakDiff =
        Number(playerStreaks[b.id] || 0) - Number(playerStreaks[a.id] || 0);
      if (streakDiff !== 0) return streakDiff;

      const jokerDiff =
        Number(jokerScores[b.id] || 0) - Number(jokerScores[a.id] || 0);
      if (jokerDiff !== 0) return jokerDiff;

      return a.name.localeCompare(b.name, "tr");
    });
  }, [players, playerStreaks, jokerScores]);

  const breakfastLinePlayers = useMemo(
    () => getBreakfastLinePlayers(players),
    [players],
  );

  const getPointsByPlayer = (matchList: Match[], ascending = false) => {
    const data = players.map((player) => {
      const points = matchList.reduce((sum, match) => {
        const pred = predictions.find(
          (p) => p.player_id === player.id && p.match_id === match.id,
        );
        const bonus = bonusLogs
          .filter((b) => b.player_id === player.id && b.match_id === match.id)
          .reduce((bonusSum, b) => bonusSum + Number(b.points || 0), 0);
        return sum + getPredictionCalculatedPoints(pred, match) + bonus;
      }, 0);
      return { ...player, period_points: points };
    });
    return data.sort((a, b) =>
      ascending
        ? a.period_points - b.period_points
        : b.period_points - a.period_points,
    );
  };

  const stageScores = useMemo(
    () => getPointsByPlayer(filteredMatches, true),
    [players, predictions, bonusLogs, filteredMatches],
  );

  const profilePlayer = useMemo(
    () => players.find((p) => p.id === profilePlayerId) || currentPlayer,
    [profilePlayerId, players, currentPlayer],
  );

  const profilePredictions = useMemo(() => {
    if (!profilePlayer) return [];
    return predictions
      .filter((p) => p.player_id === profilePlayer.id)
      .map((p) => ({ ...p, match: matches.find((m) => m.id === p.match_id) }))
      .filter((p) => p.match)
      .sort(
        (a, b) =>
          new Date(b.match!.match_time).getTime() -
          new Date(a.match!.match_time).getTime(),
      );
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
        return sum + getPredictionCalculatedPoints(pred, match) + bonus;
      }, 0);
      return { stage, points };
    });
  }, [profilePlayer, matches, predictions, bonusLogs]);

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

  const getJokerStageKey = (match: Match) => {
    if (match.league?.startsWith("Grup")) return "Gruplar";
    return match.league || "Dünya Kupası";
  };

  const getUsedJokerForStage = (match: Match, playerId: string) => {
    const stageKey = getJokerStageKey(match);
    return predictions.find((pred) => {
      if (pred.player_id !== playerId || !pred.is_joker) return false;
      const predMatch = matches.find((m) => m.id === pred.match_id);
      return predMatch && getJokerStageKey(predMatch) === stageKey;
    });
  };

  const isGroupStageMatch = (match: Match) => {
    return !!match.league?.startsWith("Grup");
  };

  const getPredictionOptions = (match: Match): Array<"1" | "X" | "2"> => {
    return isGroupStageMatch(match) ? ["1", "X", "2"] : ["1", "2"];
  };

  const makePrediction = async (
    match: Match,
    prediction: string,
    useJoker = false,
  ) => {
    if (!currentPlayer) return;
    if (new Date(match.match_time).getTime() <= Date.now()) {
      alert("Maç saati geldiği için tahmin kapandı 😄");
      return;
    }
    if (match.result) {
      alert("Bu maç sonuçlanmış.");
      return;
    }

    if (useJoker) {
      const usedJoker = getUsedJokerForStage(match, currentPlayer.id);
      if (usedJoker && usedJoker.match_id !== match.id) {
        const jokerMatch = matches.find((m) => m.id === usedJoker.match_id);
        alert(
          `Bu aşamada joker hakkını zaten kullandın 🃏\n${jokerMatch ? `${jokerMatch.home_team} - ${jokerMatch.away_team}` : "Başka bir maç"}`,
        );
        return;
      }
    }

    const { error } = await supabase
      .from("predictions")
      .upsert(
        {
          player_id: currentPlayer.id,
          match_id: match.id,
          prediction,
          points: 0,
          is_joker: useJoker,
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

  const recalculateAllScores = async () => {
    const { data: latestPlayers } = await supabase.from("players").select("*");
    const { data: latestPredictions } = await supabase
      .from("predictions")
      .select("*");
    const { data: latestMatches } = await supabase.from("matches").select("*");
    const { data: latestBonusLogs } = await supabase
      .from("bonus_logs")
      .select("*");

    const playerList = latestPlayers || [];
    const predictionList = latestPredictions || [];
    const matchList = latestMatches || [];
    const bonusList = latestBonusLogs || [];

    for (const player of playerList) {
      const playerPredictions = predictionList.filter(
        (p) => p.player_id === player.id,
      );
      let correct = 0,
        wrong = 0,
        blank = 0,
        predictionPoints = 0;

      for (const pred of playerPredictions) {
        const predMatch = matchList.find((m) => m.id === pred.match_id);
        if (!predMatch?.result) continue;

        const prediction = String(pred.prediction || "").trim();
        const points = getPredictionCalculatedPoints(pred, predMatch);

        if (prediction === "YOK") {
          blank++;
        } else if (
          prediction !== "BILINMIYOR" &&
          isPredictionCorrect(pred, predMatch)
        ) {
          correct++;
        } else if (prediction !== "BILINMIYOR") {
          wrong++;
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
    const { data: latestPlayers } = await supabase.from("players").select("*");
    const { data: latestPredictions } = await supabase
      .from("predictions")
      .select("*")
      .eq("match_id", match.id);

    const playerList = latestPlayers || [];
    const predictionList = latestPredictions || [];

    for (const player of playerList) {
      const exists = predictionList.some(
        (p) => p.player_id === player.id && p.match_id === match.id,
      );

      if (!exists) {
        await supabase.from("predictions").insert({
          player_id: player.id,
          match_id: match.id,
          prediction: "YOK",
          points: -3,
          is_joker: false,
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

    const { error } = await supabase
      .from("matches")
      .update({
        result,
        home_score: homeScore ?? null,
        away_score: awayScore ?? null,
      })
      .eq("id", match.id);

    if (error) {
      alert(error.message);
      return;
    }

    await recalculateAllScores();
    await loadData();
    alert("Skor ve puanlar güncellendi ✅");
  };

  const submitScore = async (match: Match) => {
    const score = scoreInputs[match.id];
    if (!score?.home || !score?.away) {
      alert("Skorları gir 😄");
      return;
    }
    const home = Number(score.home),
      away = Number(score.away);
    if (Number.isNaN(home) || Number.isNaN(away)) {
      alert("Skorlar sayı olmalı 😄");
      return;
    }
    if (!isGroupStageMatch(match) && home === away) {
      alert(
        "Grup maçlarından sonra beraberlik yok. Eleme maçında kazanan tarafa göre skor gir 😄",
      );
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
      const home = cols[0]?.trim(),
        away = cols[1]?.trim();
      const stage = cols[2]?.trim(),
        time = cols[3]?.trim();
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

  const saveTeamStatus = async (teamName: string, status: TeamStatusValue) => {
    if (!teamName.trim()) return;

    const { error } = await supabase.from("team_statuses").upsert(
      {
        team_name: teamName.trim(),
        status,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "team_name" },
    );

    if (error) {
      alert(error.message);
      return;
    }

    setTeamStatuses((prev) => {
      const exists = prev.some(
        (item) => normalizeTeamName(item.team_name) === normalizeTeamName(teamName),
      );
      if (exists) {
        return prev.map((item) =>
          normalizeTeamName(item.team_name) === normalizeTeamName(teamName)
            ? { ...item, status, updated_at: new Date().toISOString() }
            : item,
        );
      }
      return [
        ...prev,
        { team_name: teamName.trim(), status, updated_at: new Date().toISOString() },
      ];
    });
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

  // LOGIN EKRANI
  if (!currentPlayer) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#FFF7E8] p-4 text-slate-900">
        <div className="pointer-events-none fixed left-[-8rem] top-[-8rem] h-80 w-80 rounded-full bg-amber-300/40 blur-3xl" />
        <div className="pointer-events-none fixed right-[-8rem] bottom-[-8rem] h-80 w-80 rounded-full bg-red-300/30 blur-3xl" />
        <div className="relative w-full max-w-md overflow-hidden rounded-[2rem] border-4 border-red-100 bg-white p-8 shadow-2xl shadow-red-100">
          <div className="mb-4 flex justify-center">
            <img
              src={MASCOT_SRC}
              alt="ORS maskotu"
              className="h-44 w-44 rounded-full object-contain drop-shadow-xl"
            />
          </div>
          <h1 className="text-center text-2xl font-black">ORS Kahvaltı Ligi</h1>
          <p className="mb-6 text-center font-bold text-red-500">
            Dünya Kupası Edition
          </p>
          <input
            value={loginName}
            onChange={(e) => setLoginName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && login()}
            placeholder="Kullanıcı adını gir"
            className="mb-3 w-full rounded-2xl border border-amber-100 bg-amber-50/40 p-4 outline-none"
          />
          <input
            value={loginCode}
            onChange={(e) => setLoginCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && login()}
            placeholder="Şifreni gir"
            type="password"
            className="mb-4 w-full rounded-2xl border border-amber-100 bg-amber-50/40 p-4 outline-none"
          />
          <button
            onClick={login}
            className="w-full rounded-2xl bg-amber-400 p-4 font-black text-slate-950"
          >
            Giriş Yap
          </button>
          <p className="mt-3 text-center text-xs font-bold text-slate-400">
            Her oyuncu kendi özel şifresiyle giriş yapar 🔐
          </p>
        </div>
      </main>
    );
  }

  const tabs = currentPlayer.is_admin
    ? [
        "dashboard",
        "tahmin",
        "maclar",
        "profil",
        "karsilastir",
        "takimlar",
        "agac",
        "kurallar",
        "admin",
      ]
    : [
        "dashboard",
        "tahmin",
        "maclar",
        "profil",
        "karsilastir",
        "takimlar",
        "agac",
        "kurallar",
      ];

  return (
    <TeamStatusContext.Provider value={teamStatusMap}>
      <main className="relative min-h-screen overflow-hidden bg-[#FFF7E8] text-slate-900">
      <div className="pointer-events-none fixed left-[-10rem] top-[-10rem] h-96 w-96 rounded-full bg-amber-300/40 blur-3xl" />
      <div className="pointer-events-none fixed right-[-12rem] top-32 h-[28rem] w-[28rem] rounded-full bg-red-300/30 blur-3xl" />
      <div className="pointer-events-none fixed bottom-[-12rem] left-1/3 h-[24rem] w-[24rem] rounded-full bg-orange-200/50 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-4 pb-28 md:py-8">
        {/* HEADER */}
        <header className="relative mb-4 overflow-hidden rounded-[1.75rem] border-4 border-red-100 bg-white p-4 shadow-2xl shadow-red-100 md:mb-6 md:rounded-[2rem] md:p-8">
          <div className="absolute -right-4 -top-4 hidden h-44 w-44 rotate-6 rounded-full bg-amber-100 md:block" />
          <img
            src={MASCOT_SRC}
            alt="ORS maskotu"
            className="absolute right-6 top-2 hidden h-44 w-44 object-contain drop-shadow-xl md:block"
          />

          <h1 className="relative text-[2.35rem] font-black leading-none md:text-5xl">
            ORS Kahvaltı Ligi
          </h1>
          <p className="relative mt-1 text-[1.55rem] font-black leading-tight text-red-500 md:mt-2 md:text-4xl">
            World Cup 2026 Edition 🏆
          </p>
          <p className="relative mb-3 mt-3 inline-flex rounded-full bg-amber-100 px-3 py-1.5 text-xs font-black text-amber-700 md:mb-6 md:px-4 md:py-2 md:text-sm">
            Tahmin Et • Kazan • Kahvaltıdan Kaç 🥯
          </p>
          <p className="mb-4 font-bold text-slate-600">
            Hoş geldin <b>{currentPlayer.name}</b> 😄
          </p>

          <div className="mb-6 flex flex-wrap gap-2">
            <button
              onClick={enableNotifications}
              className={`rounded-full px-4 py-2 text-sm font-black transition ${notificationsEnabled ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600 hover:bg-red-200"}`}
            >
              {notificationsEnabled ? "🔔 Bildirim açık" : "🔕 Bildirim aç"}
            </button>
            <button
              onClick={loadData}
              disabled={refreshing}
              className={`rounded-full px-4 py-2 text-sm font-black transition ${refreshing ? "bg-slate-200 text-slate-500" : "bg-slate-900 text-white hover:bg-slate-700"}`}
            >
              {refreshing ? "⏳ Güncelleniyor..." : "🔄 Güncelle"}
            </button>
            {currentPlayer.is_admin && (
              <button
                onClick={() => shareUpcomingMatches(matches)}
                className="rounded-full bg-green-500 px-4 py-2 text-sm font-black text-white hover:bg-green-600 transition"
              >
                📢 WhatsApp Hatırlat
              </button>
            )}
            {currentPlayer.is_admin && (
              <button
                onClick={() => shareDailySummary(players, matches, predictions)}
                className="rounded-full bg-amber-400 px-4 py-2 text-sm font-black text-slate-950 hover:bg-amber-500 transition"
              >
                🌅 Dünün Özeti
              </button>
            )}
            <button
              onClick={logout}
              className="rounded-full bg-red-500 px-4 py-2 text-sm font-black text-white"
            >
              Çıkış
            </button>
            {lastUpdatedAt && (
              <div className="w-full text-xs font-bold text-slate-400">
                Son güncelleme:{" "}
                {lastUpdatedAt.toLocaleTimeString("tr-TR", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </div>
            )}
          </div>

          <div className="mb-6 hidden flex-wrap gap-3 md:flex">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-2xl px-5 py-3 font-black transition ${activeTab === tab ? "bg-red-500 text-white shadow-lg shadow-red-200" : "bg-amber-50 text-slate-700 hover:bg-amber-100"}`}
              >
                {tab === "dashboard" && "Dashboard"}
                {tab === "tahmin" && "Tahmin Yap"}
                {tab === "maclar" && "Maçlar"}
                {tab === "profil" && "Profil"}
                {tab === "karsilastir" && "Karşılaştır"}
                {tab === "takimlar" && "Takımlar"}
                {tab === "agac" && "Ağaç"}
                {tab === "kurallar" && "Kurallar"}
                {tab === "admin" && "Admin"}
              </button>
            ))}
          </div>

          <StageFilter
            selectedStage={selectedStage}
            setSelectedStage={setSelectedStage}
          />
        </header>

        {/* DASHBOARD */}
        {activeTab === "dashboard" && (
          <section className="rounded-[1.75rem] border-4 border-red-50 bg-white p-4 shadow-2xl shadow-red-100/70 md:rounded-[2rem] md:p-6">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-black">🏆 Dashboard</h2>

              {currentPlayer.is_admin && (
                <button
                  onClick={() =>
                    downloadPDFReport(players, matches, predictions)
                  }
                  className="rounded-full bg-slate-900 px-4 py-2 text-sm font-black text-white hover:bg-slate-700 transition"
                >
                  📄 PDF Rapor
                </button>
              )}
            </div>
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
                  breakfastLinePlayers.map((p) => p.name).join(" • ") || "-"
                }
                note="Genel toplamda en düşük puanlılar"
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

            <StatsPanel
              players={players}
              matches={matches}
              predictions={predictions}
            />

            <div className="mb-6 rounded-[2rem] border border-amber-100 bg-white p-5 shadow-xl shadow-red-100/50">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-black">🏅 Puan Tablosu</h3>
                  <p className="mt-1 text-sm font-bold text-slate-500">
                    Genel sıralama, başarı oranı, seri ve joker kazanma sayısı.
                  </p>
                </div>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">
                  {sortedPlayers.length} oyuncu
                </span>
              </div>
              <ScoreTable
                sortedPlayers={sortedPlayers}
                playerStreaks={playerStreaks}
                matches={matches}
                predictions={predictions}
                onProfile={(id) => {
                  setProfilePlayerId(id);
                  setActiveTab("profil");
                }}
              />
            </div>

            <MissingPredictionsPanel
              players={players}
              matches={matches}
              predictions={predictions}
            />

            <DailyAwardsPanel
              players={players}
              matches={matches}
              predictions={predictions}
            />

            <MatchDifficultyPanel
              players={players}
              matches={matches}
              predictions={predictions}
            />

            <ChampionLiveStatus players={players} matches={matches} />
          </section>
        )}

        {/* TAHMIN */}
        {activeTab === "tahmin" && (
          <section className="rounded-[1.75rem] border-4 border-red-50 bg-white p-4 shadow-2xl shadow-red-100/70 md:rounded-[2rem] md:p-6">
            <h2 className="mb-6 text-xl font-black">🎯 Tahmin Yap</h2>

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
                    p.match_id === match.id && p.player_id === currentPlayer.id,
                );
                const consensus = getConsensus(match.id);
                const isStarted =
                  new Date(match.match_time).getTime() <= Date.now();
                const status = getMatchStatus(match);
                const predictionOptions = getPredictionOptions(match);
                const predictionGridClass =
                  predictionOptions.length === 3
                    ? "grid grid-cols-3 gap-2"
                    : "grid grid-cols-2 gap-2";

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
                      <div className="space-y-3">
                        <div className={predictionGridClass}>
                          {predictionOptions.map((v) => (
                            <button
                              key={v}
                              onClick={() => makePrediction(match, v, false)}
                              className={`rounded-2xl py-3 text-lg font-black md:py-3 md:text-base ${myPrediction?.prediction === v && !myPrediction?.is_joker ? "bg-amber-400 text-slate-950" : "border border-amber-100 bg-white hover:bg-amber-100"}`}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                        <div className={predictionGridClass}>
                          {predictionOptions.map((v) => {
                            const stageJoker = getUsedJokerForStage(
                              match,
                              currentPlayer.id,
                            );
                            const jokerBlocked =
                              !!stageJoker && stageJoker.match_id !== match.id;
                            return (
                              <button
                                key={`joker-${v}`}
                                onClick={() => makePrediction(match, v, true)}
                                disabled={jokerBlocked}
                                className={`rounded-2xl border-2 py-2 text-xs font-black transition ${myPrediction?.prediction === v && myPrediction?.is_joker ? "border-purple-500 bg-purple-600 text-white shadow-lg shadow-purple-200" : jokerBlocked ? "cursor-not-allowed border-slate-100 bg-slate-100 text-slate-400" : "border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100"}`}
                              >
                                🃏 Joker {v}
                              </button>
                            );
                          })}
                        </div>
                        <div className="rounded-2xl border border-purple-100 bg-purple-50 px-3 py-2 text-xs font-bold text-purple-700">
                          🃏 Joker kuralı: Her aşamada 1 hak. Doğru joker +6,
                          yanlış joker -2.
                          {!isGroupStageMatch(match) &&
                            " Eleme maçlarında beraberlik seçeneği yok."}
                        </div>
                      </div>
                    )}

                    {myPrediction && (
                      <p className="mt-3 text-sm font-bold text-amber-600">
                        Tahminin: {myPrediction.prediction}
                        {myPrediction.is_joker ? " 🃏 Jokerli" : ""}
                      </p>
                    )}

                    {myPrediction && (
                      <div className="mt-4 rounded-2xl border-2 border-amber-200 bg-amber-50 px-3 py-2.5 text-sm font-black text-amber-900">
                        💬 {getMatchVibe(match, predictions, players)}
                      </div>
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
                          {predictionOptions.map((v) => {
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

        {/* MAÇLAR */}
        {activeTab === "maclar" && (
          <section className="rounded-[1.75rem] border-4 border-red-50 bg-white p-4 shadow-2xl shadow-red-100/70 md:rounded-[2rem] md:p-6">
            <h2 className="mb-6 text-xl font-black">⚽ Maçlar</h2>
            <FilterButtons
              value={matchListFilter}
              onChange={setMatchListFilter}
            />

            <div className="mb-5 rounded-[1.5rem] border border-amber-100 bg-amber-50/50 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-black text-slate-700">
                    📅 Tarihe göre filtrele
                  </div>
                  <div className="text-xs font-bold text-slate-500">
                    Seçilen gün 06:00 - ertesi gün 05:59 arası kabul edilir.
                  </div>
                </div>
                {selectedMatchDate && (
                  <button
                    onClick={() => setSelectedMatchDate("")}
                    className="rounded-full bg-white px-4 py-2 text-xs font-black text-red-500 shadow-sm hover:bg-red-50"
                  >
                    Temizle
                  </button>
                )}
              </div>
              <input
                type="date"
                value={selectedMatchDate}
                onChange={(e) => setSelectedMatchDate(e.target.value)}
                className="w-full rounded-2xl border border-amber-100 bg-white p-3 font-black text-slate-700 outline-none md:max-w-xs"
              />
              {selectedMatchDate && (
                <div className="mt-3 text-xs font-black text-amber-700">
                  Seçili tarih filtresi aktif:{" "}
                  {new Date(selectedMatchDate + "T12:00:00").toLocaleDateString(
                    "tr-TR",
                    { day: "2-digit", month: "long", year: "numeric" },
                  )}
                </div>
              )}
            </div>

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
                            p.match_id === match.id,
                        );
                        return (
                          <div
                            key={player.id}
                            className="flex justify-between rounded-xl border border-slate-100 bg-white px-3 py-2"
                          >
                            <span>{player.name}</span>
                            <span className="font-black">
                              {!match.result && !currentPlayer.is_admin
                                ? "Gizli 🔒"
                                : pred
                                  ? `${pred.prediction}${pred.is_joker ? " 🃏" : ""} (${getPredictionCalculatedPoints(pred, match)})`
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

        {/* PROFIL */}
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

            <BadgePanel
              player={profilePlayer}
              sortedPlayers={sortedPlayers}
              playerStreaks={playerStreaks}
              predictions={predictions}
              matches={matches}
            />

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

            <LastFiveFormCard
              player={profilePlayer}
              matches={matches}
              predictions={predictions}
            />

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
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-xl font-black">📜 Tüm Tahmin Geçmişi</h3>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-500">
                  {profilePredictions.length} maç
                </span>
              </div>
              <div className="space-y-2">
                {profilePredictions.map((p) => (
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
                      {p.is_joker ? " 🃏" : ""}
                    </div>
                    <div className="text-sm font-bold">
                      Sonuç: {p.match?.result || "—"}
                    </div>
                    <div className="rounded-lg bg-slate-100 px-3 py-1 text-sm font-black">
                      {p.match?.result
                        ? getPredictionPointLabel(p, p.match as Match)
                        : "Bekliyor"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* KARŞILAŞTIR */}
        {activeTab === "karsilastir" && (
          <section className="rounded-[1.75rem] border-4 border-red-50 bg-white p-4 shadow-2xl shadow-red-100/70 md:rounded-[2rem] md:p-6">
            <RivalCompare
              players={players}
              sortedPlayers={sortedPlayers}
              predictions={predictions}
              matches={matches}
              playerStreaks={playerStreaks}
              leftId={compareLeftId}
              rightId={compareRightId}
              setLeftId={setCompareLeftId}
              setRightId={setCompareRightId}
              onProfile={(id) => {
                setProfilePlayerId(id);
                setActiveTab("profil");
              }}
            />
          </section>
        )}

        {/* TAKIMLAR */}
        {activeTab === "takimlar" && (
          <section className="rounded-[1.75rem] border-4 border-red-50 bg-white p-4 shadow-2xl shadow-red-100/70 md:rounded-[2rem] md:p-6">
            <TeamInfoPage matches={matches} players={players} />
          </section>
        )}

        {/* TURNUVA AĞACI */}
        {activeTab === "agac" && (
          <section className="rounded-[1.75rem] border-4 border-red-50 bg-white p-4 shadow-2xl shadow-red-100/70 md:rounded-[2rem] md:p-6">
            <TournamentTree
              matches={matches}
              players={players}
              currentPlayer={currentPlayer}
            />
          </section>
        )}

        {/* KURALLAR */}
        {activeTab === "kurallar" && (
          <section className="rounded-[1.75rem] border-4 border-red-50 bg-white p-4 shadow-2xl shadow-red-100/70 md:rounded-[2rem] md:p-6">
            <RulesPage />
          </section>
        )}

        {/* ADMIN */}
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
                  onKeyDown={(e) =>
                    e.key === "Enter" &&
                    (adminPassword === ADMIN_PASSWORD
                      ? setAdminUnlocked(true)
                      : alert("Şifre yanlış 😄"))
                  }
                  placeholder="Admin şifresi"
                  className="mb-3 w-full rounded-2xl border border-amber-100 bg-white p-3"
                />
                <button
                  onClick={() =>
                    adminPassword === ADMIN_PASSWORD
                      ? setAdminUnlocked(true)
                      : alert("Şifre yanlış 😄")
                  }
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

                <div className="mb-6 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-black">
                        🚦 Takım Durumu Yönetimi
                      </h3>
                      <p className="text-sm font-bold text-slate-500">
                        Eleneni seçersen uygulamanın her yerinde gri görünür.
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-500">
                      {tournamentTeams.length} takım
                    </span>
                  </div>

                  <div className="grid max-h-[28rem] gap-2 overflow-y-auto pr-1 md:grid-cols-2">
                    {tournamentTeams.map((team) => {
                      const currentStatus = getTeamStatusValue(team);
                      return (
                        <div
                          key={team}
                          className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white p-3 ${
                            currentStatus === "eliminated"
                              ? "border-slate-200 bg-slate-100"
                              : "border-amber-100"
                          }`}
                        >
                          <div className="min-w-0 font-black">
                            <TeamName team={team} showStatus />
                          </div>
                          <select
                            value={currentStatus}
                            onChange={(e) =>
                              saveTeamStatus(team, e.target.value as TeamStatusValue)
                            }
                            className="rounded-xl border border-amber-100 bg-amber-50/50 p-2 text-sm font-black outline-none"
                          >
                            <option value="active">✅ Devam ediyor</option>
                            <option value="risk">⚠️ Riskli</option>
                            <option value="eliminated">❌ Elendi</option>
                            <option value="champion">🏆 Şampiyon</option>
                          </select>
                        </div>
                      );
                    })}
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

                <div className="mb-5 rounded-[1.75rem] border border-amber-100 bg-white p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-lg font-black">
                      🔎 Skor Giriş Filtresi
                    </h3>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">
                      {adminScoreMatches.length} maç gösteriliyor
                    </span>
                  </div>

                  <input
                    value={adminScoreSearch}
                    onChange={(e) => setAdminScoreSearch(e.target.value)}
                    placeholder="Takım / aşama ara: İran, Yeni Zelanda, Final..."
                    className="mb-3 w-full rounded-2xl border border-amber-100 bg-amber-50/40 p-3 font-bold outline-none focus:border-amber-300"
                  />

                  <div className="flex flex-wrap gap-2">
                    {[
                      "Skor Bekleyenler",
                      "Bugün",
                      "Yarın",
                      "Açık",
                      "Sonuçlananlar",
                      "Tümü",
                    ].map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setAdminScoreFilter(filter)}
                        className={`rounded-full px-4 py-2 text-sm font-black transition ${
                          adminScoreFilter === filter
                            ? "bg-slate-950 text-white"
                            : "bg-amber-50 text-slate-700 hover:bg-amber-100"
                        }`}
                      >
                        {filter === "Skor Bekleyenler"
                          ? "🔴 Skor Bekleyenler"
                          : filter}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  {adminScoreMatches.length === 0 && (
                    <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5 font-bold text-slate-500">
                      Bu arama/filtreye uygun maç yok 😄
                    </div>
                  )}

                  {adminScoreMatches.map((match) => {
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

                        {!match.result && (
                          <div className="mb-2">
                            <button
                              onClick={() => shareMatchReminder(match)}
                              className="w-full rounded-xl bg-green-500 px-3 py-2 text-sm font-black text-white hover:bg-green-600 transition"
                            >
                              📲 Bu Maçı Grupla Paylaş
                            </button>
                          </div>
                        )}

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
                                    playerId: prev[match.id]?.playerId || "",
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
                                    playerId: prev[match.id]?.playerId || "",
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

      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAdmin={!!currentPlayer.is_admin}
      />
      </main>
    </TeamStatusContext.Provider>
  );
}

// === COMPONENTLER ===

function LastFiveFormCard({
  player,
  matches,
  predictions,
}: {
  player: Player;
  matches: Match[];
  predictions: Prediction[];
}) {
  const form = getLastFiveForm(player.id, matches, predictions);
  const summary = getFormSummary(form);

  return (
    <div className="mb-6 rounded-[1.75rem] border border-amber-100 bg-white p-5 shadow-xl shadow-amber-100/50">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-black">📈 Son 5 Maç Form Grafiği</h3>
          <p className="mt-1 text-sm font-bold text-slate-500">
            Sonuçlanan son 5 tahminden hesaplanır.
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-black ${summary.cls}`}
        >
          {summary.text} • {summary.note}
        </span>
      </div>

      {form.length === 0 ? (
        <div className="rounded-2xl bg-amber-50 p-4 text-sm font-bold text-slate-500">
          Henüz form grafiği için sonuçlanan maç yok 😄
        </div>
      ) : (
        <>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={form}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  formatter={(value: any) => [
                    `${Number(value) > 0 ? "+" : ""}${value} puan`,
                    "Puan",
                  ]}
                  labelFormatter={(label) => `${label}`}
                />
                <Bar dataKey="points" fill="#f59e0b" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 grid gap-2 md:grid-cols-5">
            {form.map((item, idx) => (
              <div
                key={`${player.id}-form-${idx}`}
                className="rounded-2xl border border-amber-100 bg-amber-50/60 p-3"
              >
                <div className="text-lg">
                  {item.icon} {item.is_joker ? "🃏" : ""}
                </div>
                <div className="mt-1 text-xs font-black text-slate-400">
                  {item.date}
                </div>
                <div className="mt-1 line-clamp-2 text-xs font-bold text-slate-600">
                  {item.matchName}
                </div>
                <div className="mt-2 text-sm font-black text-slate-900">
                  {item.prediction} → {item.result}
                </div>
                <div
                  className={`mt-1 text-sm font-black ${item.points >= 0 ? "text-emerald-700" : "text-red-600"}`}
                >
                  {item.points > 0 ? "+" : ""}
                  {item.points} puan
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ChampionLiveStatus({
  players,
  matches,
}: {
  players: Player[];
  matches: Match[];
}) {
  const teamStatusMap = useContext(TeamStatusContext);

  const getManualChampionStatus = (team: string) => {
    const manualStatus = teamStatusMap[normalizeTeamName(team)] || "active";
    if (manualStatus === "eliminated") {
      return {
        text: "Elendi",
        cls: "bg-slate-200 text-slate-600",
        detail: "Admin tarafından elendi olarak işaretlendi 🧨",
      };
    }
    if (manualStatus === "risk") {
      return {
        text: "Riskli",
        cls: "bg-amber-100 text-amber-700",
        detail: "Admin tarafından riskli olarak işaretlendi ⚠️",
      };
    }
    if (manualStatus === "champion") {
      return {
        text: "Şampiyon",
        cls: "bg-yellow-100 text-yellow-800",
        detail: "Admin tarafından şampiyon olarak işaretlendi 🏆",
      };
    }
    return getChampionLiveStatus(team, matches);
  };

  const grouped = useMemo(() => {
    const map: Record<string, Player[]> = {};
    players.forEach((player) => {
      if (!player.champion_team || isPlaceholderTeamName(player.champion_team))
        return;
      if (!map[player.champion_team]) map[player.champion_team] = [];
      map[player.champion_team].push(player);
    });

    return Object.entries(map)
      .map(([team, pickers]) => ({
        team,
        pickers,
        status: getManualChampionStatus(team),
      }))
      .sort((a, b) => {
        const order: Record<string, number> = {
          Şampiyon: 0,
          Yaşıyor: 1,
          Riskli: 2,
          Elendi: 3,
        };
        const statusDiff =
          (order[a.status.text] ?? 9) - (order[b.status.text] ?? 9);
        if (statusDiff !== 0) return statusDiff;
        return b.pickers.length - a.pickers.length;
      });
  }, [players, matches, teamStatusMap]);

  return (
    <div className="mb-6 rounded-[2rem] border border-rose-100 bg-white p-5 shadow-xl shadow-red-100/50">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-black">
            🏆 Şampiyon Tahmini Canlı Durumu
          </h3>
          <p className="mt-1 text-sm font-bold text-slate-500">
            Takımların durumu admin seçimi ve maç sonuçlarına göre yorumlanır.
          </p>
        </div>
        <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-black text-rose-700">
          {grouped.length} takım seçildi
        </span>
      </div>

      {grouped.length === 0 ? (
        <div className="rounded-2xl bg-amber-50 p-4 text-sm font-bold text-slate-500">
          Henüz şampiyon tahmini yok.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {grouped.map(({ team, pickers, status }) => (
            <div
              key={team}
              className="rounded-[1.5rem] border border-amber-100 bg-amber-50/50 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="text-lg font-black">
                  <TeamName team={team} />
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${status.cls}`}
                >
                  {status.text}
                </span>
              </div>
              <div className="mt-2 text-sm font-bold text-slate-500">
                {status.detail}
              </div>
              <div className="mt-3 rounded-2xl bg-white p-3 text-sm font-black text-slate-700">
                {pickers.map((p) => p.name).join(" • ")}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatsPanel({
  players,
  matches,
  predictions,
}: {
  players: Player[];
  matches: Match[];
  predictions: Prediction[];
}) {
  const stats = useMemo(
    () => computeStats(players, matches, predictions),
    [players, matches, predictions],
  );
  return (
    <div className="mb-6 rounded-[2rem] border border-amber-100 bg-white p-5 shadow-xl shadow-red-100/50">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-xl font-black">📊 Turnuva İstatistikleri</h3>
        <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-black text-purple-700">
          Canlı veri
        </span>
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-4">
          <div className="text-3xl">🎯</div>
          <div className="mt-2 text-xs font-black uppercase tracking-wide text-emerald-700">
            Turnuvanın Kahini
          </div>
          <div className="mt-1 text-2xl font-black text-slate-950">
            {stats.kahin?.player.name || "—"}
          </div>
          <div className="text-sm font-bold text-emerald-700">
            %{stats.kahin?.rate || 0} başarı • {stats.kahin?.correct || 0}/
            {stats.kahin?.finished || 0}
          </div>
        </div>
        <div className="rounded-[1.5rem] border border-red-200 bg-red-50 p-4">
          <div className="text-3xl">💔</div>
          <div className="mt-2 text-xs font-black uppercase tracking-wide text-red-700">
            Turnuvanın Kurbanı
          </div>
          <div className="mt-1 text-2xl font-black text-slate-950">
            {stats.kurban?.player.name || "—"}
          </div>
          <div className="text-sm font-bold text-red-700">
            %{stats.kurban?.rate || 0} başarı • {stats.kurban?.correct || 0}/
            {stats.kurban?.finished || 0}
          </div>
        </div>
        <div className="rounded-[1.5rem] border border-blue-200 bg-blue-50 p-4">
          <div className="text-3xl">📊</div>
          <div className="mt-2 text-xs font-black uppercase tracking-wide text-blue-700">
            Tahmin Dağılımı
          </div>
          <div className="mt-3 space-y-2">
            {(["1", "X", "2"] as const).map((v) => (
              <div key={v} className="flex items-center gap-2">
                <div className="w-6 text-center text-sm font-black">{v}</div>
                <div className="relative h-5 flex-1 overflow-hidden rounded-full bg-white">
                  <div
                    className="h-full rounded-full bg-blue-400"
                    style={{ width: `${stats.distPct[v]}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-end pr-2 text-xs font-black">
                    %{stats.distPct[v]}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-4">
          <div className="text-3xl">🐑</div>
          <div className="mt-2 text-xs font-black uppercase tracking-wide text-amber-700">
            Sürü Üyesi
          </div>
          <div className="mt-1 text-2xl font-black text-slate-950">
            {stats.suruUyesi?.player.name || "—"}
          </div>
          <div className="text-sm font-bold text-amber-700">
            %{stats.suruUyesi?.herdPct || 0} çoğunlukla aynı
          </div>
        </div>
        <div className="rounded-[1.5rem] border border-purple-200 bg-purple-50 p-4">
          <div className="text-3xl">⚡</div>
          <div className="mt-2 text-xs font-black uppercase tracking-wide text-purple-700">
            Aykırı Düşünen
          </div>
          <div className="mt-1 text-2xl font-black text-slate-950">
            {stats.asi?.player.name || "—"}
          </div>
          <div className="text-sm font-bold text-purple-700">
            %{stats.asi?.herdPct || 0} çoğunlukla aynı
          </div>
        </div>
        <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 p-4">
          <div className="text-3xl">🏆</div>
          <div className="mt-2 text-xs font-black uppercase tracking-wide text-rose-700">
            Şampiyon Tahminleri
          </div>
          <div className="mt-2 space-y-1 max-h-32 overflow-auto">
            {Object.entries(stats.championPicks).length === 0 ? (
              <div className="text-sm font-bold text-slate-500">
                Henüz tahmin yok
              </div>
            ) : (
              Object.entries(stats.championPicks).map(([team, names]) => (
                <div key={team} className="text-sm font-bold text-slate-700">
                  <span className="text-rose-700">{team}</span>:{" "}
                  {names.join(", ")}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MissingPredictionsPanel({
  players,
  matches,
  predictions,
}: {
  players: Player[];
  matches: Match[];
  predictions: Prediction[];
}) {
  const openMatches = useMemo(() => {
    const now = Date.now();
    return matches
      .filter(
        (match) => !match.result && new Date(match.match_time).getTime() > now,
      )
      .sort(
        (a, b) =>
          new Date(a.match_time).getTime() - new Date(b.match_time).getTime(),
      )
      .slice(0, 8)
      .map((match) => {
        const matchPredictions = predictions.filter(
          (pred) => pred.match_id === match.id,
        );
        const missingPlayers = players.filter(
          (player) =>
            !matchPredictions.some((pred) => pred.player_id === player.id),
        );
        return {
          match,
          missingPlayers,
          predictedCount: players.length - missingPlayers.length,
        };
      });
  }, [players, matches, predictions]);

  const totalMissing = openMatches.reduce(
    (sum, item) => sum + item.missingPlayers.length,
    0,
  );
  const nextProblem = [...openMatches].sort(
    (a, b) => b.missingPlayers.length - a.missingPlayers.length,
  )[0];

  return (
    <div className="mb-6 rounded-[2rem] border border-orange-100 bg-white p-5 shadow-xl shadow-orange-100/60">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-black">🚨 Tahmin Yapmayanlar Panosu</h3>
          <p className="mt-1 text-sm font-bold text-slate-500">
            Başlamamış maçlarda tahmini eksik kalanları gösterir.
          </p>
        </div>
        <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-700">
          {totalMissing} eksik tahmin
        </span>
      </div>

      {openMatches.length === 0 ? (
        <div className="rounded-2xl bg-emerald-50 p-4 text-sm font-black text-emerald-700">
          Şu an açık maç yok; kahvaltı hattı kısa süreli huzurda 😄
        </div>
      ) : (
        <>
          {nextProblem && nextProblem.missingPlayers.length > 0 && (
            <div className="mb-4 rounded-[1.5rem] border border-red-100 bg-red-50 p-4">
              <div className="text-xs font-black uppercase tracking-wide text-red-600">
                En acil maç
              </div>
              <div className="mt-1 text-lg font-black text-slate-950">
                <TeamName team={nextProblem.match.home_team} /> vs{" "}
                <TeamName team={nextProblem.match.away_team} />
              </div>
              <div className="mt-2 text-sm font-bold text-red-700">
                Tahmin beklenenler: {nextProblem.missingPlayers.map((p) => p.name).join(" • ")}
              </div>
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {openMatches.map(({ match, missingPlayers, predictedCount }) => (
              <div
                key={match.id}
                className="rounded-[1.5rem] border border-amber-100 bg-amber-50/50 p-4"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="text-base font-black text-slate-950">
                    <TeamName team={match.home_team} /> vs{" "}
                    <TeamName team={match.away_team} />
                  </div>
                  <span className="shrink-0 rounded-full bg-white px-2 py-1 text-xs font-black text-slate-500">
                    {predictedCount}/{players.length}
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-500">
                  {new Date(match.match_time).toLocaleString("tr-TR", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                <div className="mt-3 rounded-2xl bg-white p-3 text-sm font-black text-slate-700">
                  {missingPlayers.length === 0
                    ? "✅ Herkes tahmin yapmış"
                    : missingPlayers.map((p) => p.name).join(" • ")}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function DailyAwardsPanel({
  players,
  matches,
  predictions,
}: {
  players: Player[];
  matches: Match[];
  predictions: Prediction[];
}) {
  const awards = useMemo(() => {
    const finishedMatches = matches
      .filter((match) => !!match.result)
      .sort(
        (a, b) =>
          new Date(b.match_time).getTime() - new Date(a.match_time).getTime(),
      );

    if (finishedMatches.length === 0) {
      return {
        title: "Henüz ödül yok",
        dayMatches: [] as Match[],
        dailyRows: [] as any[],
        weeklyRows: [] as any[],
        surpriseRows: [] as any[],
        jokerRows: [] as any[],
      };
    }

    const latest = new Date(finishedMatches[0].match_time);
    const latestKey = getFootballDayKey(latest);
    const dayMatches = finishedMatches.filter(
      (match) => getFootballDayKey(new Date(match.match_time)) === latestKey,
    );

    const weekStart = new Date(latest);
    weekStart.setDate(weekStart.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);
    const weekMatches = finishedMatches.filter(
      (match) => new Date(match.match_time).getTime() >= weekStart.getTime(),
    );

    const buildRows = (matchList: Match[]) =>
      players
        .map((player) => {
          let points = 0;
          let correct = 0;
          let wrong = 0;
          let jokerPoints = 0;
          let jokerCorrect = 0;
          let surpriseCorrect = 0;

          matchList.forEach((match) => {
            const pred = predictions.find(
              (p) => p.player_id === player.id && p.match_id === match.id,
            );
            if (!pred) return;
            const calculated = getPredictionCalculatedPoints(pred, match);
            points += calculated;
            if (pred.is_joker) jokerPoints += calculated;
            if (isPredictionCorrect(pred, match)) {
              correct++;
              if (pred.is_joker) jokerCorrect++;
              const validPreds = predictions.filter(
                (p) =>
                  p.match_id === match.id &&
                  p.prediction !== "YOK" &&
                  p.prediction !== "BILINMIYOR",
              );
              const samePickCount = validPreds.filter(
                (p) => p.prediction === pred.prediction,
              ).length;
              if (validPreds.length >= 3 && samePickCount <= Math.ceil(validPreds.length / 3)) {
                surpriseCorrect++;
              }
            } else if (match.result && pred.prediction !== "YOK" && pred.prediction !== "BILINMIYOR") {
              wrong++;
            }
          });

          return {
            player,
            points,
            correct,
            wrong,
            jokerPoints,
            jokerCorrect,
            surpriseCorrect,
          };
        })
        .filter((row) => row.correct + row.wrong > 0 || row.points !== 0);

    const dailyRows = buildRows(dayMatches);
    const weeklyRows = buildRows(weekMatches);
    const surpriseRows = [...dailyRows].sort(
      (a, b) => b.surpriseCorrect - a.surpriseCorrect || b.points - a.points,
    );
    const jokerRows = [...dailyRows].sort(
      (a, b) => b.jokerPoints - a.jokerPoints || b.jokerCorrect - a.jokerCorrect,
    );

    return {
      title: `${latest.toLocaleDateString("tr-TR", { day: "2-digit", month: "short" })} ödülleri`,
      dayMatches,
      dailyRows: [...dailyRows].sort((a, b) => b.points - a.points),
      weeklyRows: [...weeklyRows].sort((a, b) => b.points - a.points),
      surpriseRows,
      jokerRows,
    };
  }, [players, matches, predictions]);

  const dailyBest = awards.dailyRows[0];
  const dailyWorst = [...awards.dailyRows].sort((a, b) => a.points - b.points)[0];
  const weeklyBest = awards.weeklyRows[0];
  const jokerBest = awards.jokerRows.find((row) => row.jokerPoints !== 0 || row.jokerCorrect > 0);
  const surpriseBest = awards.surpriseRows.find((row) => row.surpriseCorrect > 0);

  const cards = [
    {
      icon: "🔮",
      title: "Günün Kahini",
      player: dailyBest?.player.name || "—",
      note: dailyBest ? `${dailyBest.points > 0 ? "+" : ""}${dailyBest.points} puan • ${dailyBest.correct} doğru` : "Sonuç bekleniyor",
      cls: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
    {
      icon: "🥲",
      title: "Günün Faciası",
      player: dailyWorst?.player.name || "—",
      note: dailyWorst ? `${dailyWorst.points > 0 ? "+" : ""}${dailyWorst.points} puan • ${dailyWorst.wrong} yanlış` : "Sonuç bekleniyor",
      cls: "border-red-200 bg-red-50 text-red-700",
    },
    {
      icon: "🃏",
      title: "Joker Ustası",
      player: jokerBest?.player.name || "—",
      note: jokerBest ? `${jokerBest.jokerPoints > 0 ? "+" : ""}${jokerBest.jokerPoints} joker puanı` : "Joker sahneye çıkmadı",
      cls: "border-purple-200 bg-purple-50 text-purple-700",
    },
    {
      icon: "🧨",
      title: "Sürpriz Avcısı",
      player: surpriseBest?.player.name || "—",
      note: surpriseBest ? `${surpriseBest.surpriseCorrect} azınlık doğru tahmin` : "Sürpriz yakalanmadı",
      cls: "border-orange-200 bg-orange-50 text-orange-700",
    },
    {
      icon: "🏆",
      title: "Haftanın Formda İsmi",
      player: weeklyBest?.player.name || "—",
      note: weeklyBest ? `${weeklyBest.points > 0 ? "+" : ""}${weeklyBest.points} puan / son 7 gün` : "Haftalık veri bekleniyor",
      cls: "border-amber-200 bg-amber-50 text-amber-700",
    },
  ];

  return (
    <div className="mb-6 rounded-[2rem] border border-purple-100 bg-white p-5 shadow-xl shadow-purple-100/50">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-black">🏆 Haftanın / Günün Ödülleri</h3>
          <p className="mt-1 text-sm font-bold text-slate-500">
            Sonuçlanan en güncel futbol gününe göre otomatik ödül dağıtır.
          </p>
        </div>
        <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-black text-purple-700">
          {awards.title}
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => (
          <div key={card.title} className={`rounded-[1.5rem] border p-4 ${card.cls}`}>
            <div className="text-3xl">{card.icon}</div>
            <div className="mt-2 text-xs font-black uppercase tracking-wide opacity-80">
              {card.title}
            </div>
            <div className="mt-1 text-2xl font-black text-slate-950">
              {card.player}
            </div>
            <div className="mt-1 text-sm font-bold">{card.note}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MatchDifficultyPanel({
  players,
  matches,
  predictions,
}: {
  players: Player[];
  matches: Match[];
  predictions: Prediction[];
}) {
  const difficulty = useMemo(() => {
    const rows = matches
      .filter((match) => !!match.result)
      .map((match) => {
        const validPreds = predictions.filter(
          (pred) =>
            pred.match_id === match.id &&
            pred.prediction !== "YOK" &&
            pred.prediction !== "BILINMIYOR",
        );
        const correctPreds = validPreds.filter((pred) => isPredictionCorrect(pred, match));
        const wrongPreds = validPreds.filter((pred) => !isPredictionCorrect(pred, match));
        const correctRate = validPreds.length > 0 ? Math.round((correctPreds.length / validPreds.length) * 100) : 0;
        const resultText = `${match.home_score ?? ""}-${match.away_score ?? ""}`;
        return {
          match,
          validCount: validPreds.length,
          correctCount: correctPreds.length,
          wrongCount: wrongPreds.length,
          correctRate,
          resultText,
        };
      })
      .filter((row) => row.validCount > 0);

    const hardest = [...rows].sort(
      (a, b) => a.correctRate - b.correctRate || b.wrongCount - a.wrongCount,
    )[0];
    const easiest = [...rows].sort(
      (a, b) => b.correctRate - a.correctRate || b.correctCount - a.correctCount,
    )[0];
    const mostBurned = [...rows].sort(
      (a, b) => b.wrongCount - a.wrongCount || a.correctRate - b.correctRate,
    )[0];
    const topHard = [...rows]
      .sort((a, b) => a.correctRate - b.correctRate || b.wrongCount - a.wrongCount)
      .slice(0, 6);

    return { rows, hardest, easiest, mostBurned, topHard };
  }, [matches, predictions]);

  const summaryCards = [
    {
      icon: "🧠",
      title: "En Zor Maç",
      item: difficulty.hardest,
      note: difficulty.hardest
        ? `%${difficulty.hardest.correctRate} doğru bildi`
        : "Veri bekleniyor",
      cls: "border-purple-200 bg-purple-50 text-purple-700",
    },
    {
      icon: "🍯",
      title: "En Kolay Maç",
      item: difficulty.easiest,
      note: difficulty.easiest
        ? `%${difficulty.easiest.correctRate} doğru bildi`
        : "Veri bekleniyor",
      cls: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
    {
      icon: "🔥",
      title: "En Çok Yakan Maç",
      item: difficulty.mostBurned,
      note: difficulty.mostBurned
        ? `${difficulty.mostBurned.wrongCount}/${difficulty.mostBurned.validCount} kişi yandı`
        : "Veri bekleniyor",
      cls: "border-red-200 bg-red-50 text-red-700",
    },
  ];

  return (
    <div className="mb-6 rounded-[2rem] border border-slate-100 bg-white p-5 shadow-xl shadow-slate-100/70">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-black">🧠 Maç Zorluk Skoru</h3>
          <p className="mt-1 text-sm font-bold text-slate-500">
            Maç zorluğu, doğru bilen kişi oranına göre hesaplanır.
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
          {difficulty.rows.length} sonuçlu maç
        </span>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        {summaryCards.map((card) => (
          <div key={card.title} className={`rounded-[1.5rem] border p-4 ${card.cls}`}>
            <div className="text-3xl">{card.icon}</div>
            <div className="mt-2 text-xs font-black uppercase tracking-wide opacity-80">
              {card.title}
            </div>
            <div className="mt-1 text-lg font-black text-slate-950">
              {card.item ? (
                <>
                  <TeamName team={card.item.match.home_team} /> vs{" "}
                  <TeamName team={card.item.match.away_team} />
                </>
              ) : (
                "—"
              )}
            </div>
            <div className="mt-1 text-sm font-bold">{card.note}</div>
          </div>
        ))}
      </div>

      {difficulty.topHard.length > 0 && (
        <div className="overflow-hidden rounded-[1.5rem] border border-slate-100">
          <div className="grid grid-cols-[1.6fr_0.7fr_0.7fr] bg-slate-50 px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500 md:grid-cols-[1.8fr_0.6fr_0.8fr_0.8fr]">
            <div>Maç</div>
            <div>Sonuç</div>
            <div className="hidden md:block">Doğru</div>
            <div>Zorluk</div>
          </div>
          {difficulty.topHard.map((row) => (
            <div
              key={row.match.id}
              className="grid grid-cols-[1.6fr_0.7fr_0.7fr] items-center border-t border-slate-100 px-4 py-3 text-sm md:grid-cols-[1.8fr_0.6fr_0.8fr_0.8fr]"
            >
              <div className="font-black text-slate-800">
                <TeamName team={row.match.home_team} /> vs{" "}
                <TeamName team={row.match.away_team} />
              </div>
              <div className="font-black text-slate-600">{row.resultText}</div>
              <div className="hidden font-bold text-slate-500 md:block">
                {row.correctCount}/{row.validCount}
              </div>
              <div>
                <div className="mb-1 text-xs font-black text-slate-500">
                  %{row.correctRate}
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-red-100">
                  <div
                    className="h-full rounded-full bg-red-400"
                    style={{ width: `${100 - row.correctRate}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
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
    <div className="mb-6 flex gap-2 overflow-x-auto pb-1 md:flex-wrap">
      {MATCH_FILTERS.map((filter) => (
        <button
          key={filter}
          onClick={() => onChange(filter)}
          className={`shrink-0 rounded-2xl px-4 py-2 font-black transition ${value === filter ? "bg-red-500 text-white shadow-lg shadow-red-200" : "bg-amber-50 text-slate-700 hover:bg-amber-100"}`}
        >
          {filter}
        </button>
      ))}
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
        new Date(a.match_time).getTime() - new Date(b.match_time).getTime(),
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
        <div className="relative grid gap-5 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <div>
            <div className="mb-2 inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-red-600">
              Turnuva Tahmini
            </div>
            <h3 className="text-2xl font-black text-slate-950 md:text-3xl">
              Şampiyonunu seç, +100 puanı kovala
            </h3>
            <p className="mt-2 font-bold text-slate-500">
              Bu tahmin turnuva başlamadan kilitlenir.
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
                  ? "🔒 Tahminler kilitlendi"
                  : "⏳ 11 Haziran 19:00"}
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
                  {selectedTeam ? `${selectedTheme.name} modu` : "Bir ülke seç"}
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

function StageFilter({
  selectedStage,
  setSelectedStage,
}: {
  selectedStage: string;
  setSelectedStage: (stage: string) => void;
}) {
  const compactStages = [
    { label: "Tümü", value: "Tümü" },
    { label: "Gruplar", value: "Gruplar" },
    { label: "Son 32", value: "Son 32" },
    { label: "Son 16", value: "Son 16" },
    { label: "Çeyrek", value: "Çeyrek Final" },
    { label: "Yarı", value: "Yarı Final" },
    { label: "3.lük", value: "Üçüncülük" },
    { label: "Final", value: "Final" },
  ];
  return (
    <div className="mt-3 rounded-[1.5rem] border border-amber-100 bg-gradient-to-r from-amber-50 to-red-50 p-3 md:mt-5 md:rounded-[1.75rem] md:p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-xl">🏆</span>
        <span className="text-sm font-black uppercase tracking-wide text-slate-500">
          Turnuva Aşaması
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 min-[390px]:grid-cols-3 md:flex md:flex-wrap">
        {compactStages.map((stage) => (
          <button
            key={stage.value}
            onClick={() => setSelectedStage(stage.value)}
            className={`rounded-2xl px-3 py-2 text-sm font-black transition md:px-4 ${selectedStage === stage.value ? "bg-red-500 text-white shadow-lg shadow-red-200" : "bg-white text-slate-700 hover:bg-amber-100"}`}
          >
            {stage.label}
          </button>
        ))}
      </div>
    </div>
  );
}

type BadgeItem = { icon: string; title: string; desc: string; tone: string };

function getPlayerBadges(
  player: Player,
  sortedPlayers: Player[],
  playerStreaks: Record<string, number>,
  predictions: Prediction[],
  matches: Match[],
): BadgeItem[] {
  const rank = sortedPlayers.findIndex((p) => p.id === player.id) + 1;
  const totalPlayers = sortedPlayers.length;
  const bottomTwo = sortedPlayers.slice(-2).some((p) => p.id === player.id);
  const answered =
    Number(player.correct_count || 0) + Number(player.wrong_count || 0);
  const correct = Number(player.correct_count || 0);
  const wrong = Number(player.wrong_count || 0);
  const totalPoints = Number(player.total_points || 0);
  const bonus = Number(player.bonus_points || 0);
  const blanks = Number(player.intentional_blank || 0);
  const force = Number(player.force_majeure || 0);
  const success = Number(player.success_rate || 0);
  const streak = playerStreaks[player.id] || 0;

  const finishedPreds = predictions.filter((pred) => {
    const match = matches.find((m) => m.id === pred.match_id);
    return (
      pred.player_id === player.id &&
      !!match?.result &&
      pred.prediction !== "YOK" &&
      pred.prediction !== "BILINMIYOR"
    );
  });
  const allPreds = predictions.filter(
    (pred) =>
      pred.player_id === player.id &&
      pred.prediction !== "YOK" &&
      pred.prediction !== "BILINMIYOR",
  );
  const jokerPreds = allPreds.filter((pred) => !!pred.is_joker);
  const jokerCorrect = jokerPreds.filter((pred) => {
    const match = matches.find((m) => m.id === pred.match_id);
    return isPredictionCorrect(pred, match);
  }).length;
  const jokerWrong = jokerPreds.filter((pred) => {
    const match = matches.find((m) => m.id === pred.match_id);
    return !!match?.result && pred.prediction !== match.result;
  }).length;

  const allPlayersWithSuccess = sortedPlayers
    .filter(
      (p) => Number(p.correct_count || 0) + Number(p.wrong_count || 0) > 0,
    )
    .sort((a, b) => Number(b.success_rate || 0) - Number(a.success_rate || 0));
  const bestSuccessId = allPlayersWithSuccess[0]?.id;
  const worstSuccessId =
    allPlayersWithSuccess[allPlayersWithSuccess.length - 1]?.id;

  const pointsSorted = [...sortedPlayers].sort(
    (a, b) => Number(b.total_points || 0) - Number(a.total_points || 0),
  );
  const leader = pointsSorted[0];
  const leaderGap =
    leader && leader.id !== player.id
      ? Number(leader.total_points || 0) - totalPoints
      : 0;

  let herdTotal = 0;
  let herdMatch = 0;
  let soloCorrect = 0;
  let comebackWins = 0;
  let latePanic = 0;
  let exactUnderdog = 0;
  let homePicks = 0;
  let drawPicks = 0;
  let awayPicks = 0;
  let totalPredictionPoints = 0;

  allPreds.forEach((pred) => {
    if (pred.prediction === "1") homePicks++;
    if (pred.prediction === "X") drawPicks++;
    if (pred.prediction === "2") awayPicks++;

    const match = matches.find((m) => m.id === pred.match_id);
    if (!match) return;
    const diffMinutes =
      (new Date(match.match_time).getTime() - Date.now()) / (1000 * 60);
    if (diffMinutes > 0 && diffMinutes <= 15) latePanic++;

    if (!match.result) return;
    totalPredictionPoints += getPredictionCalculatedPoints(pred, match);

    const matchPreds = predictions.filter(
      (p) =>
        p.match_id === pred.match_id &&
        p.prediction !== "YOK" &&
        p.prediction !== "BILINMIYOR",
    );
    if (matchPreds.length < 3) return;
    const counts = { "1": 0, X: 0, "2": 0 };
    matchPreds.forEach((p) => {
      if (p.prediction in counts) counts[p.prediction as "1" | "X" | "2"]++;
    });
    const sortedCounts = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const majority = sortedCounts[0]?.[0];
    const minority = sortedCounts[2]?.[0];
    if (!majority) return;
    herdTotal++;
    if (pred.prediction === majority) herdMatch++;
    if (
      pred.prediction === minority &&
      pred.prediction === match.result &&
      sortedCounts[2][1] <= 1
    )
      soloCorrect++;
    if (pred.prediction !== majority && pred.prediction === match.result)
      exactUnderdog++;
  });

  // Son 5 sonuç içinde dipten çıkış hissi için küçük bir metrik
  const lastFinished = finishedPreds.slice(-5);
  if (lastFinished.length >= 3) {
    const positives = lastFinished.filter((p) => {
      const match = matches.find((m) => m.id === p.match_id);
      return getPredictionCalculatedPoints(p, match) > 0;
    }).length;
    if (positives >= 3 && bottomTwo) comebackWins = positives;
  }

  const herdPct = herdTotal > 0 ? Math.round((herdMatch / herdTotal) * 100) : 0;
  const favoritePick = Math.max(homePicks, drawPicks, awayPicks);
  const favoritePickLabel =
    favoritePick === homePicks ? "1" : favoritePick === awayPicks ? "2" : "X";

  const add = (condition: boolean, badge: BadgeItem) => {
    if (condition) badges.push(badge);
  };

  const badges: BadgeItem[] = [];

  add(rank === 1, {
    icon: "👑",
    title: "Genel Lider",
    desc: "Puan tablosunun tepesinde",
    tone: "bg-amber-100 text-amber-800 border-amber-200",
  });
  add(rank === 2, {
    icon: "🥈",
    title: "Gümüş Koltuk",
    desc: "Liderin ensesinde",
    tone: "bg-slate-100 text-slate-700 border-slate-200",
  });
  add(rank === 3, {
    icon: "🥉",
    title: "Bronz Güç",
    desc: "Podyumda sağlam duruyor",
    tone: "bg-orange-100 text-orange-800 border-orange-200",
  });
  add(rank <= 3, {
    icon: "🏆",
    title: "Podyum Oyuncusu",
    desc: `Sıralama: #${rank}`,
    tone: "bg-yellow-100 text-yellow-800 border-yellow-200",
  });
  add(rank <= Math.ceil(totalPlayers / 2), {
    icon: "🛡️",
    title: "Üst Blok",
    desc: "Tablonun güvenli tarafında",
    tone: "bg-blue-100 text-blue-800 border-blue-200",
  });
  add(bottomTwo, {
    icon: "🥯",
    title: "Simit Hattı",
    desc: "Kahvaltı baskısı yüksek",
    tone: "bg-red-100 text-red-700 border-red-200",
  });
  add(rank === totalPlayers, {
    icon: "🧯",
    title: "Acil Toparlanma",
    desc: "Son sıradan çıkış operasyonu",
    tone: "bg-rose-100 text-rose-700 border-rose-200",
  });
  add(rank === totalPlayers, {
    icon: "🪦",
    title: "Kupon Yattı FC",
    desc: "Sıralama tablosu başsağlığı diliyor",
    tone: "bg-zinc-100 text-zinc-700 border-zinc-200",
  });
  add(bottomTwo, {
    icon: "🧃",
    title: "Çayını Al Gel",
    desc: "Simit hattına servis yaklaştı",
    tone: "bg-orange-100 text-orange-800 border-orange-200",
  });
  add(bottomTwo && wrong > correct, {
    icon: "🚑",
    title: "Acil Müdahale",
    desc: "Tahminlere pansuman gerekebilir",
    tone: "bg-red-100 text-red-800 border-red-200",
  });
  add(rank === 1 && success < 50 && answered >= 5, {
    icon: "🍀",
    title: "Şans Balı",
    desc: "Lider ama futbol tanrıları da yardım etmiş",
    tone: "bg-lime-100 text-lime-800 border-lime-200",
  });
  add(rank <= 3 && wrong > correct && answered >= 10, {
    icon: "🎭",
    title: "Drama Podyumu",
    desc: "Yanlışlar çok ama sahne hâlâ onun",
    tone: "bg-pink-100 text-pink-800 border-pink-200",
  });
  add(wrong >= 5 && wrong > correct + 3, {
    icon: "📉",
    title: "Grafik Ağlıyor",
    desc: "Sonuçlar tabloyu biraz üzmüş",
    tone: "bg-rose-100 text-rose-700 border-rose-200",
  });
  add(wrong >= 10 && success < 45, {
    icon: "🫠",
    title: "Ben Bu Ligi Bırakıyorum",
    desc: "Ama yarın yine tahmin yapacak",
    tone: "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200",
  });
  add(streak >= 1 && wrong >= correct && answered >= 8, {
    icon: "🧿",
    title: "Nazar Değmesin",
    desc: "Seri var ama geçmiş biraz olaylı",
    tone: "bg-blue-100 text-blue-800 border-blue-200",
  });
  add(streak === 0 && wrong >= 3, {
    icon: "🧯",
    title: "Yangın Tüpü Lazım",
    desc: "Seri yok, duman var",
    tone: "bg-red-100 text-red-700 border-red-200",
  });
  add(blanks >= 3, {
    icon: "🙈",
    title: "Görmedim Duymadım",
    desc: "Zor maçları usulca pas geçmiş",
    tone: "bg-slate-100 text-slate-700 border-slate-200",
  });
  add(force >= 3, {
    icon: "📋",
    title: "Mazeret Dosyası",
    desc: "Mücbir klasörü kabarmış",
    tone: "bg-zinc-100 text-zinc-700 border-zinc-200",
  });
  add(jokerWrong >= 1, {
    icon: "🤡",
    title: "Kendine Güveniyordu",
    desc: "Joker bastı, kader güldü",
    tone: "bg-pink-100 text-pink-800 border-pink-200",
  });
  add(jokerWrong >= 2, {
    icon: "🪦",
    title: "Joker Mezarlığı",
    desc: "Jokerler sessizce toprağa verildi",
    tone: "bg-zinc-100 text-zinc-700 border-zinc-200",
  });
  add(jokerCorrect >= 1 && jokerWrong === 0, {
    icon: "😎",
    title: "Joker Artistliği",
    desc: "Bastı ve yürüdü",
    tone: "bg-indigo-100 text-indigo-800 border-indigo-200",
  });
  add(herdTotal >= 3 && herdPct >= 90, {
    icon: "🐑",
    title: "Sürü Psikolojisi Profesörü",
    desc: "Ofis nereye, o oraya",
    tone: "bg-stone-100 text-stone-700 border-stone-200",
  });
  add(herdTotal >= 3 && herdPct <= 25, {
    icon: "🧨",
    title: "Ters Köşe Sevdalısı",
    desc: "Kalabalığa alerjisi var",
    tone: "bg-red-100 text-red-800 border-red-200",
  });
  add(soloCorrect >= 1, {
    icon: "🧙‍♀️",
    title: "İçime Doğdu Kahini",
    desc: "Kimse inanmadı, o bildi",
    tone: "bg-purple-100 text-purple-800 border-purple-200",
  });
  add(latePanic >= 2, {
    icon: "🥶",
    title: "Panik Butonu",
    desc: "Tahminleri son dakika kurtarıyor",
    tone: "bg-sky-100 text-sky-800 border-sky-200",
  });
  add(answered >= 8 && wrong === 0, {
    icon: "🧊",
    title: "Buz Gibi Oynuyor",
    desc: "Yanlışsız sakinlik",
    tone: "bg-cyan-100 text-cyan-800 border-cyan-200",
  });
  add(correct >= 3 && success >= 80 && answered >= 5, {
    icon: "👀",
    title: "Sessiz Tehlike",
    desc: "Az konuşur, puanı alır",
    tone: "bg-emerald-100 text-emerald-800 border-emerald-200",
  });
  add(answered >= 10 && Math.abs(correct - wrong) <= 1, {
    icon: "🎪",
    title: "Sirk Gibi Sezon",
    desc: "Bir doğru bir yanlış, tempo şahane",
    tone: "bg-amber-100 text-amber-800 border-amber-200",
  });
  add(drawPicks >= 5 && drawPicks === favoritePick, {
    icon: "🛌",
    title: "Berabere Yatıyor",
    desc: "X onun konfor alanı",
    tone: "bg-violet-100 text-violet-800 border-violet-200",
  });
  add(homePicks >= 8 && homePicks === favoritePick, {
    icon: "🏡",
    title: "Evden Çıkmıyor",
    desc: "Ev sahibine güven tam",
    tone: "bg-amber-100 text-amber-800 border-amber-200",
  });
  add(awayPicks >= 8 && awayPicks === favoritePick, {
    icon: "🧳",
    title: "Deplasman Turisti",
    desc: "Dış saha seviyor",
    tone: "bg-blue-100 text-blue-800 border-blue-200",
  });
  add(totalPoints < 0 && answered >= 3, {
    icon: "🕳️",
    title: "Puan Kara Deliği",
    desc: "Puanlar başka evrene kaçıyor",
    tone: "bg-gray-100 text-gray-700 border-gray-200",
  });
  add(leaderGap > 0 && leaderGap <= 5, {
    icon: "👀",
    title: "Lidere Nefes",
    desc: `${leaderGap} puan fark kaldı`,
    tone: "bg-indigo-100 text-indigo-800 border-indigo-200",
  });
  add(leaderGap >= 25, {
    icon: "🧗",
    title: "Dağ Tırmanışı",
    desc: `${leaderGap} puanlık kapanacak fark`,
    tone: "bg-stone-100 text-stone-700 border-stone-200",
  });
  add(bestSuccessId === player.id, {
    icon: "🧙",
    title: "Baş Kahin",
    desc: "En yüksek başarı oranı",
    tone: "bg-purple-100 text-purple-800 border-purple-200",
  });
  add(worstSuccessId === player.id && answered > 0, {
    icon: "💔",
    title: "Bugün Yandı",
    desc: "Toparlanma haftası şart",
    tone: "bg-rose-100 text-rose-700 border-rose-200",
  });
  add(streak >= 10, {
    icon: "🌋",
    title: "Lav Modu",
    desc: `${streak} maçlık efsane seri`,
    tone: "bg-red-100 text-red-800 border-red-200",
  });
  add(streak >= 5 && streak < 10, {
    icon: "🔥",
    title: "Alev Modu",
    desc: `${streak} maçlık doğru seri`,
    tone: "bg-orange-100 text-orange-800 border-orange-200",
  });
  add(streak >= 3 && streak < 5, {
    icon: "⚡",
    title: "Formda",
    desc: `${streak} maçlık seri`,
    tone: "bg-sky-100 text-sky-800 border-sky-200",
  });
  add(streak === 0 && answered > 0, {
    icon: "🧊",
    title: "Seri Reset",
    desc: "Yeni seri başlatma zamanı",
    tone: "bg-slate-100 text-slate-700 border-slate-200",
  });
  add(success >= 70 && answered >= 5, {
    icon: "🤖",
    title: "Algoritma Gibi",
    desc: `%${success} başarı`,
    tone: "bg-cyan-100 text-cyan-800 border-cyan-200",
  });
  add(success >= 60 && answered >= 5, {
    icon: "🎯",
    title: "Keskin Nişancı",
    desc: `%${success} başarı`,
    tone: "bg-blue-100 text-blue-800 border-blue-200",
  });
  add(success >= 50 && answered >= 5, {
    icon: "✅",
    title: "Pozitif Bölge",
    desc: "Doğrular önde",
    tone: "bg-emerald-100 text-emerald-800 border-emerald-200",
  });
  add(success > 0 && success < 40 && answered >= 5, {
    icon: "🫠",
    title: "Ters Rüzgar",
    desc: "Şans biraz tripte",
    tone: "bg-pink-100 text-pink-800 border-pink-200",
  });
  add(correct >= 1, {
    icon: "🌱",
    title: "İlk Doğru",
    desc: "Kahvaltı yolculuğu başladı",
    tone: "bg-green-100 text-green-800 border-green-200",
  });
  add(correct >= 10, {
    icon: "📈",
    title: "10 Doğru Kulübü",
    desc: `${correct} doğru tahmin`,
    tone: "bg-lime-100 text-lime-800 border-lime-200",
  });
  add(correct >= 25, {
    icon: "🏹",
    title: "25 İsabet",
    desc: "Tahmin eli ısındı",
    tone: "bg-teal-100 text-teal-800 border-teal-200",
  });
  add(correct >= 50, {
    icon: "💎",
    title: "50 Doğru Elmas",
    desc: "Yarı dalya",
    tone: "bg-cyan-100 text-cyan-800 border-cyan-200",
  });
  add(correct >= 100, {
    icon: "👑",
    title: "100 Doğru Efsanesi",
    desc: "Ofis tarihine geçti",
    tone: "bg-amber-100 text-amber-800 border-amber-200",
  });
  add(wrong >= 10, {
    icon: "🎢",
    title: "Risk Seven",
    desc: `${wrong} yanlış ama hâlâ oyunda`,
    tone: "bg-orange-100 text-orange-800 border-orange-200",
  });
  add(wrong >= correct && answered >= 10, {
    icon: "🎲",
    title: "Kaderci",
    desc: "Riskli tahminler fazla",
    tone: "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200",
  });
  add(bonus >= 10, {
    icon: "💰",
    title: "Bonus Avcısı",
    desc: `+${bonus} ek puan`,
    tone: "bg-emerald-100 text-emerald-800 border-emerald-200",
  });
  add(bonus >= 50, {
    icon: "🤑",
    title: "Bonus Zengini",
    desc: `+${bonus} bonus`,
    tone: "bg-green-100 text-green-800 border-green-200",
  });
  add(blanks >= 1, {
    icon: "🤐",
    title: "Sessiz Tahminci",
    desc: `${blanks} bilinçli boş`,
    tone: "bg-slate-100 text-slate-700 border-slate-200",
  });
  add(blanks >= 5, {
    icon: "🧊",
    title: "Soğukkanlı",
    desc: "Bilmediğini boş bırakıyor",
    tone: "bg-slate-100 text-slate-700 border-slate-200",
  });
  add(force >= 1, {
    icon: "🧾",
    title: "Mücbir Ustası",
    desc: `${force} mücbir sebep`,
    tone: "bg-zinc-100 text-zinc-700 border-zinc-200",
  });
  add(herdTotal >= 3 && herdPct >= 80, {
    icon: "🐑",
    title: "Sürüyle Giden",
    desc: `%${herdPct} çoğunlukla aynı`,
    tone: "bg-stone-100 text-stone-700 border-stone-200",
  });
  add(herdTotal >= 3 && herdPct <= 35, {
    icon: "⚡",
    title: "Aykırı Tahminci",
    desc: `%${herdPct} çoğunlukla aynı`,
    tone: "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200",
  });
  add(soloCorrect >= 1, {
    icon: "💥",
    title: "Tek Başına Bildi",
    desc: `${soloCorrect} sürpriz isabet`,
    tone: "bg-red-100 text-red-800 border-red-200",
  });
  add(exactUnderdog >= 2, {
    icon: "🦊",
    title: "Sürpriz Tilkisi",
    desc: `${exactUnderdog} aykırı doğru`,
    tone: "bg-orange-100 text-orange-800 border-orange-200",
  });
  add(homePicks >= 5 && homePicks === favoritePick, {
    icon: "🏠",
    title: "Evci",
    desc: `En çok ${favoritePickLabel} oynuyor`,
    tone: "bg-amber-100 text-amber-800 border-amber-200",
  });
  add(drawPicks >= 3 && drawPicks === favoritePick, {
    icon: "🤝",
    title: "Beraberlikçi",
    desc: "X kokusunu seviyor",
    tone: "bg-violet-100 text-violet-800 border-violet-200",
  });
  add(awayPicks >= 5 && awayPicks === favoritePick, {
    icon: "🚌",
    title: "Deplasman Sevdalısı",
    desc: `En çok ${favoritePickLabel} oynuyor`,
    tone: "bg-sky-100 text-sky-800 border-sky-200",
  });
  add(jokerPreds.length >= 1, {
    icon: "🃏",
    title: "Joker Açtı",
    desc: `${jokerPreds.length} joker kullanımı`,
    tone: "bg-purple-100 text-purple-800 border-purple-200",
  });
  add(jokerCorrect >= 1, {
    icon: "🃏",
    title: "Joker Vurdu",
    desc: `${jokerCorrect} joker doğru`,
    tone: "bg-purple-100 text-purple-800 border-purple-200",
  });
  add(jokerWrong >= 1, {
    icon: "🫣",
    title: "Joker Yaktı",
    desc: `${jokerWrong} joker yanlış`,
    tone: "bg-rose-100 text-rose-700 border-rose-200",
  });
  add(jokerCorrect >= 3, {
    icon: "🪄",
    title: "Joker Büyücüsü",
    desc: "Jokerleri nokta atışı",
    tone: "bg-indigo-100 text-indigo-800 border-indigo-200",
  });
  add(player.champion_team === "Türkiye", {
    icon: "🇹🇷",
    title: "Ay-Yıldızcı",
    desc: "Şampiyon Türkiye dedi",
    tone: "bg-red-100 text-red-800 border-red-200",
  });
  add(!!player.champion_team, {
    icon: "🌍",
    title: "Şampiyon Seçti",
    desc: `${player.champion_team} diyor`,
    tone: "bg-green-100 text-green-800 border-green-200",
  });
  add(totalPoints >= 10, {
    icon: "🚀",
    title: "Puan Motoru",
    desc: `${totalPoints} puana ulaştı`,
    tone: "bg-blue-100 text-blue-800 border-blue-200",
  });
  add(totalPoints >= 50, {
    icon: "🏎️",
    title: "Hızlı Başlangıç",
    desc: "50 puan barajı",
    tone: "bg-red-100 text-red-800 border-red-200",
  });
  add(totalPoints >= 100, {
    icon: "💯",
    title: "Yüzlük Kulüp",
    desc: "100 puan barajı",
    tone: "bg-amber-100 text-amber-800 border-amber-200",
  });
  add(totalPredictionPoints < 0 && answered >= 3, {
    icon: "🕳️",
    title: "Negatif Tünel",
    desc: "Skorlar ters gidiyor",
    tone: "bg-gray-100 text-gray-700 border-gray-200",
  });
  add(comebackWins >= 3, {
    icon: "🦅",
    title: "Dipten Uçuş",
    desc: "Simit hattında seri yaptı",
    tone: "bg-cyan-100 text-cyan-800 border-cyan-200",
  });
  add(latePanic >= 1, {
    icon: "🥶",
    title: "Son Dakika Panikçisi",
    desc: `${latePanic} son dakika tahmini`,
    tone: "bg-blue-100 text-blue-800 border-blue-200",
  });
  add(answered >= 1 && homePicks > 0 && drawPicks > 0 && awayPicks > 0, {
    icon: "🌈",
    title: "Üç Yolcu",
    desc: "1, X ve 2 hepsini denedi",
    tone: "bg-pink-100 text-pink-800 border-pink-200",
  });
  add(answered >= 10 && Math.abs(correct - wrong) <= 1, {
    icon: "⚖️",
    title: "Denge Ustası",
    desc: "Doğru/yanlış başa baş",
    tone: "bg-stone-100 text-stone-700 border-stone-200",
  });

  // 100 rozet paketi için ekstra komik/stratejik rozetler
  add(answered >= 20 && success >= 55, {
    icon: "🧠",
    title: "Futbol IQ Açık",
    desc: "20+ tahminde sağlam oran",
    tone: "bg-indigo-100 text-indigo-800 border-indigo-200",
  });
  add(answered >= 20 && success < 45, {
    icon: "📺",
    title: "Maçı Tersten İzliyor",
    desc: "Ekranı çevirmek fayda edebilir",
    tone: "bg-rose-100 text-rose-700 border-rose-200",
  });
  add(correct >= wrong + 5 && answered >= 10, {
    icon: "🦾",
    title: "Makine Gibi",
    desc: "Doğrular farkı açmış",
    tone: "bg-cyan-100 text-cyan-800 border-cyan-200",
  });
  add(wrong >= correct + 5 && answered >= 10, {
    icon: "🧨",
    title: "Risk Patladı",
    desc: "Cesaret var, sonuçlar nazlı",
    tone: "bg-red-100 text-red-800 border-red-200",
  });
  add(
    jokerPreds.length >= 2 &&
      jokerCorrect === jokerPreds.length &&
      jokerPreds.length > 0,
    {
      icon: "🎩",
      title: "Joker Şapkadan Çıktı",
      desc: "Kullandığı jokerler tertemiz",
      tone: "bg-purple-100 text-purple-800 border-purple-200",
    },
  );
  add(
    jokerPreds.length >= 2 &&
      jokerWrong === jokerPreds.length &&
      jokerPreds.length > 0,
    {
      icon: "🪦",
      title: "Joker Mezarlığı",
      desc: "Jokerler sessizce gömüldü",
      tone: "bg-zinc-100 text-zinc-700 border-zinc-200",
    },
  );
  add(rank === 1 && streak >= 3, {
    icon: "🦁",
    title: "Lider ve Formda",
    desc: "Hem zirvede hem seride",
    tone: "bg-yellow-100 text-yellow-800 border-yellow-200",
  });
  add(bottomTwo && streak >= 2, {
    icon: "🐣",
    title: "Simitten Kaçış Planı",
    desc: "Alt sıradan seriyle çıkmaya çalışıyor",
    tone: "bg-orange-100 text-orange-800 border-orange-200",
  });
  add(leaderGap > 0 && leaderGap <= 2, {
    icon: "🫁",
    title: "Ense Nefesi",
    desc: "Liderin ensesinde sıcak nefes",
    tone: "bg-pink-100 text-pink-800 border-pink-200",
  });
  add(leaderGap >= 50, {
    icon: "🗺️",
    title: "Harita Lazım",
    desc: "Lidere giden yol biraz uzun",
    tone: "bg-stone-100 text-stone-700 border-stone-200",
  });
  add(drawPicks >= homePicks && drawPicks >= awayPicks && drawPicks >= 10, {
    icon: "🧘",
    title: "X Zen Ustası",
    desc: "Beraberlikte huzur buluyor",
    tone: "bg-violet-100 text-violet-800 border-violet-200",
  });
  add(homePicks >= awayPicks * 2 && homePicks >= 10, {
    icon: "🏟️",
    title: "Ev Sahibi Lobisi",
    desc: "Tribün etkisine inanıyor",
    tone: "bg-amber-100 text-amber-800 border-amber-200",
  });
  add(awayPicks >= homePicks * 2 && awayPicks >= 10, {
    icon: "✈️",
    title: "Deplasman Uçağı",
    desc: "Dış saha romantizmi",
    tone: "bg-sky-100 text-sky-800 border-sky-200",
  });
  add(herdTotal >= 5 && herdPct === 100, {
    icon: "🐑",
    title: "Sürü Kaptanı",
    desc: "Çoğunlukla tam uyum",
    tone: "bg-stone-100 text-stone-700 border-stone-200",
  });
  add(herdTotal >= 5 && herdPct <= 20, {
    icon: "🧬",
    title: "Genetik Aykırı",
    desc: "Ofis başka o başka",
    tone: "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200",
  });
  add(soloCorrect >= 2, {
    icon: "🧨",
    title: "Ofisi Susturan",
    desc: "Tek başına doğru bildi",
    tone: "bg-red-100 text-red-800 border-red-200",
  });
  add(exactUnderdog >= 3, {
    icon: "🕵️",
    title: "Sürpriz Dedektifi",
    desc: "Ters köşeleri kokluyor",
    tone: "bg-orange-100 text-orange-800 border-orange-200",
  });
  add(latePanic >= 3, {
    icon: "⏰",
    title: "Deadline Kahini",
    desc: "Son dakika onun uzmanlığı",
    tone: "bg-blue-100 text-blue-800 border-blue-200",
  });
  add(blanks === 0 && answered >= 10, {
    icon: "🫡",
    title: "Pas Geçmeyen",
    desc: "Her maça fikri var",
    tone: "bg-green-100 text-green-800 border-green-200",
  });
  add(blanks >= 10, {
    icon: "🛡️",
    title: "Seçici Kurul",
    desc: "Her maça bulaşmıyor",
    tone: "bg-slate-100 text-slate-700 border-slate-200",
  });
  add(bonus >= 100, {
    icon: "🏦",
    title: "Bonus Bankası",
    desc: "Ek puan kasası dolu",
    tone: "bg-emerald-100 text-emerald-800 border-emerald-200",
  });
  add(totalPoints >= 250, {
    icon: "🚂",
    title: "Puan Lokomotifi",
    desc: "250 puan barajı geçildi",
    tone: "bg-blue-100 text-blue-800 border-blue-200",
  });
  add(totalPoints >= 500, {
    icon: "🏰",
    title: "Puan Krallığı",
    desc: "500 puanlık saltanat",
    tone: "bg-amber-100 text-amber-800 border-amber-200",
  });

  // Aynı isim/desc tekrarlarını temizle ve rozet havuzunu 100 ile sınırla.
  const uniqueBadges = badges.filter(
    (badge, index, arr) =>
      arr.findIndex((b) => b.title === badge.title && b.desc === badge.desc) ===
      index,
  );
  return uniqueBadges.slice(0, 100);
}

function BadgePanel({
  player,
  sortedPlayers,
  playerStreaks,
  predictions,
  matches,
}: {
  player: Player;
  sortedPlayers: Player[];
  playerStreaks: Record<string, number>;
  predictions: Prediction[];
  matches: Match[];
}) {
  const badges = getPlayerBadges(
    player,
    sortedPlayers,
    playerStreaks,
    predictions,
    matches,
  );
  return (
    <div className="mb-6 rounded-[1.75rem] border border-amber-100 bg-amber-50/50 p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xl font-black">🏅 Rozetler</h3>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-500">
          {badges.length}/100 rozet
        </span>
      </div>
      {badges.length === 0 ? (
        <div className="rounded-2xl bg-white p-4 text-sm font-bold text-slate-500">
          Veri geldikçe rozetler burada açılacak 😄
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {badges.map((badge) => (
            <div
              key={`${badge.title}-${badge.desc}`}
              className={`rounded-2xl border p-4 ${badge.tone}`}
            >
              <div className="text-2xl">{badge.icon}</div>
              <div className="mt-2 font-black">{badge.title}</div>
              <div className="mt-1 text-xs font-bold opacity-80">
                {badge.desc}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getCompareMetrics(
  player: Player | undefined,
  sortedPlayers: Player[],
  predictions: Prediction[],
  matches: Match[],
  playerStreaks: Record<string, number>,
) {
  if (!player) return null;
  const rank = sortedPlayers.findIndex((p) => p.id === player.id) + 1;
  const finishedPreds = predictions.filter((pred) => {
    const match = matches.find((m) => m.id === pred.match_id);
    return (
      pred.player_id === player.id &&
      !!match?.result &&
      pred.prediction !== "YOK"
    );
  });
  const lastTen = finishedPreds
    .map((pred) => ({
      pred,
      match: matches.find((m) => m.id === pred.match_id),
    }))
    .filter((x) => x.match)
    .sort(
      (a, b) =>
        new Date(b.match!.match_time).getTime() -
        new Date(a.match!.match_time).getTime(),
    )
    .slice(0, 10);
  const lastTenPoints = lastTen.reduce(
    (sum, x) => sum + getPredictionCalculatedPoints(x.pred, x.match),
    0,
  );
  return {
    player,
    rank,
    points: Number(player.total_points || 0),
    correct: Number(player.correct_count || 0),
    wrong: Number(player.wrong_count || 0),
    blank: Number(player.intentional_blank || 0),
    bonus: Number(player.bonus_points || 0),
    success: Number(player.success_rate || 0),
    streak: playerStreaks[player.id] || 0,
    lastTenPoints,
    answered:
      Number(player.correct_count || 0) + Number(player.wrong_count || 0),
  };
}

function RivalCompare({
  players,
  sortedPlayers,
  predictions,
  matches,
  playerStreaks,
  leftId,
  rightId,
  setLeftId,
  setRightId,
  onProfile,
}: {
  players: Player[];
  sortedPlayers: Player[];
  predictions: Prediction[];
  matches: Match[];
  playerStreaks: Record<string, number>;
  leftId: string;
  rightId: string;
  setLeftId: (id: string) => void;
  setRightId: (id: string) => void;
  onProfile: (id: string) => void;
}) {
  const fallbackLeft = leftId || sortedPlayers[0]?.id || players[0]?.id || "";
  const fallbackRight =
    rightId ||
    sortedPlayers.find((p) => p.id !== fallbackLeft)?.id ||
    players[1]?.id ||
    "";
  const left = players.find((p) => p.id === fallbackLeft);
  const right =
    players.find((p) => p.id === fallbackRight && p.id !== fallbackLeft) ||
    players.find((p) => p.id !== fallbackLeft);
  const leftMetrics = getCompareMetrics(
    left,
    sortedPlayers,
    predictions,
    matches,
    playerStreaks,
  );
  const rightMetrics = getCompareMetrics(
    right,
    sortedPlayers,
    predictions,
    matches,
    playerStreaks,
  );

  const commonMatchIds = new Set<string>();
  predictions
    .filter((p) => p.player_id === left?.id && p.prediction !== "YOK")
    .forEach((p) => {
      const other = predictions.find(
        (x) =>
          x.player_id === right?.id &&
          x.match_id === p.match_id &&
          x.prediction !== "YOK",
      );
      const match = matches.find((m) => m.id === p.match_id);
      if (other && match?.result) commonMatchIds.add(p.match_id);
    });
  const commonMatches = Array.from(commonMatchIds);
  const samePicks = commonMatches.filter((matchId) => {
    const a = predictions.find(
      (p) => p.player_id === left?.id && p.match_id === matchId,
    );
    const b = predictions.find(
      (p) => p.player_id === right?.id && p.match_id === matchId,
    );
    return a?.prediction === b?.prediction;
  }).length;
  const differentPicks = commonMatches.length - samePicks;
  const leftCommonPoints = commonMatches.reduce((sum, matchId) => {
    const match = matches.find((m) => m.id === matchId);
    const pred = predictions.find(
      (p) => p.player_id === left?.id && p.match_id === matchId,
    );
    return sum + getPredictionCalculatedPoints(pred, match);
  }, 0);
  const rightCommonPoints = commonMatches.reduce((sum, matchId) => {
    const match = matches.find((m) => m.id === matchId);
    const pred = predictions.find(
      (p) => p.player_id === right?.id && p.match_id === matchId,
    );
    return sum + getPredictionCalculatedPoints(pred, match);
  }, 0);

  const pointDiff =
    Number(leftMetrics?.points || 0) - Number(rightMetrics?.points || 0);
  const leaderName =
    pointDiff === 0 ? "Berabere" : pointDiff > 0 ? left?.name : right?.name;
  const gap = Math.abs(pointDiff);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black">🥊 Rakip Karşılaştırma</h2>
          <p className="mt-1 text-sm font-bold text-slate-500">
            İki oyuncuyu seç, kim kimi kahvaltı hattına yaklaştırıyor görelim 😄
          </p>
        </div>
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-end">
        <div>
          <label className="mb-2 block text-sm font-black text-slate-500">
            1. Oyuncu
          </label>
          <select
            value={fallbackLeft}
            onChange={(e) => setLeftId(e.target.value)}
            className="w-full rounded-2xl border border-amber-100 bg-amber-50/40 p-3 font-black"
          >
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="rounded-full bg-red-500 px-4 py-3 text-center font-black text-white">
          VS
        </div>
        <div>
          <label className="mb-2 block text-sm font-black text-slate-500">
            2. Oyuncu
          </label>
          <select
            value={right?.id || ""}
            onChange={(e) => setRightId(e.target.value)}
            className="w-full rounded-2xl border border-amber-100 bg-amber-50/40 p-3 font-black"
          >
            {players
              .filter((p) => p.id !== fallbackLeft)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      {leftMetrics && rightMetrics && (
        <>
          <div className="mb-6 rounded-[1.75rem] border border-amber-100 bg-amber-50/50 p-5 text-center">
            <div className="text-sm font-black uppercase tracking-wide text-slate-500">
              Genel fark
            </div>
            <div className="mt-2 text-3xl font-black text-slate-950">
              {leaderName === "Berabere"
                ? "Şu an kafa kafaya ⚖️"
                : `${leaderName} ${gap} puan önde`}
            </div>
            <div className="mt-2 text-sm font-bold text-slate-500">
              Ortak sonuçlanmış maçlarda: {left?.name} {leftCommonPoints} /{" "}
              {right?.name} {rightCommonPoints}
            </div>
          </div>

          <div className="mb-6 grid gap-4 md:grid-cols-2">
            <ComparePlayerCard metrics={leftMetrics} onProfile={onProfile} />
            <ComparePlayerCard metrics={rightMetrics} onProfile={onProfile} />
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <StatBox title="ORTAK MAÇ" value={commonMatches.length} />
            <StatBox title="AYNI TAHMİN" value={samePicks} />
            <StatBox title="ZIT TAHMİN" value={differentPicks} />
            <StatBox title="PUAN FARKI" value={gap} />
          </div>

          <div className="mt-6 rounded-[1.75rem] border border-red-100 bg-red-50 p-5">
            <h3 className="mb-2 text-lg font-black">🧂 Ofis Yorumu</h3>
            <p className="font-bold text-slate-700">
              {leaderName === "Berabere"
                ? "Bu ikili tam dengede. Bir sonraki maç kahvaltı kaderini değiştirebilir."
                : `${leaderName} şu an önde ama Dünya Kupası uzun maraton; tek kötü gün simit hattına indirir 😄`}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function ComparePlayerCard({
  metrics,
  onProfile,
}: {
  metrics: NonNullable<ReturnType<typeof getCompareMetrics>>;
  onProfile: (id: string) => void;
}) {
  const p = metrics.player;
  return (
    <div className="rounded-[1.75rem] border border-amber-100 bg-white p-5 shadow-lg shadow-amber-100/50">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="text-2xl font-black">{p.name}</div>
          <div className="text-sm font-bold text-slate-500">
            #{metrics.rank} sıra • %{metrics.success} başarı
          </div>
        </div>
        <button
          onClick={() => onProfile(p.id)}
          className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-black text-amber-800 hover:bg-amber-200"
        >
          Profile git
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <StatBox title="PUAN" value={metrics.points} />
        <StatBox title="SON 10 PUAN" value={metrics.lastTenPoints} />
        <StatBox title="DOĞRU" value={metrics.correct} />
        <StatBox title="YANLIŞ" value={metrics.wrong} />
        <StatBox
          title="STREAK"
          value={metrics.streak >= 5 ? `🔥 ${metrics.streak}` : metrics.streak}
        />
        <StatBox title="EK PUAN" value={metrics.bonus} />
      </div>
    </div>
  );
}

function RuleCard({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: any;
}) {
  return (
    <div className="rounded-[1.5rem] border border-amber-100 bg-amber-50/60 p-4 shadow-sm">
      <div className="mb-2 flex items-center gap-2 text-lg font-black">
        <span className="text-2xl">{icon}</span>
        <span>{title}</span>
      </div>
      <div className="text-sm font-bold leading-6 text-slate-600">
        {children}
      </div>
    </div>
  );
}

function isPlaceholderTeamName(team?: string | null) {
  const name = (team || "").trim();
  if (!name) return true;

  // Kodda tanımlı gerçek ülke adları her zaman takım sayılır.
  if (TEAM_FLAG_CODES[name]) return false;

  const normalized = name
    .toLocaleLowerCase("tr-TR")
    .replace(/\s+/g, " ")
    .trim();

  // D3, 3D, A1, 1A gibi grup sıralaması placeholder'ları
  if (/^[a-l]\s?[1-4]$/.test(normalized)) return true;
  if (/^[1-4]\s?[a-l]$/.test(normalized)) return true;

  // Yarı Final 1 Kazananı, Grup D 3.sü, Finalisti 1 gibi geçici isimler
  const placeholderWords = [
    "kazanan",
    "kazananı",
    "kaybeden",
    "kaybedeni",
    "mağlup",
    "mağlubu",
    "galip",
    "galibi",
    "winner",
    "loser",
    "finalist",
    "finalisti",
    "birincisi",
    "ikincisi",
    "üçüncüsü",
    "dördüncüsü",
    "1.",
    "2.",
    "3.",
    "4.",
    "grup ",
    "grubu",
  ];

  return placeholderWords.some((word) => normalized.includes(word));
}

type TeamInfo = {
  name: string;
  groups: string[];
  played: number;
  wins: number;
  draws: number;
  losses: number;
  gf: number;
  ga: number;
  points: number;
  form: {
    result: "G" | "B" | "M";
    score: string;
    opponent: string;
    date: string;
  }[];
  championPickers: Player[];
  eliminatedByKnockout: boolean;
};

function TeamInfoPage({
  matches,
  players,
}: {
  matches: Match[];
  players: Player[];
}) {
  const [teamSearch, setTeamSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("Tümü");

  const knockoutStages = [
    "Son 32",
    "Son 16",
    "Çeyrek Final",
    "Yarı Final",
    "Üçüncülük",
    "Final",
  ];

  const groups = useMemo(() => {
    const set = new Set<string>();
    matches.forEach((m) => {
      if (m.league?.startsWith("Grup")) set.add(m.league);
    });
    return [
      "Tümü",
      ...Array.from(set).sort((a, b) => a.localeCompare(b, "tr")),
    ];
  }, [matches]);

  const teamStats = useMemo(() => {
    const map: Record<string, TeamInfo> = {};

    const ensure = (team: string) => {
      const cleanTeam = team.trim();
      if (isPlaceholderTeamName(cleanTeam)) return null;

      if (!map[cleanTeam]) {
        map[cleanTeam] = {
          name: cleanTeam,
          groups: [],
          played: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          gf: 0,
          ga: 0,
          points: 0,
          form: [],
          championPickers: players.filter((p) => p.champion_team === cleanTeam),
          eliminatedByKnockout: false,
        };
      }
      return map[cleanTeam];
    };

    matches.forEach((match) => {
      const home = ensure(match.home_team);
      const away = ensure(match.away_team);

      // D3, A1, "Yarı Final 1 Kazananı" gibi geçici eşleşme isimleri takım kartına eklenmez.
      // Gerçek takım adı maçlara yazılınca otomatik görünür.
      if (!home || !away) return;

      if (match.league?.startsWith("Grup")) {
        if (!home.groups.includes(match.league)) home.groups.push(match.league);
        if (!away.groups.includes(match.league)) away.groups.push(match.league);
      }

      const hasScore =
        match.result &&
        match.home_score !== null &&
        match.home_score !== undefined &&
        match.away_score !== null &&
        match.away_score !== undefined;

      if (!hasScore) return;

      const homeScore = Number(match.home_score || 0);
      const awayScore = Number(match.away_score || 0);
      const date = new Date(match.match_time).toLocaleDateString("tr-TR", {
        day: "2-digit",
        month: "short",
      });

      home.played += 1;
      away.played += 1;
      home.gf += homeScore;
      home.ga += awayScore;
      away.gf += awayScore;
      away.ga += homeScore;

      if (match.result === "1") {
        home.wins += 1;
        away.losses += 1;
        home.points += 3;
        home.form.push({
          result: "G",
          score: `${homeScore}-${awayScore}`,
          opponent: match.away_team,
          date,
        });
        away.form.push({
          result: "M",
          score: `${awayScore}-${homeScore}`,
          opponent: match.home_team,
          date,
        });

        if (
          knockoutStages.includes(match.league || "") &&
          match.league !== "Üçüncülük"
        ) {
          away.eliminatedByKnockout = true;
        }
      } else if (match.result === "2") {
        away.wins += 1;
        home.losses += 1;
        away.points += 3;
        away.form.push({
          result: "G",
          score: `${awayScore}-${homeScore}`,
          opponent: match.home_team,
          date,
        });
        home.form.push({
          result: "M",
          score: `${homeScore}-${awayScore}`,
          opponent: match.away_team,
          date,
        });

        if (
          knockoutStages.includes(match.league || "") &&
          match.league !== "Üçüncülük"
        ) {
          home.eliminatedByKnockout = true;
        }
      } else {
        home.draws += 1;
        away.draws += 1;
        home.points += 1;
        away.points += 1;
        home.form.push({
          result: "B",
          score: `${homeScore}-${awayScore}`,
          opponent: match.away_team,
          date,
        });
        away.form.push({
          result: "B",
          score: `${awayScore}-${homeScore}`,
          opponent: match.home_team,
          date,
        });
      }
    });

    return Object.values(map)
      .map((team) => ({
        ...team,
        groups: team.groups.length
          ? team.groups.sort((a, b) => a.localeCompare(b, "tr"))
          : ["Grup bilinmiyor"],
        form: team.form.slice(-5).reverse(),
      }))
      .sort((a, b) => {
        const pointsDiff = b.points - a.points;
        if (pointsDiff !== 0) return pointsDiff;
        const gdDiff = b.gf - b.ga - (a.gf - a.ga);
        if (gdDiff !== 0) return gdDiff;
        const gfDiff = b.gf - a.gf;
        if (gfDiff !== 0) return gfDiff;
        return a.name.localeCompare(b.name, "tr");
      });
  }, [matches, players]);

  const filteredTeams = teamStats.filter((team) => {
    const q = teamSearch.trim().toLowerCase();
    const matchesSearch =
      !q ||
      team.name.toLowerCase().includes(q) ||
      team.groups.join(" ").toLowerCase().includes(q);
    const matchesGroup =
      groupFilter === "Tümü" || team.groups.includes(groupFilter);
    return matchesSearch && matchesGroup;
  });

  const mostPickedTeam = [...teamStats].sort(
    (a, b) => b.championPickers.length - a.championPickers.length,
  )[0];
  const bestAttack = [...teamStats].sort((a, b) => b.gf - a.gf)[0];
  const bestDefense = [...teamStats]
    .filter((t) => t.played > 0)
    .sort((a, b) => a.ga - b.ga || b.points - a.points)[0];

  const getFormLabel = (team: TeamInfo) => {
    const last = team.form.slice(0, 5);
    const wins = last.filter((f) => f.result === "G").length;
    const losses = last.filter((f) => f.result === "M").length;
    if (team.played === 0)
      return { text: "Bekliyor", cls: "bg-slate-100 text-slate-500" };
    if (team.eliminatedByKnockout)
      return { text: "Elendi", cls: "bg-red-100 text-red-600" };
    if (wins >= 3 || (last.length >= 2 && wins === last.length))
      return { text: "Formda", cls: "bg-emerald-100 text-emerald-700" };
    if (losses >= 3) return { text: "Düşüşte", cls: "bg-red-100 text-red-600" };
    return { text: "Dengeli", cls: "bg-amber-100 text-amber-700" };
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black">🏳️ Takım Bilgileri</h2>
          <p className="mt-1 text-sm font-bold text-slate-500">
            Takımların gol, form, grup ve şampiyon tahmini bilgileri maç
            sonuçlarından otomatik hesaplanır.
          </p>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-black text-amber-800">
          Toplam {teamStats.length} takım
        </div>
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-3">
        <MiniDashboardCard
          icon="🔥"
          title="En Golcü"
          value={bestAttack?.name || "-"}
          note={`${bestAttack?.gf || 0} gol attı`}
          tone="amber"
        />
        <MiniDashboardCard
          icon="🛡️"
          title="En Az Yiyen"
          value={bestDefense?.name || "-"}
          note={`${bestDefense?.ga ?? 0} gol yedi`}
          tone="blue"
        />
        <MiniDashboardCard
          icon="🏆"
          title="En Çok Seçilen"
          value={mostPickedTeam?.name || "-"}
          note={`${mostPickedTeam?.championPickers.length || 0} şampiyon tahmini`}
          tone="red"
        />
      </div>

      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center">
        <input
          value={teamSearch}
          onChange={(e) => setTeamSearch(e.target.value)}
          placeholder="🔎 Takım ara: Türkiye, İran, Brezilya..."
          className="w-full rounded-2xl border border-amber-100 bg-amber-50/60 p-3 font-bold outline-none focus:border-red-300 md:flex-1"
        />
        <select
          value={groupFilter}
          onChange={(e) => setGroupFilter(e.target.value)}
          className="rounded-2xl border border-amber-100 bg-white p-3 font-black outline-none"
        >
          {groups.map((group) => (
            <option key={group} value={group}>
              {group}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4 text-sm font-black text-slate-500">
        {filteredTeams.length} takım gösteriliyor
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredTeams.map((team) => {
          const gd = team.gf - team.ga;
          const formLabel = getFormLabel(team);
          return (
            <div
              key={team.name}
              className="rounded-[1.75rem] border border-amber-100 bg-white p-4 shadow-lg shadow-amber-100/50"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <div className="text-xl font-black">
                    <TeamName team={team.name} />
                  </div>
                  <div className="mt-1 text-xs font-black uppercase tracking-wide text-slate-400">
                    {team.groups.join(" • ")}
                  </div>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-black ${formLabel.cls}`}
                >
                  {formLabel.text}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="rounded-2xl bg-amber-50 p-2">
                  <div className="text-xs font-black text-slate-400">Puan</div>
                  <div className="text-xl font-black">{team.points}</div>
                </div>
                <div className="rounded-2xl bg-emerald-50 p-2">
                  <div className="text-xs font-black text-slate-400">G</div>
                  <div className="text-xl font-black text-emerald-700">
                    {team.wins}
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-2">
                  <div className="text-xs font-black text-slate-400">B</div>
                  <div className="text-xl font-black">{team.draws}</div>
                </div>
                <div className="rounded-2xl bg-red-50 p-2">
                  <div className="text-xs font-black text-slate-400">M</div>
                  <div className="text-xl font-black text-red-600">
                    {team.losses}
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-2">
                  <div className="text-xs font-black text-slate-400">Attı</div>
                  <div className="text-lg font-black">{team.gf}</div>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-2">
                  <div className="text-xs font-black text-slate-400">Yedi</div>
                  <div className="text-lg font-black">{team.ga}</div>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-2">
                  <div className="text-xs font-black text-slate-400">
                    Averaj
                  </div>
                  <div
                    className={`text-lg font-black ${gd >= 0 ? "text-emerald-700" : "text-red-600"}`}
                  >
                    {gd > 0 ? "+" : ""}
                    {gd}
                  </div>
                </div>
              </div>

              <div className="mt-3 rounded-2xl border border-amber-100 bg-amber-50/70 p-3">
                <div className="mb-2 text-xs font-black uppercase tracking-wide text-amber-700">
                  Son form
                </div>
                {team.form.length === 0 ? (
                  <div className="text-sm font-bold text-slate-500">
                    Henüz maç sonucu yok.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {team.form.map((f, idx) => (
                      <span
                        key={`${team.name}-${idx}`}
                        title={`${f.date} • ${f.opponent} • ${f.score}`}
                        className={`rounded-full px-2.5 py-1 text-xs font-black ${f.result === "G" ? "bg-emerald-500 text-white" : f.result === "B" ? "bg-slate-300 text-slate-800" : "bg-red-500 text-white"}`}
                      >
                        {f.result}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-3 rounded-2xl border border-red-100 bg-red-50/70 p-3">
                <div className="text-xs font-black uppercase tracking-wide text-red-600">
                  Şampiyon seçenler
                </div>
                <div className="mt-1 text-sm font-black text-slate-700">
                  {team.championPickers.length > 0
                    ? team.championPickers.map((p) => p.name).join(" • ")
                    : "Kimse seçmedi"}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TournamentTree({
  matches,
  players,
  currentPlayer,
}: {
  matches: Match[];
  players: Player[];
  currentPlayer: Player | null;
}) {
  const stages = [
    "Son 32",
    "Son 16",
    "Çeyrek Final",
    "Yarı Final",
    "Üçüncülük",
    "Final",
  ];

  const stageLabel = (match: Match) =>
    match.league || match.breakfast_round || "";

  const knockoutMatches = matches
    .filter((m) => stages.some((stage) => stageLabel(m) === stage))
    .sort(
      (a, b) =>
        new Date(a.match_time).getTime() - new Date(b.match_time).getTime(),
    );

  const matchesByStage = stages.map((stage) => ({
    stage,
    matches: knockoutMatches.filter((m) => stageLabel(m) === stage),
  }));

  const finalMatch = knockoutMatches.find(
    (m) => stageLabel(m) === "Final" && m.result,
  );
  const champion =
    finalMatch?.result === "1"
      ? finalMatch.home_team
      : finalMatch?.result === "2"
        ? finalMatch.away_team
        : null;

  const championPicks: Record<string, Player[]> = {};
  players.forEach((player) => {
    if (!player.champion_team) return;
    if (!championPicks[player.champion_team])
      championPicks[player.champion_team] = [];
    championPicks[player.champion_team].push(player);
  });

  const myPick = currentPlayer?.champion_team || null;
  const myPickStillAlive = myPick
    ? knockoutMatches.some(
        (m) => !m.result && (m.home_team === myPick || m.away_team === myPick),
      ) || !champion
    : false;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black">🌳 Turnuva Ağacı</h2>
          <p className="mt-1 text-sm font-bold text-slate-500">
            Eleme maçları Supabase’deki maç aşamasına göre otomatik gruplanır.
            Skor girildikçe kazanan vurgulanır.
          </p>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-black text-amber-800">
          🏆{" "}
          {champion ? (
            <>
              Şampiyon: <TeamName team={champion} />
            </>
          ) : (
            "Şampiyon henüz belli değil"
          )}
        </div>
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-3">
        <div className="rounded-[1.5rem] border border-amber-100 bg-amber-50/70 p-4">
          <div className="text-sm font-black uppercase tracking-wide text-slate-500">
            Benim Şampiyon Tahminim
          </div>
          <div className="mt-2 text-xl font-black">
            {myPick ? <TeamName team={myPick} /> : "Seçilmedi"}
          </div>
          <div
            className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-black ${!myPick ? "bg-slate-100 text-slate-500" : champion && champion === myPick ? "bg-green-100 text-green-700" : champion && champion !== myPick ? "bg-red-100 text-red-600" : myPickStillAlive ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}
          >
            {!myPick
              ? "Tahmin yok"
              : champion && champion === myPick
                ? "Tuttu 🏆"
                : champion && champion !== myPick
                  ? "Yattı 💔"
                  : myPickStillAlive
                    ? "Hâlâ yaşıyor ✅"
                    : "Durum bekleniyor"}
          </div>
        </div>
        <div className="rounded-[1.5rem] border border-red-100 bg-red-50/70 p-4">
          <div className="text-sm font-black uppercase tracking-wide text-slate-500">
            Eleme Maçı
          </div>
          <div className="mt-2 text-3xl font-black text-red-500">
            {knockoutMatches.length}
          </div>
          <div className="mt-1 text-xs font-bold text-slate-500">
            Son 32’den finale kadar
          </div>
        </div>
        <div className="rounded-[1.5rem] border border-slate-100 bg-white p-4">
          <div className="text-sm font-black uppercase tracking-wide text-slate-500">
            Şampiyon Tahmini
          </div>
          <div className="mt-2 text-3xl font-black text-slate-900">
            {Object.keys(championPicks).length}
          </div>
          <div className="mt-1 text-xs font-bold text-slate-500">
            Farklı ülkeye dağılmış
          </div>
        </div>
      </div>

      {knockoutMatches.length === 0 ? (
        <div className="rounded-[1.75rem] border-2 border-dashed border-amber-200 bg-amber-50 p-6 text-center">
          <div className="text-5xl">🌱</div>
          <h3 className="mt-3 text-xl font-black">Ağaç henüz filizlenmedi</h3>
          <p className="mx-auto mt-2 max-w-2xl text-sm font-bold text-slate-600">
            Grup aşaması bitmeden gerçek eleme ağacı tam netleşmez. Admin
            panelinden Son 32, Son 16, Çeyrek Final, Yarı Final ve Final maçları
            eklendikçe burası otomatik dolacak.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto pb-3">
          <div
            className="grid min-w-[980px] gap-4"
            style={{
              gridTemplateColumns: `repeat(${stages.length}, minmax(220px, 1fr))`,
            }}
          >
            {matchesByStage.map(({ stage, matches: stageMatches }) => (
              <div
                key={stage}
                className="rounded-[1.75rem] border border-amber-100 bg-gradient-to-b from-amber-50 to-white p-3"
              >
                <div
                  className={`mb-3 rounded-2xl px-3 py-2 text-center font-black ${stage === "Final" ? "bg-amber-400 text-slate-950" : "bg-red-500 text-white"}`}
                >
                  {stage === "Final"
                    ? "🏆 Final"
                    : stage === "Üçüncülük"
                      ? "🥉 Üçüncülük"
                      : stage}
                </div>

                {stageMatches.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-center text-sm font-bold text-slate-400">
                    Eşleşme bekleniyor
                  </div>
                ) : (
                  <div className="space-y-3">
                    {stageMatches.map((match) => {
                      const winner =
                        match.result === "1"
                          ? match.home_team
                          : match.result === "2"
                            ? match.away_team
                            : null;
                      const hasScore =
                        match.home_score !== null &&
                        match.home_score !== undefined;
                      return (
                        <div
                          key={match.id}
                          className={`rounded-2xl border bg-white p-3 shadow-sm ${match.result ? "border-amber-200" : "border-slate-100"}`}
                        >
                          <div className="mb-2 flex items-center justify-between gap-2 text-[11px] font-black text-slate-400">
                            <span>
                              {new Date(match.match_time).toLocaleDateString(
                                "tr-TR",
                                { day: "2-digit", month: "short" },
                              )}
                            </span>
                            <span>
                              {new Date(match.match_time).toLocaleTimeString(
                                "tr-TR",
                                { hour: "2-digit", minute: "2-digit" },
                              )}
                            </span>
                          </div>

                          <div
                            className={`flex items-center justify-between gap-2 rounded-xl px-2 py-2 ${winner === match.home_team ? "bg-green-100 text-green-800" : "bg-slate-50"}`}
                          >
                            <span className="text-sm font-black">
                              <TeamName team={match.home_team} />
                            </span>
                            <span className="text-lg font-black">
                              {hasScore ? match.home_score : "-"}
                            </span>
                          </div>
                          <div
                            className={`mt-1 flex items-center justify-between gap-2 rounded-xl px-2 py-2 ${winner === match.away_team ? "bg-green-100 text-green-800" : "bg-slate-50"}`}
                          >
                            <span className="text-sm font-black">
                              <TeamName team={match.away_team} />
                            </span>
                            <span className="text-lg font-black">
                              {hasScore ? match.away_score : "-"}
                            </span>
                          </div>

                          <div className="mt-2 rounded-xl bg-amber-50 px-2 py-1 text-center text-xs font-black text-amber-800">
                            {winner ? (
                              <>
                                Kazanan: <TeamName team={winner} />
                              </>
                            ) : match.result === "X" ? (
                              "Beraberlik sonucu girilmiş"
                            ) : (
                              "Skor bekleniyor"
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 rounded-[1.75rem] border border-amber-100 bg-amber-50/60 p-5">
        <h3 className="mb-4 text-xl font-black">🏆 Şampiyon Tahminleri</h3>
        {Object.keys(championPicks).length === 0 ? (
          <div className="rounded-2xl bg-white p-4 text-sm font-bold text-slate-500">
            Henüz şampiyon tahmini yok.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(championPicks)
              .sort((a, b) => b[1].length - a[1].length)
              .map(([team, pickers]) => (
                <div
                  key={team}
                  className={`rounded-2xl border p-4 ${champion && champion === team ? "border-green-300 bg-green-50" : champion && champion !== team ? "border-slate-100 bg-slate-50 opacity-70" : "border-amber-100 bg-white"}`}
                >
                  <div className="text-lg font-black">
                    <TeamName team={team} />
                  </div>
                  <div className="mt-2 text-sm font-bold text-slate-500">
                    {pickers.map((p) => p.name).join(" • ")}
                  </div>
                  <div className="mt-3 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">
                    {pickers.length} kişi seçti
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RulesPage() {
  const scoreRules = [
    {
      label: "Doğru tahmin",
      value: "+3",
      tone: "bg-emerald-100 text-emerald-700",
    },
    { label: "Yanlış tahmin", value: "-1", tone: "bg-red-100 text-red-700" },
    { label: "Tahmin yok", value: "-3", tone: "bg-slate-100 text-slate-700" },
    { label: "Joker doğru", value: "+6", tone: "bg-amber-100 text-amber-700" },
    {
      label: "Joker yanlış",
      value: "-2",
      tone: "bg-orange-100 text-orange-700",
    },
  ];

  const tiebreakers = [
    "Toplam puan",
    "Başarı yüzdesi",
    "Doğru tahmin sayısı",
    "Daha az yanlış tahmin",
    "Daha az tahmin yok",
    "Streak / doğru tahmin serisi",
    "Joker performansı",
    "Alfabetik sıra",
  ];

  return (
    <div>
      <div className="mb-6 overflow-hidden rounded-[2rem] bg-gradient-to-br from-red-500 to-amber-400 p-5 text-white shadow-2xl shadow-red-100 md:p-7">
        <div className="text-sm font-black uppercase tracking-wider text-white/80">
          ORS Kahvaltı Ligi
        </div>
        <h2 className="mt-1 text-3xl font-black md:text-4xl">
          📜 Oyun Kuralları
        </h2>
        <p className="mt-2 max-w-3xl font-bold text-white/90">
          Tahmin yap, puan kazan, jokeri doğru yerde kullan ve kahvaltı
          hattından uzak dur. Kurallar burada, bahaneler dışarıda 😄🥯
        </p>
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-5">
        {scoreRules.map((rule) => (
          <div
            key={rule.label}
            className="rounded-[1.25rem] border border-slate-100 bg-white p-4 text-center shadow-sm"
          >
            <div
              className={`mx-auto mb-2 inline-flex rounded-full px-4 py-2 text-xl font-black ${rule.tone}`}
            >
              {rule.value}
            </div>
            <div className="text-sm font-black text-slate-600">
              {rule.label}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <RuleCard icon="🎯" title="Tahmin Mantığı">
          Grup maçlarında 1 / X / 2 seçeneği vardır. Grup aşamasından sonra
          beraberlik seçeneği kalkar; eleme maçlarında sadece 1 veya 2 seçilir.
        </RuleCard>

        <RuleCard icon="🃏" title="Joker Hakkı">
          Her aşamada 1 joker hakkı vardır. Jokerli tahmin doğru çıkarsa +6,
          yanlış çıkarsa -2 puan yazılır. Joker strateji işidir; gönlünün değil,
          aklının sesini dinle 😄
        </RuleCard>

        <RuleCard icon="🥯" title="Kahvaltı Hattı">
          Kahvaltı hattı genel toplam puanda en düşük puana sahip oyunculara
          göre belirlenir. Normalde son 2 kişi hatta girer; 2. sonuncuyla aynı
          puanda olan başka oyuncular varsa onlar da hatta dahil olur.
        </RuleCard>

        <RuleCard icon="🌅" title="Bugün / Yarın Filtresi">
          Maç günü gece 00:00’da değil, sabah 06:00’da değişir. Yani gece 02:00
          ve 04:00 maçları hâlâ önceki akşamın maçları gibi Bugün filtresinde
          görünür.
        </RuleCard>

        <RuleCard icon="🔥" title="Streak / Seri">
          Streak, üst üste doğru bilinen maç serisidir. Eşit puanda 6. kırılım
          olarak devreye girer; yani formda olan oyuncuya küçük bir avantaj
          sağlar.
        </RuleCard>

        <RuleCard icon="🏅" title="Rozetler">
          Profilde performansa göre başarı, joker, kahinlik, simit hattı ve
          komik rozetler kazanılır. Rozetler puan yerine geçmez ama ofis
          itibarına direkt etki eder 😄
        </RuleCard>
      </div>

      <div className="mt-6 rounded-[1.75rem] border border-red-100 bg-red-50/70 p-5">
        <h3 className="mb-4 text-xl font-black">⚖️ Eşit Puan Kuralı</h3>
        <div className="grid gap-2 md:grid-cols-2">
          {tiebreakers.map((item, index) => (
            <div
              key={item}
              className="flex items-center gap-3 rounded-2xl bg-white p-3"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500 text-sm font-black text-white">
                {index + 1}
              </div>
              <div className="font-black text-slate-700">{item}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-[1.75rem] border border-amber-100 bg-amber-50/70 p-5">
        <h3 className="mb-3 text-xl font-black">🧾 Kısa Özet</h3>
        <ul className="space-y-2 text-sm font-bold leading-6 text-slate-700">
          <li>
            • Maç başlamadan tahmin yapılır; başladıktan sonra tahmin kapanır.
          </li>
          <li>• Skor girilince puanlar otomatik hesaplanır.</li>
          <li>• Tahmin yapmayan oyuncuya -3 puan yazılır.</li>
          <li>• Grup sonrası maçlarda beraberlik tahmini yoktur.</li>
          <li>• Joker hakkı güçlüdür ama yanlışta daha fazla yakar.</li>
        </ul>
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
    { key: "karsilastir", label: "Rakip", icon: "🥊" },
    { key: "takimlar", label: "Takım", icon: "🏳️" },
    { key: "agac", label: "Ağaç", icon: "🌳" },
    { key: "kurallar", label: "Kural", icon: "📜" },
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
            className={`rounded-2xl px-2 py-1.5 text-center text-xs font-black transition ${activeTab === item.key ? "bg-red-500 text-white shadow-lg shadow-red-200" : "text-slate-500"}`}
          >
            <div className="text-lg leading-none">{item.icon}</div>
            <div className="mt-1">{item.label}</div>
          </button>
        ))}
      </div>
    </nav>
  );
}

function StatBox({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-amber-50/40 p-4">
      <div className="text-xs font-bold text-slate-500">{title}</div>
      <div className="text-xl font-black text-slate-900">{value}</div>
    </div>
  );
}

function ScoreTable({
  sortedPlayers,
  playerStreaks,
  matches,
  predictions,
  onProfile,
}: {
  sortedPlayers: Player[];
  playerStreaks: Record<string, number>;
  matches: Match[];
  predictions: Prediction[];
  onProfile: (id: string) => void;
}) {
  const jokerWinCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    predictions.forEach((prediction) => {
      if (!prediction.is_joker) return;
      const match = matches.find((m) => m.id === prediction.match_id);
      if (!match?.result) return;
      if (String(prediction.prediction || "").trim() === String(match.result || "").trim()) {
        counts[prediction.player_id] = (counts[prediction.player_id] || 0) + 1;
      }
    });
    return counts;
  }, [matches, predictions]);

  return (
    <div className="overflow-auto">
      <table className="w-full min-w-[1050px]">
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
            <th className="pb-3">Joker Kazandı</th>
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
              <td className="py-3 font-black text-purple-600">
                🃏 {jokerWinCounts[p.id] || 0}
              </td>
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
