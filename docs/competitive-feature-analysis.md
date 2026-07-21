# Rooted — Competitive Feature Analysis

*Fourth research doc, July 2026. Follows `pricing-model-research.md`, `widgetable-competitive-analysis.md`, and `real-contact-apps-research.md`.*

**Question:** Direct competition is thin. So what are the **table-stakes features** Rooted inherits from every adjacent category, which **power features** have demonstrated user demand, and which features have competitors shipped that are **actively backfiring**?

**Method:** Advertised features (App Store listings, help centers, changelogs, official wikis) cross-referenced against review mining and user-communicated demand. Where a claim rests on verbatim user reviews it is marked as such; where it rests on secondary blog synthesis it is flagged. Confidence is stated, not implied.

---

## TL;DR — the five findings that should change the roadmap

1. **The single highest-risk decision in the product is plant death, and it has direct negative precedent.** Plant Nanny — a hydration app with *literally Rooted's mechanic* (real-world behavior waters a plant, neglect kills it) — shipped plant death, found users called it "sad and discouraging," and **removed it in v2**. Plants now only wilt. The motivation survived the removal intact. Meanwhile Finch, the retention leader in cozy care-loops, ships **no death, no punitive streaks, no penalty for absence** and is praised specifically for it. Every app in this competitive set that kills the thing you care for is either contested by its own developers (Viridi), contested by its own users since 2013 (Habitica), or monetizing children's panic (Pou). **See §3 — this is the most important section in the doc.**

2. **Rooted's biggest *missing* feature is not the widget — it's a share surface.** Neko Atsume's camera/album is a documented engagement channel; Nintendo kept investing in ACNH's photo mode *post-launch* because the screenshot is the distribution channel. Rooted is a beautiful pixel-art garden with **no way to show it to anyone**. Highest ROI-to-effort gap in the entire analysis.

3. **A pause/vacation mode is table stakes, not a perk.** Viridi ships it, Habitica ships it, Finch pauses streaks without penalty, and Viridi's mobile users (who don't have it) are actively begging for it. Any decay app without a pause button is incomplete.

4. **The "notifications annoy people" assumption is wrong, and we have receipts.** 100 verbatim Fabriq App Store reviews contain **zero** complaints about notification volume. Users call them "nag notifications" *as a compliment* — "the reminders kick my butt." What users revolt against is narrower and more specific (§4). Our per-friend `contact_frequency` is the single most-validated design decision already in the app.

5. **The 10-plant free cap is the wrong gate.** Fabriq shipped a 50-contact cap, drew sustained complaints, and **walked it back to 150**. Finch's tolerated paywall gates *cosmetics*, never the care loop. A friend cap gates the core loop — it is structurally the resented kind of gate, and 10 is far below category norms.

---

## 1. MUST BUILD — table stakes

These appear across nearly every comparable. Their absence makes the app read as broken or unfinished.

### 1.1 A home-screen / lock-screen widget
**Evidence:** Locket is a widget-first app at 4.8★ across ~533K ratings — the widget *is* the product surface, not a companion to it. noteit: 4.8★, ~98K ratings, same pattern. Widgetable's entire retention and viral loop is lock-screen presence; the wilting pet on the lock screen *is* the notification. A peer-reviewed study of Neko Atsume players ([Computers in Human Behavior](https://www.sciencedirect.com/science/article/abs/pii/S1071581918305251)) identifies **checking frequency** as a core engagement dimension — short, frequent, glanceable visits are the retention primitive in this exact genre.

**"Done" means:** a garden-health / thirstiest-plant widget that renders in **full color** (noteit users complain their widgets render in tint colors only, ruining the artwork — for a pixel-art app this is fatal), refreshes without requiring an app open (Widgetable's top widget complaint is precisely that it doesn't), and never renders blank or black (both Widgetable and Locket have documented black/blank-widget review clusters).

⚠️ **Open risk:** I did not verify WidgetKit's actual refresh budget. Before committing to "the widget shows live hydration," confirm what iOS permits — timeline refreshes are rationed, and a widget that shows stale hydration is a *worse* experience than no widget. This is the one engineering unknown that could invalidate the design.

### 1.2 A pause / vacation / greenhouse mode
**Evidence:** Viridi ships **Vacation Mode** — "suspends all activity that would normally happen while you are away, as if time itself were frozen," auto-deactivating on return ([Viridi Wiki](https://viridi.fandom.com/wiki/Growing)). Habitica ships "Rest in the Inn" (no HP loss, no streak loss). Finch lets users pause streaks without penalty. Habitify markets an "Off Mode" that pauses habits "during vacations, trips, or other breaks" with "streaks preserved." Viridi *mobile* users, lacking it, have a standing thread demanding it.

**"Done" means:** decay freezes entirely, with an **unmistakable persistent UI state**. Habitica's Inn is the cautionary tale: users "thought they were Resting in the Inn but took damage… and found they were no longer resting" ([GitHub #9558](https://github.com/HabitRPG/habitica/issues/9558), [#5948](https://github.com/HabitRPG/habitica/issues/5948)). **A pause mode that silently disengages is worse than having none** — it converts a safety feature into a betrayal.

### 1.3 Reliable, state-aware, granularly-controllable notifications
**Evidence:** See §4 — the nuance here is the opposite of what you'd assume, and it matters enough to have its own section.

**"Done" means:** (a) never fire a "your plant is thirsty" nudge for a friend the user already contacted since the nudge was scheduled — noteit's loudest complaint is *"if I have already sent a new drawing that day, why should I get another notification warning me that my streak is about to end?"*; (b) per-category opt-out from day one (hydration / streak / social / product). Both Fabriq's email-spam complaint and Widgetable's location-notification complaint reduce to the same defect: **no way to turn off one class without turning off all**; (c) prefer **one morning digest** ("3 plants need water") over N separate wilt pushes.

⚠️ **iOS structurally fights time-critical loss states.** Scheduled Summary batches low-priority notifications into a digest at a time *the user* picks; Focus delays delivery entirely. If a "your plant is dying" push lands in a 6pm summary nine hours late, **the death was unavoidable from the user's side.** Any death timer short enough to be missed this way is a support nightmare and arguably an App Store 4.5.4 risk ("Push Notifications must not be required for the app to function"). *(That last reading is inference, not an Apple ruling.)*

### 1.4 Reliability and offline tolerance
**Evidence:** This is the #1 destroyer of trust in care apps. Widgetable: care actions "consume items without crediting the pet" on flaky connections. Fabriq's 1★ reviews are almost entirely auth failure, data loss, and dev abandonment — *"every time i log an interaction in it, when i open the app again that interaction hasn't been logged."* In a care game, a lost care action feels like theft.

**"Done" means:** logging a contact **never fails silently**. Queue it offline, reconcile later. Given `FriendsContext`/`GardenContext` are currently pure in-memory state that loses everything on reload, this is not a polish item — it is the foundation.

### 1.5 Low-friction contact import and one-tap logging
**Evidence:** UpHabit's reviews show the value only lands *after* a heavy setup step — the cold-start problem in another form. Users tolerate manual logging **only when the log action is one tap** and immediately visible in the reward loop. Cozy-design literature calls this a "safe ritual": low mental cost, repeated ([Lostgarden](https://lostgarden.com/2018/01/24/cozy-games/)).

### 1.6 Per-friend contact cadence
✅ **Already built.** `contact_frequency` per friend is the single most-validated design decision in Rooted. Fabriq's most-requested feature, verbatim: *"Different connection reminder timers, like I want to text my friend every week, but only hang out every other week."* Praise language: "Consistent and **customizable** reminders." Don't regress it.

### 1.7 A pre-seeded first session (the cold-start answer)
**Evidence:** Finch's onboarding is a *hook, not a form* — hatch an egg, pick a color, name the bird, choose a personality trait — and then **auto-populates several easy goals** so the user taps a few things and hits the "aha" of earning energy within the first session ([Finch New User Guide](https://help.finchcare.com/hc/en-us/articles/42149821015693-New-User-Guide), [teardown](https://www.retention.blog/p/life-of-a-birb)). Neko Atsume's yard starts nearly empty but the **first cat arrives within minutes** of placing the starter item — a quick win before the player has invested anything.

The anti-pattern: BeReal's empty state told a friendless new user *"my friends haven't posted their BeReal yet"* — misinforming them instead of prompting them to add anyone — and fired its contacts permission prompt *before* showing any value ([teardown](https://tearthemdown.substack.com/p/bereal-product-case-study)).

**"Done" means:** never show a genuinely empty grid on first open. Onboarding plants the first friend, and the first watering happens inside onboarding. *(Note: the `TEMP-TEST-PLANT` seed currently in `GardenContext` is accidentally the right shape of idea with the wrong execution — replace it with a real onboarding-planted first friend rather than deleting the concept outright.)*

### 1.8 Deferred deep links on the invite path
**Evidence:** Locket's own help center instructs users whose invite link didn't work to *"make sure you've already downloaded Locket… once it's installed, go back and tap the invite link again"* — i.e. **a cold install loses the invite context entirely.** That is a self-inflicted funnel leak, and it is trivially avoidable. Build the invite link to survive the App Store round-trip from day one.

---

## 2. SHOULD BUILD — power features, ranked by demand evidence × differentiation

### 2.1 A share/screenshot surface for the garden ⭐ highest ROI
Neko Atsume ships albums and save-to-wallpaper; a designer breakdown calls the in-game camera "a smart move by the developer to encourage people to share their cute cat photos with their friends." The Neko Atsume engagement study names **social-media sociability** (screenshot sharing) as a distinct engagement dimension. ACNH's photo mode got *more* investment post-launch (2.0 added villager posing and costuming), and the game "translates much better to a social media feed" — it drove a 71% rise in Twitter gaming conversation.

Widgetable's entire zero-CAC growth was organic TikTok. **Rooted's isometric pixel garden is its best marketing asset and currently cannot leave the phone.** Cheap to build, compounding returns.

### 2.2 Async, read-only garden visiting
**The architecture is settled — copy ACNH's Dream Suite.** Upload a read-only *snapshot*; visitors tour a copy; nothing can be taken, trampled, or griefed. Discovery is a shareable **code**, not a friend-graph requirement. Bell Tree's long-running Dream Address thread shows that once a share-a-snapshot primitive exists, **users build the discovery layer themselves**. Neko Atsume 2 (Oct 2024) independently arrived at the same conclusion — its headline new feature is "invite friends to your backyard or visit theirs."

⚠️ **But keep it async and zero-obligation.** Pocket Camp *removed* physical garden visiting (Feb 2019, replaced by a Friends-menu flow), and Pocket Camp Complete shipped with **no visiting at all** — and Nintendo still charged $10–20 for it. Synchronous "go tend my friend's garden" is friction that gets designed away. Async snapshot visiting is the version that survives.

### 2.3 A second-order collectible (use the `artifacts` tables you already have)
Two-layer collections outlast one-layer ones. Neko Atsume: cats (layer 1) → **mementos** with random drop rates and micro-lore (layer 2) — "it is random how many times a cat has to visit before they leave a memento," which is what keeps completionists returning. Rooted has evolution stages (layer 1) and **nothing above them**. The `artifacts` / `artifact_templates` tables in the schema are exactly the right shape for this: a keepsake that only drops after N real hangouts with a specific friend. That is a collectible no competitor can copy, because it requires the real relationship.

### 2.4 Make decoration *instrumental*, not cosmetic
Neko Atsume's items are the mechanism that summons specific rare cats — **arrangement is a strategy, not a paint job**. Rooted's decorations currently do nothing. A decoration that changes which plant variants you can grow converts the decoration store from a cosmetic dump into a puzzle — and it's the tolerated spend sink (Forest "created a whole store just to buy different kinds of trees… no one wants just one kind of tree"). Note Forest gates species behind **focus milestones**, not just money — earned variety converts better than bought variety.

### 2.5 A retrospective stats / friendship-history surface
Finch's most-requested missing features are **retrospective stats**: a dedicated streaks page, completion statistics, 30-day historical trend analysis. Finch is also criticized for shallow tracking — "no calendar heatmap, minimal streak analytics." Forest's cumulative visual ledger is a documented retention mechanic: "the more trees in the forest, the more productive hours."

For Rooted, the garden itself should **legibly encode months of maintained friendship**, not just current state — and a "you contacted 12 friends this month, up from 7" surface is both the retention hook and the outcomes story that gives us the mental-health narrative Widgetable can never touch.

### 2.6 Reciprocal plants / two-player pairing
Every platform-scale validator (Snap Streaks, TikTok Streak Pet, Duolingo Friend Streak) is **mutual**. Duolingo measured +22% daily-lesson completion for users with a friend streak. Rooted's loop today is single-player. Finch's social layer is deliberately minimal — friend codes plus "hug requests"/"Vibes," no chat feed — and reviewers value it.

> **Load-bearing insight: Rooted is structurally Finch, not Locket.** Locket, noteit, and BeReal have *near-zero single-player value* — the widget is empty until someone accepts, so they must force the invite into onboarding. **Rooted does not have this problem.** A garden where you tend plants representing friends is fully playable with zero other users installed: **your friend doesn't need an account for you to log that you called them.** That is a structural advantage over every ambient-presence competitor, and it means reciprocity should be an *upgrade*, never a gate.

**Prefer per-friend invite codes/links to an address-book scrape.** iOS 18 added a "Select Contacts" option to the permission prompt, and the contact-sharing collapse was real — per Nikita Bier (relayed via NYT), the number of users sharing ≤10 contacts rose by as much as **25%** ([9to5Mac](https://9to5mac.com/2024/10/02/this-ios-18-privacy-change-could-spell-doom-for-new-social-apps/)). Bulk-contacts invite flows are a depreciating asset; Finch (friend code), noteit (link code), and Widgetable (friend code) are structurally immune. Rooted's invite is intrinsically personal anyway — *"Sarah, you're a monstera in my garden"* — and personalized invites convert materially better than generic ones.

⚠️ **Also expect low invite volume if we skew adult:** invitations sent per user drop ~20% for every year of age from 13 to 18 ([Bier, via Lenny's Newsletter](https://www.lennysnewsletter.com/p/how-to-consistently-go-viral-nikita-bier)). Don't model Rooted's virality on the Locket/Lapse teen cohort.

⚠️ **But a thin social layer is worse than none.** Tamagotchi Uni marketed the "Tamaverse" as its headline innovation and shipped a social budget of **"send just one Heart per day"** — Engadget: "hasn't really delivered… not adding much substance." Pocket Camp's "Kudos" is so hollow the wiki says it "seems to do nothing in particular for either party." **A "wave at your friend's garden" button would be exactly this mistake.** Build reciprocity properly or don't ship it.

### 2.7 Inventory / storage / bulk-operation QoL
The top requests in *every* decoration sim are boring: bulk crafting, more storage, quantity selection, a greenhouse to store what you're not displaying, the ability to move things. **The friction of managing a collection, not the collection itself.** Rooted hits this the moment a user has 20+ plants and a decoration inventory. Cheap to build early, miserable to retrofit.

---

## 3. DO NOT BUILD — anti-features, with the evidence

### 3.1 ❌ Plant death — and *especially* not a paid revive

This is the headline finding. The evidence is not ambiguous.

| App | Death model | Outcome |
|---|---|---|
| **Plant Nanny 1** | Plant dies, start over | Users found it "sad and discouraging" → **death REMOVED in v2**; plants now only wilt |
| **Plant Nanny 2** | Wilt only, never dies | Motivation fully intact: *"I do not want the plant to die, I do not want to die, so I drink water"* |
| **Viridi** | Permanent death, no revive, **must buy replacements** | *"it seemed unreasonable to me that a game like this wouldn't have some sort of reset or restart feature"* → quit |
| **Habitica** | Lose level, XP, gold, equipment | Contested since 2013: **"dying makes you want to quit all together"**; ships an official *undo* button |
| **Pou** | Starves to death; health potions sold as IAP | Parents report kids "frantically turn on the game to hurry and feed it" |
| **Forest** | Tree dies if you abandon a session | Guilt is explicitly the product — and spawned an entire alternatives market for *"apps like Forest that help you focus without guilt-tripping you with a dead tree"* |
| **Finch, Neko Atsume, Tsuki's Odyssey** | **No death, no penalty** | The retention leaders in their categories |

**The lines users actually draw:**

- **Reversible ≠ cruel. Irreversible = cruel.** Every death system that draws sustained anger is one where the loss cannot be undone by effort.
- **Death caused by *trying to care* is the most enraging of all.** Viridi's angriest threads are about overwatering: *"I can kill them with one spritz just because I was hoping to tide them over."* ⚠️ Direct warning: any Rooted mechanic where logging contact *wrongly* (double-logging, wrong type) damages the plant will be experienced as betrayal.
- **Monetizing the recovery is the reputational trap.** Viridi's "you have to buy new plants" and Pou's health potions are the two places where death→paywall exists, and both are the worst-received parts of those products. **Rooted's plant death + $0.99 premium revive is structurally identical** — on top of a real human relationship, in a mental-health-framed app.
- **Our stakes are higher than any precedent here.** In every app above, the killed entity is a blob, a bird, a succulent, a tree. **There is no app in this competitive set where the dead thing represents a named real person.** Rooted's death is the most emotionally loaded version of a mechanic that is *already contested everywhere it exists*.

Note also that Forest is **weak precedent** even though it's the one people cite: its tree dies from a single 25-minute session *you chose to abandon* — bounded, self-inflicted, instantly resettable. Rooted's death is slow, ambient, tied to a human being, and permanent. Not the same mechanic.

**Recommendation:** keep **wilt** — it demonstrably carries the entire motivational load. Cut death, or make it fully reversible by effort (reconnect → the plant recovers) and never, ever chargeable. The pricing doc's own rule already says it: *never place money between a user and a living plant.* The evidence says go further: don't kill the plant at all.

Also cut the **dead-plant-persists-in-the-garden** idea if it exists: Forest's dead tree "remains in your forest, a constant reminder of the time you failed," and it's a documented churn driver. A permanent monument to failure inside a space the user is supposed to want to decorate is self-defeating.

### 3.2 ❌ A streak that can be satisfied by a hollow action
Snapchat streaks are the canonical failure: users send **blank snaps** purely to preserve the number; ~70% of middle schoolers report feeling "obligated" to maintain streaks with people **they don't even like**; "streaksitters" get handed account credentials so the number survives a vacation. Peer-reviewed work links streaks to stress and FOMO ([ScienceDirect](https://www.sciencedirect.com/science/article/pii/S2772503023000476)). Duolingo's version: *"I was logging in at midnight on New Year's Eve just to keep the streak. I hadn't actually studied anything in two weeks."*

**The mechanic must never make a zero-content action the optimal play.** If a one-word "hey" fully hydrates a plant, we've built Snapchat streaks with extra steps and the plant stops meaning anything. Our call-vs-text weighting (+40/+20) is the right instinct; push further toward rewarding *conversation* over *ping*.

### 3.3 ❌ Guilt-tripping notification copy
Duolingo's passive-aggressive push copy is deliberate and internally celebrated (their Head of Product calls it a "'passive-aggressive' reminder" and one of their most successful). **It does not transfer.** Duolingo gets away with "You made Duo sad" because the stakes are a cartoon owl and a self-directed goal. Rooted's equivalent — *"your friendship with Sarah is dying"* — implicates a real human being. The guilt is not fictional, and the meme-immunity does not come with it.

**Spec:** no personified reproach, no loss countdowns, no "you're letting X down." Say "reconnect with Sarah," never "pay to fix it."

### 3.4 ❌ Ads anywhere near the care loop
Widgetable's #1 complaint by volume: *"every time you open an app, AD. If you want some more food for your pet??? AD"* — a ~100-second rewarded ad yields a single food item. Users believe pets are *deliberately* made to crave food you don't have. Whether or not that's true, **users perceiving manipulation in a care mechanic converts affection into resentment.** Locket, by contrast, confines ads to the history section and users specifically *praise* the restraint. "No ads, ever" is a free brand weapon against our closest competitor.

### 3.5 ❌ The 10-plant free cap (as currently specced)
Fabriq shipped a **50**-contact cap, drew sustained review complaints, and raised it to **150**. Finch's tolerated paywall gates *cosmetics only* — reviewers repeatedly note premium "isn't needed for the app's main benefit." A friend cap gates the **core loop**, which is structurally the resented gate type.

**The honest counter-case:** Locket caps free users at **20** friends, frames it as deliberate intimacy ("built only for your closest friends"), and now **monetizes removing it** — so a cap *can* work as a gate when it's framed as a feature and set at a genuinely social number. But note that even Locket's is double ours.

**10 is too low.** Gate cosmetics, plant variety, themes, and capacity *far* above what a normal user needs — the pricing doc's own instinct ("the free cap must sit above what a normal user needs, or the app feels broken rather than generous") is right, and 10 violates it. If we keep a cap at all, 20–25 is the defensible floor, and it must be framed as intimacy rather than scarcity.

### 3.8 ❌ A forced-invite gate ("invite N friends to unlock")
**Lapse is the definitive case study.** It required inviting **five friends** before unlocking the app. It worked, mechanically: #118 → **#1 on the US App Store**, ~1.2M installs, 8,000 → 210,000 downloads/day in a month. Then it fell **~70% off its peak**, and the company **removed the mandatory invite itself**, accepting the ranking damage. The reputational cost was immediate and quotable — VC Sheel Mohnot: *"It got to the top of the App Store on a pyramid scheme… I felt dirty."* ([TechCrunch, Sep 2023](https://techcrunch.com/2023/09/26/photo-sharing-app-lapse-hits-top-of-the-app-store-by-forcing-you-to-invite-your-friends/); [Nov 2023](https://techcrunch.com/2023/11/27/lapse-a-photo-app-that-forced-users-to-invite-friends-is-running-out-of-steam/))

For an app whose brand is *caring about your friends*, spamming those same friends to unlock the product is the single most on-the-nose way to poison it. **Move the invite ask to first-value, not signup** — referral research puts the willingness window at 48–72h after activation, and Rooted has real single-player value to deliver first (§2.6).

### 3.6 ❌ Rate-limiting the garden ("come back tomorrow")
Cozy Grove hard-gates ~20 min/day and the backlash is loud and specific — *"I have mobile game vibes,"* "robs players of autonomy" — **even though there is no monetization behind it.** Users pattern-match any "come back tomorrow" gate to predatory design regardless of intent.

### 3.7 ❌ Thin social gestures, all-or-nothing co-op, global leaderboards
The "advertised but dead" hall of fame: Tamagotchi's Tamaverse (one Heart per day), Pocket Camp's Kudos (does nothing), Forest's global leaderboard (*"really hard to get and stay in the top 100, and people may be setting their alarms overnight"*), and Forest's Plant Together — whose all-or-nothing group punishment ("if one person gives up, everyone's tree dies") is exactly the coercive reciprocity cozy-design literature warns against.

---

## 4. The notification finding — and a corrected assumption

**The premise that "friendship-reminder apps suffer notification backlash" is refuted.** A read of **100 verbatim US App Store reviews for Fabriq** (via Apple's review RSS feed, most-recent sort) found **zero complaints about push notification volume**. The reminders are the single most-praised feature:

- *"**Nag notifications** for iOS, reminding those of us who are awful at 'initiating' to check in with the people we love most… Dead simple. Love it."* (5★ — a user calling them "nag notifications" **as a compliment**)
- *"The Fabriq reminders **kick my butt** and when I jump in and text my wife and kids somehow forgive me and it makes a huge difference."* (5★)
- *"I am anxious & introverted and tend to struggle to push myself to reach out to others… this app has really helped me… gives me **gentle encouragement** to connect."* (5★)

The only notification complaint in the corpus is the **opposite** one: notifications not firing. The single "spammy" review is about *marketing email* with a broken per-list unsubscribe — not push.

**So the real line is narrower and more actionable than "don't nag."** People accept nudges they configured, about a person they chose, at a cadence they set. They revolt against:
1. **loss states they can't escape** (noteit renders "streak lost 💔" *persistently in the widget* — *"I can't even look at my partner's doodles without being reminded of it"*),
2. **notifications that fire when they already complied**,
3. **an all-or-nothing off switch**,
4. **punishment with no pause**.

*Caveat: US App Store only, most-recent sort, 100 of an unknown total; Google Play review text is JS-gated and Reddit was unreachable. A backlash confined to Android is not excluded, but it would be an odd shape.*

---

## 5. The open question this research could not close

**Can iOS actually auto-detect contact with a specific person?** Our own `real-contact-apps-research.md` concluded auto-detection is *existential* — the line between Snapchat Streaks and the friendship-app graveyard is whether the system counts the interaction or makes the user log it. This research did not close it, and **it should be closed before the roadmap is finalized.**

What we do know:
- **Dex — the incumbent with the most automation — solves iMessage/SMS detection with a macOS desktop agent** that reads the local iMessage database and syncs hourly. It is *still in beta*. There is no pure-iOS path in their product.
- Clay/Mesh ingests email, calendar, LinkedIn, iMessage — and a competitor-authored comparison notes users may find that depth of access **"too invasive."** That's the privacy ceiling: the more you automate, the more permissions you demand, and the trade shows up in sentiment.
- **Fabriq — the closest functional competitor — ships no auto-detection at all.** Manual logging is the accepted category baseline, and its users still love it (§4).

That last point is genuinely reassuring and worth sitting with: **manual logging is not automatically fatal.** The graveyard apps died from being *todo lists about people*, not purely from logging friction. But the lowest-friction legal path to "the app counted my contact for me" on iOS is still unmapped, and the answer determines whether Rooted's core loop is delightful or tedious.

**Recommendation:** one focused engineering spike on CallKit/CXCallObserver, App Intents/Shortcuts "call ended" automations, and share-sheet logging — grounded in Apple's docs, not blog speculation — before committing the roadmap.

---

## 6. What this means, in one paragraph

Rooted's differentiation is real and defensible: a *network* view of your friendships (not Widgetable's dyadic toys), growth driven by *real contact* (not in-app feeding), with meaning competitors can't copy without breaking their own economies. But the evidence says we are about to build the one mechanic — a dead plant with a name attached, revivable for $0.99 — that **every comparable in the category either removed, walked back, or is still fighting with its own users about**. Cut the death, keep the wilt, ship the widget and the share button, put a pause button in from day one, and raise the free cap. The garden is the product; the guilt was never the point.

---

## Sources

**Primary — advertised features & store listings:** [Fabriq](https://apps.apple.com/us/app/fabriq-stay-in-touch/id1460143202) · [Widgetable](https://apps.apple.com/us/app/widgetable-besties-couples/id1641107226) · [Locket](https://apps.apple.com/us/app/locket-widget/id1600525061) · [noteit](https://apps.apple.com/us/app/noteit-bff-widget/id1570369625) · [Finch](https://apps.apple.com/us/app/finch-self-care-pet/id1528595748) · [Neko Atsume](https://apps.apple.com/us/app/neko-atsume-kitty-collector/id923917775) · [Pou](https://apps.apple.com/us/app/pou/id575154654) · [Forest](https://apps.apple.com/us/app/forest-focus-for-productivity/id866450515) · [Viridi (Steam)](https://store.steampowered.com/app/375950/Viridi/) · [Tsuki's Odyssey](https://apps.apple.com/us/app/tsukis-odyssey/id1564146071) · [Tamagotchi Uni](https://tamagotchi-official.com/us/news/02_86/) · [Plant Nanny 2](https://play.google.com/store/apps/details?id=com.fourdesire.plantnanny2)

**Verbatim user reviews:** Apple review RSS feeds for [Fabriq](https://itunes.apple.com/us/rss/customerreviews/id=1460143202/sortBy=mostRecent/json) (100 reviews, 2 pages), [noteit](https://itunes.apple.com/us/rss/customerreviews/id=1570369625/sortBy=mostRecent/json), [Widgetable](https://itunes.apple.com/us/rss/customerreviews/id=1641107226/sortBy=mostRecent/json), Finch (50 reviews)

**Death / decay / guilt:** [Viridi devs on why plants die](https://icewatergames.tumblr.com/post/151020321184/why-did-you-choose-having-plant-death-in-viridi) · [Viridi — no restart, must buy new plants](https://steamcommunity.com/app/375950/discussions/0/451851477874848290/) · [Viridi — overwatering kills](https://steamcommunity.com/app/375950/discussions/0/517141807565783572) · [Habitica #223 "dying makes you want to quit"](https://github.com/HabitRPG/habitica/issues/223) · [Habitica — Rest in the Inn silently fails](https://github.com/HabitRPG/habitica/issues/9558) · [Plant Nanny death removal](https://www.hilltopviewsonline.com/17554/uncategorized/plant-nanny-app-reminds-users-to-hydrate-regularly-keep-plants-alive/) · [Plant Nanny v1 churn](https://planthumor.com/2017/08/18/app-review-plant-nanny-challenges-your-botanical-knowledge-and-bladder-capacity/) · [Forest guilt as churn driver](https://calmevo.com/is-forest-app-worth-it/) · [Snapchat streaks, FOMO & problematic use (peer-reviewed)](https://www.sciencedirect.com/science/article/pii/S2772503023000476) · [Snapchat streaks & social anxiety](https://screenwiseapp.com/guides/snapchat-streaks-and-social-anxiety) · [Why people quit Duolingo](https://my-senpai.com/insights/why-people-quit-duolingo.html) · [Cozy Games — Lostgarden](https://lostgarden.com/2018/01/24/cozy-games/) · [If you use software to be a better friend, have you failed?](https://medium.com/chris-messina/if-you-use-software-to-help-you-be-a-better-friend-have-you-failed-90e3412d7b1c)

**Retention, decoration & social:** [Neko Atsume design breakdown](https://alexiamandeville.medium.com/game-design-breakdown-the-simplicity-of-neko-atsume-a8616a937a47) · [Neko Atsume engagement study (peer-reviewed)](https://www.sciencedirect.com/science/article/abs/pii/S1071581918305251) · [Neko Atsume 2 — friend visiting](https://www.pocketgamer.com/neko-atsume-2/new-details-revealed/) · [ACNH Dream Suite](https://game8.co/games/Animal-Crossing-New-Horizons/archives/292286) · [Bell Tree Dream Address thread](https://www.belltreeforums.com/threads/the-dream-address-thread.564423/) · [ACNH burnout](https://www.belltreeforums.com/threads/some-thoughts-about-acnhs-reception.638867/) · [Pocket Camp Complete — no social layer](https://www.macrumors.com/2024/12/02/animal-crossing-pocket-camp-complete/) · [Tamagotchi Uni — Tamaverse "hasn't delivered"](https://www.engadget.com/tamagotchi-uni-finally-feels-complete-after-its-biggest-update-yet-140041168.html) · [Cozy Grove time-gating backlash](https://steamcommunity.com/app/1458100/discussions/0/3172198151251844943/) · [Forest teardown](https://medium.com/@heiko.damaske_86475/how-did-the-forest-app-do-it-673a5976f7b)

**Invite flows & cold start:** [Lapse's forced-invite gate → #1](https://techcrunch.com/2023/09/26/photo-sharing-app-lapse-hits-top-of-the-app-store-by-forcing-you-to-invite-your-friends/) · [Lapse's 70% collapse and self-removal of the gate](https://techcrunch.com/2023/11/27/lapse-a-photo-app-that-forced-users-to-invite-friends-is-running-out-of-steam/) · [Finch onboarding — auto-populated first goals](https://help.finchcare.com/hc/en-us/articles/42149821015693-New-User-Guide) · [Finch "life of a birb" teardown](https://www.retention.blog/p/life-of-a-birb) · [BeReal product teardown (empty-state anti-pattern)](https://tearthemdown.substack.com/p/bereal-product-case-study) · [Locket — invite links don't survive a cold install](https://help.locketcamera.com/en/articles/5859741-issues-adding-friends) · [Locket's 20-friend cap](https://screenrant.com/locket-widget-app-add-friends-how/) · [iOS 18 limited contacts access](https://techcrunch.com/2024/06/12/ios-18-cracks-down-on-apps-asking-for-full-address-book-access/) · [Contact-sharing collapse post-iOS 18](https://9to5mac.com/2024/10/02/this-ios-18-privacy-change-could-spell-doom-for-new-social-apps/) · [Nikita Bier on social-app growth](https://www.lennysnewsletter.com/p/how-to-consistently-go-viral-nikita-bier)

**Contact detection:** [Dex iMessage integration (macOS agent, beta)](https://getdex.com/integrations/imessage/) · [Dex vs Clay](https://getdex.com/blog/dex-vs-clay/)

**Notifications:** [Apple App Store Review Guidelines 4.5.4](https://developer.apple.com/app-store/review/guidelines/) · [iOS Scheduled Summary](https://support.apple.com/guide/iphone/summarize-notifications-reduce-interruptions-iph1fbe7d2b9/ios) · [Duolingo's "passive-aggressive" push strategy](https://solve-marketing.agency/blog/en/ads-cases/duolingo-en/) · [Habitify Off Mode](https://intercom.help/habitify-app/en/articles/6178415-off-mode-put-your-habits-on-pause)

**Known gaps and confidence caveats:**
- **Reddit was unreachable to every crawler used** — r/cozygames, r/habitica, r/AnimalCrossing and friendship-app burnout threads remain unmined. Google Play review text is JS-gated. This is a real hole in "user-communicated demand."
- **WidgetKit refresh limits and iOS contact-detection feasibility (§5) are unverified** and were explicitly descoped. Close §5 before finalizing the roadmap.
- **Conversion percentages from Branch / GrowSurf / Cello are vendor-published marketing** with no independent replication — directional only, do not put them in a deck as research. The same applies to the notification-fatigue percentages (32% uninstall, 46% disable).
- The **25% contact-sharing drop** post-iOS 18 is a single-source, un-audited claim by Nikita Bier relayed through NYT. Best number available, still thin.
- Locket's and Widgetable's onboarding screens were **not verified first-hand** (fetches blocked); those details are secondhand via ScreenRant/9to5Mac.
