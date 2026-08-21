#!/usr/bin/env node
/* ---------------------------------------------------------------------------
   build-streets.mjs — LA County road centerlines -> chunked binary files.

   Run once. Output is static; serve it from /public and never touch a
   geo API at runtime again.

   Prereqs: osmium-tool (brew install osmium-tool)

     curl -O https://download.geofabrik.de/north-america/us/california/socal-latest.osm.pbf
     osmium tags-filter socal-latest.osm.pbf w/highway -o roads.pbf
     osmium extract -b -118.95,33.28,-117.64,34.82 roads.pbf -o la-roads.pbf
     osmium export la-roads.pbf -f geojsonseq -o la-roads.geojsonl
     node build-streets.mjs la-roads.geojsonl ./public/streets

   What it does:
     - keeps only highway=* LineStrings, drops areas and non-roads
     - Douglas-Peucker simplify at ~5m (invisible below 2m/cell)
     - clips every segment to a 0.02 deg grid cell, restitching runs so a
       straight boulevard stays one polyline per cell instead of 40 segments
     - quantizes to u16 local coords (~3cm) and writes one file per cell
     - splits majors and minors into separate files so the paths toggle is
       a lazy load rather than a payload you always pay for

   Format, little-endian:
     u8 version | u8 pad | u16 wayCount
     per way: u8 class | u8 pad | u16 pointCount | pointCount x (u16 x, u16 y)
   Local coords are 0..65535 across the cell, origin at its SW corner.
--------------------------------------------------------------------------- */

import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";

const BBOX = { w: -118.95, s: 33.28, e: -117.64, n: 34.82 };
const CELL = 0.02;
const SIMPLIFY = 5e-5; // ~5 m
const Q = 65535;

const CLASSES = [
  "motorway", "trunk", "primary", "secondary", "tertiary",
  "residential", "unclassified", "living_street",
  "motorway_link", "trunk_link", "primary_link", "secondary_link", "tertiary_link",
  "pedestrian", "service", "track", "footway", "path", "cycleway", "steps",
];
const CLASS_ID = new Map(CLASSES.map((c, i) => [c, i]));
const MINOR = new Set(["pedestrian", "service", "track", "footway", "path", "cycleway", "steps"]);

const COLS = Math.ceil((BBOX.e - BBOX.w) / CELL);
const ROWS = Math.ceil((BBOX.n - BBOX.s) / CELL);

/* --- geometry helpers ---------------------------------------------------- */

function simplify(pts, tol) {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    let far = -1, best = tol;
    const [ax, ay] = pts[a], [bx, by] = pts[b];
    const dx = bx - ax, dy = by - ay;
    const len2 = dx * dx + dy * dy;
    for (let i = a + 1; i < b; i++) {
      const [px, py] = pts[i];
      let d;
      if (len2 === 0) {
        d = Math.hypot(px - ax, py - ay);
      } else {
        let t = ((px - ax) * dx + (py - ay) * dy) / len2;
        t = Math.max(0, Math.min(1, t));
        d = Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
      }
      if (d > best) { best = d; far = i; }
    }
    if (far > 0) {
      keep[far] = 1;
      stack.push([a, far], [far, b]);
    }
  }
  return pts.filter((_, i) => keep[i]);
}

/* Liang-Barsky: clip one segment to a rect, or return null */
function clipSeg(x0, y0, x1, y1, xmin, ymin, xmax, ymax) {
  let t0 = 0, t1 = 1;
  const dx = x1 - x0, dy = y1 - y0;
  const tests = [[-dx, x0 - xmin], [dx, xmax - x0], [-dy, y0 - ymin], [dy, ymax - y0]];
  for (const [p, q] of tests) {
    if (p === 0) { if (q < 0) return null; continue; }
    const r = q / p;
    if (p < 0) { if (r > t1) return null; if (r > t0) t0 = r; }
    else { if (r < t0) return null; if (r < t1) t1 = r; }
  }
  return [x0 + t0 * dx, y0 + t0 * dy, x0 + t1 * dx, y0 + t1 * dy];
}

/* --- accumulate ---------------------------------------------------------- */

const cells = new Map(); // "cx_cy" -> { major: [], minor: [] }

function bucket(key) {
  let c = cells.get(key);
  if (!c) { c = { major: [], minor: [] }; cells.set(key, c); }
  return c;
}

function addWay(kind, coords) {
  const clsId = CLASS_ID.get(kind);
  if (clsId === undefined) return "class";
  const pts = simplify(coords, SIMPLIFY);
  if (pts.length < 2) return "degenerate";
  const lane = MINOR.has(kind) ? "minor" : "major";
  let landed = false;

  // per-cell open runs, so consecutive in-cell segments restitch
  const open = new Map();
  const flush = (key) => {
    const run = open.get(key);
    if (run && run.length >= 2) bucket(key)[lane].push({ clsId, pts: run });
    open.delete(key);
  };

  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
    const cx0 = Math.floor((Math.min(ax, bx) - BBOX.w) / CELL);
    const cx1 = Math.floor((Math.max(ax, bx) - BBOX.w) / CELL);
    const cy0 = Math.floor((Math.min(ay, by) - BBOX.s) / CELL);
    const cy1 = Math.floor((Math.max(ay, by) - BBOX.s) / CELL);
    const touched = new Set();

    for (let cy = cy0; cy <= cy1; cy++) {
      for (let cx = cx0; cx <= cx1; cx++) {
        if (cx < 0 || cy < 0 || cx >= COLS || cy >= ROWS) continue;
        const xmin = BBOX.w + cx * CELL, ymin = BBOX.s + cy * CELL;
        const seg = clipSeg(ax, ay, bx, by, xmin, ymin, xmin + CELL, ymin + CELL);
        if (!seg) continue;
        const key = `${cx}_${cy}`;
        touched.add(key);
        landed = true;
        let run = open.get(key);
        const head = [seg[0], seg[1]], tail = [seg[2], seg[3]];
        if (run && Math.abs(run[run.length - 1][0] - head[0]) < 1e-9 &&
                   Math.abs(run[run.length - 1][1] - head[1]) < 1e-9) {
          run.push(tail);
        } else {
          if (run) flush(key);
          open.set(key, [head, tail]);
        }
      }
    }
    for (const key of [...open.keys()]) if (!touched.has(key)) flush(key);
  }
  for (const key of [...open.keys()]) flush(key);
  return landed ? "kept" : "outside";
}

/* --- encode -------------------------------------------------------------- */

function encode(ways, cx, cy) {
  const originLon = BBOX.w + cx * CELL, originLat = BBOX.s + cy * CELL;
  let bytes = 4;
  for (const w of ways) bytes += 4 + w.pts.length * 4;
  const buf = Buffer.alloc(bytes);
  let o = 0;
  buf.writeUInt8(1, o); o += 2;
  buf.writeUInt16LE(ways.length, o); o += 2;
  for (const w of ways) {
    buf.writeUInt8(w.clsId, o); o += 2;
    buf.writeUInt16LE(w.pts.length, o); o += 2;
    for (const [lon, lat] of w.pts) {
      const x = Math.max(0, Math.min(Q, Math.round(((lon - originLon) / CELL) * Q)));
      const y = Math.max(0, Math.min(Q, Math.round(((lat - originLat) / CELL) * Q)));
      buf.writeUInt16LE(x, o); o += 2;
      buf.writeUInt16LE(y, o); o += 2;
    }
  }
  return buf;
}

/* --- run ----------------------------------------------------------------- */

const [, , input, outDir = "./public/streets"] = process.argv;
if (!input) {
  console.error("usage: node build-streets.mjs <la-roads.geojsonl> [outDir]");
  process.exit(1);
}

let stat;
try {
  stat = fs.statSync(input);
} catch {
  console.error(`ERROR: ${input} does not exist.`);
  console.error("The osmium chain probably stopped early. Check each step's output size.");
  process.exit(1);
}
if (stat.size === 0) {
  console.error(`ERROR: ${input} is 0 bytes.`);
  console.error("osmium export produced nothing, which means its input was already empty.");
  console.error("Run: osmium fileinfo la-roads.pbf  — if it reports 0 ways, the break is upstream.");
  process.exit(1);
}
console.log(`reading ${input} (${(stat.size / 1e9).toFixed(2)} GB)`);

const tally = { lines: 0, parseFail: 0, noHighway: 0, class: 0, degenerate: 0, outside: 0, kept: 0 };
let firstSkipped = null;

const rl = readline.createInterface({
  input: fs.createReadStream(input),
  crlfDelay: Infinity,
});

for await (const raw of rl) {
  const line = raw.replace(/^\x1e/, "").trim(); // geojsonseq record separator
  if (!line) continue;
  tally.lines++;
  let f;
  try { f = JSON.parse(line); } catch { tally.parseFail++; continue; }
  const kind = f.properties?.highway;
  if (!kind) {
    tally.noHighway++;
    if (!firstSkipped) firstSkipped = line.slice(0, 220);
    continue;
  }
  if (f.properties?.area === "yes") continue;
  const g = f.geometry;
  if (!g) continue;
  const lines = g.type === "LineString" ? [g.coordinates]
    : g.type === "MultiLineString" ? g.coordinates : [];
  for (const coords of lines) {
    if (coords.length < 2) continue;
    tally[addWay(kind, coords)]++;
  }
  if (tally.lines % 100000 === 0) {
    console.log(`  ${tally.lines.toLocaleString()} lines, ${tally.kept.toLocaleString()} kept`);
  }
}

if (tally.kept === 0) {
  console.error(`\nERROR: nothing was written. Read ${tally.lines.toLocaleString()} lines.`);
  console.error(`  unparseable: ${tally.parseFail}`);
  console.error(`  no highway tag: ${tally.noHighway}`);
  console.error(`  unrecognised highway class: ${tally.class}`);
  console.error(`  outside the LA County bbox: ${tally.outside}`);
  if (tally.outside > 0) {
    console.error("\nGeometry is landing outside the grid — the osmium extract bbox and the");
    console.error("BBOX constant in this script disagree, or the extract step was skipped.");
  }
  if (tally.noHighway > 0 && firstSkipped) {
    console.error("\nFirst line without a highway tag:\n  " + firstSkipped);
    console.error("If that has no `properties` at all, osmium wrote a different shape than expected.");
  }
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });

const manifest = { version: 1, bbox: [BBOX.w, BBOX.s, BBOX.e, BBOX.n], cell: CELL, cols: COLS, rows: ROWS, classes: CLASSES, cells: {} };
let files = 0, total = 0;

for (const [key, lanes] of cells) {
  const [cx, cy] = key.split("_").map(Number);
  const counts = [0, 0];
  for (const [i, lane] of ["major", "minor"].entries()) {
    const ways = lanes[lane];
    if (!ways.length) continue;
    const buf = encode(ways, cx, cy);
    const name = lane === "major" ? `${key}.bin` : `${key}.m.bin`;
    fs.writeFileSync(path.join(outDir, name), buf);
    counts[i] = ways.length;
    files++; total += buf.length;
  }
  if (counts[0] || counts[1]) manifest.cells[key] = counts;
}

fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(manifest));
console.log(`\n${tally.kept.toLocaleString()} ways -> ${cells.size} cells, ${files} files, ${(total / 1e6).toFixed(1)} MB`);
if (tally.outside) console.log(`(${tally.outside.toLocaleString()} ways fell outside the county bbox)`);
console.log(`manifest: ${path.join(outDir, "manifest.json")}`);
