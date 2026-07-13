# Rooted — Pricing Model Research

*Market research session, July 2026. Goal: figure out what we can actionably charge without driving users away, and which pricing model fits Rooted.*

---

## TL;DR Recommendation

**Generous freemium + a single low-priced subscription ("Rooted Garden Pass"), with one carefully-designed consumable (premium revive) folded into it.**

- **Free tier:** the entire core loop, forever — watering, decay, streaks, evolution, free revives — capped at **10 plants** and **3–4 base plant species**.
- **Garden Pass:** **$4.99/mo or $29.99/yr** (7-day free trial on annual). Unlimited plants, full/rare/seasonal plant catalog, garden themes & decor, streak freeze, and 2 premium revives per month.
- **À la carte premium revive** for non-subscribers: **$0.99** (keeps streak + growth stage; the free revive always exists and resets to sprout).
- **No purchasable coin packs.** Keep an *earned-only* soft currency (leaf coins from watering) for cosmetics if we want one; subscribers get a monthly bonus (the Habitica pattern).
- **Do not sell growth speed.** In Rooted, plant progress = proof you contacted a real friend. Selling speed sells a counterfeit of the product's meaning.

Rationale, market evidence, and the full model-by-model map follow.

---

## 1. What we're pricing (grounded in the current codebase)

Rooted is a friendship-maintenance garden: each friend is a plant; contacting the friend waters it; neglect wilts and eventually kills it. The monetizable surface that already exists in code/schema:

| Mechanic | Where it lives | Monetization relevance |
|---|---|---|
| Hydration decay & watering | `calculate_decay_rate`, `log_interaction` in `supabase-schema.sql` | Core loop — must stay free |
| Plant death & revive | `revive_logs` table with `revive_type: 'free' \| 'premium'` | Schema already anticipates a paid revive |
| Evolution stages, streaks, XP | `evolution_stage`, `streak_count`, `total_xp` | Progression — risky to sell |
| Premium flag | `users.is_premium`, `premium_expires_at` | Subscription entitlement stub exists |
| Premium decor | `decorative_items.is_premium` | Cosmetics — safest thing to sell |
| Friend cap | `SettingsScreen.tsx` placeholder `12/20` | Natural free-tier lever |
| Garden grid | ~90 usable tiles (`GardenContext.tsx`) | Hard ceiling on paid cap |

No IAP/RevenueCat/StoreKit code exists yet — pricing model is still a green field.

Positioning constraint the user called out, confirmed by the market: Rooted is a **novelty / cozy product, not an essential tool** — but it sits in the **mental health & connection** space. That combination narrows what we can gate without brand damage (see the Finch lesson below).

---

## 2. Comparable apps and how they landed on pricing

### Closest analogs

| App | Space | Model | Price | What's gated |
|---|---|---|---|---|
| **Widgetable** | Shared pets/plants with friends (closest analog) | Freemium sub + consumables | **$4.99/mo, $19.99/yr**, plus diamond packs $0.99–$4.99, pet egg $1.99 | Premium widgets/pets; diamonds buy convenience items |
| **Finch** | Self-care pet (mental-health-adjacent) | Generous freemium sub | **$9.99/mo, $69.99/yr** (sales to ~$40) | Cosmetics only — outfits, soundscapes, extra customization. *All* self-care features free, no ads |
| **Forest** | Focus gamification, tree metaphor | Paid up-front + IAP | $3.99 one-time; $1–3 boosters; earned coins → real trees | Coins earned, not bought (mostly); real-tree donations capped |
| **Flora** | Forest competitor | Free + optional sub | Free core; $1.99–$9.99/yr "Flora Care" for real-tree donation | Nothing functional — the paid tier is altruism |
| **Habitica** | Gamified habits, RPG | Freemium sub + gems | $4.99/mo, ~$48/yr; gem packs | Explicitly **not pay-to-win**; gems buy cosmetics; subscribers convert gold→gems |
| **Paired** | Relationship connection (couples) | Freemium sub | ~$6.99–$14.99/mo, ~$75–84/yr | Content volume: free = 1 question/day, paid = everything anytime; one sub covers both partners |
| **Snapchat+** | Social, friend-graph | Freemium sub | **$3.99/mo, $39.99/yr** | Cosmetics, customization, experimental features — never messaging itself |
| **Locket** | Friend widget | Free (Gold tier emerging) | Free; hard 20-friend cap *for everyone* as a product choice | Deliberately intimacy-scaled, not monetization-scaled |

### What the closest analogs teach us

1. **Finch (the mental-health anchor):** its beloved reputation — and its conversion — comes from a hard rule: **you never pay to take care of your bird.** Paid = cosmetics + variety + supporting the devs. Reviews consistently frame Plus as "paying to support them," which is the best possible framing for a mental-health brand. Translation for Rooted: **you must never pay to water, keep alive, or maintain a friendship-plant.**
2. **Widgetable (the price anchor):** the closest product analog (shared plants/pets with friends, widget-forward, cozy) monetizes at **$19.99/yr** with small consumables on top. This is the realistic willingness-to-pay ceiling for "cozy social novelty," and it's far below Finch's $69.99/yr — Finch can charge wellness prices because it's positioned as a self-care tool; Rooted at launch is closer to Widgetable.
3. **Snapchat+ (the social anchor):** $3.99/mo is the proven "premium tier of a friend app" price point. It never gates communication — only expression and status.
4. **Habitica (the fairness anchor):** gamified apps with real-life meaning succeed by being loudly not-pay-to-win. Purchasable currency exists but buys nothing that substitutes for doing the actual habit.
5. **Locket (the counterexample):** caps friends at 20 for *everyone* because the cap **is the product** (intimacy). Lesson: a friend cap can be a free-tier lever, but the free cap must sit above what a normal user needs, or the app feels broken rather than generous.

### Industry benchmarks (RevenueCat *State of Subscription Apps 2026*)

- Freemium apps: median download→paid conversion **~2.1%**; hard paywall median **~10.7%** (but at massive top-of-funnel cost — wrong for a social app that needs network effects).
- Health & Fitness median monthly price **$9.70**; top performers convert >23% — but those are utility/outcome apps (fitness plans, therapy), not cozy novelties.
- **Hybrid is now standard:** ~35% of apps mix subscriptions with consumables/lifetime; ~20% of Social & Lifestyle apps run subscription + consumables. Still, **subscriptions produce 82% of all non-gaming app revenue** — consumables are a garnish, not the meal.
- ~30% of annual subs cancel in month one → the trial and first-month experience matter more than the price point.

---

## 3. The four models, mapped

### Model A — Generous freemium + subscription ("the Finch/Widgetable model") ✅ RECOMMENDED

**Free tier (the full product, honestly):**
- Everything in the core loop: add friends, water via call/text/log, hydration, decay, streaks, XP, evolution sprout→mature.
- **Up to 10 plants.** (Most people actively maintain 5–15 close friendships; 10 is generous enough that the cap won't bite typical users, and power users self-identify as buyers. Settings placeholder currently shows 12/20 — tighten to 10 free.)
- 3–4 base plant species (matches the current ChoosePlant screen: cactus, sunflower, monstera, ficus).
- **Free revive always available** (plant resets to sprout, streak lost). Death must never be a paywall — see risk section.
- No ads. Ever. (Ads on a mental-health/friendship app poison the brand; Finch's "no ads" is part of why its community evangelizes it.)

**Garden Pass — $4.99/mo, $29.99/yr, 7-day trial on annual:**
- Unlimited plants (up to the ~90-tile grid).
- Full plant catalog + rare/seasonal/mythic variants (the PRD's 8 species × stages + seasonal collectibles).
- Garden themes, weather effects, decorative furniture (`decorative_items.is_premium` already exists).
- **2 premium revives/month included** (restore streak + stage).
- **Streak freeze / vacation mode** (protect plants while traveling — a genuine kindness feature that reads as caring, not extractive).
- Priority/early features: widgets when built, garden sharing, etc.
- Optional: monthly leaf-coin bonus (Habitica-style) if we ship a cosmetic currency.

**Why it wins:** matches the two closest analogs (Finch's ethics, Widgetable's price), preserves the viral loop (friends must be able to join free — every gated user is a broken plant in someone else's garden), and the paid tier reads as "more garden," never "less guilt."

### Model B — "Full access, pay for speed" (faster growth for paid) ❌ AVOID

Selling faster plant growth or XP boosts breaks the product's core promise: **a mature plant means you actually kept up with a friend.** If money can produce a flourishing plant, the plant stops meaning anything — for the payer *and* for friends who see the garden. Habitica built its entire monetization reputation on refusing exactly this. The one acceptable "speed" adjacent perk is *protection* (streak freeze), which preserves honest progress rather than fabricating it.

### Model C — Coin packs / consumable economy (the gamified model) ❌ AVOID as purchasable; ✅ keep as earned-only

The Widgetable/gacha pattern (buy diamonds → buy items) works for pure-entertainment pet apps. For Rooted it fails on three counts:

1. **What would coins buy?** The only high-urgency sinks in our loop are revives and growth — both are guilt/meaning purchases (see Model B and the risk section). Cosmetic-only coin sinks don't generate enough urgency to sell packs.
2. **Wrong economics:** consumable-led models live off a small whale segment (gaming pattern). Non-gaming apps earn 82% of revenue from subscriptions; a coin economy adds store SKUs, economy-balancing work, and refund surface for a minority revenue stream.
3. **Wrong brand:** "buy a coin pack so your friendship doesn't die" is a screenshot that ends up on social media with the wrong caption.

**Keep the fun half:** an *earned-only* leaf-coin currency (earned by watering) spent on cosmetics is pure retention upside, and subscribers can get a monthly coin bonus. Just never sell coins for money.

### Model D — Pure subscription / hard paywall ❌ AVOID

Hard paywalls convert 5× better per download (10.7% vs 2.1%) but strangle top-of-funnel — fatal for an app whose value is the friend graph. If my friends can't afford the app, my garden is empty and *I* churn. Every social comparable (Snapchat, Locket, Widgetable, BeReal) is free-first for exactly this reason. A hard paywall also invites "charging for friendship" press in the mental-health frame.

### Model D½ — Plant-count limit as *the* freemium constraint ✅ but as part of Model A, not alone

The friend/plant cap is our single best gate (it scales with engagement, doesn't touch the caring loop, and the schema/UI already anticipate it) — but alone it monetizes only super-connectors. Use it as the anchor constraint of Model A's free tier, not as the whole model.

---

## 4. Pricing specifics

| SKU | Price | Notes |
|---|---|---|
| Garden Pass monthly | **$4.99/mo** | Matches Widgetable & Habitica; $1 above Snapchat+; well under Finch's $9.99 |
| Garden Pass annual | **$29.99/yr** (~$2.50/mo, ~50% off) | Between Widgetable's $19.99 and Snapchat+'s $39.99; lead SKU on the paywall |
| Annual free trial | 7 days | Trials boost conversion; 7d fits a low-complexity product |
| Premium revive (à la carte) | **$0.99** | Matches PRD; ONLY as "keep your progress" upsell next to an always-free revive |
| Seasonal cosmetic packs (optional, later) | $1.99–$2.99 | Matches PRD decor/theme packs; also included in Pass |
| Lifetime (optional, later) | $49.99–$59.99 | Widgetable offers lifetime; good for sub-fatigued users; wait for LTV data |

**Revenue sanity check:** at freemium-typical ~2–3% paid conversion and a $30 annual-heavy mix, 50k downloads ≈ 1,000–1,500 subs ≈ **$30–45k/yr** plus revive/cosmetic income. Conversion upside comes from the plant cap biting power users and seasonal cosmetics, not from raising the price.

---

## 5. The mental-health-specific risk (read before building the revive paywall)

Rooted's decay/death mechanic is a **guilt mechanic** pointed at real relationships. That's the product's motivational engine, but it means one hard rule:

> **Never place money between a user and a living plant.** Watering, streaks, and basic survival are free, always. Money may buy *variety, capacity, aesthetics, and convenience* — never care.

The premium revive is right on this line. It's acceptable **only** in this shape:

- A **free revive always exists** and is visually primary (plant returns at sprout, streak resets).
- The **paid revive is framed as convenience** ("restore your progress"), not rescue ("save your friend").
- Copy never implies the friendship itself is at stake for lack of $0.99. The plant died because of neglect *of the friend*; the app should say "reconnect with Sarah," not "pay to fix it."
- Consider grief-softening UX regardless of payment (a dead plant becomes a "memory" rather than a corpse) — Finch's community goodwill is built on the app never punishing you.

Apps in this space live and die on App Store reviews and TikTok sentiment; "the app charged me when my friend's plant died" is the single worst possible story about us. Priced as above, it can't be told.

---

## 6. Suggested validation plan (pre-build)

1. **Instrument first:** track plants-per-user distribution from beta — if <5% of users ever hit 10 plants, the cap is too loose to convert; if >30% hit it, it's too tight and feels punitive. Tune to roughly the 85th–90th percentile.
2. **Paywall test:** A/B annual-first vs monthly-first layout; RevenueCat data says annual-first with trial wins in this price band.
3. **Watch two metrics beyond conversion:** D30 retention of *free* users after hitting the cap (does the gate churn them?), and premium-revive attach rate vs free-revive rate (if paid revives dominate, the framing is coercive — adjust copy, not price).
4. **Price test regionally later**, not at launch; ship US pricing above and revisit after ~90 days of cohort data.

---

## Sources

- [Finch Plus pricing (help center)](https://help.finchcare.com/hc/en-us/articles/38755205001869-Finch-Plus-Pricing) · [Finch Plus benefits](https://help.finchcare.com/hc/en-us/articles/37780200600589-Benefits-of-Finch-Plus) · [Finch review — free vs paid](https://habitbox.app/blog/finch-app-review) · [Finch app review 2026](https://www.autonomous.ai/ourblog/finch-self-care-app-review-full-breakdown)
- [Widgetable — App Store listing (IAP prices)](https://apps.apple.com/us/app/widgetable-besties-couples/id1641107226)
- [Forest vs Flora review](https://nerdynav.com/forest-vs-flora-pomodoro/) · [Forest review & pricing](https://productivewithchris.com/tools/forest/)
- [Habitica subscription (wiki)](https://habitica.fandom.com/wiki/Subscription) · [Habitica gems (wiki)](https://habitica.fandom.com/wiki/Gems)
- [Paired premium](https://www.paired.com/premium) · [Best couples apps with real prices](https://emira.io/articles/best-couples-apps)
- [Snapchat+ plans](https://accounts.snapchat.com/plus/plans) · [Snapchat Lens+ tier — TechCrunch](https://techcrunch.com/2025/06/11/snapchat-rolls-out-a-new-8-99-lens-subscription-tier/)
- [Is Locket free? — ScreenRant](https://screenrant.com/is-locket-widget-free-cost-how-much/)
- [RevenueCat State of Subscription Apps 2026](https://www.revenuecat.com/state-of-subscription-apps) · [2026 benchmarks in 10 minutes](https://www.revenuecat.com/blog/growth/subscription-app-trends-benchmarks-2026/) · [Category pricing benchmarks — Airbridge](https://www.airbridge.io/en/blog/subscription-app-pricing-by-category-2026-benchmark) · [2025 monetization trends — RevenueCat](https://www.revenuecat.com/blog/growth/2025-app-monetization-trends/)
