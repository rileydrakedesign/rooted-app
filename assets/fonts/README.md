# Font Assets

This directory contains the custom fonts used in the Rooted app.

## Required Fonts

Please download and place the following font files in this directory:

1. **Realtime Rounded Bold** (Headings)
   - File: `RealtimeRounded-Bold.ttf` or `RealtimeRounded-Bold.otf`
   - Usage: Screen titles, main headings

2. **Corporative Sans Round Condensed Bold** (Subtext)
   - File: `CorporativeSansRoundCondensed-Bold.ttf` or `CorporativeSansRoundCondensed-Bold.otf`
   - Usage: Subtitles, body text, labels

3. **VT323** (Pixel font - installed via npm)
   - Usage: Buttons, text input fields
   - This is loaded automatically via @expo-google-fonts/vt323

## Font Loading

Fonts are loaded in `App.tsx` using expo-font. The app will display a loading screen until all fonts are ready.
