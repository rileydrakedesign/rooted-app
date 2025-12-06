# Font Setup Instructions

The Rooted app uses three Google Fonts for all typography - **all fonts are already installed and configured!** ✅

## Current Font Configuration

### 1. **VT323** (Pixel Font) ✅
- **Usage:** Buttons and text input fields
- **Source:** Google Fonts (@expo-google-fonts/vt323)
- **Status:** ✅ Installed and configured
- **Why:** Provides authentic pixel art aesthetic for interactive elements

### 2. **Rubik Bold** (Heading Font) ✅
- **Usage:** Screen titles and main headings
- **Source:** Google Fonts (@expo-google-fonts/rubik)
- **Status:** ✅ Installed and configured
- **Why:** Free alternative to Realtime Rounded Bold with similar rounded, friendly characteristics

### 3. **Nunito Bold** (Subtext Font) ✅
- **Usage:** Subtitles, body text, labels
- **Source:** Google Fonts (@expo-google-fonts/nunito)
- **Status:** ✅ Installed and configured
- **Why:** Free alternative to Corporative Sans Round with excellent readability and warmth

## No Installation Required! ✅

All fonts are already installed via npm and automatically loaded when the app starts. No manual file downloads or configuration needed.

### Installed Packages:
```bash
@expo-google-fonts/vt323    # Pixel font
@expo-google-fonts/rubik     # Heading font
@expo-google-fonts/nunito    # Subtext font
```

### How It Works:

The app automatically loads fonts on startup in `App.tsx`:

```typescript
import { VT323_400Regular } from '@expo-google-fonts/vt323';
import { Rubik_700Bold } from '@expo-google-fonts/rubik';
import { Nunito_700Bold } from '@expo-google-fonts/nunito';

await Font.loadAsync({
  VT323_400Regular,
  Rubik_700Bold,
  Nunito_700Bold,
});
```

Font constants are defined in `src/constants/fonts.ts`:

```typescript
export const Fonts = {
  heading: 'Rubik_700Bold',
  subtext: 'Nunito_700Bold',
  pixel: 'VT323_400Regular',
};
```

## Current Status

✅ **VT323** (Pixel font) - Fully configured and operational
✅ **Rubik Bold** (Heading font) - Fully configured and operational
✅ **Nunito Bold** (Subtext font) - Fully configured and operational

**All fonts are ready to use!**

## Testing Fonts

To verify fonts are loaded correctly:

1. Run the app: `npm start`
2. Navigate through the onboarding screens
3. Check that:
   - **Headings** appear in Rubik Bold (rounded, friendly appearance)
   - **Body text** appears in Nunito Bold (clean, readable appearance)
   - **Buttons and inputs** appear in VT323 pixel font (retro, pixelated appearance)

## Troubleshooting

**Problem:** "Font 'Rubik_700Bold' is not loaded" or similar error

**Solution:**
1. Ensure all packages are installed: `npm install`
2. Clear Expo cache: `npm start -- --clear`
3. Restart the development server

**Problem:** Fonts not appearing or showing system defaults

**Solution:**
1. Check the console for font loading errors
2. Verify the app shows the loading screen briefly (fonts loading)
3. Try restarting the app completely
4. Clear cache and reinstall: `rm -rf node_modules && npm install && npm start -- --clear`

**Problem:** App stuck on loading screen

**Solution:**
1. Check console for errors
2. The font loading is wrapped in try-catch, so this is unlikely
3. If it persists, there may be another issue - check all recent changes

## Font Characteristics

### Rubik Bold
- Rounded sans-serif with friendly character
- Excellent for headings and titles
- Slightly condensed letterforms
- Modern and approachable

### Nunito Bold
- Soft, rounded terminals
- Highly readable at all sizes
- Balanced and warm
- Perfect for body text and UI labels

### VT323
- Authentic pixel/bitmap font
- Monospace character
- Retro 8-bit aesthetic
- Ideal for buttons and interactive elements

## Switching to Premium Fonts (Future)

If you later acquire the premium fonts:

1. Place font files in `assets/fonts/`
2. Update `App.tsx` to require the font files
3. Update `src/constants/fonts.ts` with new font names
4. Restart the development server

The Google Fonts provide excellent quality and are production-ready for the MVP.
