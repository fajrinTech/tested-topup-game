"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Clock, Copy, ExternalLink, Receipt, RotateCcw, ShieldCheck, X } from "lucide-react";
import { formatIDR, type GuestOrder } from "@/lib/topup";

interface InvoiceModalProps {
  order: GuestOrder | null;
  onClose: () => void;
  onRepeatOrder: (order: GuestOrder) => void;
}

export function InvoiceModal({
  order,
  onClose,
  onRepeatOrder,
}: InvoiceModalProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!order) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [order, onClose]);

  if (!order) return null;

  const handleCopyInvoice = async () => {
    try {
      await navigator.clipboard.writeText(order.invoiceId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const formattedDate = new Date(order.createdAt).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const isCompleted = order.status === "Completed";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invoice-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl bg-white p-5 text-slate-900 shadow-2xl sm:rounded-3xl sm:p-6 dark:bg-slate-900 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <h2 id="invoice-modal-title" className="text-base font-bold">
                Ringkasan Transaksi
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Tersimpan otomatis di perangkat ini (Tanpa Login)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup struk transaksi"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/70">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Nomor Invoice
            </span>
            {isCompleted ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-700 px-2.5 py-0.5 text-xs font-semibold text-white">
                <ShieldCheck className="h-3.5 w-3.5" />
                Berhasil
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-600 px-2.5 py-0.5 text-xs font-semibold text-white">
                <Clock className="h-3.5 w-3.5" />
                Menunggu Pembayaran
              </span>
            )}
          </div>
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <code className="font-mono text-sm font-bold text-slate-900 dark:text-white">
              {order.invoiceId}
            </code>
            <button
              type="button"
              onClick={handleCopyInvoice}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  Tersalin
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Salin ID
                </>
              )}
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-200/80 p-3.5 dark:border-slate-800">
          <img
            src={order.coverImage}
            alt={order.gameName}
            className="h-12 w-12 rounded-xl object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
              {order.gameName}
            </p>
            <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
              {order.itemName}
            </p>
            {order.isTestProduct && (
              <span className="mt-0.5 inline-block rounded-md bg-emerald-700 px-2 py-0.5 text-[11px] font-semibold text-white">
                Produk Testing Rp 1.000
              </span>
            )}
          </div>
        </div>

        <dl className="mt-4 space-y-2.5 text-sm">
          <div className="flex justify-between gap-2">
            <dt className="text-slate-600 dark:text-slate-400">Tujuan Akun</dt>
            <dd className="font-mono font-semibold text-slate-900 dark:text-white">
              {order.targetAccount}
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-slate-600 dark:text-slate-400">Nickname</dt>
            <dd className="font-semibold text-slate-900 dark:text-white">
              {order.nickname}
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-slate-600 dark:text-slate-400">Metode Pembayaran</dt>
            <dd className="font-semibold text-slate-900 dark:text-white">
              {order.paymentName}
            </dd>
          </div>
          {order.email && (
            <div className="flex justify-between gap-2">
              <dt className="text-slate-600 dark:text-slate-400">Email Bukti</dt>
              <dd className="font-mono text-xs text-slate-800 dark:text-slate-200">
                {order.email}
              </dd>
            </div>
          )}
          <div className="flex justify-between gap-2">
            <dt className="text-slate-600 dark:text-slate-400">Waktu Transaksi</dt>
            <dd className="text-slate-800 dark:text-slate-200">{formattedDate}</dd>
          </div>
          <div className="border-t border-slate-200 pt-2.5 dark:border-slate-800">
            <div className="mt-1 flex items-center justify-between text-base font-extrabold text-slate-900 dark:text-white">
              <span>Total Tagihan</span>
              <span className="tabular-price text-[#5B4DFF] dark:text-indigo-400">
                {formatIDR(order.total)}
              </span>
            </div>
          </div>
        </dl>

        <div className="mt-5 grid grid-cols-2 gap-2.5">
          {!isCompleted ? (
            <Link
              href={`/transaction/${order.invoiceId}`}
              className="col-span-2 inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-2xl bg-[#5B4DFF] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#4B3DE8]"
            >
              <ExternalLink className="h-4 w-4" />
              Buka Halaman Pembayaran
            </Link>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onRepeatOrder(order)}
                className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <RotateCcw className="h-4 w-4" />
                Beli Lagi
              </button>
              <Link
                href={`/transaction/${order.invoiceId}`}
                className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-2xl bg-[#5B4DFF] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#4B3DE8]"
              >
                Halaman Transaksi
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
