"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

const LINKS = [
  { href: "#matches", label: "Maçlar" },
  { href: "#leaderboard", label: "Puan Durumu" },
  { href: "#rules", label: "Kurallar" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`sticky top-0 z-50 transition-all ${
        scrolled
          ? "glass-strong border-b border-white/5"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="#" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-red-shine flex items-center justify-center display text-lg text-white font-black shadow-glow">
                ORS
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-ors-gold flex items-center justify-center text-[8px]">
                ⚽
              </div>
            </div>
            <div className="hidden sm:block">
              <div className="display text-base text-ors-cream leading-tight">
                Kahvaltı Ligi
              </div>
              <div className="text-[10px] text-ors-gold tracking-wider uppercase">
                World Cup Edition
              </div>
            </div>
          </a>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-ors-cream/70 hover:text-ors-cream hover:bg-white/5 transition-colors"
              >
                {l.label}
              </a>
            ))}
            <button className="ml-2 px-4 py-2 rounded-lg bg-red-shine text-white text-sm font-bold transition-transform hover:scale-105">
              Giriş Yap
            </button>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden w-10 h-10 rounded-lg glass flex items-center justify-center"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden glass-strong border-t border-white/5 overflow-hidden"
          >
            <div className="px-4 py-4 space-y-1">
              {LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block px-4 py-3 rounded-lg text-ors-cream/80 font-semibold hover:bg-white/5"
                >
                  {l.label}
                </a>
              ))}
              <button className="w-full mt-2 px-4 py-3 rounded-lg bg-red-shine text-white font-bold">
                Giriş Yap
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
