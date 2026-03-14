#!/usr/bin/env node
/**
 * CoreInventory – Favicon Generator
 * Generates: favicon.ico  (16, 32, 48 px)
 *            favicon-16x16.png
 *            favicon-32x32.png
 *            apple-touch-icon.png  (180 px)
 *            favicon.svg
 *
 * Design: isometric 3D box (inventory cube) on dark-navy rounded bg.
 * Colors: navy bg #0f172a | teal front #14b8a6 | light teal top #5eead4 | deep teal right #0d9488
 * No external dependencies – uses only Node.js built-ins.
 */

'use strict';

const zlib = require('zlib');
const fs   = require('fs');
const path = require('path');

// ─────────────────────────────────────────────
// CRC-32
// ─────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    t[i] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// ─────────────────────────────────────────────
// PNG encoder (RGBA, 8-bit, no interlacing)
// ─────────────────────────────────────────────
function encodePNG(width, height, rgba) {
  // Build filter-0 (None) scanlines
  const raw = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    raw[y * (1 + width * 4)] = 0;
    rgba.copy(raw, y * (1 + width * 4) + 1, y * width * 4, (y + 1) * width * 4);
  }

  const compressed = zlib.deflateSync(raw, { level: 9 });

  function chunk(type, data) {
    const tb  = Buffer.from(type, 'ascii');
    const len = Buffer.alloc(4);  len.writeUInt32BE(data.length, 0);
    const crc = Buffer.alloc(4);  crc.writeUInt32BE(crc32(Buffer.concat([tb, data])), 0);
    return Buffer.concat([len, tb, data, crc]);
  }

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width,  0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8]  = 8;  // bit depth
  ihdrData[9]  = 6;  // colour type: RGBA
  ihdrData[10] = 0;  ihdrData[11] = 0;  ihdrData[12] = 0;

  return Buffer.concat([
    Buffer.from([137,80,78,71,13,10,26,10]),  // PNG signature
    chunk('IHDR', ihdrData),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ─────────────────────────────────────────────
// Pixel helpers
// ─────────────────────────────────────────────
function setPixel(buf, stride, x, y, r, g, b, a) {
  if (x < 0 || y < 0 || x >= stride || y >= stride) return;
  const i = (y * stride + x) * 4;
  buf[i] = r;  buf[i+1] = g;  buf[i+2] = b;  buf[i+3] = a;
}

function fillRect(buf, stride, x0, y0, x1, y1, r, g, b, a) {
  for (let y = Math.max(0, y0); y <= Math.min(stride-1, y1); y++)
    for (let x = Math.max(0, x0); x <= Math.min(stride-1, x1); x++)
      setPixel(buf, stride, x, y, r, g, b, a);
}

// Scanline polygon fill (even-odd rule)
function fillPolygon(buf, stride, pts, r, g, b, a) {
  const ys   = pts.map(p => p[1]);
  const minY = Math.max(0, Math.floor(Math.min(...ys)));
  const maxY = Math.min(stride-1, Math.ceil(Math.max(...ys)));
  const n    = pts.length;

  for (let y = minY; y <= maxY; y++) {
    const xs = [];
    for (let i = 0; i < n; i++) {
      const [x0, y0] = pts[i];
      const [x1, y1] = pts[(i+1) % n];
      if ((y0 <= y && y1 > y) || (y1 <= y && y0 > y))
        xs.push(x0 + (y - y0) * (x1 - x0) / (y1 - y0));
    }
    xs.sort((a, b) => a - b);
    for (let i = 0; i < xs.length - 1; i += 2) {
      for (let x = Math.max(0, Math.ceil(xs[i])); x <= Math.min(stride-1, Math.floor(xs[i+1])); x++)
        setPixel(buf, stride, x, y, r, g, b, a);
    }
  }
}

// Rounded rectangle
function fillRoundedRect(buf, stride, x0, y0, x1, y1, rx, r, g, b, a) {
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      let inCorner = false;
      // check four corners
      const corners = [[x0+rx-1, y0+rx-1], [x1-rx+1, y0+rx-1], [x0+rx-1, y1-rx+1], [x1-rx+1, y1-rx+1]];
      for (const [cx, cy] of corners) {
        if (x < x0+rx && x < cx+1 && y < y0+rx && y < cy+1)
          inCorner = Math.hypot(x - cx, y - cy) > rx;
        if (x > x1-rx && x > cx-1 && y < y0+rx && y < cy+1)
          inCorner = Math.hypot(x - cx, y - cy) > rx;
        if (x < x0+rx && x < cx+1 && y > y1-rx && y > cy-1)
          inCorner = Math.hypot(x - cx, y - cy) > rx;
        if (x > x1-rx && x > cx-1 && y > y1-rx && y > cy-1)
          inCorner = Math.hypot(x - cx, y - cy) > rx;
      }
      if (!inCorner) setPixel(buf, stride, x, y, r, g, b, a);
    }
  }
}

// ─────────────────────────────────────────────
// Icon renderer  (design on a 32-unit grid, scaled to 'size')
// ─────────────────────────────────────────────
function generateIcon(size) {
  const buf = Buffer.alloc(size * size * 4, 0);  // transparent black by default

  // pixel helper using fractional scale
  const f = size / 32;
  const s = v => Math.round(v * f);

  // Palette
  const BG    = [15,  23,  42,  255];   // #0f172a  navy
  const FRONT = [20,  184, 166, 255];   // #14b8a6  teal
  const TOP   = [94,  234, 212, 255];   // #5eead4  light teal
  const RIGHT = [13,  148, 136, 255];   // #0d9488  dark teal
  const LINE  = [15,  23,  42,  160];   // grid line overlay

  // ── Background (rounded square) ──
  const corner = Math.max(1, Math.round(5 * f));
  fillRoundedRect(buf, size, 0, 0, size-1, size-1, corner, ...BG);

  // ── Box geometry (32-unit design space) ──
  // Front face  : (3,13) – (21,28)   [18 wide × 15 tall]
  // Top face    : parallelogram (3,13),(9,7),(27,7),(21,13)  [depth dx=6, dy=6]
  // Right face  : parallelogram (21,13),(27,7),(27,23),(21,28)

  const frontX0 = s(3),  frontY0 = s(13);
  const frontX1 = s(21), frontY1 = s(28);

  // Front face (solid rectangle)
  fillRect(buf, size, frontX0, frontY0, frontX1, frontY1, ...FRONT);

  // Top face
  fillPolygon(buf, size, [
    [s(3),  s(13)],
    [s(9),  s(7)],
    [s(27), s(7)],
    [s(21), s(13)],
  ], ...TOP);

  // Right face
  fillPolygon(buf, size, [
    [s(21), s(13)],
    [s(27), s(7)],
    [s(27), s(23)],
    [s(21), s(28)],
  ], ...RIGHT);

  // ── Grid lines on front face (only at ≥ 24 px) ──
  if (size >= 24) {
    const midY = s(20);
    for (let x = frontX0; x <= frontX1; x++) setPixel(buf, size, x, midY, ...LINE);

    const midX = s(12);
    for (let y = frontY0; y <= frontY1; y++) setPixel(buf, size, midX, y, ...LINE);
  }

  return buf;
}

// ─────────────────────────────────────────────
// ICO encoder  (embeds PNG streams — works in all modern browsers & OS)
// ─────────────────────────────────────────────
function encodeICO(entries) {
  // entries: [{size, pngData}]
  const count  = entries.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);   // type = 1 (icon)
  header.writeUInt16LE(count, 4);

  const dirEntries = [];
  const imageBlobs = [];
  let offset = 6 + 16 * count;

  for (const { size, pngData } of entries) {
    const e = Buffer.alloc(16);
    e[0] = size >= 256 ? 0 : size;   // width  (0 means 256)
    e[1] = size >= 256 ? 0 : size;   // height
    e[2] = 0;                        // colour count
    e[3] = 0;                        // reserved
    e.writeUInt16LE(1,  4);          // planes
    e.writeUInt16LE(32, 6);          // bit count
    e.writeUInt32LE(pngData.length, 8);
    e.writeUInt32LE(offset, 12);
    dirEntries.push(e);
    imageBlobs.push(pngData);
    offset += pngData.length;
  }

  return Buffer.concat([header, ...dirEntries, ...imageBlobs]);
}

// ─────────────────────────────────────────────
// SVG  (vector source – crisp at any size)
// ─────────────────────────────────────────────
const SVG_CONTENT = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <!-- Background -->
  <rect width="32" height="32" rx="5" fill="#0f172a"/>
  <!-- Box front face -->
  <rect x="3" y="13" width="18" height="15" fill="#14b8a6"/>
  <!-- Box top face -->
  <polygon points="3,13 9,7 27,7 21,13" fill="#5eead4"/>
  <!-- Box right face -->
  <polygon points="21,13 27,7 27,23 21,28" fill="#0d9488"/>
  <!-- Front grid – horizontal -->
  <line x1="3" y1="20" x2="21" y2="20" stroke="#0f172a" stroke-width="1" opacity="0.6"/>
  <!-- Front grid – vertical -->
  <line x1="12" y1="13" x2="12" y2="28" stroke="#0f172a" stroke-width="1" opacity="0.6"/>
</svg>
`;

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────
const outDir = path.join(__dirname, '..', 'public');

const pngs = {};
for (const sz of [16, 32, 48, 180]) {
  pngs[sz] = encodePNG(sz, sz, generateIcon(sz));
}

fs.writeFileSync(path.join(outDir, 'favicon-16x16.png'),   pngs[16]);
fs.writeFileSync(path.join(outDir, 'favicon-32x32.png'),   pngs[32]);
fs.writeFileSync(path.join(outDir, 'apple-touch-icon.png'), pngs[180]);

const ico = encodeICO([
  { size: 16, pngData: pngs[16] },
  { size: 32, pngData: pngs[32] },
  { size: 48, pngData: pngs[48] },
]);
fs.writeFileSync(path.join(outDir, 'favicon.ico'), ico);

fs.writeFileSync(path.join(outDir, 'favicon.svg'), SVG_CONTENT, 'utf8');

console.log('CoreInventory favicons generated:');
console.log('  ✓ public/favicon.ico        (16 + 32 + 48 px)');
console.log('  ✓ public/favicon-16x16.png');
console.log('  ✓ public/favicon-32x32.png');
console.log('  ✓ public/apple-touch-icon.png  (180 px)');
console.log('  ✓ public/favicon.svg');
