# Rooted — What the App Does

*A first-principles description of the product from the user's perspective. Slim on purpose.
Build status, evidence, and open questions live in `feature-set.md`; this doc describes the
system as designed.*

Rooted is a pixel-art garden where every plant is a real person you care about. Staying in
touch keeps a plant thriving; drifting lets it wilt. Plants never die, progress is never lost,
and the only way to earn anything is to actually connect with your people.

---

## 1. The core loop: hydration, streaks, and points

**Every friend is a plant with a cadence.** When you add someone, you choose how often you two
actually talk — weekly, biweekly, monthly. That cadence is the plant's clock.

**Hydration is the visible timer.** A freshly-watered plant starts at 100 and drains to 0 over
exactly one cadence period. Below 30 it visibly wilts — that's the warning, not the punishment.
Connecting with the friend waters it back up.

**The streak counts periods, not days.** Keep up your chosen cadence — at least one real
connection per period — and the streak grows: "8 weeks strong" for a weekly friend, "5 months
strong" for a monthly one. The streak pays a point multiplier that steps up at tiers
(×1.0 → ×1.25 → ×1.5 → ×1.75 → ×2.0 cap). Past the cap, milestones pay prestige instead:
permanent cosmetic marks on the plant (a golden ring on the pot, a rare bloom).

**Missing a period breaks the streak — and nothing else.** The plant looks wilted until your
next connection, then springs back. The plant itself, its growth, its upgrades, its photos and
journal: all of it is permanent. Only the streak resets.

**Streaks can be restored.** For one cadence period after a break, you can buy the streak back
with points (price scales with how long the streak was, and climbs if you keep doing it) or a
flat handful of gems. Restoring re-arms the streak — you still have to actually reach out to
keep it. There is never a way to pay real money for this.

**Pause when life happens.** Vacation mode freezes every clock — hydration, streaks, all of it.
Planned absence is always free.

## 2. Earning: points and gems

- **Points** come from one place: connecting with your people. Every logged connection mints
  points, weighted by effort (an in-person hang beats a long call beats a quick call beats a
  text), multiplied by that plant's streak tier. Full earning once per plant per day; extra
  same-day logs trickle.
- **Gems** are rare and only drop at moments that matter: streak tier-ups, blooms, first call
  of the year, both of you showing up during a seasonal event.
- No login rewards, no ads, no buying currency. If your garden is rich, it's because your
  friendships are.

## 3. Spending: the upgrade system

Four surfaces to spend on, three scopes to spend in.

**Scopes**
- **Self** — affects only your garden. Every plant supports this.
- **Gift** *(linked plants only)* — you buy it, it appears on your friend's side, tagged
  "from Sam," and pings their plant.
- **Shared** *(linked plants only)* — one purchase shows up on both sides of the linked plant
  at once. Matching sets render identically on both — the friendship-bracelet pattern.

**Plant upgrades** *(Self / Gift / Shared)* — pots, nameplates, leaf and bloom variants,
accessories (fairy lights, wind chimes, charms). Functional ones too: extra time-capsule
slots, richer journal layouts, and the Music Box (§4).

**Garden upgrades** *(Self only — the garden is your private space)* — terrain and scene
themes (mossy grove, desert bloom, alpine meadow), time-of-day and weather moods, seasonal
skies, path styles, ambient soundscapes, layout slots for arranging and grouping plants.

**Static assets** *(Self only)* — a decor library: waterfalls, bird feeders, koi ponds,
lanterns, benches, gnomes. Some are **reactive**: the bird feeder draws ambient birds when the
whole garden is healthy; the waterfall runs stronger in a week where you've been connecting.
They respond to the garden as a whole, never expose any one relationship.

**Helpers** *(Self / Gift)* — garden creatures (a gopher, a hedgehog) that do friendly light
work: tidy fallen petals, flag "who needs you today," dig up an old journal note ("you wrote
this about Sam in March"). Giftable into a linked partner's garden with a planter tag. Helpers
point you at care; they never do the caring for you.

## 4. Linked plants: the communication layer

When a friend joins Rooted, your plant of them and their plant of you **link** — a graft
animation, vines that deepen as your history grows. Linking unlocks:

**One shared streak.** Either of you logs the connection; both plants update, both of you earn,
duplicate logs of the same hangout merge into one. Co-op always out-earns solo.

**Nudges** — small ambient signals that land as animations on the other person's plant plus a
soft notification. Not a chat: no threads, no read receipts, no pressure to reply.
- ☀️ Sunlight — thinking of you
- 🌧 Rain — rough week / miss you
- 🦋 Butterfly — "this reminded me of you" (can carry a photo or note)
- 🍂 Falling leaf — "it's been a while, no pressure"
- 🐞 Ladybug — playful poke

**Message actions** — the expressive tier on top of nudges:
- **Songs:** attach a track and a short message via the Music Box; their plant sways while it
  plays.
- **Pictures:** send a photo to their plant; either of you can file it into the shared memory
  wall.
- **Plant actions + haptics:** remotely make their plant shimmer, shake, or shimmy, delivered
  with a custom haptic pattern — each friend can have their own signature buzz, so you know
  who's thinking of you without looking.

**Gift restores.** If *you* were the one who went quiet, you can restore your friend's streak
of you — the "I've been the absent one, I'm still here" gesture.

**Dual photo moments.** You both logged the same hangout? You both get prompted for a photo,
and the two shots become one side-by-side memory card saved to both walls.

## 5. Logging connections: the input side

Every way a real connection becomes a watered plant. One tap, a reward animation, and never any
proof required — the app trusts you.

- **In-person hangout** — the highest-value log. Comes with an optional photo prompt that
  feeds the plant's memory wall.
- **Call** — tap Call on the plant and the app dials for you; when the call can be detected
  automatically, the plant waters itself. Otherwise one tap after.
- **Manual log** — "we connected." Covers texts, video calls, running into each other.
  Optional note.
- **Suggested logs** — the app notices a calendar event with Maya's name and asks "did you see
  Maya?" Confirm with one tap.
- **Reminders that help you act** — "you haven't talked to Sam this week" comes with buttons:
  *Call now*, *Text*, or *already did* (which just logs it).

## 6. The memory layer

Each plant quietly becomes the archive of that friendship:

- **Journal** — freeform notes, birthdays and dates (surfaced as in-garden celebrations, party
  sprites and all), gift ideas, and a gentle post-call prompt: "anything to remember?"
- **Memory wall** — the photo timeline of your hangouts, one plant per person, chronological
  and unpolished. Private by default; shared with the friend once linked, and only the photos
  you explicitly choose to share.
- **Time capsules** — bury a note, photo, or voice memo in a plant; it unlocks on the date you
  chose. Linked pairs can bury one together.

## 7. The full journey

**Day one.** Pick a person you love. Choose their plant, name it, set how often you two really
talk. Water it once before onboarding even ends — you've already done the thing the app is for.

**A normal week.** Glance at the widget: three plants doing fine, Maya's fern looking thirsty.
Tap it, call her on the drive home, plant perks up, points minted, streak ticks to week 9 —
one tier from ×2.0. Spend some points on a terracotta pot for Sam's monstera.

**When life gets busy.** Two weeks slip. Dev's bamboo is wilted and the streak broke — but
nothing is *lost*. You call him, the plant springs back, everything's still there. The streak
restarts at week one… or you spend the points to restore it, and then call him anyway, because
the restore only counts if you follow through. Going somewhere without signal? Pause the
garden first; it all freezes.

**When a friend joins.** You send Sarah her invite — "you're a monstera in my garden." Plants
link and intertwine. Now she waters it too, sunlight and songs go back and forth, your hangout
photos land on one shared wall, and the plant becomes something you keep *together*.

**Over a year.** The garden becomes legible history: mature plants for the friendships you've
tended, golden rings for the long streaks, a wall of photos per person, seasonal flowers that
only exist because you both showed up that December. The yearly Almanac wraps it up in a
shareable recap.

**Around the edges.**
- **Notifications** are plant-voiced and warm ("Maya's fern misses the sun"), capped in
  frequency, bundled into a morning digest, and never fire about someone you already contacted.
- **Sharing** — snapshot your garden to any app; recap cards from the Almanac.
- **Settings** — pause, notification categories, account.
- **Garden Pass** (the only real-money purchase, plus à-la-carte cosmetics): more plant
  capacity, rare species, full photo storage, more capsule slots, Almanac history. Money never
  touches care, currency, or recovery.

## 8. What the app will never do

- Kill a plant, or make you pay cash to recover anything.
- Show ads, sell data, or sell points/gems.
- Guilt you: no "you're a bad friend," no loss countdowns, no shame copy — ever.
- Demand proof of a connection, or force you to invite anyone.
- Let a hollow ping be worth as much as a real conversation.
