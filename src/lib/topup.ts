import type { GameConfig, PaymentMethod, TopupItem } from "../data/games.ts";

export const STORAGE_KEY = "nexatopup_guest_orders_v1";

export interface AccountInput {
  userId: string;
  zoneId?: string;
  server?: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  formattedTarget?: string;
}

export type PaymentFlowType = "qris_scan" | "ewallet_redirect";

export interface GuestOrder {
  invoiceId: string;
  gameSlug: string;
  gameName: string;
  coverImage: string;
  itemId: string;
  itemName: string;
  targetAccount: string;
  rawUserId: string;
  rawZoneId?: string;
  rawServer?: string;
  nickname: string;
  paymentId: string;
  paymentName: string;
  paymentFlow: PaymentFlowType;
  subtotal: number;
  fee: number;
  total: number;
  email?: string;
  whatsapp?: string;
  status: "Completed" | "Pending";
  createdAt: string;
  paidAt?: string;
  isTestProduct: boolean;
}

export function formatIDR(amount: number): string {
  const formatted = new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(Math.max(0, Math.round(amount)));
  return `Rp ${formatted}`;
}

export function validateAccountInput(
  game: GameConfig,
  input: AccountInput
): ValidationResult {
  const userId = (input.userId || "").trim();
  const zoneId = (input.zoneId || "").trim();
  const server = (input.server || "").trim();

  if (!userId) {
    return {
      valid: false,
      error: `Masukkan ${game.accountMode === "riot_tag" ? "Riot ID" : "User ID / Player ID"} terlebih dahulu.`,
    };
  }

  if (game.accountMode === "mlbb_zone") {
    if (!/^\d{6,12}$/.test(userId)) {
      return {
        valid: false,
        error: "User ID Mobile Legends harus berupa 6 sampai 12 digit angka.",
      };
    }
    if (!/^\d{4,5}$/.test(zoneId)) {
      return {
        valid: false,
        error: "Zone ID Mobile Legends wajib diisi (4 sampai 5 digit angka).",
      };
    }
    return {
      valid: true,
      formattedTarget: `${userId} (${zoneId})`,
    };
  }

  if (game.accountMode === "uid_server") {
    if (!/^\d{9,10}$/.test(userId)) {
      return {
        valid: false,
        error: "UID Genshin Impact harus berupa 9 sampai 10 digit angka.",
      };
    }
    if (!server) {
      return {
        valid: false,
        error: "Pilih server akun Genshin Impact terlebih dahulu.",
      };
    }
    return {
      valid: true,
      formattedTarget: `${userId} [${server}]`,
    };
  }

  if (game.accountMode === "riot_tag") {
    if (!/^[^#]{3,16}#[A-Za-z0-9]{2,5}$/.test(userId)) {
      return {
        valid: false,
        error: "Format Riot ID tidak valid. Gunakan format Nickname#TAG (contoh: GarudaAce#ID1).",
      };
    }
    return {
      valid: true,
      formattedTarget: userId,
    };
  }

  if (!/^\d{5,14}$/.test(userId)) {
    return {
      valid: false,
      error: `Player ID ${game.shortName} harus berupa 5 sampai 14 digit angka.`,
    };
  }

  return {
    valid: true,
    formattedTarget: userId,
  };
}

export function simulateAccountNickname(game: GameConfig, userId: string): string {
  const clean = userId.trim();
  if (!clean) return "";
  if (game.accountMode === "riot_tag" && clean.includes("#")) {
    return clean.split("#")[0];
  }
  const suffixes = ["GarudaID", "NusantaraPro", "KsatriaID", "BintangTimur", "ElangMerah", "SuryaGaming"];
  const sum = clean.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const tag = suffixes[sum % suffixes.length];
  return `${tag}_${clean.slice(-3)}`;
}

export function calculateCheckoutTotal(
  item: TopupItem,
  payment: PaymentMethod
): { subtotal: number; fee: number; total: number } {
  const subtotal = item.price;
  const fee = item.isTestProduct && payment.freeForTestProduct ? 0 : payment.flatFee;
  return {
    subtotal,
    fee,
    total: subtotal + fee,
  };
}

export interface CreateOrderParams {
  game: GameConfig;
  item: TopupItem;
  payment: PaymentMethod;
  targetAccount: string;
  rawUserId?: string;
  rawZoneId?: string;
  rawServer?: string;
  nickname: string;
  email?: string;
  whatsapp?: string;
}

export function createGuestOrder(params: CreateOrderParams): GuestOrder {
  const { subtotal, fee, total } = calculateCheckoutTotal(params.item, params.payment);
  const rand = Math.floor(100000 + Math.random() * 900000);
  const paymentFlow: PaymentFlowType =
    params.payment.id === "qris" ? "qris_scan" : "ewallet_redirect";

  return {
    invoiceId: `INV-2026-${rand}`,
    gameSlug: params.game.slug,
    gameName: params.game.shortName,
    coverImage: params.game.coverImage,
    itemId: params.item.id,
    itemName: params.item.name,
    targetAccount: params.targetAccount,
    rawUserId: params.rawUserId || params.targetAccount,
    rawZoneId: params.rawZoneId,
    rawServer: params.rawServer,
    nickname: params.nickname,
    paymentId: params.payment.id,
    paymentName: params.payment.name,
    paymentFlow,
    subtotal,
    fee,
    total,
    email: params.email?.trim() || undefined,
    whatsapp: params.whatsapp?.trim() || undefined,
    status: "Pending",
    createdAt: new Date().toISOString(),
    isTestProduct: Boolean(params.item.isTestProduct),
  };
}

export function markOrderPaid(orders: GuestOrder[], invoiceId: string): GuestOrder[] {
  const now = new Date().toISOString();
  return orders.map((order) =>
    order.invoiceId === invoiceId
      ? { ...order, status: "Completed", paidAt: order.paidAt || now }
      : order
  );
}

export function searchOrders(orders: GuestOrder[], query: string): GuestOrder[] {
  const q = query.trim().toLowerCase();
  if (!q) return orders;
  return orders.filter(
    (o) =>
      o.invoiceId.toLowerCase().includes(q) ||
      o.targetAccount.toLowerCase().includes(q) ||
      o.gameName.toLowerCase().includes(q) ||
      (o.email && o.email.toLowerCase().includes(q)) ||
      (o.whatsapp && o.whatsapp.toLowerCase().includes(q))
  );
}
