# rezz.studio — Portfolio + CMS

Next.js 15 (App Router, JavaScript), GSAP + ScrollTrigger + Lenis, Motion for React.
Termasuk dashboard admin (`/admin`) dengan editor artikel ala WordPress dan mesin SEO (~45 pengecekan).

## Menjalankan

```bash
npm install
cp .env.example .env.local   # lalu isi ADMIN_PASSWORD dan AUTH_SECRET
npm run dev                  # http://localhost:3000
```

- Login admin: `/admin/login` (password dari `ADMIN_PASSWORD`).
- Isi `AUTH_SECRET` dengan string acak panjang (mis. `openssl rand -hex 32`).
- `NEXT_PUBLIC_SITE_URL` = domain final (dipakai sitemap, canonical, OG, schema).
- Tes mesin SEO: `npm run test:seo`.

## Produksi

```bash
npm run build && npm start
```

Data disimpan sebagai file JSON + upload di folder `DATA_DIR` (default `./data`).
Karena itu **deploy ke VPS/Docker dengan volume persisten** untuk `DATA_DIR`.
Jangan ke Vercel/serverless tanpa mengganti `lib/db.js` ke database (filesystem-nya tidak persisten).

## Fitur admin

- Dashboard: statistik, grafik trafik, konten terbaru, artikel teratas.
- Artikel: editor Visual / HTML / Preview (desktop, tablet, mobile), H1–H6, gambar, garis horizontal, tabel, video (upload / YouTube / Vimeo), link (Ctrl+K), simpan (Ctrl+S).
- Panel SEO: skor, checklist 4 grup (SEO, Keterbacaan, Teknis, GEO/AI Search), preview Google (desktop/mobile), Facebook/X, schema JSON-LD, saran internal link, deteksi kanibalisasi keyphrase, FAQ → FAQPage schema.
- Portfolio, Media Library, Pengaturan situs.
- Responsif: sidebar (desktop), drawer + bottom nav (mobile), editor dengan tab Editor / SEO / Dokumen.

## Mengganti konten & logo

- Teks Home/About statis: `lib/content.js`.
- Logo: `public/brand/*`; favicon: `app/icon.png`, `app/apple-icon.png`, `app/favicon.ico`.
- Foto/video portfolio: unggah lewat Admin → Media, lalu pilih di Admin → Portfolio.

## Catatan jujur

- Mesin SEO mencakup banyak pengecekan on-page, keterbacaan, teknis, dan GEO, tapi klaim "lebih kuat dari Yoast PRO" belum diuji head-to-head. Yoast juga punya fitur yang tidak ada di sini (mis. integrasi Google Search Console, redirect manager).
- Analisis bahasa (stemming, keterbacaan) berbasis aturan, optimal untuk Indonesia dan Inggris.
