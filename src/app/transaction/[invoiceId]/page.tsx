"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Info,
  Loader2,
  QrCode,
  Radio,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import {
  STORAGE_KEY,
  formatIDR,
  markOrderPaid,
  type GuestOrder,
} from "@/lib/topup";

export default function TransactionDetailPage() {
  const params = useParams<{ invoiceId: string }>();
  const invoiceId = params?.invoiceId || "";

  const [order, setOrder] = useState<GuestOrder | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [validatingPayment, setValidatingPayment] = useState(false);
  const [countdownSec, setCountdownSec] = useState(900);

  const syncOrderFromStorageAndServer = useCallback(async () => {
    if (!invoiceId) return;

    let localFound: GuestOrder | null = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const list: GuestOrder[] = JSON.parse(raw);
        localFound = list.find((o) => o.invoiceId === invoiceId) || null;
      }
    } catch {
      // Ignore storage read errors.
    }

    try {
      const res = await fetch(
        `/api/transactions?invoiceId=${encodeURIComponent(invoiceId)}`,
        { cache: "no-store" }
      );
      if (res.ok) {
        const data = await res.json();
        const serverOrder: GuestOrder | null = data?.order || null;
        if (
          serverOrder &&
          serverOrder.status === "Completed" &&
          localFound &&
          localFound.status !== "Completed"
        ) {
          const raw = localStorage.getItem(STORAGE_KEY);
          const list: GuestOrder[] = raw ? JSON.parse(raw) : [];
          const updatedList = markOrderPaid(list, invoiceId);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
          localFound =
            updatedList.find((o) => o.invoiceId === invoiceId) || serverOrder;
        } else if (!localFound && serverOrder) {
          localFound = serverOrder;
        }
      }
    } catch {
      // Ignore network polling errors.
    }

    setOrder((prev) => {
      if (
        prev &&
        prev.status === "Pending" &&
        localFound &&
        localFound.status === "Completed"
      ) {
        setValidatingPayment(true);
        setTimeout(() => setValidatingPayment(false), 700);
      }
      return localFound;
    });
    setLoaded(true);
  }, [invoiceId]);

  useEffect(() => {
    syncOrderFromStorageAndServer();

    const interval = setInterval(() => {
      syncOrderFromStorageAndServer();
    }, 1200);

    const handleStorageOrFocus = () => {
      syncOrderFromStorageAndServer();
    };

    window.addEventListener("storage", handleStorageOrFocus);
    window.addEventListener("focus", handleStorageOrFocus);
    document.addEventListener("visibilitychange", handleStorageOrFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", handleStorageOrFocus);
      window.removeEventListener("focus", handleStorageOrFocus);
      document.removeEventListener("visibilitychange", handleStorageOrFocus);
    };
  }, [syncOrderFromStorageAndServer]);

  useEffect(() => {
    if (!order || order.status === "Completed") return;
    const timer = setInterval(() => {
      setCountdownSec((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [order]);

  const handleCopyInvoice = async () => {
    if (!order) return;
    try {
      await navigator.clipboard.writeText(order.invoiceId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const handleTriggerQrisWebhook = async () => {
    if (!order) return;
    setValidatingPayment(true);
    setTimeout(async () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const list: GuestOrder[] = raw ? JSON.parse(raw) : [];
        const updatedList = markOrderPaid(list, order.invoiceId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
        const found = updatedList.find((o) => o.invoiceId === order.invoiceId);
        if (found) setOrder(found);
      } catch {
        // Ignore storage write errors.
      }
      await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_paid", invoiceId: order.invoiceId }),
      }).catch(() => {});
      setValidatingPayment(false);
    }, 650);
  };

  const minutes = String(Math.floor(countdownSec / 60)).padStart(2, "0");
  const seconds = String(countdownSec % 60).padStart(2, "0");

  if (!loaded) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-[#F4F5FA] p-6 text-slate-900 dark:bg-[#0B0F19] dark:text-slate-100">
        <Loader2 className="h-8 w-8 animate-spin text-[#5B4DFF]" />
        <p className="mt-3 text-sm font-bold">Memuat Halaman Transaksi...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-[#F4F5FA] p-6 text-center text-slate-900 dark:bg-[#0B0F19] dark:text-slate-100">
        <div className="max-w-md rounded-3xl bg-white p-6 shadow-sm dark:bg-slate-900">
          <AlertTriangle className="mx-auto h-10 w-10 text-amber-500" />
          <h1 className="mt-3 text-lg font-extrabold">
            Transaksi Tidak Ditemukan
          </h1>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            Nomor invoice <code className="font-mono font-bold">{invoiceId}</code> tidak ditemukan pada penyimpanan perangkat ini.
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl bg-[#5B4DFF] px-5 py-2.5 text-xs font-extrabold text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Beranda Top-Up
          </Link>
        </div>
      </div>
    );
  }

  const isCompleted = order.status === "Completed";
  const isQris = order.paymentId === "qris";
  const isShopeePay = order.paymentId === "shopeepay";

  return (
    <div className="min-h-dvh bg-[#F4F5FA] pb-16 text-slate-900 dark:bg-[#0B0F19] dark:text-slate-100">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-xs dark:border-slate-800 dark:bg-slate-900/95">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl px-2.5 text-xs font-extrabold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Katalog
          </Link>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-400">
              {order.invoiceId}
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold text-white ${
                isCompleted ? "bg-emerald-700" : "bg-amber-600"
              }`}
            >
              {isCompleted ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Lunas & Terkirim
                </>
              ) : (
                <>
                  <Clock className="h-3.5 w-3.5" />
                  Menunggu Pembayaran
                </>
              )}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-5 px-4 pt-5 sm:px-6">
        {/* Validation Transition Overlay */}
        {validatingPayment && (
          <div
            role="status"
            aria-live="assertive"
            className="flex items-center justify-center gap-3 rounded-3xl bg-emerald-700 p-4 text-white shadow-lg"
          >
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm font-extrabold">
              Pembayaran Terdeteksi! Mengirim {order.itemName} ke Akun {order.targetAccount}...
            </span>
          </div>
        )}

        {/* ======================== STATE A: COMPLETED ("BUM! SUKSES") ======================== */}
        {isCompleted ? (
          <section className="overflow-hidden rounded-3xl border-2 border-emerald-600/30 bg-white p-5 shadow-md sm:p-6 dark:bg-slate-900">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-700 text-white shadow-md">
                <CheckCircle2 className="h-9 w-9" />
              </div>
              <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
                <Sparkles className="h-3.5 w-3.5" />
                PEMBAYARAN TERVERIFIKASI OTOMATIS
              </span>
              <h1 className="mt-2 text-xl font-black text-slate-900 sm:text-2xl dark:text-white">
                Top-Up Berhasil Dikirim!
              </h1>
              <p className="mt-1 max-w-md text-xs text-slate-600 sm:text-sm dark:text-slate-400">
                Produk <strong>{order.itemName}</strong> telah masuk secara instan ke akun{" "}
                <strong>{order.gameName}</strong> (<code className="font-mono font-bold">{order.targetAccount}</code>).
              </p>
            </div>

            <div className="mt-6 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-700">
                <div>
                  <span className="block text-[11px] font-semibold text-slate-500 uppercase">
                    Nomor Invoice Resmi
                  </span>
                  <code className="font-mono text-sm font-extrabold text-slate-900 dark:text-white">
                    {order.invoiceId}
                  </code>
                </div>
                <button
                  type="button"
                  onClick={handleCopyInvoice}
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      Tersalin
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Salin Invoice
                    </>
                  )}
                </button>
              </div>

              <dl className="mt-3 space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-600 dark:text-slate-400">Game</dt>
                  <dd className="font-bold text-slate-900 dark:text-white">
                    {order.gameName}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-600 dark:text-slate-400">Produk</dt>
                  <dd className="font-bold text-slate-900 dark:text-white">
                    {order.itemName}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-600 dark:text-slate-400">ID Tujuan & Nickname</dt>
                  <dd className="font-mono font-bold text-slate-900 dark:text-white">
                    {order.targetAccount} ({order.nickname})
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-600 dark:text-slate-400">Metode Pembayaran</dt>
                  <dd className="font-bold text-slate-900 dark:text-white">
                    {order.paymentName}
                  </dd>
                </div>
                {order.email && (
                  <div className="flex justify-between">
                    <dt className="text-slate-600 dark:text-slate-400">Email Bukti</dt>
                    <dd className="font-mono text-slate-800 dark:text-slate-200">
                      {order.email}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-extrabold sm:text-base dark:border-slate-700">
                  <span>Total Dibayar</span>
                  <span className="tabular-price text-emerald-700 dark:text-emerald-400">
                    {formatIDR(order.total)}
                  </span>
                </div>
              </dl>
            </div>

            <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
              <Link
                href="/"
                className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-2xl bg-[#5B4DFF] px-5 py-3 text-sm font-extrabold text-white hover:bg-[#4B3DE8]"
              >
                Top-Up Lagi / Kembali ke Beranda
              </Link>
            </div>
          </section>
        ) : (
          /* ======================== STATE B: PENDING (WAITING FOR PAYMENT) ======================== */
          <>
            {/* Status Banner with Countdown & Real-Time Polling Indicator */}
            <section className="rounded-3xl bg-[#5B4DFF] p-5 text-white shadow-md">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold">
                  <Radio className="h-3.5 w-3.5 animate-pulse text-emerald-300" />
                  <span>Menunggu Pembayaran Masuk (Real-Time)</span>
                </div>
                <div className="font-mono text-xs font-bold text-indigo-100">
                  Batas Waktu: {minutes}:{seconds}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <p className="text-xs text-indigo-100">Total yang Harus Dibayar</p>
                  <p className="tabular-price text-3xl font-black tracking-tight sm:text-4xl">
                    {formatIDR(order.total)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="block text-xs text-indigo-100">Saluran Pembayaran</span>
                  <span className="text-sm font-extrabold">{order.paymentName}</span>
                </div>
              </div>
            </section>

            {/* Payment Action Area: QRIS vs ShopeePay / DANA */}
            {isQris ? (
              /* ---------------- FLOW 1: QRIS SCAN & AUTO-WAIT ---------------- */
              <section className="rounded-3xl bg-white p-5 shadow-xs sm:p-6 dark:bg-slate-900">
                <div className="flex flex-col items-center text-center">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-extrabold text-[#5B4DFF] dark:bg-indigo-950 dark:text-indigo-300">
                    <QrCode className="h-4 w-4" />
                    SCAN KODE QRIS NASIONAL
                  </span>
                  <h2 className="mt-2 text-lg font-extrabold text-slate-900 dark:text-white">
                    Scan QR untuk Membayar {formatIDR(order.total)}
                  </h2>
                  <p className="mt-1 max-w-md text-xs text-slate-600 dark:text-slate-400">
                    Buka aplikasi M-Banking (BCA, BRI, Mandiri, BNI) atau E-Wallet (GoPay, OVO, DANA, ShopeePay), lalu scan kode QRIS di bawah ini.
                  </p>

                  {/* QRIS Graphic Box */}
                  <div className="my-5 flex flex-col items-center rounded-3xl border-2 border-slate-200 bg-white p-5 shadow-xs dark:border-slate-700 dark:bg-slate-950">
                    <div className="mb-2 flex w-full items-center justify-between text-[11px] font-extrabold text-slate-700 dark:text-slate-300">
                      <span>QRIS STANDAR PEMBAYARAN NASIONAL</span>
                      <span className="font-mono text-[#5B4DFF]">GPN</span>
                    </div>
                    <div className="flex h-52 w-52 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                      <QrCode className="h-40 w-40 text-slate-900 dark:text-white" />
                    </div>
                    <p className="mt-2.5 font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                      NMID: ID2026NEXATOPUP • {order.invoiceId}
                    </p>
                  </div>

                  <div className="flex w-full max-w-md items-center gap-3 rounded-2xl bg-slate-50 p-3.5 text-left text-xs text-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
                    <Loader2 className="h-5 w-5 shrink-0 animate-spin text-[#5B4DFF]" />
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">
                        Sistem Sedang Menunggu Pembayaran Anda...
                      </p>
                      <p className="mt-0.5">
                        Jangan tutup halaman ini. Begitu pembayaran QRIS terdeteksi oleh gateway, halaman ini akan langsung berubah menjadi Sukses secara otomatis.
                      </p>
                    </div>
                  </div>

                  {/* Sandbox Testing Button (Simulates API Key Webhook callback) */}
                  <div className="mt-5 w-full max-w-md rounded-2xl border border-dashed border-emerald-600/50 bg-emerald-50/70 p-4 text-left dark:border-emerald-700 dark:bg-emerald-950/30">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-emerald-900 dark:text-emerald-300">
                        Panel Simulasi Webhook (Sebelum API Key Dipasang)
                      </span>
                      <span className="rounded-md bg-emerald-700 px-2 py-0.5 text-[10px] font-bold text-white">
                        Sandbox
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-emerald-800 dark:text-emerald-200">
                      Klik tombol di bawah untuk mensimulasikan user selesai scan QRIS dan webhook pembayaran masuk ke server:
                    </p>
                    <button
                      type="button"
                      onClick={handleTriggerQrisWebhook}
                      className="mt-3 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-4 py-2.5 text-xs font-extrabold text-white shadow-xs hover:bg-emerald-800 sm:text-sm"
                    >
                      <Zap className="h-4 w-4" />
                      Simulasikan Scan QRIS Berhasil ({formatIDR(order.total)})
                    </button>
                  </div>
                </div>
              </section>
            ) : (
              /* ---------------- FLOW 2: SHOPEEPAY / DANA REDIRECT + MANUAL RETURN GUIDE ---------------- */
              <section className="space-y-4 rounded-3xl bg-white p-5 shadow-xs sm:p-6 dark:bg-slate-900">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span
                      className={`inline-block rounded-lg px-2.5 py-1 text-xs font-extrabold text-white ${
                        isShopeePay ? "bg-[#EE4D2D]" : "bg-[#118EEA]"
                      }`}
                    >
                      PEMBAYARAN {isShopeePay ? "SHOPEEPAY" : "DANA"}
                    </span>
                    <h2 className="mt-2 text-lg font-extrabold text-slate-900 dark:text-white">
                      Lanjutkan Pembayaran dengan {isShopeePay ? "ShopeePay" : "DANA"}
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                      Klik tombol pembayaran di bawah untuk membuka halaman otorisasi saldo {isShopeePay ? "ShopeePay" : "DANA"}.
                    </p>
                  </div>
                </div>

                {/* Mandatory User Guidance Box Explaining No Return Button on E-Wallet Page */}
                <div className="rounded-2xl border-2 border-amber-500/40 bg-amber-50/80 p-4 text-xs text-amber-950 dark:border-amber-600/40 dark:bg-amber-950/30 dark:text-amber-200">
                  <div className="flex items-center gap-2 font-extrabold text-amber-900 dark:text-amber-300">
                    <Info className="h-4 w-4 shrink-0 text-amber-600" />
                    <span>Panduan Penting Pembayaran {isShopeePay ? "ShopeePay" : "DANA"}</span>
                  </div>
                  <ol className="mt-2 list-decimal space-y-1.5 pl-4 leading-relaxed">
                    <li>
                      Klik tombol{" "}
                      <strong>
                        Bayar dengan {isShopeePay ? "ShopeePay" : "DANA"}
                      </strong>{" "}
                      di bawah untuk membuka halaman web pembayaran.
                    </li>
                    <li>
                      Selesaikan konfirmasi pembayaran sebesar{" "}
                      <strong>{formatIDR(order.total)}</strong> pada halaman tersebut.
                    </li>
                    <li>
                      <strong>Penting:</strong> Halaman pembayaran {isShopeePay ? "ShopeePay" : "DANA"}{" "}
                      <strong>tidak memiliki tombol kembali ke merchant</strong>. Setelah Anda menyelesaikan pembayaran di sana,{" "}
                      <strong>wajib kembali secara manual ke halaman/tab web NEXATOPUP ini</strong>{" "}
                      untuk melihat status top-up otomatis berubah menjadi Berhasil!
                    </li>
                  </ol>
                </div>

                {/* Prominent Orange ShopeePay Button (or Blue DANA Button) */}
                <div className="pt-1">
                  <Link
                    href={`/pay/${order.paymentId}/${order.invoiceId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-black text-white shadow-md transition-transform active:scale-[0.99] sm:text-base ${
                      isShopeePay
                        ? "bg-[#EE4D2D] hover:bg-[#D73211]"
                        : "bg-[#118EEA] hover:bg-[#0D74BF]"
                    }`}
                  >
                    <span>
                      Bayar dengan {isShopeePay ? "ShopeePay" : "DANA"} ({formatIDR(order.total)})
                    </span>
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                  <p className="mt-2 text-center text-[11px] text-slate-500 dark:text-slate-400">
                    Membuka halaman pembayaran {isShopeePay ? "ShopeePay" : "DANA"} di tab baru agar Anda mudah kembali ke halaman transaksi ini.
                  </p>
                </div>

                {/* Live Waiting Listener Status */}
                <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3.5 text-xs text-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
                  <Loader2 className="h-5 w-5 shrink-0 animate-spin text-[#5B4DFF]" />
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">
                      Menunggu Anda kembali setelah membayar di {isShopeePay ? "ShopeePay" : "DANA"}...
                    </p>
                    <p className="mt-0.5">
                      Halaman ini memantau status pembayaran secara otomatis. Begitu Anda selesai bayar dan kembali ke tab ini, status akan langsung tervalidasi.
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* Order Details Summary Card */}
            <section className="rounded-3xl bg-white p-5 shadow-xs dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Rincian Pesanan Top-Up
                </h3>
                <button
                  type="button"
                  onClick={handleCopyInvoice}
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      Invoice Tersalin
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Salin {order.invoiceId}
                    </>
                  )}
                </button>
              </div>

              <div className="mt-3.5 flex items-center gap-3.5">
                <img
                  src={order.coverImage}
                  alt={order.gameName}
                  className="h-12 w-12 rounded-2xl object-cover"
                />
                <div>
                  <p className="text-xs font-semibold text-slate-500">
                    {order.gameName}
                  </p>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {order.itemName}
                  </p>
                </div>
              </div>

              <dl className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs sm:text-sm dark:border-slate-800">
                <div className="flex justify-between">
                  <dt className="text-slate-600 dark:text-slate-400">ID Game Tujuan</dt>
                  <dd className="font-mono font-bold text-slate-900 dark:text-white">
                    {order.targetAccount}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-600 dark:text-slate-400">Nickname Akun</dt>
                  <dd className="font-bold text-slate-900 dark:text-white">
                    {order.nickname}
                  </dd>
                </div>
                {order.email && (
                  <div className="flex justify-between">
                    <dt className="text-slate-600 dark:text-slate-400">Email (Opsional)</dt>
                    <dd className="font-mono text-slate-800 dark:text-slate-200">
                      {order.email}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-slate-600 dark:text-slate-400">Harga Produk</dt>
                  <dd className="tabular-price font-semibold">
                    {formatIDR(order.subtotal)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-600 dark:text-slate-400">Biaya Admin</dt>
                  <dd className="tabular-price font-semibold text-emerald-700 dark:text-emerald-400">
                    {order.fee === 0 ? "Rp 0 (Gratis)" : formatIDR(order.fee)}
                  </dd>
                </div>
              </dl>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
