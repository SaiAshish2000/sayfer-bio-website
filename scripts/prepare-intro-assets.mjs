/**
 * Generates the intro animation's runtime assets from the approved artwork.
 * Originals in `references/` are never modified.
 * Run: `node scripts/prepare-intro-assets.mjs`
 *
 * The intro morphs one form through three approved states — the cell mass, the
 * leaf, and the V5 mark. Cross-fading three PNGs would read as three pictures,
 * so instead each state is converted to a SIGNED DISTANCE FIELD and the shader
 * interpolates the fields. Mixing distance fields produces real intermediate
 * silhouettes: the form genuinely elongates, redistributes and resolves rather
 * than dissolving. Deriving all three fields from the actual artwork is also
 * what makes the final frame land exactly on the production V5 mark.
 *
 * Outputs:
 *   public/intro/sdf-atlas.png   R=cell  G=leaf  B=V5(pores filled)  A=pores
 *   public/intro/intro-data.json normalisation, palette ramp, pore extent
 *   public/brand/v5-mark.webp    the mark alone, for the exact final lock
 *   public/brand/v5-wordmark.webp the wordmark alone, for the lockup + handoff
 */
import sharp from "sharp";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ref = (f) => join(root, "references", f);
const out = (f) => join(root, "public", f);

/** Canvas the three fields share. Tall, matching the V5 mark's proportion. */
const W = 384;
const H = 768;
/** Distance encoding range, in canvas pixels. See encode()/decode(). */
const SDF_RANGE = 420;
const SDF_POW = 0.4;

/**
 * Distances are encoded non-linearly. A linear 8-bit encoding over a range wide
 * enough to morph across the canvas (~400px) would quantise to ~3px per step,
 * which shows as lumpy edges. This curve spends most of its precision near the
 * surface — about 0.09px per step at the edge — and coarsens far away, where
 * only the direction of the field matters.
 */
const encode = (d) => {
  const t = Math.min(Math.abs(d) / SDF_RANGE, 1) ** SDF_POW;
  return Math.round(Math.max(0, Math.min(255, (0.5 + 0.5 * Math.sign(d) * t) * 255)));
};

// --------------------------------------------------------------------------
// mask extraction
// --------------------------------------------------------------------------

/**
 * Luminance mask of art drawn on a black ground.
 *
 * The threshold is per-source. The V5 mark must stay at the low default so the
 * baked field reproduces the production artwork exactly. The leaf reference is
 * different: its internal S-band is a soft dark gradient rather than a hard
 * cut, so a low threshold captured only the band's darkest core and the leaf
 * came out with a hairline slit instead of the reference's open channel — which
 * is what made predecessor 1 read as under-resolved.
 */
async function maskOf(file, box, threshold = 26) {
  let p = sharp(file);
  if (box) p = p.extract(box);
  const { data, info } = await p.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const m = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const s = i * channels;
    const lum = 0.299 * data[s] + 0.587 * data[s + 1] + 0.114 * data[s + 2];
    m[i] = lum > threshold ? 1 : 0;
  }
  return { m, width, height };
}

/** Tight bounding box of a mask. */
function bbox({ m, width, height }) {
  let x0 = width, y0 = height, x1 = -1, y1 = -1;
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++)
      if (m[y * width + x]) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
  return { x0, y0, x1, y1, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

/**
 * Splits a vertical lockup into its mark and wordmark by scanning for bands of
 * non-background rows. Mirrors the logo pipeline's own split so the intro and
 * the header are guaranteed to be talking about the same two pieces.
 */
async function splitLockup(file) {
  const { m, width, height } = await maskOf(file);
  const bands = [];
  let start = -1;
  for (let y = 0; y < height; y++) {
    let n = 0;
    for (let x = 0; x < width; x++) if (m[y * width + x]) n++;
    const on = n > 2;
    if (on && start < 0) start = y;
    if ((!on || y === height - 1) && start >= 0) {
      const last = bands[bands.length - 1];
      if (last && start - last[1] < 12) last[1] = y;
      else bands.push([start, y]);
      start = -1;
    }
  }
  const boxes = bands
    .filter(([a, b]) => b - a >= 8)
    .map(([a, b]) => {
      let x0 = width, x1 = 0;
      for (let y = a; y <= b; y++)
        for (let x = 0; x < width; x++)
          if (m[y * width + x]) { if (x < x0) x0 = x; if (x > x1) x1 = x; }
      return { left: x0, top: a, width: x1 - x0 + 1, height: b - a + 1 };
    });
  if (boxes.length !== 2) throw new Error(`${file}: expected mark + wordmark, got ${boxes.length}`);
  return { mark: boxes[0], word: boxes[1] };
}

// --------------------------------------------------------------------------
// hole analysis: which negative spaces are pores, and which are the mark's
// permanent curved cuts
// --------------------------------------------------------------------------

/** 4-way flood fill from the border; anything unreached and unset is a hole. */
function holesOf({ m, width, height }) {
  const outside = new Uint8Array(width * height);
  const stack = [];
  const push = (x, y) => {
    const i = y * width + x;
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    if (outside[i] || m[i]) return;
    outside[i] = 1;
    stack.push(i);
  };
  for (let x = 0; x < width; x++) { push(x, 0); push(x, height - 1); }
  for (let y = 0; y < height; y++) { push(0, y); push(width - 1, y); }
  while (stack.length) {
    const i = stack.pop();
    const x = i % width, y = (i / width) | 0;
    push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
  }
  const holes = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) if (!m[i] && !outside[i]) holes[i] = 1;
  return holes;
}

/**
 * Labels holes and separates the round pores from the large curved separations.
 *
 * The V5 mark's negative space is two different things: the big S-shaped cuts
 * between blades, which are part of the form and must persist, and the round
 * pores, which the intro grows in as structure differentiating out of the
 * material. Area and circularity tell them apart.
 */
function classifyHoles(holes, width, height, shapeArea) {
  const label = new Int32Array(width * height).fill(-1);
  const comps = [];
  for (let i = 0; i < width * height; i++) {
    if (!holes[i] || label[i] >= 0) continue;
    const id = comps.length;
    const px = [];
    const stack = [i];
    label[i] = id;
    while (stack.length) {
      const j = stack.pop();
      px.push(j);
      const x = j % width, y = (j / width) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        const k = ny * width + nx;
        if (holes[k] && label[k] < 0) { label[k] = id; stack.push(k); }
      }
    }
    let sx = 0, sy = 0;
    for (const j of px) {
      sx += j % width;
      sy += (j / width) | 0;
    }
    const area = px.length;
    comps.push({
      id, area, px,
      cx: sx / area, cy: sy / area,
      r: Math.sqrt(area / Math.PI),
      // Area alone is the discriminator. In this artwork the two big S-shaped
      // separations are open to the outside rather than enclosed, so they never
      // reach here at all — every enclosed negative space in the mark IS a pore.
      // The guard stays so a future mark with a closed cut is not mistaken.
      isPore: area < shapeArea * 0.01,
    });
  }
  return comps;
}

// --------------------------------------------------------------------------
// signed distance field (Felzenszwalb squared-EDT, two passes)
// --------------------------------------------------------------------------

const INF = 1e20;

function edt1d(f, n) {
  const d = new Float64Array(n);
  const v = new Int32Array(n);
  const z = new Float64Array(n + 1);
  let k = 0;
  v[0] = 0; z[0] = -INF; z[1] = INF;
  for (let q = 1; q < n; q++) {
    let s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    while (s <= z[k]) {
      k--;
      s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    }
    k++;
    v[k] = q; z[k] = s; z[k + 1] = INF;
  }
  k = 0;
  for (let q = 0; q < n; q++) {
    while (z[k + 1] < q) k++;
    d[q] = (q - v[k]) * (q - v[k]) + f[v[k]];
  }
  return d;
}

/** Euclidean distance (in px) from every pixel to the nearest set pixel. */
function edt(mask, width, height) {
  const f = new Float64Array(Math.max(width, height));
  const g = new Float64Array(width * height);
  for (let i = 0; i < width * height; i++) g[i] = mask[i] ? 0 : INF;
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) f[y] = g[y * width + x];
    const d = edt1d(f, height);
    for (let y = 0; y < height; y++) g[y * width + x] = d[y];
  }
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) f[x] = g[y * width + x];
    const d = edt1d(f, width);
    for (let x = 0; x < width; x++) g[y * width + x] = Math.sqrt(d[x]);
  }
  return g;
}

/** Signed field: negative inside the shape, positive outside. */
function sdf(mask, width, height) {
  const inv = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) inv[i] = mask[i] ? 0 : 1;
  const dOut = edt(mask, width, height);
  const dIn = edt(inv, width, height);
  const s = new Float64Array(width * height);
  for (let i = 0; i < width * height; i++) s[i] = mask[i] ? -dIn[i] : dOut[i];
  return s;
}

/**
 * Resamples a source mask into the shared canvas at a given height fraction,
 * centred. Nearest sampling is fine: the field is computed after placement, so
 * the distance transform smooths the result anyway.
 */
function place(src, box, heightFraction) {
  const target = new Uint8Array(W * H);
  const scale = (H * heightFraction) / box.h;
  const dw = box.w * scale;
  const dh = box.h * scale;
  const ox = (W - dw) / 2;
  const oy = (H - dh) / 2;
  for (let y = 0; y < H; y++) {
    const sy = Math.round(box.y0 + (y - oy) / scale);
    if (sy < box.y0 || sy > box.y1) continue;
    for (let x = 0; x < W; x++) {
      const sx = Math.round(box.x0 + (x - ox) / scale);
      if (sx < box.x0 || sx > box.x1) continue;
      if (src.m[sy * src.width + sx]) target[y * W + x] = 1;
    }
  }
  return target;
}

// --------------------------------------------------------------------------
// build
// --------------------------------------------------------------------------

await mkdir(out("intro"), { recursive: true });
await mkdir(out("brand"), { recursive: true });

const LOGO = ref("sayfer bio logo v5 dark edition.png");
const { mark, word } = await splitLockup(LOGO);
console.log("v5 mark", mark, "wordmark", word);

// The mark and the wordmark as separate assets. The intro presents the vertical
// lockup and then recomposes it into the header's horizontal one, so it needs
// the two pieces independently — and the final lock must be the real artwork.
// Sized for what the intro actually paints: the mark tops out around 430 CSS
// px tall, so ~940px covers a 2x display and comfortably covers 3x on the
// smaller mobile composition. Oversizing these costs first-visit latency,
// which is time the visitor spends looking at a black screen.
await sharp(LOGO).extract(mark).resize(null, 940).png().toFile(out("brand/v5-mark.png"));
await sharp(LOGO).extract(word).resize(900, null).png().toFile(out("brand/v5-wordmark.png"));

// Black -> alpha, matching the logo pipeline, so both sit on the site's chrome
// without painting a box. (Same maths as scripts/prepare-assets.mjs.)
async function blackToAlpha(file, outFile) {
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const px = info.width * info.height;
  const rgba = Buffer.alloc(px * 4);
  for (let i = 0; i < px; i++) {
    const s = i * info.channels;
    const r = data[s], g = data[s + 1], b = data[s + 2];
    const a = Math.max(r, g, b);
    rgba[i * 4] = a === 0 ? 0 : Math.min(255, Math.round((r * 255) / a));
    rgba[i * 4 + 1] = a === 0 ? 0 : Math.min(255, Math.round((g * 255) / a));
    rgba[i * 4 + 2] = a === 0 ? 0 : Math.min(255, Math.round((b * 255) / a));
    rgba[i * 4 + 3] = a;
  }
  const r = await sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } })
    .webp({ quality: 92, alphaQuality: 100 })
    .toFile(out(outFile));
  console.log(`wrote ${outFile} (${r.width}x${r.height})`);
  return r;
}
const markAsset = await blackToAlpha(out("brand/v5-mark.png"), "brand/v5-mark.webp");
const wordAsset = await blackToAlpha(out("brand/v5-wordmark.png"), "brand/v5-wordmark.webp");

// --- the three fields ------------------------------------------------------
const cellSrc = await maskOf(ref("sayfer bio v5 animation predecessor0.png.png"));
const leafSrc = await maskOf(ref("Sayfer Bio V5 Animation Predecessor1.png.png"), null, 72);
const v5Src = await maskOf(LOGO, mark);

const cellBox = bbox(cellSrc);
const leafBox = bbox(leafSrc);
const v5Box = bbox(v5Src);
console.log("boxes", { cellBox, leafBox, v5Box });

// The cell reads as a suspended ball, the leaf and the mark as tall forms, so
// they are placed at their story proportions rather than each normalised to the
// full canvas — that difference IS the "elongate vertically" beat.
const cellM = place(cellSrc, cellBox, 0.42);
const leafM = place(leafSrc, leafBox, 0.86);

// The higher leaf threshold that opens the S-channel also catches a few stray
// dark specks inside the blade, which render as pinholes in the membrane. The
// channel itself is open to the outside, so filling small ENCLOSED holes cleans
// the specks without touching it.
{
  const holes = holesOf({ m: leafM, width: W, height: H });
  let cleaned = 0;
  for (const c of classifyHoles(holes, W, H, Infinity)) {
    if (c.area > 90) continue;
    for (const j of c.px) leafM[j] = 1;
    cleaned++;
  }
  console.log(`leaf: filled ${cleaned} speck holes`);
}
const v5M = place(v5Src, v5Box, 0.92);

// Separate the mark's pores from its permanent curved cuts.
let shapeArea = 0;
for (let i = 0; i < W * H; i++) if (v5M[i]) shapeArea++;
const comps = classifyHoles(holesOf({ m: v5M, width: W, height: H }), W, H, shapeArea);
const pores = comps.filter((c) => c.isPore);
const cuts = comps.filter((c) => !c.isPore);
console.log(
  `holes: ${comps.length} (${pores.length} pores, ${cuts.length} kept as permanent cuts)`,
);


// Base = the mark with its pores filled. The permanent cuts stay open.
const v5Filled = Uint8Array.from(v5M);
for (const c of pores) for (const j of c.px) v5Filled[j] = 1;
// Pore mask on its own, so the shader can grow them in with one field.
const poreMask = new Uint8Array(W * H);
for (const c of pores) for (const j of c.px) poreMask[j] = 1;
const maxPoreR = pores.reduce((a, c) => Math.max(a, c.r), 0);

const fCell = sdf(cellM, W, H);
const fLeaf = sdf(leafM, W, H);
const fV5 = sdf(v5Filled, W, H);
const fPore = sdf(poreMask, W, H);

const atlas = Buffer.alloc(W * H * 4);
for (let i = 0; i < W * H; i++) {
  atlas[i * 4] = encode(fCell[i]);
  atlas[i * 4 + 1] = encode(fLeaf[i]);
  atlas[i * 4 + 2] = encode(fV5[i]);
  atlas[i * 4 + 3] = encode(fPore[i]);
}
// Lossless WebP, not PNG: the payload is four channels of distance data where
// a single wrong byte is a visible kink in a silhouette, so lossy is out — but
// lossless WebP still returns the exact bytes for meaningfully fewer of them.
const atlasOut = await sharp(atlas, { raw: { width: W, height: H, channels: 4 } })
  .webp({ lossless: true, effort: 6 })
  .toFile(out("intro/sdf-atlas.webp"));
console.log(`wrote intro/sdf-atlas.webp (${W}x${H}, ${(atlasOut.size / 1024).toFixed(0)} KB)`);

// --- palette ramp sampled from the real mark -------------------------------
// The intro's material is procedural, so its colours are taken from the
// artwork itself rather than invented: the mark's mean lit colour at each of a
// few heights, which reproduces the yellow -> lime -> teal descent exactly.
const markRaw = await sharp(LOGO).extract(mark).raw().toBuffer({ resolveWithObject: true });
const STOPS = 6;
const ramp = [];
for (let s = 0; s < STOPS; s++) {
  const y0 = Math.floor((s / STOPS) * markRaw.info.height);
  const y1 = Math.floor(((s + 1) / STOPS) * markRaw.info.height);
  let r = 0, g = 0, b = 0, n = 0;
  for (let y = y0; y < y1; y++)
    for (let x = 0; x < markRaw.info.width; x++) {
      const i = (y * markRaw.info.width + x) * markRaw.info.channels;
      const lum = 0.299 * markRaw.data[i] + 0.587 * markRaw.data[i + 1] + 0.114 * markRaw.data[i + 2];
      if (lum < 60) continue;
      r += markRaw.data[i]; g += markRaw.data[i + 1]; b += markRaw.data[i + 2]; n++;
    }
  ramp.push(n ? [r / n / 255, g / n / 255, b / n / 255].map((v) => +v.toFixed(4)) : [0, 0, 0]);
}

// The intermediate PNGs exist only to feed the black-to-alpha pass.
await rm(out("brand/v5-mark.png"), { force: true });
await rm(out("brand/v5-wordmark.png"), { force: true });

const markScale = (H * 0.92) / v5Box.h;
const data = {
  atlas: { width: W, height: H, range: SDF_RANGE, pow: SDF_POW },
  // Where the V5 mark sits inside the shared canvas, in 0..1 canvas units. The
  // intro hands off to a real <img> of the mark, so it has to know exactly
  // which sub-rectangle of the canvas that image occupies.
  markRect: {
    x: (W - v5Box.w * markScale) / 2 / W,
    y: (H - H * 0.92) / 2 / H,
    w: (v5Box.w * markScale) / W,
    h: 0.92,
  },
  maxPoreRadius: +maxPoreR.toFixed(3),
  poreCount: pores.length,
  ramp,
  assets: {
    atlas: "/intro/sdf-atlas.webp",
    mark: { src: "/brand/v5-mark.webp", width: markAsset.width, height: markAsset.height },
    wordmark: { src: "/brand/v5-wordmark.webp", width: wordAsset.width, height: wordAsset.height },
  },
};

await writeFile(out("intro/intro-data.json"), JSON.stringify(data, null, 2));

// Emitted as a module, not only as JSON, so the intro has its geometry and
// palette the moment its code runs. Fetching them cost two serial round trips
// before the first frame could be drawn — time the visitor spends on a black
// screen, which is the one part of this sequence that should be shortest.
const lockup = JSON.parse(await readFile(out("brand/v5-lockup.json"), "utf8"));
await writeFile(
  join(root, "components", "intro", "introData.generated.ts"),
  `/**
` +
    ` * GENERATED by scripts/prepare-intro-assets.mjs — do not edit.
` +
    ` * Run \`node scripts/prepare-assets.mjs && node scripts/prepare-intro-assets.mjs\`.
` +
    ` */

` +
    `export const INTRO_DATA = ${JSON.stringify(data, null, 2)} as const;

` +
    `export const LOCKUP = ${JSON.stringify(lockup, null, 2)} as const;
`,
);
console.log("wrote components/intro/introData.generated.ts");
