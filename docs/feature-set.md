# Rooted — Full Feature Set

*July 2026. The single scope document: everything the app does today, everything planned, and
everything deliberately rejected — with each item's status and source.*

**How this doc relates to the others:**

- `docs/source-of-truth/` describes what **is** (canonical; wins on any conflict about current
  behavior).
- `docs/prd.md` is the original MVP PRD (Dec 2025) — partially superseded; where it conflicts
  with this doc (e.g. plant death), this doc reflects the ratified decision.
- `docs/BACKLOG.md` is the running idea list; items promoted here keep their backlog entry until built.
- The four research docs (`pricing-model-research.md`, `widgetable-competitive-analysis.md`,
  `real-contact-apps-research.md`, `competitive-feature-analysis.md`) are the evidence base.
- An external market-research outline (July 2026, produced without codebase visibility) was
  merged into this doc; §7 records where it was adopted, adapted, or rejected.

**Status legend:** ✅ Shipped · 🔨 Partial · 📋 Planned (committed direction) · 💡 Proposed
(needs ratification) · ❌ Anti-feature (deliberately not building)

---

## 1. Product definition

**One-liner:** Dedicate a plant to each person you love. Real calls, hangouts, and check-ins keep
it thriving; neglect makes it wilt — **never die**. When both people have the app, plants link —
unlocking shared logging, themed nudges, and a private photo memory wall for the friendship.

**Problem:** People want to stay close to their people, but existing tools are either clinical
reminder CRMs with no retention loop (Fabriq, Garden, Dex) or engagement-farming digital pets
decoupled from real connection (Widgetable, Pou).

**Positioning:** The only product at the intersection of *real-world connection tracking* ×
*emotional caretaking game* × *relationship memory archive*. Market it as a cozy garden game that
happens to strengthen friendships — never as a friendship-maintenance tool (the "stay in touch"
utility framing is the documented graveyard; see `real-contact-apps-research.md` §2).

**Strategic thesis:** Single-player utility drives acquisition (no cold start — your friend
doesn't need an account for you to log that you called them). Linked plants and accumulated
memories drive retention and defensibility. **Linking is the product; solo is the funnel.**

**Relationship states:** every plant is either **Solo** (only you have the app) or **Linked**
(mutual plants, accounts paired). All Tier 2 features require the Linked state. Every solo
surface advertises its locked Linked counterpart — this is also the invite/referral surface
(`BACKLOG.md` already sketches this: "send them a download link" prompts fill the empty spaces).

**Target user:** *Open conflict, needs a decision* — the PRD targets Gen Z 18–24
(cottagecore/cozy-gaming identity); the external research targets adults 22–40 maintaining
long-distance close relationships (best friends, siblings, parents). These pull in different
directions for tone, invite-volume expectations (invites/user drop ~20% per year of age 13→18),
and pricing power. The overlap — early-20s people with scattered close friends — is the safe
center of mass until ratified.

**Unit of design:** the dyad (you + one person), not the group. Groups ("Grove view") are
explicitly deferred to v2.

**Guardrail metric:** every social mechanic is tested against *"could this make someone feel
guilty for being busy?"* — sentiment-check in beta. Warmth is a release gate, not a vibe.

**North-star metrics:** % of plants Linked · photos per plant · W4 retention of linked vs. solo
users. Downloads are explicitly **not** the north star.

---

## 2. Tier 0 — What exists today (shipped)

The foundation is real: a persistent, per-user solo garden with a closed care loop. Detail lives
in `docs/source-of-truth/`; this is the inventory.

### 2.1 ✅ Isometric garden (the hero surface)
10×10 2:1 isometric tile map; Skia-rendered terrain with RN plant sprites layered above, one
shared camera transform (pan + pinch, measured-container zoom origin). Drag-and-drop plant
placement with tile snapping, green/red validity highlight, occupancy + placement rules
(tilled-soil tiles only, front row reserved). Positions persist per user (`grid_position_x/y`).

### 2.2 ✅ Friend-to-plant system (Solo state)
Add a friend (manual name entry) → set cadence → choose species → they're planted. Friends and
plants persist 1:1 in Supabase (`friends` + `plants`, RLS owner-scoped, invariant
`Plant.id === Friend.id`); all access through `src/lib/garden.ts`. Four starter species today
(cactus, sunflower, monstera, ficus) from `plantCatalog.ts`; the enum already carries 11 types
for expansion.

### 2.3 ✅ Per-friend contact cadence
Weekly / biweekly / monthly per friend, set at creation and editable; decay rate derives from it
(100/7, 100/14, 100/30 per day). **The single most-validated design decision in the app** —
Fabriq's most-requested feature is exactly this (`competitive-feature-analysis.md` §1.6). Do not
regress it.

### 2.4 ✅ Decay + wilt — and death is CUT (ratified)
Hydration decays client-side at load (`effectiveHydration`), refreshes silently on app
foreground, and the DB keeps the last true snapshot. At hydration ≤ 30 the plant wilts (faded
sprite + water-drop badge). **There is no death state** — ratified against the strongest finding
in the competitive research (Plant Nanny removed death; Finch never had it; every death system
in the category is contested). `is_dead` / `death_timestamp` / `revive_logs` are legacy schema —
never build on them. The external research independently reached the same conclusion ("droop,
never die").

### 2.5 ✅ Pause / vacation mode
Settings "Pause Garden" toggle → `set_garden_paused` RPC freezes decay entirely; unpause shifts
every decay clock forward by the pause duration so no decay accrues while away. Table stakes per
the research (§1.2) — shipped. *Refinement owed:* the paused state must be unmistakably visible
in the garden itself (the Habitica "silently disengaged pause" failure), not only in Settings.

### 2.6 ✅ Care loop (manual logging — L3)
Tap a plant in the garden or a friend card in the Friends tab → `PlantInfoPanel` → **Called +40
/ Texted +20 / Hung out +30** → `log_interaction` RPC (weights live in the RPC; client mirrors
for display). Caps at 100, resets the decay clock, appends an `interactions` row, +10 XP.
One-tap, reward-visible logging — "logging is watering, never data entry."
*Not yet wired:* streak updates, evolution progression (the RPC touches neither).

### 2.7 ✅ Garden share snapshot
📸 in the TopBar → native view snapshot (`captureRef`) → `expo-sharing`. The research's
"highest ROI-to-effort gap" (§2.1) — shipped in Batch 3. Must stay a native snapshot (Skia
snapshot would miss the RN plant layer).

### 2.8 ✅ Home-screen widget
Native WidgetKit extension (SwiftUI, iOS 17+), small/medium/large per the ratified 2026-07-20
design: thirstiest-first plant slots, hydration bars, wilt at 55% sprite opacity, paging via App
Intents, deep links (`rooted://plant/<id>`, `rooted://add-friend`). App Group JSON snapshot
synced on every settled garden state; the Swift side recomputes decay hourly with the
`garden.ts` formula.

### 2.9 ✅ Onboarding (10-step, value-before-auth)
Welcome → value prop → education → add first friend → cadence → species picker → celebration →
account creation → complete. The first friend is seeded into the garden at signup (requires
email confirmation disabled). *Gap vs. the target:* the first **care action** does not yet
happen inside onboarding (§3.1).

### 2.10 ✅ App shell
Bottom-tab navigation (Garden · Friends · Settings) with pushed flow screens; Supabase auth
gate; pixel design system (theme tokens, VT323/Rubik/Nunito, `PixelIcon` — emoji banned as UI);
Help screen with icon-library attribution.

### Known debts inherited by everything below
- **No offline queue** — a logged interaction on a flaky connection can fail; research calls a
  lost care action "theft" (§1.4). Foundation work, not polish.
- **No notifications of any kind** (`notifications_enabled` column exists, unused).
- **No streak/evolution progression** despite schema support.
- `artifact_templates` has no RLS; `decorative_items` grid CHECKs still `<= 5`;
  `update_plant_hydration()` death check is broken (moot — death is cut).

---

## 3. Tier 1 — Solo garden completion (P0)

Closing the gap between what's shipped and a launch-complete solo product. Sources: external
research Tier 1, `BACKLOG.md`, competitive research MUST/SHOULD lists.

### 3.1 📋 Dedication onboarding (upgrade)
- **First care action inside onboarding** — the user waters their first plant before onboarding
  ends (Finch pattern: the "aha" happens in session one). Currently the seed plants but is never
  watered.
- **Contact picker as an option, never a requirement** — manual entry stays the primary path
  (iOS 18 contact-sharing collapse makes address-book flows a depreciating asset). Permissions
  requested in context, framed in-theme, only after value is shown.
- Species map to relationship archetypes (open question: how many at launch; are archetypes
  user-legible?).

### 3.2 📋 The trust ladder (connection logging levels)
- **L3 Manual** ✅ shipped (§2.6). Rule, permanent: **no verification is ever required for credit.**
- **L2 Suggested** 📋 — calendar events matching a friend's name trigger a "did you see Maya?"
  confirm card. Also: the BACKLOG's reminder-first flow ("You haven't contacted [friend] this
  week" → *Already contacted them* / *Call* / *Text* deep links / dismiss) — making the app the
  prompt for the behavior, not just the scorekeeper.
- **L1 Auto** 💡 spike-gated — in-app "Call" button → `tel:` / FaceTime deep link →
  CXCallObserver infers the call happened → auto-water. **The spike result gates whether this is
  a launch feature or a fast-follow; ship manual-first regardless** (Fabriq proves manual-only
  can be loved). No call/SMS *log* access exists on iOS — never claim or attempt it; all
  inference comes from app-initiated actions only.

### 3.3 💡 Interaction weighting rework
Two unresolved pulls, one decision to make:
- External research + Snap's hollow-streak failure: effort should rank **in-person > long call >
  short call > text** — but today Hung out (+30) sits *below* Called (+40).
- BACKLOG's simplification question: drop "Texted" entirely, or collapse to Contact/Hangout.
Whatever lands: the RPC CASE stays the single source of truth, the client mirror follows, and a
zero-content action must never be the optimal play.

### 3.4 💡 Plant state ladder & lapse framing
External proposal: **Thriving → Content → Drooping → Dormant** (vs. today's binary healthy/wilt
at ≤ 30). Lapse framing is **seasons, not streaks**: dormancy ends in visible spring regrowth on
return — absence is a season, never a failure. Needs design; pairs with the streak decision
(§3.5).

### 3.5 💡 Streaks / consistency — redesign before wiring
Schema has `streak_count` and the PRD assumed streaks, but nothing updates them — which is the
right accident: the research is two-minded (Duolingo +22% mutual accountability vs. Snap-streak
obligation anxiety), and the external doc says seasons-not-streaks. Decide the consistency
mechanic (streaks, growth stages, bloom milestones, or seasons) **before** writing the RPC code.
Evolution stages (sprout/young/mature, in schema, never progressed) fold into the same decision.

### 3.6 📋 Plant journal (CRM layer, Fabriq parity)
Per-friend: dated events (birthdays, milestones) surfaced as in-theme reminders; freeform notes;
post-call capture prompt ("anything to remember?"); gift ideas. All metadata rendered in-theme
(tags on the pot, rings in the trunk) — one layer below the hero view, never a form-first CRM
screen. `BACKLOG.md`'s friend-birthdays entry (nullable `birthday` on `friends`, garden-surfaced
celebration with party sprites) is the first slice.

### 3.7 📋 Photo memories (solo half)
Optional photo prompt when logging an in-person hangout; per-plant private memory wall,
chronological, unpolished/BeReal framing. Private by default; becomes pair-visible on Link with
explicit per-photo retroactive opt-in (§4.4). Already sketched in `BACKLOG.md`. Open: Supabase
Storage bucket + RLS design, free-tier storage cap (drives COGS and the premium boundary).

### 3.8 📋 Notifications (plant-voiced, capped, state-aware)
Nothing exists today. The research corrects the assumption that reminder apps suffer notification
backlash — Fabriq's "nag notifications" are its most-praised feature. Spec:
- Warm, plant-voiced, never guilt: *"Maya's fern misses the sun"*, never *"You haven't called in
  12 days"* / no personified reproach / no loss countdowns.
- Frequency capped, tied to decay state; prefer one morning digest over N separate wilt pushes.
- **Never fire for a friend the user already contacted** since the nudge was scheduled.
- Per-category opt-out from day one (hydration / milestones / social / product).
- Live Activity during in-app-initiated calls (with §3.2 L1).

### 3.9 📋 Offline-tolerant logging
Queue care actions locally, reconcile on reconnect, never fail silently. Prerequisite for trust
(§1.4 of the competitive research); should land before notifications drive re-engagement spikes.

### 3.10 💡 Garden triage view
As plant counts grow, the Garden needs a collection/triage read ("who needs me?") beyond the
widget's thirstiest-first sort — the Friends tab partially serves this today. Includes the
inventory/bulk-QoL warning from research §2.7: collection-management friction is cheap to build
early, miserable to retrofit.

---

## 4. Tier 2 — Linked Plants (P0 mechanics, P1 polish)

The defensibility layer. Everything here requires both people on the app (Linked state).
Extends `BACKLOG.md`'s "two-sided features" sketch into a full mechanic set. **Activation goal:
first invite sent in week 1** — race users to the Linked state, but never gate on it (the Lapse
forced-invite collapse is the anti-pattern; invites belong at first-value, not signup).

### 4.1 📋 Linking
- Invite via per-friend link/QR (personal by design: *"Sarah, you're a monstera in my garden"*)
  — never an address-book scrape.
- Accept → plants pair and visibly **intertwine** (graft animation; vine growth deepens with
  relationship history).
- Deferred deep links that survive the App Store round-trip (Locket's cold-install invite loss
  is a self-inflicted funnel leak — build this correctly from day one).
- Solo surfaces advertise the locked state (grayed vines, undeliverable-butterfly messaging).
- Open question: what does a solo user see about someone who declined/ignored an invite?
  (Asymmetry must never shame either side.)

### 4.2 📋 Shared logging
Either person logs → both plant states update. Duplicate logs within a window merge into one
event. This is the Duolingo mutual-accountability loop (+22% measured) applied to the friendship
itself.

### 4.3 📋 Themed nudges (async, sub-messaging weight)
Sunlight = thinking of you · Rain = rough week / miss you · Butterfly = "reminded me of you"
(may carry a photo/note) · Falling leaf = "it's been a while, no pressure" · Ladybug = playful
poke. Delivered as ambient animation on the recipient's plant + soft notification. **Explicitly
not a chat** — no threads, no read receipts. ⚠️ Research warning: a thin social layer is worse
than none (Tamagotchi's one-Heart-a-day, Pocket Camp's do-nothing Kudos). The nudge set must
feel expressive and reciprocal or it shouldn't ship.

### 4.4 📋 Dual photo moments
Both log the same hangout → both prompted → composite side-by-side memory card saved to both
walls. The memory archive is moat #1: per-relationship accumulated history is an emotional
switching cost no incumbent can copy.

### 4.5 💡 Shared growth mechanics
- **Bloom events:** anniversaries, birthdays, consistency milestones → permanent rare flowers on
  the linked plant (permanent unlocks, never lost — the artifact principle).
- **Co-op goals:** mutually set cadence intentions; sustained success grows fruit → harvestable
  keepsake cards. ⚠️ Must never be all-or-nothing punishment (Forest's "one person gives up,
  everyone's tree dies" is the documented coercive-reciprocity failure).
- **Time-capsule seeds:** bury a note/photo/voice memo; unlocks on a chosen date.
- **Ambient presence (opt-in):** partner's local weather/mood renders as the sky over their
  plant.

### 4.6 💡 Async read-only garden visiting
From the competitive research (§2.2), complements linking: share a read-only snapshot of your
garden via code (ACNH Dream Suite architecture — nothing can be trampled, zero obligation,
async only).

---

## 5. Tier 3 — Growth & revenue layer (P1–P2)

- 📋 **Garden Almanac** — seasonal/yearly per-plant + whole-garden recap ("you contacted 12
  friends this month, up from 7"), shareable card exports. The organic-acquisition engine and
  the retrospective-stats surface the research says every comparable under-ships (§2.5).
- 💡 **Second-order collectibles** — keepsake artifacts that only drop after N real hangouts
  with a specific friend (the dormant `artifacts` / `artifact_templates` tables are exactly this
  shape). A collectible no competitor can copy, because it requires the real relationship.
- 💡 **Gifting economy** — pots, charms, decor: earnable and purchasable, sendable between
  linked users. Prefer *instrumental* decoration (arrangement affects which variants can grow —
  Neko Atsume's lesson) over pure paint; earned variety converts better than bought.
- 💡 **Postcard exports** — memory cards → digital export (P1), printed mail (P2, premium).
- 💡 **Voice-note watering (P2)** — a recorded message waters their plant, plays as
  wind-through-leaves. Deferred: storage cost + moderation.
- ❌→v2 **Grove view** — shared family/group plots. Explicitly out of scope for launch; the dyad
  is the unit of design.

---

## 6. Monetization

Model A from `pricing-model-research.md` (generous freemium + one subscription), adjusted for
the death cut. Hard rules first — these are brand-load-bearing:

> **Never paywall the care loop, nudge receiving, or state recovery. Never place money between
> a user and a living plant. No ads, ever. No data selling.** Privacy and no-ads are marketing
> weapons against Widgetable, not just ethics.

- **Free tier:** the entire core loop forever — logging, decay, wilt recovery, pause, linking,
  receiving all nudges — plus standard species and capped photo storage. **Plant cap: open
  conflict.** External research says ~5; our own competitive research says 10 is already too low
  and 20–25 is the defensible floor, framed as intimacy (Locket) rather than scarcity (Fabriq's
  walked-back 50). Resolve with beta data (tune to the ~85th–90th percentile of plants-per-user);
  until then the working floor is 20.
- **Premium ("Garden Pass"):** unlimited plants, rare species + cosmetics, full memory storage,
  time capsules, Almanac history, printed postcards. **Price: open conflict** — internal
  research anchors $4.99/mo / $29.99/yr (Widgetable-adjacent cozy-novelty ceiling); external
  research proposes $39.99–49.99/yr (Fabriq/utility anchor). The answer follows the
  target-audience decision (§1); the memory archive + linked features justify drifting upward
  over time, not at launch.
- **Dead SKUs:** the $0.99 premium revive is void — death is cut, so there is nothing to revive.
  (Its validated cousin survives as *streak/season freeze inside the subscription* if a
  consistency mechanic ships.) No purchasable coin packs; an earned-only cosmetic currency is
  fine. Never sell growth speed — a mature plant must always mean the friendship was actually
  kept.

---

## 7. External research — alignment record

Where the July 2026 external outline (no codebase visibility) was adopted, adapted, or rejected:

| External item | Disposition |
|---|---|
| Never-die / droop-only plants | ✅ Already ratified and shipped (Batch 4) — independent convergence |
| Solo vs. Linked relationship states; "linking is the product" | ✅ Adopted as the organizing frame (§1, §4); matches BACKLOG's two-sided sketch and research §2.6 |
| Tier 1 solo features (trust ladder, journal, photos, notifications) | ✅ Adopted; several are further along than the outline assumed (care loop, pause, widget, share all shipped) |
| Widgets, Live Activity | 🔨 Widget already shipped; Live Activity folds into the L1 call spike |
| "Value before permission prompt" onboarding | ✅ Already the shipped pattern; first-care-action gap adopted (§3.1) |
| Thriving/Content/Drooping/Dormant + seasons-not-streaks | 💡 Adopted as proposal (§3.4–3.5) — needs design against existing wilt threshold and dormant streak schema |
| Effort weighting (in-person highest) | 💡 Adopted as an open rework (§3.3) — conflicts with current +40 call / +30 hangout |
| Themed nudges, dual photos, blooms, co-op fruit, time capsules, ambient presence | ✅ Adopted (§4.3–4.5) with the thin-social-layer and all-or-nothing warnings attached |
| Tier 3 (Almanac, gifting, postcards, voice notes, Grove-v2 deferral) | ✅ Adopted (§5) |
| Free cap ~5 plants | ❌ Rejected — directly contradicts competitive finding that 10 is too low; working floor 20, tune in beta (§6) |
| $39.99–49.99/yr pricing | ⚠️ Held as open conflict vs. researched $29.99/yr; follows the audience decision (§6) |
| Target: adults 22–40 | ⚠️ Held as open conflict vs. PRD's Gen Z 18–24 (§1) |
| E2E-scoped dyad photos; deletion propagates; unlink archives (not exposes) shared content | ✅ Adopted as privacy requirements (§8) |
| CallKit spike gating auto-watering | ✅ Adopted verbatim (§3.2, §9) |
| "Garden" naming collision risk | n/a — we're Rooted; the abandoned *Garden: Stay in Touch* app is a graveyard datapoint, not a conflict |

Anti-features (from `competitive-feature-analysis.md` §3, unchanged and binding): ❌ plant death
or any paid recovery · ❌ hollow-action streaks · ❌ guilt-trip notification copy · ❌ ads
anywhere (especially the care loop) · ❌ low free caps framed as scarcity · ❌ forced-invite
gates · ❌ "come back tomorrow" rate limits · ❌ thin social gestures · ❌ all-or-nothing group
punishment · ❌ global leaderboards.

---

## 8. Data & privacy requirements

- **No call/SMS log access exists on iOS** — never claim or attempt it. All inference from
  app-initiated actions only.
- Contacts access optional forever; the manual add path is permanent.
- Photos and notes are scoped to the dyad; deletion propagates to both sides; **unlinking
  archives shared content, never exposes it**.
- No third-party tracking; the privacy stance is marketing (Marco Polo precedent).
- Existing schema debts to close before Tier 2: `artifact_templates` RLS,
  `decorative_items` grid CHECKs, retiring the legacy death columns.

---

## 9. Open questions

1. **CallKit CXCallObserver background reliability** — the spike that gates L1 auto-watering
   (launch feature vs. fast-follow). The single most roadmap-shaping unknown, flagged
   identically by both internal and external research.
2. **Target audience** — Gen Z 18–24 vs. adults 22–40 (drives tone, pricing, invite modeling).
3. **Consistency mechanic** — streaks vs. seasons vs. blooms; what (if anything) wires
   `streak_count` and `evolution_stage`.
4. **Interaction weights** — in-person-first re-ranking and/or type simplification (§3.3).
5. **Species taxonomy** — how many at launch; are relationship archetypes user-legible?
6. **Linking asymmetry** — what the solo user sees about a declined/ignored invite.
7. **Photo storage architecture and the free-tier cap** — drives COGS and the premium boundary.
8. **Free plant cap and Garden Pass price** — resolve with beta distribution data (§6).

---

## 10. Status matrix

| Feature | Tier | Status |
|---|---|---|
| Isometric garden (render, camera, drag, placement) | 0 | ✅ |
| Friends + plants persistence (Supabase, RLS) | 0 | ✅ |
| Per-friend contact cadence → decay rate | 0 | ✅ |
| Client-side decay + wilt (no death — ratified) | 0 | ✅ |
| Pause / vacation freeze | 0 | ✅ (visibility refinement owed) |
| Manual care loop (log → hydrate → reward) | 0 | ✅ (no streak/evolution updates) |
| Garden share snapshot | 0 | ✅ |
| Home-screen widget (3 sizes, deep links) | 0 | ✅ |
| 10-step value-first onboarding + first-friend seed | 0 | ✅ |
| Tabs, auth gate, pixel design system | 0 | ✅ |
| First care action inside onboarding | 1 | 📋 |
| Contact picker (optional) | 1 | 📋 |
| Reminder-first nudge flow (L2) + calendar confirm cards | 1 | 📋 |
| Auto-detected calls (L1, CallKit) | 1 | 💡 spike-gated |
| Interaction weight rework / simplification | 1 | 💡 |
| Plant state ladder + seasons framing | 1 | 💡 |
| Consistency mechanic (streaks/seasons/blooms) | 1 | 💡 |
| Plant journal (notes, birthdays, milestones, gifts) | 1 | 📋 |
| Photo memories (solo wall) | 1 | 📋 |
| Notifications (plant-voiced, capped, state-aware) | 1 | 📋 |
| Offline-tolerant logging queue | 1 | 📋 |
| Garden triage view + collection QoL | 1 | 💡 |
| Linking (invite link/QR, graft animation, locked-state ads) | 2 | 📋 |
| Shared logging with merge | 2 | 📋 |
| Themed nudges (sunlight/rain/butterfly/leaf/ladybug) | 2 | 📋 |
| Dual photo moments (composite memory cards) | 2 | 📋 |
| Bloom events / co-op goals / time capsules / ambient presence | 2 | 💡 |
| Async read-only garden visiting (dream codes) | 2 | 💡 |
| Garden Almanac + shareable recap cards | 3 | 📋 |
| Relationship-gated collectibles (artifacts tables) | 3 | 💡 |
| Gifting economy / instrumental decor | 3 | 💡 |
| Postcard exports (digital → printed) | 3 | 💡 |
| Voice-note watering | 3 | 💡 (P2, deferred) |
| Grove view (groups) | v2 | deferred |
| Garden Pass subscription + free tier | 3 | 📋 (cap & price open) |
| Plant death, paid revives, ads, forced invites, hollow streaks, guilt copy | — | ❌ never |
