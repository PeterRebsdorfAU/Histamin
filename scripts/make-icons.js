// Genererer PNG-ikoner (192 og 512 px) uden eksterne afhængigheder.
// Tegner samme motiv som public/icon.svg: grøn baggrund med et hvidt blad.
import fs from 'node:fs';
import zlib from 'node:zlib';

const GREEN = [0x2f, 0x7d, 0x5b];
const WHITE = [255, 255, 255];

function crc32(buf) {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (const b of buf) crc = table[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

// Bladet: området mellem to cirkelbuer (en "linse"), roteret 45°.
function inLeaf(x, y) {
  // koordinater i 0..1, centrum (0.5, 0.5); rotér -45°
  const cx = x - 0.5;
  const cy = y - 0.5;
  const a = Math.PI / 4;
  const u = cx * Math.cos(a) - cy * Math.sin(a);
  const v = cx * Math.sin(a) + cy * Math.cos(a);
  const R = 0.36;
  const d = 0.24;
  return Math.hypot(u, v - d) < R && Math.hypot(u, v + d) < R;
}

function inVein(x, y) {
  // diagonal linje fra nederst venstre mod centrum
  const t = ((x - 0.27) + (0.73 - y)) / 2;
  if (t < 0 || t > 0.26) return false;
  const px = 0.27 + t;
  const py = 0.73 - t;
  return Math.hypot(x - px, y - py) < 0.022;
}

function render(size) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  const S = 3; // supersampling
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      let w = 0;
      for (let sy = 0; sy < S; sy++) {
        for (let sx = 0; sx < S; sx++) {
          const fx = (x + (sx + 0.5) / S) / size;
          const fy = (y + (sy + 0.5) / S) / size;
          if (inLeaf(fx, fy) && !inVein(fx, fy)) w++;
        }
      }
      const k = w / (S * S);
      const o = y * (size * 4 + 1) + 1 + x * 4;
      for (let c = 0; c < 3; c++) raw[o + c] = Math.round(GREEN[c] * (1 - k) + WHITE[c] * k);
      raw[o + 3] = 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

for (const size of [192, 512]) {
  fs.writeFileSync(`public/icon-${size}.png`, render(size));
  console.log(`public/icon-${size}.png`);
}
