"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, Loader2, Lock, ShieldCheck } from "lucide-react";
import {
  STORAGE_KEY,
  formatIDR,
  markOrderPaid,
  type GuestOrder,
} from "@/lib/topup";

export default function ExternalShopeePayPage() {
  const params = useParams<{ provider: string; invoiceId: string }>();
  const invoiceId = params?.invoiceId || "";

  const [order, setOrder] = useState<GuestOrder | null>(null);
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const list: GuestOrder[] = JSON.parse(raw);
        const found = list.find((o) => o.invoiceId === invoiceId) || null;
        setOrder(found);
        if (found?.status === "Completed") {
          setPaid(true);
        }
      }
    } catch {
      // Ignore storage read errors.
    }
  }, [invoiceId]);

  const handleConfirmPay = async () => {
    setPaying(true);
    setTimeout(async () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const list: GuestOrder[] = raw ? JSON.parse(raw) : [];
        const updated = markOrderPaid(list, invoiceId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        const found = updated.find((o) => o.invoiceId === invoiceId) || null;
        setOrder(found);
      } catch {
        // Ignore storage write errors.
      }

      await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_paid", invoiceId }),
      }).catch(() => {});

      setPaying(false);
      setPaid(true);
    }, 650);
  };

  return (
    <div className="min-h-dvh bg-slate-100 text-slate-900">
      {/* ShopeePay Official Style Header */}
      <header className="bg-[#EE4D2D] px-4 py-4 text-white shadow-sm">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="/payments/shopeepay.png"
              alt="ShopeePay"
              className="h-7 w-7 rounded-lg bg-white p-0.5 object-contain"
            />
            <span className="text-base font-black tracking-tight">
              ShopeePay Checkout
            </span>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-bold">
            <Lock className="h-3 w-3" />
            Resmi
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 pt-6 pb-16">
        <div className="overflow-hidden rounded-3xl bg-white p-6 shadow-md">
          {!paid ? (
            <>
              <div className="flex flex-col items-center text-center">
                <img
                  src="/payments/shopeepay.png"
                  alt="Logo ShopeePay"
                  className="h-14 w-14 rounded-2xl border border-slate-100 p-1 object-contain shadow-2xs"
                />
                <span className="mt-3 text-xs font-bold tracking-wider text-slate-500 uppercase">
                  MERCHANT: NEXATOPUP INDONESIA
                </span>
                <p className="tabular-price mt-1.5 text-3xl font-black text-slate-900">
                  {formatIDR(order?.total || 1000)}
                </p>
                <p className="mt-1 font-mono text-xs text-slate-500">
                  Ref: {invoiceId}
                </p>
              </div>

              <div className="mt-5 space-y-2.5 rounded-2xl bg-slate-50 p-4 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">Produk Game</span>
                  <span className="font-bold text-slate-900">
                    {order
                      ? `${order.gameName} (${order.itemName})`
                      : "Produk Top-Up Game"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">ID Game Tujuan</span>
                  <span className="font-mono font-bold text-slate-900">
                    {order?.targetAccount || "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Metode Pembayaran</span>
                  <span className="font-bold text-[#EE4D2D]">ShopeePay</span>
                </div>
              </div>

              <button
                type="button"
                disabled={paying}
                onClick={handleConfirmPay}
                className="mt-6 inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-2xl bg-[#EE4D2D] px-5 py-3 text-sm font-extrabold text-white shadow-sm hover:bg-[#D73211] disabled:opacity-60"
              >
                {paying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Memvalidasi Pembayaran ShopeePay...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-5 w-5" />
                    Bayar Sekarang ({formatIDR(order?.total || 1000)})
                  </>
                )}
              </button>
            </>
          ) : (
            /* Paid State: intentionally NO button back to merchant per user specification */
            <div className="py-2 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 text-white">
                <CheckCircle2 className="h-9 w-9" />
              </div>
              <h1 className="mt-4 text-lg font-extrabold text-slate-900">
                Pembayaran ShopeePay Berhasil
              </h1>
              <p className="tabular-price mt-1 text-2xl font-black text-emerald-700">
                {formatIDR(order?.total || 1000)}
              </p>
              <p className="mt-1 font-mono text-xs text-slate-500">
                No. Referensi: {invoiceId}
              </p>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left text-xs leading-relaxed text-slate-700">
                <p className="font-extrabold text-slate-900">
                  Transaksi Selesai di ShopeePay
                </p>
                <p className="mt-1">
                  Pembayaran Anda telah diteruskan ke sistem merchant{" "}
                  <strong>NEXATOPUP</strong>. Halaman ini tidak mengarahkan Anda kembali secara otomatis.
                </p>
                <p className="mt-1.5 font-semibold text-slate-900">
                  Silakan tutup tab/layar ini atau kembali secara manual ke halaman transaksi NEXATOPUP untuk melihat status pesanan Anda yang sudah sukses.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
