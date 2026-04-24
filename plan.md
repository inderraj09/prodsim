# ProdSim — Build Plan (v1)

Maps `docs/scoping.md` → 12 commits. Do not start coding until this is approved.

## Ground rules baked into every step

These are derived from `CLAUDE.md`, `AGENTS.md`, `convex/_generated/ai/guidelines.md`, and the Next.js 16 docs shipped in `node_modules/next/dist/docs/`. Calling them out once so every step inherits them:

- **Next.js 16 is not the Next.js most training data knows.** Route params and `searchParams` are `Promise`s — always `await` them. `middleware.ts` is now **`proxy.ts`**. React Compiler is on, so don't hand-memo. Server Components by default; `"use client"` only where state/effects/DOM needed.
- **Convex rules override training data.** Use `withIndex`, never `.filter()`. `v.optional(...)` on every new field (so schema push never blocks). `"use node";` files export actions only — mutations/queries go in a sibling file. Never `ctx.db` in actions. Prefer `_creationTime` over a hand-rolled `createdAt` (see open question Q3). Use `identity.tokenIdentifier` (not `subject`) for ownership checks. Don't edit `convex/_generated/*`, but do commit it. `ctx.scheduler.runAfter(0, …)` is how mutations kick actions; client never calls actions directly.
- **Mobile-first, 380px.** Test every step in Chrome DevTools at 380px before committing. Touch targets ≥44px.
- **Acceptance gate per step:** `npm run dev` clean, `npx convex dev` shows ready, `npm run build` passes. One commit per step, message prefixed `feat:` / `chore:` as shown.

---

## Step 1 — Foundations

**Goal:** Install deps, wire shadcn, mount `ConvexProviderWithClerk`, replace Next boilerplate with a dark mobile shell.

**Files I'll create/modify:**
- `package.json` — add `@clerk/nextjs`, `@clerk/clerk-react`, `@anthropic-ai/sdk`, `motion`, `date-fns-tz`
- `components.json` — from `npx shadcn@latest init` (Next.js / New York / Slate / CSS vars / Tailwind v4 mode)
- `components/ui/*` — button, card, dialog, input, textarea, sonner, progress, avatar, badge, tabs, tooltip, skeleton, alert-dialog, scroll-area, sheet
- `lib/utils.ts` — shadcn's `cn()` helper
- `app/providers.tsx` (new, `"use client"`) — wraps `ClerkProvider` + `ConvexProviderWithClerk` + shadcn `Toaster`
- `app/layout.tsx` — wrap with `<Providers>`, set dark-theme default, page title "ProdSim", drop Geist Mono (keep Geist Sans), add viewport meta
- `app/page.tsx` — temporary landing skeleton ("ProdSim — coming soon" + sign-in link) so build passes. Real landing lands in Step 12.
- `app/globals.css` — shadcn design tokens + dark-theme defaults + mobile-safe viewport rules

**Commit:** `chore: install deps and wire Clerk+Convex+shadcn shell`

**Open question / decision flagged:** Q1 — shadcn New York theme + Tailwind v4 requires the v4 codemod path; I'll use the shadcn CLI's tailwind-v4 branch. No user input needed unless install fails.

---

## Step 2 — Schema

**Goal:** Every table from scoping §6 exists with correct indexes, all new fields `v.optional`.

**Files:**
- `convex/schema.ts` (new) — six tables below. Indexes exactly as listed in your brief.

| Table | Fields (all optional after `_id`/`_creationTime`) | Indexes |
|---|---|---|
| `users` | `clerkUserId` (string), `handle`, `email`, `name?`, `showRealName` (bool), `level` (1–8), `totalXP` (number), `streak`, `longestStreak`, `currentArchetype?` | `by_clerk(clerkUserId)`, `by_handle(handle)`, `by_totalXP(totalXP)` |
| `scenarios` | `title`, `body`, `rubric` (string), `level` (1–8), `difficulty` (`easy\|medium\|hard\|boss`), `octalysisDrive?`, `activeDate?` (string `YYYY-MM-DD`), `isBossScenario`, `hidden` | `by_date(activeDate)`, `by_level_difficulty(level, difficulty)` |
| `attempts` | `userId`, `scenarioId`, `answer`, `status` (`pending\|scored\|error`), `overallScore?`, `dimensionScores?` (object: 4 required + 4 optional), `archetype?`, `roast?`, `coachingNote?`, `whatWouldMakeThisA5?`, `xpAwarded?` | `by_user_createdAt(userId, _creationTime)`, `by_scenario_score(scenarioId, overallScore)` |
| `bossFights` | `userId`, `fromLevel`, `toLevel`, `scenarioId`, `attemptId?`, `passed`, `retryAvailableAt?` | `by_user(userId)` |
| `playWindows` | `userId`, `windowStart` (number, ms UTC of IST midnight or noon), `playsUsed` (0–3) | `by_user_window(userId, windowStart)` |
| `challenges` | `challengerUserId`, `challengedUserId`, `attemptId`, `accepted`, `resultAttemptId?` | `by_challenged(challengedUserId)`, `by_challenger(challengerUserId)` |

**Note:** `status`, `difficulty`, and `archetype` are best modeled as `v.union(v.literal(...))` — stricter than `v.string()` and still optional-friendly.

**Commit:** `feat: schema for users/scenarios/attempts/boss/playWindows/challenges`

**Conflicts with scoping:** scoping §6 lists `createdAt` on `users` and `attempts`; Convex auto-adds `_creationTime`. See Q3.

---

## Step 3 — Auth bridge (Clerk ↔ Convex)

**Goal:** Signed-in users exist as rows in `users`, onboarding captures handle.

**Files:**
- `app/sign-in/[[...sign-in]]/page.tsx` — Clerk `<SignIn />` card, centered, email-only
- `app/welcome/page.tsx` (`"use client"`) — handle input (3–20 chars, uniqueness-checked on blur via Convex query), "Show real name" checkbox, "Start as Intern" CTA calling `api.users.completeOnboarding`
- `convex/auth.config.ts` — `{ providers: [{ domain: env.CLERK_JWT_ISSUER_DOMAIN, applicationID: "convex" }] }`
- `convex/users.ts` — `getMe` query, `isHandleAvailable` query (withIndex `by_handle`), `completeOnboarding` mutation (derives identity via `ctx.auth.getUserIdentity()`, upserts by `clerkUserId = identity.subject`, writes `handle`, `showRealName`, `level: 1`, `totalXP: 0`, `streak: 0`, `longestStreak: 0`)
- `app/layout.tsx` — no change, Step 1 already wrapped with `<ClerkProvider>`

**What I need from you before coding this step:**
1. Create the Clerk app (email magic-link only, no password/Google)
2. Paste into `.env.local`: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-in`
3. Create a Convex JWT template in Clerk (name it `convex`) and paste `CLERK_JWT_ISSUER_DOMAIN` into Convex env (`npx convex env set CLERK_JWT_ISSUER_DOMAIN …`)

I'll print exact click-by-click instructions as the first thing when this step starts.

**Commit:** `feat: Clerk auth bridge + /welcome handle onboarding`

---

## Step 4 — Scenarios + daily rotation

**Goal:** One scenario is "active" per IST calendar date; cron rotates at IST midnight.

**Files:**
- `convex/scenarios.ts` — `getTodaysScenario` (reactive query using `by_date`), `getPreview` (public, unauthenticated-friendly — returns title + first 2 sentences only), `internal.scenarios.rotateDaily` mutation (picks next unused non-boss scenario of correct level mix and stamps tomorrow's IST date onto it)
- `convex/crons.ts` — `crons.cron("rotate daily scenario", "30 18 * * *", internal.scenarios.rotateDaily, {})` (18:30 UTC = 00:00 IST). Per Convex guidelines I'm using `crons.cron`, not the forbidden `.daily()` helper.
- `convex/seed.ts` — `internal.seed.run` internal mutation that inserts 16 placeholder scenarios (2 per level, difficulty mix) — you'll supply real content later

**Commit:** `feat: scenarios table, daily rotation cron, placeholder seed`

**Open question:** Q4 — what happens on the very first deploy before the cron has fired? I'll make `getTodaysScenario` fall back to "any scenario with `activeDate = today or NULL and matching level`" so the first user isn't staring at a blank screen.

---

## Step 5 — Play window logic

**Goal:** Server is source of truth for the 2×/day 3-play cap.

**Files:**
- `convex/lib/timeIST.ts` — pure helper using `date-fns-tz` to compute the current window's start (either last 00:00 IST or last 12:00 IST, whichever is later) and the next reset timestamp
- `convex/playWindows.ts` — `canPlay` query (reads or synthesises the current window row, returns `{ allowed, playsLeft, nextResetAt }`), `incrementUsed` mutation (called inside `attempts.submit`)
- Shared TS helper duplicated client-side for the countdown UI only (`lib/time.ts`)

**Commit:** `feat: play window cap with IST midnight/noon reset`

**Open question:** Q5 — "Plays left: ●●○" in scoping §S4: is ● = plays remaining or plays used? I'll build it as ● = remaining unless you say otherwise.

---

## Step 6 — The AI judge

**Goal:** Mutation schedules an action; action grades via Claude Haiku; mutation writes score back. One round-trip, robust JSON parse.

**Files:**
- `convex/judge.ts` — `"use node";` top line; exports **only** `internal.judge.run` (`internalAction`). Reads scenario + attempt + user via `ctx.runQuery`, calls Anthropic SDK (`claude-haiku-4-5`, `max_tokens: 800`, `temperature: 0.1`), parses JSON (strip ```json fences, take first `{` to last `}`), calls `internal.judgeInternal.writeScore` on success or `internal.judgeInternal.markError` on any throw / parse failure / >10s timeout (`AbortSignal.timeout(10_000)`).
- `convex/judgeInternal.ts` (no `"use node"`) — sibling file so mutations can live next to the action. Exports `writeScore`, `markError`, and the internal `ctx.runQuery` helpers the action needs. **This separation is required by Convex guidelines** — `"use node"` files can't export mutations.
- `convex/lib/prompts.ts` — `buildSystemPrompt()` and `buildUserPrompt(scenario, answer, userLevel)`; archetype enum lives here too

**System prompt (verbatim from your brief):**
> You are The Principal, a PM with 15 years at Stripe, Google, and a Series B startup. Return STRICT JSON only. Schema: `{overallScore: 0-100, dimensions: {productSense, analyticalExecution, strategicThinking, communication} each 1-5, archetype: one of [The Discovery Nerd, The Ship-It Machine, The Roadmap Romantic, The Metrics Assassin, The Feature Factory Foreman, The Zero-to-One Founder, The Enterprise Operator, The Design-Led PM], roast: 1 sentence, coachingNote: 2 sentences naming a framework/thinker, whatWouldMakeThisA5: 1 sentence}`

**Env needed in Convex:** `npx convex env set ANTHROPIC_API_KEY …` — I'll tell you to do this before the step runs.

**Commit:** `feat: AI judge action + score writeback`

**Open question:** Q6 — sub-dimensions (Customer Empathy, Prioritization Logic, Tradeoff Clarity, Structural Clarity) are in scoping §S6 but flagged "cut if noisy" in §8. I'll leave them out of the judge prompt for MVP — we can add them in Step 12 polish after you see real outputs.

---

## Step 7 — Submit flow + result screen

**Goal:** End-to-end play: S4 inbox → S5 judging → S6 result.

**Files:**
- `convex/attempts.ts` — `submit` mutation (auth check, 10–500 words, `canPlay` check, insert pending attempt, `playWindows.incrementUsed`, `ctx.scheduler.runAfter(0, internal.judge.run, { attemptId })`, returns `attemptId`); `get` reactive query for the result page; `getPublic` (same but no auth + hides answer text per edge case in §J5)
- `convex/xp.ts` — pure TS helpers for XP formula and level thresholds (§7 of scoping); called from `judgeInternal.writeScore`
- `app/play/page.tsx` (Server Component) — gates on auth, server-renders shell; nests `<PlayInbox />` client component
- `app/play/_components/play-inbox.tsx` (`"use client"`) — S4 layout: top bar, play-window indicator, scenario card, textarea + word counter, Submit
- `app/play/_components/play-window-indicator.tsx` (`"use client"`) — "●●○ · Next reset 2h 14m", live countdown
- `app/play/[attemptId]/page.tsx` (Server Component) — `params: Promise<{ attemptId: string }>`, gates auth, renders `<AttemptResult />`
- `app/play/[attemptId]/_components/attempt-result.tsx` (`"use client"`) — subscribes to `api.attempts.get`; shows S5 while `status === "pending"`, S6 full result layout when `scored`, error toast when `error`
- `app/play/[attemptId]/_components/rubric-grid.tsx`, `archetype-headline.tsx`, `xp-counter.tsx` — small presentational pieces using `motion/react`

**Commit:** `feat: S4 inbox, S5 judging, S6 result screen`

**Acceptance extras:** test "closes tab during judging" (Convex continues server-side, reopen shows result), "5-word answer" (still grades, low score), and the pending → scored reactive transition.

---

## Step 8 — Reactive leaderboard

**Files:**
- `convex/leaderboard.ts` — `topByXP` (take 50, `withIndex("by_totalXP").order("desc")`), `myRank` (count users with `totalXP > me.totalXP` using a bounded scan + `take(500)` cap; flag for upgrade to denormalized counter if users grow past 500 per Convex scale guidance)
- `app/leaderboard/page.tsx` + `_components/leaderboard-tabs.tsx` (`"use client"`) — three tabs: This Week (filtered by `_creationTime` client-side), All Time, Your Challengers (locked until row exists). Use `motion/react` `<AnimatePresence>` + `layout` prop so rows slide when ranks shift.

**Commit:** `feat: reactive leaderboard with animated rank changes`

---

## Step 9 — Share cards

**Goal:** Image crawlers see a nice card; users get a share sheet.

**Files:**
- `app/play/[attemptId]/opengraph-image.tsx` — portrait-first is not supported by the file convention (must be 1200×630 landscape for crawlers). I'll put the 1200×630 LinkedIn/X preview here. (See Q2 — this is different from what your brief said.)
- `app/play/[attemptId]/_components/share-card-portrait.tsx` — 1080×1350 `ImageResponse` rendered on demand via a separate route `app/api/share-card/[attemptId]/route.ts` so the "Download PNG" button has something to hit (Anthropic not touched here; this is first-party Convex → PNG)
- `app/play/[attemptId]/_components/share-sheet.tsx` (`"use client"`) — tries `navigator.share({ url, title, text })`, else custom UI with X / LinkedIn intent URLs, Copy, Download. "Challenge a friend" copies `https://prodsim.com/play?ref=<handle>`.

**Commit:** `feat: S7 share card (og + portrait) + native share sheet`

**Open question:** Q2 — your brief said `app/share/[attemptId]/opengraph-image.tsx`, but for link previews to work when someone pastes `/play/[attemptId]` (which is what J3 describes), the `opengraph-image.tsx` must be colocated with that page. Proposing the layout above; say the word if you want a separate `/share/<id>` route instead.

---

## Step 10 — Boss fights (L1→L2, L2→L3)

**Files:**
- `convex/xp.ts` — extend `writeScore` path to detect threshold crossing: if `fromLevel ∈ {1,2}` and XP now ≥ next threshold, insert `bossFights` row with `passed: false` and don't actually level up until it's cleared
- `convex/scenarios.ts` — extend `getTodaysScenario` to return the user's pending boss scenario if one exists
- `app/play/[attemptId]/_components/boss-fight-banner.tsx` (`"use client"`) — 2-second-armed Accept button per §J4
- Pass criteria enforced in `writeScore`: overallScore /5 composite ≥14 **and** every main dimension ≥3. Badge "Cleared Boss: Sam" written into a simple `badges` array on the user doc (single badge for MVP — full `badges` table is in the "cut if tight" list).

**Commit:** `feat: boss fights for L1→L2 and L2→L3`

**Open:** default = boss fights **do** count against the play window cap (TBD Saturday per your brief).

---

## Step 11 — Challenge flow (J3)

**Files:**
- `app/play/page.tsx` — read `?ref=<handle>` search param (`searchParams: Promise<...>` in Next 16); if present and user is signed-out, redirect to `/?ref=<handle>` (landing does the pitch) — if signed-in, store referrer `challengerUserId` in session-scoped URL state so next submit writes a `challenges` row
- `app/page.tsx` landing — if `?ref=<handle>` present, fetches that user's latest attempt and shows it as a public read-only S6 card with "Challenge [handle] →" CTA
- `convex/challenges.ts` — `createFromReferrer` mutation (called on challenged user's first scored attempt), `listMyChallengers` query
- Leaderboard "Your Challengers" tab lights up once `listMyChallengers` returns ≥1 row
- S6 rematch banner: if an attempt was created in the context of a challenge, show "You scored X. [Challenger] scored Y. Rematch?"

**Commit:** `feat: challenge-a-friend referral flow and rematch banner`

---

## Step 12 — Landing + polish

**Files:**
- `app/page.tsx` — real S1 landing: hero, CTA, live counter (seeded 47/3 — see Q7), Today's Case preview (uses `getPreview`), mini leaderboard
- Error toasts via `sonner` on every `api.*.submit` catch
- Skeletons on `/play`, `/leaderboard`, `/u/[handle]` while reactive queries are loading
- Empty states: no attempts yet ("Your first case is waiting"), no challengers, no streak
- Responsive pass at 380 / 768 / 1024
- Production build + Vercel preview smoke test

**Commit:** `feat: landing page, empty states, skeletons, responsive polish`

---

## Conflicts between docs to resolve with you

| # | Source | Conflict | My proposed default |
|---|---|---|---|
| C1 | `AGENTS.md` says Next.js APIs differ from training data; your brief says `app/share/[attemptId]/opengraph-image.tsx` | The og-image file convention is colocated with the route it represents. If shares go out as `/play/[id]`, the og image must be `app/play/[id]/opengraph-image.tsx`. | Use `/play/[attemptId]` as the canonical share URL; put og image there. Confirm or override. |
| C2 | Convex guidelines say `_creationTime` is automatic; scoping §6 lists `createdAt` | Redundant field. | Drop `createdAt` from `users` and `attempts`; use `_creationTime`. Indexes already use it. |
| C3 | Convex guidelines prefer `identity.tokenIdentifier`; brief implies `subject` via Clerk | Clerk's `subject` happens to be the Clerk user id, which is what we want for the UI, but for ownership checks `tokenIdentifier` is the safer key. | Store both: `clerkUserId = identity.subject` (for display / Clerk SDK round-trips), match ownership on `tokenIdentifier` stored alongside. |
| C4 | `AGENTS.md` Next 16 notice | `middleware.ts` is now `proxy.ts` in Next 16 | We don't need either — Clerk handles protected routes via its own wrapper. No file created. |

## Open questions for you (pasting here so they don't get lost)

1. **Q1 — shadcn init interactive prompts:** You listed the exact answers. I'll pass them non-interactively. No input needed unless the CLI asks something new.
2. **Q2 — share URL / og-image path:** See C1 above. Plan assumes `/play/[attemptId]`.
3. **Q3 — drop `createdAt`?** See C2. Yes/no.
4. **Q4 — empty first day:** Before the cron has ever fired, `getTodaysScenario` falls back to any seeded scenario matching the user's level. OK?
5. **Q5 — "●●○" semantics:** Filled dot = plays remaining. OK?
6. **Q6 — sub-dimensions in MVP:** Cut from judge prompt for now; add in Step 12 polish after real outputs look reasonable. OK?
7. **Q7 — seeded counters on landing:** The "47 playing / 3 CPOs" numbers — hardcoded on the client, or backed by a Convex query that happens to return (47, 3) on day one? I'll hardcode unless you want a real query.
8. **Q8 — delete account / S10 settings:** Not in your 12-step list and scoping §8 leaves them ambiguous. Deferred to post-MVP unless you say otherwise.
9. **Q9 — boss fights vs play window cap:** TBD after Saturday playtest per scoping. Default = count against cap.
10. **Q10 — scenario content:** Placeholders get seeded in Step 4 so schema and rotation work. I'll ask for real content (16 scenarios) before Step 12 polish so the landing page preview isn't gibberish.

## What I need from you before each step starts

- **Before Step 3:** Clerk publishable key, secret, and `CLERK_JWT_ISSUER_DOMAIN` in Convex env
- **Before Step 6:** `ANTHROPIC_API_KEY` in Convex env (`npx convex env set ANTHROPIC_API_KEY …`)
- **Before Step 12:** 16 real scenarios (2 per level, difficulty mix) — can be drafts
- **Before prod deploy:** Vercel env vars mirrored (`NEXT_PUBLIC_CONVEX_URL` → prod `rugged-goose-254`, Clerk keys)

---

*End of plan. Waiting for your go-ahead — will not write code until you say so.*
