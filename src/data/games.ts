export type AccountFieldMode = "mlbb_zone" | "uid_server" | "riot_tag" | "numeric_id";

export interface TopupItem {
  id: string;
  name: string;
  subLabel: string;
  price: number;
  originalPrice?: number;
  category: "test" | "pass" | "regular";
  isTestProduct?: boolean;
  badge?: string;
}

export interface GameConfig {
  slug: string;
  name: string;
  shortName: string;
  publisher: string;
  category: "MOBA" | "Battle Royale" | "Action RPG" | "Tactical FPS";
  platform: "Mobile" | "PC" | "Cross-Platform";
  currencyName: string;
  coverImage: string;
  accentColor: string;
  accountMode: AccountFieldMode;
  accountHint: string;
  accountPlaceholder: string;
  zonePlaceholder?: string;
  servers?: string[];
  instantDelivery: boolean;
  items: TopupItem[];
}

export interface PaymentMethod {
  id: string;
  name: string;
  category: "QRIS" | "E-Wallet" | "Virtual Account" | "Minimarket";
  codeLabel: string;
  flatFee: number;
  freeForTestProduct: boolean;
  minAmount: number;
  settlementText: string;
}

export interface PassSubscriptionItem {
  id: string;
  gameSlug: string;
  gameName: string;
  itemId: string;
  title: string;
  categoryLabel: string;
  price: number;
  periodLabel: string;
  coverImage: string;
}

export const GAMES: GameConfig[] = [
  {
    slug: "mobile-legends",
    name: "Mobile Legends: Bang Bang",
    shortName: "Mobile Legends",
    publisher: "Moonton",
    category: "MOBA",
    platform: "Mobile",
    currencyName: "Diamonds",
    coverImage: "/games/mobile-legends.png",
    accentColor: "#3B82F6",
    accountMode: "mlbb_zone",
    accountHint: "Masukkan User ID dan Zone ID (4-5 digit di dalam tanda kurung pada profil MLBB).",
    accountPlaceholder: "Contoh: 128492018",
    zonePlaceholder: "Zone: 2641",
    instantDelivery: true,
    items: [
      {
        id: "ml-test-1000",
        name: "Testing Product (3 Diamonds)",
        subLabel: "Produk uji coba checkout nyata Rp 1.000",
        price: 1000,
        category: "test",
        isTestProduct: true,
        badge: "Testing Rp 1.000",
      },
      {
        id: "ml-wdp",
        name: "Weekly Diamond Pass",
        subLabel: "80 Dm instan + 20 Dm/hari selama 7 hari (Total 220 Dm)",
        price: 30700,
        originalPrice: 34000,
        category: "pass",
        badge: "Terlaris",
      },
      {
        id: "ml-14",
        name: "14 Diamonds",
        subLabel: "13 Diamonds + 1 Bonus",
        price: 4000,
        category: "regular",
      },
      {
        id: "ml-56",
        name: "56 Diamonds",
        subLabel: "51 Diamonds + 5 Bonus",
        price: 15500,
        category: "regular",
      },
      {
        id: "ml-86",
        name: "86 Diamonds",
        subLabel: "78 Diamonds + 8 Bonus",
        price: 24500,
        originalPrice: 27000,
        category: "regular",
        badge: "Populer",
      },
      {
        id: "ml-172",
        name: "172 Diamonds",
        subLabel: "156 Diamonds + 16 Bonus",
        price: 49000,
        category: "regular",
      },
      {
        id: "ml-257",
        name: "257 Diamonds",
        subLabel: "234 Diamonds + 23 Bonus",
        price: 73500,
        category: "regular",
      },
      {
        id: "ml-429",
        name: "429 Diamonds",
        subLabel: "390 Diamonds + 39 Bonus",
        price: 122000,
        category: "regular",
      },
      {
        id: "ml-568",
        name: "568 Diamonds",
        subLabel: "503 Diamonds + 65 Bonus",
        price: 165000,
        category: "regular",
      },
      {
        id: "ml-twilight",
        name: "Twilight Pass",
        subLabel: "Akses hadiah eksklusif & skin Miya Suzuhime",
        price: 150000,
        category: "pass",
      },
    ],
  },
  {
    slug: "free-fire",
    name: "Free Fire",
    shortName: "Free Fire",
    publisher: "Garena",
    category: "Battle Royale",
    platform: "Mobile",
    currencyName: "Diamonds",
    coverImage: "/games/free-fire.png",
    accentColor: "#F97316",
    accountMode: "numeric_id",
    accountHint: "Masukkan Player ID Free Fire (angka 8-12 digit di bawah nickname profil).",
    accountPlaceholder: "Contoh: 582910442",
    instantDelivery: true,
    items: [
      {
        id: "ff-test-1000",
        name: "Testing Product (5 Diamonds)",
        subLabel: "Produk uji coba checkout nyata Rp 1.000",
        price: 1000,
        category: "test",
        isTestProduct: true,
        badge: "Testing Rp 1.000",
      },
      {
        id: "ff-weekly",
        name: "Member Mingguan",
        subLabel: "100 Dm instan + 50 Dm/hari selama 7 hari (Total 450 Dm)",
        price: 30000,
        category: "pass",
        badge: "Hemat",
      },
      {
        id: "ff-booyah",
        name: "Booyah Pass Card",
        subLabel: "Upgrade Booyah Pass Premium Season aktif",
        price: 45000,
        category: "pass",
        badge: "Season Pass",
      },
      {
        id: "ff-12",
        name: "12 Diamonds",
        subLabel: "Pengisian instan via Player ID",
        price: 1800,
        category: "regular",
      },
      {
        id: "ff-50",
        name: "50 Diamonds",
        subLabel: "Pengisian instan via Player ID",
        price: 7200,
        category: "regular",
      },
      {
        id: "ff-70",
        name: "70 Diamonds",
        subLabel: "Denominasi favorit pemain FF",
        price: 9000,
        category: "regular",
        badge: "Populer",
      },
      {
        id: "ff-140",
        name: "140 Diamonds",
        subLabel: "Pengisian instan via Player ID",
        price: 18000,
        category: "regular",
      },
      {
        id: "ff-355",
        name: "355 Diamonds",
        subLabel: "Cukup untuk bundel event & spin",
        price: 45000,
        category: "regular",
      },
      {
        id: "ff-720",
        name: "720 Diamonds",
        subLabel: "Pengisian instan via Player ID",
        price: 90000,
        category: "regular",
      },
    ],
  },
  {
    slug: "pubg-mobile",
    name: "PUBG Mobile",
    shortName: "PUBG Mobile",
    publisher: "Level Infinite",
    category: "Battle Royale",
    platform: "Mobile",
    currencyName: "Unknown Cash (UC)",
    coverImage: "/games/pubg-mobile.png",
    accentColor: "#EAB308",
    accountMode: "numeric_id",
    accountHint: "Masukkan Character ID PUBG Mobile (angka 9-11 digit di pojok kiri atas profil).",
    accountPlaceholder: "Contoh: 5192837465",
    instantDelivery: true,
    items: [
      {
        id: "pubg-test-1000",
        name: "Testing Product (5 UC)",
        subLabel: "Produk uji coba checkout nyata Rp 1.000",
        price: 1000,
        category: "test",
        isTestProduct: true,
        badge: "Testing Rp 1.000",
      },
      {
        id: "pubg-rp",
        name: "Royale Pass Pack (A-Series)",
        subLabel: "660 UC untuk aktivasi Elite Royale Pass",
        price: 150000,
        originalPrice: 158000,
        category: "pass",
        badge: "Royale Pass",
      },
      {
        id: "pubg-60",
        name: "60 UC",
        subLabel: "Paket standar Midasbuy Indonesia",
        price: 15000,
        category: "regular",
      },
      {
        id: "pubg-325",
        name: "325 UC",
        subLabel: "300 UC + 25 Bonus UC",
        price: 75000,
        category: "regular",
        badge: "Populer",
      },
      {
        id: "pubg-660",
        name: "660 UC",
        subLabel: "600 UC + 60 Bonus UC",
        price: 150000,
        category: "regular",
      },
      {
        id: "pubg-1800",
        name: "1.800 UC",
        subLabel: "1.500 UC + 300 Bonus UC",
        price: 375000,
        category: "regular",
      },
      {
        id: "pubg-3850",
        name: "3.850 UC",
        subLabel: "3.000 UC + 850 Bonus UC",
        price: 750000,
        category: "regular",
      },
    ],
  },
  {
    slug: "genshin-impact",
    name: "Genshin Impact",
    shortName: "Genshin Impact",
    publisher: "HoYoverse",
    category: "Action RPG",
    platform: "Cross-Platform",
    currencyName: "Genesis Crystals",
    coverImage: "/games/genshin-impact.png",
    accentColor: "#6366F1",
    accountMode: "uid_server",
    accountHint: "Masukkan UID 9 digit (untuk server Asia umumnya diawali angka 8) dan pilih Server.",
    accountPlaceholder: "Contoh UID: 812940192",
    servers: ["Asia", "America", "Europe", "TW, HK, MO"],
    instantDelivery: true,
    items: [
      {
        id: "gi-test-1000",
        name: "Testing Product (10 Genesis Crystals)",
        subLabel: "Produk uji coba checkout nyata Rp 1.000",
        price: 1000,
        category: "test",
        isTestProduct: true,
        badge: "Testing Rp 1.000",
      },
      {
        id: "gi-welkin",
        name: "Blessing of the Welkin Moon",
        subLabel: "300 Genesis Crystals instan + 90 Primogems/hari (30 hari)",
        price: 75000,
        originalPrice: 79000,
        category: "pass",
        badge: "Terlaris",
      },
      {
        id: "gi-60",
        name: "60 Genesis Crystals",
        subLabel: "Bonus 2x lipat jika First Top-Up in-game tersedia",
        price: 15000,
        category: "regular",
      },
      {
        id: "gi-330",
        name: "330 Genesis Crystals",
        subLabel: "300 Crystals + 30 Bonus",
        price: 75000,
        category: "regular",
      },
      {
        id: "gi-1090",
        name: "1.090 Genesis Crystals",
        subLabel: "980 Crystals + 110 Bonus",
        price: 219000,
        category: "regular",
        badge: "Populer",
      },
      {
        id: "gi-2240",
        name: "2.240 Genesis Crystals",
        subLabel: "1.980 Crystals + 260 Bonus",
        price: 439000,
        category: "regular",
      },
      {
        id: "gi-3880",
        name: "3.880 Genesis Crystals",
        subLabel: "3.280 Crystals + 600 Bonus",
        price: 739000,
        category: "regular",
      },
      {
        id: "gi-8080",
        name: "8.080 Genesis Crystals",
        subLabel: "6.480 Crystals + 1.600 Bonus",
        price: 1499000,
        category: "regular",
      },
    ],
  },
  {
    slug: "honor-of-kings",
    name: "Honor of Kings",
    shortName: "Honor of Kings",
    publisher: "Level Infinite",
    category: "MOBA",
    platform: "Mobile",
    currencyName: "Tokens",
    coverImage: "/games/honor-of-kings.png",
    accentColor: "#0EA5E9",
    accountMode: "numeric_id",
    accountHint: "Masukkan UID / Player ID Honor of Kings (buka Profil > Pengaturan > Lihat UID).",
    accountPlaceholder: "Contoh: 6492018293",
    instantDelivery: true,
    items: [
      {
        id: "hok-test-1000",
        name: "Testing Product (8 Tokens)",
        subLabel: "Produk uji coba checkout nyata Rp 1.000",
        price: 1000,
        category: "test",
        isTestProduct: true,
        badge: "Testing Rp 1.000",
      },
      {
        id: "hok-weekly",
        name: "Weekly Card HOK",
        subLabel: "80 Tokens instan + klaim harian selama 7 hari",
        price: 16000,
        category: "pass",
        badge: "Hemat",
      },
      {
        id: "hok-80",
        name: "80 Tokens",
        subLabel: "Cukup untuk Mini Pass (88 Tokens dengan bonus)",
        price: 16000,
        category: "regular",
      },
      {
        id: "hok-240",
        name: "240 Tokens",
        subLabel: "Pengisian instan via UID",
        price: 47000,
        category: "regular",
      },
      {
        id: "hok-400",
        name: "400 Tokens",
        subLabel: "Pas untuk aktivasi Elite Honor Pass (388 Tokens)",
        price: 81000,
        category: "regular",
        badge: "Populer",
      },
      {
        id: "hok-560",
        name: "560 Tokens",
        subLabel: "Pengisian instan via UID",
        price: 113000,
        category: "regular",
      },
      {
        id: "hok-830",
        name: "830 Tokens",
        subLabel: "Pengisian instan via UID",
        price: 158800,
        category: "regular",
      },
      {
        id: "hok-1245",
        name: "1.245 Tokens",
        subLabel: "Pas untuk Deluxe Honor Pass (988 Tokens) + sisa skin",
        price: 238100,
        category: "regular",
      },
    ],
  },
  {
    slug: "valorant",
    name: "Valorant",
    shortName: "Valorant",
    publisher: "Riot Games",
    category: "Tactical FPS",
    platform: "PC",
    currencyName: "Valorant Points (VP)",
    coverImage: "/games/valorant.png",
    accentColor: "#EF4444",
    accountMode: "riot_tag",
    accountHint: "Masukkan Riot ID lengkap beserta Tagline (format: Nickname#TAG).",
    accountPlaceholder: "Contoh: GarudaAce#IDN",
    instantDelivery: true,
    items: [
      {
        id: "val-test-1000",
        name: "Testing Product (10 VP)",
        subLabel: "Produk uji coba checkout nyata Rp 1.000",
        price: 1000,
        category: "test",
        isTestProduct: true,
        badge: "Testing Rp 1.000",
      },
      {
        id: "val-475",
        name: "475 Valorant Points",
        subLabel: "Region Indonesia (IDR) langsung masuk ke akun Riot",
        price: 50000,
        category: "regular",
      },
      {
        id: "val-1000",
        name: "1.000 Valorant Points",
        subLabel: "Nominal pas untuk Battlepass Act aktif (1.000 VP)",
        price: 100000,
        category: "pass",
        badge: "Battlepass",
      },
      {
        id: "val-2050",
        name: "2.050 Valorant Points",
        subLabel: "Pas untuk skin senjata Premium tier (1.775 VP)",
        price: 200000,
        category: "regular",
        badge: "Populer",
      },
      {
        id: "val-3650",
        name: "3.650 Valorant Points",
        subLabel: "Pas untuk Melee / Knife skin atau Exclusive tier",
        price: 350000,
        category: "regular",
      },
      {
        id: "val-5350",
        name: "5.350 Valorant Points",
        subLabel: "Region Indonesia (IDR) instan",
        price: 500000,
        category: "regular",
      },
    ],
  },
];

export const PASS_SUBSCRIPTIONS: PassSubscriptionItem[] = [
  {
    id: "sub-ml-wdp",
    gameSlug: "mobile-legends",
    gameName: "Mobile Legends",
    itemId: "ml-wdp",
    title: "Weekly Diamond Pass",
    categoryLabel: "Membership 7 Hari (220 Dm)",
    price: 30700,
    periodLabel: "/minggu",
    coverImage: "/games/mobile-legends.png",
  },
  {
    id: "sub-gi-welkin",
    gameSlug: "genshin-impact",
    gameName: "Genshin Impact",
    itemId: "gi-welkin",
    title: "Blessing of the Welkin Moon",
    categoryLabel: "300 Crystal + 2.700 Primo",
    price: 75000,
    periodLabel: "/30 hari",
    coverImage: "/games/genshin-impact.png",
  },
  {
    id: "sub-ff-booyah",
    gameSlug: "free-fire",
    gameName: "Free Fire",
    itemId: "ff-booyah",
    title: "Booyah Pass Card",
    categoryLabel: "Season Pass Premium",
    price: 45000,
    periodLabel: "/season",
    coverImage: "/games/free-fire.png",
  },
  {
    id: "sub-hok-weekly",
    gameSlug: "honor-of-kings",
    gameName: "Honor of Kings",
    itemId: "hok-weekly",
    title: "Weekly Card HOK",
    categoryLabel: "80 Tokens Instan + Klaim Harian",
    price: 16000,
    periodLabel: "/minggu",
    coverImage: "/games/honor-of-kings.png",
  },
];

export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "qris",
    name: "QRIS (Semua E-Wallet & M-Banking)",
    category: "QRIS",
    codeLabel: "QRIS",
    flatFee: 0,
    freeForTestProduct: true,
    minAmount: 1000,
    settlementText: "Otomatis 1-3 detik, bebas biaya admin untuk Testing Rp 1.000",
  },
  {
    id: "dana",
    name: "DANA",
    category: "E-Wallet",
    codeLabel: "DANA",
    flatFee: 0,
    freeForTestProduct: true,
    minAmount: 1000,
    settlementText: "Potong saldo DANA instan",
  },
  {
    id: "gopay",
    name: "GoPay",
    category: "E-Wallet",
    codeLabel: "GOPAY",
    flatFee: 500,
    freeForTestProduct: true,
    minAmount: 1000,
    settlementText: "Buka aplikasi Gojek / GoPay otomatis",
  },
  {
    id: "shopeepay",
    name: "ShopeePay",
    category: "E-Wallet",
    codeLabel: "SPAY",
    flatFee: 500,
    freeForTestProduct: true,
    minAmount: 1000,
    settlementText: "Mendukung koin & saldo ShopeePay",
  },
  {
    id: "ovo",
    name: "OVO",
    category: "E-Wallet",
    codeLabel: "OVO",
    flatFee: 500,
    freeForTestProduct: true,
    minAmount: 1000,
    settlementText: "Notifikasi push ke nomor OVO terdaftar",
  },
  {
    id: "bca-va",
    name: "BCA Virtual Account",
    category: "Virtual Account",
    codeLabel: "BCA VA",
    flatFee: 1500,
    freeForTestProduct: false,
    minAmount: 10000,
    settlementText: "Minimal transaksi Rp 10.000",
  },
];
