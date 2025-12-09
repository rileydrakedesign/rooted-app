# Garden UI & Navigation Analysis
**Rooted MVP - Core Garden Experience**

**Version:** 1.0
**Date:** December 6, 2025
**Author:** BMad Master + Rileydrake
**Status:** Design Specification

---

## Executive Summary

This document provides detailed specifications for the **Core Garden UI** - the primary screen where users spend 80%+ of their time in Rooted. Based on PRD requirements, this analysis breaks down:

1. **Garden Screen Components** - Every UI element needed for the main garden view
2. **Navigation Architecture** - How users move between app sections
3. **Supporting Pages** - All additional screens required for MVP
4. **Interaction Patterns** - How users engage with plants, furniture, and controls
5. **Visual Hierarchy** - Layout priorities for pixel art aesthetic

**Key Design Principles:**
- **Calm First:** No cluttered UI, minimal chrome, maximum garden visibility
- **Isometric View:** 2.5D perspective creates depth (Habbo Hotel/Stardew Valley style)
- **One-Tap Actions:** Core interactions (tap plant → info panel) are immediate
- **Pixel Art Consistency:** Every UI element matches retro aesthetic

---

## 1. Core Garden Screen Breakdown

### 1.1 Screen Layout Architecture

The Garden Screen is the **home base** - users return here after every action.

**Visual Hierarchy (Top to Bottom):**

```
┌─────────────────────────────────────┐
│  TOP BAR (Minimal)                  │  ← 60px height
├─────────────────────────────────────┤
│                                     │
│                                     │
│    ISOMETRIC GARDEN VIEWPORT        │  ← Main focus area
│      (6×6 Grid + Background)        │     (Fills remaining screen)
│                                     │
│                                     │
├─────────────────────────────────────┤
│  BOTTOM ACTION BAR (Optional)       │  ← 80px height (if needed)
└─────────────────────────────────────┘
```

**Design Rationale:**
- **Maximize garden visibility** (70%+ of screen real estate)
- **Minimize UI chrome** (top bar + bottom bar take <20% screen)
- **Immersive feel** - User feels like they're looking into a greenhouse

---

### 1.2 Top Bar Components

**Purpose:** Lightweight status + navigation without obstructing garden view

**Layout (Left to Right):**

```
┌──────────────────────────────────────────────────┐
│ [☰ Menu]    "My Garden"     [+] [⚙️]  [🔔 2]    │
└──────────────────────────────────────────────────┘
```

**Component Specifications:**

#### **1.2.1 Menu Button (☰) - Left**
- **Type:** Hamburger icon (pixel art, 24×24px)
- **Action:** Opens navigation drawer (see Section 3)
- **States:** Default, Pressed (2px shift down)
- **Haptic:** Light tap feedback

#### **1.2.2 Garden Title - Center**
- **Text:** "My Garden" or custom name (user editable)
- **Font:** Pixel font (Press Start 2P or Pixel Operator), 16pt
- **Color:** Forest green (#2D5016) or warm earth tone
- **Tap Action:** (Optional) Edit garden name inline

#### **1.2.3 Add Friend Button (+) - Right Side**
- **Type:** Pixel art button, 32×32px
- **Icon:** Plus sign in circle
- **Action:** Opens "Add New Friend" flow (see Section 4.2)
- **Visual:** Gentle pulse animation (breathing effect)
- **Tooltip:** "Add Friend" (on long-press)

#### **1.2.4 Settings Button (⚙️) - Right Side**
- **Type:** Gear icon, pixel art, 28×28px
- **Action:** Opens Settings screen (see Section 4.5)
- **Visual:** Static (no animation to reduce clutter)

#### **1.2.5 Notification Badge (🔔) - Far Right**
- **Type:** Bell icon with number badge overlay
- **Badge Count:** Number of pending actions (e.g., "2 plants need water")
- **Color:** Badge background is soft orange (#FF9F66) when >0
- **Action:** Taps opens notification panel (see Section 1.6)
- **Animation:** Gentle shake when new notification arrives

**Top Bar Styling:**
- **Background:** Semi-transparent overlay (20% white) OR solid warm beige (#F4EDD3)
- **Border:** 2px pixel art border (bottom only, subtle depth separator)
- **Height:** 60px total (including border)

---

### 1.3 Isometric Garden Viewport (Main Canvas)

**Purpose:** The core interactive area - where all plants, furniture, and garden elements live.

#### **1.3.1 Background Layers (Parallax Depth)**

**Layer 1: Far Background (Static)**
- **Content:** Blurred greenery outside greenhouse (trees, bushes)
- **Visual Style:** Soft focus, pastel greens and browns
- **Purpose:** Establishes "inside looking out" feeling

**Layer 2: Greenhouse Structure**
- **Content:** Wooden frame, glass walls with reflections
- **Visual Style:** Warm wood (#8B5A3C), subtle glass shine effects
- **Details:**
  - Window panes (4-pane grid visible on sides)
  - Sunlight streaming through glass (animated rays, gentle)
  - Occasional bird shadow passing outside
- **Purpose:** Creates enclosure, reinforces greenhouse theme

**Layer 3: Floor Grid (Interactive)**
- **Content:** 6×6 isometric tile grid
- **Tile Design:**
  - Beige/cream tiles with subtle texture
  - Isometric diamond shape (2:1 ratio)
  - Each tile: ~64×32px rendered size (adjusts for screen size)
  - Grid lines: Subtle 1px darker shade for tile separation
- **States:**
  - **Default:** Neutral beige
  - **Hover/Drag-Over:** Tile highlights with green glow (valid placement)
  - **Invalid Placement:** Tile highlights with red glow (collision detected)
  - **Edit Mode:** All tiles show faint border glow
- **Purpose:** The placeable surface for plants and furniture

**Layer 4: Garden Objects (Sortable)**
- **Content:** Plants, furniture, decorative items
- **Rendering:**
  - **Z-index sorting:** Objects rendered back-to-front based on grid Y position
  - **Depth shadows:** Each object casts subtle shadow on floor (adds realism)
  - **Animations:**
    - Plants: Gentle sway (2-4 frame loop, 2 seconds per cycle)
    - Artifacts (butterflies, bees): Hovering/flying animations
    - Furniture: Static (no animation, reduces visual noise)
- **Interaction:**
  - **Tap:** Opens Plant Info Panel (if plant) or Item Options (if furniture)
  - **Long-Press:** Enters Edit Mode (drag to rearrange)
- **Purpose:** The actual garden content users care about

**Layer 5: Ambient Effects (Overlay)**
- **Content:** Particles, lighting effects, weather (optional)
- **Effects:**
  - **Dust motes:** Floating in sunbeams (5-10 particles, slow drift)
  - **Sparkles:** Appear when plant is healthy (subtle, 2-3 around plant)
  - **Wilting indicator:** Dry/cracked ground texture under thirsty plants
- **Performance:** Low-impact, simple particle system (60fps target)
- **Purpose:** Adds life and visual feedback without clutter

#### **1.3.2 Grid Coordinate System**

**Isometric Grid Mapping:**

```
     (0,0)   (1,0)   (2,0)   (3,0)   (4,0)   (5,0)
       ◇───────◇───────◇───────◇───────◇───────◇
      / \     / \     / \     / \     / \     / \
(0,1)◇───◇───◇───◇───◇───◇───◇───◇───◇───◇───◇ (5,1)
    / \ / \ / \ / \ / \ / \ / \ / \ / \ / \ / \
   ◇───◇───◇───◇───◇───◇───◇───◇───◇───◇───◇───◇
  (0,2)                                         (5,2)
   ...                                           ...
   ◇───◇───◇───◇───◇───◇───◇───◇───◇───◇───◇───◇
  (0,5)                                         (5,5)
```

**Coordinate System:**
- **Grid Position:** Each plant/item stored as `(x, y)` coordinates (0-5 range)
- **Screen Position Calculation:**
  ```
  screenX = (gridX - gridY) × tileWidth / 2
  screenY = (gridX + gridY) × tileHeight / 2
  ```
- **Collision Detection:** Simple array check - one object per (x,y) coordinate
- **Furniture:** Large items (e.g., table) occupy 1 coordinate but visually span 2 tiles

#### **1.3.3 Camera & Zoom**

**MVP Camera:**
- **Fixed isometric camera** (no rotation, no tilt)
- **Fixed zoom level** (entire 6×6 grid fits on screen)
- **Centered garden** (equal margins on all sides)

**Post-MVP Enhancements (Optional):**
- **Pinch to zoom:** 0.8x to 1.5x zoom range
- **Pan on larger grids:** When garden rooms expand beyond 6×6
- **Auto-focus:** Double-tap plant zooms to center it

---

### 1.4 Bottom Action Bar (Contextual)

**Purpose:** Houses mode-specific controls (Edit Mode, Add Friend, etc.)

**Default State (Viewing Mode):**
- **Hidden** or **Minimized to single button:**
  - **[✏️ Edit Garden]** button centered (80×40px pixel art button)
  - Tap to enter Edit Mode

**Edit Mode State:**

```
┌──────────────────────────────────────────────────┐
│   [✓ Done]     [🗑️ Remove]   [🎨 Decor]   [↩️ Undo]   │
└──────────────────────────────────────────────────┘
```

**Buttons:**

#### **1.4.1 Done Button (✓)**
- **Action:** Exit Edit Mode, save layout changes
- **Visual:** Green checkmark icon, pixel art
- **Position:** Left side

#### **1.4.2 Remove Button (🗑️)**
- **Action:** Tap to enter "removal mode" → tap object to delete
- **Visual:** Trash can icon, red tint when active
- **Confirmation:** "Remove [Item Name]? This cannot be undone."

#### **1.4.3 Decor Button (🎨)**
- **Action:** Opens decorative item picker (furniture, artifacts)
- **Visual:** Paint palette icon
- **Functionality:** Shows grid of available decorations → tap to place

#### **1.4.4 Undo Button (↩️)**
- **Action:** Undo last placement/move (single-level undo)
- **Visual:** Curved arrow icon
- **Disabled State:** Grayed out when no actions to undo

**Styling:**
- **Background:** Solid dark wood texture (#3E2723) for contrast
- **Height:** 80px
- **Button Size:** 64×64px each (large tap targets)
- **Spacing:** 12px between buttons

---

### 1.5 Plant Info Panel (Modal)

**Trigger:** Tap any plant in the garden

**Presentation:**
- **Slide-up modal** from bottom (iOS native feel)
- **Backdrop blur:** Darkens garden view (60% opacity black overlay)
- **Dismissal:** Swipe down OR tap outside panel

**Panel Layout:**

```
┌───────────────────────────────────────────────┐
│              [Swipe Handle Bar]                │
│                                                │
│   ┌─────────────┐                              │
│   │   Plant     │   FRIEND NAME                │
│   │   Sprite    │   "Cactus • Stage 2"         │
│   │  (Large)    │                              │
│   └─────────────┘   ⚡ 7-day streak!            │
│                                                │
│   ╔══════════════════════════════════╗         │
│   ║ Hydration: ▓▓▓▓▓▓▓▓▓░░░░ 75%     ║         │
│   ╚══════════════════════════════════╝         │
│                                                │
│   📅 Last Contact: 2 days ago                  │
│   🌱 Needs Water In: 5 days                    │
│   📞 Contact Frequency: Weekly                 │
│                                                │
│   ┌──────────────────────────────────────────┐ │
│   │  📞 CALL [NAME]          📱 TEXT [NAME] │ │
│   └──────────────────────────────────────────┘ │
│   ┌──────────────────────────────────────────┐ │
│   │  ✍️ LOG INTERACTION                      │ │
│   └──────────────────────────────────────────┘ │
│   ┌──────────────────────────────────────────┐ │
│   │  ⚙️ EDIT FRIEND                          │ │
│   └──────────────────────────────────────────┘ │
│                                                │
│               [🗑️ Remove Friend]               │
└───────────────────────────────────────────────┘
```

**Component Specifications:**

#### **1.5.1 Header Section**
- **Plant Sprite:** Large centered sprite (128×128px) showing current evolution stage
- **Friend Name:** Bold pixel font, 20pt, editable (tap to edit inline)
- **Plant Type & Stage:** Subtext, 12pt, gray (#757575)
- **Streak Badge:** If active, shows flame icon + "7-day streak!" in warm orange

#### **1.5.2 Hydration Bar**
- **Visual:** Chunky pixel art bar, segmented into 10 blocks
- **Colors:**
  - **High (60-100%):** Vibrant green (#4CAF50)
  - **Medium (20-59%):** Yellow (#FFC107)
  - **Low (0-19%):** Red (#F44336)
- **Percentage Text:** Displayed next to bar (e.g., "75%")
- **Animation:** Fills/drains with smooth 0.3s transition on update

#### **1.5.3 Info Stats**
- **Last Contact:** Relative timestamp ("2 days ago", "1 week ago")
- **Needs Water In:** Calculated countdown (based on decay rate)
- **Contact Frequency:** Shows set frequency ("Weekly", "Bi-weekly", "Monthly")
- **Icons:** Small pixel art icons (16×16px) prefix each stat

#### **1.5.4 Action Buttons**

**Primary Actions (Large, 50% width each):**
- **Call Button:**
  - Opens iOS native dialer with phone number pre-filled
  - Icon: Phone handset pixel art
  - Auto-logs interaction if call completed (CXCallObserver)

- **Text Button:**
  - Opens in-app MessageUI composer
  - Icon: Speech bubble pixel art
  - Auto-logs interaction if message sent

**Secondary Actions (Full width):**
- **Log Interaction Button:**
  - Opens manual log entry screen (see Section 4.3)
  - For external interactions (calls/texts outside app)

- **Edit Friend Button:**
  - Opens edit screen (change name, frequency, plant type)
  - Icon: Pencil pixel art

**Destructive Action (Bottom, Small):**
- **Remove Friend Link:**
  - Text-only link, red color (#D32F2F)
  - Confirmation dialog: "Remove [Name]'s plant? This cannot be undone."
  - Deletes friend and plant permanently

**Button Styling:**
- **Pixel art rectangular buttons** (3px border, slight shadow)
- **Pressed state:** 2px shift down effect
- **Haptic feedback:** Medium impact on tap
- **Spacing:** 12px vertical gap between buttons

---

### 1.6 Notification Panel (Pull-Down)

**Trigger:** Tap bell icon (🔔) in top bar

**Presentation:**
- **Slide down from top bar** (like iOS Notification Center)
- **Height:** 30% of screen OR dynamic based on notification count
- **Dismissal:** Tap "X" button or swipe up

**Layout:**

```
┌───────────────────────────────────────────────┐
│  Notifications                          [X]    │
├───────────────────────────────────────────────┤
│  🌵 Cactus (Sarah) is thirsty!                │
│     Hydration: 45% • Water within 2 days      │
│     [VIEW] [CALL NOW]                          │
├───────────────────────────────────────────────┤
│  🌻 Sunflower (Jake) is wilting!              │
│     Hydration: 15% • URGENT                    │
│     [VIEW] [TEXT NOW]                          │
├───────────────────────────────────────────────┤
│  🎉 7-day streak with Fern (Alex)!            │
│     [VIEW]                                     │
└───────────────────────────────────────────────┘
```

**Notification Card Format:**
- **Icon:** Plant emoji or small sprite (32×32px)
- **Title:** Friend name + status
- **Details:** Hydration level, urgency indicator
- **Actions:** Quick action buttons (VIEW opens plant panel, CALL/TEXT shortcuts)
- **Styling:** Pixel art bordered cards, warm background colors
- **Priority:** Critical alerts (wilting) at top, celebrations at bottom

---

### 1.7 Edit Mode Interaction Details

**Entering Edit Mode:**
1. **Trigger:** Long-press any plant/object OR tap "Edit Garden" button
2. **Visual Feedback:**
   - All objects gain subtle glow outline
   - Grid lines become more visible (bright highlight)
   - Bottom action bar slides up with Edit Mode controls

**Dragging Objects:**
1. **User long-presses object** → Object lifts slightly (scale: 1.1x, shadow darkens)
2. **User drags finger** → Object follows touch position
3. **Valid placement tile highlights green** → Object snaps to that grid position
4. **Invalid placement (collision) highlights red** → Object cannot be placed
5. **Release drag:**
   - If valid: Object snaps to new grid position (with bounce animation)
   - If invalid: Object springs back to original position (elastic animation)

**Visual Feedback:**
- **Object being dragged:** 1.1x scale, 50% opacity, subtle rotation wobble
- **Target tile:** Pulsing green/red glow
- **Snap animation:** 0.2s ease-out spring effect
- **Haptic feedback:** Light tap on snap, error buzz on invalid placement

**Collision Rules:**
- **One plant per tile** (strict)
- **Furniture exceptions:** Some furniture (e.g., wall shelf) doesn't occupy grid space (background layer)
- **Visual indicator:** Red X icon appears above tile if collision detected

---

### 1.8 Empty Garden State

**Scenario:** New user, no plants added yet

**Visual:**

```
┌───────────────────────────────────────────────┐
│                                                │
│              [Empty Greenhouse]                │
│                                                │
│          🪴 Your garden is empty!              │
│                                                │
│     "Add your first friend to start growing"   │
│                                                │
│         ┌───────────────────────────┐          │
│         │   ➕ ADD YOUR FIRST FRIEND │          │
│         └───────────────────────────┘          │
│                                                │
└───────────────────────────────────────────────┘
```

**Components:**
- **Empty greenhouse background** (visible grid, no objects)
- **Centered message:** Friendly, encouraging pixel art text
- **Large CTA button:** "Add Your First Friend" (prominent, pulsing)
- **Optional:** Small tutorial hint ("Tap + button to add friends")

**Purpose:**
- **Reduces anxiety** (clear next step)
- **Immediate action** (one button, no confusion)
- **Welcoming tone** (aligned with calm aesthetic)

---

## 2. Navigation Architecture

### 2.1 Navigation Pattern: Drawer + Bottom Tabs Hybrid

**Primary Navigation:** Hamburger Menu (☰) opens left-side drawer

**Why Drawer vs Bottom Tabs:**
- **Maximizes garden visibility** (no persistent bottom tab bar)
- **Cleaner aesthetic** (pixel art benefits from minimal chrome)
- **Fewer core sections** (3-4 main areas don't require tabs)

**Navigation Drawer Layout:**

```
┌──────────────────────────┐
│  MY GARDEN 🌿            │  ← Header (user's garden name)
├──────────────────────────┤
│  🏡 Garden View          │  ← Active state (highlighted)
│  👥 Friends List         │
│  📊 Stats & Insights     │  (Post-MVP)
│  ⚙️ Settings             │
│  ❓ Help & Feedback      │
├──────────────────────────┤
│  👤 [User Profile]       │  ← Footer (account info)
│     rileydrake           │
│     📧 Logout            │
└──────────────────────────┘
```

**Drawer Specs:**
- **Width:** 70% of screen width (280-320px on iPhone)
- **Background:** Warm wood texture (#8B5A3C) OR soft beige (#F4EDD3)
- **Active State:** Selected item has green highlight bar (left border, 4px thick)
- **Icons:** 32×32px pixel art icons for each menu item
- **Typography:** Pixel font, 16pt for items, 18pt bold for header
- **Animation:** Slide-in from left (0.3s ease-out)

**Menu Items:**

#### **2.1.1 Garden View (Home)**
- **Icon:** House/greenhouse pixel art
- **Action:** Navigate to main garden screen (default view)
- **Badge:** None

#### **2.1.2 Friends List**
- **Icon:** Two person silhouettes pixel art
- **Action:** Opens Friends List screen (see Section 4.4)
- **Badge:** Number of thirsty plants (e.g., "3" in orange badge)

#### **2.1.3 Stats & Insights (Post-MVP)**
- **Icon:** Bar chart pixel art
- **Action:** Opens analytics screen (total interactions, streak records, etc.)
- **Badge:** None

#### **2.1.4 Settings**
- **Icon:** Gear pixel art
- **Action:** Opens Settings screen (see Section 4.5)
- **Badge:** Red dot if action needed (e.g., permissions not granted)

#### **2.1.5 Help & Feedback**
- **Icon:** Question mark in circle
- **Action:** Opens help documentation + feedback form
- **Badge:** None

**Footer Section:**
- **User Profile Card:**
  - Avatar: Small pixel art character (48×48px) OR initials circle
  - Username: Displayed below avatar
  - Logout link: Small text link, red color

---

### 2.2 Navigation Flow Diagram

```
     ┌─────────────────┐
     │  ONBOARDING     │ (One-time only)
     │  (10 screens)   │
     └────────┬────────┘
              ↓
     ┌─────────────────┐
     │  GARDEN VIEW    │ ← HOME BASE (80% of time spent here)
     │  (Main Screen)  │
     └────┬───┬───┬────┘
          │   │   │
    ┌─────┘   │   └─────┐
    ↓         ↓         ↓
┌───────┐ ┌────────┐ ┌──────────┐
│Friends│ │Settings│ │ Add      │
│ List  │ │        │ │ Friend   │
└───┬───┘ └────────┘ └────┬─────┘
    │                      │
    ↓                      ↓
┌────────────┐      ┌──────────────┐
│Plant Info  │      │Select Plant  │
│Panel       │      │Type + Place  │
└────────────┘      └──────────────┘
```

**Key Principles:**
- **Garden View is always accessible** (tap back/home returns here)
- **All flows return to Garden View** (modal actions dismiss back to garden)
- **No dead ends** (every screen has clear exit path)

---

## 3. Supporting Pages & Screens

### 3.1 Screen Inventory for MVP

| Screen Name | Priority | Complexity | Purpose |
|-------------|----------|------------|---------|
| Garden View | P0 | High | Main interaction screen |
| Plant Info Panel | P0 | Medium | View/interact with individual plant |
| Add Friend Flow | P0 | Medium | Add new friend to garden |
| Edit Friend Screen | P0 | Low | Modify friend details |
| Manual Log Interaction | P0 | Low | Log external calls/texts |
| Friends List | P0 | Low | View all friends at once |
| Settings Screen | P0 | Low | App configuration |
| Navigation Drawer | P0 | Low | Main navigation menu |
| Empty State | P0 | Low | First-time user guidance |
| Plant Death Screen | P0 | Medium | Revive or remove dead plant |
| Notification Panel | P1 | Low | Centralized notifications |
| Help & Feedback | P1 | Low | Support resources |

---

### 3.2 Add Friend Flow (Multi-Step)

**Entry Points:**
- Tap "+" button in top bar
- Tap "Add Your First Friend" in empty state
- From Friends List screen

**Step 1: Contact Selection**

```
┌───────────────────────────────────────────────┐
│  ← Back           Add Friend                   │
├───────────────────────────────────────────────┤
│                                                │
│   [Search Contacts...]                         │
│                                                │
│   📱 From Contacts                             │
│   ┌──────────────────────────────────────────┐│
│   │  Sarah Johnson                       [+] ││
│   │  sarah@email.com                         ││
│   ├──────────────────────────────────────────┤│
│   │  Jake Williams                       [+] ││
│   │  (555) 123-4567                          ││
│   └──────────────────────────────────────────┘│
│                                                │
│   ✍️ Or Enter Manually                         │
│   ┌──────────────────────────────────────────┐│
│   │  Name:  [____________]                   ││
│   │  Phone: [____________]                   ││
│   │  Email: [____________] (optional)        ││
│   │         [CONTINUE →]                     ││
│   └──────────────────────────────────────────┘│
└───────────────────────────────────────────────┘
```

**Features:**
- **Search bar:** Live filter as user types
- **Contact list:** Shows iOS contacts (permission required)
- **Manual entry:** Fallback if contacts permission denied
- **Validation:** Name required, phone OR email required

**Step 2: Set Contact Frequency**

```
┌───────────────────────────────────────────────┐
│  ← Back       How often do you talk?           │
├───────────────────────────────────────────────┤
│                                                │
│   Friend: Sarah Johnson                        │
│                                                │
│   Choose contact frequency:                    │
│                                                │
│   ┌──────────────────────────────────────────┐│
│   │         📅 WEEKLY (7 days)           │  ← Selected (green)│
│   └──────────────────────────────────────────┘│
│   ┌──────────────────────────────────────────┐│
│   │      📅 BI-WEEKLY (14 days)              ││
│   └──────────────────────────────────────────┘│
│   ┌──────────────────────────────────────────┐│
│   │        📅 MONTHLY (30 days)              ││
│   └──────────────────────────────────────────┘│
│                                                │
│            [CONTINUE →]                        │
└───────────────────────────────────────────────┘
```

**Features:**
- **Large tap targets:** Full-width buttons (easy selection)
- **Visual feedback:** Selected option has green border + checkmark
- **Explanation:** Each option shows exact day count
- **Default:** Weekly pre-selected

**Step 3: Choose Plant Type**

```
┌───────────────────────────────────────────────┐
│  ← Back       Choose their plant!              │
├───────────────────────────────────────────────┤
│                                                │
│              ┌──────────────┐                  │
│              │   [Plant     │                  │
│      [◀]    │   Sprite]    │    [▶]           │
│              │   Animated   │                  │
│              └──────────────┘                  │
│                                                │
│              🌵 CACTUS                         │
│         "Desert • Low Maintenance"             │
│                                                │
│   ─────────────────────────────────────────   │
│      ●  ○  ○  ○  ○  ○  ○  ○                   │  ← Carousel dots (8 plants)
│                                                │
│              [SELECT PLANT]                    │
└───────────────────────────────────────────────┘
```

**Features:**
- **Carousel navigation:** Swipe or tap arrows to browse 8 plant types
- **Large centered sprite:** Shows Stage 1 (Sprout) with idle animation
- **Plant name + description:** Short personality descriptor
- **Dot pagination:** Shows position in 8-plant list
- **Preview:** User sees exactly what they're getting

**Step 4: Place in Garden**

```
┌───────────────────────────────────────────────┐
│  ← Back       Place in your garden             │
├───────────────────────────────────────────────┤
│                                                │
│       [Isometric Garden Grid View]             │
│                                                │
│   🌵 (Draggable plant sprite follows touch)    │
│                                                │
│   Grid tiles highlight green when valid        │
│                                                │
│                                                │
│   Tap any open tile to place →                │
│                                                │
└───────────────────────────────────────────────┘
```

**Features:**
- **Interactive placement:** User drags plant OR taps tile
- **Visual feedback:** Green = valid, Red = occupied
- **Confirmation:** On placement, plant snaps with bounce animation
- **Auto-advance:** After placement, returns to Garden View (plant appears!)

**Flow Completion:**
- **Success state:** Plant appears in garden, gentle sparkle animation
- **Toast notification:** "Sarah's Cactus added! 🌵"
- **Auto-opens Plant Info Panel** (optional) for immediate interaction

---

### 3.3 Manual Log Interaction Screen

**Entry Point:** Tap "Log Interaction" in Plant Info Panel

**Layout:**

```
┌───────────────────────────────────────────────┐
│  ← Cancel       Log Interaction      [✓ Save] │
├───────────────────────────────────────────────┤
│                                                │
│   Friend: Sarah Johnson                        │
│   Plant: 🌵 Cactus                             │
│                                                │
│   Interaction Type:                            │
│   ┌──────────────────────────────────────────┐│
│   │      📞 CALL                         ✓   ││
│   └──────────────────────────────────────────┘│
│   ┌──────────────────────────────────────────┐│
│   │      💬 TEXT                             ││
│   └──────────────────────────────────────────┘│
│   ┌──────────────────────────────────────────┐│
│   │      ☕ IN-PERSON                         ││
│   └──────────────────────────────────────────┘│
│                                                │
│   Optional Note:                               │
│   ┌──────────────────────────────────────────┐│
│   │  [Talked about their new job...]         ││
│   └──────────────────────────────────────────┘│
│                                                │
│   Hydration will restore: +40 💧               │
└───────────────────────────────────────────────┘
```

**Features:**
- **Interaction type selector:** Call (+40), Text (+20), In-Person (+30)
- **Optional note field:** Private text area (200 char limit)
- **Preview:** Shows hydration restoration amount before saving
- **Timestamp:** Auto-logged as current date/time (user can edit if needed)
- **Validation:** At least one interaction type must be selected

**On Save:**
- **Updates plant hydration** immediately
- **Logs interaction** in history
- **Dismisses to Plant Info Panel** (updated hydration bar visible)
- **Toast:** "Interaction logged! 🌵 +40 hydration"

---

### 3.4 Friends List Screen

**Entry Point:** Navigation drawer → Friends List

**Purpose:** See all friends at once, sorted by status

**Layout:**

```
┌───────────────────────────────────────────────┐
│  ☰ Menu      Friends (12/20)            [+]   │
├───────────────────────────────────────────────┤
│                                                │
│  ⚠️ NEEDS ATTENTION (2)                        │
│  ┌────────────────────────────────────────────┤
│  │ 🌵 Sarah Johnson              📞 💬       ││
│  │    Hydration: ▓▓▓░░░ 45%  • 2 days ago    ││
│  ├────────────────────────────────────────────┤
│  │ 🌻 Jake Williams               📞 💬       ││
│  │    Hydration: ▓░░░░░ 15%  • 5 days ago    ││
│  └────────────────────────────────────────────┘
│                                                │
│  ✅ HEALTHY (10)                               │
│  ┌────────────────────────────────────────────┤
│  │ 🌿 Alex Chen                  📞 💬       ││
│  │    Hydration: ▓▓▓▓▓▓▓▓▓▓ 95%  • Yesterday  ││
│  ├────────────────────────────────────────────┤
│  │ 🌹 Morgan Lee                 📞 💬       ││
│  │    Hydration: ▓▓▓▓▓▓▓▓░░ 85%  • 1 day ago  ││
│  └────────────────────────────────────────────┘
│                                                │
└───────────────────────────────────────────────┘
```

**Features:**

#### **3.4.1 List Sections**
- **Needs Attention:** Plants with hydration <60% (sorted worst first)
- **Healthy:** Plants with hydration ≥60% (sorted by last contact)
- **Dead:** (If any) Separate section for revival/removal

#### **3.4.2 Friend Card Components**
- **Plant emoji + Name:** Large, bold
- **Hydration bar:** Miniature version (10-segment)
- **Last contact:** Relative timestamp
- **Quick actions:** Tap phone icon = call, tap text icon = text
- **Tap card:** Opens Plant Info Panel (same as tapping in garden)

#### **3.4.3 Header Actions**
- **Friend count:** Shows "12/20" (current/max limit)
- **Add button:** Quick access to Add Friend flow
- **Sort options:** (Optional) Dropdown to sort by name, status, last contact

#### **3.4.4 Empty State**
- If no friends added:
  ```
  🪴 No friends added yet
  "Tap + to add your first friend!"
  ```

---

### 3.5 Settings Screen

**Entry Point:** Navigation drawer → Settings OR top bar gear icon

**Layout:**

```
┌───────────────────────────────────────────────┐
│  ← Back             Settings                   │
├───────────────────────────────────────────────┤
│                                                │
│  ACCOUNT                                       │
│  ┌────────────────────────────────────────────┤
│  │  👤 Profile                            →   ││
│  │  📧 rileydrake@email.com                   ││
│  ├────────────────────────────────────────────┤
│  │  🔒 Change Password                    →   ││
│  └────────────────────────────────────────────┘
│                                                │
│  NOTIFICATIONS                                 │
│  ┌────────────────────────────────────────────┤
│  │  🔔 Push Notifications         [Toggle ON] ││
│  ├────────────────────────────────────────────┤
│  │  ⏰ Daily Reminder Time        8:00 AM  →  ││
│  ├────────────────────────────────────────────┤
│  │  🎉 Streak Celebrations        [Toggle ON] ││
│  └────────────────────────────────────────────┘
│                                                │
│  GARDEN                                        │
│  ┌────────────────────────────────────────────┤
│  │  🎨 Garden Theme          Cozy Greenhouse → ││
│  ├────────────────────────────────────────────┤
│  │  📏 Friend Limit               12/20       ││
│  └────────────────────────────────────────────┘
│                                                │
│  PRIVACY & DATA                                │
│  ┌────────────────────────────────────────────┤
│  │  📞 Auto-Detect Calls/Texts    [Toggle ON] ││
│  ├────────────────────────────────────────────┤
│  │  📱 Contact Permissions              →     ││
│  ├────────────────────────────────────────────┤
│  │  ☁️ Cloud Backup                [Toggle ON]││
│  └────────────────────────────────────────────┘
│                                                │
│  ABOUT                                         │
│  ┌────────────────────────────────────────────┤
│  │  ℹ️ App Version                    v1.0.0   ││
│  ├────────────────────────────────────────────┤
│  │  ❓ Help & Support                     →   ││
│  ├────────────────────────────────────────────┤
│  │  💬 Send Feedback                      →   ││
│  └────────────────────────────────────────────┘
│                                                │
│  ┌────────────────────────────────────────────┐
│  │         🚪 LOGOUT                          │
│  └────────────────────────────────────────────┘
└───────────────────────────────────────────────┘
```

**Section Breakdown:**

#### **3.5.1 Account**
- **Profile:** Edit name, email, phone
- **Change Password:** Standard password reset flow
- **Delete Account:** (Bottom of this section, destructive action)

#### **3.5.2 Notifications**
- **Push Notifications Toggle:** Master on/off
- **Daily Reminder Time:** Time picker (default: 8:00 AM)
- **Streak Celebrations:** Toggle milestone notifications

#### **3.5.3 Garden**
- **Garden Theme:** Select from unlocked themes (MVP: only 1 available)
- **Friend Limit:** Shows current count, upgrade link if maxed

#### **3.5.4 Privacy & Data**
- **Auto-Detect:** Toggle call/text tracking
- **Contact Permissions:** Link to iOS Settings if needed
- **Cloud Backup:** Toggle Supabase sync

#### **3.5.5 About**
- **Version:** Display current version
- **Help:** Opens documentation
- **Feedback:** Opens feedback form (email or in-app)

**Styling:**
- **Grouped list style:** iOS Settings-inspired (pixel art themed)
- **Toggle switches:** Pixel art styled (chunky on/off switch)
- **Chevrons (→):** Indicate sub-screens
- **Destructive actions:** Red text (Logout, Delete Account)

---

### 3.6 Plant Death & Revival Screen

**Trigger:** When plant hydration = 0% for >24 hours

**Presentation:** Full-screen modal (blocks access to garden until resolved)

**Layout:**

```
┌───────────────────────────────────────────────┐
│                                                │
│              ☠️                                 │
│                                                │
│         Oh no! A plant has wilted.             │
│                                                │
│   ┌─────────────┐                              │
│   │   Dead      │   Sarah Johnson's Cactus     │
│   │   Sprite    │   💀 Wilted after 12 days    │
│   │  (Wilted)   │                              │
│   └─────────────┘                              │
│                                                │
│   "Remember to reach out to keep your          │
│    friendships thriving!"                      │
│                                                │
│   ┌──────────────────────────────────────────┐│
│   │  ♻️ FREE REVIVE (1/week available)        ││
│   │     Restarts plant at Stage 1             ││
│   │     Clears streak                         ││
│   │     [USE FREE REVIVE]                     ││
│   └──────────────────────────────────────────┘│
│                                                │
│   ┌──────────────────────────────────────────┐│
│   │  ✨ PREMIUM REVIVE ($0.99)                ││
│   │     Restores previous stage + streak      ││
│   │     [BUY PREMIUM REVIVE]                  ││
│   └──────────────────────────────────────────┘│
│                                                │
│         [🗑️ Remove Plant]                      │
│                                                │
└───────────────────────────────────────────────┘
```

**Features:**

#### **3.6.1 Free Revive**
- **Availability:** 1 per week (resets Monday 00:00)
- **Effect:** Plant returns to Stage 1 (Sprout), hydration = 100%, streak = 0
- **Confirmation:** "Are you sure? This will reset Sarah's plant to Stage 1."
- **If unavailable:** Button grayed out, shows "Next free revive: 3 days"

#### **3.6.2 Premium Revive**
- **Cost:** $0.99 (consumable IAP)
- **Effect:** Restores plant to previous stage, hydration = 100%, streak maintained
- **Purchase flow:** StoreKit 2 → Confirmation → Instant restoration
- **Success toast:** "✨ Sarah's Cactus revived at Stage 2!"

#### **3.6.3 Remove Plant**
- **Action:** Permanently deletes plant + friend
- **Confirmation:** "Remove Sarah Johnson's plant? This cannot be undone."
- **Effect:** Frees grid space, friend deleted from database

**Emotional Design:**
- **Tone:** Gentle, non-judgmental (no guilt trip)
- **Messaging:** Encouraging ("You can bring it back!")
- **Visual:** Wilted sprite (not grotesque, just sad)
- **No pressure:** Removal is always an option

---

## 4. Interaction Patterns & Gestures

### 4.1 Core Gestures

| Gesture | Context | Action |
|---------|---------|--------|
| **Tap** | Plant in garden | Opens Plant Info Panel |
| **Tap** | Empty tile (Edit Mode) | Places selected object |
| **Long-Press** | Any object | Enters Edit Mode (if not already in) + starts drag |
| **Drag** | Object in Edit Mode | Moves object to new grid position |
| **Swipe Down** | Plant Info Panel | Dismisses panel |
| **Swipe Left** | Navigation Drawer open | Closes drawer |
| **Pinch** | (Post-MVP) Garden View | Zoom in/out |
| **Double-Tap** | (Post-MVP) Plant | Quick zoom/focus |

### 4.2 Tap Targets & Accessibility

**Minimum Sizes:**
- **Buttons:** 44×44pt (iOS minimum)
- **Grid tiles:** ~60×30pt (isometric diamond)
- **Plants:** Sprite size + 20pt padding for tap area

**Visual Feedback:**
- **Highlight state:** All tappable objects have subtle glow on touch-down
- **Disabled state:** 50% opacity + no interaction
- **Loading state:** Spinner overlay (pixel art spinner)

**VoiceOver Support:**
- **All interactive elements:** Labeled with descriptive text
- **Plant sprites:** "Sarah Johnson's Cactus, 75% hydration, healthy"
- **Grid tiles:** "Empty tile, row 3, column 2"
- **Buttons:** Clear action labels ("Call Sarah Johnson")

---

## 5. Visual Design Specifications

### 5.1 Color Palette (MVP Theme: Cozy Greenhouse)

**Primary Colors:**
```
Forest Green (Primary):    #2D5016  (headers, accents)
Sage Green (Secondary):    #8BA888  (healthy plants, UI highlights)
Warm Beige (Background):   #F4EDD3  (floor tiles, panel backgrounds)
Warm Wood (Accents):       #8B5A3C  (greenhouse frame, furniture)
Terracotta (Contrast):     #C74E3A  (call-to-action buttons, urgency)
```

**Status Colors:**
```
Hydration High (Green):    #4CAF50
Hydration Medium (Yellow): #FFC107
Hydration Low (Red):       #F44336
Streak Gold (Celebration): #FFD700
```

**UI Grays:**
```
Text Primary (Dark):       #212121
Text Secondary (Gray):     #757575
Border/Divider (Light):    #E0E0E0
```

### 5.2 Typography System

**Font Stack:**
- **Primary:** "Press Start 2P" (Google Fonts, web-safe pixel font)
- **Fallback:** "Courier New" (monospace, system font)

**Type Scales:**
```
H1 (Screen Titles):        20pt, Bold, #2D5016
H2 (Section Headers):      16pt, Bold, #2D5016
Body (Descriptions):       14pt, Regular, #212121
Caption (Small Text):      12pt, Regular, #757575
Button Text:               14pt, Bold, #FFFFFF (on colored background)
```

**Line Heights:**
- **Headers:** 1.2x
- **Body:** 1.5x
- **Buttons:** 1.0x (tight)

### 5.3 Spacing System (8pt Grid)

**Padding/Margin:**
```
Tiny:    4pt   (icon padding)
Small:   8pt   (tight spacing)
Medium:  16pt  (default spacing)
Large:   24pt  (section separation)
XLarge:  32pt  (screen margins)
```

**Component Sizing:**
```
Button Height (Small):     40pt
Button Height (Large):     56pt
Input Field Height:        48pt
Top Bar Height:            60pt
Bottom Bar Height:         80pt
```

### 5.4 Animation Timing

**Durations:**
```
Micro (Tap feedback):      0.1s
Fast (Panel open/close):   0.3s
Medium (Drag & drop):      0.4s
Slow (Plant evolution):    0.8s
```

**Easing:**
```
UI Interactions:           ease-out
Drag & Drop:               spring (bounce)
Notifications:             ease-in-out
Plant Sway:                linear (loop)
```

---

## 6. Performance Considerations

### 6.1 Rendering Optimization

**Isometric Rendering:**
- **Engine:** Phaser (WebGL accelerated) OR react-native-svg (lighter but less performant)
- **Sprite Batching:** Group plants by layer (background → middle → foreground)
- **Culling:** Only render objects within viewport (+20% buffer)
- **Frame Rate Target:** 60fps constant (throttle animations if needed)

**Animation Performance:**
- **Idle animations:** 2-4 frame loops, 2-second cycles (low CPU)
- **Particle effects:** Max 20 particles at once
- **Stagger animations:** Plant sways offset by 0.1s each (avoid sync-up)

### 6.2 Load Time Targets

**Initial App Launch:**
- **Cold start:** <2 seconds to Garden View
- **Splash screen:** Pixel art logo, 1 second max
- **Data fetch:** Load plants from Supabase in background, show last cached state immediately

**Screen Transitions:**
- **Panel open:** <0.3s
- **Navigation:** <0.2s between screens

---

## 7. Wireframe Mockups

### 7.1 Garden View (Main Screen) - Wireframe

**See attached Excalidraw file:** `garden-wireframe.excalidraw`

*The wireframe will be created separately using the create-excalidraw-wireframe workflow and saved to the docs folder.*

**Wireframe Contents:**
1. **Garden View (Main Screen)** - Isometric grid, plants, top/bottom bars
2. **Plant Info Panel** - Modal overlay with friend details
3. **Add Friend Flow** - 4-step process screens
4. **Friends List** - Vertical list view
5. **Settings Screen** - Grouped list layout
6. **Navigation Drawer** - Side menu

---

## 8. Technical Implementation Notes

### 8.1 Component Architecture (React Native)

**Component Hierarchy:**

```
<App>
  <NavigationContainer>
    <DrawerNavigator>
      <GardenScreen>                     ← Main screen
        <TopBar />
        <IsometricGardenCanvas>
          <BackgroundLayers />
          <GridOverlay />
          <PlantSprites />
          <FurnitureSprites />
          <ParticleEffects />
        </IsometricGardenCanvas>
        <BottomActionBar />
        <PlantInfoPanel />              ← Modal
        <NotificationPanel />           ← Modal
      </GardenScreen>

      <FriendsListScreen />
      <SettingsScreen />
    </DrawerNavigator>
  </NavigationContainer>
</App>
```

### 8.2 State Management

**Global State (React Context):**
```typescript
interface AppState {
  user: User;
  plants: Plant[];
  friends: Friend[];
  gardenLayout: GardenLayout;
  notifications: Notification[];
  settings: Settings;
}
```

**Local Component State:**
- **Edit Mode:** Boolean (isEditMode)
- **Selected Object:** PlantID | null (currently dragging)
- **Panel Visibility:** Boolean (showPlantInfo, showNotifications)

### 8.3 Data Sync Strategy

**Optimistic UI Updates:**
1. User logs interaction → Update local state immediately
2. Show success feedback (toast, hydration bar fills)
3. Sync to Supabase in background
4. On failure: Rollback local state, show error

**Offline Support:**
- All garden data cached locally (AsyncStorage + Expo SQLite)
- Queue interactions when offline
- Sync on reconnection

---

## 9. Open Design Questions

### 9.1 For User Review

1. **Bottom Action Bar visibility:**
   - Option A: Always visible with "Edit Garden" button
   - Option B: Hidden by default, long-press any plant to enter Edit Mode
   - **Recommendation:** Option B (cleaner, more immersive)

2. **Plant Info Panel actions priority:**
   - Current order: Call, Text, Log, Edit, Remove
   - Alternative: Log, Call, Text (prioritize manual logging)
   - **Recommendation:** Keep current (encourage direct contact)

3. **Friends List default sort:**
   - Option A: Alphabetical
   - Option B: Status (thirsty first)
   - Option C: Last contact (oldest first)
   - **Recommendation:** Option B (action-oriented)

4. **Empty garden CTA:**
   - Option A: Large "Add Friend" button only
   - Option B: "Add Friend" + "Take Tour" (tutorial)
   - **Recommendation:** Option B if we build tutorial, otherwise A

---

## 10. Next Steps

### 10.1 Immediate Actions

1. **Review this analysis document** with stakeholders
2. **Generate wireframe mockups** using create-excalidraw-wireframe workflow
3. **Create clickable prototype** (optional, using Figma or similar)
4. **Pixel art asset generation kickoff** (PixelLab AI prompts)
5. **Start React Native component development:**
   - Phaser integration for isometric rendering
   - Garden grid system
   - Drag-and-drop interaction
   - Plant Info Panel UI

### 10.2 Design Deliverables Needed

- [ ] Excalidraw wireframe file (all screens)
- [ ] High-fidelity mockups (optional, for App Store screenshots)
- [ ] Component library in Storybook (for isolated development)
- [ ] Animation specifications document
- [ ] Accessibility testing checklist

---

## Conclusion

This analysis provides a comprehensive blueprint for implementing the **Core Garden UI** and supporting navigation for Rooted MVP. The design prioritizes:

✅ **Calm, immersive garden experience** (minimal UI chrome)
✅ **Isometric pixel art aesthetic** (consistent visual language)
✅ **Intuitive interactions** (tap, drag, swipe patterns)
✅ **Clear navigation** (drawer-based, garden-centric)
✅ **Actionable friend management** (Friends List, Plant Info Panel)

**Key Success Metrics:**
- Users spend 80%+ of time in Garden View
- 90%+ onboarding completion (clear UI guidance)
- <3 seconds to complete any core action (add friend, log interaction)
- 4.5+ App Store rating (delightful, polished UX)

The wireframe mockups (to be generated next) will visualize these specifications and serve as the final design handoff to development.

---

**Document Version:** 1.0
**Last Updated:** December 6, 2025
**Next Review:** After wireframe creation
