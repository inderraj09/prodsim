# ProdSim — Master Prompt for Claude Code

*Paste this into Claude Code (`claude` CLI) as the first message after you `cd` into the project folder. Plan Mode should be on by default. Read the whole thing before running.*

---

## How to use this file

1. Open a new terminal in the `prodsim` folder
2. Run `claude` (starts Claude Code in that directory)
3. When it's ready, copy everything between the `=== PROMPT BEGIN ===` and `=== PROMPT END ===` markers below and paste
4. Claude Code will produce a `plan.md`. **Read it. Don't approve blindly.** If the plan misses something from the scoping doc, tell Claude "re-read `prodsim-scoping-v2.md` section X and revise the plan." Only approve when the plan covers every screen in the scoping doc.
5. After approval, Claude Code will build step by step. Commit between steps.

---

## Three things to do before pasting

**1. Put the scoping doc in the repo** so Claude Code can read it:

```
cp ~/my-weekender-project/prodsim-scoping-v2.md ~/my-weekender-project/prodsim/docs/scoping.md
```

(If the `docs/` folder doesn't exist, create it: `mkdir -p ~/my-weekender-project/prodsim/docs`)

**2. Commit that file:**

```
git add docs/scoping.md
git commit -m "docs: add scoping v2 as build spec"
git push
```

**3. Confirm `npx convex dev` is still running in your first terminal.** If not, restart it. Claude Code will write Convex functions that need that sync process alive.

---

## === PROMPT BEGIN ===

**Plan Mode ON.** We are building ProdSim — a PM career simulation game. Before you write any code, read these three files from the repo in this order:

1. `docs/scoping.md` — the locked spec. This is the source of truth. Every screen, journey, and edge case is in here.
2. `CLAUDE.md` — project conventions from Convex.
3. `AGENTS.md` — Next.js agent guidance.

Then produce a file called `plan.md` in the repo root that maps the scoping doc to a build sequence. I will review it before you write any code.

## Non-negotiables

**Stack (already set up — do not change):**
- Next.js 16 App Router, TypeScript, Tailwind CSS v4, React Compiler on
- Convex (reactive DB, actions, crons); dev deployment `enduring-octopus-413`, prod `rugged-goose-254`
- Clerk for auth (`ConvexProviderWithClerk` pattern) — email-only magic link
- shadcn/ui components (install as needed)
- `motion` package, imported as `motion/react` — NEVER `framer-motion`
- Anthropic SDK for the judge, called only from a Convex `"use node"` action
- Model: `claude-haiku-4-5` for the judge. Do NOT use Sonnet for grading — cost matters.

**Build principles:**
- Mobile-first. Every screen designed for 380px viewport first, adapts up.
- One working commit per feature. You commit, I review the diff.
- TypeScript strict. Server Components by default; `"use client"` only when needed.
- Mutations schedule actions via `ctx.scheduler.runAfter` — client NEVER calls actions directly.
- Files with `"use node"` export only actions. Mutations live in sibling files.
- New schema fields added as `v.optional(...)` first.
- Secrets go in Convex env (for Convex functions) or Vercel env (for Next.js). Never committed.

**Don't do:**
- Don't edit `convex/_generated/*` (auto-generated, but DO commit it)
- Don't import from `framer-motion`
- Don't call Anthropic from the client or from Next.js API routes
- Don't build anything in the "out of scope" list in `docs/scoping.md` section 8
- Don't use localStorage or sessionStorage for game state — use Convex

## Build sequence

Produce a plan that implements the scoping doc in this order. Each step is one commit.

**Step 1 — Foundations**
- Install dependencies: `@clerk/nextjs`, `@anthropic-ai/sdk`, `motion`, `date-fns-tz`
- Run `npx shadcn@latest init` with: Next.js, Radix, New York, Slate, CSS variables yes
- Add shadcn components: button card dialog input textarea sonner progress avatar badge tabs tooltip skeleton alert-dialog scroll-area sheet
- Wire `ConvexProviderWithClerk` in `app/providers.tsx`; wrap `app/layout.tsx`
- Basic layout: top bar placeholder, dark theme default

**Step 2 — Schema**
Create `convex/schema.ts` with all tables from scoping doc section 6:
- `users` (handle, email, name, showRealName, level, totalXP, streak, longestStreak, currentArchetype, createdAt) — indexes: `by_clerk`, `by_totalScore`, `by_handle`
- `scenarios` (title, body, rubric, level, difficulty, octalysisDrive, activeDate, isBossScenario, hidden) — indexes: `by_date`, `by_level_difficulty`
- `attempts` (userId, scenarioId, answer, status, overallScore, dimensionScores, archetype, roast, coachingNote, whatWouldMakeThisA5, xpAwarded, createdAt) — indexes: `by_user_createdAt`, `by_scenario_score`
- `bossFights` (userId, fromLevel, toLevel, scenarioId, attemptId, passed, retryAvailableAt) — indexes: `by_user`
- `playWindows` (userId, windowStart, playsUsed) — indexes: `by_user_window`
- `challenges` (challengerUserId, challengedUserId, attemptId, accepted, resultAttemptId) — indexes: `by_challenged`, `by_challenger`

All new fields `v.optional(...)` so schema push doesn't fail.

**Step 3 — Auth bridge**
- Clerk setup instructions printed to me (I'll create the Clerk app and paste the publishable key + secret + JWT issuer domain)
- `convex/auth.config.ts` with Clerk issuer from env
- Webhook or `getUserIdentity()` path that upserts `users` row on first sign-in
- Basic `/sign-in` page using Clerk's `<SignIn />` component
- `/welcome` page: handle + real-name opt-in checkbox + "Start as Intern" CTA

**Step 4 — Scenario seeding & daily rotation**
- `convex/scenarios.ts`:
  - `getTodaysScenario` reactive query
  - `getPreview` (for S1 landing, unauthenticated)
  - `internal.rotateDaily` mutation — picks next unused scenario for today's date
- `convex/crons.ts`: run `internal.scenarios.rotateDaily` at **18:30 UTC daily** (midnight IST)
- `internal.seed` mutation that inserts 16 starter scenarios (2 per level). I'll provide the scenario content — for now, use placeholders so the schema works.

**Step 5 — Play window logic**
- `convex/playWindows.ts`:
  - `getCurrentWindow` — computes current window based on IST time. Windows start at **midnight IST (18:30 UTC)** and **noon IST (06:30 UTC)**.
  - `canPlay` query — returns `{ allowed: bool, playsLeft: number, nextResetAt: timestamp }`
  - `incrementUsed` mutation (called from attempt submit)
- Use `date-fns-tz` for IST conversion. Server is source of truth.

**Step 6 — The AI judge**
- `convex/judge.ts` with `"use node"` pragma
- `internalAction` called `run` with args `{ attemptId, scenarioId, userAnswer }`
- Calls Anthropic SDK: model `claude-haiku-4-5`, `max_tokens: 800`, temperature `0.1`
- System prompt: "You are The Principal, a PM with 15 years at Stripe, Google, and a Series B startup. Return STRICT JSON only. Schema: {overallScore: 0-100, dimensions: {productSense, analyticalExecution, strategicThinking, communication} each 1-5, archetype: one of 8, roast: 1 sentence, coachingNote: 2 sentences naming a framework/thinker, whatWouldMakeThisA5: 1 sentence}"
- User message constructed from scenario + rubric + answer + user level
- Parses JSON robustly (strips markdown fences, finds first `{` and last `}`)
- Calls `internal.judgeInternal.writeScore` mutation on success
- Calls `internal.judgeInternal.markError` on failure
- `convex/judgeInternal.ts` (no `"use node"`) — the sibling mutations
- **Archetype list (assign one per attempt):** The Discovery Nerd, The Ship-It Machine, The Roadmap Romantic, The Metrics Assassin, The Feature Factory Foreman, The Zero-to-One Founder, The Enterprise Operator, The Design-Led PM

**Step 7 — Submit flow**
- `convex/attempts.ts`:
  - `submit` mutation: validates auth, validates answer 10–500 words, checks `canPlay`, writes pending attempt, increments play window, schedules `internal.judge.run` via `ctx.scheduler.runAfter(0, ...)`
  - `get` reactive query (for result screen subscription)
- Client-side `/play` page (mobile-first):
  - S4 Inbox layout from scoping doc
  - Play window indicator ("Plays left: ●●○ · Next reset 2h 14m")
  - Scenario card with NPC sender, constraints panel
  - Textarea with word counter
  - Submit button (disabled while empty or while current attempt pending)
- Client-side `/play/[attemptId]` page:
  - S5 judging state (answer faded, pulse animation)
  - S6 result screen with all elements from scoping doc (archetype, score, rubric grid, roast, coaching, XP, streak)
  - Conditional level-up banner
  - Conditional boss fight banner (only on L1→L2 and L2→L3)

**Step 8 — Reactive leaderboard**
- `convex/leaderboard.ts`:
  - `topByXP` — top 50 ordered by totalXP descending
  - `myRank` — current user's rank
- `/leaderboard` page with tabs (This Week / All Time / Your Challengers)
- Use `motion` layout animations on rank rows so they animate when ranks shift

**Step 9 — Share card generation**
- `app/share/[attemptId]/opengraph-image.tsx` using `next/og`
- 1080×1350 PNG (portrait, for Instagram/LinkedIn/X)
- Design per scoping doc S7: gradient background, wordmark, huge archetype, score, rubric emoji, roast, prodsim.com
- Also generate 1200×630 landscape variant for LinkedIn link previews
- S7 share sheet component:
  - Tries `navigator.share` first (mobile native sheet)
  - Falls back to custom UI with X / LinkedIn / Copy / Download buttons
  - "Challenge a friend" link generates `/play?ref=<handle>`

**Step 10 — Boss fights (L1→L2 and L2→L3 only)**
- After a scored attempt, check if user crossed an XP threshold
- If yes and `fromLevel` is 1 or 2:
  - Insert `bossFights` row (passed: false, attemptId: null)
  - Next time user visits `/play`, show boss scenario instead of daily scenario
  - Boss scenario has higher `difficulty: "boss"` and requires composite ≥14/20, all dimensions ≥3
  - On pass: update user level, mark boss fight passed, earn "Cleared Boss: Sam" badge
  - On fail: set `retryAvailableAt` to 24h from now
- **TBD decision — revisit Saturday during playtest:** do boss fights count against play window cap? Default: yes for now.

**Step 11 — Challenge flow**
- Landing page `/play?ref=<handle>` — fetch that user's latest attempt, show it as a public share card view, CTA "Challenge [handle] →"
- When challenged user signs up and plays, create a `challenges` row
- On their result: banner "You scored X. [Challenger] scored Y. Rematch?"
- "Your Challengers" tab on leaderboard

**Step 12 — Landing page + polish**
- `/` landing with hero, CTA, live counter (seeded 47/3 for now), Today's Case preview (blurred), mini leaderboard
- Mobile-first breakpoints tested at 380px, 768px, 1024px
- Empty states everywhere (no attempts yet, no challenges, etc.)
- Error toasts via sonner for API errors
- Loading skeletons on all async data

## Acceptance criteria

Before declaring any step done:
- `npm run dev` runs without console errors
- `npx convex dev` shows "Convex functions ready"
- The feature described in that step works end-to-end on mobile viewport (Chrome DevTools 380px)
- `npm run build` passes (run it yourself with the bash tool, don't skip this)
- `git log` shows one commit for the step with a message like `feat: S6 result screen with archetype and rubric`

## Model discipline

- For long sessions, use `/clear` between unrelated steps (between Step 5 and Step 6 especially)
- If you hit context pressure, use `/compact focus on <currentModule>`
- Use Plan Mode for any step touching 3+ files
- When in doubt about a scoping question, ask me. Don't guess. The scoping doc is v2-locked; if something feels ambiguous, it's probably missing from the doc and needs my input.

## What I need from you right now

1. Produce `plan.md` in the repo root
2. For each of the 12 steps above, list: files you'll create/modify, commits you'll make, and any questions about the scoping doc
3. Flag any conflicts between `CLAUDE.md`/`AGENTS.md` and the scoping doc
4. Stop after producing the plan. Do not write code until I approve.

## === PROMPT END ===

---

## After Claude Code shows you the plan

Read it against the scoping doc. Specifically check:

- [ ] Every screen (S1–S10) has a plan entry
- [ ] Every journey (J1–J5) is covered by some step
- [ ] The schema in Step 2 matches scoping doc section 6
- [ ] Scoring math in scoping doc section 7 is referenced somewhere in Step 6 or 7
- [ ] Mobile-first is called out for UI steps
- [ ] Boss fights are L1→L2 and L2→L3 only (not all levels)
- [ ] Daily cap is 3 per window, 2 windows at 12am/12pm IST

If anything is off, tell Claude Code: "Step X is missing Y from scoping doc section Z. Revise the plan."

Only when the plan passes all checks, tell Claude Code: **"Plan approved. Execute Step 1."**

Then review each commit. If a commit introduces something not in the plan or scoping doc, push back: "This wasn't in the plan. Why?"

---

## Between steps — housekeeping

After every successful step:

```
git status    # confirm clean working tree
git log --oneline -5    # confirm the new commit is there
git push    # pushes to GitHub, triggers Vercel deploy
```

Then check Vercel — does the deploy turn green? If yes, keep going. If red, paste the error into Claude Code before the next step.

---

## When things go wrong

**Claude Code produces code that doesn't compile:** paste the exact terminal error back. Don't describe it.

**Claude Code spawns 5+ subagents at once:** cancel immediately, restart with tighter scope.

**You feel lost:** `/clear`, re-read `docs/scoping.md`, resume from the last green commit.

**Claude Code confidently claims something is "done" without testing:** ask "Did you run `npm run build`? Did you check it loads at 380px? Paste the output." This is the single most common failure mode.

---

*When you're ready, paste the PROMPT BEGIN → PROMPT END block into Claude Code. Let me know what plan it produces.*
