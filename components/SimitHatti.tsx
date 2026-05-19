"use client";
import { motion } from "framer-motion";
import { PLAYERS } from "@/lib/mockData";
import { AlertTriangle } from "lucide-react";

export function SimitHatti() {
  const sorted = [...PLAYERS].sort((a, b) => a.points - b.points);
  const bottom2 = sorted.slice(0, 2);

  return (
    <section className="relative py-16 md:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Decorative simit emoji backdrop */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div className="absolute top-10 left-[10%] text-9xl animate-float-slow">🥖</div>
        <div className="absolute top-40 right-[15%] text-9xl animate-float">🫖</div>
        <div className="absolute bottom-20 left-[20%] text-9xl animate-float-slow">🧀</div>
        <div className="absolute bottom-40 right-[25%] text-9xl animate-float">🥚</div>
        <div className="absolute top-1/2 left-1/2 text-9xl animate-float-slow">🍅</div>
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <motion.div
            animate={{ rotate: [-2, 2, -2] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="inline-block glass-red rounded-full px-4 py-1.5 mb-4"
          >
            <span className="text-xs tracking-[0.3em] font-bold text-ors-cream flex items-center gap-2">
              <AlertTriangle className="w-3 h-3" />
              SİMİT HATTI
              <AlertTriangle className="w-3 h-3" />
            </span>
          </motion.div>

          <h2 className="display text-5xl md:text-7xl text-ors-cream mb-3">
            Bu Hafta <span className="text-red-shine">Simit</span> Sırası
          </h2>
          <p className="text-ors-cream/70 text-lg max-w-2xl mx-auto">
            Aşağıdaki iki kahraman, bu hafta tüm ofise{" "}
            <span className="text-ors-gold font-bold">simit & çay</span>{" "}
            ısmarlamakla görevlendirilmiştir. Hayırlı olsun. 🥖☕
          </p>
        </motion.div>

        {/* Danger cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          {bottom2.map((p, i) => {
            const rank = sorted.length - i; // last and second-to-last
            const messages = [
              "Simit fırını bekliyor...",
              "Çayı tazeleyecek olan kişi.",
            ];
            const breakfastItems = [
              ["🥖", "Simit"],
              ["🫖", "Çay"],
              ["🧀", "Beyaz Peynir"],
              ["🍅", "Domates"],
              ["🥒", "Salatalık"],
              ["🥚", "Yumurta"],
              ["🍯", "Bal"],
              ["🧈", "Tereyağı"],
            ];

            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                whileHover={{ scale: 1.02, y: -4 }}
                className="relative group"
              >
                {/* Pulsing red glow */}
                <div className="absolute -inset-1 bg-ors-red/30 rounded-3xl blur-xl group-hover:bg-ors-red/50 transition-colors animate-pulse-slow" />

                <div className="relative glass-red rounded-3xl overflow-hidden">
                  {/* Warning stripe */}
                  <div
                    className="h-2 bg-red-shine relative overflow-hidden"
                    style={{
                      background:
                        "repeating-linear-gradient(45deg, #E4002B 0, #E4002B 12px, #FFD24A 12px, #FFD24A 24px)",
                    }}
                  />

                  <div className="p-6 md:p-8">
                    {/* Rank tag */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="text-[10px] uppercase tracking-[0.3em] text-ors-cream/60 font-bold mb-1">
                          {rank === sorted.length ? "Son Sırada" : "Sondan İkinci"}
                        </div>
                        <div className="display text-3xl md:text-4xl text-ors-cream">
                          #{rank}
                        </div>
                      </div>
                      <motion.div
                        animate={{ rotate: [0, -10, 10, -10, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                        className="text-5xl md:text-6xl"
                      >
                        🥖
                      </motion.div>
                    </div>

                    {/* Player */}
                    <div className="flex items-center gap-4 mb-5 pb-5 border-b border-white/10">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-ors-redDark to-ors-black flex items-center justify-center text-3xl ring-2 ring-ors-red shrink-0">
                        {p.emoji}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="display text-2xl text-ors-cream truncate">
                          {p.name}
                        </div>
                        <div className="text-sm text-ors-cream/60">{p.team}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="display text-4xl text-ors-redGlow">
                          {p.points}
                        </div>
                        <div className="text-[10px] uppercase tracking-wider text-ors-cream/50">
                          puan
                        </div>
                      </div>
                    </div>

                    {/* Roast message */}
                    <div className="bg-ors-black/40 rounded-2xl p-4 mb-5 border border-ors-red/20">
                      <div className="text-sm text-ors-cream/90 italic">
                        💬 "{messages[i]}"
                      </div>
                    </div>

                    {/* Breakfast items they need to bring */}
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.3em] text-ors-gold font-bold mb-3">
                        Alışveriş Listesi
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {breakfastItems.slice(i * 4, i * 4 + 4).map(([emoji, name]) => (
                          <div
                            key={name}
                            className="glass rounded-xl p-2 text-center hover:bg-white/10 transition-colors"
                          >
                            <div className="text-2xl mb-1">{emoji}</div>
                            <div className="text-[10px] text-ors-cream/70 font-semibold">
                              {name}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom funny banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-gold rounded-2xl p-6 text-center"
        >
          <div className="display text-2xl md:text-3xl text-gold-shine mb-2">
            "Yenilen pehlivan güreşe doymaz."
          </div>
          <div className="text-sm text-ors-cream/70">
            — Anonim ORS Çalışanı, simit alırken (2026)
          </div>
        </motion.div>
      </div>
    </section>
  );
}
