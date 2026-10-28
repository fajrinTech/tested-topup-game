"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  Compass,
  CreditCard,
  Download,
  Flame,
  Gamepad2,
  Home,
  Moon,
  Monitor,
  Receipt,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  TicketPercent,
  Trash2,
  Zap,
} from "lucide-react";
import {
  GAMES,
  PASS_SUBSCRIPTIONS,
  PAYMENT_METHODS,
  type GameConfig,
} from "@/data/games";
import { STORAGE_KEY, formatIDR, searchOrders, type GuestOrder } from "@/lib/topup";
import { GameCheckoutModal } from "@/components/GameCheckoutModal";
import { InvoiceModal } from "@/components/InvoiceModal";

type ActiveTab = "beranda" | "eksplor" | "riwayat";
type CategoryFilter =
  | "Semua"
  | "MOBA"
  | "Battle Royale"
  | "Action RPG"
  | "Tactical FPS";

export function TopupApp() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("beranda");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("Semua");
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  const [orders, setOrders] = useState<GuestOrder[]>([]);
  const [ordersLoaded, setOrdersLoaded] = useState(false);

  const [checkoutState, setCheckoutState] = useState<{
    game: GameConfig | null;
    initialItemId?: string;
    initialUserId?: string;
    initialZoneId?: string;
    initialServer?: string;
  }>({ game: null });

  const [activeInvoice, setActiveInvoice] = useState<GuestOrder | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalledPwa, setIsInstalledPwa] = useState(false);
  const [showInstallHint, setShowInstallHint] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    const standalone =
      window.matchMedia?.("(display-mode: standalone)")?.matches ||
      (window.navigator as any)?.standalone === true;
    setIsInstalledPwa(Boolean(standalone));

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalledPwa(true);
      setDeferredPrompt(null);
      setShowInstallHint(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallPwaClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      try {
        await deferredPrompt.userChoice;
      } catch {
        // Ignore prompt dismissal.
      }
      setDeferredPrompt(null);
      return;
    }
    setShowInstallHint((prev) => !prev);
  };

  useEffect(() => {
    const loadFromStorage = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setOrders(parsed);
          }
        }
      } catch {
        // Ignore storage access errors in restricted environments.
      } finally {
        setOrdersLoaded(true);
      }
    };
    loadFromStorage();
    window.addEventListener("storage", loadFromStorage);
    window.addEventListener("focus", loadFromStorage);
    return () => {
      window.removeEventListener("storage", loadFromStorage);
      window.removeEventListener("focus", loadFromStorage);
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [darkMode]);

  const saveOrders = (nextOrders: GuestOrder[]) => {
    setOrders(nextOrders);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextOrders));
    } catch {
      // Ignore storage quota errors.
    }
  };

  const handleOpenGame = (
    game: GameConfig,
    options?: {
      itemId?: string;
      userId?: string;
      zoneId?: string;
      server?: string;
    }
  ) => {
    setCheckoutState({
      game,
      initialItemId: options?.itemId,
      initialUserId: options?.userId,
      initialZoneId: options?.zoneId,
      initialServer: options?.server,
    });
  };

  const handleOrderCreated = (order: GuestOrder) => {
    setOrders((prev) => [order, ...prev]);
  };

  const handleRepeatOrder = (order: GuestOrder) => {
    const targetGame = GAMES.find((g) => g.slug === order.gameSlug);
    if (!targetGame) return;
    setActiveInvoice(null);
    handleOpenGame(targetGame, {
      itemId: order.itemId,
      userId: order.rawUserId,
      zoneId: order.rawZoneId,
      server: order.rawServer,
    });
  };

  const handleClearOrders = () => {
    saveOrders([]);
  };

  const filteredGames = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return GAMES.filter((game) => {
      const matchesCategory =
        categoryFilter === "Semua" || game.category === categoryFilter;
      if (!matchesCategory) return false;
      if (!q) return true;
      const inGame =
        game.name.toLowerCase().includes(q) ||
        game.shortName.toLowerCase().includes(q) ||
        game.publisher.toLowerCase().includes(q) ||
        game.currencyName.toLowerCase().includes(q);
      const inItems = game.items.some((i) => i.name.toLowerCase().includes(q));
      return inGame || inItems;
    });
  }, [searchQuery, categoryFilter]);

  const filteredOrders = useMemo(() => {
    return searchOrders(orders, invoiceSearchQuery);
  }, [orders, invoiceSearchQuery]);

  return (
    <div className="min-h-dvh bg-[#F4F5FA] pb-28 text-slate-900 transition-colors dark:bg-[#0B0F19] dark:text-slate-100">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-xs dark:border-slate-800 dark:bg-slate-900/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#5B4DFF] text-sm font-black tracking-tight text-white shadow-xs">
              NX
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
                  NEXATOPUP
                </span>
                <span className="rounded-full bg-emerald-700 px-2 py-0.5 text-[10px] font-bold text-white">
                  TANPA LOGIN
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Top-Up Game Indonesia • Instan 24 Jam
              </p>
            </div>
          </div>

          {/* Desktop Navigation Pills + Region & Theme Toggle */}
          <div className="flex items-center gap-2">
            <nav
              aria-label="Navigasi Utama Desktop"
              className="hidden items-center gap-1 rounded-2xl bg-slate-100 p-1 md:flex dark:bg-slate-800"
            >
              {(
                [
                  { id: "beranda", label: "Beranda", icon: Home },
                  { id: "eksplor", label: "Explore Game", icon: Compass },
                  {
                    id: "riwayat",
                    label: `Cek Pesanan (${orders.length})`,
                    icon: Receipt,
                  },
                ] as const
              ).map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-colors ${
                      active
                        ? "bg-white text-[#5B4DFF] shadow-xs dark:bg-slate-900 dark:text-indigo-400"
                        : "text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <div className="hidden items-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 sm:inline-flex dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200">
              <span>Jakarta, ID</span>
              <span className="text-slate-400">•</span>
              <span className="font-mono text-[#5B4DFF] dark:text-indigo-400">
                IDR
              </span>
            </div>

            {!isInstalledPwa && (
              <button
                type="button"
                onClick={handleInstallPwaClick}
                aria-label="Install Aplikasi NEXATOPUP"
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-2xl bg-[#5B4DFF] px-3 py-2 text-xs font-extrabold text-white shadow-xs hover:bg-[#4B3DE8]"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Install App</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setDarkMode((prev) => !prev)}
              aria-label={darkMode ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
            >
              {darkMode ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
        {showInstallHint && !isInstalledPwa && (
          <div className="border-t border-indigo-100 bg-indigo-50/90 px-4 py-2.5 text-xs text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
              <p>
                <strong>Cara Install di Android Chrome:</strong> Ketuk ikon titik tiga <strong>(⋮)</strong> di pojok kanan atas Chrome, lalu pilih <strong>Install aplikasi</strong> atau <strong>Tambahkan ke layar utama</strong>.
              </p>
              <button
                type="button"
                onClick={() => setShowInstallHint(false)}
                className="min-h-[36px] shrink-0 rounded-xl bg-white px-2.5 py-1 font-bold text-[#5B4DFF] shadow-2xs dark:bg-slate-800 dark:text-indigo-400"
              >
                Mengerti
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Responsive Container */}
      <main className="mx-auto max-w-6xl px-4 pt-4 sm:px-6 sm:pt-6">
        {/* ======================== TAB 1: BERANDA (HOME) ======================== */}
        {activeTab === "beranda" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left Column on Desktop (Hero + Quick Actions + Buy Again) */}
            <div className="space-y-5 lg:col-span-5">
              {/* Search Bar */}
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari Mobile Legends, Free Fire, Welkin, atau Rp 1.000..."
                  aria-label="Cari game atau produk top-up"
                  className="min-h-[48px] w-full rounded-2xl border border-slate-200/90 bg-white pr-4 pl-10 text-sm text-slate-900 shadow-xs placeholder:text-slate-500 focus:border-[#5B4DFF] dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                />
              </div>

              {/* Direct Top-Up Banner (No Wallet Balance / Pure QRIS & ShopeePay) */}
              <section
                aria-label="Informasi Pembayaran Langsung QRIS & ShopeePay"
                className="relative overflow-hidden rounded-3xl bg-[#5B4DFF] p-5 text-white shadow-md"
              >
                <div className="flex items-center justify-between text-xs font-semibold tracking-wider text-indigo-100 uppercase">
                  <span>DIRECT TOP-UP • TANPA LOGIN</span>
                  <span className="font-mono">INSTAN 24 JAM</span>
                </div>

                <h1 className="mt-2 text-xl font-black tracking-tight sm:text-2xl">
                  Top-Up Game Langsung via QRIS & ShopeePay
                </h1>

                <p className="mt-1.5 text-xs text-indigo-100 sm:text-sm">
                  Tanpa deposit saldo dompet dan tanpa registrasi akun. Pilih game, masukkan ID, lalu bayar langsung per transaksi.
                </p>

                {/* Official QRIS & ShopeePay Logo Pills */}
                <div className="mt-3.5 flex flex-wrap items-center gap-2">
                  <div className="inline-flex h-9 items-center gap-2 rounded-xl bg-white px-3 py-1.5 shadow-2xs">
                    <img
                      src="/payments/qris.svg"
                      alt="QRIS"
                      className="h-5 w-auto object-contain"
                    />
                    <span className="text-[11px] font-extrabold text-slate-900">
                      Scan Semua Bank & E-Wallet
                    </span>
                  </div>
                  <div className="inline-flex h-9 items-center gap-2 rounded-xl bg-white px-3 py-1.5 shadow-2xs">
                    <img
                      src="/payments/shopeepay.png"
                      alt="ShopeePay"
                      className="h-5 w-5 rounded-md object-contain"
                    />
                    <span className="text-[11px] font-extrabold text-slate-900">
                      ShopeePay
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleOpenGame(GAMES[0], { itemId: GAMES[0].items[0].id })
                    }
                    className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-full bg-white px-3 py-2 text-xs font-extrabold text-[#5B4DFF] hover:bg-indigo-50"
                  >
                    <Zap className="h-3.5 w-3.5" />
                    Testing Produk
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("eksplor")}
                    className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-3 py-2 text-xs font-bold text-white hover:bg-white/25"
                  >
                    <Compass className="h-3.5 w-3.5" />
                    Pilih Game
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("riwayat")}
                    className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-3 py-2 text-xs font-bold text-white hover:bg-white/25"
                  >
                    <Receipt className="h-3.5 w-3.5" />
                    Riwayat ({orders.length})
                  </button>
                </div>
              </section>

              {/* 5 Circular Quick Category Actions (Matching Reference Phone 1) */}
              <section aria-label="Kategori Cepat">
                <div className="grid grid-cols-5 gap-2">
                  {[
                    {
                      label: "Top-Up",
                      icon: Gamepad2,
                      colorClass:
                        "bg-indigo-50 text-[#5B4DFF] dark:bg-indigo-950/60 dark:text-indigo-300",
                      onClick: () => {
                        setCategoryFilter("Semua");
                        setActiveTab("eksplor");
                      },
                    },
                    {
                      label: "Pass",
                      icon: TicketPercent,
                      colorClass:
                        "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
                      onClick: () => {
                        setActiveTab("eksplor");
                      },
                    },
                    {
                      label: "Rp 1.000",
                      icon: Sparkles,
                      colorClass:
                        "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
                      onClick: () =>
                        handleOpenGame(GAMES[0], { itemId: GAMES[0].items[0].id }),
                    },
                    {
                      label: "PC Game",
                      icon: Monitor,
                      colorClass:
                        "bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300",
                      onClick: () => {
                        const val = GAMES.find((g) => g.slug === "valorant")!;
                        handleOpenGame(val);
                      },
                    },
                    {
                      label: "Cek Struk",
                      icon: Receipt,
                      colorClass:
                        "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300",
                      onClick: () => setActiveTab("riwayat"),
                    },
                  ].map((act) => {
                    const Icon = act.icon;
                    return (
                      <button
                        key={act.label}
                        type="button"
                        onClick={act.onClick}
                        className="flex min-h-[72px] flex-col items-center justify-center gap-1.5 rounded-2xl bg-white p-2 text-center shadow-xs transition-transform active:scale-95 dark:bg-slate-900"
                      >
                        <span
                          className={`flex h-11 w-11 items-center justify-center rounded-full ${act.colorClass}`}
                        >
                          <Icon className="h-5 w-5" />
                        </span>
                        <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                          {act.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Buy Again Section (Matching "Buy again - Repeat your last orders" in Reference Phone 1) */}
              <section aria-labelledby="buy-again-heading">
                <div className="flex items-center justify-between">
                  <div>
                    <h2
                      id="buy-again-heading"
                      className="text-base font-extrabold text-slate-900 dark:text-white"
                    >
                      Beli Lagi (Tanpa Login)
                    </h2>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Ulangi pengisian terakhir yang tersimpan di browser ini
                    </p>
                  </div>
                  {orders.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveTab("riwayat")}
                      className="min-h-[44px] px-2 text-xs font-bold text-[#5B4DFF] hover:underline dark:text-indigo-400"
                    >
                      Lihat semua
                    </button>
                  )}
                </div>

                {!ordersLoaded ? (
                  <div className="mt-3 rounded-2xl bg-white p-4 text-xs text-slate-600 shadow-xs dark:bg-slate-900 dark:text-slate-400">
                    Memuat riwayat transaksi perangkat...
                  </div>
                ) : orders.length === 0 ? (
                  <div className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Belum ada riwayat pembelian di perangkat ini.
                    </p>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                      Coba produk testing <strong>Rp 1.000</strong> tanpa daftar akun untuk melihat fitur pengisian ulang 1-klik di sini.
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        handleOpenGame(GAMES[0], { itemId: GAMES[0].items[0].id })
                      }
                      className="mt-3 inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-indigo-50 px-3.5 py-2 text-xs font-bold text-[#5B4DFF] hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Uji Transaksi Pertama Rp 1.000
                    </button>
                  </div>
                ) : (
                  <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {orders.slice(0, 2).map((ord) => (
                      <div
                        key={ord.invoiceId}
                        className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-xs dark:bg-slate-900"
                      >
                        <img
                          src={ord.coverImage}
                          alt={ord.gameName}
                          className="h-12 w-12 shrink-0 rounded-xl object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="block text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                            TOP-UP ULANG
                          </span>
                          <p className="truncate font-mono text-xs font-bold text-slate-900 dark:text-white">
                            {ord.targetAccount}
                          </p>
                          <p className="truncate text-xs text-slate-600 dark:text-slate-400">
                            {ord.gameName} • {ord.itemName}
                          </p>
                          <button
                            type="button"
                            onClick={() => handleRepeatOrder(ord)}
                            className="mt-1 inline-flex min-h-[44px] items-center gap-1 text-xs font-extrabold text-[#5B4DFF] hover:underline dark:text-indigo-400"
                          >
                            <RotateCcw className="h-3 w-3" />
                            Beli lagi {formatIDR(ord.total)}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* Right Column on Desktop (Trending Games + Quick Catalog + Pass Preview) */}
            <div className="space-y-6 lg:col-span-7">
              {/* Trending Games Section (Matching Reference Phone 1 Bottom + Phone 2 Top Games) */}
              <section aria-labelledby="trending-games-heading">
                <div className="flex items-center justify-between">
                  <div>
                    <h2
                      id="trending-games-heading"
                      className="text-base font-extrabold text-slate-900 sm:text-lg dark:text-white"
                    >
                      Populer di Indonesia
                    </h2>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Semua game mendukung produk testing Rp 1.000 & nominal resmi
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("eksplor")}
                    className="inline-flex min-h-[44px] items-center gap-1 px-2 text-xs font-bold text-[#5B4DFF] hover:underline dark:text-indigo-400"
                  >
                    Lihat semua
                  </button>
                </div>

                {/* Category Filter Pills */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {(
                    [
                      "Semua",
                      "MOBA",
                      "Battle Royale",
                      "Action RPG",
                      "Tactical FPS",
                    ] as const
                  ).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategoryFilter(cat)}
                      className={`min-h-[44px] rounded-xl px-3.5 py-2 text-xs font-bold transition-colors ${
                        categoryFilter === cat
                          ? "bg-[#5B4DFF] text-white"
                          : "bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {filteredGames.length === 0 ? (
                  <div className="mt-4 rounded-2xl bg-white p-6 text-center shadow-xs dark:bg-slate-900">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      Game &ldquo;{searchQuery}&rdquo; tidak ditemukan.
                    </p>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                      Coba kata kunci lain seperti Mobile Legends, Free Fire, PUBG, Genshin, HOK, atau Valorant.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setCategoryFilter("Semua");
                      }}
                      className="mt-3 min-h-[44px] rounded-xl bg-[#5B4DFF] px-4 py-2 text-xs font-bold text-white"
                    >
                      Reset Pencarian
                    </button>
                  </div>
                ) : (
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {filteredGames.map((game) => (
                      <div
                        key={game.slug}
                        className="group flex flex-col overflow-hidden rounded-3xl bg-white p-2.5 shadow-xs transition-shadow hover:shadow-md dark:bg-slate-900"
                      >
                        <button
                          type="button"
                          onClick={() => handleOpenGame(game)}
                          className="relative aspect-square w-full overflow-hidden rounded-2xl text-left"
                        >
                          <img
                            src={game.coverImage}
                            alt={game.name}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />
                          <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-slate-950/80 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-xs">
                            <Flame className="h-3 w-3 text-amber-400" />
                            Instan
                          </span>
                          <div className="absolute right-2.5 bottom-2.5 left-2.5">
                            <p className="text-[10px] font-semibold text-slate-200">
                              {game.publisher}
                            </p>
                            <h3 className="truncate text-sm font-extrabold text-white">
                              {game.shortName}
                            </h3>
                          </div>
                        </button>

                        <div className="mt-2.5 flex items-center justify-between gap-1 px-1">
                          <div>
                            <span className="block text-[10px] font-medium text-slate-600 dark:text-slate-400">
                              {game.currencyName}
                            </span>
                            <span className="tabular-price text-xs font-extrabold text-emerald-700 dark:text-emerald-400">
                              Uji Rp 1.000
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              handleOpenGame(game, { itemId: game.items[0].id })
                            }
                            className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-indigo-50 px-3 py-1.5 text-xs font-extrabold text-[#5B4DFF] hover:bg-[#5B4DFF] hover:text-white dark:bg-indigo-950/70 dark:text-indigo-300"
                          >
                            Top-Up
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Pass & Membership Highlights */}
              <section aria-labelledby="home-subscriptions-heading">
                <div className="flex items-center justify-between">
                  <div>
                    <h2
                      id="home-subscriptions-heading"
                      className="text-base font-extrabold text-slate-900 dark:text-white"
                    >
                      Pass & Membership Resmi
                    </h2>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Weekly Diamond Pass, Welkin Moon, Booyah Pass, & Weekly Card
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("eksplor")}
                    className="min-h-[44px] px-2 text-xs font-bold text-[#5B4DFF] hover:underline dark:text-indigo-400"
                  >
                    Semua
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {PASS_SUBSCRIPTIONS.map((sub) => {
                    const parentGame = GAMES.find(
                      (g) => g.slug === sub.gameSlug
                    )!;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() =>
                          handleOpenGame(parentGame, { itemId: sub.itemId })
                        }
                        className="flex min-h-[68px] items-center justify-between gap-3 rounded-2xl bg-white p-3.5 text-left shadow-xs transition-colors hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/80"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <img
                            src={sub.coverImage}
                            alt={sub.gameName}
                            className="h-11 w-11 shrink-0 rounded-full object-cover"
                          />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-extrabold text-slate-900 dark:text-white">
                              {sub.title}
                            </p>
                            <p className="truncate text-xs text-slate-600 dark:text-slate-400">
                              {sub.gameName} • {sub.categoryLabel}
                            </p>
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <span className="tabular-price block text-xs font-extrabold text-slate-900 sm:text-sm dark:text-white">
                            {formatIDR(sub.price)}
                          </span>
                          <span className="text-[11px] text-slate-600 dark:text-slate-400">
                            {sub.periodLabel}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>
          </div>
        )}

        {/* ======================== TAB 2: EXPLORE (KATALOG & PASS) ======================== */}
        {activeTab === "eksplor" && (
          <div className="mx-auto max-w-3xl space-y-6">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Explore
              </h1>
              <p className="text-xs text-slate-600 sm:text-sm dark:text-slate-400">
                Pilih game populer Indonesia • Semua tersedia Testing Product Rp 1.000
              </p>
            </div>

            {/* Top Games 3x2 Grid (Matching Reference Phone 2) */}
            <section aria-labelledby="explore-top-games">
              <div className="flex items-center justify-between">
                <h2
                  id="explore-top-games"
                  className="text-base font-extrabold text-slate-900 dark:text-white"
                >
                  Top games
                </h2>
                <span className="text-xs font-bold text-[#5B4DFF] dark:text-indigo-400">
                  6 Game Aktif
                </span>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2.5 sm:gap-4">
                {GAMES.map((game) => (
                  <button
                    key={game.slug}
                    type="button"
                    onClick={() => handleOpenGame(game)}
                    className="group relative aspect-square w-full overflow-hidden rounded-3xl bg-slate-900 text-left shadow-xs"
                  >
                    <img
                      src={game.coverImage}
                      alt={game.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/25 to-transparent" />
                    <span className="absolute top-2 right-2 rounded-full bg-emerald-700 px-2 py-0.5 text-[10px] font-bold text-white">
                      Rp 1.000
                    </span>
                    <div className="absolute right-2.5 bottom-2.5 left-2.5">
                      <p className="truncate text-xs font-extrabold text-white sm:text-sm">
                        {game.shortName}
                      </p>
                      <p className="truncate text-[10px] font-medium text-slate-300">
                        {game.currencyName}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Subscriptions List (Matching Reference Phone 2 Bottom) */}
            <section aria-labelledby="explore-subscriptions">
              <div className="flex items-center justify-between">
                <h2
                  id="explore-subscriptions"
                  className="text-base font-extrabold text-slate-900 dark:text-white"
                >
                  Subscriptions & Weekly Pass
                </h2>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Harga Resmi IDR
                </span>
              </div>

              <div className="mt-3 space-y-2.5">
                {PASS_SUBSCRIPTIONS.map((sub) => {
                  const parentGame = GAMES.find(
                    (g) => g.slug === sub.gameSlug
                  )!;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() =>
                        handleOpenGame(parentGame, { itemId: sub.itemId })
                      }
                      className="flex min-h-[68px] w-full items-center justify-between gap-3 rounded-3xl bg-white p-4 text-left shadow-xs transition-colors hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/80"
                    >
                      <div className="flex min-w-0 items-center gap-3.5">
                        <img
                          src={sub.coverImage}
                          alt={sub.gameName}
                          className="h-12 w-12 shrink-0 rounded-full object-cover"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-extrabold text-slate-900 dark:text-white">
                            {sub.title}
                          </p>
                          <p className="truncate text-xs text-slate-600 dark:text-slate-400">
                            {sub.gameName} • {sub.categoryLabel}
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="tabular-price text-xs font-bold text-slate-700 sm:text-sm dark:text-slate-200">
                          mulai {formatIDR(sub.price)}
                          {sub.periodLabel}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Quick Rp 1.000 Test Catalog Table */}
            <section className="rounded-3xl bg-white p-4 shadow-xs sm:p-5 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900 sm:text-base dark:text-white">
                    Daftar Produk Testing Rp 1.000
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Klik salah satu untuk langsung menguji checkout nominal Rp 1.000
                  </p>
                </div>
                <span className="rounded-xl bg-emerald-700 px-2.5 py-1 text-xs font-bold text-white">
                  Aktif
                </span>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {GAMES.map((game) => {
                  const testItem = game.items[0];
                  return (
                    <button
                      key={game.slug}
                      type="button"
                      onClick={() =>
                        handleOpenGame(game, { itemId: testItem.id })
                      }
                      className="flex min-h-[56px] items-center justify-between rounded-2xl border border-slate-200/80 px-3.5 py-2.5 text-left hover:border-[#5B4DFF] dark:border-slate-800"
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={game.coverImage}
                          alt={game.shortName}
                          className="h-9 w-9 rounded-xl object-cover"
                        />
                        <div>
                          <p className="text-xs font-extrabold text-slate-900 dark:text-white">
                            {game.shortName}
                          </p>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400">
                            {testItem.name}
                          </p>
                        </div>
                      </div>
                      <span className="tabular-price text-xs font-extrabold text-emerald-700 dark:text-emerald-400">
                        Rp 1.000
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* ======================== TAB 3: CEK PESANAN & SALURAN PEMBAYARAN ======================== */}
        {activeTab === "riwayat" && (
          <div className="mx-auto max-w-3xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  Cek Pesanan & Pembayaran
                </h1>
                <p className="text-xs text-slate-600 sm:text-sm dark:text-slate-400">
                  Riwayat transaksi Guest otomatis tersimpan di perangkat ini
                </p>
              </div>
              <span className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 font-mono text-xs font-bold text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                IDR
              </span>
            </div>

            {/* Invoice Tracker Card (No Balance / Pure Invoice Lookup) */}
            <section className="rounded-3xl bg-[#5B4DFF] p-5 text-white shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold tracking-wider text-indigo-100 uppercase">
                  LACAK STATUS PESANAN
                </span>
                <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold text-white">
                  {orders.length} Transaksi Tersimpan
                </span>
              </div>

              <h2 className="mt-2 text-xl font-black tracking-tight sm:text-2xl">
                Cek Nomor Invoice & Status Top-Up
              </h2>
              <p className="mt-1 text-xs text-indigo-100">
                Masukkan Nomor Invoice, ID Game, atau Email untuk melihat status pembayaran QRIS maupun ShopeePay.
              </p>

              {/* Invoice Search Input */}
              <div className="mt-4">
                <label
                  htmlFor="invoice-lookup-input"
                  className="mb-1.5 block text-xs font-bold text-indigo-100"
                >
                  Cari Nomor Invoice / ID Akun / Email
                </label>
                <div className="relative">
                  <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    id="invoice-lookup-input"
                    type="search"
                    value={invoiceSearchQuery}
                    onChange={(e) => setInvoiceSearchQuery(e.target.value)}
                    placeholder="Contoh: INV-2026-... atau 128492018"
                    className="min-h-[44px] w-full rounded-2xl bg-white pr-4 pl-10 font-mono text-xs text-slate-900 placeholder:font-sans placeholder:text-slate-500"
                  />
                </div>
              </div>
            </section>

            {/* Supported Official Payment Channels (Strictly QRIS & ShopeePay with Real Logos) */}
            <section aria-labelledby="payment-channels-heading">
              <div className="flex items-center justify-between">
                <h2
                  id="payment-channels-heading"
                  className="text-sm font-extrabold text-slate-900 sm:text-base dark:text-white"
                >
                  Metode Pembayaran Resmi
                </h2>
                <span className="text-xs font-bold text-[#5B4DFF] dark:text-indigo-400">
                  QRIS & ShopeePay
                </span>
              </div>

              <div className="mt-3 space-y-2.5">
                {PAYMENT_METHODS.map((pm, idx) => (
                  <div
                    key={pm.id}
                    className="flex items-center justify-between rounded-3xl bg-white p-4 shadow-xs dark:bg-slate-900"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="flex h-12 w-14 shrink-0 items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-2xs">
                        <img
                          src={pm.logoImage}
                          alt={pm.name}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                          {pm.name}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {pm.settlementText}
                        </p>
                      </div>
                    </div>
                    {idx === 0 ? (
                      <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-[#5B4DFF] dark:bg-indigo-950 dark:text-indigo-300">
                        Scan Instan
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Aktif
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Recent Activity List (Matching "Recent activity" in Reference Phone 3) */}
            <section aria-labelledby="recent-activity-heading">
              <div className="flex items-center justify-between">
                <h2
                  id="recent-activity-heading"
                  className="text-sm font-extrabold text-slate-900 sm:text-base dark:text-white"
                >
                  Recent activity (Riwayat Transaksi)
                </h2>
                {orders.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearOrders}
                    className="inline-flex min-h-[44px] items-center gap-1 px-2 text-xs font-bold text-red-700 hover:underline dark:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Bersihkan Riwayat
                  </button>
                )}
              </div>

              {filteredOrders.length === 0 ? (
                <div className="mt-3 rounded-3xl bg-white p-6 text-center shadow-xs dark:bg-slate-900">
                  <CreditCard className="mx-auto h-8 w-8 text-slate-400" />
                  <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
                    {invoiceSearchQuery
                      ? `Tidak ada pesanan dengan kata kunci "${invoiceSearchQuery}".`
                      : "Belum ada aktivitas transaksi pada perangkat ini."}
                  </p>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                    Lakukan uji coba top-up produk Rp 1.000 untuk melihat bukti invoice otomatis di sini.
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      handleOpenGame(GAMES[0], { itemId: GAMES[0].items[0].id })
                    }
                    className="mt-4 inline-flex min-h-[44px] items-center gap-1.5 rounded-2xl bg-[#5B4DFF] px-4 py-2 text-xs font-extrabold text-white"
                  >
                    <Zap className="h-4 w-4" />
                    Coba Produk Testing Rp 1.000
                  </button>
                </div>
              ) : (
                <div className="mt-3 divide-y divide-slate-100 overflow-hidden rounded-3xl bg-white shadow-xs dark:divide-slate-800 dark:bg-slate-900">
                  {filteredOrders.map((ord) => (
                    <button
                      key={ord.invoiceId}
                      type="button"
                      onClick={() => setActiveInvoice(ord)}
                      className="flex min-h-[68px] w-full items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/70"
                    >
                      <div className="flex min-w-0 items-center gap-3.5">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                          <ArrowUpRight className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-extrabold text-slate-900 dark:text-white">
                            {ord.gameName} • {ord.itemName}
                          </p>
                          <p className="truncate font-mono text-xs text-slate-600 dark:text-slate-400">
                            {ord.invoiceId} • {ord.targetAccount} • {ord.status}
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="tabular-price block text-sm font-extrabold text-slate-900 dark:text-white">
                          {formatIDR(ord.total)}
                        </span>
                        <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                          Lihat Struk
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      {/* Floating Bottom Navigation Bar for Mobile & Tablet (Matching Reference Image) */}
      <nav
        aria-label="Navigasi Bawah Mobile"
        className="fixed right-0 bottom-3 left-0 z-40 mx-auto max-w-md px-4 md:hidden"
      >
        <div className="grid grid-cols-4 items-center gap-1 rounded-full border border-slate-200/90 bg-white/95 p-1.5 shadow-xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
          <button
            type="button"
            onClick={() => setActiveTab("beranda")}
            className={`flex min-h-[44px] flex-col items-center justify-center rounded-full py-1 text-[11px] font-bold transition-colors ${
              activeTab === "beranda"
                ? "bg-indigo-50 text-[#5B4DFF] dark:bg-indigo-950 dark:text-indigo-300"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            <Home className="h-4 w-4" />
            <span>Beranda</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("eksplor")}
            className={`flex min-h-[44px] flex-col items-center justify-center rounded-full py-1 text-[11px] font-bold transition-colors ${
              activeTab === "eksplor"
                ? "bg-indigo-50 text-[#5B4DFF] dark:bg-indigo-950 dark:text-indigo-300"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            <Compass className="h-4 w-4" />
            <span>Explore</span>
          </button>

          <button
            type="button"
            onClick={() =>
              handleOpenGame(GAMES[0], { itemId: GAMES[0].items[0].id })
            }
            className="flex min-h-[44px] flex-col items-center justify-center rounded-full py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Uji Rp 1rb</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("riwayat")}
            className={`flex min-h-[44px] flex-col items-center justify-center rounded-full py-1 text-[11px] font-bold transition-colors ${
              activeTab === "riwayat"
                ? "bg-indigo-50 text-[#5B4DFF] dark:bg-indigo-950 dark:text-indigo-300"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            <Receipt className="h-4 w-4" />
            <span>Struk ({orders.length})</span>
          </button>
        </div>
      </nav>

      {/* Modals */}
      <GameCheckoutModal
        game={checkoutState.game}
        initialItemId={checkoutState.initialItemId}
        initialUserId={checkoutState.initialUserId}
        initialZoneId={checkoutState.initialZoneId}
        initialServer={checkoutState.initialServer}
        onClose={() => setCheckoutState({ game: null })}
        onOrderCreated={handleOrderCreated}
      />

      <InvoiceModal
        order={activeInvoice}
        onClose={() => setActiveInvoice(null)}
        onRepeatOrder={handleRepeatOrder}
      />
    </div>
  );
}
