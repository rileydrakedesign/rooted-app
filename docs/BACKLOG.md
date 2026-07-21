# Backlog

Running list of ideas, open product questions, and planned work. Anything from
half-formed thoughts to committed features. Add freely; promote items into a
batch/PRD when they're ready to build.

Not canonical — `docs/source-of-truth/` describes what *is*; this file tracks
what *might be*.

---

## Ideas / open questions

### Anchor on contact reminders rather than call tracking
Potentially shift the core loop from tracking calls after the fact to
proactively reminding. Flow sketch:

1. Reminder triggers: "You haven't contacted [friend] this week — give them a call."
2. Options presented:
   - **Already contacted them** → logs the interaction (hydrates the plant)
   - **Call** / **Text** deep links (`tel:` / `sms:`) if they haven't yet
   - **Ignore** / dismiss

This makes the app the prompt for the behavior, not just the scorekeeper.

### Simplify interaction types
Rethink the Called / Texted / Hung out split (+40/+20/+30). Two directions to
consider:

- **Drop "Texted"** — collapse call/text into a single generic **Contact**
  (covers text, call, or hangout), or
- **Only Call and Hangout** — treat texting as too low-effort to count.

Affects the `log_interaction` RPC CASE weights and the client-side
`HYDRATION_WEIGHTS` mirror, plus the PlantInfoPanel options.

### Two-sided features for friends who also have the app
In-app interaction and shared care once both people are Rooted users:

- **Notes on plants** — leave notes on a shared friend/plant.
- **Shared tracking** — both sides see the same hydration / contact history
  instead of each keeping a private scorecard.
- Other in-app messaging or co-tending surfaces.

For friends who *don't* have the app, the same UI spaces are populated by a
**"send them a download link"** prompt — so the feature area is never empty and
doubles as the invite/referral surface.

### Photos attached to in-person hangouts
Logging an in-person hangout prompts the user for a picture. Each plant then
carries a growing library of photos — one per hangout — so the plant becomes a
visual record of the friendship, not just a hydration number.

Open: optional vs. required prompt, where the library surfaces (PlantInfoPanel?
a dedicated view?), storage (Supabase Storage bucket + RLS), and whether shared
users see each other's photos (ties into the two-sided features above).

### Friend birthdays
Collect a birthday when adding a friend, then surface it in the garden:

- **Capture:** a birthday step in onboarding, and matching field in the
  `AddFriend` → `SetFrequency` → `ChoosePlant` flow (both paths need it, and it
  should be skippable — not everyone knows a birthday).
- **Reminder:** the garden tells the user when it's a plant's birthday, rather
  than relying on an OS notification alone.
- **Celebration:** trigger special decorations on/around that plant for the day
  — party sprites, confetti, a gift on the tile, etc.

Needs a nullable `birthday` column on `friends` (currently name / phone / email
/ plant_type / contact_frequency only) — month+day is enough, year optional.
New sprites go through the `mockup-to-sprite` pipeline.

---

## Planned

### Home-screen widgets (design ratified 2026-07-20)
Three WidgetKit sizes; interactive spec with live mockups:
<https://claude.ai/code/artifact/6f70fe1e-ad04-485a-9c0a-2dbee81afe86>

- **Small (locked):** one plant — sprite, name, hydration bar + % (flush, 3pt
  gap), "last contact · frequency" meta line. Twin paging arrows (26pt,
  y-centered on each edge, wrap-around). No care buttons — tap deep-links to
  PlantInfoPanel. No wilt badge anywhere; wilt = 55% sprite opacity.
- **Medium / Large rows:** 4 (or 2×4) slots, thirstiest-first; each slot =
  sprite, name, bar (no %), last contact (no frequency). No shelf strip, no
  summary line. Edge arrows page the window when > capacity; large gets a
  dashed ghost pot on the first empty slot → `rooted://add-friend`.
- **Build:** native SwiftUI extension via `@bacons/apple-targets`; App Group
  JSON snapshot written by the RN app (garden fetch + every log); timeline
  recomputes `effectiveHydration` hourly with the `garden.ts` formula; arrows
  are iOS 17 App Intents (hidden on iOS 16, all taps become deep links).
  Deep links: `rooted://plant/<id>`, `rooted://add-friend`.
