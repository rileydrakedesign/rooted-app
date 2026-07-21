/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: 'widget',
  name: 'RootedWidget',
  displayName: 'Rooted',
  // Interactive Buttons (App Intents in widgets) need iOS 17.
  deploymentTarget: '17.0',
  bundleIdentifier: '.widget',
  frameworks: ['SwiftUI', 'WidgetKit', 'AppIntents'],
  entitlements: {
    'com.apple.security.application-groups':
      config.ios.entitlements['com.apple.security.application-groups'],
  },
  colors: {
    // Tint for widget-edit UI; matches Colors.forestGreen / dark accent.
    $accent: { color: '#2D5016', darkColor: '#A9C495' },
    // Widget surface; matches Colors.cream and the ratified dark variant.
    $widgetBackground: { color: '#F5E6D3', darkColor: '#2E2416' },
  },
  // Plant sprites shared with the app (single source: assets/images/plants/pixel).
  images: {
    cactus: '../../assets/images/plants/pixel/cactus-128.png',
    sunflower: '../../assets/images/plants/pixel/sunflower-128.png',
    monstera: '../../assets/images/plants/pixel/monstera-128.png',
    ficus: '../../assets/images/plants/pixel/ficus-128.png',
  },
});
