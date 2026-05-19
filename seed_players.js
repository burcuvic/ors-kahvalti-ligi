/**
 * ORS Kahvaltı Ligi — Oyuncu Ekleme Scripti (GÜNCEL)
 * ====================================================
 *
 * 8 oyuncuyu mevcut puan tablosuyla Supabase'e ekler.
 * Kaynak: Senin verdiğin güncel sıralama (Mahmut 1398 lider).
 *
 * KULLANIM:
 *   node seed_players.js
 *
 * NOT:
 * - Eğer Supabase'de zaten aynı isimde oyuncu varsa onu ATLAR (çakışma olmaz).
 * - Sıfırdan başlamak istersen önce dashboard'dan players tablosunu Truncate et.
 */

const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://mqjgemndxkuufjaeyhjb.supabase.co";
const SUPABASE_KEY = "sb_publishable_ZcaB2PBtdaBJ6blYdd4wPA_872a5OfE";

// Güncel puan durumu — sezon devam ediyor
const PLAYERS = [
  { name: "Mahmut", correct: 638, wrong: 607, mucbir: 14, bilincli: 3,  ekPuan: 100, total: 1398, isAdmin: false },
  { name: "Aziz",   correct: 633, wrong: 627, mucbir: 0,  bilincli: 2,  ekPuan: 100, total: 1366, isAdmin: false },
  { name: "Burcu",  correct: 631, wrong: 633, mucbir: 0,  bilincli: 0,  ekPuan: 70,  total: 1330, isAdmin: true  },
  { name: "Akın",   correct: 633, wrong: 628, mucbir: 0,  bilincli: 5,  ekPuan: 30,  total: 1286, isAdmin: false },
  { name: "Baştar", correct: 626, wrong: 617, mucbir: 0,  bilincli: 21, ekPuan: 70,  total: 1268, isAdmin: false },
  { name: "Volkan", correct: 625, wrong: 601, mucbir: 0,  bilincli: 39, ekPuan: 80,  total: 1237, isAdmin: false },
  { name: "Suna",   correct: 584, wrong: 675, mucbir: 0,  bilincli: 6,  ekPuan: 20,  total: 1079, isAdmin: false },
  { name: "Birce",  correct: 598, wrong: 604, mucbir: 0,  bilincli: 62, ekPuan: 40,  total: 1044, isAdmin: false },
];

async function main() {
  console.log("=".repeat(70));
  console.log("ORS Kahvaltı Ligi — Oyuncu Ekleme (Güncel Tablo)");
  console.log("=".repeat(70));

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const { data: existing, error: selErr } = await supabase
    .from("players")
    .select("name");
  if (selErr) {
    console.error("❌ Supabase bağlantı hatası:", selErr.message);
    process.exit(1);
  }
  const existingNames = new Set((existing || []).map((p) => p.name));

  console.log(`\nSupabase'de zaten ${existingNames.size} oyuncu var.\n`);

  let added = 0;
  let skipped = 0;

  for (const p of PLAYERS) {
    if (existingNames.has(p.name)) {
      console.log(`  ⊘ ${p.name} zaten var, atlandı`);
      skipped++;
      continue;
    }

    const totalAnswered = p.correct + p.wrong;
    const successRate =
      totalAnswered > 0
        ? Math.round((p.correct / totalAnswered) * 1000) / 10
        : 0;

    const { error } = await supabase.from("players").insert({
      name: p.name,
      is_admin: p.isAdmin,
      correct_count: p.correct,
      wrong_count: p.wrong,
      no_prediction_count: p.mucbir + p.bilincli,
      bonus_points: p.ekPuan,
      total_points: p.total,
      success_rate: successRate,
    });

    if (error) {
      console.error(`  ✗ ${p.name} eklenemedi:`, error.message);
    } else {
      const adminTag = p.isAdmin ? " 👑 ADMIN" : "";
      console.log(
        `  ✓ ${p.name.padEnd(8)} ${String(p.total).padStart(4)} puan  ` +
        `(${p.correct}D / ${p.wrong}Y / +${p.ekPuan} ek)  %${successRate}${adminTag}`
      );
      added++;
    }
  }

  console.log("\n" + "=".repeat(70));
  console.log(`Toplam: ${added} eklendi, ${skipped} atlandı`);
  console.log("=".repeat(70));

  if (added > 0) {
    console.log("\n✅ Hazır.");
    console.log("   Şimdi npm run dev ile uygulamayı aç.");
    console.log("   Burcu admin olarak giriş yapacak — admin paneli aktif.");
    console.log("   Diğer oyuncular sadece kendi adıyla giriş yapabilir.");
  } else if (skipped === PLAYERS.length) {
    console.log("\n⚠️  Tüm oyuncular zaten varmış, hiçbir şey değişmedi.");
    console.log(
      "   Sıfırdan istersen önce Supabase'de players tablosunu Truncate et:"
    );
    console.log("   Dashboard → Table Editor → players → ... → Truncate");
  }
}

main().catch((err) => {
  console.error("\n❌ Hata:", err.message || err);
  process.exit(1);
});
