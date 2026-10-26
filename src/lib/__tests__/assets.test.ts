import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { GAMES } from "../../data/games.ts";

describe("Game Cover Art Assets", () => {
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
});
