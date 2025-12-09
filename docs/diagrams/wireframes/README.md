# Wireframe Screen Exports

This folder contains individual screen exports from the main wireframe file.

## 📤 How to Export Individual Screens

### From Excalidraw.com:

1. **Open** `../wireframe-garden-ui.excalidraw` in https://excalidraw.com
2. **Select** the screen you want to export (click and drag around it)
3. **Export:**
   - File → Export Image → PNG
   - **Uncheck** "Background"
   - **Check** "Only selected"
4. **Save** with naming convention: `screen-{n}-{name}.png`

### Naming Convention:
```
screen-1-garden-view.png
screen-2-plant-info-panel.png
screen-3-add-friend-contact.png
screen-4-add-friend-plant.png
screen-5-friends-list.png
screen-6-settings.png
screen-7-navigation-drawer.png
screen-8-edit-mode.png
```

## 📋 Screen Locations in Main Wireframe

The screens are laid out in the wireframe as follows:

**Row 1 (y: 40-912):**
- Screen 1: Garden View (x: 40-475)
- Screen 2: Plant Info Panel (x: 600-1035)

**Row 2 (y: 1000-1872):**
- Screen 3: Add Friend Contact (x: 40-475)
- Screen 4: Choose Plant (x: 600-1035)

**Row 3 (y: 2000-2872):**
- Screen 5: Friends List (x: 40-475)
- Screen 6: Settings (x: 600-1035)

**Row 4 (y: 3000-3872):**
- Screen 7: Navigation Drawer (x: 40-475)
- Screen 8: Edit Mode (x: 600-1035)

## 💡 Usage with Claude

Once exported, reference individual screens in prompts:

```
"Implement the Garden View screen based on @screen-1-garden-view.png"
```

Claude can read PNG images and understand the layout visually!

---

**Alternative: Export Full Wireframe**

If you prefer one large reference image:
1. Select All (Ctrl/Cmd + A)
2. Export → PNG
3. Save as: `../wireframe-garden-ui.png`
