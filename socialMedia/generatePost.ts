/**
 * Generates an 884x884 Instagram-style post graphic for a GRAYBOX project.
 *
 * Layout:
 *  - Top 884x713: the project image, cropped/scaled to cover the box.
 *  - Bottom 884x171: an #262626 bar containing (left) the GRAYBOX logo mark
 *    and the artist's name in grayboxYellow, with "VENUE // ADDRESS" below
 *    it, and (right) the show's date range.
 *
 * Usage:
 *   npx tsx socialMedia/generatePost.ts [slug]
 *
 * With no slug, a post is generated for every project in `Projects`.
 */
import path from 'path';
import fs from 'fs';
import { createCanvas, loadImage, GlobalFonts, Image, SKRSContext2D } from '@napi-rs/canvas';
import { Projects, Project } from '../src/app/projects';

const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(__dirname, 'output');

const CANVAS_SIZE = 884;
const IMAGE_HEIGHT = 713;
const BAR_HEIGHT = CANVAS_SIZE - IMAGE_HEIGHT; // 171
const BAR_Y = IMAGE_HEIGHT;

const GRAYBOX_YELLOW = '#FFC500';
const OFF_WHITE = '#ACACAC';
const OFF_BLACK = '#262626';

const PADDING = 24;
const LOGO_SIZE = 68;
const LOGO_GAP = 12;

// Register the site's "Redaction" font under the same family name used in globals.css.
GlobalFonts.registerFromPath(path.join(ROOT, 'public/fonts/Redaction50-Regular.otf'), 'Redaction');

const LOGO_PATH = path.join(ROOT, 'public/graphics/pfp_transparent.png');

function formatDate(date: Date): string {
  return `${date.getMonth() + 1}.${date.getDate()}.${String(date.getFullYear()).slice(-2)}`;
}

/** Draws `img` into the destination box using CSS `object-fit: cover` semantics. */
function drawCover(
  ctx: SKRSContext2D,
  img: Image,
  dx: number,
  dy: number,
  dWidth: number,
  dHeight: number,
) {
  const imgRatio = img.width / img.height;
  const boxRatio = dWidth / dHeight;
  let sx: number, sy: number, sw: number, sh: number;
  if (imgRatio > boxRatio) {
    sh = img.height;
    sw = sh * boxRatio;
    sx = (img.width - sw) / 2;
    sy = 0;
  } else {
    sw = img.width;
    sh = sw / boxRatio;
    sx = 0;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dWidth, dHeight);
}

/** Loads an image from a remote URL, an absolute path, or a path relative to /public. */
async function loadProjectImage(src: string): Promise<Image> {
  if (/^https?:\/\//.test(src)) {
    const res = await fetch(src);
    if (!res.ok) throw new Error(`Failed to fetch image ${src}: ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    return loadImage(buf);
  }
  const filePath = path.isAbsolute(src) ? src : path.join(ROOT, 'public', src);
  return loadImage(filePath);
}

/**
 * Draws left-aligned `text` so its actual glyph ink (not the font's full em-box,
 * which reserves space for descenders this all-caps text never uses) is centered
 * on `centerY`. `ctx.font` must already be set. Leaves `textBaseline` as 'alphabetic'.
 */
function fillTextInkCentered(ctx: SKRSContext2D, text: string, x: number, centerY: number) {
  ctx.textBaseline = 'alphabetic';
  const metrics = ctx.measureText(text);
  const baselineY = centerY + (metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) / 2;
  ctx.fillText(text, x, baselineY);
}

/**
 * Right-aligns a "start - end" date range at `x`, split onto two lines, with the
 * first line's ink centered on `centerY` — same ink-centering as `fillTextInkCentered`,
 * so passing the artist name's center lines the date up with the name.
 */
function drawRightAlignedDateRange(
  ctx: SKRSContext2D,
  text: string,
  x: number,
  centerY: number,
  lineHeight: number,
) {
  ctx.textAlign = 'right';
  ctx.textBaseline = 'alphabetic';
  const [start, end] = text.split(' - ');
  const firstLine = `${start} -`;
  const metrics = ctx.measureText(firstLine);
  const baselineY = centerY + (metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) / 2;
  ctx.fillText(firstLine, x, baselineY);
  ctx.fillText(end, x, baselineY + lineHeight);
}

export async function generatePost(project: Project): Promise<Buffer> {
  const canvas = createCanvas(CANVAS_SIZE, CANVAS_SIZE);
  const ctx = canvas.getContext('2d');

  // --- Top image ---
  const img = await loadProjectImage(project.img);
  drawCover(ctx, img, 0, 0, CANVAS_SIZE, IMAGE_HEIGHT);

  // --- Bottom bar ---
  ctx.fillStyle = OFF_BLACK;
  ctx.fillRect(0, BAR_Y, CANVAS_SIZE, BAR_HEIGHT);

  // Logo mark, vertically centered on the artist name's line.
  const logo = await loadImage(LOGO_PATH);
  const logoY = BAR_Y + 28;
  ctx.drawImage(logo, PADDING, logoY, LOGO_SIZE, LOGO_SIZE);

  // Artist name, in GRAYBOX yellow, vertically centered on the logo.
  ctx.textAlign = 'left';
  ctx.fillStyle = GRAYBOX_YELLOW;
  ctx.font = '40px Redaction';
  const nameX = PADDING + LOGO_SIZE + LOGO_GAP;
  const nameCenterY = logoY + LOGO_SIZE / 2;
  fillTextInkCentered(ctx, project.artistName.toUpperCase(), nameX, nameCenterY);

  // Venue // Address, below the name, left-aligned with the logo.
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = OFF_WHITE;
  ctx.font = '30px Redaction';
  const venueLineY = logoY + LOGO_SIZE + 40;
  ctx.fillText(`${project.venue} // ${project.address}`.toUpperCase(), PADDING, venueLineY);

  // Date range, right-aligned, wraps to two lines if it doesn't fit.
  const endDate = new Date(project.launchDate);
  endDate.setMonth(endDate.getMonth() + 3);
  const dateText = `${formatDate(project.launchDate)} - ${formatDate(endDate)}`;
  ctx.fillStyle = OFF_WHITE;
  ctx.font = '30px Redaction';
  drawRightAlignedDateRange(
    ctx,
    dateText,
    CANVAS_SIZE - PADDING,
    nameCenterY,
    36,
  );

  return canvas.toBuffer('image/png');
}

async function main() {
  const slug = process.argv[2];
  const targets = slug ? Projects.filter((p) => p.slug === slug) : Projects;

  if (slug && targets.length === 0) {
    console.error(`No project found with slug "${slug}"`);
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const project of targets) {
    const buffer = await generatePost(project);
    const outPath = path.join(OUT_DIR, `${project.slug}.png`);
    fs.writeFileSync(outPath, new Uint8Array(buffer));
    console.log(`Wrote ${outPath}`);
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
