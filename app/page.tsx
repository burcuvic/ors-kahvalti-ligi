"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
} from "recharts";

const supabase = createClient(
  "https://mqjgemndxkuufjaeyhjb.supabase.co",
  "sb_publishable_ZcaB2PBtdaBJ6blYdd4wPA_872a5OfE"
);

const ADMIN_PASSWORD = "ors2026";
const MASCOT_SRC = "/ors-mascot.png";
const APP_URL = "https://ors-kahvalti-ligi.vercel.app";

type Player = {
  id: string; name: string; team: string | null; is_admin: boolean;
  correct_count?: number; wrong_count?: number;
  force_majeure?: number; intentional_blank?: number;
  bonus_points?: number; total_points?: number; success_rate?: number;
  champion_team?: string | null;
};

type Match = {
  id: string; home_team: string; away_team: string;
  match_time: string; result: string | null;
  week_no?: number | null; breakfast_round?: string | null; league?: string | null;
  home_score?: number | null; away_score?: number | null;
};

type Prediction = {
  id: string; player_id: string; match_id: string;
  prediction: string; points: number;
  is_joker?: boolean | null;
};

type BonusLog = {
  id: string; player_id: string; match_id: string | null;
  points: number; reason: string | null; created_at: string;
};

const STAGES = ["Tümü", "Gruplar", "Son 32", "Son 16", "Çeyrek Final", "Yarı Final", "Üçüncülük", "Final"];
const MATCH_FILTERS = ["Açık", "Bugün", "Yarın", "Başlayanlar", "Tümü"];

const TEAM_FLAG_CODES: Record<string, string> = {
  Türkiye: "tr", Brezilya: "br", Arjantin: "ar", Almanya: "de",
  Fransa: "fr", İngiltere: "gb-eng", İspanya: "es", Hollanda: "nl",
  Belçika: "be", Portekiz: "pt", Uruguay: "uy", Japonya: "jp",
  ABD: "us", Meksika: "mx", Fas: "ma", İsviçre: "ch",
  Hırvatistan: "hr", Senegal: "sn", Kolombiya: "co", "Güney Kore": "kr",
  "Çek Cumhuriyeti": "cz", Kanada: "ca", "Bosna-Hersek": "ba", Paraguay: "py",
  Katar: "qa", Haiti: "ht", İskoçya: "gb-sct", Avustralya: "au",
  Curaçao: "cw", "Fildişi Sahili": "ci", Ekvador: "ec", İsveç: "se",
  Tunus: "tn", "Cape Verde": "cv", Mısır: "eg", "Suudi Arabistan": "sa",
  İran: "ir", "Yeni Zelanda": "nz", Irak: "iq", Norveç: "no",
  Cezayir: "dz", Avusturya: "at", Ürdün: "jo", "DR Kongo": "cd",
  Özbekistan: "uz", Gana: "gh", Panama: "pa", "Güney Afrika": "za",
};

function flagUrl(team: string) {
  const code = TEAM_FLAG_CODES[team.trim()];
  return code ? `https://flagcdn.com/w40/${code}.png` : "";
}

function TeamName({ team }: { team: string }) {
  const url = flagUrl(team);
  return (
    <span className="inline-flex items-center justify-center gap-2">
      {url ? <img src={url} alt={team} className="h-4 w-6 rounded-[3px] object-cover shadow-sm" /> : <span className="text-sm">🏳️</span>}
      <span>{team}</span>
    </span>
  );
}

const COUNTRY_THEMES: Record<string, { card: string; glow: string; name: string }> = {
  Türkiye: { card: "from-red-500 to-red-700", glow: "shadow-red-200", name: "Ay-Yıldız Ruhlu" },
  Brezilya: { card: "from-yellow-300 to-green-500", glow: "shadow-green-200", name: "Samba Tahmincisi" },
  Arjantin: { card: "from-sky-300 to-blue-500", glow: "shadow-sky-200", name: "Tango Oracle" },
  Almanya: { card: "from-slate-900 to-red-600", glow: "shadow-slate-200", name: "Panzer Disiplini" },
  Fransa: { card: "from-blue-700 to-red-500", glow: "shadow-blue-200", name: "Horoz Modu" },
  İngiltere: { card: "from-red-500 to-slate-100", glow: "shadow-red-100", name: "It's Coming Home" },
  İspanya: { card: "from-red-500 to-yellow-400", glow: "shadow-yellow-200", name: "La Roja" },
  Hollanda: { card: "from-orange-400 to-orange-600", glow: "shadow-orange-200", name: "Portakal Gücü" },
  Portekiz: { card: "from-red-600 to-green-600", glow: "shadow-green-200", name: "Seleção das Quinas" },
  Japonya: { card: "from-white to-red-400", glow: "shadow-red-100", name: "Samuray Tahminci" },
  Meksika: { card: "from-green-500 to-red-500", glow: "shadow-green-200", name: "El Tri Enerjisi" },
  Fas: { card: "from-red-600 to-emerald-500", glow: "shadow-red-200", name: "Atlas Aslanı" },
};

function getCountryTheme(team?: string | null) {
  if (!team) return { card: "from-amber-300 to-orange-300", glow: "shadow-amber-100", name: "Tarafsız Kuş" };
  return COUNTRY_THEMES[team] || { card: "from-amber-300 to-orange-300", glow: "shadow-amber-100", name: "Sürpriz Takımcı" };
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
    .sort((a, b) => new Date(a.match_time).getTime() - new Date(b.match_time).getTime());
  if (upcoming.length === 0) { alert("Önümüzdeki 2 günde maç yok 😄"); return; }
  const grouped: Record<string, Match[]> = {};
  upcoming.forEach((m) => {
    const dateKey = new Date(m.match_time).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", weekday: "long" });
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(m);
  });
  let message = `🥯 ORS Kahvaltı Ligi 🏆\n\n⏰ Önümüzdeki 2 günün maçları:\n\n`;
  for (const [date, matchList] of Object.entries(grouped)) {
    message += `📅 ${date}\n`;
    matchList.forEach((m) => {
      const time = new Date(m.match_time).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
      message += `• ${time} — ${m.home_team} vs ${m.away_team}\n`;
    });
    message += `\n`;
  }
  message += `👉 Tahminini yap, simitten kaç!\n${APP_URL}`;
  shareToWhatsApp(message);
}

function shareMatchReminder(match: Match) {
  const date = new Date(match.match_time).toLocaleString("tr-TR", { day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" });
  const message = `⚽ ${match.home_team} vs ${match.away_team}\n📅 ${date}\n🏆 ${match.league || "Dünya Kupası"}\n\nTahminini yap, simitten kaç! 🥯\n\n👉 ${APP_URL}`;
  shareToWhatsApp(message);
}

// === GÜNÜN ÖZETİ ===
function shareDailySummary(
  players: Player[],
  matches: Match[],
  predictions: Prediction[]
) {
  const now = new Date();
  const today = new Date(now); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);

  const todayMatches = matches.filter((m) => {
    const t = new Date(m.match_time);
    return t >= today && t < tomorrow;
  });

  const todayFinished = todayMatches.filter((m) => m.result);

  const sorted = [...players].sort((a, b) => Number(b.total_points || 0) - Number(a.total_points || 0));
  const lider = sorted[0];
  const kurbanlar = sorted.slice(-2).reverse();

  // Bugünün kahini: en çok doğru bildiği
  const todayStats = players.map((p) => {
    let correct = 0, total = 0;
    todayFinished.forEach((m) => {
      const pred = predictions.find((pr) => pr.player_id === p.id && pr.match_id === m.id);
      if (pred && pred.prediction !== "YOK") {
        total++;
        if (pred.prediction === m.result) correct++;
      }
    });
    return { player: p, correct, total };
  });

  const todayKahin = [...todayStats].sort((a, b) => b.correct - a.correct)[0];
  const todayKurban = [...todayStats].filter((s) => s.total > 0).sort((a, b) => a.correct - b.correct)[0];

  const openCount = matches.filter((m) => {
    return !m.result && new Date(m.match_time).getTime() > Date.now();
  }).length;

  const dateStr = now.toLocaleDateString("tr-TR", { day: "2-digit", month: "long", weekday: "long" });

  let message = `🌅 ORS Kahvaltı Ligi — Günün Özeti\n📅 ${dateStr}\n\n`;
  message += `🏆 Genel Lider: ${lider?.name || "—"} (${lider?.total_points || 0} puan)\n`;
  message += `🥯 Kahvaltı Hattı: ${kurbanlar.map((p) => p.name).join(", ") || "—"}\n\n`;

  if (todayFinished.length > 0) {
    message += `🔥 Bugünün Kahini: ${todayKahin?.player.name || "—"} (${todayKahin?.correct || 0}/${todayKahin?.total || 0})\n`;
    if (todayKurban && todayKurban.correct < todayKurban.total) {
      message += `💔 Bugün Yandı: ${todayKurban.player.name} (${todayKurban.correct}/${todayKurban.total})\n`;
    }
    message += `\n⚽ Bugün ${todayFinished.length} maç oynandı\n`;
  } else {
    message += `⚽ Bugün henüz maç sonuçlanmadı\n`;
  }

  message += `📊 Açık maç: ${openCount}\n\n`;
  message += `👉 ${APP_URL}`;

  shareToWhatsApp(message);
}

// === PDF RAPORU ===
async function downloadPDFReport(
  players: Player[],
  matches: Match[],
  predictions: Prediction[]
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
  const dateStr = new Date().toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });
  doc.text(`Rapor Tarihi: ${dateStr}`, 105, 38, { align: "center" });

  // Genel Sıralama
  const sorted = [...players].sort((a, b) => Number(b.total_points || 0) - Number(a.total_points || 0));

  autoTable(doc, {
    startY: 50,
    head: [["#", "Oyuncu", "Dogru", "Yanlis", "Tahmin Yok", "Ek Puan", "PUAN", "Basari", "Sampiyon"]],
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
    headStyles: { fillColor: [245, 158, 11], textColor: [30, 41, 59], fontStyle: "bold" },
  });

  // Şampiyon tahminleri
  const finalY2 = (doc as any).lastAutoTable?.finalY || finalY;

  doc.setFontSize(14);
  doc.text("Sampiyon Tahminleri", 14, finalY2 + 15);

  autoTable(doc, {
    startY: finalY2 + 20,
    head: [["Ulke", "Secen Oyuncular"]],
    body: Object.entries(championPicks).map(([team, names]) => [team, names.join(", ")]),
    styles: { fontSize: 10, cellPadding: 4 },
    headStyles: { fillColor: [225, 29, 72], textColor: 255, fontStyle: "bold" },
  });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`ors-kahvalti-ligi.vercel.app | Olusturulma: ${new Date().toLocaleString("tr-TR")}`, 105, 285, { align: "center" });

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

  if (match.result) return { status: "finished" as const, label: "Sonuçlandı", color: "bg-slate-200 text-slate-600", borderColor: "border-amber-100" };
  if (diffMs < 0) {
    let timeText = days > 0 ? `${days} gün önce bitti` : hours > 0 ? `${hours} saat önce bitti` : `${mins} dk önce bitti`;
    return { status: "needsScore" as const, label: `🔴 SKOR BEKLİYOR — ${timeText}`, color: "bg-red-500 text-white", borderColor: "border-red-500 ring-2 ring-red-300" };
  }
  if (diffMs < 24 * 60 * 60 * 1000) {
    let timeText = hours > 0 ? `${hours}s ${mins}dk sonra` : `${mins} dk sonra`;
    return { status: "upcoming" as const, label: `🟡 YAKINDA — ${timeText} başlıyor`, color: "bg-amber-100 text-amber-800", borderColor: "border-amber-300" };
  }
  let timeText = days > 0 ? `${days} gün sonra` : `${hours} saat sonra`;
  return { status: "open" as const, label: `🟢 Açık — ${timeText}`, color: "bg-emerald-100 text-emerald-700", borderColor: "border-emerald-200" };
}

// === İSTATİSTİKLER ===
function computeStats(players: Player[], matches: Match[], predictions: Prediction[]) {
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
      const rate = finishedPreds.length > 0 ? Math.round((correct / finishedPreds.length) * 100) : 0;
      return { player: p, rate, finished: finishedPreds.length, correct };
    })
    .filter((x) => x.finished >= 1);

  const kahin = [...playerSuccess].sort((a, b) => b.rate - a.rate)[0];
  const kurban = [...playerSuccess].sort((a, b) => a.rate - b.rate)[0];

  const allValidPreds = predictions.filter((p) => p.prediction !== "YOK" && p.prediction !== "BILINMIYOR");
  const totalPreds = allValidPreds.length;
  const distPct = {
    "1": totalPreds > 0 ? Math.round((allValidPreds.filter((p) => p.prediction === "1").length / totalPreds) * 100) : 0,
    X: totalPreds > 0 ? Math.round((allValidPreds.filter((p) => p.prediction === "X").length / totalPreds) * 100) : 0,
    "2": totalPreds > 0 ? Math.round((allValidPreds.filter((p) => p.prediction === "2").length / totalPreds) * 100) : 0,
  };

  const matchMajority: Record<string, string> = {};
  matches.forEach((m) => {
    const matchPreds = predictions.filter((p) => p.match_id === m.id && p.prediction !== "YOK");
    if (matchPreds.length < 3) return;
    const counts = { "1": 0, X: 0, "2": 0 };
    matchPreds.forEach((p) => { if (p.prediction in counts) counts[p.prediction as "1" | "X" | "2"]++; });
    const max = Math.max(counts["1"], counts.X, counts["2"]);
    if (counts["1"] === max) matchMajority[m.id] = "1";
    else if (counts.X === max) matchMajority[m.id] = "X";
    else matchMajority[m.id] = "2";
  });

  const herdScore = players.map((p) => {
    const playerPreds = predictions.filter((pred) => pred.player_id === p.id && pred.prediction !== "YOK");
    let matchesMajority = 0, total = 0;
    playerPreds.forEach((pred) => {
      if (matchMajority[pred.match_id]) {
        total++;
        if (pred.prediction === matchMajority[pred.match_id]) matchesMajority++;
      }
    });
    const herdPct = total > 0 ? Math.round((matchesMajority / total) * 100) : 0;
    return { player: p, herdPct, total };
  }).filter((x) => x.total >= 3);

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
function getMatchVibe(match: Match, predictions: Prediction[], players: Player[]): string {
  const matchPreds = predictions.filter((p) => p.match_id === match.id && p.prediction !== "YOK");
  const total = matchPreds.length;
  if (total === 0) return "🐣 Henüz kimse tahmin yapmamış. İlk hamle senin olsun!";
  if (total === 1) return "🦅 Tek tahmin var, herkesi mi bekliyorlar?";

  const counts = { "1": 0, X: 0, "2": 0 };
  matchPreds.forEach((p) => { if (p.prediction in counts) counts[p.prediction as "1" | "X" | "2"]++; });
  const pct1 = Math.round((counts["1"] / total) * 100);
  const pctX = Math.round((counts.X / total) * 100);
  const pct2 = Math.round((counts["2"] / total) * 100);
  const maxPct = Math.max(pct1, pctX, pct2);

  const sortedByPts = [...players].sort((a, b) => Number(b.total_points || 0) - Number(a.total_points || 0));
  const lider = sortedByPts[0];
  const kurban = sortedByPts[sortedByPts.length - 1];
  const liderPred = matchPreds.find((p) => p.player_id === lider?.id);
  const kurbanPred = matchPreds.find((p) => p.player_id === kurban?.id);

  const aykiri =
    counts["1"] === 1 ? matchPreds.find((p) => p.prediction === "1") :
    counts.X === 1 && total >= 4 ? matchPreds.find((p) => p.prediction === "X") :
    counts["2"] === 1 ? matchPreds.find((p) => p.prediction === "2") : null;

  if (maxPct >= 80) {
    if (pct1 === maxPct) return `🐑 %${pct1} "${match.home_team}" diyor, kimse karşı çıkmıyor. Sürü etkisi mi, gerçek mi?`;
    if (pct2 === maxPct) return `🐑 %${pct2} "${match.away_team}" diyor, ofis ittifak halinde. Şaşırırsak şaşırırız!`;
    if (pctX === maxPct) return `🤔 %${pctX} beraberlik dedi — anlaşan anlaşmıyor anlaşılan`;
  }

  if (maxPct >= 60 && aykiri) {
    const aykiriPlayer = players.find((p) => p.id === aykiri.player_id);
    if (aykiriPlayer) {
      const yon = maxPct === pct1 ? "1" : maxPct === pct2 ? "2" : "X";
      return `⚡ Herkes ${yon} derken ${aykiriPlayer.name} tek başına ${aykiri.prediction} dedi — ya kahin ya inatçı`;
    }
  }

  if (maxPct < 45) return `🎲 Tam karışık maç: %${pct1}-%${pctX}-%${pct2}. Kim haklı çıkacak, akşam kahvaltısı belirleyecek`;

  if (Math.abs(pct1 - pct2) <= 10 && pctX < 25) {
    return `⚖️ İkiye bölündü ofis: %${pct1} "${match.home_team}" / %${pct2} "${match.away_team}". Sabah çay tartışması garanti`;
  }

  if (liderPred && kurbanPred && liderPred.prediction !== kurbanPred.prediction) {
    return `👑 Lider ${lider.name} ${liderPred.prediction} dedi, sondaki ${kurban.name} ${kurbanPred.prediction} dedi. Tersi mi oynanır acaba?`;
  }

  if (maxPct >= 55) {
    if (pct1 === maxPct) return `📊 ${match.home_team} favori (%${pct1}), ama sürpriz hep mümkün`;
    if (pct2 === maxPct) return `📊 ${match.away_team} favori (%${pct2}), deplasmanda fark yaratabilir`;
    if (pctX === maxPct) return `📊 %${pctX} beraberlik bekliyor, savunma maçı olabilir`;
  }

  return `🎯 Dengeli dağılım: %${pct1} - %${pctX} - %${pct2}. Kafa karıştırıcı maç`;
}

// === PROFİL KARTI ===
function ProfileMascotCard({ player, rank, streak }: { player: Player; rank: number; streak: number }) {
  const theme = getCountryTheme(player.champion_team);
  return (
    <div className={`relative mb-6 overflow-hidden rounded-[2rem] bg-gradient-to-br ${theme.card} p-4 text-slate-950 shadow-2xl md:p-6 ${theme.glow}`}>
      <div className="absolute -right-10 -top-12 h-56 w-56 rounded-full bg-white/25" />
      <div className="absolute -bottom-20 left-8 h-48 w-48 rounded-full bg-white/20" />
      <div className="relative flex flex-wrap items-center justify-between gap-6">
        <div className="flex flex-wrap items-center gap-5">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-white/50 blur-2xl" />
            <img src={MASCOT_SRC} alt="ORS maskotu" className="relative h-40 w-40 object-contain drop-shadow-2xl md:h-64 md:w-64" />
          </div>
          <div>
            <div className="text-sm font-black uppercase tracking-wide opacity-75">Oyuncu Kartı</div>
            <div className="text-3xl font-black leading-none md:text-4xl">{player.name}</div>
            <div className="mt-3 text-sm font-black uppercase tracking-wide opacity-70">{theme.name}</div>
            <div className="mt-3 text-xl font-black">
              {player.champion_team ? <TeamName team={player.champion_team} /> : "Şampiyon seçilmedi"}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/50 bg-white/45 px-3 py-1 text-xs font-black">👑 #{rank} sıra</span>
              <span className="rounded-full border border-white/50 bg-white/45 px-3 py-1 text-xs font-black">🔥 {streak || 0} maç streak</span>
              <span className="rounded-full border border-white/50 bg-white/45 px-3 py-1 text-xs font-black">🏆 {player.champion_team || "Tarafsız"}</span>
            </div>
          </div>
        </div>
        <div className="rounded-[1.75rem] border border-white/50 bg-white/40 p-5 text-right backdrop-blur">
          <div className="text-sm font-black uppercase opacity-70">Toplam Puan</div>
          <div className="text-5xl font-black md:text-6xl">{player.total_points || 0}</div>
          <div className="mt-1 text-xs font-black opacity-70">Başarı %{player.success_rate || 0}</div>
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

  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [loginName, setLoginName] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const [selectedStage, setSelectedStage] = useState("Tümü");
  const [predictionFilter, setPredictionFilter] = useState("Açık");
  const [matchListFilter, setMatchListFilter] = useState("Tümü");

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

  const [scoreInputs, setScoreInputs] = useState<Record<string, { home: string; away: string }>>({});
  const [bonusInputs, setBonusInputs] = useState<Record<string, { playerId: string; points: string; reason: string }>>({});

  const loadData = async () => {
    const { data: playersData } = await supabase.from("players").select("*");
    const { data: matchesData } = await supabase.from("matches").select("*").order("match_time", { ascending: true });
    const { data: predictionsData } = await supabase.from("predictions").select("*");
    const { data: bonusData } = await supabase.from("bonus_logs").select("*").order("created_at", { ascending: false });
    setPlayers(playersData || []);
    setMatches(matchesData || []);
    setPredictions(predictionsData || []);
    setBonusLogs(bonusData || []);
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    const savedId = localStorage.getItem("ors_current_player_id");
    if (!savedId || players.length === 0) return;
    const player = players.find((p) => p.id === savedId);
    if (player) { setCurrentPlayer(player); setProfilePlayerId(player.id); }
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
    if (!currentPlayer || typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    const checkUpcomingMatches = () => {
      const now = Date.now();
      const notifiedRaw = localStorage.getItem("ors_notified_matches");
      const notified: string[] = notifiedRaw ? JSON.parse(notifiedRaw) : [];

      matches.forEach((match) => {
        if (match.result) return;
        const matchTime = new Date(match.match_time).getTime();
        const diffMinutes = (matchTime - now) / (1000 * 60);
        const alreadyPredicted = predictions.some((p) => p.player_id === currentPlayer.id && p.match_id === match.id);
        const notificationKey = `${currentPlayer.id}-${match.id}`;

        if (diffMinutes > 0 && diffMinutes <= 60 && !alreadyPredicted && !notified.includes(notificationKey)) {
          new Notification("⏰ Maça 1 saatten az kaldı!", {
            body: `${match.home_team} - ${match.away_team} için tahminini yapmayı unutma ⚽`,
            icon: "/ors-mascot.png",
          });
          localStorage.setItem("ors_notified_matches", JSON.stringify([...notified, notificationKey]));
        }
      });
    };

    checkUpcomingMatches();
    const timer = window.setInterval(checkUpcomingMatches, 60 * 1000);
    return () => window.clearInterval(timer);
  }, [matches, predictions, currentPlayer]);

  const enableNotifications = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) { alert("Bu tarayıcı bildirim desteklemiyor 😢"); return; }
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      setNotificationsEnabled(true);
      new Notification("ORS bildirimleri açıldı 🐦", { body: "Maça 1 saat kala seni uyaracağım ⚽", icon: "/ors-mascot.png" });
    } else { setNotificationsEnabled(false); alert("Bildirim izni verilmedi 😄"); }
  };

  const login = () => {
    const player = players.find((p) => p.name.toLowerCase() === loginName.trim().toLowerCase());
    if (!player) { alert("Bu kullanıcı sistemde tanımlı değil 😄"); return; }
    setCurrentPlayer(player); setProfilePlayerId(player.id);
    localStorage.setItem("ors_current_player_id", player.id);
  };

  const logout = () => {
    localStorage.removeItem("ors_current_player_id");
    setCurrentPlayer(null); setLoginName(""); setActiveTab("dashboard");
    setAdminUnlocked(false); setAdminPassword("");
  };

  const tournamentTeams = useMemo(() => {
    const blocked = ["Kazananı", "Mağlubu", "3.", "A ", "B ", "C ", "D ", "E ", "F ", "G ", "H ", "I ", "J ", "K ", "L "];
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
    if (selectedStage === "Gruplar") return matches.filter((m) => m.league?.startsWith("Grup"));
    return matches.filter((m) => m.league === selectedStage);
  }, [matches, selectedStage]);

  const applyTimeFilter = (matchList: Match[], filter: string) => {
    const now = new Date();
    return matchList.filter((match) => {
      const matchDate = new Date(match.match_time);
      const today = new Date(now); today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
      const nextDay = new Date(today); nextDay.setDate(today.getDate() + 2);
      const isToday = matchDate >= today && matchDate < tomorrow;
      const isTomorrow = matchDate >= tomorrow && matchDate < nextDay;
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

  const predictionMatches = useMemo(() => applyTimeFilter(filteredMatches, predictionFilter), [filteredMatches, predictionFilter]);
  const matchListMatches = useMemo(() => applyTimeFilter(filteredMatches, matchListFilter), [filteredMatches, matchListFilter]);
  const openMatchesCount = useMemo(() => applyTimeFilter(filteredMatches, "Açık").length, [filteredMatches]);

  const playerStreaks = useMemo(() => {
    const streaks: Record<string, number> = {};
    players.forEach((player) => {
      const playerPredictions = predictions
        .filter((p) => p.player_id === player.id)
        .sort((a, b) => {
          const ma = matches.find((m) => m.id === a.match_id);
          const mb = matches.find((m) => m.id === b.match_id);
          return new Date(mb?.match_time || 0).getTime() - new Date(ma?.match_time || 0).getTime();
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

  const jokerScores = useMemo(() => {
    const scores: Record<string, number> = {};
    players.forEach((player) => {
      const jokerPreds = predictions.filter((pred) => pred.player_id === player.id && pred.is_joker);
      const jokerCorrect = jokerPreds.filter((pred) => {
        const match = matches.find((m) => m.id === pred.match_id);
        return !!match?.result && pred.prediction === match.result;
      }).length;
      const jokerWrong = jokerPreds.filter((pred) => {
        const match = matches.find((m) => m.id === pred.match_id);
        return !!match?.result && pred.prediction !== match.result && pred.prediction !== "YOK";
      }).length;
      scores[player.id] = jokerCorrect * 2 - jokerWrong;
    });
    return scores;
  }, [players, predictions, matches]);

  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => {
      const pointsDiff = Number(b.total_points || 0) - Number(a.total_points || 0);
      if (pointsDiff !== 0) return pointsDiff;

      const successDiff = Number(b.success_rate || 0) - Number(a.success_rate || 0);
      if (successDiff !== 0) return successDiff;

      const correctDiff = Number(b.correct_count || 0) - Number(a.correct_count || 0);
      if (correctDiff !== 0) return correctDiff;

      const wrongDiff = Number(a.wrong_count || 0) - Number(b.wrong_count || 0);
      if (wrongDiff !== 0) return wrongDiff;

      const blankDiff = Number(a.intentional_blank || 0) - Number(b.intentional_blank || 0);
      if (blankDiff !== 0) return blankDiff;

      const streakDiff = Number(playerStreaks[b.id] || 0) - Number(playerStreaks[a.id] || 0);
      if (streakDiff !== 0) return streakDiff;

      const jokerDiff = Number(jokerScores[b.id] || 0) - Number(jokerScores[a.id] || 0);
      if (jokerDiff !== 0) return jokerDiff;

      return a.name.localeCompare(b.name, "tr");
    });
  }, [players, playerStreaks, jokerScores]);

  const getPointsByPlayer = (matchList: Match[], ascending = false) => {
    const data = players.map((player) => {
      const points = matchList.reduce((sum, match) => {
        const pred = predictions.find((p) => p.player_id === player.id && p.match_id === match.id);
        const bonus = bonusLogs.filter((b) => b.player_id === player.id && b.match_id === match.id)
          .reduce((bonusSum, b) => bonusSum + Number(b.points || 0), 0);
        return sum + Number(pred?.points || 0) + bonus;
      }, 0);
      return { ...player, period_points: points };
    });
    return data.sort((a, b) => ascending ? a.period_points - b.period_points : b.period_points - a.period_points);
  };

  const stageScores = useMemo(() => getPointsByPlayer(filteredMatches, true), [players, predictions, bonusLogs, filteredMatches]);

  const profilePlayer = useMemo(() => players.find((p) => p.id === profilePlayerId) || currentPlayer, [profilePlayerId, players, currentPlayer]);

  const profilePredictions = useMemo(() => {
    if (!profilePlayer) return [];
    return predictions.filter((p) => p.player_id === profilePlayer.id)
      .map((p) => ({ ...p, match: matches.find((m) => m.id === p.match_id) }))
      .filter((p) => p.match)
      .sort((a, b) => new Date(b.match!.match_time).getTime() - new Date(a.match!.match_time).getTime());
  }, [profilePlayer, predictions, matches]);

  const profileStageData = useMemo(() => {
    if (!profilePlayer) return [];
    return STAGES.filter((s) => s !== "Tümü").map((stage) => {
      const stageMatches = stage === "Gruplar"
        ? matches.filter((m) => m.league?.startsWith("Grup"))
        : matches.filter((m) => m.league === stage);
      const points = stageMatches.reduce((sum, match) => {
        const pred = predictions.find((p) => p.player_id === profilePlayer.id && p.match_id === match.id);
        const bonus = bonusLogs.filter((b) => b.player_id === profilePlayer.id && b.match_id === match.id)
          .reduce((bonusSum, b) => bonusSum + Number(b.points || 0), 0);
        return sum + Number(pred?.points || 0) + bonus;
      }, 0);
      return { stage, points };
    });
  }, [profilePlayer, matches, predictions, bonusLogs]);

  const getConsensus = (matchId: string) => {
    const matchPreds = predictions.filter((p) => p.match_id === matchId && p.prediction !== "YOK");
    const total = matchPreds.length;
    if (total === 0) return { "1": 0, X: 0, "2": 0, total: 0 };
    const c = { "1": 0, X: 0, "2": 0 };
    matchPreds.forEach((p) => { if (p.prediction in c) c[p.prediction as "1" | "X" | "2"]++; });
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

  const makePrediction = async (match: Match, prediction: string, useJoker = false) => {
    if (!currentPlayer) return;
    if (new Date(match.match_time).getTime() <= Date.now()) { alert("Maç saati geldiği için tahmin kapandı 😄"); return; }
    if (match.result) { alert("Bu maç sonuçlanmış."); return; }

    if (useJoker) {
      const usedJoker = getUsedJokerForStage(match, currentPlayer.id);
      if (usedJoker && usedJoker.match_id !== match.id) {
        const jokerMatch = matches.find((m) => m.id === usedJoker.match_id);
        alert(`Bu aşamada joker hakkını zaten kullandın 🃏\n${jokerMatch ? `${jokerMatch.home_team} - ${jokerMatch.away_team}` : "Başka bir maç"}`);
        return;
      }
    }

    const { error } = await supabase.from("predictions").upsert(
      { player_id: currentPlayer.id, match_id: match.id, prediction, points: 0, is_joker: useJoker },
      { onConflict: "player_id,match_id" }
    );
    if (error) { alert(error.message); return; }
    await loadData();
  };

  const saveChampionPick = async (team: string) => {
    if (!currentPlayer) return;
    if (championPickLocked) { alert("Şampiyon tahmini kilitlendi 🔒"); return; }
    const { error } = await supabase.from("players").update({ champion_team: team }).eq("id", currentPlayer.id);
    if (error) { alert(error.message); return; }
    await loadData();
    alert(`Şampiyon tahminin kaydedildi: ${team} 🏆`);
  };

  const awardChampionBonus = async () => {
    if (!currentPlayer?.is_admin || !adminUnlocked) return;
    if (!championWinner) { alert("Şampiyon ülkeyi seç 😄"); return; }
    if (!confirm(`${championWinner} seçenlere +100 puan verilsin mi?`)) return;
    const winners = players.filter((p) => p.champion_team === championWinner);
    for (const player of winners) {
      const alreadyAwarded = bonusLogs.some((b) => b.player_id === player.id && b.reason === `Şampiyon tahmini: ${championWinner}`);
      if (alreadyAwarded) continue;
      await supabase.from("bonus_logs").insert({
        player_id: player.id, match_id: null, points: 100, reason: `Şampiyon tahmini: ${championWinner}`,
      });
      await supabase.from("players").update({
        bonus_points: Number(player.bonus_points || 0) + 100,
        total_points: Number(player.total_points || 0) + 100,
      }).eq("id", player.id);
    }
    await loadData();
    alert(`${winners.length} kişiye şampiyon bonusu işlendi 🏆`);
  };

  const recalculateAllScores = async (overrideMatchId?: string, overrideResult?: string) => {
    const { data: latestPlayers } = await supabase.from("players").select("*");
    const { data: latestPredictions } = await supabase.from("predictions").select("*");
    const { data: latestBonusLogs } = await supabase.from("bonus_logs").select("*");

    const playerList = latestPlayers || [];
    const predictionList = latestPredictions || [];
    const bonusList = latestBonusLogs || [];

    for (const player of playerList) {
      const playerPredictions = predictionList.filter((p) => p.player_id === player.id);
      let correct = 0, wrong = 0, blank = 0, predictionPoints = 0;

      for (const pred of playerPredictions) {
        const predMatch = matches.find((m) => m.id === pred.match_id);
        const finalResult = pred.match_id === overrideMatchId ? overrideResult : predMatch?.result;
        if (!finalResult) continue;

        let points = -3;
        if (pred.prediction === "YOK") {
          blank++;
          points = -3;
        } else if (pred.prediction === finalResult) {
          correct++;
          points = pred.is_joker ? 6 : 3;
        } else {
          wrong++;
          points = pred.is_joker ? -2 : -1;
        }

        predictionPoints += points;
        await supabase.from("predictions").update({ points }).eq("id", pred.id);
      }

      const bonusPoints = bonusList.filter((b) => b.player_id === player.id).reduce((sum, b) => sum + Number(b.points || 0), 0);
      const totalAnswered = correct + wrong;
      const successRate = totalAnswered > 0 ? Number(((correct / totalAnswered) * 100).toFixed(1)) : 0;

      await supabase.from("players").update({
        correct_count: correct, wrong_count: wrong, intentional_blank: blank,
        bonus_points: bonusPoints, total_points: predictionPoints + bonusPoints, success_rate: successRate,
      }).eq("id", player.id);
    }
  };

  const addMissingNoPredictionsForMatch = async (match: Match) => {
    for (const player of players) {
      const exists = predictions.some((p) => p.player_id === player.id && p.match_id === match.id);
      if (!exists) {
        await supabase.from("predictions").insert({
          player_id: player.id, match_id: match.id, prediction: "YOK", points: -3, is_joker: false,
        });
      }
    }
  };

  const updateResult = async (match: Match, result: string, homeScore?: number, awayScore?: number) => {
    if (!currentPlayer?.is_admin || !adminUnlocked) return;
    await addMissingNoPredictionsForMatch(match);
    await supabase.from("matches").update({
      result, home_score: homeScore ?? null, away_score: awayScore ?? null,
    }).eq("id", match.id);
    await recalculateAllScores(match.id, result);
    await loadData();
  };

  const submitScore = async (match: Match) => {
    const score = scoreInputs[match.id];
    if (!score?.home || !score?.away) { alert("Skorları gir 😄"); return; }
    const home = Number(score.home), away = Number(score.away);
    if (Number.isNaN(home) || Number.isNaN(away)) { alert("Skorlar sayı olmalı 😄"); return; }
    const result = home > away ? "1" : home < away ? "2" : "X";
    await updateResult(match, result, home, away);
  };

  const addBonusToMatch = async (match: Match) => {
    if (!currentPlayer?.is_admin || !adminUnlocked) return;
    const input = bonusInputs[match.id];
    if (!input?.playerId || !input?.points) { alert("Oyuncu ve puan gir 😄"); return; }
    const bonusPoint = Number(input.points);
    if (Number.isNaN(bonusPoint)) { alert("Ek puan sayı olmalı 😄"); return; }
    const player = players.find((p) => p.id === input.playerId);
    if (!player) return;

    await supabase.from("bonus_logs").insert({
      player_id: player.id, match_id: match.id, points: bonusPoint, reason: input.reason || null,
    });
    await recalculateAllScores();
    setBonusInputs((prev) => ({ ...prev, [match.id]: { playerId: "", points: "", reason: "" } }));
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
    const lines = text.split(/\r?\n/).map((r) => r.trim()).filter(Boolean);
    if (lines.length < 2) { alert("CSV boş görünüyor 😄"); return; }
    const splitRow = (row: string) => {
      if (row.includes(";")) return row.split(";").map((x) => x.trim());
      if (row.includes("\t")) return row.split("\t").map((x) => x.trim());
      return row.split(",").map((x) => x.trim());
    };
    let added = 0;
    for (const row of lines.slice(1)) {
      const cols = splitRow(row);
      const home = cols[0]?.trim(), away = cols[1]?.trim();
      const stage = cols[2]?.trim(), time = cols[3]?.trim();
      if (!home || !away || !stage || !time) continue;
      const { error } = await supabase.from("matches").insert({
        week_no: 999, home_team: home, away_team: away,
        breakfast_round: "Dünya Kupası 2026", league: stage, match_time: time, result: null,
      });
      if (!error) added++;
    }
    e.target.value = "";
    await loadData();
    alert(`${added} maç yüklendi 😄`);
  };

  const addMatch = async () => {
    if (!currentPlayer?.is_admin || !adminUnlocked) return;
    if (!homeTeam || !awayTeam || !matchTime || !league) { alert("Maç bilgilerini doldur 😄"); return; }
    const { error } = await supabase.from("matches").insert({
      home_team: homeTeam.trim(), away_team: awayTeam.trim(), match_time: matchTime,
      week_no: 999, breakfast_round: "Dünya Kupası 2026", league: league.trim(), result: null,
    });
    if (error) { alert(error.message); return; }
    setHomeTeam(""); setAwayTeam(""); setMatchTime(""); setLeague("");
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
            <img src={MASCOT_SRC} alt="ORS maskotu" className="h-44 w-44 rounded-full object-contain drop-shadow-xl" />
          </div>
          <h1 className="text-center text-2xl font-black">ORS Kahvaltı Ligi</h1>
          <p className="mb-6 text-center font-bold text-red-500">Dünya Kupası Edition</p>
          <input value={loginName} onChange={(e) => setLoginName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && login()}
            placeholder="Kullanıcı adını gir"
            className="mb-4 w-full rounded-2xl border border-amber-100 bg-amber-50/40 p-4 outline-none" />
          <button onClick={login} className="w-full rounded-2xl bg-amber-400 p-4 font-black text-slate-950">Giriş Yap</button>
        </div>
      </main>
    );
  }

  const tabs = currentPlayer.is_admin
    ? ["dashboard", "tahmin", "maclar", "profil", "karsilastir", "admin"]
    : ["dashboard", "tahmin", "maclar", "profil", "karsilastir"];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#FFF7E8] text-slate-900">
      <div className="pointer-events-none fixed left-[-10rem] top-[-10rem] h-96 w-96 rounded-full bg-amber-300/40 blur-3xl" />
      <div className="pointer-events-none fixed right-[-12rem] top-32 h-[28rem] w-[28rem] rounded-full bg-red-300/30 blur-3xl" />
      <div className="pointer-events-none fixed bottom-[-12rem] left-1/3 h-[24rem] w-[24rem] rounded-full bg-orange-200/50 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-4 pb-28 md:py-8">
        {/* HEADER */}
        <header className="relative mb-4 overflow-hidden rounded-[1.75rem] border-4 border-red-100 bg-white p-4 shadow-2xl shadow-red-100 md:mb-6 md:rounded-[2rem] md:p-8">
          <div className="absolute -right-4 -top-4 hidden h-44 w-44 rotate-6 rounded-full bg-amber-100 md:block" />
          <img src={MASCOT_SRC} alt="ORS maskotu" className="absolute right-6 top-2 hidden h-44 w-44 object-contain drop-shadow-xl md:block" />

          <h1 className="relative text-[2.35rem] font-black leading-none md:text-5xl">ORS Kahvaltı Ligi</h1>
          <p className="relative mt-1 text-[1.55rem] font-black leading-tight text-red-500 md:mt-2 md:text-4xl">World Cup 2026 Edition 🏆</p>
          <p className="relative mb-3 mt-3 inline-flex rounded-full bg-amber-100 px-3 py-1.5 text-xs font-black text-amber-700 md:mb-6 md:px-4 md:py-2 md:text-sm">
            Tahmin Et • Kazan • Kahvaltıdan Kaç 🥯
          </p>
          <p className="mb-4 font-bold text-slate-600">Hoş geldin <b>{currentPlayer.name}</b> 😄</p>

          <div className="mb-6 flex flex-wrap gap-2">
            <button onClick={enableNotifications}
              className={`rounded-full px-4 py-2 text-sm font-black transition ${notificationsEnabled ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600 hover:bg-red-200"}`}>
              {notificationsEnabled ? "🔔 Bildirim açık" : "🔕 Bildirim aç"}
            </button>
            {currentPlayer.is_admin && (
              <button onClick={() => shareUpcomingMatches(matches)}
                className="rounded-full bg-green-500 px-4 py-2 text-sm font-black text-white hover:bg-green-600 transition">
                📢 WhatsApp Hatırlat
              </button>
            )}
            {currentPlayer.is_admin && (
              <button
                onClick={() => shareDailySummary(players, matches, predictions)}
                className="rounded-full bg-amber-400 px-4 py-2 text-sm font-black text-slate-950 hover:bg-amber-500 transition"
              >
                🌅 Günün Özeti
              </button>
            )}
            <button onClick={logout} className="rounded-full bg-red-500 px-4 py-2 text-sm font-black text-white">Çıkış</button>
          </div>

          <div className="mb-6 hidden flex-wrap gap-3 md:flex">
            {tabs.map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`rounded-2xl px-5 py-3 font-black transition ${activeTab === tab ? "bg-red-500 text-white shadow-lg shadow-red-200" : "bg-amber-50 text-slate-700 hover:bg-amber-100"}`}>
                {tab === "dashboard" && "Dashboard"}
                {tab === "tahmin" && "Tahmin Yap"}
                {tab === "maclar" && "Maçlar"}
                {tab === "profil" && "Profil"}
                {tab === "karsilastir" && "Karşılaştır"}
                {tab === "admin" && "Admin"}
              </button>
            ))}
          </div>

          <StageFilter selectedStage={selectedStage} setSelectedStage={setSelectedStage} />
        </header>

        {/* DASHBOARD */}
        {activeTab === "dashboard" && (
          <section className="rounded-[1.75rem] border-4 border-red-50 bg-white p-4 shadow-2xl shadow-red-100/70 md:rounded-[2rem] md:p-6">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-black">🏆 Dashboard</h2>

              {currentPlayer.is_admin && (
                <button
                  onClick={() => downloadPDFReport(players, matches, predictions)}
                  className="rounded-full bg-slate-900 px-4 py-2 text-sm font-black text-white hover:bg-slate-700 transition"
                >
                  📄 PDF Rapor
                </button>
              )}
            </div>
            <MatchdayBanner matches={matches} />

            <div className="mb-6 grid gap-3 md:grid-cols-3">
              <MiniDashboardCard icon="👑" title="Genel Lider" value={sortedPlayers[0]?.name || "-"} note={`${sortedPlayers[0]?.total_points || 0} puan`} tone="amber" />
              <MiniDashboardCard icon="🥯" title="Kahvaltı Hattı" value={stageScores.slice(0, 2).map((p) => p.name).join(" • ") || "-"} note="Bu aşamada riskli bölge" tone="red" />
              <MiniDashboardCard icon="⚽" title="Açık Maç" value={String(openMatchesCount)} note="Tahmin için hazır" tone="blue" />
            </div>

            <StatsPanel players={players} matches={matches} predictions={predictions} />

            <ScoreTable sortedPlayers={sortedPlayers} playerStreaks={playerStreaks}
              onProfile={(id) => { setProfilePlayerId(id); setActiveTab("profil"); }} />
          </section>
        )}

        {/* TAHMIN */}
        {activeTab === "tahmin" && (
          <section className="rounded-[1.75rem] border-4 border-red-50 bg-white p-4 shadow-2xl shadow-red-100/70 md:rounded-[2rem] md:p-6">
            <h2 className="mb-6 text-xl font-black">🎯 Tahmin Yap</h2>

            <ChampionPredictionCard currentPlayer={currentPlayer} tournamentTeams={tournamentTeams}
              championPickLocked={championPickLocked} saveChampionPick={saveChampionPick} />

            <FilterButtons value={predictionFilter} onChange={setPredictionFilter} />

            {predictionMatches.length === 0 && (
              <div className="rounded-[1.75rem] bg-amber-50 p-6 text-slate-600">Bu filtrede maç yok 😄</div>
            )}

            <div className="space-y-4">
              {predictionMatches.map((match) => {
                const myPrediction = predictions.find((p) => p.match_id === match.id && p.player_id === currentPlayer.id);
                const consensus = getConsensus(match.id);
                const isStarted = new Date(match.match_time).getTime() <= Date.now();
                const status = getMatchStatus(match);

                return (
                  <div key={match.id} className={`rounded-3xl border bg-amber-50/40 p-4 transition hover:scale-[1.01] hover:shadow-lg ${status.borderColor}`}>
                    <div className="flex flex-wrap justify-between gap-3 text-sm text-slate-500">
                      <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-black text-slate-950">{match.league || "Dünya Kupası"}</span>
                      <span>{new Date(match.match_time).toLocaleString("tr-TR")}</span>
                    </div>

                    <div className="mt-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${status.color}`}>{status.label}</span>
                    </div>

                    <div className="my-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-center md:my-4">
                      <div className="text-xl font-black"><TeamName team={match.home_team} /></div>
                      <div className="font-black text-red-500">⚔️</div>
                      <div className="text-xl font-black"><TeamName team={match.away_team} /></div>
                    </div>

                    {isStarted || match.result ? (
                      <div className="rounded-2xl bg-white p-3 text-center font-black text-slate-500">Tahmin kapandı 🔒</div>
                    ) : (
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                          {["1", "X", "2"].map((v) => (
                            <button key={v} onClick={() => makePrediction(match, v, false)}
                              className={`rounded-2xl py-3 text-lg font-black md:py-3 md:text-base ${myPrediction?.prediction === v && !myPrediction?.is_joker ? "bg-amber-400 text-slate-950" : "border border-amber-100 bg-white hover:bg-amber-100"}`}>
                              {v}
                            </button>
                          ))}
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {["1", "X", "2"].map((v) => {
                            const stageJoker = getUsedJokerForStage(match, currentPlayer.id);
                            const jokerBlocked = !!stageJoker && stageJoker.match_id !== match.id;
                            return (
                              <button key={`joker-${v}`} onClick={() => makePrediction(match, v, true)} disabled={jokerBlocked}
                                className={`rounded-2xl border-2 py-2 text-xs font-black transition ${myPrediction?.prediction === v && myPrediction?.is_joker ? "border-purple-500 bg-purple-600 text-white shadow-lg shadow-purple-200" : jokerBlocked ? "cursor-not-allowed border-slate-100 bg-slate-100 text-slate-400" : "border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100"}`}>
                                🃏 Joker {v}
                              </button>
                            );
                          })}
                        </div>
                        <div className="rounded-2xl border border-purple-100 bg-purple-50 px-3 py-2 text-xs font-bold text-purple-700">
                          🃏 Joker kuralı: Her aşamada 1 hak. Doğru joker +6, yanlış joker -2.
                        </div>
                      </div>
                    )}

                    {myPrediction && <p className="mt-3 text-sm font-bold text-amber-600">Tahminin: {myPrediction.prediction}{myPrediction.is_joker ? " 🃏 Jokerli" : ""}</p>}

                    {myPrediction && (
                      <div className="mt-4 rounded-2xl border-2 border-amber-200 bg-amber-50 px-3 py-2.5 text-sm font-black text-amber-900">
                        💬 {getMatchVibe(match, predictions, players)}
                      </div>
                    )}

                    {myPrediction && (
                      <div className="mt-4 rounded-2xl border border-amber-100 bg-white p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <div className="text-sm font-black text-slate-700">🗣️ Diğerleri ne dedi?</div>
                          <div className="text-xs font-bold text-slate-500">{consensus.total} tahmin</div>
                        </div>
                        <div className="space-y-2">
                          {(["1", "X", "2"] as const).map((v) => {
                            const pct = consensus[v];
                            return (
                              <div key={v} className="flex items-center gap-2">
                                <div className="w-8 text-center text-sm font-black">{v}</div>
                                <div className="relative h-6 flex-1 overflow-hidden rounded-full bg-slate-100">
                                  <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                                  <div className="absolute inset-0 flex items-center justify-end pr-2 text-xs font-black">%{pct}</div>
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
            <FilterButtons value={matchListFilter} onChange={setMatchListFilter} />

            <div className="space-y-4">
              {matchListMatches.map((match) => {
                const matchBonuses = bonusLogs.filter((b) => b.match_id === match.id);
                const status = getMatchStatus(match);
                const isStarted = new Date(match.match_time).getTime() <= Date.now();

                return (
                  <div key={match.id} className={`rounded-3xl border bg-amber-50/40 p-4 transition hover:scale-[1.01] hover:shadow-lg ${status.borderColor}`}>
                    <div className="flex flex-wrap justify-between gap-3 text-sm text-slate-500">
                      <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-black text-slate-950">{match.league || "Dünya Kupası"}</span>
                      <span>{new Date(match.match_time).toLocaleString("tr-TR")}</span>
                    </div>

                    <div className="mt-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${status.color}`}>{status.label}</span>
                    </div>

                    <div className="my-3 text-xl font-black">
                      <TeamName team={match.home_team} /> - <TeamName team={match.away_team} />
                    </div>

                    <div className="mb-3 font-black text-amber-600">
                      Sonuç: {match.home_score !== null && match.home_score !== undefined
                        ? `${match.home_score} - ${match.away_score} (${match.result})`
                        : match.result || "Bekleniyor"}
                    </div>

                    <div className="grid gap-2 md:grid-cols-2">
                      {players.map((player) => {
                        const pred = predictions.find((p) => p.player_id === player.id && p.match_id === match.id);
                        return (
                          <div key={player.id} className="flex justify-between rounded-xl border border-slate-100 bg-white px-3 py-2">
                            <span>{player.name}</span>
                            <span className="font-black">
                              {!isStarted && !match.result && !currentPlayer.is_admin
                                ? "Gizli 🔒"
                                : pred ? `${pred.prediction}${pred.is_joker ? " 🃏" : ""} (${pred.points})` : "Yok"}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {matchBonuses.length > 0 && (
                      <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3">
                        <div className="mb-2 font-black">🏆 Bu Maçın Ek Puanları</div>
                        {matchBonuses.map((bonus) => {
                          const player = players.find((p) => p.id === bonus.player_id);
                          return (
                            <div key={bonus.id} className="flex justify-between border-b border-amber-100 py-1">
                              <span>{player?.name || "Oyuncu"} <span className="text-slate-500">{bonus.reason ? `• ${bonus.reason}` : ""}</span></span>
                              <span className="font-black text-amber-700">{bonus.points > 0 ? "+" : ""}{bonus.points}</span>
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
              <select value={profilePlayerId} onChange={(e) => setProfilePlayerId(e.target.value)}
                className="rounded-2xl border border-amber-100 bg-amber-50/40 p-3 font-black">
                {players.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}{p.id === currentPlayer.id ? " (sen)" : ""}</option>
                ))}
              </select>
            </div>

            <ProfileMascotCard player={profilePlayer}
              rank={sortedPlayers.findIndex((p) => p.id === profilePlayer.id) + 1}
              streak={playerStreaks[profilePlayer.id] || 0} />

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
              <StatBox title="YOK" value={profilePlayer.intentional_blank || 0} />
              <StatBox title="EK PUAN" value={profilePlayer.bonus_points || 0} />
              <StatBox title="BAŞARI" value={`%${profilePlayer.success_rate || 0}`} />
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
                    <Bar dataKey="points" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-amber-100 bg-amber-50/50 p-5">
              <h3 className="mb-4 text-xl font-black">📜 Son 10 Tahmin</h3>
              <div className="space-y-2">
                {profilePredictions.slice(0, 10).map((p) => (
                  <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-100 bg-white p-3">
                    <div>
                      <div className="font-black">
                        {p.match?.home_team && <TeamName team={p.match.home_team} />} - {p.match?.away_team && <TeamName team={p.match.away_team} />}
                      </div>
                      <div className="text-xs text-slate-500">{p.match?.league || "-"}</div>
                    </div>
                    <div className="text-sm font-bold">Tahmin: {p.prediction}{p.is_joker ? " 🃏" : ""}</div>
                    <div className="text-sm font-bold">Sonuç: {p.match?.result || "—"}</div>
                    <div className="rounded-lg bg-slate-100 px-3 py-1 text-sm font-black">
                      {p.match?.result ? `${p.points > 0 ? "+" : ""}${p.points}` : "Bekliyor"}
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
              onProfile={(id) => { setProfilePlayerId(id); setActiveTab("profil"); }}
            />
          </section>
        )}

        {/* ADMIN */}
        {activeTab === "admin" && currentPlayer.is_admin && (
          <section className="rounded-[1.75rem] border-4 border-red-50 bg-white p-4 shadow-2xl shadow-red-100/70 md:rounded-[2rem] md:p-6">
            <h2 className="mb-6 text-xl font-black">👑 Admin Paneli</h2>

            {!adminUnlocked ? (
              <div className="max-w-md rounded-[1.75rem] border border-amber-100 bg-amber-50/50 p-5">
                <h3 className="mb-3 text-xl font-black">Admin Şifresi</h3>
                <input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (adminPassword === ADMIN_PASSWORD ? setAdminUnlocked(true) : alert("Şifre yanlış 😄"))}
                  placeholder="Admin şifresi" className="mb-3 w-full rounded-2xl border border-amber-100 bg-white p-3" />
                <button onClick={() => adminPassword === ADMIN_PASSWORD ? setAdminUnlocked(true) : alert("Şifre yanlış 😄")}
                  className="rounded-2xl bg-slate-950 px-6 py-3 font-black text-white">Admin Panelini Aç</button>
              </div>
            ) : (
              <>
                <div className="mb-6 rounded-3xl border border-amber-200 bg-amber-50 p-5">
                  <h3 className="mb-4 text-xl font-black">🏆 Şampiyon Bonusunu İşle</h3>
                  <div className="flex flex-wrap gap-3">
                    <select value={championWinner} onChange={(e) => setChampionWinner(e.target.value)}
                      className="rounded-2xl border border-amber-200 bg-white p-3 font-black">
                      <option value="">Şampiyon ülke seç</option>
                      {tournamentTeams.map((team) => <option key={team} value={team}>{team}</option>)}
                    </select>
                    <button onClick={awardChampionBonus} className="rounded-2xl bg-amber-400 px-5 py-3 font-black text-slate-950">
                      Doğru bilenlere +100 ver
                    </button>
                  </div>
                </div>

                <div className="mb-6 rounded-[1.75rem] border border-amber-100 bg-amber-50/50 p-5">
                  <h3 className="mb-4 text-xl font-black">📂 Toplu Maç Yükle</h3>
                  <input type="file" accept=".csv" onChange={importWeeklyExcel} className="w-full rounded-2xl border border-amber-100 bg-white p-3" />
                  <p className="mt-2 text-sm text-slate-500">CSV formatı: Ev Sahibi, Deplasman, Aşama, Tarih</p>
                </div>

                <div className="mb-8 grid gap-3 md:grid-cols-5">
                  <input value={homeTeam} onChange={(e) => setHomeTeam(e.target.value)} placeholder="Ev sahibi" className="rounded-2xl border border-amber-100 bg-amber-50/40 p-3" />
                  <input value={awayTeam} onChange={(e) => setAwayTeam(e.target.value)} placeholder="Deplasman" className="rounded-2xl border border-amber-100 bg-amber-50/40 p-3" />
                  <input type="datetime-local" value={matchTime} onChange={(e) => setMatchTime(e.target.value)} className="rounded-2xl border border-amber-100 bg-amber-50/40 p-3" />
                  <input value={league} onChange={(e) => setLeague(e.target.value)} placeholder="Aşama: Grup A / Final" className="rounded-2xl border border-amber-100 bg-amber-50/40 p-3" />
                  <button onClick={addMatch} className="rounded-2xl bg-slate-950 font-black text-white">Maç Ekle</button>
                </div>

                <FilterButtons value={matchListFilter} onChange={setMatchListFilter} />

                <div className="space-y-3">
                  {matchListMatches.map((match) => {
                    const status = getMatchStatus(match);
                    return (
                      <div key={match.id} className={`rounded-2xl border bg-amber-50/40 p-4 ${status.borderColor}`}>
                        <div className="mb-1 text-xl font-black">
                          <TeamName team={match.home_team} /> - <TeamName team={match.away_team} />
                        </div>
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-black text-slate-950">{match.league || "Dünya Kupası"}</span>
                          <span className={`rounded-full px-3 py-1 text-xs font-black ${status.color}`}>{status.label}</span>
                        </div>

                        {!match.result && (
                          <div className="mb-2">
                            <button onClick={() => shareMatchReminder(match)}
                              className="w-full rounded-xl bg-green-500 px-3 py-2 text-sm font-black text-white hover:bg-green-600 transition">
                              📲 Bu Maçı Grupla Paylaş
                            </button>
                          </div>
                        )}

                        <div className="grid gap-2 md:grid-cols-5">
                          <input type="number" placeholder={`${match.home_team} skor`}
                            value={scoreInputs[match.id]?.home || ""}
                            onChange={(e) => setScoreInputs((prev) => ({ ...prev, [match.id]: { home: e.target.value, away: prev[match.id]?.away || "" } }))}
                            className="rounded-xl border border-amber-100 bg-white p-3" />
                          <input type="number" placeholder={`${match.away_team} skor`}
                            value={scoreInputs[match.id]?.away || ""}
                            onChange={(e) => setScoreInputs((prev) => ({ ...prev, [match.id]: { home: prev[match.id]?.home || "", away: e.target.value } }))}
                            className="rounded-xl border border-amber-100 bg-white p-3" />
                          <button onClick={() => submitScore(match)} className="rounded-xl bg-amber-400 py-2 font-black text-slate-950">Skoru Kaydet/Düzelt</button>
                          <button onClick={() => updateResult(match, "X")} className="rounded-xl bg-red-500 py-2 font-black text-white">Sonuç X</button>
                          <button onClick={() => deleteMatch(match.id)} className="rounded-xl bg-slate-950 py-2 font-black text-white">Sil</button>
                        </div>

                        <div className="mt-4 rounded-2xl border border-amber-100 bg-white p-3">
                          <div className="mb-2 font-black">🏆 Maça Ek Puan Ver</div>
                          <div className="grid gap-2 md:grid-cols-4">
                            <select value={bonusInputs[match.id]?.playerId || ""}
                              onChange={(e) => setBonusInputs((prev) => ({ ...prev, [match.id]: { playerId: e.target.value, points: prev[match.id]?.points || "", reason: prev[match.id]?.reason || "" } }))}
                              className="rounded-xl border border-amber-100 bg-amber-50/40 p-3">
                              <option value="">Oyuncu seç</option>
                              {players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                            <input type="number" placeholder="Ek puan"
                              value={bonusInputs[match.id]?.points || ""}
                              onChange={(e) => setBonusInputs((prev) => ({ ...prev, [match.id]: { playerId: prev[match.id]?.playerId || "", points: e.target.value, reason: prev[match.id]?.reason || "" } }))}
                              className="rounded-xl border border-amber-100 bg-amber-50/40 p-3" />
                            <input placeholder="Açıklama"
                              value={bonusInputs[match.id]?.reason || ""}
                              onChange={(e) => setBonusInputs((prev) => ({ ...prev, [match.id]: { playerId: prev[match.id]?.playerId || "", points: prev[match.id]?.points || "", reason: e.target.value } }))}
                              className="rounded-xl border border-amber-100 bg-amber-50/40 p-3" />
                            <button onClick={() => addBonusToMatch(match)} className="rounded-xl bg-amber-400 font-black text-slate-950">Ek Puan Ver</button>
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

      <MobileBottomNav activeTab={activeTab} setActiveTab={setActiveTab} isAdmin={!!currentPlayer.is_admin} />
    </main>
  );
}

// === COMPONENTLER ===

function StatsPanel({ players, matches, predictions }: { players: Player[]; matches: Match[]; predictions: Prediction[] }) {
  const stats = useMemo(() => computeStats(players, matches, predictions), [players, matches, predictions]);
  return (
    <div className="mb-6 rounded-[2rem] border border-amber-100 bg-white p-5 shadow-xl shadow-red-100/50">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-xl font-black">📊 Turnuva İstatistikleri</h3>
        <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-black text-purple-700">Canlı veri</span>
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-4">
          <div className="text-3xl">🎯</div>
          <div className="mt-2 text-xs font-black uppercase tracking-wide text-emerald-700">Turnuvanın Kahini</div>
          <div className="mt-1 text-2xl font-black text-slate-950">{stats.kahin?.player.name || "—"}</div>
          <div className="text-sm font-bold text-emerald-700">%{stats.kahin?.rate || 0} başarı • {stats.kahin?.correct || 0}/{stats.kahin?.finished || 0}</div>
        </div>
        <div className="rounded-[1.5rem] border border-red-200 bg-red-50 p-4">
          <div className="text-3xl">💔</div>
          <div className="mt-2 text-xs font-black uppercase tracking-wide text-red-700">Turnuvanın Kurbanı</div>
          <div className="mt-1 text-2xl font-black text-slate-950">{stats.kurban?.player.name || "—"}</div>
          <div className="text-sm font-bold text-red-700">%{stats.kurban?.rate || 0} başarı • {stats.kurban?.correct || 0}/{stats.kurban?.finished || 0}</div>
        </div>
        <div className="rounded-[1.5rem] border border-blue-200 bg-blue-50 p-4">
          <div className="text-3xl">📊</div>
          <div className="mt-2 text-xs font-black uppercase tracking-wide text-blue-700">Tahmin Dağılımı</div>
          <div className="mt-3 space-y-2">
            {(["1", "X", "2"] as const).map((v) => (
              <div key={v} className="flex items-center gap-2">
                <div className="w-6 text-center text-sm font-black">{v}</div>
                <div className="relative h-5 flex-1 overflow-hidden rounded-full bg-white">
                  <div className="h-full rounded-full bg-blue-400" style={{ width: `${stats.distPct[v]}%` }} />
                  <div className="absolute inset-0 flex items-center justify-end pr-2 text-xs font-black">%{stats.distPct[v]}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-4">
          <div className="text-3xl">🐑</div>
          <div className="mt-2 text-xs font-black uppercase tracking-wide text-amber-700">Sürü Üyesi</div>
          <div className="mt-1 text-2xl font-black text-slate-950">{stats.suruUyesi?.player.name || "—"}</div>
          <div className="text-sm font-bold text-amber-700">%{stats.suruUyesi?.herdPct || 0} çoğunlukla aynı</div>
        </div>
        <div className="rounded-[1.5rem] border border-purple-200 bg-purple-50 p-4">
          <div className="text-3xl">⚡</div>
          <div className="mt-2 text-xs font-black uppercase tracking-wide text-purple-700">Aykırı Düşünen</div>
          <div className="mt-1 text-2xl font-black text-slate-950">{stats.asi?.player.name || "—"}</div>
          <div className="text-sm font-bold text-purple-700">%{stats.asi?.herdPct || 0} çoğunlukla aynı</div>
        </div>
        <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 p-4">
          <div className="text-3xl">🏆</div>
          <div className="mt-2 text-xs font-black uppercase tracking-wide text-rose-700">Şampiyon Tahminleri</div>
          <div className="mt-2 space-y-1 max-h-32 overflow-auto">
            {Object.entries(stats.championPicks).length === 0 ? (
              <div className="text-sm font-bold text-slate-500">Henüz tahmin yok</div>
            ) : (
              Object.entries(stats.championPicks).map(([team, names]) => (
                <div key={team} className="text-sm font-bold text-slate-700">
                  <span className="text-rose-700">{team}</span>: {names.join(", ")}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterButtons({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="mb-6 flex gap-2 overflow-x-auto pb-1 md:flex-wrap">
      {MATCH_FILTERS.map((filter) => (
        <button key={filter} onClick={() => onChange(filter)}
          className={`shrink-0 rounded-2xl px-4 py-2 font-black transition ${value === filter ? "bg-red-500 text-white shadow-lg shadow-red-200" : "bg-amber-50 text-slate-700 hover:bg-amber-100"}`}>
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
      const today = new Date(now); today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
      return matchDate >= today && matchDate < tomorrow;
    })
    .sort((a, b) => new Date(a.match_time).getTime() - new Date(b.match_time).getTime());
  if (todayMatches.length === 0) return null;
  const firstMatch = todayMatches[0];
  return (
    <div className="mb-6 overflow-hidden rounded-[1.75rem] border-2 border-orange-200 bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 p-[2px] shadow-xl shadow-orange-100">
      <div className="rounded-[1.6rem] bg-white p-4 md:p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-red-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-red-600">🔥 Matchday</div>
            <h3 className="text-2xl font-black text-slate-950">Bugün {todayMatches.length} maç var</h3>
            <p className="mt-1 font-bold text-slate-500">İlk maç: <span className="text-red-500">{firstMatch.home_team} vs {firstMatch.away_team}</span></p>
          </div>
          <div className="hidden text-6xl md:block">⚽🔥</div>
        </div>
      </div>
    </div>
  );
}

function MiniDashboardCard({ icon, title, value, note, tone }: { icon: string; title: string; value: string; note: string; tone: "amber" | "red" | "blue" }) {
  const styles = {
    amber: "bg-gradient-to-br from-amber-300 to-orange-300 shadow-amber-100",
    red: "bg-red-50 shadow-red-50",
    blue: "bg-blue-50 shadow-blue-50",
  };
  return (
    <div className={`rounded-[1.5rem] p-4 shadow-lg ${styles[tone]}`}>
      <div className="text-3xl">{icon}</div>
      <div className="mt-3 text-sm font-black uppercase tracking-wide text-slate-500">{title}</div>
      <div className="mt-1 truncate text-xl font-black text-slate-950">{value}</div>
      <div className="mt-1 text-xs font-bold text-slate-500">{note}</div>
    </div>
  );
}

function ChampionPredictionCard({ currentPlayer, tournamentTeams, championPickLocked, saveChampionPick }: {
  currentPlayer: Player; tournamentTeams: string[]; championPickLocked: boolean; saveChampionPick: (team: string) => void;
}) {
  const selectedTeam = currentPlayer.champion_team || "";
  const selectedTheme = getCountryTheme(selectedTeam);
  return (
    <div className={`mb-6 overflow-hidden rounded-[2rem] border-4 border-red-50 bg-gradient-to-br ${selectedTheme.card} p-[2px] shadow-2xl ${selectedTheme.glow}`}>
      <div className="relative overflow-hidden rounded-[1.85rem] bg-white/85 p-5 backdrop-blur md:p-6">
        <div className="relative grid gap-5 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <div>
            <div className="mb-2 inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-red-600">Turnuva Tahmini</div>
            <h3 className="text-2xl font-black text-slate-950 md:text-3xl">Şampiyonunu seç, +100 puanı kovala</h3>
            <p className="mt-2 font-bold text-slate-500">Bu tahmin turnuva başlamadan kilitlenir.</p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <select value={selectedTeam} disabled={championPickLocked}
                onChange={(e) => saveChampionPick(e.target.value)}
                className="min-w-[220px] rounded-2xl border border-amber-200 bg-white p-3 font-black text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100">
                <option value="">Şampiyon ülke seç</option>
                {tournamentTeams.map((team) => <option key={team} value={team}>{team}</option>)}
              </select>
              <span className="rounded-full bg-amber-100 px-3 py-2 text-sm font-black text-amber-700">
                {championPickLocked ? "🔒 Tahminler kilitlendi" : "⏳ 11 Haziran 19:00"}
              </span>
            </div>
          </div>
          <div className="rounded-[1.75rem] border border-white/70 bg-white/60 p-4 shadow-xl">
            <div className="text-xs font-black uppercase tracking-wide text-slate-500">Seçili Şampiyon</div>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-3xl">🏆</div>
              <div>
                <div className="text-2xl font-black text-slate-950">{selectedTeam ? <TeamName team={selectedTeam} /> : "Henüz yok"}</div>
                <div className="mt-1 text-sm font-bold text-slate-500">{selectedTeam ? `${selectedTheme.name} modu` : "Bir ülke seç"}</div>
              </div>
            </div>
            <div className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-black text-red-600">Doğru çıkarsa +100 puan 😎</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StageFilter({ selectedStage, setSelectedStage }: { selectedStage: string; setSelectedStage: (stage: string) => void }) {
  const compactStages = [
    { label: "Tümü", value: "Tümü" }, { label: "Gruplar", value: "Gruplar" },
    { label: "Son 32", value: "Son 32" }, { label: "Son 16", value: "Son 16" },
    { label: "Çeyrek", value: "Çeyrek Final" }, { label: "Yarı", value: "Yarı Final" },
    { label: "3.lük", value: "Üçüncülük" }, { label: "Final", value: "Final" },
  ];
  return (
    <div className="mt-3 rounded-[1.5rem] border border-amber-100 bg-gradient-to-r from-amber-50 to-red-50 p-3 md:mt-5 md:rounded-[1.75rem] md:p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-xl">🏆</span>
        <span className="text-sm font-black uppercase tracking-wide text-slate-500">Turnuva Aşaması</span>
      </div>
      <div className="grid grid-cols-2 gap-2 min-[390px]:grid-cols-3 md:flex md:flex-wrap">
        {compactStages.map((stage) => (
          <button key={stage.value} onClick={() => setSelectedStage(stage.value)}
            className={`rounded-2xl px-3 py-2 text-sm font-black transition md:px-4 ${selectedStage === stage.value ? "bg-red-500 text-white shadow-lg shadow-red-200" : "bg-white text-slate-700 hover:bg-amber-100"}`}>
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
  matches: Match[]
): BadgeItem[] {
  const rank = sortedPlayers.findIndex((p) => p.id === player.id) + 1;
  const totalPlayers = sortedPlayers.length;
  const bottomTwo = sortedPlayers.slice(-2).some((p) => p.id === player.id);
  const answered = Number(player.correct_count || 0) + Number(player.wrong_count || 0);
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
    return pred.player_id === player.id && !!match?.result && pred.prediction !== "YOK" && pred.prediction !== "BILINMIYOR";
  });
  const allPreds = predictions.filter((pred) => pred.player_id === player.id && pred.prediction !== "YOK" && pred.prediction !== "BILINMIYOR");
  const jokerPreds = allPreds.filter((pred) => !!pred.is_joker);
  const jokerCorrect = jokerPreds.filter((pred) => {
    const match = matches.find((m) => m.id === pred.match_id);
    return !!match?.result && pred.prediction === match.result;
  }).length;
  const jokerWrong = jokerPreds.filter((pred) => {
    const match = matches.find((m) => m.id === pred.match_id);
    return !!match?.result && pred.prediction !== match.result;
  }).length;

  const allPlayersWithSuccess = sortedPlayers
    .filter((p) => Number(p.correct_count || 0) + Number(p.wrong_count || 0) > 0)
    .sort((a, b) => Number(b.success_rate || 0) - Number(a.success_rate || 0));
  const bestSuccessId = allPlayersWithSuccess[0]?.id;
  const worstSuccessId = allPlayersWithSuccess[allPlayersWithSuccess.length - 1]?.id;

  const pointsSorted = [...sortedPlayers].sort((a, b) => Number(b.total_points || 0) - Number(a.total_points || 0));
  const leader = pointsSorted[0];
  const leaderGap = leader && leader.id !== player.id ? Number(leader.total_points || 0) - totalPoints : 0;

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
    const diffMinutes = (new Date(match.match_time).getTime() - Date.now()) / (1000 * 60);
    if (diffMinutes > 0 && diffMinutes <= 15) latePanic++;

    if (!match.result) return;
    totalPredictionPoints += Number(pred.points || 0);

    const matchPreds = predictions.filter((p) => p.match_id === pred.match_id && p.prediction !== "YOK" && p.prediction !== "BILINMIYOR");
    if (matchPreds.length < 3) return;
    const counts = { "1": 0, X: 0, "2": 0 };
    matchPreds.forEach((p) => { if (p.prediction in counts) counts[p.prediction as "1" | "X" | "2"]++; });
    const sortedCounts = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const majority = sortedCounts[0]?.[0];
    const minority = sortedCounts[2]?.[0];
    if (!majority) return;
    herdTotal++;
    if (pred.prediction === majority) herdMatch++;
    if (pred.prediction === minority && pred.prediction === match.result && sortedCounts[2][1] <= 1) soloCorrect++;
    if (pred.prediction !== majority && pred.prediction === match.result) exactUnderdog++;
  });

  // Son 5 sonuç içinde dipten çıkış hissi için küçük bir metrik
  const lastFinished = finishedPreds.slice(-5);
  if (lastFinished.length >= 3) {
    const positives = lastFinished.filter((p) => Number(p.points || 0) > 0).length;
    if (positives >= 3 && bottomTwo) comebackWins = positives;
  }

  const herdPct = herdTotal > 0 ? Math.round((herdMatch / herdTotal) * 100) : 0;
  const favoritePick = Math.max(homePicks, drawPicks, awayPicks);
  const favoritePickLabel = favoritePick === homePicks ? "1" : favoritePick === awayPicks ? "2" : "X";

  const add = (condition: boolean, badge: BadgeItem) => {
    if (condition) badges.push(badge);
  };

  const badges: BadgeItem[] = [];

  add(rank === 1, { icon: "👑", title: "Genel Lider", desc: "Puan tablosunun tepesinde", tone: "bg-amber-100 text-amber-800 border-amber-200" });
  add(rank === 2, { icon: "🥈", title: "Gümüş Koltuk", desc: "Liderin ensesinde", tone: "bg-slate-100 text-slate-700 border-slate-200" });
  add(rank === 3, { icon: "🥉", title: "Bronz Güç", desc: "Podyumda sağlam duruyor", tone: "bg-orange-100 text-orange-800 border-orange-200" });
  add(rank <= 3, { icon: "🏆", title: "Podyum Oyuncusu", desc: `Sıralama: #${rank}`, tone: "bg-yellow-100 text-yellow-800 border-yellow-200" });
  add(rank <= Math.ceil(totalPlayers / 2), { icon: "🛡️", title: "Üst Blok", desc: "Tablonun güvenli tarafında", tone: "bg-blue-100 text-blue-800 border-blue-200" });
  add(bottomTwo, { icon: "🥯", title: "Simit Hattı", desc: "Kahvaltı baskısı yüksek", tone: "bg-red-100 text-red-700 border-red-200" });
  add(rank === totalPlayers, { icon: "🧯", title: "Acil Toparlanma", desc: "Son sıradan çıkış operasyonu", tone: "bg-rose-100 text-rose-700 border-rose-200" });
  add(rank === totalPlayers, { icon: "🪦", title: "Kupon Yattı FC", desc: "Sıralama tablosu başsağlığı diliyor", tone: "bg-zinc-100 text-zinc-700 border-zinc-200" });
  add(bottomTwo, { icon: "🧃", title: "Çayını Al Gel", desc: "Simit hattına servis yaklaştı", tone: "bg-orange-100 text-orange-800 border-orange-200" });
  add(bottomTwo && wrong > correct, { icon: "🚑", title: "Acil Müdahale", desc: "Tahminlere pansuman gerekebilir", tone: "bg-red-100 text-red-800 border-red-200" });
  add(rank === 1 && success < 50 && answered >= 5, { icon: "🍀", title: "Şans Balı", desc: "Lider ama futbol tanrıları da yardım etmiş", tone: "bg-lime-100 text-lime-800 border-lime-200" });
  add(rank <= 3 && wrong > correct && answered >= 10, { icon: "🎭", title: "Drama Podyumu", desc: "Yanlışlar çok ama sahne hâlâ onun", tone: "bg-pink-100 text-pink-800 border-pink-200" });
  add(wrong >= 5 && wrong > correct + 3, { icon: "📉", title: "Grafik Ağlıyor", desc: "Sonuçlar tabloyu biraz üzmüş", tone: "bg-rose-100 text-rose-700 border-rose-200" });
  add(wrong >= 10 && success < 45, { icon: "🫠", title: "Ben Bu Ligi Bırakıyorum", desc: "Ama yarın yine tahmin yapacak", tone: "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200" });
  add(streak >= 1 && wrong >= correct && answered >= 8, { icon: "🧿", title: "Nazar Değmesin", desc: "Seri var ama geçmiş biraz olaylı", tone: "bg-blue-100 text-blue-800 border-blue-200" });
  add(streak === 0 && wrong >= 3, { icon: "🧯", title: "Yangın Tüpü Lazım", desc: "Seri yok, duman var", tone: "bg-red-100 text-red-700 border-red-200" });
  add(blanks >= 3, { icon: "🙈", title: "Görmedim Duymadım", desc: "Zor maçları usulca pas geçmiş", tone: "bg-slate-100 text-slate-700 border-slate-200" });
  add(force >= 3, { icon: "📋", title: "Mazeret Dosyası", desc: "Mücbir klasörü kabarmış", tone: "bg-zinc-100 text-zinc-700 border-zinc-200" });
  add(jokerWrong >= 1, { icon: "🤡", title: "Kendine Güveniyordu", desc: "Joker bastı, kader güldü", tone: "bg-pink-100 text-pink-800 border-pink-200" });
  add(jokerWrong >= 2, { icon: "🪦", title: "Joker Mezarlığı", desc: "Jokerler sessizce toprağa verildi", tone: "bg-zinc-100 text-zinc-700 border-zinc-200" });
  add(jokerCorrect >= 1 && jokerWrong === 0, { icon: "😎", title: "Joker Artistliği", desc: "Bastı ve yürüdü", tone: "bg-indigo-100 text-indigo-800 border-indigo-200" });
  add(herdTotal >= 3 && herdPct >= 90, { icon: "🐑", title: "Sürü Psikolojisi Profesörü", desc: "Ofis nereye, o oraya", tone: "bg-stone-100 text-stone-700 border-stone-200" });
  add(herdTotal >= 3 && herdPct <= 25, { icon: "🧨", title: "Ters Köşe Sevdalısı", desc: "Kalabalığa alerjisi var", tone: "bg-red-100 text-red-800 border-red-200" });
  add(soloCorrect >= 1, { icon: "🧙‍♀️", title: "İçime Doğdu Kahini", desc: "Kimse inanmadı, o bildi", tone: "bg-purple-100 text-purple-800 border-purple-200" });
  add(latePanic >= 2, { icon: "🥶", title: "Panik Butonu", desc: "Tahminleri son dakika kurtarıyor", tone: "bg-sky-100 text-sky-800 border-sky-200" });
  add(answered >= 8 && wrong === 0, { icon: "🧊", title: "Buz Gibi Oynuyor", desc: "Yanlışsız sakinlik", tone: "bg-cyan-100 text-cyan-800 border-cyan-200" });
  add(correct >= 3 && success >= 80 && answered >= 5, { icon: "👀", title: "Sessiz Tehlike", desc: "Az konuşur, puanı alır", tone: "bg-emerald-100 text-emerald-800 border-emerald-200" });
  add(answered >= 10 && Math.abs(correct - wrong) <= 1, { icon: "🎪", title: "Sirk Gibi Sezon", desc: "Bir doğru bir yanlış, tempo şahane", tone: "bg-amber-100 text-amber-800 border-amber-200" });
  add(drawPicks >= 5 && drawPicks === favoritePick, { icon: "🛌", title: "Berabere Yatıyor", desc: "X onun konfor alanı", tone: "bg-violet-100 text-violet-800 border-violet-200" });
  add(homePicks >= 8 && homePicks === favoritePick, { icon: "🏡", title: "Evden Çıkmıyor", desc: "Ev sahibine güven tam", tone: "bg-amber-100 text-amber-800 border-amber-200" });
  add(awayPicks >= 8 && awayPicks === favoritePick, { icon: "🧳", title: "Deplasman Turisti", desc: "Dış saha seviyor", tone: "bg-blue-100 text-blue-800 border-blue-200" });
  add(totalPoints < 0 && answered >= 3, { icon: "🕳️", title: "Puan Kara Deliği", desc: "Puanlar başka evrene kaçıyor", tone: "bg-gray-100 text-gray-700 border-gray-200" });
  add(leaderGap > 0 && leaderGap <= 5, { icon: "👀", title: "Lidere Nefes", desc: `${leaderGap} puan fark kaldı`, tone: "bg-indigo-100 text-indigo-800 border-indigo-200" });
  add(leaderGap >= 25, { icon: "🧗", title: "Dağ Tırmanışı", desc: `${leaderGap} puanlık kapanacak fark`, tone: "bg-stone-100 text-stone-700 border-stone-200" });
  add(bestSuccessId === player.id, { icon: "🧙", title: "Baş Kahin", desc: "En yüksek başarı oranı", tone: "bg-purple-100 text-purple-800 border-purple-200" });
  add(worstSuccessId === player.id && answered > 0, { icon: "💔", title: "Bugün Yandı", desc: "Toparlanma haftası şart", tone: "bg-rose-100 text-rose-700 border-rose-200" });
  add(streak >= 10, { icon: "🌋", title: "Lav Modu", desc: `${streak} maçlık efsane seri`, tone: "bg-red-100 text-red-800 border-red-200" });
  add(streak >= 5 && streak < 10, { icon: "🔥", title: "Alev Modu", desc: `${streak} maçlık doğru seri`, tone: "bg-orange-100 text-orange-800 border-orange-200" });
  add(streak >= 3 && streak < 5, { icon: "⚡", title: "Formda", desc: `${streak} maçlık seri`, tone: "bg-sky-100 text-sky-800 border-sky-200" });
  add(streak === 0 && answered > 0, { icon: "🧊", title: "Seri Reset", desc: "Yeni seri başlatma zamanı", tone: "bg-slate-100 text-slate-700 border-slate-200" });
  add(success >= 70 && answered >= 5, { icon: "🤖", title: "Algoritma Gibi", desc: `%${success} başarı`, tone: "bg-cyan-100 text-cyan-800 border-cyan-200" });
  add(success >= 60 && answered >= 5, { icon: "🎯", title: "Keskin Nişancı", desc: `%${success} başarı`, tone: "bg-blue-100 text-blue-800 border-blue-200" });
  add(success >= 50 && answered >= 5, { icon: "✅", title: "Pozitif Bölge", desc: "Doğrular önde", tone: "bg-emerald-100 text-emerald-800 border-emerald-200" });
  add(success > 0 && success < 40 && answered >= 5, { icon: "🫠", title: "Ters Rüzgar", desc: "Şans biraz tripte", tone: "bg-pink-100 text-pink-800 border-pink-200" });
  add(correct >= 1, { icon: "🌱", title: "İlk Doğru", desc: "Kahvaltı yolculuğu başladı", tone: "bg-green-100 text-green-800 border-green-200" });
  add(correct >= 10, { icon: "📈", title: "10 Doğru Kulübü", desc: `${correct} doğru tahmin`, tone: "bg-lime-100 text-lime-800 border-lime-200" });
  add(correct >= 25, { icon: "🏹", title: "25 İsabet", desc: "Tahmin eli ısındı", tone: "bg-teal-100 text-teal-800 border-teal-200" });
  add(correct >= 50, { icon: "💎", title: "50 Doğru Elmas", desc: "Yarı dalya", tone: "bg-cyan-100 text-cyan-800 border-cyan-200" });
  add(correct >= 100, { icon: "👑", title: "100 Doğru Efsanesi", desc: "Ofis tarihine geçti", tone: "bg-amber-100 text-amber-800 border-amber-200" });
  add(wrong >= 10, { icon: "🎢", title: "Risk Seven", desc: `${wrong} yanlış ama hâlâ oyunda`, tone: "bg-orange-100 text-orange-800 border-orange-200" });
  add(wrong >= correct && answered >= 10, { icon: "🎲", title: "Kaderci", desc: "Riskli tahminler fazla", tone: "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200" });
  add(bonus >= 10, { icon: "💰", title: "Bonus Avcısı", desc: `+${bonus} ek puan`, tone: "bg-emerald-100 text-emerald-800 border-emerald-200" });
  add(bonus >= 50, { icon: "🤑", title: "Bonus Zengini", desc: `+${bonus} bonus`, tone: "bg-green-100 text-green-800 border-green-200" });
  add(blanks >= 1, { icon: "🤐", title: "Sessiz Tahminci", desc: `${blanks} bilinçli boş`, tone: "bg-slate-100 text-slate-700 border-slate-200" });
  add(blanks >= 5, { icon: "🧊", title: "Soğukkanlı", desc: "Bilmediğini boş bırakıyor", tone: "bg-slate-100 text-slate-700 border-slate-200" });
  add(force >= 1, { icon: "🧾", title: "Mücbir Ustası", desc: `${force} mücbir sebep`, tone: "bg-zinc-100 text-zinc-700 border-zinc-200" });
  add(herdTotal >= 3 && herdPct >= 80, { icon: "🐑", title: "Sürüyle Giden", desc: `%${herdPct} çoğunlukla aynı`, tone: "bg-stone-100 text-stone-700 border-stone-200" });
  add(herdTotal >= 3 && herdPct <= 35, { icon: "⚡", title: "Aykırı Tahminci", desc: `%${herdPct} çoğunlukla aynı`, tone: "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200" });
  add(soloCorrect >= 1, { icon: "💥", title: "Tek Başına Bildi", desc: `${soloCorrect} sürpriz isabet`, tone: "bg-red-100 text-red-800 border-red-200" });
  add(exactUnderdog >= 2, { icon: "🦊", title: "Sürpriz Tilkisi", desc: `${exactUnderdog} aykırı doğru`, tone: "bg-orange-100 text-orange-800 border-orange-200" });
  add(homePicks >= 5 && homePicks === favoritePick, { icon: "🏠", title: "Evci", desc: `En çok ${favoritePickLabel} oynuyor`, tone: "bg-amber-100 text-amber-800 border-amber-200" });
  add(drawPicks >= 3 && drawPicks === favoritePick, { icon: "🤝", title: "Beraberlikçi", desc: "X kokusunu seviyor", tone: "bg-violet-100 text-violet-800 border-violet-200" });
  add(awayPicks >= 5 && awayPicks === favoritePick, { icon: "🚌", title: "Deplasman Sevdalısı", desc: `En çok ${favoritePickLabel} oynuyor`, tone: "bg-sky-100 text-sky-800 border-sky-200" });
  add(jokerPreds.length >= 1, { icon: "🃏", title: "Joker Açtı", desc: `${jokerPreds.length} joker kullanımı`, tone: "bg-purple-100 text-purple-800 border-purple-200" });
  add(jokerCorrect >= 1, { icon: "🃏", title: "Joker Vurdu", desc: `${jokerCorrect} joker doğru`, tone: "bg-purple-100 text-purple-800 border-purple-200" });
  add(jokerWrong >= 1, { icon: "🫣", title: "Joker Yaktı", desc: `${jokerWrong} joker yanlış`, tone: "bg-rose-100 text-rose-700 border-rose-200" });
  add(jokerCorrect >= 3, { icon: "🪄", title: "Joker Büyücüsü", desc: "Jokerleri nokta atışı", tone: "bg-indigo-100 text-indigo-800 border-indigo-200" });
  add(player.champion_team === "Türkiye", { icon: "🇹🇷", title: "Ay-Yıldızcı", desc: "Şampiyon Türkiye dedi", tone: "bg-red-100 text-red-800 border-red-200" });
  add(!!player.champion_team, { icon: "🌍", title: "Şampiyon Seçti", desc: `${player.champion_team} diyor`, tone: "bg-green-100 text-green-800 border-green-200" });
  add(totalPoints >= 10, { icon: "🚀", title: "Puan Motoru", desc: `${totalPoints} puana ulaştı`, tone: "bg-blue-100 text-blue-800 border-blue-200" });
  add(totalPoints >= 50, { icon: "🏎️", title: "Hızlı Başlangıç", desc: "50 puan barajı", tone: "bg-red-100 text-red-800 border-red-200" });
  add(totalPoints >= 100, { icon: "💯", title: "Yüzlük Kulüp", desc: "100 puan barajı", tone: "bg-amber-100 text-amber-800 border-amber-200" });
  add(totalPredictionPoints < 0 && answered >= 3, { icon: "🕳️", title: "Negatif Tünel", desc: "Skorlar ters gidiyor", tone: "bg-gray-100 text-gray-700 border-gray-200" });
  add(comebackWins >= 3, { icon: "🦅", title: "Dipten Uçuş", desc: "Simit hattında seri yaptı", tone: "bg-cyan-100 text-cyan-800 border-cyan-200" });
  add(latePanic >= 1, { icon: "🥶", title: "Son Dakika Panikçisi", desc: `${latePanic} son dakika tahmini`, tone: "bg-blue-100 text-blue-800 border-blue-200" });
  add(answered >= 1 && homePicks > 0 && drawPicks > 0 && awayPicks > 0, { icon: "🌈", title: "Üç Yolcu", desc: "1, X ve 2 hepsini denedi", tone: "bg-pink-100 text-pink-800 border-pink-200" });
  add(answered >= 10 && Math.abs(correct - wrong) <= 1, { icon: "⚖️", title: "Denge Ustası", desc: "Doğru/yanlış başa baş", tone: "bg-stone-100 text-stone-700 border-stone-200" });


  // 100 rozet paketi için ekstra komik/stratejik rozetler
  add(answered >= 20 && success >= 55, { icon: "🧠", title: "Futbol IQ Açık", desc: "20+ tahminde sağlam oran", tone: "bg-indigo-100 text-indigo-800 border-indigo-200" });
  add(answered >= 20 && success < 45, { icon: "📺", title: "Maçı Tersten İzliyor", desc: "Ekranı çevirmek fayda edebilir", tone: "bg-rose-100 text-rose-700 border-rose-200" });
  add(correct >= wrong + 5 && answered >= 10, { icon: "🦾", title: "Makine Gibi", desc: "Doğrular farkı açmış", tone: "bg-cyan-100 text-cyan-800 border-cyan-200" });
  add(wrong >= correct + 5 && answered >= 10, { icon: "🧨", title: "Risk Patladı", desc: "Cesaret var, sonuçlar nazlı", tone: "bg-red-100 text-red-800 border-red-200" });
  add(jokerPreds.length >= 2 && jokerCorrect === jokerPreds.length && jokerPreds.length > 0, { icon: "🎩", title: "Joker Şapkadan Çıktı", desc: "Kullandığı jokerler tertemiz", tone: "bg-purple-100 text-purple-800 border-purple-200" });
  add(jokerPreds.length >= 2 && jokerWrong === jokerPreds.length && jokerPreds.length > 0, { icon: "🪦", title: "Joker Mezarlığı", desc: "Jokerler sessizce gömüldü", tone: "bg-zinc-100 text-zinc-700 border-zinc-200" });
  add(rank === 1 && streak >= 3, { icon: "🦁", title: "Lider ve Formda", desc: "Hem zirvede hem seride", tone: "bg-yellow-100 text-yellow-800 border-yellow-200" });
  add(bottomTwo && streak >= 2, { icon: "🐣", title: "Simitten Kaçış Planı", desc: "Alt sıradan seriyle çıkmaya çalışıyor", tone: "bg-orange-100 text-orange-800 border-orange-200" });
  add(leaderGap > 0 && leaderGap <= 2, { icon: "🫁", title: "Ense Nefesi", desc: "Liderin ensesinde sıcak nefes", tone: "bg-pink-100 text-pink-800 border-pink-200" });
  add(leaderGap >= 50, { icon: "🗺️", title: "Harita Lazım", desc: "Lidere giden yol biraz uzun", tone: "bg-stone-100 text-stone-700 border-stone-200" });
  add(drawPicks >= homePicks && drawPicks >= awayPicks && drawPicks >= 10, { icon: "🧘", title: "X Zen Ustası", desc: "Beraberlikte huzur buluyor", tone: "bg-violet-100 text-violet-800 border-violet-200" });
  add(homePicks >= awayPicks * 2 && homePicks >= 10, { icon: "🏟️", title: "Ev Sahibi Lobisi", desc: "Tribün etkisine inanıyor", tone: "bg-amber-100 text-amber-800 border-amber-200" });
  add(awayPicks >= homePicks * 2 && awayPicks >= 10, { icon: "✈️", title: "Deplasman Uçağı", desc: "Dış saha romantizmi", tone: "bg-sky-100 text-sky-800 border-sky-200" });
  add(herdTotal >= 5 && herdPct === 100, { icon: "🐑", title: "Sürü Kaptanı", desc: "Çoğunlukla tam uyum", tone: "bg-stone-100 text-stone-700 border-stone-200" });
  add(herdTotal >= 5 && herdPct <= 20, { icon: "🧬", title: "Genetik Aykırı", desc: "Ofis başka o başka", tone: "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200" });
  add(soloCorrect >= 2, { icon: "🧨", title: "Ofisi Susturan", desc: "Tek başına doğru bildi", tone: "bg-red-100 text-red-800 border-red-200" });
  add(exactUnderdog >= 3, { icon: "🕵️", title: "Sürpriz Dedektifi", desc: "Ters köşeleri kokluyor", tone: "bg-orange-100 text-orange-800 border-orange-200" });
  add(latePanic >= 3, { icon: "⏰", title: "Deadline Kahini", desc: "Son dakika onun uzmanlığı", tone: "bg-blue-100 text-blue-800 border-blue-200" });
  add(blanks === 0 && answered >= 10, { icon: "🫡", title: "Pas Geçmeyen", desc: "Her maça fikri var", tone: "bg-green-100 text-green-800 border-green-200" });
  add(blanks >= 10, { icon: "🛡️", title: "Seçici Kurul", desc: "Her maça bulaşmıyor", tone: "bg-slate-100 text-slate-700 border-slate-200" });
  add(bonus >= 100, { icon: "🏦", title: "Bonus Bankası", desc: "Ek puan kasası dolu", tone: "bg-emerald-100 text-emerald-800 border-emerald-200" });
  add(totalPoints >= 250, { icon: "🚂", title: "Puan Lokomotifi", desc: "250 puan barajı geçildi", tone: "bg-blue-100 text-blue-800 border-blue-200" });
  add(totalPoints >= 500, { icon: "🏰", title: "Puan Krallığı", desc: "500 puanlık saltanat", tone: "bg-amber-100 text-amber-800 border-amber-200" });

  // Aynı isim/desc tekrarlarını temizle ve rozet havuzunu 100 ile sınırla.
  const uniqueBadges = badges.filter((badge, index, arr) => arr.findIndex((b) => b.title === badge.title && b.desc === badge.desc) === index);
  return uniqueBadges.slice(0, 100);
}

function BadgePanel({ player, sortedPlayers, playerStreaks, predictions, matches }: {
  player: Player;
  sortedPlayers: Player[];
  playerStreaks: Record<string, number>;
  predictions: Prediction[];
  matches: Match[];
}) {
  const badges = getPlayerBadges(player, sortedPlayers, playerStreaks, predictions, matches);
  return (
    <div className="mb-6 rounded-[1.75rem] border border-amber-100 bg-amber-50/50 p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xl font-black">🏅 Rozetler</h3>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-500">{badges.length}/100 rozet</span>
      </div>
      {badges.length === 0 ? (
        <div className="rounded-2xl bg-white p-4 text-sm font-bold text-slate-500">Veri geldikçe rozetler burada açılacak 😄</div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {badges.map((badge) => (
            <div key={`${badge.title}-${badge.desc}`} className={`rounded-2xl border p-4 ${badge.tone}`}>
              <div className="text-2xl">{badge.icon}</div>
              <div className="mt-2 font-black">{badge.title}</div>
              <div className="mt-1 text-xs font-bold opacity-80">{badge.desc}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getCompareMetrics(player: Player | undefined, sortedPlayers: Player[], predictions: Prediction[], matches: Match[], playerStreaks: Record<string, number>) {
  if (!player) return null;
  const rank = sortedPlayers.findIndex((p) => p.id === player.id) + 1;
  const finishedPreds = predictions.filter((pred) => {
    const match = matches.find((m) => m.id === pred.match_id);
    return pred.player_id === player.id && !!match?.result && pred.prediction !== "YOK";
  });
  const lastTen = finishedPreds
    .map((pred) => ({ pred, match: matches.find((m) => m.id === pred.match_id) }))
    .filter((x) => x.match)
    .sort((a, b) => new Date(b.match!.match_time).getTime() - new Date(a.match!.match_time).getTime())
    .slice(0, 10);
  const lastTenPoints = lastTen.reduce((sum, x) => sum + Number(x.pred.points || 0), 0);
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
    answered: Number(player.correct_count || 0) + Number(player.wrong_count || 0),
  };
}

function RivalCompare({ players, sortedPlayers, predictions, matches, playerStreaks, leftId, rightId, setLeftId, setRightId, onProfile }: {
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
  const fallbackRight = rightId || sortedPlayers.find((p) => p.id !== fallbackLeft)?.id || players[1]?.id || "";
  const left = players.find((p) => p.id === fallbackLeft);
  const right = players.find((p) => p.id === fallbackRight && p.id !== fallbackLeft) || players.find((p) => p.id !== fallbackLeft);
  const leftMetrics = getCompareMetrics(left, sortedPlayers, predictions, matches, playerStreaks);
  const rightMetrics = getCompareMetrics(right, sortedPlayers, predictions, matches, playerStreaks);

  const commonMatchIds = new Set<string>();
  predictions.filter((p) => p.player_id === left?.id && p.prediction !== "YOK").forEach((p) => {
    const other = predictions.find((x) => x.player_id === right?.id && x.match_id === p.match_id && x.prediction !== "YOK");
    const match = matches.find((m) => m.id === p.match_id);
    if (other && match?.result) commonMatchIds.add(p.match_id);
  });
  const commonMatches = Array.from(commonMatchIds);
  const samePicks = commonMatches.filter((matchId) => {
    const a = predictions.find((p) => p.player_id === left?.id && p.match_id === matchId);
    const b = predictions.find((p) => p.player_id === right?.id && p.match_id === matchId);
    return a?.prediction === b?.prediction;
  }).length;
  const differentPicks = commonMatches.length - samePicks;
  const leftCommonPoints = commonMatches.reduce((sum, matchId) => sum + Number(predictions.find((p) => p.player_id === left?.id && p.match_id === matchId)?.points || 0), 0);
  const rightCommonPoints = commonMatches.reduce((sum, matchId) => sum + Number(predictions.find((p) => p.player_id === right?.id && p.match_id === matchId)?.points || 0), 0);

  const pointDiff = Number(leftMetrics?.points || 0) - Number(rightMetrics?.points || 0);
  const leaderName = pointDiff === 0 ? "Berabere" : pointDiff > 0 ? left?.name : right?.name;
  const gap = Math.abs(pointDiff);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black">🥊 Rakip Karşılaştırma</h2>
          <p className="mt-1 text-sm font-bold text-slate-500">İki oyuncuyu seç, kim kimi kahvaltı hattına yaklaştırıyor görelim 😄</p>
        </div>
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-end">
        <div>
          <label className="mb-2 block text-sm font-black text-slate-500">1. Oyuncu</label>
          <select value={fallbackLeft} onChange={(e) => setLeftId(e.target.value)} className="w-full rounded-2xl border border-amber-100 bg-amber-50/40 p-3 font-black">
            {players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="rounded-full bg-red-500 px-4 py-3 text-center font-black text-white">VS</div>
        <div>
          <label className="mb-2 block text-sm font-black text-slate-500">2. Oyuncu</label>
          <select value={right?.id || ""} onChange={(e) => setRightId(e.target.value)} className="w-full rounded-2xl border border-amber-100 bg-amber-50/40 p-3 font-black">
            {players.filter((p) => p.id !== fallbackLeft).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>

      {leftMetrics && rightMetrics && (
        <>
          <div className="mb-6 rounded-[1.75rem] border border-amber-100 bg-amber-50/50 p-5 text-center">
            <div className="text-sm font-black uppercase tracking-wide text-slate-500">Genel fark</div>
            <div className="mt-2 text-3xl font-black text-slate-950">
              {leaderName === "Berabere" ? "Şu an kafa kafaya ⚖️" : `${leaderName} ${gap} puan önde`}
            </div>
            <div className="mt-2 text-sm font-bold text-slate-500">
              Ortak sonuçlanmış maçlarda: {left?.name} {leftCommonPoints} / {right?.name} {rightCommonPoints}
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

function ComparePlayerCard({ metrics, onProfile }: { metrics: NonNullable<ReturnType<typeof getCompareMetrics>>; onProfile: (id: string) => void }) {
  const p = metrics.player;
  return (
    <div className="rounded-[1.75rem] border border-amber-100 bg-white p-5 shadow-lg shadow-amber-100/50">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="text-2xl font-black">{p.name}</div>
          <div className="text-sm font-bold text-slate-500">#{metrics.rank} sıra • %{metrics.success} başarı</div>
        </div>
        <button onClick={() => onProfile(p.id)} className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-black text-amber-800 hover:bg-amber-200">Profile git</button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <StatBox title="PUAN" value={metrics.points} />
        <StatBox title="SON 10 PUAN" value={metrics.lastTenPoints} />
        <StatBox title="DOĞRU" value={metrics.correct} />
        <StatBox title="YANLIŞ" value={metrics.wrong} />
        <StatBox title="STREAK" value={metrics.streak >= 5 ? `🔥 ${metrics.streak}` : metrics.streak} />
        <StatBox title="EK PUAN" value={metrics.bonus} />
      </div>
    </div>
  );
}

function MobileBottomNav({ activeTab, setActiveTab, isAdmin }: { activeTab: string; setActiveTab: (tab: string) => void; isAdmin: boolean }) {
  const items = [
    { key: "dashboard", label: "Ana", icon: "🏠" },
    { key: "tahmin", label: "Tahmin", icon: "🎯" },
    { key: "maclar", label: "Maçlar", icon: "⚽" },
    { key: "profil", label: "Profil", icon: "👤" },
    { key: "karsilastir", label: "Rakip", icon: "🥊" },
    ...(isAdmin ? [{ key: "admin", label: "Admin", icon: "👑" }] : []),
  ];
  return (
    <nav className="fixed inset-x-3 bottom-3 z-50 rounded-[1.5rem] border border-red-100 bg-white/95 p-1.5 shadow-2xl shadow-red-100 backdrop-blur md:hidden">
      <div className="grid" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map((item) => (
          <button key={item.key} onClick={() => setActiveTab(item.key)}
            className={`rounded-2xl px-2 py-1.5 text-center text-xs font-black transition ${activeTab === item.key ? "bg-red-500 text-white shadow-lg shadow-red-200" : "text-slate-500"}`}>
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

function ScoreTable({ sortedPlayers, playerStreaks, onProfile }: {
  sortedPlayers: Player[]; playerStreaks: Record<string, number>; onProfile: (id: string) => void;
}) {
  return (
    <div className="overflow-auto">
      <table className="w-full min-w-[950px]">
        <thead>
          <tr className="border-b border-amber-100 text-left text-slate-500">
            <th className="pb-3">#</th><th className="pb-3">İsim</th>
            <th className="pb-3">Doğru</th><th className="pb-3">Yanlış</th>
            <th className="pb-3">Tahmin Yok</th><th className="pb-3">Ek Puan</th>
            <th className="pb-3">Puan</th><th className="pb-3">Başarı</th>
            <th className="pb-3">Streak</th><th className="pb-3">Şampiyon</th>
          </tr>
        </thead>
        <tbody>
          {sortedPlayers.map((p, index) => (
            <tr key={p.id} className="cursor-pointer border-b border-slate-100 hover:bg-amber-100" onClick={() => onProfile(p.id)}>
              <td className="py-3 font-black">{index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : index + 1}</td>
              <td className="py-3 font-black text-blue-600 underline">{p.name}</td>
              <td className="py-3 font-black text-green-600">{p.correct_count || 0}</td>
              <td className="py-3 font-black text-red-600">{p.wrong_count || 0}</td>
              <td className="py-3 font-black text-orange-500">{p.intentional_blank || 0}</td>
              <td className="py-3 font-black text-amber-600">{p.bonus_points || 0}</td>
              <td className="py-3 text-xl font-black text-blue-600">{p.total_points || 0}</td>
              <td className="py-3 font-black">%{p.success_rate || 0}</td>
              <td className="py-3 font-black">{(playerStreaks[p.id] || 0) >= 5 ? `🔥 ${playerStreaks[p.id]}` : playerStreaks[p.id] || 0}</td>
              <td className="py-3 font-black">{p.champion_team ? <TeamName team={p.champion_team} /> : "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
