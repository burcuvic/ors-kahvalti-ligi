"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MATCHES } from "@/lib/mockData";
import { Match, Pick } from "@/lib/types";
import { Lock, Clock, MapPin, Check } from "lucide-react";
import { supabase, supabaseEnabled } from "@/lib/supabase";

function formatCountdown(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff < 0) return { text: "BAŞLADI", locked: true };
  const h = Math.floor(diff / (1000 * 60 * 60));
  const d = Math.floor(h / 24);
  const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (d > 0) return { text: `${d}g ${h % 24}s`, locked: false };
  if (h > 0) return { text: `${h}s ${m}d`, locked: false };
  return { text: `${m}d`, locked: false };
}

function MatchCard({ match, index }: { match: Match; index: number }) {
  const [pick, setPick] = useState<Pick | null>(null);
  const [countdown, setCountdown] = useState(formatCountdown(match.kickoff));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setCountdown(formatCountdown(match.kickoff)), 60000);
    return () => clearInterval(id);
  }, [match.kickoff]);

  const handlePick = async (p: Pick) => {
    if (countdown.locked) return;
    setPick(p);
    setSaving(true);

    if (supabaseEnabled && supabase) {
      try {
        await supabase.from("predictions").upsert({
          match_id: match.id,
          pick: p,
          created_at: new Date().toISOString(),
        });
      } catch (e) {
        console.error("Supabase save failed:", e);
      }
    }

    setTimeout(() => setSaving(false), 600);
  };

  const time = new Date(match.kickoff).toLocaleString("tr-TR", {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.06 }}
      whileHover={{ y: -4 }}
      className="group relative"
    >
      <div className="glass-strong rounded-3xl overflow-hidden relative">
        {/* Top stripe */}
        <div className="h-1 bg-red-shine" />

        {/* Header */}
        <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-2">
            <span className="display text-xs tracking-widest text-ors-gold font-bold">
              {match.group}
            </span>
            <span className="text-ors-cream/30">•</span>
            <span className="text-xs text-ors-cream/60 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {match.venue}
            </span>
          </div>
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
              countdown.locked
                ? "bg-ors-red/20 text-ors-redGlow"
                : "bg-ors-gold/15 text-ors-gold"
            }`}
          >
            {countdown.locked ? (
              <Lock className="w-3 h-3" />
            ) : (
              <Clock className="w-3 h-3" />
            )}
            {countdown.text}
          </div>
        </div>

        {/* Teams */}
        <div className="px-5 py-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          {/* Home */}
          <div className="text-center">
            <motion.div
              whileHover={{ scale: 1.1, rotate: -5 }}
              className="text-5xl md:text-6xl mb-2 inline-block"
            >
              {match.home.flag}
            </motion.div>
            <div className="display text-lg md:text-xl text-ors-cream tracking-wide">
              {match.home.name}
            </div>
            <div className="text-xs text-ors-cream/40 font-mono">{match.home.code}</div>
          </div>

          {/* VS */}
          <div className="flex flex-col items-center">
            <div className="display text-2xl text-ors-red font-bold">VS</div>
            <div className="text-[10px] text-ors-cream/50 font-bold tracking-wider mt-1">
              {time.toUpperCase()}
            </div>
          </div>

          {/* Away */}
          <div className="text-center">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="text-5xl md:text-6xl mb-2 inline-block"
            >
              {match.away.flag}
            </motion.div>
            <div className="display text-lg md:text-xl text-ors-cream tracking-wide">
              {match.away.name}
            </div>
            <div className="text-xs text-ors-cream/40 font-mono">{match.away.code}</div>
          </div>
        </div>

        {/* Prediction buttons */}
        <div className="px-5 pb-5">
          <div className="text-[10px] uppercase tracking-[0.3em] text-ors-cream/50 font-bold mb-2 text-center">
            Tahminin?
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(["1", "X", "2"] as Pick[]).map((p) => {
              const selected = pick === p;
              const labels = {
                "1": match.home.code,
                "X": "BERABERE",
                "2": match.away.code,
              };
              return (
                <button
                  key={p}
                  onClick={() => handlePick(p)}
                  disabled={countdown.locked}
                  className={`
                    relative overflow-hidden rounded-xl py-3 px-2 font-bold transition-all
                    ${countdown.locked ? "opacity-50 cursor-not-allowed" : "active:scale-95"}
                    ${
                      selected
                        ? "bg-red-shine text-white neon-red"
                        : "glass hover:bg-white/10 text-ors-cream"
                    }
                  `}
                >
                  <AnimatePresence>
                    {selected && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="absolute top-1 right-1"
                      >
                        <div className="bg-ors-gold rounded-full p-0.5">
                          <Check className="w-3 h-3 text-ors-redDark" strokeWidth={3} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="display text-2xl">{p}</div>
                  <div className="text-[9px] tracking-wider mt-0.5 opacity-80">
                    {labels[p]}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Save indicator */}
          <AnimatePresence>
            {saving && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-3 text-center text-xs text-ors-gold font-semibold"
              >
                ✓ Tahmin kaydedildi
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

export function MatchPredictions() {
  return (
    <section id="matches" className="relative py-16 md:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-block glass-red rounded-full px-4 py-1.5 mb-4">
            <span className="text-xs tracking-[0.3em] font-bold text-ors-cream">
              ⚽ HAFTANIN MAÇLARI
            </span>
          </div>
          <h2 className="display text-5xl md:text-7xl text-ors-cream mb-3">
            Bu Hafta <span className="text-red-shine">Tahmin</span> Et
          </h2>
          <p className="text-ors-cream/60 max-w-xl mx-auto">
            Maç başlamadan önce tahmininizi kilitleyin. Doğru bilen{" "}
            <span className="text-ors-gold font-bold">+3 puan</span>, yanlış bilen{" "}
            <span className="text-ors-red font-bold">-1 puan</span>.
          </p>
        </motion.div>

        {/* Cards grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {MATCHES.map((m, i) => (
            <MatchCard key={m.id} match={m} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
