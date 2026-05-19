"use client";
import { motion } from "framer-motion";

export function Footer() {
  return (
    <footer className="relative py-12 px-4 sm:px-6 lg:px-8 border-t border-white/5">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-8 mb-10"
        >
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-shine flex items-center justify-center display text-lg text-white font-black">
                ORS
              </div>
              <div>
                <div className="display text-base text-ors-cream">
                  Kahvaltı Ligi
                </div>
                <div className="text-[10px] text-ors-gold tracking-wider uppercase">
                  World Cup Edition
                </div>
              </div>
            </div>
            <p className="text-sm text-ors-cream/50 max-w-xs">
              ORS ofisinin resmi futbol tahmin ligi. Simitle başlar, kupayla biter.
            </p>
          </div>

          <div>
            <h4 className="display text-sm text-ors-gold tracking-wider mb-3">
              SEZON 2 · 2025/26
            </h4>
            <ul className="space-y-2 text-sm text-ors-cream/60">
              <li>📍 14. Hafta · Devam ediyor</li>
              <li>🏆 47 maç · 12 oyuncu</li>
              <li>🥖 Bu hafta simit hattı: 2 kişi</li>
            </ul>
          </div>

          <div>
            <h4 className="display text-sm text-ors-gold tracking-wider mb-3">
              KOMİSYON
            </h4>
            <ul className="space-y-2 text-sm text-ors-cream/60">
              <li>Komiser: Burcu Aktaş</li>
              <li>Hakem: Mustafa Şahin</li>
              <li>Simit Sponsoru: Son 2 sıra 😅</li>
            </ul>
          </div>
        </motion.div>

        <div className="pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-xs text-ors-cream/40">
            © 2026 ORS Kahvaltı Ligi. Tüm simitler saklıdır. 🥖
          </div>
          <div className="flex items-center gap-2 text-xs text-ors-cream/40">
            <span className="display text-ors-gold tracking-wider">
              "Tahmin et, kazan, ısmarlat."
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
