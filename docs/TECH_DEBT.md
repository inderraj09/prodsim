# ProdSim — Tech Debt Log

*Things we deliberately skipped to keep moving. Each entry has: what was skipped, why, when to revisit, and rough effort.*

---

## TD-001 — Vercel Development env vars not configured

**What:** Clerk env vars (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL`) are set on Vercel for Production and Preview environments only — not Development.

**Why:** Vercel's CLI now treats Clerk's publishable key as a "sensitive" var, which can't be combined with other environments in a single `vercel env add` call. Each variable would have needed two separate runs (one for Prod+Preview, one for Dev). Four vars × 2 runs = 8 interactive prompts. We had local `npm run dev` working already, so the Vercel Development environment wasn't on the critical path.

**Impact:** `vercel dev` and `vercel pull` for the Development environment will fail to load Clerk. Local dev via `npm run dev` is unaffected.

**When to fix:** If anyone ever needs to use `vercel dev` (most weekend builds don't), or before the team grows past 1 person.

**Effort to fix:** 5 minutes — run `vercel env add <varname>` four times, picking only Development each time.

**Date logged:** 2026-04-25

---

## TD-003 — Submit mutation does not gate scenarios to user's current level

**What:** `convex/attempts.ts` `submit` accepts any `scenarioId` and grades the answer against it. There's no server-side check that the scenario is at the caller's `user.level` or that they've encountered it via the legitimate rotation.

**Why:** Intentional MVP cut to support the future "replay past scenarios" feature (unlocks at L3 per scoping §S4). Adding a level check now would couple submit to rotation semantics and need to be torn back out for replay.

**Impact:** A crafted client could grade itself against any non-hidden scenario at any level — including hard/boss difficulty for low-level users, which would inflate XP via the higher base XP. Leaderboard integrity risk.

**When to fix:** If leaderboard manipulation surfaces in testing or post-launch, OR before "replay past scenarios" ships (it'll need its own gate then anyway).

**Effort to fix:** ~30 minutes — add a `validateScenarioAccess(user, scenario)` helper, call from `submit`. Carve out the replay path when it lands.

**Date logged:** 2026-04-25

---

## How to use this file

When we deliberately skip something to keep velocity, log it here with the same format. Before launch, scan the list and decide what (if anything) actually needs fixing. Most weekend tech debt never needs to be paid back — it just dies when the project does.
