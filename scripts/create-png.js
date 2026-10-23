// Pure Node.js script using built-in zlib to output standard uncompressed PNGs
import fs from 'fs';
import zlib from 'zlib';

function createSolidPng(width, height, r, g, b) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 2; // color type 2 (RGB)
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // Scanlines with filter byte 0
  const scanlineLength = 1 + width * 3;
  const rawData = Buffer.alloc(height * scanlineLength);

  for (let y = 0; y < height; y++) {
    const offset = y * scanlineLength;
    rawData[offset] = 0; // filter none
    for (let x = 0; x < width; x++) {
      const pixelOffset = offset + 1 + x * 3;
      // create subtle gradient or crest border
      const isBorder = x < 8 || x >= width - 8 || y < 8 || y >= height - 8;
      const isInnerCrest = (x > width * 0.35 && x < width * 0.65 && y > height * 0.25 && y < height * 0.75);
      if (isBorder) {
        rawData[pixelOffset] = 56;     // #38bdf8
        rawData[pixelOffset + 1] = 189;
        rawData[pixelOffset + 2] = 248;
      } else if (isInnerCrest) {
        rawData[pixelOffset] = 251;    // #fbbf24 gold
        rawData[pixelOffset + 1] = 191;
        rawData[pixelOffset + 2] = 36;
      } else {
        rawData[pixelOffset] = r;
        rawData[pixelOffset + 1] = g;
        rawData[pixelOffset + 2] = b;
      }
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(8 + len + 4);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);

  const crc = crc32(buf.subarray(4, 8 + len));
  buf.writeInt32BE(crc, 8 + len);
  return buf;
}

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c = c ^ buf[i];
    for (let j = 0; j < 8; j++) {
      c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
    }
  }
  return ~c;
}

// Generate PWA icons in navy brand color (#1e3a8a: r=30, g=58, b=138)
const icon512 = createSolidPng(512, 512, 30, 58, 138);
const icon192 = createSolidPng(192, 192, 30, 58, 138);

fs.writeFileSync('public/pwa-512x512.png', icon512);
fs.writeFileSync('public/pwa-maskable-512x512.png', icon512);
fs.writeFileSync('public/pwa-192x192.png', icon192);
fs.writeFileSync('public/apple-touch-icon.png', icon192);
fs.writeFileSync('public/favicon.ico', icon192);

console.log('Successfully generated all PWA PNG icons!');
