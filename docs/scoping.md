# ProdSim — Scoping Document v2

*Locked decisions. Ready to paste into Claude Code as the build spec.*

*Changes from v1 marked with ✅.*

---

## 1. What this is, in one line

A web game where PMs answer real scenario questions, get graded by an AI, and progress from Intern to CPO — with a share card at the end that makes their friends want to play.

## 2. The core loop, one sentence

**Read scenario → write answer → AI grades it → see score + feedback + archetype → share or play next.**

---

## 3. The user we're building for

- A working PM, 1–8 years in, on LinkedIn and PM Twitter
- Plays on phone on the commute; replays on laptop at lunch
- Will play once out of curiosity; comes back if the scoring feels fair and the share card is good
- Will share if the result tells a story about them (archetype > score)

✅ **Mobile-first.** Every screen designed for phone first, adapts up to desktop. Touch targets ≥44px, share sheet uses native mobile share API where available.

---

## 4. Screens — every single one

### S1. Landing page (`/`)

**Who sees it:** Everyone, signed-in or not.

**What's on it (mobile, top to bottom):**
1. Logo: "ProdSim" (top-left). If signed in: avatar top-right. If not: "Sign in" link top-right.
2. Hero headline: "Take 100 PM decisions before your next real one."
3. Subhead: "AI-graded career sim. 8 levels. Intern to CPO."
4. Primary CTA button: "Play today's case →"
5. Live counter: "X PMs playing. Only Y have reached CPO." *(seeded with 47 and 3 on day one)*
6. "Today's Case" preview — scenario title + first 2 sentences, blurred after. Button: "Sign in to play →"
7. Leaderboard preview: top 10, updates live
8. 3 social proof cards (static images of tester reactions)
9. Footer: About, X link, feedback email

---

### S2. Sign-in (`/sign-in`)

Clerk's pre-built magic link form. One field: email. One button: "Send link."

✅ **Email-only for MVP.** No Google, no password.

---

### S3. First-time onboarding (`/welcome`)

Shows once, right after first sign-in.

1. "Welcome. Pick your handle." — one text field, 3–20 chars, must be unique
2. **Below handle:** checkbox "Show my real name on my public profile" (default: unchecked). Name comes from Clerk's signup.
3. Flavor text: "You start as a PM Intern at Loomly, a B2C app with 2M users. Every scenario is a real situation. Answer honestly — the AI rewards judgment, not buzzwords."
4. Button: "Start as Intern →"

---

### S4. The Inbox (`/play`) — home screen after sign-in

**Mobile layout, top to bottom:**
1. Top bar: avatar + handle on left; level + XP bar + 🔥 streak on right (compact)
2. **Play windows indicator:** "Plays left: ●●○ · Next reset 2h 14m" (small, below top bar)
3. **Today's Case card** (full-width on mobile):
   - From: "Priya, Eng Manager" (NPC name + role)
   - Title
   - Body (200–400 words, scrollable)
   - Constraints panel (collapsible on mobile): team, budget, timeline, data available
4. Textarea: "Your answer (max 500 words)" — word counter below, Submit button below that
5. Collapsed section: "Live leaderboard" (tap to expand)
6. Below: "Replay past scenarios" (locked, unlocks at Level 3)

✅ **Play window logic:**
- 2 reset windows per day: **12:00am IST** and **12:00pm IST**
- 3 plays per window
- Max 6 plays/day per user
- When you burn 3 in the current window, the "Next reset" timer counts down to whichever of 12am/12pm comes next
- All times IST, regardless of where user is physically playing from

---

### S5. Judging state (stays on `/play`)

**Trigger:** User hits Submit.

**What they see:**
1. Their answer text fades to 60% opacity, uneditable
2. Banner slides down: "The Principal is reading your answer…"
3. Simple pulse animation — 3–6 seconds while Claude grades
4. No fake loading messages

**Under the hood:** Submit mutation writes pending attempt, schedules Convex action, action calls Claude Haiku 4.5, writes score back via mutation, reactive query pushes result to screen.

---

### S6. Result screen (`/play/[attemptId]`)

**Animates in over ~2 seconds:**

1. **Archetype headline:** "You are: **The Metrics Assassin** 📊"
2. **Score:** "87 / 100" (big)
3. ✅ **Rubric grid — default view shows 4 dimensions:**
   - Product Sense 🟩🟩🟩🟨🟥 (4/5)
   - Analytical Execution 🟩🟩🟩🟩🟩 (5/5)
   - Strategic Thinking 🟩🟩🟨🟥🟥 (3/5)
   - Communication 🟩🟩🟩🟩🟨 (4/5)
   - Below the grid: **"Show detailed breakdown ↓"** — expands to reveal 4 additional sub-dimensions:
     - Customer Empathy, Prioritization Logic, Tradeoff Clarity, Structural Clarity
   - (Optional — cut if Claude's sub-scores feel noisy in testing)
4. **Roast (italic, 1 line):** "You'd optimize the funnel to the graveyard. Classic mid-career PM."
5. **Coaching note (2 sentences):** names a framework or PM thinker (Shreyas, Marty Cagan, Teresa Torres, April Dunford, Gibson Biddle, Lenny, Melissa Perri, Shishir Mehrotra, Ravi Mehta, Ken Norton, Julie Zhuo)
6. **"What would make this a 5":** one specific, actionable change
7. **XP gained:** "+240 XP" (animated counter)
8. **Streak:** "🔥 4 days — keep going"
9. **Level-up banner** (only if leveled): full-screen "You are now a PM I 🫡"
10. **Boss Fight banner** (only on L1→L2 and L2→L3 transitions) — see J4

**Buttons:**
- **Share result** (primary) → S7
- **Play next** → back to S4 (or cap screen if you're out)
- **See leaderboard** → S8

---

### S7. Share sheet (overlay on `/play/[attemptId]`)

**Mobile:** tries native share sheet first (`navigator.share`), falls back to custom UI on desktop or unsupported browsers.

**Custom UI shows:**
1. Preview of share card (1080×1350 PNG)
   - Gradient background (purple → cyan → magenta, Spotify Wrapped 2025 style)
   - "ProdSim — Season 1" wordmark top-left
   - Huge: "The Metrics Assassin 📊"
   - Below: "PM Intern • 87 / 100"
   - 4 emoji squares
   - Roast in italics
   - Bottom right: "prodsim.com"
2. Buttons:
   - **Post to X**
   - **Post to LinkedIn**
   - **Copy link**
   - **Download PNG**
3. "Challenge a friend" link: copies `prodsim.com/play?ref=<handle>`

✅ **"Challenge" framing used throughout.** "Challenge a friend," "Challenged by [handle]," etc.

---

### S8. Leaderboard (`/leaderboard`)

1. Tabs: **This Week** (default) / **All Time** / **Your Challengers** *(last tab locked until someone challenges you)*
2. Top 50 rows: rank, avatar, **handle** (or real name if user opted in), level, total XP, archetype
3. Your row pinned at bottom if not in top 50
4. Live updates via Convex reactive query; ranks animate on change

✅ **Handles shown by default.** Real name only if user opted in during S3 onboarding (or later in S10 settings).

---

### S9. Profile page (`/u/[handle]`)

Public. Anyone with the link can see.

1. Avatar, handle (or real name if opted in), level, total XP, longest streak
2. Current archetype + "Archetype history" (last 10)
3. Last 10 attempts with scores
4. Highest-scoring attempt (links to share card)
5. Badges earned
6. If viewing someone else's profile: "Challenge this PM" button → takes you to their latest scenario

**[build priority]** Ship basic version in MVP; cut badges if time tight.

---

### S10. Settings (`/settings`)

- Change handle (once every 30 days)
- Toggle "Show real name on profile"
- Change email (via Clerk)
- Delete account
- Feedback textarea → sends to your email

---

## 5. User journeys — end to end

### J1. First-time visitor (signed out)

1. Clicks LinkedIn post → **S1 Landing**
2. Scrolls, sees Today's Case preview + leaderboard
3. Taps "Sign in to play"
4. **S2 Sign-in** → types email → submits
5. Opens email → taps magic link → **S3 Welcome**
6. Types handle, decides on real-name checkbox → taps "Start as Intern"
7. **S4 Inbox** with today's Intern-level scenario
8. Reads → types answer → taps Submit
9. **S5 Judging** → 4 seconds → **S6 Result**
10. Sees score, archetype, roast
11. Taps **Share** → **S7** → native share sheet → posts to LinkedIn
12. Returns to **S6** → taps "Play next" → **S4** loads next scenario
13. After 3 submissions in the current window, sees "Come back at 12pm IST for 3 more 🔥"

**First session:** 4–12 min. **Target:** 15–25% share after first result.

---

### J2. Returning user (next day)

1. Opens URL → **S1 Landing** (sees "Continue playing" top-right)
2. Taps Continue → **S4 Inbox** directly
3. Sees "Day 2 — streak 🔥 2" at top
4. Plays → streak updates → 🔥 3 days
5. If they hit the cap in the morning window, sees "Next reset: 12pm IST"
6. Can come back at 12pm for 3 more

**Target:** 30–40% day-2 return.

---

### J3. Share-click-to-play (the viral loop)

1. User A plays, gets "The Discovery Nerd" archetype, posts to LinkedIn
2. User B sees post, intrigued by label, clicks image
3. Lands on `prodsim.com/play/[attemptId_of_userA]` — public share card
4. Sees User A's score, archetype, rubric, roast. Answer text is hidden (privacy).
5. **"Challenge [User A's handle] →"** primary CTA
6. Taps → **S2 Sign-in** → J1 flow from step 4
7. On User B's first result, S6 shows: **"You scored 82. [User A] scored 87. Rematch?"**
8. User B now shows up in User A's "Your Challengers" tab on S8

---

### J4. Level-up + Boss Fight

**Trigger:** User hits XP threshold for next level.

**L1→L2 (300 XP) and L2→L3 (800 XP) only in MVP.** L3→L4 through L7→L8 auto-level without boss fight.

1. On the submit that pushes them over the threshold, **S6 Result** loads normally
2. After result animation completes, a boss fight card slides in from bottom
3. **"Boss Fight: Your skip-level VP (Sam) wants to see you prove yourself."**
4. "Accept" button (disabled until they've read it for 2 seconds — prevents accidental tap)
5. On accept: a harder "challenge scenario" loads
6. Composite must be ≥14/20, no single dimension <3
7. **Pass:** level-up animation, badge "Cleared Boss: Sam" earned
8. **Fail:** "Sam wasn't convinced. Try again in 24 hours." Retry allowed tomorrow.
9. Boss fights count against the play window cap. (If this feels punishing in testing, change to "boss fights are free" — TBD during Saturday playtest.)

---

### J5. Edge cases

| Situation | Handling |
|---|---|
| Empty answer | Submit disabled; can't happen |
| 5-word answer | Graded; likely low score + "A real answer would have…" |
| Claude times out >10s | `status: error`; "The Principal is on lunch. Try again." Free retry, doesn't count against cap. |
| Unparseable JSON from Claude | Same as timeout |
| Closes tab during judging | Completes server-side; result visible on return |
| Daily cap hits mid-scenario | Current scenario finishes; cap blocks *next* submit |
| Two submits same second | Convex handles; leaderboard orders by timestamp |
| Nonsense answer ("asdf") | Scores 5–15; feedback: "This doesn't address the scenario" |
| Broken scenario | Admin sets `hidden: true` in Convex dashboard; disappears |
| Viewing someone else's attempt URL | Read-only S6 view; answer text hidden for privacy |
| User opts into real name, then changes mind | Toggle off in S10; updates live across leaderboard & profile |
| Play windows span midnight | Cap resets exactly at 12:00:00 IST; server is source of truth (uses Convex cron for reset logic) |

---

## 6. Data model (Convex tables)

- `users` — handle, email, name (nullable), showRealName (bool), level, totalXP, streak, longestStreak, currentArchetype, createdAt
- `scenarios` — title, body, rubric, level, difficulty, octalysisDrive, activeDate, isBossScenario (bool), hidden (bool)
- `attempts` — userId, scenarioId, answer, status (pending|scored|error), overallScore, dimensionScores (4 required + 4 optional), archetype, roast, coachingNote, whatWouldMakeThisA5, xpAwarded, createdAt
- `bossFights` — userId, fromLevel, toLevel, scenarioId, attemptId, passed, retryAvailableAt
- `playWindows` — userId, windowStart (timestamp of either 12am or 12pm IST), playsUsed (0–3)
- `challenges` — challengerUserId, challengedUserId, attemptId, accepted (bool), resultAttemptId (nullable)

**What Claude knows when grading:** scenario + rubric + user's answer + user's current level
**What Claude does NOT know:** previous attempts, archetype history, leaderboard position

---

## 7. Scoring math

- 4 dimensions graded 1–5 by Claude (4 optional sub-dimensions: graded 0–5, nullable if Claude doesn't return them)
- **Overall score** = sum of 4 main dimensions × 5 (max 100)
- **XP** = base_XP × (score/100) × streak_multiplier
  - base: Easy 100, Medium 200, Hard 400, Boss 800
  - streak_multiplier: 1.0 / 1.1 (3+ days) / 1.25 (7+) / 1.5 (30+)
- **Level thresholds:** L1:0 | L2:300 | L3:800 | L4:1800 | L5:3600 | L6:6500 | L7:11000 | L8:18000
- **Current archetype** = most common in last 5 attempts

---

## 8. MVP vs cut list

**Must ship by Sunday 4pm IST:**
- Auth (S2 magic link via Clerk)
- S1, S3, S4, S5, S6, S7, S8 screens
- Play window logic (2x/day reset at 12am/12pm IST, 3 plays per window)
- One scenario flow end-to-end
- 16 scenarios seeded (2 per level, difficulty mix)
- Share card PNG generation + native share
- Reactive leaderboard
- Streak counter
- Real-name opt-in
- Boss fights for L1→L2 and L2→L3
- Challenge-a-friend URL (J3)

**Nice-to-have (cut if tight):**
- S9 Profile page (basic version only)
- Badges
- "Replay past scenarios"
- Sub-dimensions expansion on S6
- "Your Challengers" tab on leaderboard

**Explicitly out of scope:**
- Mobile native app
- Any payment flow, Stripe, paywalls, upgrade CTAs
- Admin panel for scenarios (use Convex dashboard)
- Email notifications
- Real-time multiplayer
- User-generated scenarios
- Teams/cohorts

---

## 9. Why this wins

1. **Business number:** "PMs learn on the job at cost to their company. ProdSim gives them 100 reps before their next real decision."
2. **Submission template:** Live link + 2-min Loom + 5 testers + "4 would pay" quote
3. **Depth on one mechanic:** The AI judge. Test on 20 answers before polishing anything else.
4. **Virality = share card.** Spotify Wrapped quality. Designed before coded.
5. **Octalysis mapping:** Every level activates a different core drive.

---

## 10. Source library for scenario authoring

Pull from:
- Lenny's Newsletter and Shreyas Doshi's threads (prioritization, saying no, stakeholder mgmt)
- Gibson Biddle's DHM cases (Netflix, Chegg — strategy/tradeoff)
- Reforge case studies (growth, retention, monetization with real data)
- "Inspired" (Marty Cagan) and "The Mom Test" (Rob Fitzpatrick) — discovery & insight
- Product Hunt & TechCrunch postmortems — "what would you do differently?" cases
- Stratechery (Ben Thompson) — platform strategy and business model
- Exponent, Product Alliance, "Decode and Conquer" (Lewis Lin) — pre-structured decision scenarios

Each scenario must have: **one stakeholder conflict + one data ambiguity.** Generic optimization puzzles are boring.

---

*v2 locked. When you say go, I'll walk you through using this to scaffold the app via Claude Code.*
