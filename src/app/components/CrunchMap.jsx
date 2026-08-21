import { useState, useEffect, useRef, useCallback } from "react";

/* ---------------------------------------------------------------------------
   StreetGrid — OSM road centerlines, rasterized to a low-res binary mask.

   Source is Overpass, not raster tiles: `way["highway"]` inside a bbox, with
   `out geom;` so each way arrives with its own coordinate list. Nothing but
   roads is ever fetched, so nothing but roads can appear. No buildings, no
   water, no landuse, no labels.

   Rasterizing:
     1. stroke every way onto a supersampled canvas, width by road class
     2. collapse each SS x SS block to a coverage fraction
     3. threshold -> binary mask
     4. OR in a Bresenham skeleton of every way, one cell wide, so a street
        that falls under the coverage threshold still survives as a hairline
        instead of dropping out of the network
     5. paint: street cells get the ink color, everything else alpha 0

   Step 4 is the one that matters. Coverage alone disconnects the grid at low
   resolutions — thin residential streets vanish while arterials bloom, and
   you lose the thing that makes a street map legible, which is that the lines
   join up. The skeleton guarantees connectivity at any resolution.
--------------------------------------------------------------------------- */

const ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

/* stroke weight per road class, in cells before the weight multiplier */
const CLASS_WEIGHT = {
  motorway: 3.0, trunk: 2.8, motorway_link: 2.0, trunk_link: 2.0,
  primary: 2.4, primary_link: 1.7,
  secondary: 2.0, secondary_link: 1.5,
  tertiary: 1.7, tertiary_link: 1.3,
  residential: 1.2, unclassified: 1.2, living_street: 1.1,
  pedestrian: 0.9, service: 0.8, track: 0.7,
  footway: 0.6, path: 0.6, cycleway: 0.7, steps: 0.6,
};
const MINOR = new Set(["service", "footway", "path", "cycleway", "steps", "track", "pedestrian"]);
const SKIP = new Set(["proposed", "construction", "raceway", "bus_guideway", "escape"]);

const SPANS = [
  { m: 300, label: "300 m" },
  { m: 600, label: "600 m" },
  { m: 1200, label: "1.2 km" },
  { m: 2500, label: "2.5 km" },
  { m: 5000, label: "5 km" },
];
const RESOLUTIONS = [32, 48, 64, 96, 128];
const SWATCHES = ["#5dff9b", "#ffc245", "#8ecbff", "#ff5c8a", "#ffffff", "#111111"];

const PRESETS = [
  { label: "Eixample, Barcelona", lat: 41.3925, lon: 2.1649 },
  { label: "Shinjuku, Tokyo", lat: 35.6938, lon: 139.7036 },
  { label: "Place de l'Étoile", lat: 48.8738, lon: 2.295 },
  { label: "Downtown LA", lat: 34.0479, lon: -118.2513 },
  { label: "Venice, Italy", lat: 45.4371, lon: 12.3345 },
];

const mercY = (lat) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));

function bboxFor(lat, lon, span) {
  const dLat = span / 2 / 111320;
  const dLon = span / 2 / (111320 * Math.max(0.05, Math.cos((lat * Math.PI) / 180)));
  return { s: lat - dLat, n: lat + dLat, w: lon - dLon, e: lon + dLon };
}

async function fetchRoads(box) {
  const q =
    `[out:json][timeout:25];way["highway"]` +
    `(${box.s.toFixed(6)},${box.w.toFixed(6)},${box.n.toFixed(6)},${box.e.toFixed(6)});out geom;`;
  let lastErr;
  for (const url of ENDPOINTS) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "data=" + encodeURIComponent(q),
      });
      if (!res.ok) throw new Error("http " + res.status);
      const json = await res.json();
      return (json.elements || [])
        .filter((el) => el.geometry?.length > 1 && !SKIP.has(el.tags?.highway))
        .map((el) => ({ kind: el.tags.highway, pts: el.geometry }));
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("overpass");
}

/* Bresenham into a Uint8 mask */
function plot(mask, n, ax, ay, bx, by) {
  let x0 = Math.round(ax), y0 = Math.round(ay);
  const x1 = Math.round(bx), y1 = Math.round(by);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
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

function rasterize({ roads, box, res, weight, threshold, minors }) {
  const ss = Math.max(4, Math.min(10, Math.round(560 / res)));
  const size = res * ss;

  const x0 = box.w, xSpan = box.e - box.w;
  const yTop = mercY(box.n), ySpan = mercY(box.s) - mercY(box.n);
  const toX = (lon) => ((lon - x0) / xSpan) * size;
  const toY = (lat) => ((mercY(lat) - yTop) / ySpan) * size;

  const cv = document.createElement("canvas");
  cv.width = size;
  cv.height = size;
  const ctx = cv.getContext("2d", { willReadFrequently: true });
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = "#fff";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const visible = roads.filter((r) => minors || !MINOR.has(r.kind));

  for (const r of visible) {
    const w = (CLASS_WEIGHT[r.kind] ?? 1.0) * weight * ss;
    ctx.lineWidth = Math.max(1, w);
    ctx.beginPath();
    r.pts.forEach((p, i) => {
      const px = toX(p.lon), py = toY(p.lat);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
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
  for (const r of visible) {
    for (let i = 1; i < r.pts.length; i++) {
      const a = r.pts[i - 1], b = r.pts[i];
      plot(
        mask, res,
        (toX(a.lon) / size) * res, (toY(a.lat) / size) * res,
        (toX(b.lon) / size) * res, (toY(b.lat) / size) * res
      );
    }
  }

  return { mask, res, count: visible.length };
}

async function geocode(query) {
  const res = await fetch(
    "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=" +
      encodeURIComponent(query)
  );
  if (!res.ok) throw new Error("geocode");
  const json = await res.json();
  return json.map((r) => ({ label: r.display_name, lat: +r.lat, lon: +r.lon }));
}

/* ========================================================================= */

export default function StreetGrid() {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState([]);
  const [seeking, setSeeking] = useState(false);

  const [place, setPlace] = useState(PRESETS[0].label);
  const [center, setCenter] = useState({ lat: PRESETS[0].lat, lon: PRESETS[0].lon });
  const [span, setSpan] = useState(1200);

  const [res, setRes] = useState(64);
  const [ink, setInk] = useState("#5dff9b");
  const [weight, setWeight] = useState(1);
  const [threshold, setThreshold] = useState(0.3);
  const [minors, setMinors] = useState(false);
  const [backdrop, setBackdrop] = useState("checker");

  const [roads, setRoads] = useState(null);
  const [grid, setGrid] = useState(null);
  const [status, setStatus] = useState("loading");

  const canvasRef = useRef(null);
  const reqRef = useRef(0);

  const box = bboxFor(center.lat, center.lon, span);
  const boxKey = `${center.lat.toFixed(5)},${center.lon.toFixed(5)},${span}`;

  /* fetch geometry */
  useEffect(() => {
    const id = ++reqRef.current;
    setStatus("loading");
    fetchRoads(bboxFor(center.lat, center.lon, span))
      .then((r) => {
        if (reqRef.current !== id) return;
        setRoads(r);
        setStatus(r.length ? "ready" : "empty");
      })
      .catch(() => {
        if (reqRef.current !== id) return;
        setRoads(null);
        setStatus("error");
      });
  }, [boxKey]);

  /* rasterize */
  useEffect(() => {
    if (!roads) return setGrid(null);
    setGrid(rasterize({ roads, box, res, weight, threshold, minors }));
  }, [roads, res, weight, threshold, minors, boxKey]);

  /* paint */
  const paint = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const n = grid?.res ?? res;
    cv.width = n;
    cv.height = n;
    const ctx = cv.getContext("2d");
    ctx.clearRect(0, 0, n, n);
    if (!grid) return;
    const img = ctx.createImageData(n, n);
    const r = parseInt(ink.slice(1, 3), 16);
    const g = parseInt(ink.slice(3, 5), 16);
    const b = parseInt(ink.slice(5, 7), 16);
    for (let i = 0; i < grid.mask.length; i++) {
      if (!grid.mask[i]) continue;
      const o = i * 4;
      img.data[o] = r;
      img.data[o + 1] = g;
      img.data[o + 2] = b;
      img.data[o + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }, [grid, ink, res]);

  useEffect(paint, [paint]);

  const savePng = () => {
    if (!grid) return;
    const scale = 8;
    const out = document.createElement("canvas");
    out.width = grid.res * scale;
    out.height = grid.res * scale;
    const c = out.getContext("2d");
    c.imageSmoothingEnabled = false;
    c.drawImage(canvasRef.current, 0, 0, out.width, out.height);
    const a = document.createElement("a");
    a.download = `streets-${place.split(",")[0].trim().replace(/\s+/g, "-").toLowerCase()}-${grid.res}.png`;
    a.href = out.toDataURL("image/png");
    a.click();
  };

  const runSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setSeeking(true);
    setHits([]);
    try {
      const r = await geocode(query);
      if (!r.length) setHits([{ note: "Nothing matched. Add a city or country." }]);
      else if (r.length === 1) pick(r[0]);
      else setHits(r);
    } catch {
      setHits([{ note: "The geocoder didn't answer. Pick a starting point below." }]);
    } finally {
      setSeeking(false);
    }
  };

  const pick = (h) => {
    setCenter({ lat: h.lat, lon: h.lon });
    setPlace(h.label);
    setHits([]);
  };

  const line = "rgba(255,255,255,0.11)";
  const label = {
    fontSize: 10,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.4)",
  };
  const chip = (on) => ({
    padding: "5px 10px",
    fontSize: 11,
    letterSpacing: "0.05em",
    border: `1px solid ${on ? ink : line}`,
    background: on ? ink : "transparent",
    color: on ? "#0d0d0c" : "rgba(255,255,255,0.65)",
    cursor: "pointer",
    borderRadius: 0,
    fontFamily: "inherit",
  });

  const backdrops = {
    checker:
      "repeating-conic-gradient(rgba(255,255,255,0.07) 0% 25%, transparent 0% 50%) 0 0 / 16px 16px",
    dark: "#0d0d0c",
    light: "#e9e5dc",
  };

  return (
    <div
      style={{
        minHeight: "100%",
        background: "#141311",
        color: "#e8e4dc",
        fontFamily: 'ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, monospace',
        padding: "20px 16px 40px",
      }}
    >
      <style>{`
        .sg canvas { image-rendering: pixelated; image-rendering: crisp-edges; }
        .sg-in:focus { outline: none; border-color: ${ink}; }
        .sg-b:focus-visible { outline: 2px solid ${ink}; outline-offset: 2px; }
        .sg-hit:hover { background: rgba(255,255,255,0.06); }
        .sg-r { -webkit-appearance: none; appearance: none; height: 2px; background: ${line}; }
        .sg-r::-webkit-slider-thumb { -webkit-appearance: none; width: 10px; height: 16px; background: ${ink}; cursor: ew-resize; }
        .sg-r::-moz-range-thumb { border: 0; width: 10px; height: 16px; background: ${ink}; cursor: ew-resize; }
        @keyframes sg-blink { 0%,60%{opacity:1} 61%,100%{opacity:.25} }
      `}</style>

      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            gap: 12,
            paddingBottom: 10,
            borderBottom: `1px solid ${line}`,
            flexWrap: "wrap",
          }}
        >
          <div style={{ fontSize: 13, letterSpacing: "0.28em", textTransform: "uppercase" }}>
            Street<span style={{ color: ink }}>grid</span>
          </div>
          <div style={label}>
            {res}×{res} · {SPANS.find((s) => s.m === span)?.label} · {grid?.count ?? 0} ways
          </div>
        </div>

        <form onSubmit={runSearch} style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <input
            className="sg-in"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type an address, city, or landmark"
            aria-label="Address"
            style={{
              flex: 1,
              minWidth: 0,
              background: "transparent",
              border: `1px solid ${line}`,
              color: "#e8e4dc",
              padding: "9px 11px",
              fontSize: 13,
              fontFamily: "inherit",
              borderRadius: 0,
            }}
          />
          <button className="sg-b" type="submit" style={{ ...chip(true), padding: "9px 16px", fontSize: 12 }}>
            {seeking ? "…" : "Find"}
          </button>
        </form>

        {hits.length > 0 && (
          <div style={{ border: `1px solid ${line}`, borderTop: "none" }}>
            {hits.map((h, i) =>
              h.note ? (
                <div key={i} style={{ padding: "10px 11px", fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                  {h.note}
                </div>
              ) : (
                <button
                  key={i}
                  className="sg-hit sg-b"
                  onClick={() => pick(h)}
                  style={{
                    display: "block", width: "100%", textAlign: "left",
                    background: "transparent", border: "none",
                    borderTop: i ? `1px solid ${line}` : "none",
                    color: "#d8d4cc", padding: "9px 11px", fontSize: 12,
                    fontFamily: "inherit", cursor: "pointer",
                  }}
                >
                  {h.label}
                </button>
              )
            )}
          </div>
        )}

        <div
          className="sg"
          style={{
            marginTop: 14,
            position: "relative",
            aspectRatio: "1 / 1",
            background: backdrops[backdrop],
            border: `1px solid ${line}`,
            overflow: "hidden",
          }}
        >
          <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
          {status !== "ready" && (
            <div
              style={{
                position: "absolute", inset: 0, display: "grid", placeItems: "center",
                textAlign: "center", padding: 24, pointerEvents: "none",
              }}
            >
              <div style={{ ...label, color: ink, maxWidth: 320, lineHeight: 1.7 }}>
                {status === "loading" && (
                  <span style={{ animation: "sg-blink 900ms steps(1) infinite" }}>Querying Overpass</span>
                )}
                {status === "empty" && "No roads in this bbox. Widen the span."}
                {status === "error" && "Overpass didn't answer. It rate-limits hard — wait a few seconds and search again."}
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex", justifyContent: "space-between", gap: 16,
            padding: "9px 0", borderBottom: `1px solid ${line}`, flexWrap: "wrap",
          }}
        >
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.72)", flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {place}
            </span>
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontVariantNumeric: "tabular-nums" }}>
            {center.lat.toFixed(4)} / {center.lon.toFixed(4)}
          </div>
        </div>

        <div style={{ display: "grid", gap: 16, marginTop: 16 }}>
          <div>
            <div style={label}>Grid</div>
            <div style={{ display: "flex", gap: 6, marginTop: 7, flexWrap: "wrap" }}>
              {RESOLUTIONS.map((r) => (
                <button key={r} className="sg-b" style={chip(r === res)} onClick={() => setRes(r)}>
                  {r}²
                </button>
              ))}
            </div>
          </div>

          <div>
            <div style={label}>Span</div>
            <div style={{ display: "flex", gap: 6, marginTop: 7, flexWrap: "wrap" }}>
              {SPANS.map((s) => (
                <button key={s.m} className="sg-b" style={chip(s.m === span)} onClick={() => setSpan(s.m)}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div style={label}>Ink</div>
            <div style={{ display: "flex", gap: 6, marginTop: 7, alignItems: "center", flexWrap: "wrap" }}>
              {SWATCHES.map((c) => (
                <button
                  key={c}
                  className="sg-b"
                  onClick={() => setInk(c)}
                  aria-label={c}
                  style={{
                    width: 26, height: 22, background: c, cursor: "pointer", borderRadius: 0,
                    border: `1px solid ${c === ink ? "#fff" : line}`,
                  }}
                />
              ))}
              <input
                type="color"
                value={ink}
                onChange={(e) => setInk(e.target.value)}
                aria-label="Custom ink color"
                style={{ width: 34, height: 24, background: "transparent", border: `1px solid ${line}`, padding: 1 }}
              />
              <span style={{ ...label, marginLeft: 2 }}>{ink}</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 170 }}>
              <div style={{ ...label, display: "flex", justifyContent: "space-between" }}>
                <span>Stroke weight</span>
                <span>{weight.toFixed(2)}×</span>
              </div>
              <input className="sg-r" type="range" min={0.3} max={3} step={0.05} value={weight}
                onChange={(e) => setWeight(+e.target.value)} style={{ width: "100%", marginTop: 10 }} />
            </div>
            <div style={{ flex: 1, minWidth: 170 }}>
              <div style={{ ...label, display: "flex", justifyContent: "space-between" }}>
                <span>Coverage cutoff</span>
                <span>{threshold.toFixed(2)}</span>
              </div>
              <input className="sg-r" type="range" min={0.02} max={0.9} step={0.01} value={threshold}
                onChange={(e) => setThreshold(+e.target.value)} style={{ width: "100%", marginTop: 10 }} />
            </div>
          </div>

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <button className="sg-b" style={chip(minors)} onClick={() => setMinors((m) => !m)}>
              Paths & alleys
            </button>
            <span style={{ width: 10 }} />
            {[["checker", "Checker"], ["dark", "Dark"], ["light", "Light"]].map(([k, l]) => (
              <button key={k} className="sg-b" style={chip(backdrop === k)} onClick={() => setBackdrop(k)}>
                {l}
              </button>
            ))}
            <span style={{ flex: 1 }} />
            <button className="sg-b" style={chip(false)} onClick={savePng} disabled={!grid}>
              Save PNG
            </button>
          </div>

          <div>
            <div style={label}>Jump to</div>
            <div style={{ display: "flex", gap: 6, marginTop: 7, flexWrap: "wrap" }}>
              {PRESETS.map((p) => (
                <button key={p.label} className="sg-b" style={chip(false)} onClick={() => pick(p)}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ ...label, fontSize: 9, lineHeight: 1.8, paddingTop: 4, borderTop: `1px solid ${line}` }}>
            Road data © OpenStreetMap contributors, via Overpass · Geocoding by Nominatim
          </div>
        </div>
      </div>
    </div>
  );
}