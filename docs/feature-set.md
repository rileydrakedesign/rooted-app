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
- Two external documents (both July 2026, produced without codebase visibility) were merged into
  this doc: a market-research outline (Tiers 1–3 framing) and a **Gamification & Economy Layer
  spec v0.2** (Tier 4). §8 records where each was adopted, adapted, or rejected.

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
memories drive retention and defensibility. **Linking is the product; solo is the funnel.** The
economy layer (Tier 4) reinforces both: real connection is the only currency mint, and co-op
always out-earns solo.

**Relationship states:** every plant is either **Solo** (only you have the app) or **Linked**
(mutual plants, accounts paired). All Tier 2 features require the Linked state. Every solo
surface advertises its locked Linked counterpart — this is also the invite/referral surface
(`BACKLOG.md` already sketches this: "send them a download link" prompts fill the empty spaces).
Linked and solo plants carry different upgrade catalogs (§6.3): Linked unlocks the Gift and
Shared purchase scopes plus linked-only functional items.

**Target user:** *Open conflict, needs a decision* — the PRD targets Gen Z 18–24
(cottagecore/cozy-gaming identity); the external research targets adults 22–40 maintaining
long-distance close relationships (best friends, siblings, parents). These pull in different
directions for tone, invite-volume expectations (invites/user drop ~20% per year of age 13→18),
and pricing power. The overlap — early-20s people with scattered close friends — is the safe
center of mass until ratified.

**Unit of design:** the dyad (you + one person), not the group. Groups ("Grove view") are
explicitly deferred to v2. The link lives at the **plant level**; the garden is always
**personal** — there is no relationship-type zoning, and garden-wide upgrades are never shared.

**Guardrail metric:** every social mechanic is tested against *"could this make someone feel
guilty for being busy?"* — sentiment-check in beta. Warmth is a release gate, not a vibe. This
gate applies to every economy mechanic too (§6.8).

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
never build on them. Both external docs independently reached the same conclusion ("droop,
never die"; the economy spec's "revival" is a wilt-recovery, not a resurrection — see §6.7).

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
*Not yet wired:* streak updates, evolution progression (the RPC touches neither). The
append-only `interactions` table is also the natural event stream for the Tier 4 points ledger
(§6.5) — one log event, two effects.

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
- **Single hardcoded map** — `exampleMap` is imported directly by `GardenContext` and
  `DraggablePlant`; a second map breaks validation and hit-testing (`GARDEN.md`). Must be fixed
  before garden themes/terrain variants (§6.4) can exist.
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

The trust ladder is load-bearing for Tier 4: currency minting (§6.5) mirrors it 1:1 and reuses
the same event stream — one logging pipeline feeds hydration, memories, and points.

### 3.3 💡 Interaction weighting rework
Two unresolved pulls, one decision to make:
- External research + Snap's hollow-streak failure: effort should rank **in-person > long call >
  short call > text** — but today Hung out (+30) sits *below* Called (+40).
- BACKLOG's simplification question: drop "Texted" entirely, or collapse to Contact/Hangout.
Whatever lands: the RPC CASE stays the single source of truth, the client mirror follows, and a
zero-content action must never be the optimal play. The economy spec assumes the
in-person-first ranking for point minting, which raises the stakes on settling this before
Tier 4 Phase 1.

### 3.4 💡 Plant state ladder & lapse framing
External proposal: **Thriving → Content → Drooping → Dormant** (vs. today's binary healthy/wilt
at ≤ 30). Lapse framing is **seasons, not streaks**: dormancy ends in visible spring regrowth on
return — absence is a season, never a failure. Needs design; pairs with the consistency decision
(§3.5) and is a hard prerequisite for restorations (§6.7), which are defined against the
Drooping/Dormant states.

### 3.5 💡 Consistency mechanic — the economy spec proposes the answer
Schema has `streak_count` and the PRD assumed streaks, but nothing updates them — which was the
right accident: the research is two-minded (Duolingo +22% mutual accountability vs. Snap-streak
obligation anxiety), and the external outline said seasons-not-streaks. **The Tier 4 economy
spec now offers a concrete resolution to ratify:** hitting per-plant cadence goals N periods
running pays escalating point bonuses ("seasons of growth"), and missed cadence **decays the
bonus gradually — never a cliff-edge reset**. Soft failure keeps the motivational pull of
streaks while deleting the anxiety mechanics the research warns about. If ratified, this becomes
the headline earner of the economy (§6.5) and finally gives `streak_count` (or a successor
column) a job. Evolution stages (sprout/young/mature, in schema, never progressed) fold into the
same decision.

### 3.6 📋 Plant journal (CRM layer, Fabriq parity)
Per-friend: dated events (birthdays, milestones) surfaced as in-theme reminders; freeform notes;
post-call capture prompt ("anything to remember?"); gift ideas. All metadata rendered in-theme
(tags on the pot, rings in the trunk) — one layer below the hero view, never a form-first CRM
screen. `BACKLOG.md`'s friend-birthdays entry (nullable `birthday` on `friends`, garden-surfaced
celebration with party sprites) is the first slice. **The base journal is free, permanently** —
Tier 4 sells journal *expansions* (§6.3), never the journal itself.

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
(§1.4 of the competitive research); doubly load-bearing once logging also mints currency — a
lost care action that also loses points is theft twice.

### 3.10 💡 Garden triage view
As plant counts grow, the Garden needs a collection/triage read ("who needs me?") beyond the
widget's thirstiest-first sort — the Friends tab partially serves this today. Includes the
inventory/bulk-QoL warning from research §2.7: collection-management friction is cheap to build
early, miserable to retrofit. *Note:* Tier 4's Helpers (§6.6) propose delivering this as a
character ("the hedgehog flags who needs you today") — build the underlying "needs you" query
once and let the helper be its friendly face.

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
itself. With Tier 4: both parties earn on a linked event, and co-op always out-earns solo —
the economy is a second engine pushing users toward the Linked state.

### 4.3 📋 Themed nudges (async, sub-messaging weight)
Sunlight = thinking of you · Rain = rough week / miss you · Butterfly = "reminded me of you"
(may carry a photo/note) · Falling leaf = "it's been a while, no pressure" · Ladybug = playful
poke. Delivered as ambient animation on the recipient's plant + soft notification. **Explicitly
not a chat** — no threads, no read receipts. ⚠️ Research warning: a thin social layer is worse
than none (Tamagotchi's one-Heart-a-day, Pocket Camp's do-nothing Kudos). Tier 4's message
actions (§6.3) are the direct answer: songs, images, remote plant actions, and haptic
signatures make this layer expressive enough to earn its place.

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
- **Time-capsule seeds:** bury a note/photo/voice memo; unlocks on a chosen date. Purchasable
  per-plant capsule *slots* live in the economy (§6.3); the points-vs-premium boundary is open
  (§10.15).
- **Ambient presence (opt-in):** partner's local weather/mood renders as the sky over their
  plant.

### 4.6 💡 Async read-only garden visiting
From the competitive research (§2.2), complements linking: share a read-only snapshot of your
garden via code (ACNH Dream Suite architecture — nothing can be trampled, zero obligation,
async only). *Interaction with Tier 4:* reactive assets must not leak specific-plant state to
visitors (§6.4, §10.14).

---

## 5. Tier 3 — Growth & revenue layer (P1–P2)

- 📋 **Garden Almanac** — seasonal/yearly per-plant + whole-garden recap ("you contacted 12
  friends this month, up from 7"), shareable card exports. The organic-acquisition engine and
  the retrospective-stats surface the research says every comparable under-ships (§2.5).
- 💡 **Postcard exports** — memory cards → digital export (P1), printed mail (P2, premium).
- 💡 **Voice-note watering (P2)** — a recorded message waters their plant, plays as
  wind-through-leaves. Deferred: storage cost + moderation.
- ❌→v2 **Grove view** — shared family/group plots. Explicitly out of scope for launch; the dyad
  is the unit of design.

*Absorbed into Tier 4:* the earlier "gifting economy," "instrumental decor," and
"relationship-gated collectibles" entries are now fully specified by the Garden Economy —
gifting is the Gift purchase scope (§6.2), decor is §6.4, collectibles are §6.6's loot layer.

---

## 6. Tier 4 — Garden Economy (gamification layer)

Merged from the external **Gamification & Economy Layer spec v0.2** (July 2026). A
garden-maintenance and upgrade economy layered on top of the connection core: real-world
connection is the **only** source of currency, and all spending flows back into expression, care
context, or the relationship itself. Reference systems: PvZ Zen Garden (care-conversion
economy), Pikmin Bloom (real behavior as sole fuel), Neko Atsume (reactive ambient life,
mementos), Gardenscapes (space/decoration progression), Finch & Forest (effort-weighted earning,
cosmetic-only spending). Anti-pattern: Habitica (mechanics divorced from the underlying
behavior).

**Depends on:** the trust ladder event stream (§3.2), the consistency-mechanic decision (§3.5),
the plant state ladder (§3.4 — restorations are defined against Drooping/Dormant), and linking
(§4.1) for everything in the Gift/Shared scopes.

### 6.1 Design laws (non-negotiable)

1. **Points are minted only by connection.** No login rewards, no ads, no purchasable points.
2. **Nothing purchasable substitutes for care.** Restorations recover visual state and reset
   the clock; only a human interaction grows a plant.
3. **Spending points outward.** The best sinks make the next real interaction easier, richer,
   or kinder (gifts, restorations, music, capsules).
4. **Soft failure.** Broken consistency decays bonuses gradually — never cliff-edge resets
   (the anti-Snapchat-streak rule). Restorations + gradual decay are the forgiving retention pair.
5. **Money never buys points, and the free recovery path stays primary.** *(Added on merge —
   this is how the economy coexists with the binding "never paywall state recovery"
   anti-feature: points come only from connecting, cash comes nowhere near recovery, and
   logging a real contact always remains the most prominent way to bring a plant back.)*

Laws 1–3 are the pricing research's Model C conclusion ("earned-only currency, never sell coins,
never sell growth speed") arrived at independently — the two documents lock together.

### 6.2 Ownership & scoping model

The link lives at the **plant level**; the garden is always **personal**.

| Scope | Meaning | Applies to |
|---|---|---|
| **Self** | Affects only your garden / your view | All categories |
| **Gift** | Purchased for your linked partner's side; arrives tagged ("from Sam") and pings their plant | Plant upgrades, Helpers, Restorations |
| **Shared** | One purchase manifests on both sides of a linked plant simultaneously; some items exclusive to this scope | Plant upgrades only |

- Garden upgrades and static assets: **Self only** — the garden is private space.
- Each plant carries all customization and information for that specific connection; plants are
  separate objects — no relationship-type garden zoning.
- Linked and solo plants have different upgrade catalogs: Linked unlocks Shared and Gift scopes
  plus linked-only functional items. Solo surfaces render the locked catalog as another
  advertise-the-Linked-state moment (§1).

### 6.3 💡 Plant upgrades (Self / Gift / Shared)

**Stylistic:** pots, nameplates, leaf variants, bloom colors; accessories (fairy lights, wind
chimes, charms). Shared-scope "matching set" versions render identically on both linked plants —
the friendship-bracelet pattern. *(Art flows through the existing `mockup-to-sprite` pipeline —
zero-cost generation is what makes a deep catalog feasible; sprite-per-upgrade rendering needs a
plan since plants currently render one static PNG per species.)*

**Functional:**
- **Music Box** *(Shared, linked-only — Phase 4)* — attach a song + short message; the
  recipient's plant dances/sways during playback. Apple Music via MusicKit (song reference sent,
  playback on the recipient's subscription; 30-sec preview fallback); Spotify deep-link
  fast-follow. ⚠️ Native module — requires a dev-build rebuild (`npx expo run:ios`), never
  Expo Go.
- **Message actions** *(linked-only — Phase 3)* — the expressive upgrade to themed nudges
  (§4.3): song sending, image sending (optionally files into the shared memory wall), and
  remote plant actions — trigger the partner plant to shimmer/shake/shimmy with a custom haptic
  pattern (per-friend haptic signatures). Haptic playback on notification interaction or active
  app context; background delivery constraints are open (§10.13). Still explicitly not a chat.
- **Capsule slots** *(Self or Shared)* — purchasable per-plant time-capsule slots (mechanic
  defined in §4.5); points-vs-premium boundary open (§10.15).
- **Journal expansions** *(Self)* — richer per-plant note structures (gift lists, date
  trackers). The base journal (§3.6) is free forever; only expansions are sinks.

### 6.4 💡 Garden upgrades & static assets (Self only)

- **Garden upgrades:** terrain/scene themes (mossy grove, desert bloom, alpine meadow),
  time-of-day and weather moods, seasonal skyboxes, path styles, ambient soundscapes, layout
  slots. Purely expressive — the safest bottomless sink, zero social pressure. *Schema hooks
  already exist* (`garden_layouts.theme`, the `garden_theme` enum); terrain art goes through the
  `new-terrain-tile` pipeline (PixelLab — tessellation requires it). ⚠️ **Engineering
  prerequisite:** the hardcoded single-map assumption (`exampleMap` imported directly by
  `GardenContext` / `DraggablePlant`) must be broken first — today a second map breaks
  validation and hit-testing (`GARDEN.md`).
- **Static assets:** decorative object library — waterfalls, bird feeders, koi ponds, lanterns,
  benches, gnomes, stone arrangements. Maps to the dormant `decorative_items` table (widen its
  `<= 5` grid CHECKs first).
- **Reactive subset:** some assets respond to *overall garden health* without representing any
  person — the bird feeder attracts ambient birds when the garden is healthy; the waterfall
  flows stronger during an active connection week. This is the PRD's garden-level artifacts
  idea reborn, and `artifact_templates.required_avg_hydration` anticipated exactly this signal.
  Open: which health signals drive them without leaking specific-plant state (§10.14) —
  especially once garden visiting (§4.6) exists.

### 6.5 📋 Currency: minting rules (Phase 1 core)

Single earned currency (points), ledgered on the existing append-only `interactions` stream —
one logging pipeline feeds hydration, memories, and points (`plants.total_xp` +10 is the
existing stub in this direction).

**Sources:**
- Connection events, effort-weighted: in-person > long call > short call > light touch —
  mirrors the trust ladder 1:1 and **assumes the §3.3 weighting rework lands first** (today's
  weights rank calls above hangouts, which would mint backwards).
- **Consistency bonuses (headline earner):** per-plant cadence goals hit N periods running pay
  escalating bonuses, framed as "seasons of growth" — this is the §3.5 proposal; gated on that
  ratification.
- **Linked-event bonus:** both parties earn; co-op always out-earns solo (economy pressure
  toward the Linked state, aligned with the strategic thesis).
- **Milestone drops:** first call of the year, birthdays remembered, logged-hangout counts.

**Decay:** missed cadence decays consistency bonuses gradually (Design Law 4). Never a reset.

**Explicitly excluded:** daily login rewards, ad rewards, point purchases. Monetization stays
premium subscription + direct cosmetic purchases (§7); earned currency stays meaning-pure.

### 6.6 💡 Helpers & the loot/collection layer

**Helpers** *(Self / Gift — Phase 2)*: garden creatures (gopher, hedgehog) performing
functional-lite services — trim leaves / tidy fallen petals (visual upkeep), flag "who needs you
today" (the §3.10 triage query delivered as a character), unearth old journal notes ("you wrote
this about Sam in March"). Giftable to a linked partner's garden with a planter tag ("planted by
Sam"). **Rule: helpers surface care opportunities; they never perform care** (Design Law 2).

**Loot & collections** *(Phase 4)*: rare drops attached to real moments — first-call-of-year
butterfly, milestone fruit → keepsake cards; seasonal live-ops flora earnable only by connecting
during the event window (holidays double as natural reach-out moments); a collections ladder
where **every rung is a real interaction** — the collectible no competitor can copy without
breaking their economy. The dormant `artifacts` / `artifact_templates` tables are this feature's
schema (close the missing-RLS defect before shipping). Content velocity concern
(`widgetable-competitive-analysis.md`): the free mockup-to-sprite pipeline is what makes
seasonal cadence affordable.

### 6.7 💡 Restorations (the economy spec's "revivals," renamed)

*Terminology matters here:* nothing in Rooted dies, so nothing is "revived." The mechanic is a
**restoration** — a points purchase that recovers a Drooping/Dormant plant to healthy and resets
its decay clock once. Renaming also keeps distance from the legacy death-era `revive_logs`
schema, which stays untouched.

- **Escalating price per repeated use on the same plant** — a bridge back, not a bypass; the
  economy self-corrects because points only come from connecting (you cannot grind restorations
  without doing the thing the app exists for). Curve shape open (§10.12).
- Ships with a built-in reconnection prompt: *"Back on its feet — call Maya this week?"* Copy
  always points at the friend, never at the mechanic.
- **Gift-scope restoration:** restore your partner's plant *of you* — the "I've been the absent
  one, I'm still here" apology/affection mechanic. The single most on-thesis purchase in the
  economy.
- **Reconciliation with the anti-feature list:** the binding rule is "never paywall state
  recovery." Restorations comply because (a) they cost earned points only — money can never buy
  points (Design Law 5); (b) the free path (log a real contact → hydration recovers) always
  exists and stays visually primary; (c) there is no death, so the stakes are cosmetic-plus-
  clock, never loss of the plant. If any future change lets cash touch this path, the feature is
  cut before the rule is.
- Depends on the §3.4 state ladder (Drooping/Dormant don't exist yet — today's binary wilt has
  nothing to restore *from* that a single log doesn't already fix).

### 6.8 Economy metrics & guardrails

- **Economy health:** points minted per WAU; sink distribution across the five categories;
  restoration rate per plant (high repeat-restoration = decay tuning problem, not a revenue
  win).
- **Grounding check:** % of spend in Gift/Shared scopes — the social-spending share is the
  measure of whether the economy is pointing outward (Design Law 3).
- **Tone gate:** every mechanic reviewed against the §1 guardrail ("could this make someone
  feel guilty for being busy?") before ship.

### 6.9 Build sequencing

| Phase | Contents | Gated on |
|---|---|---|
| **1** | Points ledger on logging events, consistency bonuses, plant stylistic upgrades (Self), restorations (Self) | §3.3 weighting rework, §3.5 consistency ratification, §3.4 state ladder |
| **2** | Garden upgrades, static assets, helpers (Self) | Multi-map engine work (§6.4), `decorative_items` CHECK widening |
| **3** | Linked scopes — Shared/Gift purchases, gift restorations, message actions (images + plant actions/haptics) | Linking (§4.1), shared logging (§4.2) |
| **4** | Music Box (MusicKit), capsule slots, reactive assets, seasonal live-ops + collections | Native-module build, `artifact_templates` RLS fix |

---

## 7. Monetization

Model A from `pricing-model-research.md` (generous freemium + one subscription), adjusted for
the death cut. Hard rules first — these are brand-load-bearing:

> **Never paywall the care loop, nudge receiving, or state recovery. Never place money between
> a user and a living plant. No ads, ever. No data selling.** Privacy and no-ads are marketing
> weapons against Widgetable, not just ethics.

**Two currencies, one boundary.** With Tier 4 there are two spend systems: **money** (Garden
Pass subscription + direct cosmetic purchases) and **earned points** (minted only by
connection). The boundary is absolute — money never buys points, points never buy premium
entitlements, and no urgent sink (restoration, anything care-adjacent) is ever purchasable with
cash. Cosmetic catalog items may exist on both sides (earnable with points, included with the
Pass) — the exact split is a tuning question (§10.9), but "earned variety converts better than
bought variety" (Forest) says the points catalog must stay deep and real, not a token gesture.

- **Free tier:** the entire core loop forever — logging, decay, wilt recovery, pause, linking,
  receiving all nudges, earning points — plus standard species and capped photo storage.
  **Plant cap: open conflict.** External research says ~5; our own competitive research says 10
  is already too low and 20–25 is the defensible floor, framed as intimacy (Locket) rather than
  scarcity (Fabriq's walked-back 50). Resolve with beta data (tune to the ~85th–90th percentile
  of plants-per-user); until then the working floor is 20.
- **Premium ("Garden Pass"):** unlimited plants, rare species + cosmetics, full memory storage,
  time capsules, Almanac history, printed postcards. **Price: open conflict** — internal
  research anchors $4.99/mo / $29.99/yr (Widgetable-adjacent cozy-novelty ceiling); external
  research proposes $39.99–49.99/yr (Fabriq/utility anchor). The answer follows the
  target-audience decision (§1); the memory archive + linked features justify drifting upward
  over time, not at launch.
- **Dead SKUs:** the $0.99 premium revive is void — death is cut, so there is nothing to revive
  (points-based restorations, §6.7, are the earned-only descendant). No purchasable coin packs
  (Design Law 1 makes this structural, not just policy). Never sell growth speed — a mature
  plant must always mean the friendship was actually kept.

---

## 8. External documents — alignment record

### 8.1 Market-research outline (Tiers 1–3 framing)

| External item | Disposition |
|---|---|
| Never-die / droop-only plants | ✅ Already ratified and shipped (Batch 4) — independent convergence |
| Solo vs. Linked relationship states; "linking is the product" | ✅ Adopted as the organizing frame (§1, §4); matches BACKLOG's two-sided sketch and research §2.6 |
| Tier 1 solo features (trust ladder, journal, photos, notifications) | ✅ Adopted; several are further along than the outline assumed (care loop, pause, widget, share all shipped) |
| Widgets, Live Activity | 🔨 Widget already shipped; Live Activity folds into the L1 call spike |
| "Value before permission prompt" onboarding | ✅ Already the shipped pattern; first-care-action gap adopted (§3.1) |
| Thriving/Content/Drooping/Dormant + seasons-not-streaks | 💡 Adopted as proposal (§3.4–3.5) — now also a Tier 4 prerequisite |
| Effort weighting (in-person highest) | 💡 Adopted as an open rework (§3.3) — conflicts with current +40 call / +30 hangout |
| Themed nudges, dual photos, blooms, co-op fruit, time capsules, ambient presence | ✅ Adopted (§4.3–4.5) with the thin-social-layer and all-or-nothing warnings attached |
| Tier 3 (Almanac, gifting, postcards, voice notes, Grove-v2 deferral) | ✅ Adopted (§5); gifting/collectibles since absorbed into Tier 4 |
| Free cap ~5 plants | ❌ Rejected — directly contradicts competitive finding that 10 is too low; working floor 20, tune in beta (§7) |
| $39.99–49.99/yr pricing | ⚠️ Held as open conflict vs. researched $29.99/yr; follows the audience decision (§7) |
| Target: adults 22–40 | ⚠️ Held as open conflict vs. PRD's Gen Z 18–24 (§1) |
| E2E-scoped dyad photos; deletion propagates; unlink archives (not exposes) shared content | ✅ Adopted as privacy requirements (§9) |
| CallKit spike gating auto-watering | ✅ Adopted verbatim (§3.2, §10) |
| "Garden" naming collision risk | n/a — we're Rooted; the abandoned *Garden: Stay in Touch* app is a graveyard datapoint, not a conflict |

### 8.2 Gamification & Economy Layer spec v0.2 (Tier 4)

| External item | Disposition |
|---|---|
| Design laws 1–4 (connection-only minting, no care substitution, outward spending, soft failure) | ✅ Adopted verbatim (§6.1) — laws 1–3 independently match the pricing research's Model C ("earned-only currency"); law 5 added on merge to bind the economy to the no-paywalled-recovery rule |
| "Tier 4" placement on top of state engine / trust ladder / linking | ✅ Adopted; dependency gates made explicit (§6, §6.9) |
| Soft-failure consistency bonuses ("seasons of growth") | ✅ Adopted as the proposed resolution to the open streaks-vs-seasons question (§3.5) — needs ratification, then becomes the headline earner |
| Self / Gift / Shared scoping; garden always personal; plant-level links; no zoning | ✅ Adopted (§6.2) |
| Stylistic plant upgrades, matching sets | ✅ Adopted (§6.3); rendering plan needed (plants are single static PNGs today) |
| Music Box (MusicKit), message actions, per-friend haptics | ✅ Adopted (§6.3) — this is the answer to the thin-social-layer warning on themed nudges; native-module + background-haptic constraints flagged |
| Capsule slots | ✅ Adopted (§6.3); points-vs-premium boundary held open (§10.15) — the main spec lists time capsules as a Pass feature |
| Journal expansions | ⚠️ Adapted — base journal stays free forever (§3.6); only expansions are sinks |
| Garden upgrades, static assets, reactive subset | ✅ Adopted (§6.4); schema hooks exist (`garden_theme`, `decorative_items`, `artifact_templates.required_avg_hydration`); single-map engine prerequisite flagged |
| Helpers (surface care, never perform it) | ✅ Adopted (§6.6); absorbs the garden triage view as its data layer |
| Revivals (self + gift, escalating price, reconnection prompt) | ⚠️ Adapted → **Restorations** (§6.7): renamed (nothing dies; keeps distance from legacy `revive_logs`), earned-points-only with the free contact path always primary, and gated on the state ladder. Gift-scope restoration adopted enthusiastically — the most on-thesis purchase in the economy |
| Minting sources (effort-weighted, linked bonus, milestones) + exclusions | ✅ Adopted (§6.5); ledger rides the existing `interactions` stream; assumes §3.3 re-weighting lands first |
| Loot / collections / seasonal live-ops | ✅ Adopted (§6.6); merges the former Tier 3 collectibles; artifacts tables are the schema |
| Economy metrics + tone gate | ✅ Adopted (§6.8); tone gate was already the doc-wide guardrail |
| Build phases 1–4 | ✅ Adopted with explicit gates per phase (§6.9) |

Anti-features (from `competitive-feature-analysis.md` §3, unchanged and binding): ❌ plant death
or any paid recovery · ❌ hollow-action streaks · ❌ cliff-edge streak resets · ❌ guilt-trip
notification copy · ❌ ads anywhere (especially the care loop) · ❌ purchasable points or login
rewards · ❌ low free caps framed as scarcity · ❌ forced-invite gates · ❌ "come back tomorrow"
rate limits · ❌ thin social gestures · ❌ all-or-nothing group punishment · ❌ global
leaderboards.

---

## 9. Data & privacy requirements

- **No call/SMS log access exists on iOS** — never claim or attempt it. All inference from
  app-initiated actions only.
- Contacts access optional forever; the manual add path is permanent.
- Photos and notes are scoped to the dyad; deletion propagates to both sides; **unlinking
  archives shared content, never exposes it**.
- Reactive garden assets (§6.4) must derive from aggregate health only — no signal that lets a
  visitor (§4.6) or a linked partner infer the state of a *specific other* relationship.
- No third-party tracking; the privacy stance is marketing (Marco Polo precedent).
- Existing schema debts to close before Tiers 2/4: `artifact_templates` RLS,
  `decorative_items` grid CHECKs, retiring the legacy death columns.

---

## 10. Open questions

1. **CallKit CXCallObserver background reliability** — the spike that gates L1 auto-watering
   (launch feature vs. fast-follow). The single most roadmap-shaping unknown, flagged
   identically by both internal and external research.
2. **Target audience** — Gen Z 18–24 vs. adults 22–40 (drives tone, pricing, invite modeling).
3. **Consistency mechanic** — ratify (or amend) the Tier 4 proposal: escalating seasonal
   bonuses with gradual decay (§3.5); decide what wires `streak_count` / `evolution_stage`.
4. **Interaction weights** — in-person-first re-ranking and/or type simplification (§3.3);
   now also gates economy Phase 1 minting.
5. **Species taxonomy** — how many at launch; are relationship archetypes user-legible?
6. **Linking asymmetry** — what the solo user sees about a declined/ignored invite.
7. **Photo storage architecture and the free-tier cap** — drives COGS and the premium boundary.
8. **Free plant cap and Garden Pass price** — resolve with beta distribution data (§7).
9. **Economy tuning** — price tiers and mint values; build a placeholder economy sim before
   Phase 1 ships (§6.5); the points-vs-Pass catalog split (§7).
10. **MusicKit scope** — implementation depth, Spotify timeline, non-subscriber preview UX.
11. **Shared-purchase cost** — split between partners or single-payer only?
12. **Restoration escalation curve** — linear vs. exponential; per-plant cooldown?
13. **Background haptics** — delivery constraints when the app is backgrounded
    (notification-tap trigger vs. widget context).
14. **Reactive-asset signals** — which aggregate health signals drive them without leaking
    specific-plant state.
15. **Capsule slots boundary** — earned-points slots vs. the Pass's "time capsules" feature:
    where does free/earned end and premium begin?

---

## 11. Status matrix

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
| Interaction weight rework / simplification | 1 | 💡 (gates economy Phase 1) |
| Plant state ladder + seasons framing | 1 | 💡 (gates restorations) |
| Consistency mechanic (seasonal bonuses, soft decay) | 1 | 💡 (Tier 4 proposal pending ratification) |
| Plant journal (notes, birthdays, milestones, gifts) | 1 | 📋 (base free forever) |
| Photo memories (solo wall) | 1 | 📋 |
| Notifications (plant-voiced, capped, state-aware) | 1 | 📋 |
| Offline-tolerant logging queue | 1 | 📋 |
| Garden triage view ("who needs you") | 1 | 💡 (helper-fronted, §6.6) |
| Linking (invite link/QR, graft animation, locked-state ads) | 2 | 📋 |
| Shared logging with merge (+ linked earn bonus) | 2 | 📋 |
| Themed nudges (sunlight/rain/butterfly/leaf/ladybug) | 2 | 📋 |
| Dual photo moments (composite memory cards) | 2 | 📋 |
| Bloom events / co-op goals / time capsules / ambient presence | 2 | 💡 |
| Async read-only garden visiting (dream codes) | 2 | 💡 |
| Garden Almanac + shareable recap cards | 3 | 📋 |
| Postcard exports (digital → printed) | 3 | 💡 |
| Voice-note watering | 3 | 💡 (P2, deferred) |
| Grove view (groups) | v2 | deferred |
| Points ledger + minting on log events | 4 (P1) | 📋 |
| Consistency ("seasons of growth") bonuses | 4 (P1) | 💡 (pending §3.5) |
| Plant stylistic upgrades (Self) | 4 (P1) | 📋 |
| Restorations (Self, earned points, escalating) | 4 (P1) | 💡 (needs state ladder) |
| Garden upgrades (themes, weather, soundscapes, layouts) | 4 (P2) | 💡 (multi-map prereq) |
| Static assets + reactive subset | 4 (P2) | 💡 |
| Helpers (Self, functional-lite creatures) | 4 (P2) | 💡 |
| Gift / Shared purchase scopes | 4 (P3) | 📋 (needs linking) |
| Gift restorations ("I've been the absent one") | 4 (P3) | 💡 |
| Message actions (images, plant actions, haptic signatures) | 4 (P3) | 💡 |
| Music Box (MusicKit; Spotify fast-follow) | 4 (P4) | 💡 |
| Capsule slots | 4 (P4) | 💡 (premium boundary open) |
| Seasonal live-ops + collections ladder | 4 (P4) | 💡 |
| Garden Pass subscription + free tier | — | 📋 (cap & price open) |
| Plant death, paid revives, purchasable points, ads, forced invites, hollow streaks, guilt copy | — | ❌ never |
