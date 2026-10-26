import { NextRequest, NextResponse } from "next/server";
import type { GuestOrder } from "@/lib/topup";

const memoryOrders = new Map<string, GuestOrder>();

function getOstraConfig() {
  const baseUrl = (
    process.env.OSTRAPAY_BASE_URL || "https://ostrapay.pages.dev"
  ).replace(/\/+$/, "");
  const apiKey =
    process.env.OSTRAPAY_API_KEY ||
    process.env.PAYMENT_GATEWAY_API_KEY ||
    "";
  return { baseUrl, apiKey };
}

export async function GET(request: NextRequest) {
  const invoiceId = request.nextUrl.searchParams.get("invoiceId");
  const { baseUrl, apiKey } = getOstraConfig();
  const hasGatewayKey = Boolean(apiKey);

  if (invoiceId) {
    let order = memoryOrders.get(invoiceId) || null;

    if (hasGatewayKey && (!order || order.status !== "Completed")) {
      try {
        const ostraRes = await fetch(
          `${baseUrl}/api/v1/payments/${encodeURIComponent(invoiceId)}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
            cache: "no-store",
          }
        );

        if (ostraRes.ok) {
          const ostraJson = (await ostraRes.json()) as {
            success?: boolean;
            data?: {
              order_id?: string;
              amount?: number;
              status?: string;
              paid_at?: string | null;
              expires_at?: string;
            };
          };

          if (ostraJson.success && ostraJson.data) {
            const isPaid = ostraJson.data.status === "paid";
            if (order && isPaid) {
              order = {
                ...order,
                status: "Completed",
                paidAt:
                  order.paidAt ||
                  ostraJson.data.paid_at ||
                  new Date().toISOString(),
              };
              memoryOrders.set(invoiceId, order);
            }
            return NextResponse.json({
              ok: true,
              gatewayConfigured: true,
              gatewayStatus: ostraJson.data.status || "pending",
              paidAt: ostraJson.data.paid_at || null,
              order,
            });
          }
        }
      } catch {
        // Fallback to in-memory state if gateway check fails temporarily.
      }
    }

    return NextResponse.json({
      ok: true,
      gatewayConfigured: hasGatewayKey,
      gatewayStatus: order?.status === "Completed" ? "paid" : "pending",
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

    const { baseUrl, apiKey } = getOstraConfig();

    if (action === "create" && order?.invoiceId) {
      let enrichedOrder: GuestOrder = { ...order };

      if (apiKey) {
        try {
          const ostraRes = await fetch(`${baseUrl}/api/v1/payments`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              order_id: order.invoiceId,
              amount: order.total,
              customer_name: `${order.nickname} (${order.targetAccount})`,
              payment_method: order.paymentId || "qris",
              items: [
                {
                  id: order.itemId,
                  name: `${order.gameName} - ${order.itemName}`,
                  price: order.total,
                  qty: 1,
                },
              ],
            }),
          });

          const ostraJson = (await ostraRes.json()) as {
            success?: boolean;
            error?: string;
            data?: {
              order_id?: string;
              amount?: number;
              qris_string?: string;
              payment_link?: string | null;
              merchant?: {
                name?: string;
                nmid?: string;
              };
              status?: string;
              expires_at?: string;
            };
          };

          if (ostraRes.ok && ostraJson.success && ostraJson.data) {
            enrichedOrder = {
              ...order,
              qrisString: ostraJson.data.qris_string || order.qrisString,
              paymentLink:
                ostraJson.data.payment_link !== undefined
                  ? ostraJson.data.payment_link
                  : order.paymentLink ?? null,
              merchantName: ostraJson.data.merchant?.name || "Zeff",
              merchantNmid:
                ostraJson.data.merchant?.nmid || "ID1026593811353",
              expiresAt: ostraJson.data.expires_at || order.expiresAt,
            };
          } else {
            return NextResponse.json(
              {
                ok: false,
                error:
                  ostraJson.error ||
                  `Gagal membuat tagihan ke OstraPay Gateway (HTTP ${ostraRes.status}).`,
              },
              { status: ostraRes.status || 502 }
            );
          }
        } catch (err) {
          return NextResponse.json(
            {
              ok: false,
              error:
                (err as Error)?.message ||
                "Gagal menghubungi server OstraPay Gateway.",
            },
            { status: 502 }
          );
        }
      }

      memoryOrders.set(enrichedOrder.invoiceId, enrichedOrder);
      return NextResponse.json({
        ok: true,
        gatewayMode: apiKey ? "ostrapay_live" : "sandbox_simulation",
        order: enrichedOrder,
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
