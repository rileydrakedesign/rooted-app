# Product Requirements Document: Rooted

**Version:** 1.0 (MVP)
**Date:** December 4, 2025
**Author:** Product Team
**Status:** Draft

---

## Executive Summary

**Rooted** is an iOS relationship management app that transforms friendship maintenance into a calming, rewarding experience through botanical gamification. Users nurture a personal greenhouse where each friend is represented by a unique plant that requires regular care through real-world interactions (calls and texts).

**The Problem:** Gen Z (ages 18-24) experiences unprecedented friendship maintenance anxiety. In a post-pandemic world, maintaining meaningful relationships feels overwhelming and guilt-inducing, while performative social media creates more stress than connection.

**The Solution:** A private, peaceful "friendship greenhouse" that makes relationship maintenance feel like tending a beloved garden rather than a social obligation. Through gentle gamification and nostalgic pixel art aesthetics, Rooted creates emotional infrastructure for Gen Z friendships.

**Target Market:** Gen Z users (18-24), particularly those experiencing friendship maintenance guilt and social media fatigue, who resonate with cottagecore aesthetics and cozy gaming culture.

**Business Model:** Free-to-play with in-app purchases (premium plant revivals, decorative items, future Garden Pass subscription).

**Platform:** iOS-only (leveraging platform restrictions as design constraints).

---

## Product Vision & Positioning

### Vision Statement

**"Every friendship deserves a sanctuary to grow."**

Rooted reimagines relationship maintenance as a peaceful, personal practice rather than a social obligation. We're building emotional infrastructure for Gen Z - a calm space where nurturing friendships feels as natural and rewarding as tending a beloved garden.

### Product Positioning

**Category:** Relationship wellness + cozy gaming hybrid

**Positioning Statement:**
For Gen Z individuals overwhelmed by friendship maintenance, Rooted is a relationship wellness app that transforms social anxiety into peaceful cultivation. Unlike performative social media or obligation-driven reminder apps, Rooted creates a private greenhouse sanctuary where real connections grow through gentle gamification.

### Competitive Landscape

| Competitor | Category | What They Do | How We Differ |
|------------|----------|--------------|---------------|
| **Snapchat Streaks** | Social Media | Daily interaction tracking | Anxiety-inducing obligation vs. calm cultivation |
| **Replika** | AI Companion | Simulated relationships | Real human connections, not AI substitutes |
| **Duolingo** | Gamified Learning | Daily habit building | Similar gentle gamification, but for relationships |
| **Forest App** | Productivity | Visual growth rewards | Similar calm aesthetic, but for social wellness |
| **Animal Crossing** | Cozy Gaming | Daily check-in loops | We connect real relationships to cozy mechanics |

### Key Differentiators

1. **Private vs. Performative** - No public feeds, no likes, no social comparison
2. **Calm vs. Anxiety** - Gentle nudges and forgiveness mechanics, not guilt trips
3. **Real vs. Simulated** - Strengthens actual friendships, not AI relationships
4. **Nostalgic Aesthetic** - Pixel art greenhouse taps cottagecore + cozy gaming culture
5. **iOS-Native Quality** - Built specifically for iOS, not cross-platform compromise

---

## Target Audience & User Personas

### Primary Target Audience

**Demographics:**
- Age: 18-24 (Gen Z)
- Platform: iOS users (iPhone ownership correlates with target demographic purchasing power)
- Location: Initially US-based, English-speaking
- Tech Savviness: Digital natives, mobile-first behavior

**Psychographics:**
- Experiencing post-pandemic friendship maintenance challenges
- Values authentic connections over large social networks
- Drawn to cottagecore, cozy gaming, plant parent aesthetics
- Seeks calm, low-pressure wellness tools
- Active on TikTok, Instagram (but feels social media fatigue)
- Relates to "chronically online but lonely" paradox

### User Persona 1: "Overwhelmed Olivia"

**Profile:**
- Age: 22, college senior
- iPhone 14 Pro user, Heavy TikTok/Instagram consumer
- Has 15-20 close friends from high school + college scattered across cities

**Pain Points:**
- Feels guilty when weeks pass without texting close friends
- Overwhelmed by keeping track of who she's talked to recently
- Social media feels performative; wants genuine connection
- Anxiety about "being a bad friend"

**Goals:**
- Maintain meaningful friendships without stress
- Feel accomplished about relationship maintenance
- Create a sustainable system that doesn't feel like work

**Rooted Use Case:**
- Opens app during study breaks (calm escape)
- Adds 12 closest friends to greenhouse
- Gets satisfaction from seeing full hydration bars
- Shares aesthetic garden screenshots to close friends' group chat
- Willing to pay $0.99 to revive a plant for childhood best friend

**Quote:** *"I hate that I need an app to remember to text my friends, but honestly? This makes it feel less like a chore and more like... self-care?"*

### User Persona 2: "Intentional Ian"

**Profile:**
- Age: 25, early career professional (product designer)
- iPhone 15 user, Curates small but meaningful social circle
- Recently moved cities for work, wants to maintain long-distance friendships

**Pain Points:**
- Intentionally limits relationships to ~10 close people
- Struggles with "out of sight, out of mind" with distance friendships
- Dislikes reminder apps that feel transactional
- Wants relationship maintenance to feel creative/personal

**Goals:**
- Systematize friendship check-ins without losing authenticity
- Visual representation of relationship health
- Something that feels more "him" than a calendar reminder

**Rooted Use Case:**
- Carefully curates 8-10 plants (quality over quantity)
- Spends time customizing greenhouse layout (aesthetic expression)
- Sets up plants with different frequencies (weekly vs. monthly friends)
- Appreciates the calm ritual of tending his garden
- Would subscribe to Garden Pass for exclusive aesthetic items

**Quote:** *"This is the only relationship app that doesn't make me feel like I'm managing a CRM. It's actually... peaceful?"*

---

## Core Features & MVP Scope

### Feature Overview

Rooted's MVP focuses on the essential experience loop: **add friends → nurture plants → maintain relationships → grow your greenhouse**.

### 1. Greenhouse Garden (Core System)

**Description:** A customizable 6×6 grid-based greenhouse where each friend is represented by a unique plant.

**MVP Requirements:**

**Grid System:**
- 6×6 tile floor layout (36 total slots)
- Drag-and-drop plant placement
- Long-press to enter "Edit Mode" for rearranging
- Grid-based collision (one item per tile)
- Support for furniture items that can hold multiple small plants

**Customization:**
- Users can move plants and decorative items freely
- Save layout automatically
- Visual feedback during placement (valid/invalid positions)

**Theme System:**
- MVP ships with ONE theme: "Cozy Greenhouse"
- Infrastructure built to support theme switching
- Future themes unlock via progression or IAP

**Garden Rooms (Post-MVP):**
- Database schema designed for multiple rooms
- MVP: Single 6×6 greenhouse only
- Future: Unlock additional greenhouse sections as expansion

**Technical Notes:**
- SpriteKit 2D rendering engine
- Local state saved to Core Data
- CloudKit sync for backup (async, non-blocking)

---

### 2. Friend-to-Plant System

**Description:** Each friend added to the garden becomes a unique plant that requires regular care.

**MVP Requirements:**

**Adding Friends:**
- Import from iOS Contacts OR manual entry (name + phone/email)
- Maximum 20 friends for MVP (prevents grid overcrowding)
- Select plant type from 8 options (see Visual Design section)
- Choose contact frequency: Weekly, Bi-weekly, Monthly
- Place plant on greenhouse grid

**Plant Attributes:**
- **Hydration Level:** 0-100 (visual bar)
- **Streak Count:** Consecutive interactions within frequency window
- **Evolution Stage:** Sprout (0-7 days) → Young (8-30 days) → Mature (31+ days)
- **Last Contact Date:** Timestamp of most recent interaction
- **Decay Rate:** Calculated based on contact frequency

**Plant States:**
- **Healthy:** Hydration > 60% (vibrant, animated)
- **Thirsty:** Hydration 20-60% (slight wilt, gentle notification)
- **Wilting:** Hydration 1-19% (visibly wilted, urgent notification)
- **Dead:** Hydration = 0 for >1 day (remains in garden as dead sprite)

---

### 3. Hydration & Decay System

**Description:** Plants automatically lose hydration over time based on contact frequency, creating the core engagement loop.

**MVP Requirements:**

**Decay Calculation (Server-Side):**
```
Decay Rate Per Day = 100 ÷ Frequency Days

Examples:
- Weekly friend (7 days): ~14% decay/day
- Bi-weekly friend (14 days): ~7% decay/day
- Monthly friend (30 days): ~3.3% decay/day
```

**Timestamp-Based System:**
- Store `lastHydrationUpdate` timestamp per plant
- On app open or API call: Calculate elapsed time
- Apply decay retroactively: `currentHydration -= (elapsed_hours / 24) × decayRate`
- Update timestamp to current time

**Hydration Restoration:**
- **Call logged:** +40 hydration (caps at 100)
- **Text logged:** +20 hydration (caps at 100)
- **Manual log:** +30 hydration (for external interactions)

**Plant Death:**
- When hydration reaches 0, plant enters "death grace period" (24 hours)
- If not watered within 24 hours, plant dies
- Dead plant remains visible in garden (dead sprite)
- User must choose: Remove or Revive

---

### 4. Communication Auto-Detection (iOS-Limited)

**Description:** Automatically detect and log interactions made through the app's interface.

**MVP Requirements:**

**iOS Capabilities:**
- **Outgoing Calls:** Detect via CXCallObserver when call initiated from in-app button
- **Outgoing Texts:** Track when sent via in-app MessageUI composer
- **Incoming Calls/Texts:** NOT DETECTED (iOS restriction)

**User Flow:**
1. User taps plant → Plant info panel appears
2. Tap "Call [Name]" button → Opens native iOS dialer with number pre-filled
3. CXCallObserver detects call initiation → Logs interaction automatically
4. Hydration restored automatically after call

**Manual Logging:**
- "Log Interaction" button for external calls/texts
- Simple timestamp + optional note
- Same hydration restoration as auto-detected

**Transparency:**
- Onboarding clearly states: "Rooted tracks interactions made through the app"
- Settings toggle: "Auto-detect calls/texts" (can disable)

---

### 5. Plant Evolution System

**Description:** Plants visually grow and evolve based on streak length and total interaction count.

**MVP Requirements:**

**Evolution Stages (3 Stages Per Plant Type):**

**Stage 1: Sprout (Days 0-7)**
- Small, simple sprite
- Unlocked immediately upon adding friend
- Minimal animation (gentle sway)

**Stage 2: Young Plant (Days 8-30)**
- Visibly larger, more detailed
- Unlocked after 7 days of consistent hydration (streak)
- Enhanced animation (leaves rustle, small particles)

**Stage 3: Mature Plant (Days 31+)**
- Full-grown, lush sprite
- Unlocked after 30 days of streak maintenance
- Rich animation (flowering, ambient effects)

**Evolution Mechanics:**
- Evolution tied to **streak consistency**, not just total interactions
- Missing frequency window breaks streak (but doesn't reset growth)
- Once evolved, plant stays at that stage (doesn't de-evolve)
- Dead plants revert to dead sprite (regardless of previous stage)

**Post-MVP (Rare Variants):**
- Random chance for special evolution (5% probability)
- Seasonal variants during events
- Premium guaranteed rare evolutions

---

### 6. Collectible Artifacts System

**Description:** Reward system that grants unique animated artifacts for maintaining streaks and garden health, creating collectible achievements that visually enhance the greenhouse.

**MVP Requirements (Post-MVP v1.1+):**

**Plant-Level Artifacts (Streak Rewards):**
- Earned by maintaining long streaks with individual friends
- Attach to specific plants, creating visual flair

**Artifact Types:**
- **Butterfly** (7-day streak): Gently flutters around the plant
- **Bee** (14-day streak): Hovers near flowers, occasionally lands
- **Hummingbird** (30-day streak): Quick darting movements near blooms
- **Firefly** (60-day streak): Glows softly at night, orbits plant
- **Dragonfly** (90-day streak): Graceful flight patterns, iridescent wings

**Garden-Level Artifacts (Overall Health Rewards):**
- Earned by maintaining overall garden health (average hydration across all plants)
- Placed as decorative items in the garden

**Artifact Types:**
- **Wind Chime** (70% avg hydration for 7 days): Gentle swaying animation, ambient sound
- **Bird Feeder** (80% avg hydration for 14 days): Occasional bird visitors
- **Garden Painting** (85% avg hydration for 30 days): Wall decoration, collectible art
- **Friendly Cat** (90% avg hydration for 60 days): Wanders garden, sits near plants
- **Garden Gnome (Rare)** (95% avg hydration for 90 days): Animated gnome with personality

**Mechanics:**
- Artifacts are **permanent unlocks** (never lost, even if streak breaks)
- Can be toggled on/off per plant or garden area
- Each artifact has idle animations that loop
- Artifacts stack: multiple insects can appear on same plant
- Collect-them-all achievement system (badges for full collections)

**Isometric Rendering:**
- Artifacts rendered in isometric perspective to match garden
- Layered depth sorting (butterflies fly "above" plants)
- Subtle shadows cast on ground/surfaces

**Monetization Hook (Optional):**
- Premium users can unlock artifact color variants
- Seasonal artifact skins (e.g., Holiday Butterfly, Cosmic Firefly)
- Artifact "packs" available as IAP ($1.99 for themed set)

**Why This Matters:**
- Creates visible, persistent rewards for long-term engagement
- Gives users collectible goals beyond plant evolution
- Makes active gardens feel "alive" with movement and personality
- Social sharing appeal (screenshot your decorated garden)
- Aligns with cozy game collecting culture (Animal Crossing, Stardew Valley)

---

### 7. Plant Info Panel

**Description:** Tap any plant to view detailed friend/plant information and interaction options.

**MVP Requirements:**

**Info Display:**
- Friend name (editable)
- Plant type and current stage
- Hydration bar (0-100 visual indicator)
- Current streak count (e.g., "7 day streak!")
- Days until next watering needed
- Last contact date/time
- Contact frequency setting (editable)

**Interaction Buttons:**
- **Call [Name]:** Opens iOS dialer with auto-detection
- **Text [Name]:** Opens in-app MessageUI composer
- **Log Interaction:** Manual logging option
- **Edit:** Modify name, frequency, plant type
- **Remove:** Delete friend/plant (confirmation required)

**Animation:**
- Panel slides up from bottom (iOS native feel)
- Backdrop blur effect
- Smooth dismissal via swipe down or tap outside

---

### 7. Push Notifications

**Description:** Gentle, non-intrusive reminders to care for thirsty plants.

**MVP Requirements:**

**Notification Types:**

**Daily Garden Check (8:00 AM user local time):**
- "Good morning! 3 plants need watering today 🌱"
- Only sent if ≥1 plant is thirsty (hydration < 60%)
- User can customize time in settings

**Critical Alert (When plant hits 0% hydration):**
- "[Friend's Name]'s plant is wilting! Water within 24 hours to save it."
- Sent once when hydration reaches 0%

**Streak Celebration (Optional):**
- "You've maintained a 14-day streak with [Friend]! 🎉"
- Sent on milestone streaks (7, 14, 30, 60, 90 days)

**User Controls:**
- Toggle notifications on/off globally
- Customize notification time
- Disable streak celebrations separately

**Privacy:**
- Notifications never reveal conversation content
- Generic phrasing if friend name is sensitive

---

### 8. Plant & Friend Management

**Description:** Tools for organizing and managing the greenhouse.

**MVP Requirements:**

**Add Friend:**
- Contact picker from iOS Contacts
- Manual entry (name, phone, email optional)
- Select plant type from 8 options
- Set contact frequency (Weekly/Bi-weekly/Monthly)
- Place on grid

**Edit Friend:**
- Change plant type (visual swap only, keeps data)
- Adjust contact frequency (recalculates decay rate)
- Edit name
- Update contact info

**Remove Friend:**
- Confirmation dialog: "Remove [Name]'s plant? This cannot be undone."
- Deletes all associated data
- Frees grid space

**Plant Death Handling:**
- Dead plant remains visible (visual reminder)
- Options: "Remove" or "Revive"
- **Free Revive:** Resets plant to Stage 1, clears streak (1 per week limit)
- **Premium Revive:** Restores previous stage + streak ($0.99 IAP)

---

### 9. Decorative Items & Furniture

**Description:** Non-functional aesthetic items that enhance greenhouse customization.

**MVP Requirements:**

**Furniture Items (4 pieces):**
1. **Wooden Table:** Holds 2-3 small plants, takes 1 or more grid slots
2. **Wall Shelf:** Background decoration, doesn't consume grid space
3. **Watering Can:** 1 grid slot, aesthetic only
4. **Garden Bench:** 1 grid slot, adds cozy atmosphere

**Mechanics:**
- Free items unlocked at start
- Can be placed/moved like plants
- Some furniture allows stacking small plants
- Pure aesthetic (no gameplay impact)

**Post-MVP:**
- Unlockable furniture via XP/achievements
- Premium decorative packs ($1.99 for themed sets)
- Seasonal items (holiday wreaths, fairy lights, etc.)

---

### 10. Onboarding Flow

**Description:** Streamlined 4-screen onboarding with upfront authentication for secure account creation.

**MVP Requirements:**

**Screen 1: Welcome**
- Title: "Welcome to Rooted"
- Subtitle: "Your greenhouse for growing friendships."
- Visual: Beautiful isometric greenhouse illustration (pixel art)
- Button: [Get Started]

**Screen 2: Account Creation**
- Title: "Create your account"
- **Email input field** (primary authentication method)
- **Phone number input field** (optional, for SMS-based login as alternative)
- Password field (min 8 characters)
- "Sign Up" button
- Alternative: "Sign in with Apple" button (iOS native, faster)
- Link: "Already have an account? Sign in"

**Design Notes:**
- Pixel art themed input fields (subtle border animations)
- Validation: Real-time email format check
- Supabase Auth handles email verification (optional confirmation email sent post-signup)
- Phone number uses international format picker

**Screen 3: Add First Friend**
- Prompt: "Plant your first friendship"
- Contact picker OR manual entry (name + phone/email)
- Choose plant type (visual showcase of 8 isometric plant options)
- Set frequency with helpful hints ("How often do you usually talk?")

**Screen 4: Place & Tutorial**
- Place first plant on isometric grid
- Interactive tutorial overlays:
  - "Tap any plant to see details"
  - "Call or text to restore hydration"
  - "Your plants need regular care to thrive"
- Button: [Start Gardening]

**First Launch Experience:**
- Immediate authentication (necessary for cloud sync and data security)
- Under 90 seconds to complete full onboarding
- Clean, pixel art themed forms (no generic iOS inputs)
- Optional: Skip friend-adding in onboarding, start with empty garden

---

### 11. Settings & Account

**Description:** Essential app configuration and account management.

**MVP Requirements:**

**Account (Progressive Authentication):**
- App starts local-only (no login required)
- After 3 plants added OR Day 2, prompt: "Enable Cloud Backup?"
- **Sign in with Apple** only (privacy-focused, one-tap)
- CloudKit sync activates post-login

**Settings Options:**
- **Notifications:** On/Off toggle, time customization
- **Auto-Detection:** Enable/disable call/text tracking
- **Garden Theme:** Preview + select (MVP: only 1 theme)
- **Friend Limit:** Display current count (e.g., "12/20 friends")
- **Privacy:** Review permissions, contact access settings
- **Data Export:** (Post-MVP: GDPR compliance)
- **About:** Version, credits, feedback link

---

### MVP Feature Summary

| Feature | Status | Complexity | Priority |
|---------|--------|------------|----------|
| Grid-based greenhouse (6×6) | ✅ MVP | High | P0 |
| Drag-and-drop customization | ✅ MVP | Medium | P0 |
| Friend-to-plant mapping | ✅ MVP | Medium | P0 |
| 8 plant types × 3 stages | ✅ MVP | High | P0 |
| Server-side hydration decay | ✅ MVP | Medium | P0 |
| Call/text auto-detection (iOS) | ✅ MVP | High | P0 |
| Manual interaction logging | ✅ MVP | Low | P0 |
| Plant info panel | ✅ MVP | Low | P0 |
| Plant evolution (3 stages) | ✅ MVP | Medium | P0 |
| Push notifications | ✅ MVP | Medium | P0 |
| Free + Premium revive | ✅ MVP | Low | P0 |
| 4 decorative furniture items | ✅ MVP | Low | P1 |
| Progressive authentication | ✅ MVP | Low | P1 |
| CloudKit sync | ✅ MVP | Medium | P1 |
| Multiple themes | ❌ Post-MVP | Low | P2 |
| Garden rooms expansion | ❌ Post-MVP | High | P2 |
| Rare evolution variants | ❌ Post-MVP | Medium | P2 |
| Seasonal events | ❌ Post-MVP | High | P3 |

---

## Visual Design & Art Direction

### Design Philosophy

**Aesthetic Pillars:**
1. **Calm & Cozy** - Soothing colors, gentle animations, no harsh visuals
2. **Nostalgic** - Pixel art evokes Pokemon, Stardew Valley, classic gaming warmth
3. **Personal** - Customizable spaces that feel uniquely "yours"
4. **Organic** - Natural growth, botanical beauty, living greenhouse atmosphere

**Emotional Tone:** Peaceful sanctuary, gentle productivity, proud ownership

---

### Art Style

**Medium:** 2D Pixel Art

**Perspective:** Isometric (3/4 view angle) - provides depth and dimension while maintaining pixel art charm
- Similar to: Habbo Hotel, Stardew Valley buildings, classic SimCity
- 2:1 pixel ratio (2 pixels horizontal for every 1 pixel vertical)
- Gives greenhouse a "dollhouse" feel - can see into the space
- Better showcases plant placement and garden layout

**Resolution:**
- Base tile size: 16×16 pixels (assets) in isometric projection
- Rendered at 2× for retina displays (32×32 points)
- Greenhouse canvas: 6×6 grid isometric layout
- Isometric grid math: each tile is diamond-shaped when rendered

**Color Palette:**
- **Primary:** Warm earthy tones (terracotta, ochre, sage green, forest green)
- **Secondary:** Soft pastels for plants (blush pink, lavender, sky blue)
- **Accents:** Golden sunlight, glass reflections, subtle shadows
- **Mood:** Warm, inviting, cottagecore-inspired
- **Depth cues:** Lighter shades for closer objects, subtle atmospheric perspective

**Animation Style:**
- Subtle idle animations (2-4 frame loops)
- Gentle swaying, leaves rustling
- Particle effects (dust motes, water droplets, sparkles on evolution, ambient insects)
- Smooth transitions (60fps React Native rendering)
- Isometric bounce/hop animations for plant placement

---

### MVP Theme: "Cozy Greenhouse"

**Environment Description:**
A warm, sunlit greenhouse interior with wooden accents and glass walls revealing soft greenery outside.

**Background Layers:**
1. **Glass Walls:** Wooden-framed windows with subtle reflections
2. **Exterior View:** Blurred green foliage, occasional tree silhouettes
3. **Lighting:** Golden hour sunlight streaming through glass (ambient glow)
4. **Floor:** Beige/cream tiles with subtle texture, visible grid lines

**Ambient Details:**
- Gentle dust motes floating in sunbeams (animated particles)
- Occasional bird shadow passing outside window
- Soft shadows cast by plants and furniture
- Time-of-day lighting shifts (optional post-MVP):
  - Morning: Cool blue-tinted light
  - Midday: Warm golden light
  - Evening: Amber/orange glow
  - Night: Moonlight through windows (low-key)

**Audio Atmosphere (Optional MVP):**
- Ambient background: soft wind chimes, distant bird songs
- Interaction sounds: gentle water pour, leaf rustle, UI taps
- Music: Optional lo-fi instrumental (user toggle)

---

### Plant Types & Evolution Sprites

**MVP Plant Roster (8 Types):**

Each plant has 3 evolution stages + 1 dead sprite = 4 sprites per type.

**1. Cactus (Desert)**
- **Sprout:** Tiny round cactus, single spine
- **Young:** Taller with arm nubs, light pink flower bud
- **Mature:** Full saguaro with blooming pink flowers, subtle glow
- **Dead:** Brown, wilted, fallen over

**2. Fern (Tropical)**
- **Sprout:** 2-3 small curled fronds
- **Young:** Multiple unfurling fronds, vibrant green
- **Mature:** Lush cascading fronds, particle shimmer
- **Dead:** Brown, dried, crispy leaves

**3. Succulent (Hardy)**
- **Sprout:** Small rosette, pale green
- **Young:** Larger rosette with blush pink tips
- **Mature:** Full flowering succulent with pink blooms
- **Dead:** Shriveled, gray-brown

**4. Ivy (Climbing)**
- **Sprout:** Single vine with 3 leaves
- **Young:** Vines growing up small trellis
- **Mature:** Full coverage on decorative trellis, heart-shaped leaves
- **Dead:** Withered vines, fallen leaves

**5. Sunflower (Cheerful)**
- **Sprout:** Tiny stem, two leaves
- **Young:** Growing stalk, leaf development, closed bud
- **Mature:** Full bloom, bright yellow petals, gentle sway animation
- **Dead:** Drooping head, brown petals

**6. Bonsai Tree (Zen)**
- **Sprout:** Tiny sapling in shallow pot
- **Young:** Small sculpted branches forming
- **Mature:** Elegant miniature tree with delicate leaves
- **Dead:** Bare branches, fallen leaves

**7. Rose Bush (Classic)**
- **Sprout:** Single stem, thorny, one leaf
- **Young:** Bushy growth, closed rose buds (red/pink/white variants)
- **Mature:** Multiple blooming roses, rich green foliage
- **Dead:** Wilted petals, brown stems

**8. Herb Garden (Practical)**
- **Sprout:** Tiny sprigs (basil, mint, lavender mix)
- **Young:** Bushier herbs, visible variety
- **Mature:** Lush herb cluster, subtle aroma lines (particle effect)
- **Dead:** Brown, dried herbs

**Sprite Specifications:**
- Size: 16×16 to 32×32 pixels (varies by growth stage)
- Transparency: PNG with alpha channel
- Animation: 2-4 frame idle loops (sway, shimmer)
- Consistency: Unified pixel density across all plants

---

### Decorative Furniture Sprites

**MVP Furniture (4 Items):**

**1. Wooden Table**
- Size: 32×32 pixels (2 grid slots visually, occupies 1)
- Style: Rustic wooden planks, visible grain
- Function: Holds 2-3 small potted plants stacked on surface

**2. Wall Shelf**
- Size: 48×16 pixels (background layer, no grid collision)
- Style: Wooden shelving mounted on greenhouse wall
- Function: Pure decoration, adds depth

**3. Watering Can**
- Size: 16×16 pixels (1 grid slot)
- Style: Vintage metal can, teal/copper color
- Function: Aesthetic only, reinforces gardening theme

**4. Garden Bench**
- Size: 32×16 pixels (1 grid slot)
- Style: Wooden slats, cozy cushion
- Function: Aesthetic, adds "restful sanctuary" vibe

**Post-MVP Furniture Ideas:**
- Fairy lights string
- Garden gnome
- Bird bath
- Tool rack
- Potting station
- Rocking chair

---

### UI/UX Visual Language

**Interface Style:**
- **Design System:** Custom pixel art themed components (React Native custom components)
- **Typography:** Pixel/retro font family for thematic consistency
  - **Primary Font:** "Press Start 2P" OR "Pixel Operator" OR "Minecraftia" (web-safe pixel fonts)
  - **Body Text:** Slightly larger pixel font for readability (12-14pt rendered size)
  - **Headers:** Bold pixel font (16-20pt)
  - **Buttons:** Chunky pixel font (14pt)
- **Color Scheme:** Matches greenhouse palette (earth tones, soft accents)
- **Buttons:** Pixel art style with:
  - Rectangular with slight border (3-5px pixel art border)
  - Pressed state: Shifts down 2px (classic pixel button effect)
  - Haptic feedback on press
  - Optional: Icon + text combinations
- **Icons:** 100% custom pixel art icons (no system symbols)

**Key UI Components:**

**Plant Info Panel:**
- Backdrop: Darkened semi-transparent overlay (60% opacity black) OR pixel art frame border
- Layout: Card-style with pixel art border decoration
- Hydration Bar: Pixel art bar with chunky segments (red → yellow → green based on level)
- Buttons: Pixel art rectangular buttons with plant-themed 16×16 icons

**Navigation:**
- Bottom tab bar (if needed): Home (Garden) | Friends | Settings
- Top bar: Minimalist, only essential info (friend count, settings gear)

**Notifications:**
- Custom banner with plant sprite icon
- Warm color scheme matching app aesthetic
- Gentle animation on appearance

**Loading States:**
- Animated growing plant sprite
- "Tending your garden..." messaging
- Never harsh spinners or stark loading screens

---

### Accessibility Considerations

**Visual Accessibility:**
- Color blind modes: Adjust hydration bar colors (blue/orange alternative)
- High contrast option for text/UI
- Scalable plant sprites (zoom option for vision impairment)
- VoiceOver support for all interactive elements

**Interaction Accessibility:**
- Haptic feedback for drag-and-drop confirmation
- Alternative to drag-and-drop (tap-to-select + tap-to-place)
- Adjustable notification frequency
- Text size scaling

---

### Asset Production Requirements

**For MVP Launch:**

**Plant Sprites:**
- 8 plant types × 4 sprites each (Sprout, Young, Mature, Dead) = 32 sprites
- Animated variants: 4-8 frames per animated plant = ~64-96 additional frames

**Environment Sprites:**
- Greenhouse background (layered): 3-4 layers
- Floor tiles: 1-2 variants
- Decorative furniture: 4 items
- UI elements: Buttons, panels, icons (~20 pieces)

**Estimated Asset Count:** ~120-150 total sprites/frames (isometric projection increases complexity slightly)

**Production Method: PixelLab AI Integration**

**Primary Tool: PixelLab AI + PixelLab AI MCP**
- **AI-assisted pixel art generation** directly in code workflow
- **MCP (Model Context Protocol)** integration allows real-time asset creation during development
- **Iterative refinement:** Generate base sprites → adjust → regenerate
- **Consistency:** AI maintains style guide automatically across all assets
- **Speed:** Significantly faster than manual pixel art creation

**Workflow:**
1. Define style prompts (isometric perspective, cottagecore colors, 16×16 base)
2. Use PixelLab AI MCP to generate plant sprites in-situ during development
3. Export sprites directly to React Native asset folders
4. Animate using frame-by-frame AI generation or manual tweaking
5. Iterate based on in-app visual testing

**Production Timeline (With PixelLab AI):**
- Initial asset generation: 3-5 days (vs 2-3 weeks manual)
- Refinement and animation: 5-7 days
- **Total: 1-2 weeks** (60% faster than traditional pixel art)
- **Estimated cost: $0-$500** (PixelLab AI subscription vs $2-3K freelancer)

**Benefits:**
- Real-time iteration during development
- Easy variant creation (seasonal plants, rare evolutions)
- Consistent art style enforced by AI prompts
- Lower cost for MVP, iterate post-launch

**Fallback:** If PixelLab AI doesn't meet quality standards, contract traditional pixel artist using generated assets as reference

**Style Guide Deliverable:**
- Color palette (hex codes)
- Isometric angle specifications (2:1 ratio)
- Pixel density standards
- Animation timing references
- Lighting/shadow conventions for isometric depth

---

## Technical Requirements & Architecture

### Platform & Technology Stack

**Platform:**
- iOS 16.0+ (supports latest 95% of iPhone users)
- iPhone only (no iPad optimization for MVP)
- Portrait orientation primary, landscape optional
- Future: Android via React Native (platform-ready architecture)

**Development Stack:**
- **Framework:** React Native (Expo) - leverages developer experience and rapid iteration
- **Language:** TypeScript (type-safe JavaScript)
- **Rendering Engine:** react-native-svg OR Phaser (2D pixel art rendering, animations)
- **Backend:** Supabase (PostgreSQL database, auth, realtime, storage)
- **Local Cache:** AsyncStorage + expo-sqlite (offline-first capability)
- **IAP:** react-native-iap (in-app purchases, StoreKit wrapper)
- **Notifications:** Expo Push Notifications
- **Analytics:** Supabase Analytics + Expo Analytics (privacy-first)
- **Asset Design:** PixelLab AI + PixelLab AI MCP (AI-assisted pixel art generation)

**Why React Native:**
- Developer has React Native experience (faster MVP delivery)
- Cross-platform ready (Android expansion with minimal additional effort)
- Hot reload and familiar tooling accelerate iteration
- Supabase JavaScript SDK is mature and well-documented
- Quality remains high for this app's requirements (lightweight pixel art, simple interactions)

**Third-Party Dependencies:**
- Supabase JS SDK
- react-native-callkeep (call detection via native module)
- Expo modules (push notifications, local storage, etc.)
- Minimal additional dependencies to reduce app size

---

### System Architecture

**Architecture Pattern:** Component-based with React hooks + Context API

```
┌──────────────────────────────────────────────┐
│      React Native App (Expo)                 │
│                                              │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐ │
│  │ Garden   │  │ Friend   │  │ Settings  │ │
│  │ Screen   │  │ List     │  │ Screen    │ │
│  └────┬─────┘  └────┬─────┘  └─────┬─────┘ │
│       │             │               │       │
│  ┌────┴─────────────┴───────────────┴─────┐ │
│  │   React Context (Global State)         │ │
│  │   + Custom Hooks (usePlants, etc.)     │ │
│  └────┬─────────────┬──────────────┬──────┘ │
│       │             │              │        │
│  ┌────┴─────────────┴──────────────┴──────┐ │
│  │   Local Cache (AsyncStorage + SQLite)  │ │
│  └────┬─────────────┬──────────────┬──────┘ │
│       │             │              │        │
└───────┼─────────────┼──────────────┼────────┘
        │             │              │
        ▼             ▼              ▼
  ┌─────────────────────────────────────────┐
  │         Supabase Backend                │
  │  ┌──────────┐  ┌──────────┐  ┌────────┐│
  │  │PostgreSQL│  │ Realtime │  │  Auth  ││
  │  │ Database │  │   Sync   │  │        ││
  │  └──────────┘  └──────────┘  └────────┘│
  │  ┌──────────┐  ┌──────────┐            │
  │  │ Storage  │  │Edge Funcs│            │
  │  │ (Assets) │  │ (Logic)  │            │
  │  └──────────┘  └──────────┘            │
  └─────────────────────────────────────────┘
```

**Data Flow:**
1. User opens app → Supabase client fetches latest plant states
2. Data cached locally in AsyncStorage + SQLite for offline access
3. User logs interaction → Immediately updates local cache + syncs to Supabase
4. Realtime subscriptions notify of remote changes (future: multi-device sync)

---

### Data Models

**Core Entities (Core Data Schema):**

**1. Friend**
```swift
Entity: Friend
- id: UUID (primary key)
- name: String
- phoneNumber: String? (optional)
- email: String? (optional)
- createdAt: Date
- plantType: PlantType (enum)
- contactFrequency: ContactFrequency (enum: weekly, biweekly, monthly)
- relationship: Plant (one-to-one)
```

**2. Plant**
```swift
Entity: Plant
- id: UUID (primary key)
- friendId: UUID (foreign key → Friend)
- currentHydration: Double (0-100)
- lastHydrationUpdate: Date (timestamp for decay calculation)
- evolutionStage: EvolutionStage (enum: sprout, young, mature)
- streakCount: Int
- totalInteractions: Int
- isDead: Bool
- gridPositionX: Int (0-5)
- gridPositionY: Int (0-5)
- decayRatePerDay: Double (calculated from frequency)
```

**3. Interaction**
```swift
Entity: Interaction
- id: UUID (primary key)
- friendId: UUID (foreign key → Friend)
- type: InteractionType (enum: call, text, manual)
- timestamp: Date
- hydrationRestored: Double
- note: String? (optional for manual logs)
```

**4. GardenLayout**
```swift
Entity: GardenLayout
- id: UUID (primary key)
- userId: UUID
- roomId: UUID (future: multiple rooms)
- theme: String (e.g., "cozy-greenhouse")
- gridSize: Int (default: 6)
- decorativeItems: [DecorativeItem] (JSON array)
```

**5. DecorativeItem**
```swift
Struct: DecorativeItem (JSON)
- itemId: String (e.g., "wooden-table")
- gridPositionX: Int
- gridPositionY: Int
```

---

### Backend Architecture

**Approach:** Serverless / Backend-as-a-Service (BaaS)

**Option 1: Firebase (Recommended for MVP)**

**Services Used:**
- **Firestore:** Real-time database for hydration state sync
- **Cloud Functions:** Scheduled decay calculations (optional, can be client-side)
- **Firebase Auth:** Sign in with Apple integration
- **Firebase Analytics:** Privacy-compliant usage tracking
- **Cloud Messaging:** Push notifications (APNs integration)

**Data Flow:**
1. User opens app → Fetches latest plant states from Firestore
2. Client calculates decay based on timestamps
3. User logs interaction → Updates Firestore + Core Data
4. CloudKit syncs Core Data for backup

**Option 2: Supabase (Alternative)**

**Services Used:**
- **Postgres Database:** Structured data with realtime subscriptions
- **Edge Functions:** Serverless API endpoints
- **Supabase Auth:** Social authentication
- **Realtime:** Live data synchronization

---

### Hydration Decay System (Server-Side Logic)

**Timestamp-Based Calculation (No Cron Jobs):**

```swift
func calculateCurrentHydration(plant: Plant) -> Double {
    let now = Date()
    let elapsed = now.timeIntervalSince(plant.lastHydrationUpdate)
    let elapsedHours = elapsed / 3600
    let elapsedDays = elapsedHours / 24

    let decayAmount = elapsedDays * plant.decayRatePerDay
    let currentHydration = max(0, plant.currentHydration - decayAmount)

    return currentHydration
}
```

**On App Launch:**
1. Fetch all plants from Core Data
2. For each plant: `plant.currentHydration = calculateCurrentHydration(plant)`
3. Update `lastHydrationUpdate` to `Date.now`
4. Check for deaths (hydration = 0 for >24 hours)
5. Trigger animations (wilting, death) if state changed

**On Interaction Logged:**
1. Restore hydration: `plant.currentHydration = min(100, current + restorationAmount)`
2. Increment streak if within frequency window
3. Update `lastHydrationUpdate` timestamp
4. Sync to backend

---

### iOS-Specific Features

**1. CallKit Integration (Call Detection)**

```swift
import CallKit

class CallObserver: CXCallObserverDelegate {
    func callObserver(_ observer: CXCallObserver, callChanged call: CXCall) {
        if call.hasEnded {
            // Check if call matches a friend's phone number
            // Log interaction if match found
        }
    }
}
```

**Limitations:**
- Only detects outgoing calls
- Requires user to initiate via in-app "Call" button for reliable tracking
- No access to call duration or conversation data (privacy)

**2. MessageUI Framework (SMS Composer)**

```swift
import MessageUI

class MessageComposer: MFMessageComposeViewControllerDelegate {
    func presentSMSComposer(to phoneNumber: String) {
        let composer = MFMessageComposeViewController()
        composer.recipients = [phoneNumber]
        composer.messageComposeDelegate = self
        // Present modally
    }

    func messageComposeViewController(_ controller: MFMessageComposeViewController,
                                     didFinishWith result: MessageComposeResult) {
        if result == .sent {
            // Log interaction
        }
    }
}
```

**3. Push Notifications (APNs)**

**Local Notifications (Daily Reminder):**
```swift
import UserNotifications

func scheduleDailyReminder(at time: DateComponents) {
    let content = UNMutableNotificationContent()
    content.title = "Good morning!"
    content.body = "3 plants need watering today 🌱"
    content.sound = .default

    let trigger = UNCalendarNotificationTrigger(dateMatching: time, repeats: true)
    let request = UNNotificationRequest(identifier: "daily-reminder",
                                       content: content,
                                       trigger: trigger)

    UNUserNotificationCenter.current().add(request)
}
```

**Remote Notifications (Critical Alerts):**
- Sent via APNs when plant reaches 0% hydration
- Triggered by backend (Firebase Cloud Messaging)

**4. CloudKit Sync**

**Purpose:** Backup garden state, enable device switching

**Sync Strategy:**
- Async, non-blocking sync
- Conflict resolution: "last write wins" for most recent timestamp
- Private CloudKit database (user data only)
- Syncs on: App launch, interaction logged, every 6 hours

---

### SpriteKit Rendering Engine

**Scene Hierarchy:**

```
GardenScene (SKScene)
├── BackgroundNode (SKSpriteNode) - Greenhouse walls, lighting
├── GridNode (SKNode)
│   ├── FloorTiles (6×6 SKSpriteNodes)
│   ├── PlantNodes (SKSpriteNode + SKAction animations)
│   └── FurnitureNodes (SKSpriteNode)
└── UIOverlayNode (SKNode) - Tap targets, interaction zones
```

**Drag-and-Drop Implementation:**

```swift
override func touchesMoved(_ touches: Set<UITouch>, with event: UIEvent?) {
    guard let touch = touches.first else { return }
    let location = touch.location(in: self)

    if let draggedNode = selectedNode {
        draggedNode.position = location

        // Snap to grid
        let gridPosition = snapToGrid(location)
        if isValidPlacement(at: gridPosition) {
            // Show green highlight
        } else {
            // Show red highlight (collision)
        }
    }
}
```

**Animation Performance:**
- Target: 60fps constant
- Sprite batching for multiple plants
- Particle systems for ambient effects (dust motes, sparkles)
- Lazy loading: Only animate visible plants on screen

---

### In-App Purchases (StoreKit 2)

**Product IDs:**

**Consumables:**
- `com.rooted.revive.premium` - Premium Revive ($0.99)

**Non-Consumables (Post-MVP):**
- `com.rooted.furniture.fairylights` - Fairy Lights ($1.99)
- `com.rooted.theme.moonlight` - Moonlight Theme ($2.99)

**Auto-Renewable Subscription (Post-MVP):**
- `com.rooted.gardenpass.monthly` - Garden Pass ($4.99/month)

**Implementation:**

```swift
import StoreKit

@MainActor
class StoreManager: ObservableObject {
    func purchasePremiumRevive() async throws {
        let product = try await Product.products(for: ["com.rooted.revive.premium"]).first
        guard let product else { return }

        let result = try await product.purchase()
        // Handle transaction
    }
}
```

**Receipt Validation:**
- Server-side validation via App Store Server API
- Prevents piracy and refund abuse

---

### Security & Privacy

**Data Privacy:**
- **No third-party tracking** - Apple Analytics only
- **Local-first architecture** - Data stays on device unless user opts into cloud sync
- **End-to-end encryption** - CloudKit encrypts all user data
- **No conversation content** - Never access or store SMS/call content

**Permissions Required:**
- **Contacts:** Optional, for friend import (request on first add)
- **Notifications:** Optional, requested after first plant added
- **Sign in with Apple:** Optional, for cloud backup only

**App Tracking Transparency:**
- Not required (no cross-app tracking)
- Privacy Nutrition Label highlights: Data not linked to user identity

---

### Performance Requirements

**App Size:**
- Target: <50 MB download size
- Pixel art assets are lightweight
- Minimal dependencies

**Memory Usage:**
- Target: <100 MB RAM during normal use
- SpriteKit scene memory management
- Lazy loading of plant sprites

**Battery Impact:**
- Background refresh: Minimal (1-2 checks per day)
- No continuous GPS or networking
- Efficient decay calculations (no constant polling)

**Network Usage:**
- Minimal (sync only on launch + interactions)
- Offline-first functionality
- CloudKit sync: <1 MB per sync typically

---

### Testing Requirements

**Unit Testing:**
- Hydration decay calculations
- Streak logic and frequency windows
- Grid collision detection
- IAP transaction handling

**Integration Testing:**
- CloudKit sync conflict resolution
- CallKit observer reliability
- StoreKit sandbox purchases
- Push notification delivery

**UI/UX Testing:**
- Drag-and-drop smoothness across devices
- SpriteKit performance on older iPhones (iPhone XR minimum)
- VoiceOver accessibility
- Dynamic type scaling

**Beta Testing:**
- TestFlight with 50-100 Gen Z users
- Focus on: Onboarding clarity, emotional engagement, feature discovery
- A/B test: Free revive limits (1/week vs 3/week)

---

### DevOps & Deployment

**Version Control:**
- Git + GitHub
- Branching strategy: Gitflow (develop, feature branches, main)

**CI/CD:**
- GitHub Actions or Xcode Cloud
- Automated builds on PR merge
- TestFlight beta distribution

**App Store Submission:**
- Age rating: 4+ (no objectionable content)
- Category: Social Networking OR Lifestyle
- Keywords: friendship, relationships, habit tracker, wellness, plants
- App Store Optimization (ASO): Emphasis on pixel art aesthetic, Gen Z appeal

**Monitoring:**
- Crash reporting: Apple's built-in crash analytics
- Performance monitoring: Xcode Instruments
- User feedback: In-app feedback form → GitHub Issues

---

### Scalability Considerations

**MVP Scale Targets:**
- 10,000 users
- 200,000 plants (avg 20 plants per user)
- 50,000 daily active users (DAU) at peak

**Database Scaling:**
- Firebase Firestore: Scales automatically
- CloudKit: Apple manages infrastructure
- Core Data: Local, no scaling concerns

**Future Optimization:**
- CDN for static assets (plant sprites, backgrounds)
- Edge computing for decay calculations (Cloudflare Workers)
- Caching layer for frequently accessed data

---

## Monetization Strategy

### Business Model

**Primary Model:** Free-to-play (F2P) with in-app purchases (IAP)

**Rationale:**
- Gen Z won't pay upfront for unknown apps
- Emotional investment precedes financial investment
- Users must experience value before willingness to pay
- Competitive advantage: Try before you buy

---

### Revenue Streams

**Phase 1: MVP Launch (Months 0-6)**

**1. Premium Plant Revives (Primary Revenue)**
- **Product:** Consumable IAP
- **Price:** $0.99 per revive
- **Value Proposition:** Restore dead plant with full streak + evolution stage intact
- **Emotional Hook:** After 30+ days of building a friendship's plant, losing it feels significant
- **Free Alternative:** 1 free revive per week (resets to Stage 1, clears streak)

**Expected Conversion:**
- 2-5% of users will experience plant death
- 40% of those will pay to revive (emotional attachment)
- Target: $0.15 ARPU (Average Revenue Per User) in Month 3

**2. Decorative Item Packs (Secondary Revenue - Post-MVP v1.1)**
- **Product:** Non-consumable IAP
- **Price:** $1.99 per pack (4-5 items)
- **Examples:**
  - Fairy Lights Pack
  - Garden Gnome Collection
  - Seasonal Decor (Halloween, Winter, Spring)
- **Value Proposition:** Self-expression, aesthetic customization
- **Emotional Hook:** "Make your greenhouse uniquely yours"

**Expected Conversion:**
- 3-5% of engaged users (those who customize layout)
- Target: $0.10 additional ARPU

**Phase 2: Subscription Introduction (Month 6+)**

**3. Garden Pass Subscription**
- **Product:** Auto-renewable monthly subscription
- **Price:** $4.99/month
- **Included Benefits:**
  - 3 premium revives per month (instead of $2.97 value)
  - Exclusive monthly plant drops (rare variants)
  - Early access to new themes
  - Ad-free experience (if ads introduced later)
  - 2× XP for faster plant evolution
  - Exclusive Garden Pass badge/flair

**Expected Conversion:**
- 1-2% of MAU (Monthly Active Users)
- Target: $0.50+ ARPU for subscribed cohort

**Phase 3: Future Revenue (Year 1+)**

**4. Additional IAP Opportunities**
- **Garden Room Expansions:** $2.99 for additional 6×6 grid
- **Theme Packs:** $2.99 per premium theme (Moonlight, Cosmic, Underwater)
- **Plant Slots:** Increase 20-friend limit to 40 for $4.99
- **Guaranteed Rare Evolutions:** $1.99 to force rare variant on next evolution

---

### Pricing Strategy

**Psychological Pricing:**
- All prices end in .99 (perceived value)
- Entry-level IAP at $0.99 (low barrier)
- Premium offerings at $2.99-$4.99 (higher perceived quality)

**Value Bundling:**
- Garden Pass provides >50% savings vs buying items individually
- Encourages subscription over one-time purchases

**Limited-Time Offers (Post-MVP):**
- Seasonal bundles (Winter Pack: $3.99 for theme + decorations + 2 revives)
- Launch promotion: First month of Garden Pass for $0.99
- Anniversary events: Discounted rare plant packs

---

### Alternative Monetization Model (Under Exploration)

**Coin & Gem Economy System**

**NOTE:** This is an alternative monetization approach being considered. NOT included in MVP, requires further analysis and testing before implementation.

**Concept:**
Instead of direct IAP purchases (pay $0.99 for revive), implement a dual-currency system:

**Currency 1: Coins (Soft Currency)**
- **Earn passively:** Daily login rewards, interaction logging, plant care
- **Earn rate:** Slow accumulation (10-50 coins/day for active users)
- **Uses:**
  - Purchase basic decorative items (50-200 coins)
  - Free plant revives (250 coins)
  - Theme unlocks (500 coins)

**Currency 2: Gems (Hard Currency)**
- **Earn rarely:** Weekly streaks, achievements, rare drops
- **Earn rate:** Very slow (5-10 gems/week)
- **Premium purchase:** Can buy gems with real money
  - 100 gems = $0.99
  - 500 gems = $3.99 (20% bonus)
  - 1200 gems = $7.99 (50% bonus)
- **Uses:**
  - Premium revives (50 gems = restore full streak)
  - Exclusive decorations (100-300 gems)
  - Guaranteed rare evolutions (200 gems)
  - Subscription bypass (800 gems/month instead of $4.99 subscription)

**Freemium Path:**
- Patient users can earn everything through gameplay (slow grind)
- Impatient users can purchase gems to accelerate

**Pros:**
- More engaging economy (feels like progression vs transactions)
- Psychological distance from real money (gems feel less "expensive")
- Encourages daily engagement for coin farming
- Aligns with cozy game monetization (Animal Crossing Pocket Camp, Stardew Valley mobile)
- Flexibility: Users choose how to spend currency

**Cons:**
- More complex to balance (coin/gem earn rates, pricing)
- Risk of feeling "grindy" if not balanced properly
- Requires additional UI (currency wallets, stores)
- Could dilute "calm" aesthetic if too gamified
- More difficult to calculate ARPU and LTV

**Decision Point:**
- Test direct IAP in MVP (simpler, faster to launch)
- A/B test coin/gem economy post-MVP with subset of users
- Evaluate based on:  - User sentiment (does it feel predatory or rewarding?)
  - Conversion rates (do more users spend with currency system?)
  - Retention (does currency farming increase DAU?)

**If implementing:**
- Keep earn rates generous (avoid pay-to-win perception)
- Transparent pricing (no obfuscation of real-money value)
- No time-limited currency offers that create FOMO pressure

---

### Monetization Guardrails (Ethical F2P)

**Design Principles:**
- **No paywalls for core functionality** - Free users get full friendship maintenance experience
- **No artificial time gates** - Plant growth happens naturally, not accelerated by payment
- **No loot boxes / gambling mechanics** - All purchases are transparent, known value
- **Generous free tier** - 1 revive/week prevents monetization desperation
- **No ads in MVP** - Clean, calm experience (ads only considered if subscription fails)

**Anti-Dark Pattern Commitments:**
- No surprise charges or unclear subscription terms
- Easy cancellation (standard iOS process)
- No "pay to win" - paying doesn't make friendships easier, just recovers mistakes
- Transparent pricing - all costs shown upfront

---

### Revenue Projections (Conservative Estimates)

**Assumptions:**
- Launch: 1,000 users Month 1
- Growth: 50% MoM for 6 months (organic + ASO)
- Retention: 25% Day 30 retention
- ARPU targets as outlined above

| Month | MAU | DAU | Premium Revives Revenue | IAP Decor Revenue | Subscription Revenue | Total Revenue |
|-------|-----|-----|-------------------------|-------------------|----------------------|---------------|
| 1 | 1,000 | 400 | $150 | $0 | $0 | $150 |
| 3 | 3,375 | 1,350 | $500 | $100 | $0 | $600 |
| 6 | 11,400 | 4,500 | $1,700 | $450 | $570 | $2,720 |
| 12 | 51,000 | 20,000 | $7,600 | $2,000 | $5,100 | $14,700 |

**Year 1 Target:** $50,000 total revenue (covers operational costs + pixel art asset creation)

---

### App Store Optimization (ASO) for Monetization

**Keywords Targeting High-Intent Users:**
- "friendship tracker"
- "relationship manager"
- "habit tracker friends"
- "plant care game"

**App Store Listing Optimization:**
- Screenshots emphasize customization (drives decor purchases)
- Video preview shows plant evolution (emotional attachment = revive purchases)
- Description highlights "free to start" + "optional cosmetics"

**Pricing Visibility:**
- In-app purchase prices shown on App Store listing
- No surprise fees - builds trust with Gen Z

---

### Experimentation & Optimization

**A/B Testing Roadmap:**

**Month 1-2:**
- Test free revive limits: 1/week vs 1/month
- Test premium revive pricing: $0.99 vs $1.99
- Hypothesis: Lower free limit + lower premium price = higher conversion

**Month 3-4:**
- Test Garden Pass pricing: $3.99 vs $4.99 vs $5.99
- Test subscription benefits (which perks drive conversion)
- Hypothesis: $4.99 with exclusive plants converts best

**Month 5-6:**
- Test decorative pack pricing: $1.49 vs $1.99 vs $2.99
- Test bundle offers vs individual items
- Hypothesis: Bundles increase average transaction value

**Analytics Tracking:**
- Purchase funnel: View → Intent → Transaction → Completion
- Cohort LTV (Lifetime Value) analysis
- Time-to-first-purchase tracking
- Churn analysis post-purchase

---

### Long-Term Monetization Vision

**Year 2+ Opportunities:**

**Community Features (Freemium Model):**
- Friend gardens visible to each other (free)
- Garden showcases / leaderboards (free)
- Premium: Featured garden placement, exclusive badges

**B2B Opportunities:**
- Rooted for Teams: Workplace relationship tracking ($9.99/user/month for companies)
- Therapist-recommended edition: Co-branded with mental health platforms

**Licensing & Partnerships:**
- Pixel art collaborations with indie artists (revenue share on themed packs)
- Plant shop partnerships (real plant discount codes for active users)
- Wellness brand integrations (non-intrusive, value-aligned)

---

## Success Metrics & KPIs

### North Star Metric

**Primary Success Indicator:** **Weekly Active Friends** (total friendships being actively maintained across all users)

**Rationale:**
- Measures actual behavior change (maintaining relationships)
- Correlates with user value and retention
- Reflects product mission ("grow friendships")
- Leading indicator for monetization (more active relationships = more emotional investment = higher revive conversion)

**Target:** 100,000 weekly active friendships by Month 12

---

### Product Metrics (HEART Framework)

**Happiness (User Satisfaction)**

| Metric | Target | Measurement |
|--------|--------|-------------|
| App Store Rating | 4.5+ stars | Monthly review average |
| NPS (Net Promoter Score) | 40+ | In-app survey (quarterly) |
| Session Sentiment | 80% positive | Post-session "How do you feel?" prompt |

**Engagement (Feature Usage)**

| Metric | Target | Measurement |
|--------|--------|-------------|
| DAU/MAU Ratio | 40%+ | Daily Active / Monthly Active Users |
| Sessions per week | 5+ | Average user opens app 5+ times/week |
| Plants per user | 8-12 | Avg number of friends added to garden |
| Interaction logging rate | 70%+ | % of interactions logged through app |
| Customization rate | 60%+ | % of users who rearrange garden layout |

**Adoption (New User Success)**

| Metric | Target | Measurement |
|--------|--------|-------------|
| First plant added | 90% within 1st session | Onboarding completion rate |
| 3+ plants added | 70% by Day 3 | Activation milestone |
| First interaction logged | 80% by Day 2 | Time-to-value |
| Cloud backup enabled | 50% by Day 7 | Progressive auth conversion |

**Retention (Stickiness)**

| Metric | Target | Measurement |
|--------|--------|-------------|
| Day 1 retention | 60%+ | % users returning day after install |
| Day 7 retention | 40%+ | % users active 1 week post-install |
| Day 30 retention | 25%+ | % users active 1 month post-install |
| Day 90 retention | 15%+ | % users active 3 months post-install |
| Churn rate | <10% monthly | % monthly users who don't return next month |

**Task Success (Feature Effectiveness)**

| Metric | Target | Measurement |
|--------|--------|-------------|
| Plant evolution rate | 60% of plants reach Stage 2 | Successful relationship maintenance |
| Plant death rate | <15% of all plants | Indicates healthy engagement without frustration |
| Revive usage (free) | 40% of deaths | Users value relationships enough to revive |
| Grid rearrange frequency | 2+ times per week | Active customization engagement |

---

### Business Metrics

**Growth**

| Metric | Month 3 Target | Month 6 Target | Month 12 Target |
|--------|----------------|----------------|-----------------|
| Total users | 3,000 | 10,000 | 50,000 |
| Monthly Active Users (MAU) | 2,000 | 7,000 | 35,000 |
| Daily Active Users (DAU) | 800 | 3,000 | 15,000 |
| Organic install rate | 60%+ | 70%+ | 75%+ |
| K-factor (virality) | 0.3 | 0.5 | 0.7 |

**Monetization**

| Metric | Month 3 Target | Month 6 Target | Month 12 Target |
|--------|----------------|----------------|-----------------|
| ARPU (Avg Revenue Per User) | $0.15 | $0.25 | $0.40 |
| Paying user % | 3% | 5% | 7% |
| ARPPU (Avg Revenue Per Paying User) | $5.00 | $5.50 | $6.00 |
| LTV (Lifetime Value) | $2.00 | $4.00 | $8.00 |
| Monthly Recurring Revenue (MRR) | $0 | $500 | $5,000 |
| Total Revenue | $600 | $3,000 | $50,000 |

**Acquisition Cost**

| Metric | Target | Notes |
|--------|--------|-------|
| CAC (Customer Acquisition Cost) | <$2.00 | Primarily organic for MVP |
| LTV:CAC Ratio | 3:1 minimum | Healthy unit economics |
| Organic % | 70%+ | Word-of-mouth + ASO |
| Paid % | <30% | Only if LTV justifies |

---

### Feature-Specific Metrics

**Greenhouse Customization**

- % users who enter edit mode: **60% target**
- Avg time spent customizing: **3+ minutes per session**
- % users who unlock decorative items: **40% by Month 3** (post-MVP)

**Communication Auto-Detection**

- % interactions via in-app buttons: **70% target**
- % interactions manually logged: **30% target**
- Call detection accuracy: **95%+ match rate**

**Push Notifications**

- Opt-in rate: **65%+ target**
- Daily reminder open rate: **40%+ target**
- Critical alert (plant dying) open rate: **70%+ target**

**Plant Evolution**

- % plants reaching Stage 2 (Young): **60% target**
- % plants reaching Stage 3 (Mature): **30% target**
- Avg streak length: **14+ days target**

---

### Qualitative Success Indicators

**User Testimonials (Target Themes):**
- "I actually text my friends more now"
- "This doesn't feel like a chore, it feels peaceful"
- "I love customizing my greenhouse"
- "Seeing my plants grow makes me proud"

**Social Proof:**
- TikTok #RootedApp videos: 100+ organic posts by Month 6
- Instagram garden screenshots: 500+ tagged photos by Month 12
- Reddit/Discord community formation: 1,000+ members by Month 12

**Press & Influencer Coverage:**
- 3+ mental health / wellness influencer features
- 2+ tech blog reviews (TechCrunch, The Verge, etc.)
- 1+ podcast feature on relationship wellness

---

### Risk Metrics (Early Warning Signals)

**Product Risk**

| Metric | Threshold | Action |
|--------|-----------|--------|
| Day 1 retention | <40% | Revisit onboarding flow |
| Plant death rate | >25% | Adjust decay rates or revive limits |
| Avg plants per user | <4 | Improve friend-adding UX |
| Session length | <2 minutes | Add engagement hooks |

**Monetization Risk**

| Metric | Threshold | Action |
|--------|-----------|--------|
| Paying user % | <2% | Test pricing or value props |
| Revive conversion | <25% | Emotional attachment insufficient |
| Subscription churn | >15% monthly | Reduce price or improve benefits |

**Technical Risk**

| Metric | Threshold | Action |
|--------|-----------|--------|
| Crash rate | >1% | Critical bug fix sprint |
| CloudKit sync failures | >5% | Investigate backend reliability |
| App load time | >3 seconds | Performance optimization |

---

### Analytics Implementation

**Tools:**
- **Apple App Analytics** (privacy-first, built-in)
- **Firebase Analytics** (event tracking, funnels)
- **Custom dashboard** (Amplitude or Mixpanel for cohort analysis)

**Key Events to Track:**

```
User Acquisition:
- app_installed
- onboarding_started
- onboarding_completed

Core Actions:
- friend_added (properties: plant_type, frequency)
- interaction_logged (properties: type, auto_vs_manual)
- plant_tapped (view plant info)
- garden_customized (edit mode usage)

Monetization:
- revive_prompt_shown
- revive_purchased (free vs premium)
- iap_item_viewed
- iap_purchased (product_id, price)
- subscription_started / cancelled

Engagement:
- session_start / session_end
- plant_evolved (stage reached)
- plant_died
- notification_received / opened
- settings_changed

Social:
- garden_screenshot_taken
- friend_invited (future feature)
```

---

### Experimentation Framework

**A/B Test Structure:**

**Hypothesis Template:**
- **What:** Feature/change being tested
- **Why:** Expected impact on metrics
- **Success Criteria:** Specific metric improvement
- **Sample Size:** Minimum users needed for statistical significance
- **Duration:** Test runtime (typically 2 weeks)

**Example:**

| Test | Hypothesis | Success Metric | Status |
|------|------------|----------------|--------|
| Onboarding v2 | Guided friend-adding increases activation | 3+ plants by Day 3: 70% → 80% | Planned |
| Revive pricing | $0.99 converts better than $1.99 | Revive purchase rate: +10% | Month 2 |
| Notification time | 9AM performs better than 8AM | Open rate: +5% | Month 3 |

---

## Product Roadmap

### Development Timeline

**Phase 0: Pre-Development (Month -2 to 0)**
- Finalize PRD and technical specs
- Hire/contract iOS developer + pixel artist
- Set up development environment (GitHub, Firebase, TestFlight)
- Commission pixel art assets (8 plants × 4 stages, greenhouse theme, furniture)

---

### Phase 1: MVP Development (Months 1-3)

**Month 1: Core Foundation**
- ✅ SwiftUI + SpriteKit project setup
- ✅ Core Data schema implementation
- ✅ 6×6 grid rendering with SpriteKit
- ✅ Drag-and-drop plant placement
- ✅ Basic plant sprites integrated
- ✅ Hydration decay system (timestamp-based)

**Month 2: Features & Interactions**
- ✅ Friend-to-plant mapping
- ✅ Plant info panel UI
- ✅ CallKit integration (call detection)
- ✅ MessageUI composer (text detection)
- ✅ Manual interaction logging
- ✅ Plant evolution logic (3 stages)
- ✅ Push notification system (local + APNs setup)

**Month 3: Polish & Launch Prep**
- ✅ Onboarding flow (3 screens)
- ✅ Settings & account management
- ✅ CloudKit sync implementation
- ✅ StoreKit 2 IAP (premium revive)
- ✅ Progressive authentication
- ✅ Beta testing with 50 users
- ✅ App Store submission

**MVP Launch Target: End of Month 3**

---

### Phase 2: Post-Launch Optimization (Months 4-6)

**Month 4: Iterate Based on User Feedback**
- Bug fixes from initial user reports
- Onboarding improvements (based on drop-off data)
- Hydration decay tuning (if plant death rate >25%)
- Performance optimization (target <3s load time)
- A/B test: Free revive limits (1/week vs 3/month)

**Month 5: First Feature Additions**
- **Garden customization v1.1:**
  - 4 additional decorative items (fairy lights, gnome, bird bath, potting bench)
  - IAP decorative packs ($1.99 per pack)
- **Plant variety expansion:**
  - Add 4 new plant types (total: 12 types)
- **Notification enhancements:**
  - Streak celebration notifications
  - Customizable reminder times

**Month 6: Monetization Expansion**
- **Garden Pass subscription launch:**
  - $4.99/month with benefits package
  - Early access to new plants
  - 3 premium revives/month
  - Exclusive badge
- **Theme system activation:**
  - Add 2nd theme: "Moonlight Greenhouse"
  - IAP: $2.99 per theme
- **Revenue optimization:**
  - A/B test subscription pricing ($3.99 vs $4.99 vs $5.99)

**Phase 2 Goals:**
- 10,000 total users
- 7,000 MAU
- $3,000 monthly revenue
- 4.5+ App Store rating

---

### Phase 3: Growth & Retention Features (Months 7-12)

**Months 7-8: Social Features (Lite)**
- **Garden sharing:**
  - Screenshot export with branding ("My Rooted Garden")
  - Share to Instagram/TikTok with auto-hashtags
  - Friend referral system (invite friends → unlock decorative item)
- **Achievements system:**
  - Badges for streaks (7, 30, 90, 365 days)
  - Collection milestones (all 12 plant types)
  - Garden decorator (place 20+ decorative items)

**Months 9-10: Advanced Customization**
- **Garden rooms expansion:**
  - Unlock 2nd greenhouse room ($2.99 IAP)
  - Up to 40 total friends (20 per room)
- **Rare plant variants:**
  - 5% chance for rare evolution
  - Guaranteed rare evolution IAP ($1.99)
  - Seasonal variants (Halloween, Winter, Spring)
- **Furniture categories:**
  - 15+ additional decorative items
  - Themed furniture packs (Cottage, Modern, Zen)

**Months 11-12: Seasonal Events & Community**
- **First seasonal event: Winter Festival**
  - Limited-time winter plants
  - Special greenhouse decorations
  - Event-exclusive achievements
- **Community features (opt-in):**
  - Friend garden visits (see each other's gardens)
  - Garden showcases (top gardens featured weekly)
  - Leaderboards (longest streaks, most evolutions)
- **Content updates:**
  - 4+ new plant types
  - 2+ new themes (Underwater, Cosmic)

**Phase 3 Goals:**
- 50,000 total users
- 35,000 MAU
- $50,000 total Year 1 revenue
- Top 100 in Social Networking category (App Store)

---

### Post-Year 1: Future Roadmap (Months 13+)

**Advanced Features (v2.0+)**

**1. AI-Powered Relationship Insights**
- Weekly report: "Your strongest connections" (based on interaction patterns)
- Suggestions: "It's been 3 weeks since you talked to [Friend]. Maybe check in?"
- Relationship heatmap: Visual of friend interaction frequency

**2. Cross-Platform Expansion**
- **iPad optimization:** Larger garden grid (8×8 or 10×10)
- **Apple Watch app:** Quick interaction logging, garden health widget
- **iMessage extension:** Send plant stickers, check garden from Messages

**3. Advanced Gamification**
- **Plant breeding system:** Combine two plants to create hybrid variants
- **Garden XP & leveling:** Unlock perks as you tend your garden
- **Daily quests:** "Water 5 plants today" → earn decorative rewards
- **Seasonal garden rankings:** Compete for best garden design

**4. Social Expansion**
- **Collaborative gardens:** Shared greenhouse with family/friend group
- **Garden tours:** Browse other users' public gardens for inspiration
- **Plant trading:** Exchange rare variants with other users
- **Rooted communities:** Join themed groups (Plant Parents, Long-Distance Friends, etc.)

**5. Wellness Integration**
- **Apple Health integration:** Log social interactions as wellness data
- **Journaling:** Add private notes to each interaction log
- **Mood tracking:** "How did this conversation make you feel?"
- **Therapist collaboration:** Rooted for therapy clients (B2B partnership)

---

### Platform Expansion Considerations

**Android Version (Year 2+):**
- **Pros:** Larger addressable market, different monetization potential
- **Cons:** Full SMS/call permission access may change user behavior dynamics
- **Decision criteria:** If iOS hits 100K MAU with healthy retention, consider Android

**Web Version (Year 2+):**
- **Progressive Web App (PWA)** for desktop access
- Read-only garden view (main interactions still iOS)
- Useful for workplace relationship tracking

---

### Feature Prioritization Framework

When evaluating future features, assess against:

1. **Mission Alignment:** Does it help people maintain real friendships?
2. **Engagement Impact:** Will it increase DAU/MAU or retention?
3. **Monetization Potential:** Does it create willingness to pay?
4. **Development Cost:** Effort vs expected return
5. **Platform Fit:** Leverages iOS capabilities naturally?

**Decision Matrix Example:**

| Feature | Mission | Engagement | Monetization | Dev Cost | Priority |
|---------|---------|------------|--------------|----------|----------|
| Garden rooms expansion | High | High | High | Medium | P0 |
| AI relationship insights | High | Medium | Low | High | P2 |
| Plant trading system | Medium | High | Medium | High | P3 |
| Apple Watch app | Medium | Medium | Low | Medium | P2 |

---

## Risks & Mitigation Strategies

### Product Risks

**Risk 1: Users find plant death too punishing**
- **Mitigation:** A/B test decay rates, offer more free revives
- **Monitoring:** Track plant death rate (<15% target)

**Risk 2: Auto-detection doesn't work reliably**
- **Mitigation:** Emphasize manual logging option, improve CXCallObserver implementation
- **Monitoring:** Track auto vs manual logging ratio

**Risk 3: Onboarding friction (permission requests)**
- **Mitigation:** Progressive permission requests, clear value communication
- **Monitoring:** Track onboarding completion rate (>80% target)

---

### Business Risks

**Risk 1: Low monetization conversion**
- **Mitigation:** Test multiple pricing strategies, improve emotional attachment
- **Monitoring:** Paying user % (3%+ target)

**Risk 2: High CAC prevents profitable growth**
- **Mitigation:** Focus on organic/viral growth, optimize ASO
- **Monitoring:** LTV:CAC ratio (>3:1 target)

**Risk 3: App Store review rejection**
- **Mitigation:** Follow guidelines strictly, transparent permissions, no dark patterns
- **Contingency:** Legal review before submission

---

### Technical Risks

**Risk 1: CloudKit sync conflicts cause data loss**
- **Mitigation:** Robust conflict resolution, local-first architecture
- **Monitoring:** Sync failure rate (<5% target)

**Risk 2: SpriteKit performance issues on older devices**
- **Mitigation:** Test on iPhone XR (oldest supported), optimize sprite batching
- **Monitoring:** Crash rate, frame rate analytics

**Risk 3: iOS permission changes break features**
- **Mitigation:** Monitor iOS beta releases, have fallback manual logging
- **Contingency:** Pivot to purely manual tracking if needed

---

### Market Risks

**Risk 1: Competitor launches similar product**
- **Mitigation:** Speed to market (3-month MVP), pixel art differentiation
- **Monitoring:** App Store category rankings

**Risk 2: Gen Z adoption slower than expected**
- **Mitigation:** Influencer partnerships, TikTok marketing
- **Pivot:** Expand to Millennials (adjust messaging)

**Risk 3: "Friendship app" category doesn't resonate**
- **Mitigation:** Position as "cozy game" or "wellness tool" alternatively
- **Testing:** A/B test App Store category placement

---

## Conclusion & Next Steps

### PRD Summary

**Rooted** is a relationship wellness app that transforms friendship maintenance from an anxiety-inducing chore into a peaceful, rewarding practice. By representing each friend as a unique plant in a customizable isometric pixel art greenhouse, users gain emotional infrastructure for maintaining meaningful connections in the post-pandemic era.

**Key Differentiators:**
- Private, calm alternative to performative social media
- **Isometric pixel art aesthetic** creating depth and visual charm (Habbo Hotel/Stardew Valley style)
- **Collectible artifacts system** - earn butterflies, bees, and garden decorations for maintaining streaks
- **PixelLab AI-generated assets** enabling rapid iteration and seasonal content
- React Native cross-platform architecture with iOS-first launch
- Pixel art themed UI with retro fonts and button designs
- Ethical free-to-play model with no dark patterns

**Target:** Gen Z users (18-24) experiencing friendship maintenance guilt and social media fatigue.

**MVP Scope:** 6×6 customizable isometric greenhouse, 8 plant types with 3-stage evolution, hydration decay system, call/text auto-detection, push notifications, email/phone authentication, premium revives.

**Tech Stack:** React Native (Expo) + Supabase (PostgreSQL backend) + PixelLab AI (asset generation) + Phaser/react-native-svg (isometric rendering)

**Business Model:** Free-to-play with IAP (revives, decorations) + Garden Pass subscription ($4.99/month from Month 6). Exploring coin/gem economy for post-MVP.

**Success Metrics:** 100,000 weekly active friendships, 50,000 users, $50,000 Year 1 revenue.

---

### Immediate Next Steps

**Week 1-2: Environment Setup & Tooling**
1. Set up development environment:
   - Initialize React Native Expo project
   - Configure TypeScript
   - Set up Supabase project (database, auth, realtime)
   - Install PixelLab AI MCP for asset generation
2. Set up project infrastructure:
   - GitHub repository
   - Expo EAS Build configuration
   - TestFlight distribution setup

**Week 3-4: Kickoff & Initial Development**
3. Development kickoff (review PRD if working with team)
4. Begin PixelLab AI asset generation:
   - Define isometric style prompts
   - Generate initial plant sprites (8 types × 4 stages)
   - Generate greenhouse background layers
   - Generate UI elements (buttons, borders, icons)
5. Start core architecture:
   - Supabase database schema (Friend, Plant, Interaction tables)
   - React Context setup for global state
   - Phaser or react-native-svg integration for isometric rendering

**Month 1: Build Sprint**
7. Weekly standups to track progress
8. Bi-weekly PRD reviews (adjust scope if needed)
9. Asset delivery checkpoint (50% complete)

**Month 2-3: Feature Complete & Testing**
10. Internal alpha testing (Week 6)
11. TestFlight beta with 50 Gen Z users (Week 10)
12. App Store submission (Week 12)

**Post-Launch:**
13. Monitor metrics dashboard daily (first 2 weeks)
14. Weekly user feedback review
15. Monthly roadmap alignment meetings

---

### Open Questions for Stakeholder Review

1. **Budget approval:** Confirm $5K-$8K budget for MVP (significantly reduced due to:
   - Solo React Native development (no hiring iOS developer)
   - PixelLab AI asset generation ($0-500 vs $2-3K traditional pixel artist)
   - Supabase free tier for MVP (no backend infrastructure costs)
   - Main costs: Expo EAS Build ($99/month), Supabase Pro if needed ($25/month), Apple Developer ($99/year))
2. **Timeline flexibility:** Is 2-3 month MVP timeline acceptable (solo development), or adjust scope?
3. **Brand identity:** Need final logo (PixelLab AI can generate), app name trademark search
4. **Legal review:** Privacy policy, Terms of Service drafting (templates available for Supabase apps)
5. **App Store strategy:** Social Networking vs Lifestyle category preference?
6. **Coin/Gem economy:** Should we explore this for MVP, or stick with direct IAP for simplicity?

---

### Document Control

**Version History:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-04 | Product Team | Initial PRD created via BMad Method party-mode collaboration |
| 1.1 | 2025-12-04 | Rileydrake + Product Team | Major updates: React Native + Supabase stack, isometric pixel art, email/phone auth, collectible artifacts system, PixelLab AI integration, pixel fonts/UI, coin/gem economy exploration |

**Approval Signatures:**

- [ ] Product Manager (John): ________________
- [ ] Business Analyst (Mary): ________________
- [ ] UX Designer (Sally): ________________
- [ ] Architect (Winston): ________________
- [ ] Project Stakeholder (Rileydrake): ________________

---

**END OF PRODUCT REQUIREMENTS DOCUMENT**

---

*This PRD was created using the BMad Method with collaborative input from specialized agents. For questions or clarifications, contact the product team.*
