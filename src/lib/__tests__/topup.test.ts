import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { GAMES, PASS_SUBSCRIPTIONS, PAYMENT_METHODS } from "../../data/games.ts";
import {
  calculateCheckoutTotal,
  createGuestOrder,
  formatIDR,
  markOrderPaid,
  searchOrders,
  simulateAccountNickname,
  validateAccountInput,
} from "../topup.ts";

describe("Indonesian Game Catalog & Rp 1.000 Test Product", () => {
  it("includes the 6 core Indonesian games with real currency names", () => {
    const slugs = GAMES.map((g) => g.slug);
    assert.deepEqual(slugs, [
      "mobile-legends",
      "free-fire",
      "pubg-mobile",
      "genshin-impact",
      "honor-of-kings",
      "valorant",
    ]);
  });

  it("provides a Rp 1.000 testing product as the first item in every game", () => {
    for (const game of GAMES) {
      assert.ok(game.items.length >= 6);
      const testItem = game.items[0];
      assert.equal(testItem.isTestProduct, true);
      assert.equal(testItem.price, 1000);
    }
  });

  it("exposes strictly QRIS and ShopeePay as the 2 payment methods with official logos", () => {
    const methodIds = PAYMENT_METHODS.map((p) => p.id);
    assert.deepEqual(methodIds, ["qris", "shopeepay"]);
    assert.equal(PAYMENT_METHODS[0].logoImage, "/payments/qris.svg");
    assert.equal(PAYMENT_METHODS[1].logoImage, "/payments/shopeepay.png");
  });

  it("contains zero forbidden em dash characters across all catalog data", () => {
    const serialized = JSON.stringify({
      GAMES,
      PAYMENT_METHODS,
      PASS_SUBSCRIPTIONS,
    });
    assert.equal(serialized.includes("\u2014"), false);
  });
});

describe("Account Validation, Pending Transaction Creation & Payment Transition", () => {
  it("requires both User ID and Zone ID for Mobile Legends", () => {
    const mlbb = GAMES.find((g) => g.slug === "mobile-legends")!;
    assert.equal(validateAccountInput(mlbb, { userId: "12345678", zoneId: "" }).valid, false);
    const ok = validateAccountInput(mlbb, { userId: "12345678", zoneId: "2104" });
    assert.equal(ok.valid, true);
    assert.equal(ok.formattedTarget, "12345678 (2104)");
  });

  it("requires Riot ID with #TAG for Valorant", () => {
    const val = GAMES.find((g) => g.slug === "valorant")!;
    assert.equal(validateAccountInput(val, { userId: "GarudaPlayer" }).valid, false);
    const ok = validateAccountInput(val, { userId: "GarudaPlayer#ID1" });
    assert.equal(ok.valid, true);
    assert.equal(ok.formattedTarget, "GarudaAce#ID1".replace("Ace", "Player"));
  });

  it("requires UID and Server selection for Genshin Impact", () => {
    const genshin = GAMES.find((g) => g.slug === "genshin-impact")!;
    assert.equal(validateAccountInput(genshin, { userId: "812345678", server: "" }).valid, false);
    const ok = validateAccountInput(genshin, { userId: "812345678", server: "Asia" });
    assert.equal(ok.valid, true);
    assert.equal(ok.formattedTarget, "812345678 [Asia]");
  });

  it("charges Rp 0 fee on Rp 1.000 test product with QRIS", () => {
    const mlbb = GAMES.find((g) => g.slug === "mobile-legends")!;
    const testItem = mlbb.items[0];
    const qris = PAYMENT_METHODS.find((p) => p.id === "qris")!;
    const totals = calculateCheckoutTotal(testItem, qris);
    assert.deepEqual(totals, { subtotal: 1000, fee: 0, total: 1000 });
  });

  it("creates Pending order with optional email and transitions to Completed via markOrderPaid", () => {
    assert.equal(formatIDR(1000), "Rp 1.000");
    assert.equal(formatIDR(30700), "Rp 30.700");

    const mlbb = GAMES.find((g) => g.slug === "mobile-legends")!;
    const spay = PAYMENT_METHODS.find((p) => p.id === "shopeepay")!;
    const order = createGuestOrder({
      game: mlbb,
      item: mlbb.items[0],
      payment: spay,
      targetAccount: "99887766 (1234)",
      nickname: simulateAccountNickname(mlbb, "99887766"),
      email: "gamer@contoh.id",
    });

    assert.equal(order.invoiceId.startsWith("INV-"), true);
    assert.equal(order.status, "Pending");
    assert.equal(order.email, "gamer@contoh.id");
    assert.equal(order.paymentFlow, "ewallet_redirect");
    assert.equal(searchOrders([order], "gamer@contoh.id").length, 1);

    const updatedList = markOrderPaid([order], order.invoiceId);
    assert.equal(updatedList[0].status, "Completed");
    assert.equal(Boolean(updatedList[0].paidAt), true);
  });
});
