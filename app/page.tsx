"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronRight,
  CirclePlus,
  Dog,
  Filter,
  Heart,
  MapPin,
  Menu,
  PawPrint,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from "lucide-react";

const sampleListings = [
  { id: 1, status: "Kayboldu", title: "Mavi tasmalı tekir kedi", name: "Misket", type: "Kedi", city: "İstanbul", district: "Kadıköy", date: "18 Ekim 2026", image: "https://images.unsplash.com/photo-1519052537078-e6302a4968d4?auto=format&fit=crop&w=900&q=85", accent: "coral" },
  { id: 2, status: "Bulundu", title: "Parkta bulunan sevecen köpek", name: "İsimsiz", type: "Köpek", city: "Ankara", district: "Çankaya", date: "17 Ekim 2026", image: "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=900&q=85", accent: "green" },
  { id: 3, status: "Kayboldu", title: "Beyaz patili sarman", name: "Tarçın", type: "Kedi", city: "İzmir", district: "Karşıyaka", date: "16 Ekim 2026", image: "https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=900&q=85", accent: "coral" },
  { id: 4, status: "Yuvasına kavuştu", title: "Kırmızı tasmali golden", name: "Leo", type: "Köpek", city: "Bursa", district: "Nilüfer", date: "15 Ekim 2026", image: "https://images.unsplash.com/photo-1558788353-f76d92427f16?auto=format&fit=crop&w=900&q=85", accent: "gold" },
  { id: 5, status: "Bulundu", title: "Sakin ve oyuncu yavru", name: "İsimsiz", type: "Köpek", city: "İstanbul", district: "Beşiktaş", date: "14 Ekim 2026", image: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=900&q=85", accent: "green" },
  { id: 6, status: "Kayboldu", title: "Yeşil gözlü siyah kedi", name: "Zeytin", type: "Kedi", city: "Antalya", district: "Konyaaltı", date: "13 Ekim 2026", image: "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&w=900&q=85", accent: "coral" },
];

const statusStyles: Record<string, string> = { Kayboldu: "status-lost", Bulundu: "status-found", "Yuvasına kavuştu": "status-home" };

export default function Home() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Tümü");
  const [type, setType] = useState("Tür");
  const [city, setCity] = useState("İl");
  const [showForm, setShowForm] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [selected, setSelected] = useState<(typeof sampleListings)[number] | null>(null);

  const filtered = useMemo(() => sampleListings.filter((item) => {
    const haystack = `${item.title} ${item.name} ${item.type} ${item.city} ${item.district}`.toLocaleLowerCase("tr");
    return (!query || haystack.includes(query.toLocaleLowerCase("tr"))) && (status === "Tümü" || item.status === status) && (type === "Tür" || item.type === type) && (city === "İl" || item.city === city);
  }), [query, status, type, city]);

  return (
    <main>
      <header className="site-header">
        <div className="header-inner">
          <a className="brand" href="#ilanlar" aria-label="Pati Buldum ana sayfa"><span className="brand-mark"><PawPrint /></span><span>Pati <i>Buldum</i></span></a>
          <nav className={mobileMenu ? "main-nav open" : "main-nav"} aria-label="Ana menü">
            <a href="#ilanlar" onClick={() => setMobileMenu(false)}>İlanlar</a>
            <a href="#nasil-calisir" onClick={() => setMobileMenu(false)}>Nasıl çalışır?</a>
            <button className="nav-report" onClick={() => { setShowForm(true); setMobileMenu(false); }}><CirclePlus /> İlan ver</button>
          </nav>
          <button className="menu-button" aria-label="Menüyü aç" onClick={() => setMobileMenu(!mobileMenu)}>{mobileMenu ? <X /> : <Menu />}</button>
        </div>
      </header>

      <section className="hero">
        <div className="hero-inner">
          <div className="hero-copy"><div className="eyebrow"><PawPrint /> Birlikte daha kolay</div><h1>Her pati<br /><em>evinin yolunu</em> bulsun.</h1><p>Kayıp dostlarımızı buluşturmak için komşuların gücünü bir araya getiriyoruz.</p><div className="hero-actions"><button className="button button-coral" onClick={() => setShowForm(true)}><PawPrint /> Hayvanım kayboldu</button><button className="button button-outline" onClick={() => setShowForm(true)}><Search /> Bir hayvan buldum</button></div></div>
          <div className="hero-visual"><div className="hero-image"><img src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=1100&q=85" alt="Birlikte oynayan sevimli köpekler" /><div className="image-note"><span className="online-dot" /> Mahallenden <strong>1.248</strong> kişi burada</div></div><div className="hero-paw"><PawPrint /></div></div>
        </div>
      </section>

      <section className="listings-section" id="ilanlar"><div className="section-heading"><div><div className="eyebrow">Güncel ilanlar</div><h2>Bir pati seni bekliyor olabilir.</h2></div><span className="sample-label">Örnek ilanlar</span></div>
        <div className="search-panel"><div className="search-box"><Search /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="İlanlarda ara..." aria-label="İlanlarda ara" /></div><div className="filters"><select aria-label="Durum filtresi" value={status} onChange={(e) => setStatus(e.target.value)}><option>Tümü</option><option>Kayboldu</option><option>Bulundu</option><option>Yuvasına kavuştu</option></select><select aria-label="Tür filtresi" value={type} onChange={(e) => setType(e.target.value)}><option>Tür</option><option>Kedi</option><option>Köpek</option></select><select aria-label="İl filtresi" value={city} onChange={(e) => setCity(e.target.value)}><option>İl</option><option>İstanbul</option><option>Ankara</option><option>İzmir</option><option>Bursa</option><option>Antalya</option></select><button className="filter-icon" aria-label="Gelişmiş filtreler"><SlidersHorizontal /></button></div></div>
        {filtered.length ? <div className="listing-grid">{filtered.map((item) => <article className="listing-card" key={item.id} onClick={() => setSelected(item)} tabIndex={0} onKeyDown={(e) => e.key === "Enter" && setSelected(item)}><div className="card-image"><img src={item.image} alt={`${item.title} fotoğrafı`} /><span className={`status ${statusStyles[item.status]}`}>{item.status}</span><button className="save-button" aria-label="İlanı kaydet" onClick={(e) => e.stopPropagation()}><Heart /></button></div><div className="card-body"><h3>{item.title}</h3><p className="animal-name">{item.name} <span>•</span> {item.type}</p><p className="card-meta"><MapPin /> {item.city}, {item.district}<span className="meta-date"><CalendarDays /> {item.date}</span></p></div></article>)}</div> : <div className="empty-state"><PawPrint /><h3>Aramana uygun ilan bulamadık.</h3><p>Filtreleri değiştirerek tekrar deneyebilirsin.</p></div>}
      </section>

      <section className="how-section" id="nasil-calisir"><div className="how-copy"><div className="eyebrow">Pati Buldum nasıl çalışır?</div><h2>Bir paylaşım,<br /><em>bir umut.</em></h2><p>Doğru bilgi ve hızlı paylaşım, kayıp dostlarımızın yuvasına dönme şansını artırır.</p><button className="text-button" onClick={() => setShowForm(true)}>İlan vermeye başla <ChevronRight /></button></div><div className="steps"><div className="step"><span>01</span><div><h3>İlanını oluştur</h3><p>Fotoğraf ve konum bilgilerini ekle.</p></div></div><div className="step"><span>02</span><div><h3>Komşularına ulaş</h3><p>İlanın doğru kişilere yayılsın.</p></div></div><div className="step"><span>03</span><div><h3>Yuvaya kavuşsun</h3><p>Gelişmeleri paylaş, umudu büyüt.</p></div></div></div></section>

      <footer><div className="footer-brand"><span className="brand-mark"><PawPrint /></span><strong>Pati <i>Buldum</i></strong><p>Her pati evinin yolunu bulsun.</p></div><div className="footer-note"><ShieldCheck /> Güvenli topluluk, gerçek hikâyeler.<br /><small>© 2026 Pati Buldum</small></div></footer>

      {showForm && <div className="modal-backdrop" role="presentation" onClick={() => setShowForm(false)}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="form-title" onClick={(e) => e.stopPropagation()}><button className="close-button" onClick={() => setShowForm(false)} aria-label="Formu kapat"><X /></button><div className="eyebrow">Yeni ilan</div><h2 id="form-title">Pati dostuna yardım edelim.</h2><p className="modal-intro">İlan formu hazır. Fotoğraf ve bilgilerini ekleyerek başlayabilirsin.</p><div className="form-grid"><label>Durum<select><option>Hayvanım kayboldu</option><option>Bir hayvan buldum</option></select></label><label>Tür<select><option>Kedi</option><option>Köpek</option></select></label><label className="full">İlan başlığı<input placeholder="Örn. Mavi tasmali tekir kedi" /></label><label>İl<input placeholder="İstanbul" /></label><label>İlçe<input placeholder="Kadıköy" /></label><label className="full">Açıklama<textarea placeholder="Ayırt edici özellikleri, görüldüğü yeri yaz..." rows={3} /></label></div><div className="upload-box"><PawPrint /><span>Fotoğraf eklemek için tıkla</span><small>JPG, PNG · En fazla 10 MB</small></div><div className="setup-notice"><ShieldCheck /><span>İlan gönderimi için Supabase veritabanı ve kullanıcı girişi kurulumu tamamlanmalı. Bu önizlemede kayıt oluşturulmaz.</span></div><button className="button button-disabled" disabled>Kurulum bekleniyor</button></div></div>}
      {selected && <div className="modal-backdrop" role="presentation" onClick={() => setSelected(null)}><div className="detail-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}><button className="close-button" onClick={() => setSelected(null)} aria-label="Detayı kapat"><X /></button><img src={selected.image} alt={`${selected.title} fotoğrafı`} /><div className="detail-content"><span className={`status ${statusStyles[selected.status]}`}>{selected.status}</span><h2>{selected.title}</h2><p className="animal-name">{selected.name} <span>•</span> {selected.type}</p><p className="card-meta"><MapPin /> {selected.city}, {selected.district}</p><p className="card-meta"><CalendarDays /> {selected.date}</p><button className="button button-coral" onClick={() => setSelected(null)}>İletişim bilgilerini gör</button></div></div></div>}
    </main>
  );
}
