const fs = require('node:fs/promises');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '../../..');
const sharp = require(path.join(root, 'apps/website/node_modules/sharp'));
const brand = path.join(root, 'docs/branding');
const sizes = [16, 20, 24, 32, 40, 48, 64, 96, 128, 180, 192, 256, 384, 512, 1024];
async function write(relative, bytes) { const destination = path.join(root, relative); await fs.mkdir(path.dirname(destination), { recursive: true }); await fs.writeFile(destination, bytes); }
function ico(images) {
 const header = Buffer.alloc(6 + images.length * 16); header.writeUInt16LE(1, 2); header.writeUInt16LE(images.length, 4);
 let offset = header.length;
 images.forEach(({ size, png }, index) => { const start = 6 + index * 16; header[start] = size === 256 ? 0 : size; header[start + 1] = header[start]; header.writeUInt16LE(1, start + 4); header.writeUInt16LE(32, start + 6); header.writeUInt32LE(png.length, start + 8); header.writeUInt32LE(offset, start + 12); offset += png.length; });
 return Buffer.concat([header, ...images.map(image => image.png)]);
}
async function main() {
 const original = path.join(brand, 'logo/option 2 - choosen.png');
 // Remove only unused transparent margins; preserve the selected artwork.
 const trimmed = await sharp(original).trim().png().toBuffer();
 const master = await sharp(trimmed).resize(860, 860, { fit: 'contain', background: '#00000000' }).extend({ top: 82, bottom: 82, left: 82, right: 82, background: '#00000000' }).png().toBuffer();
 await write('docs/branding/logo/lensbook-master.png', master);
 const icons = new Map();
 for (const size of sizes) { const png = await sharp(master).resize(size, size).png().toBuffer(); icons.set(size, png); await write(`docs/branding/logo/icons/icon-${size}.png`, png); }
 await write('apps/extension/src/assets/icon.png', master);
 await write('apps/client/build/icon.png', master);
 await write('apps/website/public/icon.png', icons.get(512));
 await write('apps/website/public/icon-small.png', icons.get(128));
 await write('apps/website/public/logo.webp', await sharp(master).resize(256).webp({ lossless: true }).toBuffer());
 for (const size of [16, 32, 128, 180, 192, 512]) await write(`apps/website/public/icons/icon-${size}.png`, icons.get(size));
 await write('apps/website/public/apple-touch-icon.png', icons.get(180));
 const favicon = ico([16, 32, 48].map(size => ({ size, png: icons.get(size) })));
 await write('apps/website/public/favicon.ico', favicon);
 await write('docs/branding/logo/icons/favicon.ico', favicon);
 const windows = ico([16, 24, 32, 48, 64, 128, 256].map(size => ({ size, png: icons.get(size) })));
 await write('apps/client/build/icon.ico', windows);
 await write('docs/branding/logo/icons/icon.ico', windows);
 const iconset = path.join(brand, 'logo/icons/lensbook.iconset'); await fs.mkdir(iconset, { recursive: true });
 for (const size of [16, 32, 128, 256, 512]) for (const scale of [1, 2]) await fs.writeFile(path.join(iconset, `icon_${size}x${size}${scale === 2 ? '@2x' : ''}.png`), icons.get(size * scale));
 execFileSync('/usr/bin/iconutil', ['-c', 'icns', iconset, '-o', path.join(brand, 'logo/icons/icon.icns')]);
 await fs.copyFile(path.join(brand, 'logo/icons/icon.icns'), path.join(root, 'apps/client/build/icon.icns'));
 const source = await fs.readFile(path.join(root, 'apps/extension/src/styles/palette.ts'), 'utf8');
 const palettes = Object.fromEntries(['light', 'dark'].map(theme => [theme, Object.fromEntries([...source.match(new RegExp(`${theme}: \\{([\\s\\S]*?)\\}`))[1].matchAll(/(\w+): "(#[a-f0-9]+)"/g)].map(match => [match[1], match[2]]))]));
 const rows = [['accent','Primary iris'],['accentHover','Primary hover'],['onAccent','Text on primary'],['paper','Canvas'],['surface','Surface'],['ink','Main text'],['muted','Secondary text'],['border','Border'],['soft','Accent tint'],['wash','Background wash'],['success','Success'],['warning','Warning'],['error','Error']];
 let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1500"><rect width="1600" height="1500" fill="#f7f7fb"/><style>text{font-family:Arial,sans-serif}.hex{font-family:monospace}</style><text x="64" y="91" fill="#202132" font-size="52" font-weight="700">Story Lens · Ink &amp; Iris</text><text x="66" y="136" fill="#656779" font-size="24">Brand palette · Light and dark interface variants</text><image href="data:image/png;base64,${master.toString('base64')}" x="1390" y="32" width="130" height="130"/>`;
 for (const [index, theme] of ['light','dark'].entries()) {
  const colors = palettes[theme]; const x = 64 + index * 752;
  svg += `<rect x="${x}" y="194" width="720" height="1206" rx="24" fill="${colors.surface}" stroke="${colors.border}" stroke-width="2"/><text x="${x+32}" y="255" font-size="34" font-weight="700" fill="${colors.ink}">${theme === 'light' ? 'Light' : 'Dark'}</text><rect x="${x+480}" y="218" width="208" height="50" rx="12" fill="${colors.accent}"/><text x="${x+584}" y="251" text-anchor="middle" font-size="20" font-weight="600" fill="${colors.onAccent}">Primary action</text>`;
  rows.forEach(([key, label], row) => { const y = 296 + row * 82; svg += `<rect x="${x+32}" y="${y}" width="78" height="58" rx="12" fill="${colors[key]}" stroke="${colors.border}"/><text x="${x+132}" y="${y+24}" fill="${colors.ink}" font-size="23" font-weight="600">${label}</text><text x="${x+132}" y="${y+51}" fill="${colors.muted}" font-size="18">${key}</text><text x="${x+688}" y="${y+36}" text-anchor="end" fill="${colors.ink}" font-size="24" class="hex">${colors[key].toUpperCase()}</text>`; });
 }
 svg += '<text x="64" y="1454" font-size="20" fill="#656779">Semantic colors are reserved for status. Reader-defined highlight colors remain independent.</text></svg>';
 await write('docs/branding/color-pallete.svg', Buffer.from(svg));
 await write('docs/branding/color-pallete.png', await sharp(Buffer.from(svg)).png().toBuffer());
 console.log(`Exported Lensbook master, ${sizes.length} PNG sizes, ICO, ICNS, app assets and palette.`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
