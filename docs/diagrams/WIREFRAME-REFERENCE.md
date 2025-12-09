# Wireframe Reference Guide
**Quick reference for implementing Rooted Garden UI screens**

## 📁 Files Available

### Visual Wireframes
- **Main File:** `wireframe-garden-ui.excalidraw` - Editable source (open in Excalidraw.com)
- **Export:** `wireframe-garden-ui.png` - Full wireframe image for Claude reference
- **Individual Screens:** `wireframes/screen-{n}-{name}.png` - Per-screen exports

### Documentation
- **Detailed Spec:** `garden-ui-navigation-analysis.md` - 10-section comprehensive design doc
- **Theme:** `theme.json` - Exact colors, fonts, borders from onboarding code

---

## 🎨 Screen Index

### Screen 1: Garden View (Main)
**File:** `screen-1-garden-view.png`
**Components:**
- Top bar (menu, title, +, settings, notifications)
- Isometric garden viewport (6×6 grid)
- Plant sprites with tap interaction
- Bottom "Edit Garden" button

**Implementation Priority:** P0 (Core screen)
**Reference:** Analysis doc Section 1

---

### Screen 2: Plant Info Panel (Modal)
**File:** `screen-2-plant-info-panel.png`
**Components:**
- Slide-up modal (swipe handle)
- Plant sprite + friend details
- Hydration progress bar (pixel style)
- Action buttons: CALL, TEXT, LOG, EDIT
- Remove link (destructive)

**Implementation Priority:** P0
**Reference:** Analysis doc Section 1.5

---

### Screen 3: Add Friend - Contact Selection
**File:** `screen-3-add-friend-contact.png`
**Components:**
- Back button + progress bar (3/6)
- Title: "ADD YOUR FIRST FRIEND!"
- Search contacts input
- "+ ADD FRIEND" button
- "Skip for now" link

**Implementation Priority:** P0
**Reference:** Analysis doc Section 3.2 (Step 1)

---

### Screen 4: Add Friend - Choose Plant
**File:** `screen-4-add-friend-plant.png`
**Components:**
- Progress bar (4/6)
- Large plant preview (200x200)
- Left/right carousel arrows
- Plant name + description
- Carousel dots indicator (8 plants)
- "SELECT PLANT" button

**Implementation Priority:** P0
**Reference:** Analysis doc Section 3.2 (Step 3)

---

### Screen 5: Friends List
**File:** `screen-5-friends-list.png`
**Components:**
- Header: Menu | Title | +
- Sectioned list:
  - "⚠️ NEEDS ATTENTION" (thirsty plants)
  - "✅ HEALTHY" (good plants)
- Friend cards with hydration bars
- Quick action icons (📞💬)

**Implementation Priority:** P0
**Reference:** Analysis doc Section 3.4

---

### Screen 6: Settings
**File:** `screen-6-settings.png`
**Components:**
- Grouped list sections:
  - Account (profile, password)
  - Notifications (toggles, time picker)
  - Garden (theme, limit)
  - Privacy & Data
  - About
- LOGOUT button (bottom, red)

**Implementation Priority:** P0
**Reference:** Analysis doc Section 3.5

---

### Screen 7: Navigation Drawer
**File:** `screen-7-navigation-drawer.png`
**Components:**
- Left-side drawer (270px width)
- Header: "MY GARDEN 🌿"
- Menu items (active state highlight)
- User profile footer (avatar, name, logout)
- Darkened overlay on right

**Implementation Priority:** P0
**Reference:** Analysis doc Section 2.1

---

### Screen 8: Edit Mode (Garden State)
**File:** `screen-8-edit-mode.png`
**Components:**
- Garden View with edit overlay
- Plants with green glow outlines
- Bottom action bar (dark wood #3E2723):
  - ✓ Done (green)
  - 🗑️ Remove
  - 🎨 Decor
  - ↩️ Undo

**Implementation Priority:** P1 (Post-MVP)
**Reference:** Analysis doc Section 1.7

---

## 💡 Usage Tips for Claude

### When Implementing a Screen:
1. **Reference the wireframe image:** `@screen-{n}-{name}.png`
2. **Read detailed specs:** Check Analysis doc section
3. **Apply theme:** Use colors/fonts from `theme.json`
4. **Check existing components:** Reuse PixelButton, PixelInput, ProgressBar

### Example Prompt:
```
"Implement the Friends List screen based on @screen-5-friends-list.png
and the specs in garden-ui-navigation-analysis.md Section 3.4.
Use the theme from theme.json and existing components from /src/components."
```

### Component Reuse:
- **PixelButton** - All primary/secondary buttons
- **PixelInput** - All text inputs
- **ProgressBar** - Onboarding and hydration bars
- **BackButton** - All back navigation

---

## 🎨 Design System Quick Reference

### Colors (from theme.json)
```typescript
background: '#F5E6D3'      // Warm beige
buttonPrimary: '#B8916B'   // Tan/brown
buttonSecondary: '#D4A574' // Light tan
textPrimary: '#6B4423'     // Dark brown
textHeading: '#8B4513'     // Brown
textSecondary: '#A0826D'   // Tan
inputBg: '#FFFFFF'         // White
```

### Fonts
```typescript
heading: 'Rubik_700Bold'   // 28-36pt
subtext: 'Nunito_700Bold'  // 16-20pt
pixel: 'VT323_400Regular'  // 16-27pt (buttons/inputs)
```

### Pixel Art Borders
```typescript
borderWidth: 3
borderTopWidth: 2
borderLeftWidth: 2
borderRightWidth: 4
borderBottomWidth: 4
borderRadius: 10          // Buttons
borderRadius: 8           // Inputs
```

### Shadows (Pixel Style)
```typescript
shadowOffset: { width: -3, height: 3 }
shadowOpacity: 0.4
shadowRadius: 0           // NO blur for pixel effect
```

---

## 📋 Implementation Checklist

- [ ] Export wireframes to PNG
- [ ] Organize by screen in `/docs/diagrams/wireframes/`
- [ ] Reference theme.json for exact styling
- [ ] Reuse existing pixel art components
- [ ] Test on iPhone dimensions (375×812)
- [ ] Validate against acceptance criteria in Analysis doc

---

**Last Updated:** December 7, 2025
**Wireframe Version:** 1.0
