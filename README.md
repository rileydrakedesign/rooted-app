# Rooted - Relationship Wellness App

**Your greenhouse for growing friendships.**

A relationship wellness app that transforms friendship maintenance into a peaceful, rewarding practice through isometric pixel art gamification.

---

## 📋 Project Status

**Current Phase:** React Native foundation complete ✅
**Next Steps:** Core MVP features (Add Friend, Garden Grid, Hydration System)

See **[DEVELOPMENT.md](./DEVELOPMENT.md)** for complete setup guide and development roadmap.

---

## 🎯 Quick Links

### Documentation

- **[Product Requirements Document (PRD)](./docs/prd.md)** - Complete product specification (2,184 lines)
- **[Database Schema](./docs/DATABASE_SCHEMA.md)** - Full database reference with ERD, tables, functions
- **[Database Quick Reference](./docs/DATABASE_QUICK_REFERENCE.md)** - Cheat sheet for common queries
- **[Supabase Setup Guide](./SUPABASE_SETUP.md)** - Step-by-step backend setup

### Code

- **[Database Schema SQL](./supabase-schema.sql)** - Production-ready Supabase schema

---

## 🏗️ Tech Stack

- **Frontend:** React Native (Expo) + TypeScript
- **Backend:** Supabase (PostgreSQL)
- **Rendering:** Phaser or react-native-svg (isometric pixel art)
- **Auth:** Supabase Auth (Email, Phone, Sign in with Apple)
- **Assets:** PixelLab AI + PixelLab AI MCP
- **Fonts:** Press Start 2P (pixel font)

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (installed automatically with project)
- Supabase account (database already deployed ✅)
- iOS Simulator (for iOS testing) or Android Emulator

### 1. Clone and Install (Already Done ✅)

Dependencies installed:
- React Native (Expo)
- Supabase client
- React Navigation
- All core dependencies

### 2. Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Get your Supabase credentials:
   - Go to [Supabase Dashboard](https://supabase.com) → Settings → API
   - Copy **Project URL** and **anon/public key**

3. Update `.env`:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
   ```

### 3. Start Development

```bash
npm start
```

Then press:
- `i` for iOS simulator
- `a` for Android emulator
- `w` for web browser

See **[DEVELOPMENT.md](./DEVELOPMENT.md)** for complete development guide.

---

## 📐 Project Structure

```
rooted_app/
├── src/
│   ├── components/                     # Reusable UI components
│   ├── screens/                        # Screen components
│   │   ├── WelcomeScreen.tsx
│   │   ├── LoginScreen.tsx
│   │   ├── SignUpScreen.tsx
│   │   ├── GardenScreen.tsx
│   │   ├── FriendsScreen.tsx
│   │   └── ProfileScreen.tsx
│   ├── navigation/                     # Navigation setup
│   │   ├── AuthNavigator.tsx
│   │   ├── MainNavigator.tsx
│   │   └── RootNavigator.tsx
│   ├── lib/
│   │   └── supabase.ts                 # Supabase client
│   ├── hooks/                          # Custom React hooks
│   ├── types/
│   │   ├── database.ts                 # Database types
│   │   └── navigation.ts               # Navigation types
│   └── assets/                         # Pixel art sprites, fonts (TBD)
├── docs/
│   ├── prd.md                          # Product Requirements Document
│   ├── DATABASE_SCHEMA.md              # Database documentation
│   └── DATABASE_QUICK_REFERENCE.md     # Quick reference guide
├── assets/                             # Expo default assets
├── supabase-schema.sql                 # Database schema
├── App.tsx                             # Main app entry
├── DEVELOPMENT.md                      # Development guide
├── SUPABASE_SETUP.md                   # Backend setup guide
├── README.md                           # This file
├── .env.example                        # Environment variables template
└── package.json                        # Dependencies
```

---

## 🎨 Design System

### Visual Style

- **Art Style:** Isometric pixel art (Habbo Hotel / Stardew Valley style)
- **Perspective:** 3/4 view angle with 2:1 pixel ratio
- **Color Palette:** Warm earthy tones (terracotta, sage green, ochre)
- **Typography:** Press Start 2P or Pixel Operator (pixel fonts)
- **UI:** Pixel art buttons with press-down effects

### Core Mechanics

1. **Friend-to-Plant Mapping** - Each friend = unique plant in greenhouse
2. **Hydration Decay** - Plants need watering based on contact frequency
3. **Plant Evolution** - 3 stages: Sprout → Young → Mature
4. **Collectible Artifacts** - Earn butterflies, bees, wind chimes through streaks
5. **Isometric Grid** - 6×6 customizable greenhouse layout

---

## 💾 Database Overview

### Core Tables

- **users** - User profiles and settings
- **friends** - Friend records (name, contact info, plant type)
- **plants** - Plant state (hydration, evolution, grid position)
- **interactions** - Log of calls/texts
- **garden_layouts** - Garden theme and configuration
- **decorative_items** - Furniture and decorations
- **artifacts** - Collectible rewards (Post-MVP)

### Key Functions

```sql
-- Calculate current hydration based on timestamp
SELECT calculate_current_hydration('plant-uuid');

-- Update plant hydration (call on app open)
SELECT update_plant_hydration('plant-uuid');

-- Log interaction and restore hydration
SELECT log_interaction(user_id, friend_id, 'call'::interaction_type);
```

See [DATABASE_SCHEMA.md](./docs/DATABASE_SCHEMA.md) for complete reference.

---

## 🎯 MVP Scope

### Must-Have Features

✅ Email/Phone authentication
✅ 6×6 isometric grid garden
✅ 8 plant types with 3 evolution stages
✅ Timestamp-based hydration decay
✅ Call/text auto-detection (iOS)
✅ Manual interaction logging
✅ Plant info panel
✅ Push notifications
✅ Free/Premium plant revives
✅ Basic decorative furniture

### Post-MVP (v1.1+)

- Collectible artifacts system (butterflies, bees, etc.)
- Multiple garden rooms
- Rare plant evolution variants
- Additional garden themes
- Seasonal events
- Garden Pass subscription

See [PRD](./docs/prd.md) for complete roadmap.

---

## 🔒 Security

All database tables have **Row Level Security (RLS)** enabled:

- Users can only access their own data
- Supabase automatically filters queries by `auth.uid()`
- No cross-user data leakage possible

Authentication:
- Email + Password (Supabase Auth)
- Phone (SMS-based, optional)
- Sign in with Apple (iOS native)

---

## 📊 Success Metrics

**North Star Metric:** Weekly Active Friendships (target: 100,000 by Month 12)

**Key KPIs:**
- 50,000 users by Month 12
- 25% Day 30 retention
- 7% paying user conversion
- $50,000 Year 1 revenue

See [PRD - Success Metrics](./docs/prd.md#success-metrics--kpis) for full metrics framework.

---

## 🗺️ Development Roadmap

### Phase 0: Setup ✅
- ✅ PRD created
- ✅ Database schema designed and deployed
- ✅ Documentation written
- ✅ React Native Expo project initialized
- ✅ Authentication screens (email/phone login)
- ✅ Navigation structure (Auth + Main tabs)
- ✅ Supabase client configured

### Phase 1: MVP Development (Months 1-3)
- [ ] Add Friend screen and functionality
- [ ] Isometric grid rendering with Phaser
- [ ] PixelLab AI asset generation
- [ ] Friend management (add/edit/delete)
- [ ] Plant hydration system
- [ ] Call/text detection integration
- [ ] Push notifications
- [ ] IAP (premium revives)
- [ ] TestFlight beta testing

### Phase 2: Post-Launch (Months 4-6)
- [ ] Artifact system (butterflies, bees, etc.)
- [ ] Additional decorative items
- [ ] Garden Pass subscription
- [ ] Performance optimization
- [ ] Analytics integration

### Phase 3: Growth (Months 7-12)
- [ ] Garden rooms expansion
- [ ] Seasonal events
- [ ] Rare plant variants
- [ ] Social sharing features
- [ ] Achievement system

See [PRD - Roadmap](./docs/prd.md#product-roadmap) for detailed timeline.

---

## 💰 Monetization

**Model:** Free-to-play with in-app purchases

**Revenue Streams:**
- Premium plant revives ($0.99 each)
- Decorative item packs ($1.99)
- Garden Pass subscription ($4.99/month, from Month 6)
- Theme packs ($2.99 each)

**Alternative (Under Exploration):**
- Coin & Gem dual-currency system
- To be A/B tested post-MVP

See [PRD - Monetization](./docs/prd.md#monetization-strategy) for full strategy.

---

## 🤝 Contributing

This is currently a solo development project. Contributions are not being accepted at this time.

---

## 📝 License

All rights reserved. This project is proprietary and not open source.

---

## 📞 Contact

**Developer:** Rileydrake
**Project:** Rooted - Relationship Wellness App
**Status:** Alpha (React Native foundation complete)

---

## 🙏 Acknowledgments

- **BMad Method** - PRD creation and workflow orchestration
- **Supabase** - Backend infrastructure
- **Expo** - React Native development platform
- **PixelLab AI** - Asset generation

---

**Last Updated:** December 5, 2025
**Version:** 0.2.0 (React Native Foundation Complete)
