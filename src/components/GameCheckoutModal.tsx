"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  QrCode,
  ShieldCheck,
  Sparkles,
  UserCheck,
  X,
} from "lucide-react";
import {
  PAYMENT_METHODS,
  type GameConfig,
  type PaymentMethod,
  type TopupItem,
} from "@/data/games";
import {
  calculateCheckoutTotal,
  createGuestOrder,
  formatIDR,
  simulateAccountNickname,
  validateAccountInput,
  type GuestOrder,
} from "@/lib/topup";

interface GameCheckoutModalProps {
  game: GameConfig | null;
  initialItemId?: string;
  initialUserId?: string;
  initialZoneId?: string;
  initialServer?: string;
  onClose: () => void;
  onOrderSuccess: (order: GuestOrder) => void;
}

export function GameCheckoutModal({
  game,
  initialItemId,
  initialUserId = "",
  initialZoneId = "",
  initialServer = "",
  onClose,
  onOrderSuccess,
}: GameCheckoutModalProps) {
  const [userId, setUserId] = useState(initialUserId);
  const [zoneId, setZoneId] = useState(initialZoneId);
  const [server, setServer] = useState(initialServer || "Asia");
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [selectedPaymentId, setSelectedPaymentId] = useState<string>("qris");
  const [whatsapp, setWhatsapp] = useState("");
  const [itemFilter, setItemFilter] = useState<"all" | "pass" | "regular">("all");

  const [checkingNickname, setCheckingNickname] = useState(false);
  const [verifiedNickname, setVerifiedNickname] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [paymentStep, setPaymentStep] = useState<"form" | "qris_pay">("form");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!game) return;
    setUserId(initialUserId);
    setZoneId(initialZoneId);
    setServer(initialServer || game.servers?.[0] || "Asia");
    const defaultItem =
      game.items.find((i) => i.id === initialItemId) || game.items[0];
    setSelectedItemId(defaultItem.id);
    setSelectedPaymentId("qris");
    setVerifiedNickname(null);
    setValidationError(null);
    setPaymentStep("form");
  }, [game, initialItemId, initialUserId, initialZoneId, initialServer]);

  useEffect(() => {
    if (!game) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [game, onClose]);

  const selectedItem: TopupItem | undefined = useMemo(() => {
    if (!game) return undefined;
    return game.items.find((i) => i.id === selectedItemId) || game.items[0];
  }, [game, selectedItemId]);

  const selectedPayment: PaymentMethod = useMemo(() => {
    return (
      PAYMENT_METHODS.find((p) => p.id === selectedPaymentId) ||
      PAYMENT_METHODS[0]
    );
  }, [selectedPaymentId]);

  if (!game || !selectedItem) return null;

  const testProduct = game.items.find((i) => i.isTestProduct) || game.items[0];
  const filteredRegularOrPass = game.items.filter((i) => {
    if (i.isTestProduct) return false;
    if (itemFilter === "all") return true;
    return i.category === itemFilter;
  });

  const totals = calculateCheckoutTotal(selectedItem, selectedPayment);

  const handleFillSampleAccount = () => {
    setValidationError(null);
    if (game.accountMode === "mlbb_zone") {
      setUserId("128492018");
      setZoneId("2641");
      setVerifiedNickname("GarudaID_018");
    } else if (game.accountMode === "uid_server") {
      setUserId("812940192");
      setServer("Asia");
      setVerifiedNickname("Traveler_192");
    } else if (game.accountMode === "riot_tag") {
      setUserId("GarudaAce#IDN");
      setVerifiedNickname("GarudaAce");
    } else {
      setUserId("582910442");
      setVerifiedNickname("NusantaraPro_442");
    }
  };

  const handleCheckNickname = () => {
    const res = validateAccountInput(game, { userId, zoneId, server });
    if (!res.valid) {
      setVerifiedNickname(null);
      setValidationError(res.error || "Data akun belum lengkap.");
      return;
    }
    setValidationError(null);
    setCheckingNickname(true);
    setTimeout(() => {
      setCheckingNickname(false);
      setVerifiedNickname(simulateAccountNickname(game, userId));
    }, 220);
  };

  const handleProceedToPay = (e: React.FormEvent) => {
    e.preventDefault();
    const res = validateAccountInput(game, { userId, zoneId, server });
    if (!res.valid) {
      setValidationError(res.error || "Masukkan ID akun game yang valid.");
      return;
    }
    if (selectedItem.price < selectedPayment.minAmount) {
      setValidationError(
        `Metode ${selectedPayment.name} memiliki minimal transaksi ${formatIDR(
          selectedPayment.minAmount
        )}. Gunakan QRIS atau E-Wallet untuk nominal Rp 1.000.`
      );
      return;
    }
    setValidationError(null);
    if (!verifiedNickname) {
      setVerifiedNickname(simulateAccountNickname(game, userId));
    }
    setPaymentStep("qris_pay");
  };

  const handleConfirmSimulatedPayment = () => {
    const res = validateAccountInput(game, { userId, zoneId, server });
    if (!res.valid || !res.formattedTarget) return;
    setIsSubmitting(true);
    setTimeout(() => {
      const order = createGuestOrder({
        game,
        item: selectedItem,
        payment: selectedPayment,
        targetAccount: res.formattedTarget!,
        rawUserId: userId.trim(),
        rawZoneId: zoneId.trim() || undefined,
        rawServer: server || undefined,
        nickname: verifiedNickname || simulateAccountNickname(game, userId),
        whatsapp,
      });
      setIsSubmitting(false);
      onOrderSuccess(order);
    }, 250);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-modal-title"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-[#F4F5FA] text-slate-900 shadow-2xl sm:rounded-3xl dark:bg-slate-950 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200/80 bg-white px-4 py-3.5 sm:px-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <img
              src={game.coverImage}
              alt={game.name}
              className="h-11 w-11 rounded-2xl object-cover shadow-xs"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="checkout-modal-title"
                  className="text-base font-extrabold text-slate-900 sm:text-lg dark:text-white"
                >
                  {game.shortName}
                </h2>
                <span className="rounded-full bg-emerald-700 px-2 py-0.5 text-[11px] font-semibold text-white">
                  Instan
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {game.publisher} • Top-Up {game.currencyName} Tanpa Login
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup form top-up"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {paymentStep === "form" ? (
          <form
            onSubmit={handleProceedToPay}
            className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6"
          >
            {/* Step 1: Account Input */}
            <section className="rounded-2xl bg-white p-4 shadow-xs dark:bg-slate-900">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#5B4DFF] text-xs font-bold text-white">
                    1
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Masukkan Data Akun Game
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleFillSampleAccount}
                  className="min-h-[44px] rounded-xl px-2.5 text-xs font-semibold text-[#5B4DFF] hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-slate-800"
                >
                  Isi ID Contoh Testing
                </button>
              </div>

              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                {game.accountHint}
              </p>

              <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                <div
                  className={
                    game.accountMode === "mlbb_zone" ||
                    game.accountMode === "uid_server"
                      ? "sm:col-span-2"
                      : "sm:col-span-3"
                  }
                >
                  <label
                    htmlFor="account-user-id"
                    className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    {game.accountMode === "riot_tag"
                      ? "Riot ID (Nickname#TAG)"
                      : game.accountMode === "uid_server"
                      ? "UID Genshin Impact"
                      : "User ID / Player ID"}
                  </label>
                  <input
                    id="account-user-id"
                    type="text"
                    value={userId}
                    onChange={(e) => {
                      setUserId(e.target.value);
                      setVerifiedNickname(null);
                      setValidationError(null);
                    }}
                    placeholder={game.accountPlaceholder}
                    className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 font-mono text-sm text-slate-900 placeholder:font-sans placeholder:text-slate-400 focus:border-[#5B4DFF] dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>

                {game.accountMode === "mlbb_zone" && (
                  <div>
                    <label
                      htmlFor="account-zone-id"
                      className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                      Zone ID
                    </label>
                    <input
                      id="account-zone-id"
                      type="text"
                      value={zoneId}
                      onChange={(e) => {
                        setZoneId(e.target.value);
                        setVerifiedNickname(null);
                        setValidationError(null);
                      }}
                      placeholder={game.zonePlaceholder || "2641"}
                      className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 font-mono text-sm text-slate-900 placeholder:font-sans placeholder:text-slate-400 focus:border-[#5B4DFF] dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                  </div>
                )}

                {game.accountMode === "uid_server" && (
                  <div>
                    <label
                      htmlFor="account-server"
                      className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                      Server
                    </label>
                    <select
                      id="account-server"
                      value={server}
                      onChange={(e) => {
                        setServer(e.target.value);
                        setVerifiedNickname(null);
                      }}
                      className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#5B4DFF] dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    >
                      {(game.servers || ["Asia"]).map((srv) => (
                        <option key={srv} value={srv}>
                          {srv}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleCheckNickname}
                  disabled={checkingNickname}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-800 hover:bg-slate-100 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  {checkingNickname ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-[#5B4DFF]" />
                      Mengecek Server...
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-4 w-4 text-[#5B4DFF]" />
                      Cek Nickname Akun
                    </>
                  )}
                </button>

                {verifiedNickname && (
                  <div className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Nickname: <span className="font-mono">{verifiedNickname}</span>
                  </div>
                )}
              </div>

              {validationError && (
                <div
                  role="alert"
                  className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-800 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-300"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                  <span>{validationError}</span>
                </div>
              )}
            </section>

            {/* Step 2: Select Nominal (Testing Rp 1.000 + Real Denominations) */}
            <section className="rounded-2xl bg-white p-4 shadow-xs dark:bg-slate-900">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#5B4DFF] text-xs font-bold text-white">
                    2
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Pilih Nominal {game.currencyName}
                  </h3>
                </div>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Harga sudah termasuk PPN
                </span>
              </div>

              {/* Mandatory Rp 1.000 Testing Product Card */}
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setSelectedItemId(testProduct.id)}
                  className={`flex min-h-[56px] w-full items-center justify-between gap-3 rounded-2xl border-2 p-3.5 text-left transition-colors ${
                    selectedItem.id === testProduct.id
                      ? "border-[#5B4DFF] bg-indigo-50/70 dark:border-indigo-400 dark:bg-indigo-950/40"
                      : "border-emerald-600/40 bg-emerald-50/50 hover:border-emerald-600 dark:border-emerald-700/60 dark:bg-emerald-950/20"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-700 px-2 py-0.5 text-[11px] font-bold text-white">
                        <Sparkles className="h-3 w-3" />
                        PRODUK TESTING
                      </span>
                      <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                        {testProduct.name}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                      {testProduct.subLabel}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="tabular-price block text-base font-extrabold text-emerald-800 dark:text-emerald-300">
                      {formatIDR(testProduct.price)}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                      Bebas Admin QRIS
                    </span>
                  </div>
                </button>
              </div>

              {/* Category Filter Tabs */}
              <div className="mt-3 flex gap-2">
                {(
                  [
                    { key: "all", label: "Semua Nominal" },
                    { key: "pass", label: "Pass & Membership" },
                    { key: "regular", label: `Top-Up ${game.currencyName}` },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setItemFilter(tab.key)}
                    className={`min-h-[44px] rounded-xl px-3.5 py-2 text-xs font-bold transition-colors ${
                      itemFilter === tab.key
                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Nominal Grid */}
              <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {filteredRegularOrPass.map((item) => {
                  const active = selectedItem.id === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedItemId(item.id)}
                      className={`relative flex min-h-[84px] flex-col justify-between rounded-2xl border p-3 text-left transition-colors ${
                        active
                          ? "border-2 border-[#5B4DFF] bg-indigo-50/60 dark:border-indigo-400 dark:bg-indigo-950/40"
                          : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950"
                      }`}
                    >
                      <div>
                        {item.badge && (
                          <span className="mb-1 inline-block rounded-md bg-indigo-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                            {item.badge}
                          </span>
                        )}
                        <p className="text-xs font-bold text-slate-900 sm:text-sm dark:text-white">
                          {item.name}
                        </p>
                        <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-600 dark:text-slate-400">
                          {item.subLabel}
                        </p>
                      </div>
                      <div className="mt-2 flex items-baseline justify-between gap-1">
                        <span className="tabular-price text-sm font-extrabold text-[#5B4DFF] dark:text-indigo-400">
                          {formatIDR(item.price)}
                        </span>
                        {item.originalPrice && (
                          <span className="tabular-price text-[11px] text-slate-500 line-through">
                            {formatIDR(item.originalPrice)}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Step 3: Payment Methods */}
            <section className="rounded-2xl bg-white p-4 shadow-xs dark:bg-slate-900">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#5B4DFF] text-xs font-bold text-white">
                  3
                </span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Pilih Metode Pembayaran
                </h3>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {PAYMENT_METHODS.map((method) => {
                  const disabled = selectedItem.price < method.minAmount;
                  const active = selectedPayment.id === method.id;
                  const calc = calculateCheckoutTotal(selectedItem, method);
                  return (
                    <button
                      key={method.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => setSelectedPaymentId(method.id)}
                      className={`flex min-h-[60px] items-center justify-between rounded-2xl border p-3 text-left transition-colors ${
                        disabled
                          ? "cursor-not-allowed border-slate-200 bg-slate-100/70 opacity-60 dark:border-slate-800 dark:bg-slate-900"
                          : active
                          ? "border-2 border-[#5B4DFF] bg-indigo-50/60 dark:border-indigo-400 dark:bg-indigo-950/40"
                          : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950"
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="rounded-lg bg-slate-900 px-2 py-0.5 font-mono text-[11px] font-bold text-white dark:bg-slate-800">
                            {method.codeLabel}
                          </span>
                          <span className="truncate text-xs font-bold text-slate-900 sm:text-sm dark:text-white">
                            {method.name}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-[11px] text-slate-600 dark:text-slate-400">
                          {disabled
                            ? `Min. transaksi ${formatIDR(method.minAmount)}`
                            : method.settlementText}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="tabular-price block text-xs font-extrabold text-slate-900 sm:text-sm dark:text-white">
                          {formatIDR(calc.total)}
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                          {calc.fee === 0
                            ? "Bebas Admin"
                            : `+Admin ${formatIDR(calc.fee)}`}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Step 4: Optional WhatsApp Receipt */}
            <section className="rounded-2xl bg-white p-4 shadow-xs dark:bg-slate-900">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#5B4DFF] text-xs font-bold text-white">
                  4
                </span>
                <label
                  htmlFor="checkout-whatsapp"
                  className="text-sm font-bold text-slate-900 dark:text-white"
                >
                  Nomor WhatsApp (Opsional)
                </label>
              </div>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                Digunakan untuk mencari riwayat pesanan atau menerima bukti struk. Tidak perlu registrasi akun.
              </p>
              <input
                id="checkout-whatsapp"
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="Contoh: 081234567890"
                className="mt-2.5 min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 font-mono text-sm text-slate-900 placeholder:font-sans placeholder:text-slate-400 focus:border-[#5B4DFF] dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </section>

            {/* Sticky Submit Footer */}
            <div className="sticky bottom-0 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
              <div>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {selectedItem.name} • {selectedPayment.codeLabel}
                </p>
                <p className="tabular-price text-lg font-extrabold text-slate-900 dark:text-white">
                  {formatIDR(totals.total)}
                </p>
              </div>
              <button
                type="submit"
                className="inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-[#5B4DFF] px-5 py-2.5 text-sm font-extrabold text-white shadow-sm hover:bg-[#4B3DE8]"
              >
                Bayar Sekarang
              </button>
            </div>
          </form>
        ) : (
          /* Simulated QRIS / Payment Confirmation View */
          <div className="flex-1 space-y-4 overflow-y-auto p-5 sm:p-6">
            <div className="rounded-2xl bg-white p-5 text-center shadow-xs dark:bg-slate-900">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-[#5B4DFF] dark:bg-indigo-950 dark:text-indigo-300">
                <QrCode className="h-4 w-4" />
                Simulasi Pembayaran {selectedPayment.codeLabel}
              </span>
              <h3 className="mt-2 text-lg font-extrabold text-slate-900 dark:text-white">
                Total Bayar:{" "}
                <span className="tabular-price text-[#5B4DFF] dark:text-indigo-400">
                  {formatIDR(totals.total)}
                </span>
              </h3>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                Item: <strong>{selectedItem.name}</strong> ke akun{" "}
                <code className="font-mono font-bold">{userId}</code> (
                {verifiedNickname})
              </p>

              <div className="mx-auto my-4 flex h-44 w-44 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
                <QrCode className="h-24 w-24 text-slate-800 dark:text-slate-200" />
                <span className="mt-2 font-mono text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  NMID: ID2026NEXATOPUP
                </span>
              </div>

              <div className="rounded-xl bg-emerald-50 p-3 text-left text-xs text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200">
                <p className="font-bold">Mode Sandbox / Testing Aktif:</p>
                <p className="mt-0.5">
                  Klik tombol di bawah untuk mensimulasikan callback pembayaran berhasil dan langsung menerbitkan Invoice.
                </p>
              </div>

              <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setPaymentStep("form")}
                  className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  Ubah Data / Nominal
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleConfirmSimulatedPayment}
                  className="inline-flex min-h-[48px] flex-2 items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-2.5 text-sm font-extrabold text-white hover:bg-emerald-800 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Memproses Top-Up...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-5 w-5" />
                      Simulasikan Pembayaran Berhasil ({formatIDR(totals.total)})
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
