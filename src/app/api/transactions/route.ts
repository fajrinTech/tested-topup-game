import { NextRequest, NextResponse } from "next/server";
import type { GuestOrder } from "@/lib/topup";

// Store active guest transactions in server memory until a production DB/gateway is connected.
const memoryOrders = new Map<string, GuestOrder>();

export async function GET(request: NextRequest) {
  const invoiceId = request.nextUrl.searchParams.get("invoiceId");
  const hasGatewayKey = Boolean(process.env.PAYMENT_GATEWAY_API_KEY);

  if (invoiceId) {
    const order = memoryOrders.get(invoiceId) || null;
    return NextResponse.json({
      ok: true,
      gatewayConfigured: hasGatewayKey,
      order,
    });
  }

  return NextResponse.json({
    ok: true,
    gatewayConfigured: hasGatewayKey,
    orders: Array.from(memoryOrders.values()),
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, order, invoiceId } = body as {
      action: "create" | "mark_paid";
      order?: GuestOrder;
      invoiceId?: string;
    };

    // When PAYMENT_GATEWAY_API_KEY is added to .env.local, forward create/status calls here.
    const gatewayKey = process.env.PAYMENT_GATEWAY_API_KEY;

    if (action === "create" && order?.invoiceId) {
      memoryOrders.set(order.invoiceId, order);
      return NextResponse.json({
        ok: true,
        gatewayMode: gatewayKey ? "live_api_key" : "sandbox_simulation",
        order,
      });
    }

    if (action === "mark_paid" && invoiceId) {
      const existing = memoryOrders.get(invoiceId);
      const now = new Date().toISOString();
      if (existing) {
        const updated: GuestOrder = {
          ...existing,
          status: "Completed",
          paidAt: existing.paidAt || now,
        };
        memoryOrders.set(invoiceId, updated);
        return NextResponse.json({ ok: true, order: updated });
      }
      return NextResponse.json({
        ok: true,
        invoiceId,
        status: "Completed",
        paidAt: now,
      });
    }

    return NextResponse.json(
      { ok: false, error: "Action atau parameter transaksi tidak lengkap." },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "Gagal memproses payload transaksi." },
      { status: 500 }
    );
  }
}
