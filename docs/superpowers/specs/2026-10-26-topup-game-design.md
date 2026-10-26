# NEXATOPUP (Indonesian Mobile-First Game Top-Up) Design Spec

## 1. Overview & Goals
Membangun aplikasi web top-up game regional Indonesia yang **mobile-first**, mengadaptasi struktur visual dari gambar referensi (3 layar utama: Home, Explore, dan Riwayat/Cek Pesanan sebagai pengganti Wallet) **tanpa autentikasi/login** (100% Guest Checkout seperti Codashop/UniPin). Setiap game memiliki data mata uang/item asli hasil riset pasar Indonesia, cover art asli, serta **1 produk Testing Rp 1.000** untuk uji coba transaksi.

## 2. Tech Stack & Constraints
- **Framework**: Next.js (App Router, TypeScript)
- **Styling & UI**: Tailwind CSS + komponen berbasis pola shadcn/ui + Lucide icons fungsional
- **State & Storage**: React state + `localStorage` untuk menyimpan riwayat transaksi guest (*Buy Again* & *Recent Activity*) tanpa login
- **Testing**: Vitest untuk unit/logic test (`ponytail` & TDD) + build/render verification
- **Antislop Compliance**:
  - Tidak ada karakter em dash di seluruh teks UI maupun kode (R-02).
  - Semua tombol dan link berfungsi nyata, tidak ada kontrol mati (R-24, R-26).
  - Menyediakan empty state, loading state, dan error validation state yang jelas (R-27).
  - Kontras teks memenuhi WCAG AA (R-25) dan ukuran tap target minimal 44x44px (R-03).

## 3. Data Model (`src/data/games.ts`)
Menyimpan data konkret untuk 6 game terpopuler di Indonesia:
1. **Mobile Legends: Bang Bang** (Moonton) - Input: `User ID` + `Zone ID` - Currency: `Diamonds` & `Weekly Diamond Pass`
2. **Free Fire** (Garena) - Input: `Player ID` - Currency: `Diamonds` & `Booyah Pass`
3. **PUBG Mobile** (Level Infinite) - Input: `Character ID` - Currency: `Unknown Cash (UC)` & `Royale Pass`
4. **Genshin Impact** (HoYoverse) - Input: `UID` + `Server` (Asia, America, Europe, TW/HK/MO) - Currency: `Genesis Crystals` & `Blessing of the Welkin Moon`
5. **Honor of Kings** (Level Infinite) - Input: `Player ID` - Currency: `Tokens` & `Weekly Card`
6. **Valorant** (Riot Games) - Input: `Riot ID (Username#TAG)` - Currency: `Valorant Points (VP)`

**Aturan Wajib Produk Testing**:
Setiap game memiliki item pertama dengan `isTestProduct: true`, harga `1000` (`Rp 1.000`), dan label `Testing Product Rp 1.000` agar pengguna dapat menguji alur checkout nominal kecil.

## 4. Screens & User Flows
1. **Home View**:
   - Header region Indonesia (`ID - IDR`), tanpa profil user/login.
   - Search input real-time (memfilter game & pass berdasarkan kata kunci).
   - Kartu utama Indigo-Violet (adaptasi kartu atas di referensi): menampilkan ringkasan promo *Testing Product Rp 1.000* + tombol aksi cepat (*Mulai Top-Up*, *Cek Invoice*, *Riwayat*).
   - Kategori cepat (5 tombol >= 44px): *Semua Game*, *Pass & Membership*, *Mobile*, *PC/Cross-Platform*, *Cek Pesanan*.
   - **Buy Again (Beli Lagi)**: Menampilkan transaksi terakhir dari `localStorage` untuk pengisian ulang 1-klik, atau empty state terarah jika belum ada transaksi.
   - **Trending Games**: Kartu game unggulan dengan badge *Instan*.
2. **Explore View**:
   - **Top Games Grid (3x2 di mobile)**: 6 kartu game dengan gambar asli dan judul di bagian bawah kartu (sesuai layar tengah gambar referensi).
   - **Subscriptions & Pass**: Daftar pass populer (*Weekly Diamond Pass MLBB*, *Welkin Moon Genshin*, *Booyah Pass FF*, *Royale Pass PUBG*) lengkap dengan harga mulai IDR.
3. **Orders / Cek Transaksi View (Pengganti Wallet di referensi)**:
   - Kartu status pesanan & form pencarian Nomor Invoice (`INV-...`) atau nomor WhatsApp.
   - Daftar saluran pembayaran Indonesia yang tersedia (QRIS, DANA, GoPay, OVO, ShopeePay, BRI/BCA/Mandiri VA).
   - **Recent Activity**: Daftar transaksi yang tersimpan di perangkat lengkap dengan nominal item, metode pembayaran, waktu, dan harga IDR.
4. **Game Top-Up Detail & Checkout Modal/Drawer (`/topup/[slug]` atau interaktif)**:
   - Validasi input akun (User ID / Zone ID / Server) + fitur simulasi *Cek Nickname*.
   - Pemilihan nominal (Testing Rp 1.000, Pass, atau Reguler).
   - Pemilihan metode pembayaran (QRIS tanpa biaya admin untuk Rp 1.000, E-Wallet, VA).
   - Input WhatsApp opsional -> Konfirmasi Pembayaran (menampilkan QRIS simulasi & tombol *Simulasikan Pembayaran Berhasil*) -> menyimpan transaksi ke `localStorage` dan menampilkan struk Invoice.
