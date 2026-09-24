import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

function makeCrcTable() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    table[n] = c;
  }
  return table;
}
const crcTable = makeCrcTable();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function createPngChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const crc = crc32(chunk.subarray(4, 8 + len));
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

function createPng(width, height, isMaskable = false) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const ihdrChunk = createPngChunk('IHDR', ihdr);

  const raw = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;

  for (let y = 0; y < height; y++) {
    raw[offset++] = 0; // filter byte
    for (let x = 0; x < width; x++) {
      const nx = (x / width) * 2 - 1;
      const ny = (y / height) * 2 - 1;

      // Rounded rectangle shape
      const rx = Math.max(Math.abs(nx) - 0.72, 0);
      const ry = Math.max(Math.abs(ny) - 0.72, 0);
      const dist = Math.sqrt(rx * rx + ry * ry);

      let r = 79, g = 70, b = 229, a = 255; // #4f46e5

      if (!isMaskable && dist > 0.22) {
        a = 0;
        r = 0; g = 0; b = 0;
      } else {
        const grad = (y / height) * 35;
        r = Math.max(0, 99 - grad);
        g = Math.max(0, 102 - grad);
        b = Math.min(255, 241 - grad * 0.5);

        // Safe zone padding for maskable (center scale 0.8)
        let px = x / width;
        let py = y / height;
        if (isMaskable) {
          px = (px - 0.5) * 1.25 + 0.5;
          py = (py - 0.5) * 1.25 + 0.5;
        }

        // Open book shape
        if (py >= 0.40 && py <= 0.66 && px >= 0.26 && px <= 0.74) {
          const spine = Math.abs(px - 0.5);
          const pageCurve = Math.sin(spine * Math.PI * 4) * 0.04;
          if (py >= 0.43 + pageCurve && py <= 0.63 + pageCurve && spine > 0.02) {
            r = 255; g = 255; b = 255; a = 255;
          }
        }

        // Graduation cap
        if (py >= 0.28 && py <= 0.38 && px >= 0.32 && px <= 0.68) {
          const capDist = Math.abs(px - 0.5) * 1.5 + Math.abs(py - 0.33);
          if (capDist <= 0.12) {
            r = 251; g = 191; b = 36;
            a = 255;
          }
        }
      }

      raw[offset++] = r;
      raw[offset++] = g;
      raw[offset++] = b;
      raw[offset++] = a;
    }
  }

  const compressed = zlib.deflateSync(raw);
  const idatChunk = createPngChunk('IDAT', compressed);
  const iendChunk = createPngChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createIcoFromPng(pngBuffer, size = 256) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);

  const dir = Buffer.alloc(16);
  dir[0] = size >= 256 ? 0 : size;
  dir[1] = size >= 256 ? 0 : size;
  dir[2] = 0;
  dir[3] = 0;
  dir.writeUInt16LE(1, 4);
  dir.writeUInt16LE(32, 6);
  dir.writeUInt32LE(pngBuffer.length, 8);
  dir.writeUInt32LE(22, 12);

  return Buffer.concat([header, dir, pngBuffer]);
}

const buildDir = path.resolve('build');
const publicDir = path.resolve('public');
if (!fs.existsSync(buildDir)) fs.mkdirSync(buildDir, { recursive: true });
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

// 1. Desktop & Build Icons
const png256 = createPng(256, 256);
fs.writeFileSync(path.join(buildDir, 'icon.png'), png256);
const ico = createIcoFromPng(png256, 256);
fs.writeFileSync(path.join(buildDir, 'icon.ico'), ico);

// 2. PWA Icons in public/
const iconsDir = path.join(publicDir, 'icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

const png192 = createPng(192, 192);
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), png192);
fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), png192);

const png512 = createPng(512, 512);
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), png512);
fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), png512);

const pngMaskable512 = createPng(512, 512, true);
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), pngMaskable512);

const png180 = createPng(180, 180);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), png180);

const png64 = createPng(64, 64);
const favIco = createIcoFromPng(png64, 64);
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), favIco);

// 3. SVG Icon in public/icon.svg
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="#4f46e5" />
  <path d="M256 140 L350 185 L256 230 L162 185 Z" fill="#fbbf24" />
  <rect x="250" y="230" width="12" height="40" fill="#fbbf24" />
  <path d="M140 260 C180 250, 240 250, 256 270 C272 250, 332 250, 372 260 L372 360 C332 350, 272 350, 256 370 C240 350, 180 350, 140 360 Z" fill="#ffffff" />
  <line x1="256" y1="270" x2="256" y2="370" stroke="#cbd5e1" stroke-width="4" />
  <text x="256" y="440" font-family="system-ui, sans-serif" font-weight="900" font-size="72" fill="#ffffff" text-anchor="middle" letter-spacing="2">DoN</text>
</svg>`;
fs.writeFileSync(path.join(publicDir, 'icon.svg'), svg, 'utf-8');

console.log('Successfully generated all PWA & desktop icon assets!');
