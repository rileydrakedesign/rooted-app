1. Communication Auto-Detection (Core Mechanic)
Updated Requirement

Rooted must automatically detect:

Outgoing phone calls

Incoming answered calls (optional credit or partial credit)

Outgoing SMS

Incoming SMS (optional partial credit)

System Implementation

Because platform policies differ:

iOS

Direct SMS read access = NOT allowed, but you can detect messages sent through an in-app SMS composer.

Calls must use the native dialer with a callback → detect via CXCallObserver.

Incoming SMS cannot be detected. But this is okay — we treat outgoing messages initiated from the app as hydration signals.

Android

Full read permissions available (with user consent).

You can detect both outgoing and incoming SMS + call logs.

App Interaction

Each friend profile includes:

Call button → opens dialer → hydration applied automatically

Text button → opens in-app composer (Android may auto-log, iOS logs only outgoing via composer)

User Control

User chooses whether auto-detection is enabled:

“Auto-track calls & messages”

“Manual logging only”

“Calls: auto / Texts: manual”

🌿 2. Plant Death: Persistent Until Removed
Updated Rule

When a plant “dies”:

It remains in the garden as a wilted / dead sprite

User must choose:

Remove (deletes friend tracking)

Replant (soft reset or revive)

Premium revive (bring back at same streak or slightly reduced streak)

Gameplay Implications

Creates emotional weight → encourages maintaining streaks

Users visualize the consequence

Dead plants might display →

Last contact date

Streak lost

A short message like “This plant is ready to be revived when you are.”

Premium Mechanics

Premium Revive: restores streak and growth level

Free Revive (limited): resets XP to Stage 1 but plant returns alive

Garden Season Pass can include additional revive tokens

🍂 3. Mixed Hardcore + Soft Decay System

You chose a hybrid between hardcore and soft mechanics. Best approach:

Decay System

Each plant has a hydration bar (0–100).
Decay rate = (100 ÷ frequency_days).

Example:
Frequency: 7 days
Daily decay = ~14%.

Soft Rules

Missing hydration by 1 day = plant wilts (warning state, streak frozen but not lost)

User can streak freeze (premium or weekly free)

Partial hydration (texts) slows decay instead of fully restoring

Hard Rules

If hydration = 0 for > X days (configurable, recommended = 1–2 days) → hard death

Death immediately ends any streak above streak freeze limit

Growth vs Decay

Plants with high streaks decay slightly slower (small buffer)
→ This rewards high engagement.

Daily Garden Mood Modifier

The entire garden has a mood score based on average hydration:

Happy garden → small XP boost

Neutral garden → no change

Sad garden → faster decay (hardcore element)

🌸 4. Friend Names Visible on Tap

Updated UX rule:

Garden view shows plants without friend names (clean aesthetic)

Tap a plant → quick info panel slides up:

Friend name

Hydration bar

Days until thirsty

Streak count

Evolution stage

Buttons: Call / Text / Log interaction

This keeps the garden visually serene while maintaining functional clarity.

🌺 5. Highly Diverse Plant & Garden Evolution System (Core Engagement Loop)

This is now the flagship feature of Rooted.

Evolution Structure

Each plant evolves through:

Sprout

Young Plant

Mature Plant

Flourishing Plant

Rare Evolution Path (collectible)

Mythic or Seasonal Variant (premium)

Users LOVE collectible ecosystems. This is where your art and gamification shine.

Evolution Criteria

Based on streak length

Based on total XP

Based on “garden health”

Based on special events (holidays, seasons, etc.)

Evolution Variants

Each plant has multiple evolutionary paths

Randomized roll on evolution stage creates rarity

Example:

Common oak → Rare “Luminescent Oak”

Desert cactus → Mythic “Astral Cactus”

Pine → “Winter Spirit Pine” (seasonal)

User Agency

Users can:

Select evolutionary path (free) OR

Let RNG decide (more exciting & collectible)

🌳 6. Garden Diversity & Creativity

You emphasized that the garden diversity is the most important visual hook.
This becomes a full system:

Garden Layers

Background themes (forest, sky garden, meadow, moonlight garden)

Weather effects (sunrays, rain, fireflies, snow)

Plant pots & platforms

Ground textures

XP-Driven Unlocks

Garden XP unlocks:

New greenhouse zone

A night-mode garden

Themed gardens (autumn, underwater, cosmic)

Premium-Only Garden Cosmetic Packs

Seasonal gardens (e.g., Halloween, Spring Festival)

Animated backgrounds

Mythic garden furniture (floating platforms, glowing stones)

Collectible System

Monthly plant drops

Seasonal rarity rotations

Leaderboard for longest streak evolutions (optional)

This gives the app a Pokémon-like collection loop and a Stardew-like cozy vibe, exactly what keeps users opening the app.

🛠 7. Updated Technical Requirements Based on Decisions
Permissions Required
iOS

Call detection (CallKit observer)

Notifications

Contacts (optional)

Android

READ_CALL_LOG

READ_SMS (optional)

SEND_SMS (optional)

Notifications

Contacts (optional)

Cloud Function Updates

Daily hydration decay

Streak freeze logic

Garden global mood update

Seasonal evolution logic

Asset rotation (if using AI-generated plant drops)

🎮 8. Updated Gameplay Loop (Finalized)
Daily

Open app → see which plants need watering

Tap → Call or Text

Watch hydration rise

Gain XP + streak

Garden mood updates

Weekly

Plants evolve

Garden evolves

Seasonal events

Rare drops become available

Monthly

New plant collections

Garden themes

Premium seasonal bundle