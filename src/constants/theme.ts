// Theme constants for Rooted app
// Based on MVP Theme: Cozy Greenhouse (from garden-ui-navigation-analysis.md)

export const Colors = {
  // Primary Colors
  forestGreen: '#2D5016',      // Headers, accents
  sageGreen: '#8BA888',        // Healthy plants, UI highlights
  warmBeige: '#F4EDD3',        // Floor tiles, panel backgrounds
  warmWood: '#8B5A3C',         // Greenhouse frame, furniture
  terracotta: '#C74E3A',       // Call-to-action buttons, urgency

  // Status Colors
  hydrationHigh: '#4CAF50',    // Green (60-100%)
  hydrationMedium: '#FFC107',  // Yellow (20-59%)
  hydrationLow: '#F44336',     // Red (0-19%)
  streakGold: '#FFD700',       // Celebration

  // UI Grays
  textPrimary: '#212121',      // Dark text
  textSecondary: '#757575',    // Gray text
  border: '#E0E0E0',           // Borders/dividers

  // Additional UI
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  // Button Colors (from PixelButton)
  buttonPrimary: '#B8916B',    // Tan/brown
  buttonPrimaryLight: '#D4A574', // Lighter edge
  buttonPrimaryDark: '#8B6F47',  // Darker edge

  // Notification
  notificationOrange: '#FF9F66', // Badge background

  // Brown text on beige surfaces
  textBrown: '#6B4423',        // Headings, labels, icons on beige/cream
  textBrownMuted: '#A0826D',   // Secondary text on beige/cream

  // Pixel-card chrome
  pixelBorder: '#8B6F47',      // Chunky card/button border brown
  cream: '#F5E6D3',            // Sheet/panel background
  tanTrack: '#DEB887',         // Progress/hydration bar track
  dividerTan: '#E8C9A0',       // Row dividers inside cards

  // Semantic status
  danger: '#D32F2F',           // Destructive actions (logout)
  success: '#4CAF50',          // = hydrationHigh
  warning: '#FFC107',          // = hydrationMedium

  // Accents
  wheat: '#F5DEB3',            // Light edge on tan option buttons
  saddleBrown: '#8B4513',      // Dark edge / onboarding heading brown
  mintSurface: '#E8F5E9',      // Sprite showcase background

  // Water / hydration reward
  waterBlue: '#4A90D9',        // Watering reward badge, water accents
  waterBlueDark: '#2C5F8A',    // Border/edge for waterBlue surfaces
};

export const Spacing = {
  tiny: 4,
  small: 8,
  medium: 16,
  large: 24,
  xLarge: 32,
};

export const ComponentSizes = {
  buttonHeightSmall: 40,
  buttonHeightLarge: 56,
  inputFieldHeight: 48,
  topBarHeight: 60,
  bottomBarHeight: 80,
  iconSmall: 24,
  iconMedium: 32,
  iconLarge: 48,
};

export const BorderRadius = {
  small: 8,
  medium: 10,
  large: 12,
};
