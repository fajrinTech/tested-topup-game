# NEXATOPUP (Indonesian Mobile-First Game Top-Up) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a responsive mobile-first Indonesian game top-up web application without login/authentication, featuring 6 popular Indonesian games with real artwork, real currency/pass denominations, a mandatory Rp 1.000 testing product per game, guest checkout, and localStorage order history.

**Architecture:** Next.js App Router (TypeScript + Tailwind CSS) structured around a typed Indonesian game catalog (`src/data/games.ts`), pure domain/validation utilities (`src/lib/topup.ts`) covered by Vitest TDD unit tests, and a 3-state responsive UI shell (`Mobile -> Tablet -> Desktop`) matching the reference marketplace screens (Home, Explore, Cek Pesanan, plus Game Top-Up Checkout Sheet/Page).

**Tech Stack:** Next.js 15/16 (App Router), React 19, TypeScript, Tailwind CSS, Lucide React, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-26-topup-game-design.md`

## Global Constraints

- No authentication, login, signup, or user profile gates anywhere in the app.
- Every game in `GAMES` must include a `Rp 1.000` test product (`price: 1000`, `isTestProduct: true`).
- Forbidden character: never output the em dash character in UI copy, data, or code comments (Antislop R-02).
- Mobile responsiveness: minimum `44x44px` tap targets on interactive controls, 3 responsive layout states across mobile/tablet/desktop, and bottom navigation safe padding so content is never covered (Antislop R-03).
- Every interactive control must perform a real action (filter, tab switch, game selection, ID validation, checkout simulation, invoice search, or repeat order) with empty, loading, and error states (Antislop R-26, R-27).

## Review Focus

- Empty or malformed account IDs (e.g. missing Zone ID for Mobile Legends, missing `#TAG` for Valorant, non-numeric Player ID for Free Fire/PUBG/Genshin/HOK) must block checkout and return a specific Indonesian validation message.
- Searching for an invoice number (`INV-...`) or WhatsApp number that does not exist in `localStorage` must render a clear empty/not-found state with actionable guidance.
- Selecting the `Rp 1.000` test product with QRIS must calculate `Rp 1.000` total with `Rp 0` admin fee so testing requires exactly Rp 1.000.
- Game cover images must load reliably from local verified assets in `public/games/` with no broken images.
- Keyboard accessibility (`Escape` closes checkout/invoice modals, visible `focus-visible` ring on all buttons and inputs).

---

### Task 1: Project Scaffolding & Indonesian Game Catalog Data + Validation Engine (TDD)

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `src/data/games.ts`
- Create: `src/lib/topup.ts`
- Test: `src/lib/__tests__/topup.test.ts`

**Interfaces:**
- Consumes: none
- Produces:
  - `GAMES: GameConfig[]`, `PAYMENT_METHODS: PaymentMethod[]`, `PASS_SUBSCRIPTIONS: PassItem[]` in `src/data/games.ts`
  - `formatIDR(amount: number): string`
  - `validateAccountInput(game: GameConfig, fields: AccountInput): { valid: boolean; error?: string; formattedTarget?: string }`
  - `calculateCheckoutTotal(item: TopupItem, payment: PaymentMethod): { subtotal: number; fee: number; total: number }`
  - `createGuestOrder(params: CreateOrderParams): GuestOrder`
  - `searchOrders(orders: GuestOrder[], query: string): GuestOrder[]`

- [ ] **Step 1: Initialize Next.js + Tailwind + Vitest project and write failing unit tests in `src/lib/__tests__/topup.test.ts`**

Test assertions:
- Every game in `GAMES` (Mobile Legends, Free Fire, PUBG Mobile, Genshin Impact, Honor of Kings, Valorant) has at least 6 real denominations and exactly 1 test product with `price === 1000` and `isTestProduct === true`.
- `validateAccountInput` rejects MLBB without Zone ID, rejects Valorant without `Username#TAG`, rejects non-numeric Free Fire/PUBG/Genshin IDs, and accepts valid inputs.
- `calculateCheckoutTotal` returns `total: 1000` and `fee: 0` when buying a `Rp 1.000` test product with QRIS.
- `searchOrders` matches by invoice ID (`INV-...`), game name, or account ID cleanly.
- No string in `GAMES` or `PAYMENT_METHODS` contains an em dash character.

- [ ] **Step 2: Run Vitest to verify tests fail**

Run: `npx vitest run`
Expected: FAIL because `src/data/games.ts` and `src/lib/topup.ts` do not exist yet.

- [ ] **Step 3: Implement `src/data/games.ts` and `src/lib/topup.ts`**

Populate real Indonesian game data (MLBB, Free Fire, PUBG Mobile, Genshin Impact, Honor of Kings, Valorant), real payment methods (QRIS, DANA, GoPay, OVO, ShopeePay, BCA/BRI Virtual Account), and validation/calculation helpers.

- [ ] **Step 4: Run Vitest to verify all tests pass**

Run: `npx vitest run`
Expected: PASS (all unit tests green).

- [ ] **Step 5: Commit Task 1**

```bash
git add .
git commit -m "feat: add Indonesian game catalog data and topup validation logic"
```

---

### Task 2: Real Game Cover Art Assets & Styling Foundation

**Files:**
- Create: `public/games/mobile-legends.png` (and/or high-res official game cover images for all 6 games)
- Create: `src/app/globals.css`
- Create: `src/app/layout.tsx`
- Test: `src/lib/__tests__/assets.test.ts`

**Interfaces:**
- Consumes: `GAMES` from `src/data/games.ts`
- Produces: Verified local image files in `public/games/` matching every `game.coverImage` path in `GAMES`, plus root Next.js layout with `Plus Jakarta Sans` and `JetBrains Mono` fonts and `DESIGN.md` color tokens.

- [ ] **Step 1: Write asset verification test in `src/lib/__tests__/assets.test.ts`**

Asserts that every `game.coverImage` in `GAMES` exists on disk under `public/` and is a valid non-empty image file (`> 1000` bytes).

- [ ] **Step 2: Run Vitest to see asset test fail**

Run: `npx vitest run src/lib/__tests__/assets.test.ts`
Expected: FAIL because images in `public/games/` are not downloaded/created yet.

- [ ] **Step 3: Fetch real official game icons/artwork into `public/games/` and configure `src/app/layout.tsx` and `src/app/globals.css`**

Download official cover icons for Mobile Legends, Free Fire, PUBG Mobile, Genshin Impact, Honor of Kings, and Valorant into `public/games/`. Configure Next.js root layout and Tailwind CSS rules following `DESIGN.md`.

- [ ] **Step 4: Run Vitest to verify asset tests pass**

Run: `npx vitest run`
Expected: PASS

- [ ] **Step 5: Commit Task 2**

```bash
git add .
git commit -m "feat: add real game cover artwork and mobile-first layout styling"
```

---

### Task 3: Mobile-First Marketplace UI (Home, Explore, Cek Transaksi, & Guest Top-Up Flow)

**Files:**
- Create: `src/components/TopupApp.tsx`
- Create: `src/components/GameCheckoutModal.tsx`
- Create: `src/components/InvoiceModal.tsx`
- Create: `src/app/page.tsx`
- Test: `src/lib/__tests__/ui-copy.test.ts`

**Interfaces:**
- Consumes: `GAMES`, `PAYMENT_METHODS`, `PASS_SUBSCRIPTIONS` from `src/data/games.ts`; helpers from `src/lib/topup.ts`
- Produces: Complete interactive guest top-up web app with:
  1. **Home view**: Search bar, Indigo-Violet Hero Promo card (with quick actions for Rp 1.000 Test Product & Order History), 5 category pills, `Buy Again` repeat-order cards from `localStorage` (with honest empty state), and `Trending Games` cards.
  2. **Explore view**: `Top Games` 3x2 grid (6 games with real cover art) and `Subscriptions & Pass` list (Weekly Diamond Pass, Welkin Moon, Booyah Pass, Royale Pass, HOK Weekly Card).
  3. **Orders / Cek Pesanan view**: Invoice search bar (`INV-...`), Indonesian payment channel status cards, and `Recent Activity` transaction list from `localStorage`.
  4. **Game Top-Up Checkout Sheet/Modal & Invoice Receipt**: Account ID input + simulated nickname lookup, Rp 1.000 test product highlight, regular denominations, payment selector, instant QRIS simulation, and persisted receipt.

- [ ] **Step 1: Write UI copy & Antislop compliance test in `src/lib/__tests__/ui-copy.test.ts`**

Scans all `.ts` and `.tsx` files in `src/` to verify:
- Zero occurrences of the forbidden em dash character (Antislop R-02).
- Presence of mandatory accessible attributes (`aria-label` or visible text on buttons, `Escape` key handler on modals, minimum `min-h-[44px]` tap targets).

- [ ] **Step 2: Run test to verify it fails before `TopupApp.tsx` exists**

Run: `npx vitest run src/lib/__tests__/ui-copy.test.ts`
Expected: FAIL because `src/components/TopupApp.tsx` does not exist yet.

- [ ] **Step 3: Implement `src/components/GameCheckoutModal.tsx`, `src/components/InvoiceModal.tsx`, `src/components/TopupApp.tsx`, and `src/app/page.tsx`**

Build the complete 3-view mobile-first experience + responsive desktop split layout + interactive guest checkout and invoice modals.

- [ ] **Step 4: Run Vitest and `npm run build` to verify all tests and production build pass**

Run: `npx vitest run && npm run build`
Expected: PASS with zero TypeScript or build errors.

- [ ] **Step 5: Commit Task 3**

```bash
git add .
git commit -m "feat: implement mobile-first topup marketplace UI and guest checkout flow"
```
