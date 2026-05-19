# ORS Kahvaltı Ligi — World Cup Edition 🏆🥖

Bir ofis tahmin ligi. Tahmin yap, puan kazan, simit hattından uzak dur.

Modern bir spor uygulaması arayüzü, dünya kupası temalı görseller, koyu tema ile kırmızı/altın/siyah palette, glassmorphism ve Framer Motion animasyonlarıyla.

## ⚙️ Teknolojiler

- **Next.js 14** (App Router)
- **React 18** + **TypeScript**
- **Tailwind CSS** (özel ORS renk paleti)
- **Framer Motion** animasyonlar
- **Supabase** backend (opsiyonel — yoksa mock data ile çalışır)
- **lucide-react** ikonlar

## 🚀 Hızlı Başlangıç

```bash
npm install
npm run dev
```

`http://localhost:3000` adresinden açılır. Supabase ortam değişkenleri olmadan da mock data ile tam çalışır.

## 🔌 Supabase Bağlantısı (Opsiyonel)

```bash
cp .env.example .env.local
```

`.env.local` içine projenizin URL ve anon key değerlerini girin. Sonra `supabase/schema.sql` dosyasını Supabase SQL editörde çalıştırın.

## 📁 Yapı

```
app/
  layout.tsx          # Root layout, fontlar, metadata
  page.tsx            # Ana sayfa (tüm bölümleri birleştirir)
  globals.css         # Glassmorphism, gradients, scrollbar

components/
  Navbar.tsx          # Sticky cam navbar + mobile menü
  Hero.tsx            # Başlık, CTA, maskot
  Mascot.tsx          # SVG kartoon kuş maskotu (kırmızı ORS forması)
  MatchPredictions.tsx# 1/X/2 tahmin kartları, kilit, geri sayım
  Leaderboard.tsx     # Podyum + tablo, taçlı 1.
  SimitHatti.tsx      # Son 2 oyuncuyu kırmızı kartlarda gösterir
  Rules.tsx           # 5 kuralı kart düzeninde
  WorldCupBracket.tsx # R16 → QF → SF → Final + kupa
  Confetti.tsx        # Yüzen konfeti + stadyum ışıkları
  Footer.tsx

lib/
  supabase.ts         # Client (env yoksa null döner)
  mockData.ts         # Mock takım, maç, oyuncu, bracket
  types.ts

supabase/
  schema.sql          # Tablolar, view, scoring trigger, RLS
```

## 🎨 Tasarım Sistemi

```
ors.black     #0A0A0F   (background)
ors.ink       #11121A   (surface)
ors.coal      #1A1B26   (raised surface)
ors.red       #E4002B   (primary)
ors.redDark   #9F0021
ors.redGlow   #FF1F4B
ors.gold      #FFD24A   (accent)
ors.goldDeep  #C9961B
ors.cream     #FFF6E0   (text)
```

Glassmorphism utility class'ları: `.glass`, `.glass-strong`, `.glass-red`, `.glass-gold`. Neon: `.neon-red`, `.neon-gold`. Gradient text: `.text-gold-shine`, `.text-red-shine`.

## 🏗️ Yayına Alma

```bash
npm run build
npm start
```

Vercel'de tek tıkla deploy edilebilir.

---

> "Tahmin et, kazan, ısmarlat." — ORS Kahvaltı Ligi
