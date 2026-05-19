"use client";
import { motion } from "framer-motion";
import { BRACKET } from "@/lib/mockData";
import { BracketMatch, BracketTeam } from "@/lib/types";
import { Trophy } from "lucide-react";

function TeamRow({
  team,
  score,
  isWinner,
  empty,
}: {
  team?: BracketTeam;
  score?: number;
  isWinner?: boolean;
  empty?: boolean;
}) {
  if (!team || empty) {
    return (
      <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.02] border border-dashed border-white/10">
        <div className="flex items-center gap-2 opacity-30">
          <span className="text-lg">❓</span>
          <span className="text-xs text-ors-cream/40 italic">Bekleniyor</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
        isWinner
          ? "bg-gold-shine/10 border border-ors-gold/40"
          : "bg-white/[0.03] border border-white/5"
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-xl shrink-0">{team.flag}</span>
        <span
          className={`text-xs font-bold truncate ${
            isWinner ? "text-ors-gold" : "text-ors-cream/80"
          }`}
        >
          {team.name}
        </span>
      </div>
      {score !== undefined && (
        <span
          className={`display text-lg shrink-0 ml-2 ${
            isWinner ? "text-ors-gold" : "text-ors-cream/60"
          }`}
        >
          {score}
        </span>
      )}
    </div>
  );
}

function BracketCard({ match, index }: { match: BracketMatch; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="glass rounded-xl p-2 space-y-1 min-w-[180px]"
    >
      <TeamRow
        team={match.home}
        score={match.homeScore}
        isWinner={match.winner === "home"}
        empty={!match.home}
      />
      <TeamRow
        team={match.away}
        score={match.awayScore}
        isWinner={match.winner === "away"}
        empty={!match.away}
      />
    </motion.div>
  );
}

function RoundColumn({
  title,
  matches,
  index,
}: {
  title: string;
  matches: BracketMatch[];
  index: number;
}) {
  return (
    <div className="flex flex-col gap-4 min-w-[200px]">
      <div className="text-center">
        <div className="display text-xs tracking-[0.3em] text-ors-gold/80 font-bold">
          {title}
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-ors-gold/50 to-transparent mt-1" />
      </div>
      <div className="flex flex-col gap-3 justify-around flex-1">
        {matches.map((m, i) => (
          <BracketCard key={m.id} match={m} index={index + i} />
        ))}
      </div>
    </div>
  );
}

export function WorldCupBracket() {
  const r16 = BRACKET.filter((m) => m.round === "R16");
  const qf = BRACKET.filter((m) => m.round === "QF");
  const sf = BRACKET.filter((m) => m.round === "SF");
  const f = BRACKET.filter((m) => m.round === "F");

  return (
    <section className="relative py-16 md:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Stadium grid backdrop */}
      <div className="absolute inset-0 bg-stadium-grid opacity-50 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-block glass-gold rounded-full px-4 py-1.5 mb-4">
            <span className="text-xs tracking-[0.3em] font-bold text-ors-gold">
              🌍 WORLD CUP BRACKET
            </span>
          </div>
          <h2 className="display text-5xl md:text-7xl text-ors-cream mb-3">
            Eleme <span className="text-gold-shine">Cetveli</span>
          </h2>
          <p className="text-ors-cream/60 max-w-xl mx-auto">
            Son 16'dan kupaya giden yol. Türkiye finale bir adım uzakta.
          </p>
        </motion.div>

        {/* Trophy spotlight */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="flex justify-center mb-10"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-ors-gold/40 blur-3xl animate-pulse-slow" />
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="relative"
            >
              <Trophy
                className="w-24 h-24 text-ors-gold drop-shadow-[0_0_30px_rgba(255,210,74,0.7)]"
                fill="#FFD24A"
                strokeWidth={1}
              />
            </motion.div>
          </div>
        </motion.div>

        {/* Bracket */}
        <div className="overflow-x-auto pb-6 -mx-4 px-4">
          <div className="flex gap-4 md:gap-8 min-w-max md:min-w-0 md:justify-center items-stretch">
            <RoundColumn title="Son 16" matches={r16} index={0} />
            <RoundColumn title="Çeyrek Final" matches={qf} index={4} />
            <RoundColumn title="Yarı Final" matches={sf} index={6} />

            {/* Final column with trophy */}
            <div className="flex flex-col gap-4 min-w-[200px]">
              <div className="text-center">
                <div className="display text-xs tracking-[0.3em] text-ors-gold font-bold">
                  Final
                </div>
                <div className="h-px bg-gradient-to-r from-transparent via-ors-gold to-transparent mt-1" />
              </div>
              <div className="flex flex-col gap-3 justify-center flex-1">
                {f.map((m, i) => (
                  <div key={m.id} className="relative">
                    <div className="absolute -inset-1 bg-ors-gold/20 rounded-2xl blur-md" />
                    <div className="relative glass-gold rounded-xl p-2 space-y-1">
                      <TeamRow team={m.home} score={m.homeScore} empty={!m.home} />
                      <TeamRow team={m.away} score={m.awayScore} empty={!m.away} />
                    </div>
                  </div>
                ))}
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="text-center pt-2"
                >
                  <div className="text-4xl">🏆</div>
                  <div className="display text-xs text-ors-gold mt-1 tracking-wider">
                    KUPA SAHİBİ
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
