// Generates src/components/icons/pixelIcons.ts from @hackernoon/pixel-icon-library SVGs.
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '../../../..', 'Users/rileydrake/dev/rooted_app/node_modules/@hackernoon/pixel-icon-library/icons/SVG/regular');
// fallback: resolve relative to repo root passed as argv
const repo = process.argv[2] || '/Users/rileydrake/dev/rooted_app';
const srcDir = path.join(repo, 'node_modules/@hackernoon/pixel-icon-library/icons/SVG/regular');
const outFile = path.join(repo, 'src/components/icons/pixelIcons.ts');

// friendly name -> source file basename
const ICONS = {
  'arrow-left': 'arrow-left',
  'angle-right': 'angle-right',
  plus: 'plus',
  times: 'times',
  camera: 'camera',
  cog: 'cog',
  bell: 'bell',
  clock: 'clock',
  star: 'star',
  'paint-brush': 'paint-brush',
  sun: 'sun',
  users: 'users',
  user: 'user',
  lock: 'lock',
  envelope: 'envelope',
  logout: 'logout',
  'question-circle': 'question-circle',
  warning: 'exclamation-triangle',
  'check-circle': 'check-circle',
  calendar: 'calendar-alt',
  bolt: 'bolt',
  heart: 'heart',
  comment: 'comment',
  phone: 'phone-ringing-high',
  water: 'cloud-rain',
  seedlings: 'seedlings',
  home: 'home',
  'info-circle': 'info-circle',
};

const entries = Object.entries(ICONS).map(([name, file]) => {
  let xml = fs.readFileSync(path.join(srcDir, `${file}.svg`), 'utf8').trim();
  // Strip XML prolog and id attribute; keep viewBox + shape elements.
  xml = xml.replace(/<\?xml[^>]*\?>/, '').replace(/ id="[^"]*"/, '').trim();
  return `  '${name}': \`${xml}\`,`;
});

const out = `/**
 * AUTO-GENERATED — do not hand-edit.
 * Source: @hackernoon/pixel-icon-library (icons/SVG/regular), CC BY 4.0.
 * Regenerate with: node scripts/gen-pixel-icons.js  (see scripts/)
 * Icons are 24x24 single-color; fill is inherited so PixelIcon can tint them.
 */

export const PIXEL_ICONS = {
${entries.join('\n')}
} as const;

export type PixelIconName = keyof typeof PIXEL_ICONS;
`;

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, out);
console.log(`Wrote ${outFile} with ${entries.length} icons`);
