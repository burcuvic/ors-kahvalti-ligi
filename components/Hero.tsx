"use client";
import { motion } from "framer-motion";
import { Mascot } from "./Mascot";
import { Trophy, Target } from "lucide-react";

export function Hero() {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative pt-12 md:pt-20 pb-16 md:pb-24 px-4 sm:px-6 lg:px-8 stadium-lights">
      <div className="max-w-7xl mx-auto">
        {/* Top badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-8"
        >
          <div className="glass-red rounded-full px-5 py-2 flex items-center gap-2 text-sm font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ors-redGlow opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-ors-red"></span>
            </span>
            <span className="text-ors-cream">SEZON 2 · 14. HAFTA · CANLI</span>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-8 lg:gap-12 items-center">
          {/* Left: text */}
          <div className="text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="inline-block mb-4"
            >
              <span className="display text-xs sm:text-sm tracking-[0.3em] text-ors-gold/80 font-bold">
                ⚽ OFİS TAHMİN LİGİ ⚽
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="display text-6xl sm:text-7xl md:text-8xl lg:text-9xl leading-[0.9] mb-2"
            >
              <span className="block text-red-shine drop-shadow-[0_0_30px_rgba(228,0,43,0.5)]">
                ORS Kahvaltı
              </span>
              <span className="block text-ors-cream">
                Ligi
              </span>
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex items-center justify-center lg:justify-start gap-3 mb-6"
            >
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-ors-gold" />
              <span className="display text-2xl sm:text-3xl md:text-4xl text-gold-shine tracking-wide">
                World Cup Edition
              </span>
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-ors-gold" />
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="text-lg sm:text-xl text-ors-cream/80 mb-10 max-w-xl mx-auto lg:mx-0"
            >
              Tahmin yap, puan kazan,{" "}
              <span className="text-ors-red font-semibold">simit hattından</span>{" "}
              uzak dur. 🥖
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <button
                onClick={() => scrollTo("matches")}
                className="group relative overflow-hidden rounded-2xl bg-red-shine px-8 py-4 font-bold text-white text-lg neon-red transition-transform hover:scale-105 active:scale-95"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <Target className="w-5 h-5" />
                  Tahmin Yap
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </button>

              <button
                onClick={() => scrollTo("leaderboard")}
                className="group glass-gold rounded-2xl px-8 py-4 font-bold text-ors-gold text-lg transition-all hover:scale-105 active:scale-95 hover:shadow-glow-gold"
              >
                <span className="flex items-center justify-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Puan Durumu
                </span>
              </button>
            </motion.div>

            {/* Stats strip */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="mt-10 grid grid-cols-3 gap-4 max-w-md mx-auto lg:mx-0"
            >
              {[
                { v: "12", l: "Oyuncu" },
                { v: "47", l: "Maç" },
                { v: "24", l: "Simit 🥖" },
              ].map((s, i) => (
                <div
                  key={i}
                  className="glass rounded-xl p-3 text-center"
                >
                  <div className="display text-3xl text-ors-gold">{s.v}</div>
                  <div className="text-xs uppercase tracking-wider text-ors-cream/60 mt-1">
                    {s.l}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right: mascot */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative flex justify-center lg:justify-end"
          >
            {/* Spinning ring behind mascot */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-[340px] h-[340px] rounded-full border-2 border-dashed border-ors-gold/30 animate-spin-slow"
                style={{ animationDuration: "20s" }}
              />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-[420px] h-[420px] rounded-full border border-ors-red/20 animate-spin-slow"
                style={{ animationDuration: "30s", animationDirection: "reverse" }}
              />
            </div>

            {/* Glow */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-72 h-72 rounded-full bg-ors-red/30 blur-3xl animate-pulse-slow" />
            </div>

            {/* Mascot */}
            <div className="relative z-10">
              <Mascot size={340} />
            </div>

            {/* Floating badges */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-6 -left-2 glass-gold rounded-2xl px-4 py-2 hidden md:block"
            >
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-ors-gold" />
                <span className="text-sm font-bold text-ors-gold">+3 PUAN</span>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute bottom-12 -right-2 glass-red rounded-2xl px-4 py-2 hidden md:block"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">🥖</span>
                <span className="text-sm font-bold text-ors-cream">SİMİT HATTI</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
