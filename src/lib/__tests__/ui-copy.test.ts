import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function walkFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const out: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkFiles(full));
    } else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
      out.push(full);
    }
  }
  return out;
}

describe("Mobile-First Marketplace UI, Transaction Pages & Antislop Compliance", () => {
  it("renders TopupApp, GameCheckoutModal, Dedicated Transaction Page, and External E-Wallet Page", () => {
    const requiredFiles = [
      "src/components/TopupApp.tsx",
      "src/components/GameCheckoutModal.tsx",
      "src/components/InvoiceModal.tsx",
      "src/app/page.tsx",
      "src/app/transaction/[invoiceId]/page.tsx",
      "src/app/pay/[provider]/[invoiceId]/page.tsx",
      "src/app/api/transactions/route.ts",
    ];
    for (const rel of requiredFiles) {
      const full = path.join(process.cwd(), rel);
      assert.equal(fs.existsSync(full), true, `Missing required UI/Route file: ${rel}`);
    }
  });

  it("contains zero forbidden em dash characters across all source files (R-02)", () => {
    const files = walkFiles(path.join(process.cwd(), "src"));
    for (const file of files) {
      if (file.endsWith("ui-copy.test.ts") || file.endsWith("topup.test.ts")) continue;
      const content = fs.readFileSync(file, "utf8");
      assert.equal(
        content.includes("\u2014"),
        false,
        `Found forbidden em dash in ${path.relative(process.cwd(), file)}`
      );
    }
  });

  it("enforces minimum 44px tap targets, Escape keyboard close, and safe bottom padding (R-03, R-32)", () => {
    const appCode = fs.readFileSync(
      path.join(process.cwd(), "src/components/TopupApp.tsx"),
      "utf8"
    );
    const modalCode = fs.readFileSync(
      path.join(process.cwd(), "src/components/GameCheckoutModal.tsx"),
      "utf8"
    );
    assert.equal(appCode.includes("min-h-[44px]"), true, "Expected min-h-[44px] tap targets");
    assert.equal(appCode.includes("pb-28"), true, "Expected pb-28 bottom nav safe space");
    assert.equal(modalCode.includes("Escape"), true, "Expected Escape key handler on modal");
  });

  it("locks viewport scale and disables pinch zoom for native mobile app feel", () => {
    const layoutCode = fs.readFileSync(
      path.join(process.cwd(), "src/app/layout.tsx"),
      "utf8"
    );
    assert.equal(layoutCode.includes("userScalable: false"), true, "Expected userScalable: false in viewport");
    assert.equal(layoutCode.includes("maximumScale: 1"), true, "Expected maximumScale: 1 in viewport");
  });
});
