# DESIGN.md - NEXATOPUP (Indonesian Game Top-Up Marketplace)

## Identity & Character
- **Product**: NEXATOPUP, platform top-up game instan regional Indonesia tanpa login (Guest Checkout).
- **Audience**: Gamer mobile dan PC di Indonesia (Mobile Legends, Free Fire, PUBG Mobile, Genshin Impact, Honor of Kings, Valorant).
- **Mood**: Clean light-surface fintech marketplace (terinspirasi dari referensi visual mobile marketplace dengan kartu fitur Indigo-Violet dan surface putih bersih).
- **Dial**: ENERGY 2 / RHYTHM 2 / MOTION 1

## Palette (R-01, R-25, R-29)
- **Canvas Background**: `#F4F5FA` (Soft Cool Alabaster, memisahkan kartu putih tanpa border berat)
- **Card Surface**: `#FFFFFF` (Crisp White untuk keterbacaan harga dan item)
- **Primary Text**: `#0F172A` (Slate 900, rasio kontras > 14:1 di atas putih, lulus WCAG AA R-25)
- **Secondary Text**: `#475569` (Slate 600, rasio kontras > 7:1 di atas putih, lulus WCAG AA R-25)
- **Primary Accent**: `#5B4DFF` (Electric Indigo-Violet, hanya digunakan pada Hero Promo Card, tab aktif, dan CTA utama sesuai referensi gambar)
- **Semantic Status**: `#15803D` (Green 700 untuk badge Testing Rp 1.000 & transaksi sukses, teks putih/hijau tua kontras AA)

## Typography (R-06)
- **Primary Sans**: `Plus Jakarta Sans` (karakter modern, ramah mobile, mendukung `tabular-nums` untuk perbandingan harga Rupiah).
- **Monospace**: `JetBrains Mono` khusus untuk Nomor Invoice (`INV-...`), kode pembayaran QRIS/VA, dan input User ID.

## Layout & Mobile Reflow (`antislop-layoutmobile` R-03)
- **Mobile (`< 640px`)**: Single-column ergonomic flow, grid katalog Top Games `3x2` dengan kartu rasio persegi membulat (`rounded-2xl`), tap target minimal `44x44px`, bottom navigation bar melayang dengan `pb-28` pada halaman agar tidak menutupi konten bawah.
- **Tablet (`640px - 1023px`)**: Reflow ke 2 kolom untuk daftar Pass/Subscriptions dan grid nominal diamond 3 kolom.
- **Desktop (`>= 1024px`)**: Split-screen layout (panel navigasi/informasi di kiri dan workspace katalog atau form checkout di kanan).

## Written Reasons (R-31)
1. **Color**: Menggunakan surface terang `#F4F5FA` dan aksen tunggal `#5B4DFF` agar sesuai dengan referensi desain dan menjaga fokus mata pada nominal harga serta tombol beli.
2. **Layout**: Menggunakan 3-state responsive layout dengan bottom dock di mobile agar seluruh navigasi utama terjangkau satu ibu jari.
3. **Typography**: Memilih `Plus Jakarta Sans` dengan `tabular-nums` agar deretan harga Rupiah (`Rp 1.000` hingga `Rp 1.499.000`) terbaca cepat tanpa salah baca digit.
4. **Spacing**: Skala spacing lebih rapat di mobile (`p-4`, `gap-3`) dan lebih lega di tablet/desktop (`p-6`, `gap-5`) agar tidak ada ruang kosong berlebihan di layar ponsel.
5. **Cards**: Kartu game di bagian Top Games menggunakan rasio gambar penuh dengan overlay teks kontras tinggi di bawah sesuai referensi, sedangkan kartu nominal menggunakan list/grid padat informasi tanpa ikon dekoratif berulang.
6. **Icons & Assets**: Cover game menggunakan artwork resmi masing-masing game; tidak ada avatar palsu, testimoni rekayasa, atau statistik karangan.
