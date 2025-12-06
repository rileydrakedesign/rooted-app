# Rooted - Development Guide

## Custom Development Build Setup

This project uses **custom development builds** instead of Expo Go.

### Why Custom Builds?

- Expo Go always runs with Fabric (React Native's new architecture) enabled
- react-native-screens has a known incompatibility with Fabric
- Custom builds allow `newArchEnabled: false` for full compatibility

### Development Commands

| Command | Description |
|---------|-------------|
| `npx expo run:ios` | Build and run on iOS Simulator |
| `npx expo run:android` | Build and run on Android Emulator |
| `npx expo start --dev-client` | Start Metro bundler only (after initial build) |

### First-Time Build (iOS)

```bash
# Install dependencies
npm install

# Build and run (takes 10-15 minutes first time)
npx expo run:ios
```

### Subsequent Runs

After the initial build, you can either:

```bash
# Option 1: Rebuild (if native code changed)
npx expo run:ios

# Option 2: Just restart Metro (faster, for JS-only changes)
npx expo start --dev-client
# Then press 'i' to open in iOS Simulator
```

### Key Configuration (app.json)

```json
{
  "expo": {
    "newArchEnabled": false,
    "plugins": ["expo-dev-client"]
  }
}
```

### Troubleshooting

**"No bundle URL present"** - Metro bundler not running:
```bash
npx expo start --dev-client
```

**Xcode build errors** - Clean and rebuild:
```bash
cd ios && rm -rf Pods Podfile.lock && pod install && cd ..
npx expo run:ios
```

**Reset Metro cache**:
```bash
npx expo start --dev-client --clear
```

---

## Project Setup Complete! ✅

The React Native Expo project has been initialized with the following structure:

```
rooted_app/
├── src/
│   ├── components/          # Reusable UI components
│   ├── screens/             # Screen components
│   │   ├── WelcomeScreen.tsx
│   │   ├── LoginScreen.tsx
│   │   ├── SignUpScreen.tsx
│   │   ├── GardenScreen.tsx
│   │   ├── FriendsScreen.tsx
│   │   └── ProfileScreen.tsx
│   ├── navigation/          # Navigation setup
│   │   ├── AuthNavigator.tsx
│   │   ├── MainNavigator.tsx
│   │   └── RootNavigator.tsx
│   ├── lib/                 # Utilities
│   │   └── supabase.ts      # Supabase client
│   ├── hooks/               # Custom React hooks
│   ├── types/               # TypeScript types
│   │   ├── database.ts      # Database types
│   │   └── navigation.ts    # Navigation types
│   └── assets/              # Pixel art sprites, fonts
├── assets/                  # Expo default assets
├── docs/                    # Documentation
├── App.tsx                  # Main app entry
├── package.json
└── .env.example             # Environment variables template
```

---

## Quick Start

### 1. Install Dependencies (Already Done ✅)

Dependencies have been installed:
- @supabase/supabase-js
- @react-native-async-storage/async-storage
- @react-navigation/native
- @react-navigation/native-stack
- @react-navigation/bottom-tabs
- react-native-screens
- react-native-safe-area-context
- react-native-gesture-handler
- expo-constants
- expo-secure-store
- expo-build-properties

### 2. Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Get your Supabase credentials:
   - Go to [Supabase Dashboard](https://supabase.com)
   - Navigate to: **Settings → API**
   - Copy **Project URL** and **anon/public key**

3. Update `.env` with your credentials:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
   ```

### 3. Start Development Server

```bash
npm start
```

Then choose your platform:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Press `w` for web browser
- Scan QR code with Expo Go app on physical device

---

## Project Architecture

### Authentication Flow

1. **Welcome Screen** → Login or Sign Up
2. **Auth State Listener** in `RootNavigator` automatically switches between:
   - Auth Stack (Welcome, Login, SignUp)
   - Main Tab Navigator (Garden, Friends, Profile)

### Navigation Structure

```
RootNavigator
├── Auth Stack (if not logged in)
│   ├── Welcome
│   ├── Login
│   └── SignUp
└── Main Tab Navigator (if logged in)
    ├── Garden Tab
    ├── Friends Tab
    └── Profile Tab
```

### Database Types

All database types are auto-generated in `src/types/database.ts` based on the Supabase schema:
- Enums: `PlantType`, `EvolutionStage`, `ContactFrequency`, `InteractionType`, `GardenTheme`
- Tables: `User`, `Friend`, `Plant`, `Interaction`, etc.
- Helper types: `PlantWithFriend`, `FriendWithPlant`, etc.

### Supabase Client

Configured in `src/lib/supabase.ts` with:
- AsyncStorage for session persistence
- Auto token refresh
- Row Level Security (RLS) enabled on all tables

---

## Current Features

### ✅ Implemented (MVP Foundation)

- **Authentication**
  - Welcome screen with branding
  - Email/password login
  - Sign up with display name, email, phone (optional)
  - Auto-redirect based on auth state
  - Logout functionality

- **Navigation**
  - Auth stack (Welcome → Login/SignUp)
  - Main tab navigator (Garden, Friends, Profile)
  - Bottom tabs with emoji icons (temp - will be pixel art)

- **Screens**
  - Welcome: App intro with login/signup buttons
  - Login: Email + password authentication
  - SignUp: Full registration form
  - Garden: Placeholder for isometric grid (to be implemented)
  - Friends: List of friends with plant type and hydration
  - Profile: User info, stats, settings, logout

- **Database Integration**
  - Supabase client configured
  - TypeScript types for all tables
  - RLS policies enforced
  - Friends list fetching
  - User profile fetching

### 🚧 To Be Implemented (MVP)

#### Phase 1: Core Functionality
- [ ] Add Friend flow
  - Form with name, contact info, plant type, contact frequency
  - Auto-create plant in database
  - Grid position assignment
- [ ] Friend detail/edit screen
- [ ] Plant detail screen
  - Show hydration, evolution stage, streak
  - "Water now" button (log interaction)
  - Friend info
  - Artifacts display

#### Phase 2: Garden Visualization
- [ ] Isometric grid rendering
  - Evaluate: Phaser vs react-native-svg
  - 6×6 grid layout
  - 2:1 pixel ratio isometric perspective
- [ ] Plant sprites (8 types × 3 stages = 24 sprites)
  - Use PixelLab AI + MCP for generation
- [ ] Plant animations
  - Idle animation
  - Watering animation
  - Death animation
- [ ] Drag-and-drop garden customization

#### Phase 3: Hydration System
- [ ] Auto-update plant hydration on app open
  - Call `update_plant_hydration()` for all plants
- [ ] Visual hydration indicators
  - Color tinting based on hydration %
  - Wilting effects below 30%
- [ ] Thirsty plant notifications
  - Push notification setup
  - Schedule daily check for plants < 60%

#### Phase 4: Interactions
- [ ] Manual interaction logging
  - Quick "Call" / "Text" buttons
  - Hydration restoration
  - Streak tracking
- [ ] iOS call/text auto-detection (Post-MVP if complex)
  - CallKit integration
  - Background processing

#### Phase 5: Plant Evolution
- [ ] XP accumulation per interaction
- [ ] Evolution stage progression
  - Sprout (0-100 XP)
  - Young (100-300 XP)
  - Mature (300+ XP)
- [ ] Visual evolution transitions

#### Phase 6: Artifacts (Post-MVP)
- [ ] Plant-level artifacts
  - Butterfly (7d streak)
  - Bee (14d)
  - Hummingbird (30d)
  - Firefly (60d)
  - Dragonfly (90d)
- [ ] Garden-level artifacts
  - Wind Chime (70% avg hydration)
  - Bird Feeder (80%)
  - Painting (85%)
  - Cat (90%)
  - Gnome (95%)

#### Phase 7: Death & Revival
- [ ] Death state UI
  - Grayscale + wilted sprite
  - Grace period countdown (24 hours)
- [ ] Revive flow
  - Free revive (reset to sprout)
  - Premium revive (restore stage + streak)
- [ ] IAP integration (react-native-iap)

#### Phase 8: Customization
- [ ] Garden themes
  - Cozy Greenhouse (default)
  - Moonlight, Cosmic, Underwater
- [ ] Decorative items
  - Furniture placement
  - Multiple garden rooms (Post-MVP)

#### Phase 9: Settings
- [ ] Notifications toggle
- [ ] Theme selection
- [ ] Account management
- [ ] Premium subscription (Post-MVP)

---

## Design Guidelines

### Color Palette (Earthy Tones)
- Primary Green: `#4A5D3E`
- Secondary Green: `#6B7C5E`
- Light Green: `#9BA89C`
- Beige Background: `#F5F5DC`
- White Cards: `#FFFFFF`
- Border Gray: `#D4D4C8`

### Typography
- **Production**: Press Start 2P (pixel font)
- **Current**: System default (will be updated with custom pixel font)

### UI Patterns
- **Buttons**: Rounded rectangles (will be pixel art style with press-down effect)
- **Cards**: White background, subtle shadow, rounded corners
- **Icons**: Currently emojis (will be pixel art icons)

---

## Development Commands

### Run Development Server
```bash
npm start
```

### Run on iOS Simulator
```bash
npm run ios
```

### Run on Android Emulator
```bash
npm run android
```

### Run in Web Browser
```bash
npm run web
```

### TypeScript Check
```bash
npx tsc --noEmit
```

---

## Database Operations

### Common Queries

#### Get All Friends with Plants
```typescript
const { data: friends } = await supabase
  .from('friends')
  .select(`
    *,
    plants (*)
  `)
  .order('created_at', { ascending: false });
```

#### Add Friend + Plant
```typescript
// 1. Create friend
const { data: friend } = await supabase
  .from('friends')
  .insert({
    name: 'Alice',
    plant_type: 'sunflower',
    contact_frequency: 'weekly',
  })
  .select()
  .single();

// 2. Create plant
const { data: plant } = await supabase
  .from('plants')
  .insert({
    friend_id: friend.id,
    grid_position_x: 2,
    grid_position_y: 3,
    decay_rate_per_day: 14.29, // weekly
  })
  .select()
  .single();
```

#### Log Interaction (Auto-Restores Hydration)
```typescript
await supabase.rpc('log_interaction', {
  p_user_id: user.id,
  p_friend_id: friend.id,
  p_interaction_type: 'call',
  p_was_auto_detected: false,
});
```

#### Update All Plants on App Open
```typescript
const { data: plants } = await supabase
  .from('plants')
  .select('id');

for (const plant of plants) {
  await supabase.rpc('update_plant_hydration', {
    p_plant_id: plant.id,
  });
}
```

---

## Testing

### Test Accounts
Create test users via Sign Up screen or Supabase dashboard.

### Test Data
Use SQL Editor in Supabase to insert test friends and plants:

```sql
-- Insert test friend (replace user_id with your auth.uid())
INSERT INTO friends (user_id, name, plant_type, contact_frequency)
VALUES ('your-user-id', 'Test Friend', 'sunflower', 'weekly')
RETURNING id;

-- Insert test plant (use friend_id from above)
INSERT INTO plants (friend_id, grid_position_x, grid_position_y, decay_rate_per_day)
VALUES ('friend-id-from-above', 0, 0, 14.29);
```

---

## Troubleshooting

### "Missing Supabase environment variables"
- Make sure you created `.env` from `.env.example`
- Restart Expo dev server after adding `.env`

### "No rows returned" from database queries
- Check that you're logged in
- Verify RLS policies in Supabase dashboard
- Check `auth.uid()` matches your user ID

### Navigation not working
- Make sure all screens are imported correctly
- Check that navigation types match ParamLists

### TypeScript errors
- Run `npx tsc --noEmit` to see all errors
- Ensure database types are up to date

---

## Next Steps

1. **Create `.env` file** with your Supabase credentials
2. **Test authentication** flow (sign up → login → logout)
3. **Implement Add Friend** screen and functionality
4. **Start garden grid** development (Phaser vs react-native-svg decision)
5. **Generate pixel art assets** with PixelLab AI

---

## Resources

- **PRD**: `docs/prd.md` - Complete product specification
- **Database Schema**: `docs/DATABASE_SCHEMA.md` - Full database reference
- **Database Quick Ref**: `docs/DATABASE_QUICK_REFERENCE.md` - Common queries
- **Supabase Setup**: `SUPABASE_SETUP.md` - Backend setup guide
- **Expo Docs**: https://docs.expo.dev/
- **React Navigation**: https://reactnavigation.org/
- **Supabase Docs**: https://supabase.com/docs

---

**Project Status**: React Native foundation complete ✅
**Next Phase**: Core MVP features (Add Friend, Garden Grid, Hydration System)

Last Updated: December 5, 2025
