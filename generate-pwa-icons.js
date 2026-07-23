const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function crc32(buf) {
  let c = 0xffffffff;
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let curr = n;
    for (let k = 0; k < 8; k++) {
      curr = (curr & 1) ? (0xedb88320 ^ (curr >>> 1)) : (curr >>> 1);
    }
    table[n] = curr;
  }
  for (let i = 0; i < buf.length; i++) {
    c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData), 0);
  return Buffer.concat([len, typeAndData, crc]);
}

function createSGGSIconPNG(width, height) {
  const header = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bit depth
  ihdrData[9] = 6; // RGBA color type
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // Draw SGGS logo on raw pixel array
  // Primary color: #0f172a (15, 23, 42)
  // Accent secondary gold: #d97706 (217, 119, 6)
  // Inner crest accent blue: #2563eb (37, 99, 235)
  // White: (255, 255, 255)

  const rawLines = [];
  const cx = width / 2;
  const cy = height / 2;
  const outerR = width * 0.42;
  const innerR = width * 0.35;
  const ringWidth = width * 0.04;

  for (let y = 0; y < height; y++) {
    const line = Buffer.alloc(1 + width * 4);
    line[0] = 0; // Filter type None
    for (let x = 0; x < width; x++) {
      const idx = 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Rounded square base corners check
      const cornerR = width * 0.2;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      // Background color #0f172a
      let r = 15, g = 23, b = 42, a = 255;

      // Outer gold circle ring (#d97706)
      if (Math.abs(dist - (innerR + outerR) / 2) < ringWidth / 2) {
        r = 217; g = 119; b = 6;
      }
      // Checkmark in the center
      // Checkmark segment 1: (-0.15*width, 0.05*width) to (0, 0.2*width)
      // Checkmark segment 2: (0, 0.2*width) to (0.2*width, -0.15*width)
      const nx = dx / width;
      const ny = dy / width;

      // Draw checkmark stroke
      const checkStroke = 0.035;
      const inSeg1 = isNearSegment(nx, ny, -0.16, 0.02, -0.04, 0.16, checkStroke);
      const inSeg2 = isNearSegment(nx, ny, -0.04, 0.16, 0.18, -0.14, checkStroke);

      if (inSeg1 || inSeg2) {
        r = 217; g = 119; b = 6; // Gold checkmark
      }

      line[idx] = r;
      line[idx + 1] = g;
      line[idx + 2] = b;
      line[idx + 3] = a;
    }
    rawLines.push(line);
  }

  function isNearSegment(px, py, x1, y1, x2, y2, radius) {
    const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
    if (l2 === 0) return Math.hypot(px - x1, py - y1) < radius;
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    const projX = x1 + t * (x2 - x1);
    const projY = y1 + t * (y2 - y1);
    return Math.hypot(px - projX, py - projY) < radius;
  }

  const rawBuffer = Buffer.concat(rawLines);
  const compressedData = zlib.deflateSync(rawBuffer);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdrChunk, idatChunk, iendChunk]);
}

const iconsDir = path.join(__dirname, 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

fs.writeFileSync(path.join(iconsDir, 'icon-192x192.png'), createSGGSIconPNG(192, 192));
fs.writeFileSync(path.join(iconsDir, 'icon-512x512.png'), createSGGSIconPNG(512, 512));
fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.png'), createSGGSIconPNG(180, 180));

console.log('Icons created successfully in public/icons');
