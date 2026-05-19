"use client";
import { motion } from "framer-motion";
import { Plus, Minus, AlertCircle, Trophy, Coffee } from "lucide-react";

const RULES = [
  {
    icon: Plus,
    title: "Doğru Tahmin",
    points: "+3",
    color: "text-emerald-400",
    accent: "border-emerald-400/40 bg-emerald-500/5",
    desc: "Her doğru tahmin için cebine 3 puan girer. Üst üste 3 doğruda ekstra alkış garantili.",
  },
  {
    icon: Minus,
    title: "Yanlış Tahmin",
    points: "−1",
    color: "text-ors-redGlow",
    accent: "border-ors-red/40 bg-ors-red/10",
    desc: "Yanlış tahmin = simit hattına bir adım daha. Risk olmadan zafer olmaz.",
  },
  {
    icon: AlertCircle,
    title: "Tahmin Yapmamak",
    points: "MIN",
    color: "text-ors-gold",
    accent: "border-ors-gold/40 bg-ors-gold/5",
    desc: "Maç başlamadan tahmin girmediysen, o haftanın en düşük puanını paylaşırsın. Sessizlik = teslim.",
  },
  {
    icon: Coffee,
    title: "Son 2 Sıra",
    points: "🥖",
    color: "text-ors-cream",
    accent: "border-white/15 bg-white/5",
    desc: "Sezon sonu son 2 oyuncu, tüm ofise simit + çay ısmarlar. Sponsor değilsiniz, mağlupsunuz.",
  },
  {
    icon: Trophy,
    title: "Şampiyon",
    points: "🏆",
    color: "text-ors-gold",
    accent: "border-ors-gold/50 bg-gold-shine/10",
    desc: "Sezon birincisi futbol forması ya da seçeceği bir spor ekipmanını kazanır. Ve gönlünüze hükmeder.",
  },
];

export function Rules() {
  return (
    <section id="rules" className="relative py-16 md:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-block glass rounded-full px-4 py-1.5 mb-4">
            <span className="text-xs tracking-[0.3em] font-bold text-ors-cream/80">
              📜 LİG KURALLARI
            </span>
          </div>
          <h2 className="display text-5xl md:text-7xl text-ors-cream mb-3">
            Oyunun <span className="text-red-shine">Kuralları</span>
          </h2>
          <p className="text-ors-cream/60 max-w-xl mx-auto">
            Basit, acımasız ve simitli. ORS'a özel.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {RULES.map((r, i) => {
            const Icon = r.icon;
            return (
              <motion.div
                key={r.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                whileHover={{ y: -6 }}
                className={`group glass rounded-2xl p-6 border-2 ${r.accent} transition-all relative overflow-hidden`}
              >
                {/* Hover shine */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`w-12 h-12 rounded-xl glass flex items-center justify-center ${r.color}`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className={`display text-4xl ${r.color}`}>{r.points}</div>
                  </div>

                  <h3 className="display text-2xl text-ors-cream mb-2 tracking-wide">
                    {r.title}
                  </h3>
                  <p className="text-sm text-ors-cream/70 leading-relaxed">{r.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
