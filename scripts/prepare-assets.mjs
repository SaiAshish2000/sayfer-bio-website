/**
 * Generates web-ready assets from the untouched originals in `references/`.
 * Originals are never modified. Run: `node scripts/prepare-assets.mjs`
 */
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ref = (f) => join(root, "references", f);
const out = (f) => join(root, "public", f);

// Adviser portraits use the founder-supplied cleaned/upscaled watermark-free
// versions (the earlier files are retained only as references/old-team-images).
// Their on-disk names carry a double extension exactly as supplied; the
// originals are never renamed or modified.
const team = [
  ["Sai Ashish Sarvasetty.png", "team/sai-ashish-sarvasetty"],
  ["dipesh-lad.webp.png", "team/dipesh-lad"],
  ["heidi-coia.webp.png", "team/heidi-coia"],
  ["paula-elbl.webp.png", "team/paula-elbl"],
  ["cyrus-karimy.webp.png", "team/cyrus-karimy"],
];

await mkdir(out("team"), { recursive: true });
await mkdir(out("brand"), { recursive: true });

// Team portraits: 4:5 crop, neutral desaturated grade handled in CSS, ~900px wide.
for (const [src, base] of team) {
  await sharp(ref(src))
    .rotate()
    .resize(900, 1125, { fit: "cover", position: "top" })
    .webp({ quality: 82 })
    .toFile(out(`${base}.webp`));
  console.log("wrote", `${base}.webp`);
}

// Logo. The approved production artwork is V5, supplied in two editions --
// one drawn on black, one on white -- as a VERTICAL lockup: the bio-mark
// stacked above the "SAYFER BIO" wordmark.
//
// Site chrome is horizontal (a 72px nav row, a footer column), and the vertical
// lockup rendered at header height would put the wordmark at ~2px. So the two
// parts the artwork already contains are separated and set side by side. This
// is a relayout, not a redraw: each part is extracted at its own bounding box
// and keeps its own proportions, colours and gradients untouched. Only the
// relative scale of wordmark to mark changes, which is what any vertical ->
// horizontal lockup requires.
//
//   on-light = the white-edition artwork, for light/white surfaces
//   on-dark  = the black-edition artwork, for dark/near-black surfaces
const MARK_H = 900;        // mark height in the generated asset
const WORD_RATIO = 0.3;    // wordmark height as a fraction of the mark's
const GAP_RATIO = 0.26;    // space between mark and wordmark
const PAD_RATIO = 0.04;    // even breathing room around the whole lockup
const LOGO_WIDTH = 1400;   // delivered asset width

/**
 * Locates the mark and the wordmark inside a vertical lockup by scanning for
 * horizontal bands of non-background pixels, then returns each one's tight
 * bounding box. Derived from the artwork itself rather than hard-coded, so the
 * two editions -- which differ in canvas size and margin -- both resolve
 * correctly.
 */
async function splitLockup(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;
  const bg = [data[0], data[1], data[2]];
  const lit = (x, y) => {
    const s = (y * W + x) * C;
    return (
      Math.abs(data[s] - bg[0]) + Math.abs(data[s + 1] - bg[1]) + Math.abs(data[s + 2] - bg[2]) > 40
    );
  };

  const bands = [];
  let start = -1;
  for (let y = 0; y < H; y++) {
    let n = 0;
    for (let x = 0; x < W; x++) if (lit(x, y)) n++;
    const on = n > 2;
    if (on && start < 0) start = y;
    if ((!on || y === H - 1) && start >= 0) {
      const last = bands[bands.length - 1];
      // Bridge the sub-pixel gaps inside a single element (e.g. the mark's
      // detached top droplet) without merging mark into wordmark.
      if (last && start - last[1] < 12) last[1] = y;
      else bands.push([start, y]);
      start = -1;
    }
  }

  const boxes = bands
    .filter(([a, b]) => b - a >= 8)
    .map(([a, b]) => {
      let x0 = W, x1 = 0;
      for (let y = a; y <= b; y++)
        for (let x = 0; x < W; x++)
          if (lit(x, y)) { if (x < x0) x0 = x; if (x > x1) x1 = x; }
      return { left: x0, top: a, width: x1 - x0 + 1, height: b - a + 1 };
    });

  if (boxes.length !== 2) {
    throw new Error(`${file}: expected a mark + wordmark, found ${boxes.length} elements`);
  }
  const [mark, word] = boxes;
  return { bg, mark, word };
}

async function buildLogo(srcFile, outFile, blackToAlpha = false) {
  const { bg, mark, word } = await splitLockup(ref(srcFile));

  const markW = Math.round((mark.width / mark.height) * MARK_H);
  const wordH = Math.round(MARK_H * WORD_RATIO);
  const wordW = Math.round((word.width / word.height) * wordH);
  const gap = Math.round(MARK_H * GAP_RATIO);
  const pad = Math.round(MARK_H * PAD_RATIO);

  const markBuf = await sharp(ref(srcFile)).extract(mark).resize(markW, MARK_H).toBuffer();
  const wordBuf = await sharp(ref(srcFile)).extract(word).resize(wordW, wordH).toBuffer();

  const width = pad * 2 + markW + gap + wordW;
  const height = pad * 2 + MARK_H;

  // Composed and flushed to a buffer before anything else: sharp applies resize
  // ahead of composite within one pipeline, which would shrink the canvas out
  // from under the parts being placed on it.
  const composed = await sharp({
    create: { width, height, channels: 3, background: { r: bg[0], g: bg[1], b: bg[2] } },
  })
    .composite([
      { input: markBuf, left: pad, top: pad },
      // Optical centring: the wordmark is all-caps, so its bounding box is its
      // cap height and geometric centring reads correctly against the mark.
      { input: wordBuf, left: pad + markW + gap, top: Math.round((height - wordH) / 2) },
    ])
    .png()
    .toBuffer();

  let pipeline = sharp(composed).resize(LOGO_WIDTH, null, { withoutEnlargement: true });

  if (blackToAlpha) {
    // The dark edition ships on opaque black, which paints a visible box on the
    // site's near-black chrome -- and no single CSS backdrop works, because the
    // nav is transparent at rest, translucent when scrolled, and solid in the
    // footer.
    //
    // So carry the black in the alpha channel instead: alpha = max(R,G,B) and
    // the colour is un-premultiplied by that same factor. Compositing then
    // gives result = S + (1 - alpha) * backdrop, i.e. the artwork EXACTLY as
    // drawn plus at most the backdrop's own ~3% luminance. Flat black becomes
    // alpha 0 and disappears; the glow falloff stays perfectly smooth with no
    // keying halo. Colour relationships are untouched -- over a dark surface
    // this renders identically to the supplied artwork.
    const { data, info } = await pipeline.raw().toBuffer({ resolveWithObject: true });
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
    pipeline = sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } });
  }

  const out_ = await pipeline.webp({ quality: 92, alphaQuality: 100 }).toFile(out(outFile));
  console.log(`wrote ${outFile} (${out_.width}x${out_.height})`);
  return out_;
}

await buildLogo("sayfer bio logo v5 white edition.png", "brand/sayfer-bio-logo-on-light.webp");
const darkLogo = await buildLogo("sayfer bio logo v5 dark edition.png", "brand/sayfer-bio-logo-on-dark.webp", true);

// Where the mark and the wordmark sit INSIDE the composed header lockup, in
// 0..1 of that image. The intro animation lands its own mark and wordmark on
// the real header logo, so it needs the two sub-rectangles; deriving them here,
// from the same constants that place them, is what keeps the handoff exact if
// the composition is ever retuned.
{
  const { mark, word } = await splitLockup(ref("sayfer bio logo v5 dark edition.png"));
  const markW = Math.round((mark.width / mark.height) * MARK_H);
  const wordH = Math.round(MARK_H * WORD_RATIO);
  const wordW = Math.round((word.width / word.height) * wordH);
  const gap = Math.round(MARK_H * GAP_RATIO);
  const pad = Math.round(MARK_H * PAD_RATIO);
  const w = pad * 2 + markW + gap + wordW;
  const h = pad * 2 + MARK_H;
  const r = (x, y, ww, hh) => ({
    x: +(x / w).toFixed(6), y: +(y / h).toFixed(6),
    w: +(ww / w).toFixed(6), h: +(hh / h).toFixed(6),
  });
  await writeFile(
    out("brand/v5-lockup.json"),
    JSON.stringify(
      {
        composed: { width: darkLogo.width, height: darkLogo.height },
        mark: r(pad, pad, markW, MARK_H),
        wordmark: r(pad + markW + gap, (h - wordH) / 2, wordW, wordH),
        /** Vertical-lockup proportions, expressed against the mark's height. */
        vertical: {
          markAspect: +(mark.width / mark.height).toFixed(6),
          wordmarkAspect: +(word.width / word.height).toFixed(6),
          wordmarkHeight: +(word.height / mark.height).toFixed(6),
          gap: +((word.top - (mark.top + mark.height)) / mark.height).toFixed(6),
        },
      },
      null,
      2,
    ),
  );
  console.log("wrote brand/v5-lockup.json");
}

// Scaffold macro slice for the About page's STRUCTURE stage. Derived from the
// APPROVED scaffold render (artifacts/playwright/scaffold-v2-final-close.png,
// itself a native 1:1 capture of the approved Our Scaffold route) so About can
// show real material without loading the 2.95MB flagship GLB. Crop + resize
// only -- the render is not retouched.
{
  const src = join(root, "artifacts", "playwright", "scaffold-v2-final-close.png");
  const m = await sharp(src).metadata();
  const side = Math.round(Math.min(m.width, m.height) * 0.78);
  await sharp(src)
    .extract({
      left: Math.round((m.width - side) / 2),
      top: Math.round((m.height - side) / 2),
      width: side,
      height: side,
    })
    .resize(720, 720)
    .webp({ quality: 82 })
    .toFile(out("brand/scaffold-macro.webp"));
  console.log("wrote brand/scaffold-macro.webp (720x720)");
}

// Reference stills used as in-page imagery (scaffold form, spindle form).
await sharp(ref("SCAFFOLD REFERENCE IMAGE.png"))
  .resize(1400, null, { withoutEnlargement: true })
  .webp({ quality: 80 })
  .toFile(out("brand/scaffold-reference.webp"));
await sharp(ref("SPINDLE REFERENCE IMAGE.png"))
  .resize(1400, null, { withoutEnlargement: true })
  .webp({ quality: 80 })
  .toFile(out("brand/spindle-reference.webp"));
console.log("wrote reference stills");
