"use client";
import { motion } from "framer-motion";
import { PLAYERS } from "@/lib/mockData";
import { Crown, TrendingUp, Check, X, Flame } from "lucide-react";

const RANK_STYLES: Record<number, string> = {
  1: "glass-gold neon-gold",
  2: "glass border-ors-cream/20",
  3: "glass border-ors-goldDeep/30",
};

const RANK_BG: Record<number, string> = {
  1: "bg-gold-shine text-ors-redDark",
  2: "bg-gradient-to-br from-gray-300 to-gray-500 text-ors-black",
  3: "bg-gradient-to-br from-orange-400 to-orange-700 text-white",
};

export function Leaderboard() {
  const sorted = [...PLAYERS].sort((a, b) => b.points - a.points);
  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);

  return (
    <section
      id="leaderboard"
      className="relative py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-pitch-stripes"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-block glass-gold rounded-full px-4 py-1.5 mb-4">
            <span className="text-xs tracking-[0.3em] font-bold text-ors-gold">
              🏆 CANLI PUAN DURUMU
            </span>
          </div>
          <h2 className="display text-5xl md:text-7xl text-ors-cream mb-3">
            <span className="text-gold-shine">Liderlik</span> Tablosu
          </h2>
        </motion.div>

        {/* Podium - Top 3 */}
        <div className="grid grid-cols-3 gap-3 md:gap-6 mb-10 items-end max-w-3xl mx-auto">
          {podiumOrder.map((p, idx) => {
            if (!p) return null;
            const realRank = sorted.indexOf(p) + 1;
            const heights = { 1: "md:h-72", 2: "md:h-56", 3: "md:h-48" };
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.15 }}
                className={`relative ${heights[realRank as 1 | 2 | 3]} flex flex-col items-center`}
              >
                {realRank === 1 && (
                  <motion.div
                    animate={{ y: [0, -8, 0], rotate: [-5, 5, -5] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="absolute -top-10 z-20"
                  >
                    <Crown className="w-12 h-12 text-ors-gold drop-shadow-[0_0_15px_rgba(255,210,74,0.8)]" fill="#FFD24A" />
                  </motion.div>
                )}

                {/* Avatar circle */}
                <div className="relative mb-3">
                  {realRank === 1 && (
                    <div className="absolute inset-0 rounded-full bg-ors-gold blur-2xl opacity-50 animate-pulse-slow" />
                  )}
                  <div
                    className={`relative w-20 h-20 md:w-24 md:h-24 rounded-full ${RANK_BG[realRank]} flex items-center justify-center display text-3xl md:text-4xl font-black ring-4 ring-ors-black`}
                  >
                    {p.emoji}
                  </div>
                  <div
                    className={`absolute -bottom-2 left-1/2 -translate-x-1/2 ${RANK_BG[realRank]} rounded-full w-8 h-8 flex items-center justify-center display text-lg ring-4 ring-ors-black`}
                  >
                    {realRank}
                  </div>
                </div>

                {/* Card */}
                <div
                  className={`${RANK_STYLES[realRank]} rounded-2xl px-3 py-4 w-full flex-1 flex flex-col justify-end items-center text-center`}
                >
                  <div className="display text-base md:text-xl text-ors-cream truncate w-full">
                    {p.name.split(" ")[0]}
                  </div>
                  <div className="text-[10px] text-ors-cream/50 mb-2">{p.team}</div>
                  <div className={`display text-3xl md:text-5xl ${realRank === 1 ? "text-gold-shine" : "text-ors-cream"}`}>
                    {p.points}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-ors-cream/50">
                    puan
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Rest of the table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-strong rounded-3xl overflow-hidden"
        >
          {/* Table header */}
          <div className="grid grid-cols-[40px_1fr_60px_60px_80px] md:grid-cols-[60px_2fr_80px_80px_80px_120px] gap-3 px-4 md:px-6 py-3 border-b border-white/5 text-[10px] uppercase tracking-wider text-ors-cream/40 font-bold">
            <div>#</div>
            <div>Oyuncu</div>
            <div className="text-center hidden md:block">
              <Check className="w-3 h-3 inline text-ors-gold" />
            </div>
            <div className="text-center hidden md:block">
              <X className="w-3 h-3 inline text-ors-red" />
            </div>
            <div className="text-center">Seri</div>
            <div className="text-right">Puan</div>
          </div>

          {rest.map((p, i) => {
            const rank = i + 4;
            const isDanger = rank >= sorted.length - 1;
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className={`grid grid-cols-[40px_1fr_60px_60px_80px] md:grid-cols-[60px_2fr_80px_80px_80px_120px] gap-3 px-4 md:px-6 py-3 items-center border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors ${
                  isDanger ? "bg-ors-red/5" : ""
                }`}
              >
                <div className="display text-lg text-ors-cream/60">{rank}</div>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-ors-coal to-ors-ink flex items-center justify-center text-lg ring-1 ring-white/10 shrink-0">
                    {p.emoji}
                  </div>
                  <div className="min-w-0">
                    <div className="text-ors-cream font-semibold text-sm md:text-base truncate">
                      {p.name}
                    </div>
                    <div className="text-[10px] text-ors-cream/40 truncate">
                      {p.team}
                    </div>
                  </div>
                </div>
                <div className="text-center hidden md:block">
                  <span className="text-ors-gold font-bold">{p.correct}</span>
                </div>
                <div className="text-center hidden md:block">
                  <span className="text-ors-red font-bold">{p.wrong}</span>
                </div>
                <div className="text-center">
                  {p.streak > 0 ? (
                    <div className="inline-flex items-center gap-1 text-ors-redGlow font-bold text-sm">
                      <Flame className="w-3 h-3" />
                      {p.streak}
                    </div>
                  ) : (
                    <span className="text-ors-cream/30">—</span>
                  )}
                </div>
                <div className="text-right">
                  <span className={`display text-2xl ${isDanger ? "text-ors-redGlow" : "text-ors-cream"}`}>
                    {p.points}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Footer note */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-6 text-center text-xs text-ors-cream/40 flex items-center justify-center gap-2"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ors-redGlow opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-ors-red" />
          </span>
          Canlı güncelleniyor · Son güncelleme: az önce
          <TrendingUp className="w-3 h-3" />
        </motion.div>
      </div>
    </section>
  );
}
