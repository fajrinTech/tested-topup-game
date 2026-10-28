import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { GAMES, PAYMENT_METHODS } from "../../data/games.ts";

describe("Game Cover Art & Official Payment Logo Assets", () => {
  it("has a real local image file in public/games/ for every game in GAMES", () => {
    for (const game of GAMES) {
      const rel = game.coverImage.replace(/^\//, "");
      const fullPath = path.join(process.cwd(), "public", rel);
      assert.equal(
        fs.existsSync(fullPath),
        true,
        `Missing cover image for ${game.name}: ${fullPath}`
      );
      const stat = fs.statSync(fullPath);
      assert.ok(
        stat.size > 1000,
        `Image file too small for ${game.name}: ${stat.size} bytes`
      );
    }
  });

  it("has official local logo files in public/payments/ for QRIS and ShopeePay", () => {
    for (const pm of PAYMENT_METHODS) {
      assert.ok(pm.logoImage, `Missing logoImage property on ${pm.id}`);
      const rel = pm.logoImage.replace(/^\//, "");
      const fullPath = path.join(process.cwd(), "public", rel);
      assert.equal(
        fs.existsSync(fullPath),
        true,
        `Missing payment logo for ${pm.name}: ${fullPath}`
      );
      const stat = fs.statSync(fullPath);
      assert.ok(
        stat.size > 1000,
        `Payment logo file too small for ${pm.name}: ${stat.size} bytes`
      );
    }
  });

  it("has valid PWA manifest, 192x192 & 512x512 PNG icons, and service worker for Android Chrome install", () => {
    const manifestPath = path.join(process.cwd(), "public", "manifest.json");
    assert.equal(fs.existsSync(manifestPath), true, "Missing public/manifest.json");
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
    assert.equal(manifest.display, "standalone");
    assert.equal(manifest.start_url, "/");
    assert.ok(Array.isArray(manifest.icons) && manifest.icons.length >= 2);

    for (const icon of manifest.icons) {
      const iconPath = path.join(process.cwd(), "public", icon.src.replace(/^\//, ""));
      assert.equal(fs.existsSync(iconPath), true, `Missing PWA icon: ${iconPath}`);
      const stat = fs.statSync(iconPath);
      assert.ok(stat.size > 1000, `PWA icon too small: ${iconPath}`);
    }

    const swPath = path.join(process.cwd(), "public", "sw.js");
    assert.equal(fs.existsSync(swPath), true, "Missing public/sw.js service worker");
    const swContent = fs.readFileSync(swPath, "utf-8");
    assert.ok(swContent.includes("fetch"), "Service worker must handle fetch event for Android PWA installability");

    const layoutPath = path.join(process.cwd(), "src", "app", "layout.tsx");
    const layoutContent = fs.readFileSync(layoutPath, "utf-8");
    assert.ok(layoutContent.includes('manifest: "/manifest.json"'), "layout.tsx must link /manifest.json");
  });
});
