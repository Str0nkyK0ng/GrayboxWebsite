import { useState, useEffect, useRef, useCallback } from "react";
import type { CanvasHTMLAttributes } from "react";

/* ---------------------------------------------------------------------------
   CrunchMap — LA County streets as a dichromatic pixel grid. Headless.

     <CrunchMap lat={34.0479} lon={-118.2513} />
     <CrunchMap address="Sunset & Vermont" span={600} res={96} color="#ff5c8a" />

   Renders one <canvas> and nothing else. Background stays at alpha 0, street
   cells get `color` at alpha 255. Size it from the parent — the canvas fills
   100% of whatever box you put it in, upscaled with image-rendering: pixelated.

   Reads the chunked binary files from build-streets.mjs at `dataUrl`. Falls
   back to Overpass if they aren't there, unless you pass allowRemote={false}.

   Pure functions are exported too, if you want the mask without React:
     loadStreets, rasterizeStreets, geocodeLA, bboxFor
--------------------------------------------------------------------------- */

/* --- types --------------------------------------------------------------- */

export interface LonLat {
  lon: number;
  lat: number;
}

export interface BBox {
  w: number;
  s: number;
  e: number;
  n: number;
}

export interface Way {
  /** OSM highway value, e.g. "residential". Unknown values fall back to weight 1. */
  kind: string;
  pts: LonLat[];
}

export interface Manifest {
  version: number;
  bbox: [number, number, number, number];
  cell: number;
  cols: number;
  rows: number;
  classes: string[];
  /** "cx_cy" -> [majorWayCount, minorWayCount] */
  cells: Record<string, [number, number]>;
}

export type StreetSource = "local" | "overpass";

export interface GeoHit extends LonLat {
  label: string;
}

export interface RenderInfo {
  /** res*res bytes, row-major from the top-left. 1 = street. */
  mask: Uint8Array;
  res: number;
  canvas: HTMLCanvasElement;
  /** Grid cell holding the exact coordinate, or null if it fell outside. */
  marker: GridPoint | null;
}

export interface GridPoint {
  x: number;
  y: number;
}

/* --- constants ----------------------------------------------------------- */

const LA: BBox = { w: -118.95, s: 33.28, e: -117.64, n: 34.82 };
const CELL = 0.02;
const Q = 65535;

const CLASS_WEIGHT: Record<string, number> = {
  motorway: 3.0, trunk: 2.8, motorway_link: 2.0, trunk_link: 2.0,
  primary: 2.4, primary_link: 1.7, secondary: 2.0, secondary_link: 1.5,
  tertiary: 1.7, tertiary_link: 1.3, residential: 1.2, unclassified: 1.2,
  living_street: 1.1, pedestrian: 0.9, service: 0.8, track: 0.7,
  footway: 0.6, path: 0.6, cycleway: 0.7, steps: 0.6,
};

const mercY = (lat: number): number =>
  Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));

const clamp = (v: number, lo: number, hi: number): number =>
  Math.max(lo, Math.min(hi, v));

function context2d(cv: HTMLCanvasElement, opts?: CanvasRenderingContext2DSettings) {
  const ctx = cv.getContext("2d", opts);
  if (!ctx) throw new Error("CrunchMap: 2d canvas context unavailable");
  return ctx;
}

/** #abc or #aabbcc -> [r, g, b]. Throws on anything else. */
function parseHex(hex: string): [number, number, number] {
  const h = hex.trim().replace(/^#/, "");
  const full =
    h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) {
    throw new Error(`CrunchMap: color must be a hex string, got "${hex}"`);
  }
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Square bbox roughly `span` metres across, centred on lat/lon. */
export function bboxFor(lat: number, lon: number, span: number): BBox {
  const dLat = span / 2 / 111320;
  const dLon = span / 2 / (111320 * Math.cos((lat * Math.PI) / 180));
  return { s: lat - dLat, n: lat + dLat, w: lon - dLon, e: lon + dLon };
}

/**
 * Coordinate -> grid cell, using the same Mercator projection as the raster.
 * Not simply the centre cell: bboxFor is linear in latitude while the raster
 * is Mercator, so the true point sits slightly off centre.
 */
export function projectToGrid(pt: LonLat, box: BBox, res: number): GridPoint {
  const yTop = mercY(box.n);
  const ySpan = mercY(box.s) - yTop;
  return {
    x: Math.floor(((pt.lon - box.w) / (box.e - box.w)) * res),
    y: Math.floor(((mercY(pt.lat) - yTop) / ySpan) * res),
  };
}

/* --- data ---------------------------------------------------------------- */

const chunkCache = new Map<string, Promise<Way[]>>();
const manifestCache = new Map<string, Promise<Manifest | null>>();

function loadManifest(dataUrl: string): Promise<Manifest | null> {
  let p = manifestCache.get(dataUrl);
  if (!p) {
    p = fetch(`${dataUrl}/manifest.json`)
      .then((r) => (r.ok ? (r.json() as Promise<Manifest>) : null))
      .catch(() => null);
    manifestCache.set(dataUrl, p);
  }
  return p;
}

function decodeChunk(
  buf: ArrayBuffer,
  cx: number,
  cy: number,
  classes: string[]
): Way[] {
  const dv = new DataView(buf);
  let o = 2;
  const count = dv.getUint16(o, true);
  o += 2;
  const oLon = LA.w + cx * CELL;
  const oLat = LA.s + cy * CELL;
  const out: Way[] = [];
  for (let i = 0; i < count; i++) {
    const kind = classes[dv.getUint8(o)] ?? "unclassified";
    o += 2;
    const np = dv.getUint16(o, true);
    o += 2;
    const pts: LonLat[] = new Array(np);
    for (let k = 0; k < np; k++) {
      const x = dv.getUint16(o, true); o += 2;
      const y = dv.getUint16(o, true); o += 2;
      pts[k] = { lon: oLon + (x / Q) * CELL, lat: oLat + (y / Q) * CELL };
    }
    out.push({ kind, pts });
  }
  return out;
}

function loadChunk(
  dataUrl: string,
  cx: number,
  cy: number,
  minor: boolean,
  classes: string[]
): Promise<Way[]> {
  const name = `${cx}_${cy}${minor ? ".m" : ""}`;
  const key = `${dataUrl}|${name}`;
  let p = chunkCache.get(key);
  if (!p) {
    p = fetch(`${dataUrl}/${name}.bin`)
      .then((r) => (r.ok ? r.arrayBuffer() : null))
      .then((b) => (b ? decodeChunk(b, cx, cy, classes) : []))
      .catch((): Way[] => []);
    chunkCache.set(key, p);
  }
  return p;
}

interface OverpassWay {
  tags?: Record<string, string>;
  geometry?: LonLat[];
}

async function overpassRoads(box: BBox, minors: boolean): Promise<Way[]> {
  const q =
    `[out:json][timeout:40];way["highway"]` +
    `(${box.s.toFixed(6)},${box.w.toFixed(6)},${box.n.toFixed(6)},${box.e.toFixed(6)});out geom;`;
  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "data=" + encodeURIComponent(q),
  });
  if (!res.ok) throw new Error(`CrunchMap: overpass ${res.status}`);
  const json = (await res.json()) as { elements?: OverpassWay[] };
  return (json.elements ?? [])
    .filter((el): el is Required<OverpassWay> =>
      Boolean(el.geometry && el.geometry.length > 1 && el.tags?.highway)
    )
    .map((el) => ({ kind: el.tags.highway, pts: el.geometry }))
    .filter((r) => minors || (CLASS_WEIGHT[r.kind] ?? 1) > 0.95);
}

export interface LoadStreetsOptions {
  minors?: boolean;
  dataUrl?: string;
  allowRemote?: boolean;
}

/** Road ways covering a bbox, from local chunks or Overpass. */
export async function loadStreets(
  box: BBox,
  { minors = false, dataUrl = "/streets", allowRemote = true }: LoadStreetsOptions = {}
): Promise<{ roads: Way[]; source: StreetSource }> {
  const man = await loadManifest(dataUrl);
  if (man) {
    const cx0 = Math.floor((box.w - LA.w) / CELL);
    const cx1 = Math.floor((box.e - LA.w) / CELL);
    const cy0 = Math.floor((box.s - LA.s) / CELL);
    const cy1 = Math.floor((box.n - LA.s) / CELL);
    const jobs: Promise<Way[]>[] = [];
    for (let cy = cy0; cy <= cy1; cy++) {
      for (let cx = cx0; cx <= cx1; cx++) {
        const counts = man.cells[`${cx}_${cy}`];
        if (!counts) continue;
        if (counts[0]) jobs.push(loadChunk(dataUrl, cx, cy, false, man.classes));
        if (minors && counts[1]) jobs.push(loadChunk(dataUrl, cx, cy, true, man.classes));
      }
    }
    const chunks = await Promise.all(jobs);
    return { roads: chunks.flat(), source: "local" };
  }
  if (!allowRemote) {
    throw new Error(`CrunchMap: no local street data at ${dataUrl}`);
  }
  return { roads: await overpassRoads(box, minors), source: "overpass" };
}

/* --- rasterizer ---------------------------------------------------------- */

function plot(
  mask: Uint8Array, n: number,
  ax: number, ay: number, bx: number, by: number
): void {
  let x0 = Math.round(ax);
  let y0 = Math.round(ay);
  const x1 = Math.round(bx);
  const y1 = Math.round(by);
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  let guard = 0;
  for (;;) {
    if (x0 >= 0 && x0 < n && y0 >= 0 && y0 < n) mask[y0 * n + x0] = 1;
    if ((x0 === x1 && y0 === y1) || ++guard > 4096) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}

export interface RasterizeOptions {
  roads: Way[];
  box: BBox;
  res: number;
  weight?: number;
  threshold?: number;
}

/**
 * Road ways -> Uint8Array of res*res, row-major from the top-left, 1 = street.
 * Browser-only: uses a detached canvas for the coverage pass.
 */
export function rasterizeStreets({
  roads,
  box,
  res,
  weight = 1,
  threshold = 0.3,
}: RasterizeOptions): Uint8Array {
  const ss = clamp(Math.round(560 / res), 4, 10);
  const size = res * ss;
  const xSpan = box.e - box.w;
  const yTop = mercY(box.n);
  const ySpan = mercY(box.s) - mercY(box.n);
  const toX = (lon: number) => ((lon - box.w) / xSpan) * size;
  const toY = (lat: number) => ((mercY(lat) - yTop) / ySpan) * size;

  const cv = document.createElement("canvas");
  cv.width = cv.height = size;
  const ctx = context2d(cv, { willReadFrequently: true });
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = "#fff";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (const r of roads) {
    ctx.lineWidth = Math.max(1, (CLASS_WEIGHT[r.kind] ?? 1) * weight * ss);
    ctx.beginPath();
    for (let i = 0; i < r.pts.length; i++) {
      const p = r.pts[i];
      if (i === 0) ctx.moveTo(toX(p.lon), toY(p.lat));
      else ctx.lineTo(toX(p.lon), toY(p.lat));
    }
    ctx.stroke();
  }

  const px = ctx.getImageData(0, 0, size, size).data;
  const mask = new Uint8Array(res * res);
  const cut = threshold * ss * ss * 255;
  for (let j = 0; j < res; j++) {
    for (let i = 0; i < res; i++) {
      let sum = 0;
      for (let b = 0; b < ss; b++) {
        const row = (j * ss + b) * size;
        for (let a = 0; a < ss; a++) sum += px[(row + i * ss + a) * 4];
      }
      if (sum >= cut) mask[j * res + i] = 1;
    }
  }

  /* hairline pass — nothing drops out of the network */
  const k = res / size;
  for (const r of roads) {
    for (let i = 1; i < r.pts.length; i++) {
      const a = r.pts[i - 1];
      const b = r.pts[i];
      plot(mask, res, toX(a.lon) * k, toY(a.lat) * k, toX(b.lon) * k, toY(b.lat) * k);
    }
  }
  return mask;
}

/* --- geocoding, bounded to the county ------------------------------------ */

interface NominatimHit {
  lat: string;
  lon: string;
  display_name: string;
}

/** Address -> coordinates, or null. Only resolves inside LA County. */
export async function geocodeLA(
  query: string,
  signal?: AbortSignal
): Promise<GeoHit | null> {
  const url =
    "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=us" +
    `&viewbox=${LA.w},${LA.n},${LA.e},${LA.s}&bounded=1&q=` +
    encodeURIComponent(query);
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`CrunchMap: geocode ${res.status}`);
  const hits = (await res.json()) as NominatimHit[];
  const hit = hits[0];
  if (!hit) return null;
  return {
    lat: Number(hit.lat),
    lon: Number(hit.lon),
    label: hit.display_name.replace(/, (California|United States)(, \d+)?/g, ""),
  };
}

/* ========================================================================= */

type CanvasProps = Omit<
  CanvasHTMLAttributes<HTMLCanvasElement>,
  "onError" | "color" | "width" | "height"
>;

interface CommonProps extends CanvasProps {
  /** Metres across the square view. Default 1200. */
  span?: number;
  locationName:string;
   address: string;
  /** Cells per side. Default 64. */
  res?: number;
  /** Street colour, hex. Background is always transparent. Default "#ffffff". */
  color?: string;
  /** Marker square colour, hex. Omit for no marker. */
  markerColor?: string;
  /** Marker square size in cells. Default 3. Odd values centre exactly. */
  markerSize?: number;
  /** Stroke width multiplier before the crunch. Default 1. */
  weight?: number;
  /** Cell coverage needed to switch a cell on, 0–1. Default 0.3. */
  threshold?: number;
  /** Include alleys, service roads, and footpaths. Default false. */
  minors?: boolean;
  /** Where build-streets.mjs wrote its output. Default "/streets". */
  dataUrl?: string;
  /** Allow the Overpass fallback when local data is missing. Default true. */
  allowRemote?: boolean;
  onResolve?: (hit: GeoHit) => void;
  onRender?: (info: RenderInfo) => void;
  onError?: (err: Error) => void;
}

/** Either coordinates or an address, not both. */
export type CrunchMapProps = CommonProps &
  (
    { lat: number; lon: number; address: string }
  );

export default function CrunchMap({
  lat,
  lon,
  address,
  span = 1200,
  res = 64,
  color = "#ffffff",
  locationName,
  markerColor,
  markerSize = 3,
  weight = 1,
  threshold = 0.3,
  minors = false,
  dataUrl = "/streets",
  allowRemote = true,
  onResolve,
  className="",
  onRender,
  onError,
  style,
  ...rest
}: CrunchMapProps) {
  const hasCoords = typeof lat === "number" && typeof lon === "number";
  const [coords, setCoords] = useState<LonLat | null>(
    hasCoords ? { lat: lat as number, lon: lon as number } : null
  );
  const [frame, setFrame] = useState<{
    mask: Uint8Array;
    box: BBox;
    at: LonLat;
  } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const jobRef = useRef(0);

  const cbs = useRef({ onResolve, onRender, onError });
  cbs.current = { onResolve, onRender, onError };

  /* address -> coords */
  useEffect(() => {
    if (typeof lat === "number" && typeof lon === "number") {
      setCoords({ lat, lon });
      return;
    }
    if (!address) return;
    const ac = new AbortController();
    geocodeLA(address, ac.signal)
      .then((hit) => {
        if (ac.signal.aborted) return;
        if (!hit) throw new Error(`CrunchMap: no LA County match for "${address}"`);
        setCoords({ lat: hit.lat, lon: hit.lon });
        cbs.current.onResolve?.(hit);
      })
      .catch((e: unknown) => {
        if (e instanceof Error && e.name === "AbortError") return;
        cbs.current.onError?.(e instanceof Error ? e : new Error(String(e)));
      });
    return () => ac.abort();
  }, [lat, lon, address]);

  /* coords -> mask */
  useEffect(() => {
    if (!coords) return;
    const id = ++jobRef.current;
    const at = {
      lat: clamp(coords.lat, LA.s, LA.n),
      lon: clamp(coords.lon, LA.w, LA.e),
    };
    const box = bboxFor(at.lat, at.lon, span);
    loadStreets(box, { minors, dataUrl, allowRemote })
      .then(({ roads }) => {
        if (jobRef.current !== id) return;
        setFrame({
          mask: rasterizeStreets({ roads, box, res, weight, threshold }),
          box,
          at,
        });
      })
      .catch((e: unknown) => {
        if (jobRef.current !== id) return;
        cbs.current.onError?.(e instanceof Error ? e : new Error(String(e)));
      });
  }, [coords, span, res, weight, threshold, minors, dataUrl, allowRemote]);

  /* mask -> pixels */
  const paint = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    cv.width = cv.height = res;
    const ctx = context2d(cv);
    ctx.clearRect(0, 0, res, res);
    if (!frame || frame.mask.length !== res * res) return;
    ctx.scale(10, 10);

    const { mask, box, at } = frame;
    const img = ctx.createImageData(res,res);
    const [r, g, b] = parseHex(color);
    for (let i = 0; i < mask.length; i++) {
      if (!mask[i]) continue;
      const o = i * 4;
      img.data[o] = r;
      img.data[o + 1] = g;
      img.data[o + 2] = b;
      img.data[o + 3] = 255;
    }

    /* marker square, stamped over the streets */
    const marker = projectToGrid(at, box, res);
    const inGrid =
      marker.x >= 0 && marker.x < res && marker.y >= 0 && marker.y < res;

    if (markerColor && inGrid) {
      const [mr, mg, mb] = parseHex(markerColor);
      const size = Math.max(1, Math.round(markerSize));
      const back = Math.floor((size - 1) / 2);
      const x0 = marker.x - back;
      const y0 = marker.y - back;
      for (let j = y0; j < y0 + size; j++) {
        if (j < 0 || j >= res) continue;
        for (let i = x0; i < x0 + size; i++) {
          if (i < 0 || i >= res) continue;
          const o = (j * res + i) * 4;
          img.data[o] = mr;
          img.data[o + 1] = mg;
          img.data[o + 2] = mb;
          img.data[o + 3] = 255;
        }
      }
    }
    ctx.putImageData(img, 0, 0);
    cbs.current.onRender?.({ mask, res, canvas: cv, marker: inGrid ? marker : null });
  }, [frame, res, color, markerColor, markerSize]);

  useEffect(paint, [paint]);

  return (
    <div className={`grid place-items-center ${className}`}>
      <div className="[grid-area:1/1] z-10 text-[2rem] text-center mt-0 items-center flex w-[90%] flex-col  h-full  text-grayboxYellow">
      <div className="bg-offBlack p-3 w-full">
        <p className="m-0 h-min uppercase font-[Coral]">{locationName}</p>
        <p className="m-0 p-0 h-min w-full uppercase text-[1rem] font-[Work Sans] ">{address}</p>
      </div>

      </div>
    <canvas
      ref={canvasRef}
      className="w-full h-full  [grid-area:1/1] z-0 translate-x-[0px]"
      style={{
        imageRendering: "pixelated",
      }}
    />
    </div>

  );
}