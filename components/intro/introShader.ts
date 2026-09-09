/**
 * Intro shader: one evolving membrane, rendered from interpolated signed
 * distance fields.
 *
 * Why SDFs rather than sprites or meshes. The brief is that the cell, the leaf
 * and the V5 mark must read as ONE organism changing, not three pictures
 * cross-fading. Mixing two distance fields produces a real intermediate
 * silhouette — volume redistributes, features grow and retract continuously —
 * which is exactly the perception required. The three fields are baked from the
 * approved artwork itself (scripts/prepare-intro-assets.mjs), so the last frame
 * IS the production mark rather than a redraw of it.
 *
 * THE TWIST IS RETIRED BY THE BLEND. All states are sampled in one frame whose
 * twist angle decays as `1 - uT2`, so at the end of the differentiation the
 * angle is exactly zero and the field is exactly the production mark. Two
 * earlier cuts both failed here: unwinding the twist as a separate later move
 * read as the logo correcting itself into place, and sampling the mark in its
 * own untwisted frame put the two fields in different coordinate systems, so
 * their channels cross-faded past each other instead of travelling. One frame
 * keeps the leaf's channel and the mark's in correspondence, so the line moves
 * rather than jumps — and the torsion still ends at exactly zero.
 *
 * All distances below are in atlas pixels. The atlas packs:
 *   R cell    G leaf    B V5 with pores filled    A the pores alone
 */

export const VERT = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

export const FRAG = `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 outColor;

uniform sampler2D uAtlas;
uniform vec2  uAtlasSize;   // atlas pixels
uniform float uPad;         // canvas box / atlas box, leaves room for the glow
uniform float uScale;       // screen px per atlas px
uniform float uRange;       // distance encoding range
uniform float uInvPow;      // 1 / encoding exponent

uniform float uT1;          // cell -> leaf
uniform float uT2;          // leaf -> V5
uniform float uTwist;       // torsion, radians at the ends
uniform float uWarp;        // living-membrane domain warp, atlas px
uniform float uFold;        // living-membrane surface relief (normal only)
/**
 * Emergence, as a SCALE on the sampled form (0 -> nothing, 1 -> full size).
 *
 * This used to be a distance offset that eroded the field away. Erosion is not
 * linear in apparent size, and worse, it does nothing at all until the offset
 * drops below the shape's maximum interior depth — so the first 40% of the beat
 * showed no body, and then most of the final size arrived in about 90ms. That
 * step was the visible pop. A scale is exactly proportional at every instant.
 */
uniform float uEmerge;
uniform float uPore;        // 0 = pores closed, 1 = fully open
uniform float uGlow;        // luminous bloom of the living material
/**
 * Fraction of the canvas height the colour ramp is stretched across.
 *
 * The palette runs yellow at the top to teal at the bottom OF THE FORM. Mapping
 * it to the canvas instead meant the cell — which occupies only the middle
 * ~40% — sampled nothing but the greens, and read as a flat green ball rather
 * than as the same material as the finished mark. Tracking the form's own
 * extent lets every state show the whole palette.
 */
uniform float uColorSpan;
uniform float uTime;
uniform float uFade;        // global opacity

uniform vec3  uRamp[6];

/** --color-void, so the canvas is invisible against the overlay behind it. */
const vec3 VOID = vec3(7.0 / 255.0, 9.0 / 255.0, 8.0 / 255.0);

/** Widest pore radius in the mark, in atlas px. Sets the erosion range. */
const float PORE_R = 11.0;

/** Full-life warp amplitude, used to normalise the life ramp. */
const float WARP_REF = 13.0;

/**
 * Distances are stored with precision concentrated near the surface, so decode
 * is the inverse of that curve. See encode() in the asset script.
 */
float decode(float e) {
  float s = e - 0.5;
  return sign(s) * uRange * pow(abs(s) * 2.0, uInvPow);
}

/** Cheap value noise, used only for the membrane's living surface. */
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x),
             mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  return noise(p) * 0.62 + noise(p * 2.13 + 7.3) * 0.28 + noise(p * 4.31 + 19.1) * 0.10;
}
/** Two octaves only — used for the silhouette, where the third reads as crinkle
 *  rather than as the large soft folds a membrane under tension actually makes. */
float fbm2(vec2 p) {
  return noise(p) * 0.70 + noise(p * 2.07 + 7.3) * 0.30;
}

/**
 * Smooth, non-repeating fold field.
 *
 * Value noise leaves faint grid structure at the scale these folds need, and
 * differentiating it for a normal turns that structure into visible chevrons —
 * scratches on the membrane rather than folds in it. A small sum of
 * incommensurate sinusoids has no grid to reveal and is smooth to every
 * derivative, which is exactly what a surface under tension looks like.
 */
float folds(vec2 p) {
  return 0.50 * sin(p.x * 1.00 + p.y * 0.63)
       + 0.32 * sin(p.x * -0.71 + p.y * 1.49 + 1.7)
       + 0.21 * sin(p.x * 1.87 - p.y * 0.97 + 4.1)
       + 0.13 * sin(p.x * 0.43 + p.y * 2.31 + 2.6);
}

/**
 * The membrane's fold field: two octaves of the above.
 *
 * ONE field now drives both the silhouette displacement and the surface
 * shading. They used to be separate fields, at different scales, drifting at
 * different rates — so the lumps in the outline and the folds in the shading
 * crawled independently of each other, which is what read as procedural noise
 * rather than as one soft body. Displacing along this field's own gradient
 * makes the outline's lumps and the surface's folds the same structure.
 */
float foldField(vec2 p) {
  return folds(p) + 0.42 * folds(p * 2.15 + 11.3);
}

vec3 ramp(float t) {
  t = clamp(t, 0.0, 1.0) * 5.0;
  float i = floor(t);
  float f = t - i;
  int k = int(i);
  return mix(uRamp[k], uRamp[min(k + 1, 5)], f);
}

/**
 * Samples the field atlas, extending it analytically outside its canvas.
 * Clamping the texture instead would smear the border column across the frame
 * whenever the twist pushes a sample past the edge.
 */
vec4 fieldAt(vec2 q, out float outside) {
  vec2 uv = 0.5 + q / uAtlasSize;
  vec2 uvc = clamp(uv, 0.0, 1.0);
  outside = length((uv - uvc) * uAtlasSize);
  return texture(uAtlas, uvc);
}

/**
 * The blended shape at a point, in atlas pixels, WITHOUT the pores.
 *
 * Split out for two reasons. It lets the surface normal come from real samples
 * rather than screen derivatives, and — more importantly — it keeps the pores
 * out of the field the normal is taken from. Subtracting them with max() is
 * correct for the silhouette but it clamps the distance everywhere the pore
 * field is nearer than the body's own surface, which here was almost the entire
 * interior: the mark's pore layout was being embossed into every state,
 * including the cell, as fixed chevron creases that no amount of tuning the
 * warp or the relief could remove.
 */
float shapeAt(vec2 q) {
  float outside;
  vec4 f = fieldAt(q, outside);
  return mix(mix(decode(f.r), decode(f.g), uT1), decode(f.b), uT2) + outside;
}

/** The pore cut at a point: positive where material should be removed. */
float poreAt(vec2 q, float open) {
  float outside;
  vec4 f = fieldAt(q, outside);
  return -(decode(f.a) + outside + PORE_R * 1.25 * (1.0 - open));
}

void main() {
  // Canvas uv -> atlas pixel coordinates, centred on the form.
  // Emergence is a scale on the sample space, applied before anything else, so
  // the silhouette, the folds, the glow and the shading all grow together in
  // exact proportion — the form is a true miniature of itself at every moment.
  //
  // The surface-tension breathing is folded into that SAME scale rather than
  // applied as a second multiply inside the warp branch. As a separate multiply
  // it switched on at full strength the instant the warp became non-zero, which
  // stepped the apparent size by just over a percent in a single frame. One
  // scale, ramped by the same life factor as everything else, cannot step.
  float life = clamp(uWarp / WARP_REF, 0.0, 1.0);
  float breathe = 1.0 - (sin(uTime * 0.62) * 0.010 + sin(uTime * 0.39 + 1.9) * 0.006) * life;
  vec2 qBase = ((vUv - 0.5) * uPad) * uAtlasSize / max(uEmerge * breathe, 0.02);
  vec2 qColor = qBase;   // undeformed, so the colour flow stays continuous

  // The fold field, evaluated once. Its gradient displaces the silhouette; its
  // value shades the surface. Both uses below read exactly these numbers.
  float ft = uTime * 0.34;
  vec2 fp = qBase * 0.0105 + vec2(ft * 0.5, -ft * 0.31);
  const float FE = 0.10;
  float fc = foldField(fp);
  vec2 fgrad = vec2(foldField(fp + vec2(FE, 0.0)) - fc,
                    foldField(fp + vec2(0.0, FE)) - fc);

  // --- living membrane -----------------------------------------------------
  // Slow, large-scale domain warp, so the silhouette flexes and folds rather
  // than wobbling. Two scales drifting at different rates and directions, so
  // the motion never repeats or settles into a visible loop.
  // The silhouette flexes along the fold field's gradient, so the outline's
  // lumps sit exactly where the shading's folds are. Every term scales with
  // uWarp from zero, so there is no branch left that can switch anything on.
  vec2 qLive = qBase + fgrad * uWarp * 10.0;
  // an extremely restrained suspended float
  qLive.y -= sin(uTime * 0.41) * uWarp * 0.34;

  // --- torsion -------------------------------------------------------------
  // The form is twisted about its own long axis: the top rotates one way, the
  // bottom the other, and the middle carries the opposing forces. Rotating a
  // slice by theta foreshortens it, so the field is sampled at x / cos(theta) —
  // the silhouette pinches where the twist passes through a quarter turn, which
  // is what produces the V5 mark's interleaved blades.
  // The angle is scaled by (1 - uT2): the differentiation itself releases the
  // torsion, so there is never a separate unwind and the final field is the
  // mark exactly.
  float twist = uTwist * (1.0 - uT2);
  float theta = 0.0;
  vec2 qTw = qLive;
  if (abs(twist) > 0.0005) {
    float yn = clamp(qLive.y / (uAtlasSize.y * 0.5), -1.0, 1.0);
    // Eased along y, so the rotation is carried by the ends and the middle is
    // where the two directions meet, instead of the angle ramping flatly.
    theta = twist * sign(yn) * smoothstep(0.0, 1.0, abs(yn)) * abs(yn);
    qTw.x /= max(cos(theta), 0.17);
    // A rotating slice whose mass is off the axis also swings sideways, and
    // that opposing sway at the two ends is what makes the motion read as a
    // twist rather than as a waist simply pinching in.
    qTw.x -= sin(theta) * 26.0;
  }

  // --- pores ---------------------------------------------------------------
  // Differentiation spreading through the material rather than a texture being
  // switched on. The pore field is eroded to nothing and released, and the
  // release is staggered two ways: outward from the middle, where the twist is
  // doing the most work, and by a low-frequency noise so neighbouring pores
  // never open in lockstep.
  float yn2 = clamp(abs(qColor.y) / (uAtlasSize.y * 0.5), 0.0, 1.0);
  float stagger = yn2 * 0.42 + fbm(qColor * 0.026) * 0.34;
  float open = smoothstep(0.0, 1.0, clamp((uPore * 1.9 - stagger) / 0.85, 0.0, 1.0));

  // The body, and the pores cut out of it. The silhouette uses both; everything
  // that shades the surface uses the body alone.
  float dShape = shapeAt(qTw);
  float carve = poreAt(qTw, open);
  float d = max(dShape, carve);

  // --- shading -------------------------------------------------------------
  // The normal comes from four real samples on a wide baseline, not from screen
  // derivatives of the decoded distance. The field is 8-bit with its precision
  // concentrated near the surface, so a pixel-scale derivative reads the
  // quantisation steps rather than the surface: it terraced along the iso-lines
  // and drew chevron creases across the body. Differencing over several atlas
  // pixels averages the steps away and leaves the actual shape.
  const float E = 2.6;
  vec2 g = vec2(
    shapeAt(qTw + vec2(E, 0.0)) - shapeAt(qTw - vec2(E, 0.0)),
    shapeAt(qTw + vec2(0.0, E)) - shapeAt(qTw - vec2(0.0, E))
  );
  float gl = length(g);
  vec2 n2 = gl > 1e-6 ? g / gl : vec2(0.0, 1.0);

  // Note: occlusion is NOT taken from this field's curvature. A Laplacian is a
  // second derivative and amplifies the atlas's 8-bit quantisation far more
  // than the gradient does — it came back as a fine moire across the body. The
  // fold field below is analytic, and its valleys already ARE the concavities,
  // so the shadow pockets are derived from that instead.

  // Roughly a one-screen-pixel transition. The previous band was about twice
  // that, which read as softness on the leaf's silhouette and its channel.
  float aa = max(0.62 / uScale, 0.4);
  float alpha = 1.0 - smoothstep(-aa, aa, d);

  // Depth into the form, used to round the membrane toward its edge. From the
  // body, so a pore does not read as a thin spot in the material around it.
  float depth = clamp(-dShape / 26.0, 0.0, 1.0);
  float bulge = sqrt(depth);

  // Membrane relief. Perturbing only the NORMAL gives folds that catch the
  // light across the body without disturbing the silhouette — which is the
  // difference between a living membrane and a shaded pebble.
  // The same gradient that bends the silhouette also tilts the surface, so a
  // lump in the outline and the fold shading on it are one feature rather than
  // two that happen to overlap.
  vec2 relief = fgrad * uFold * 2.4;
  // Folds shade the body directly as well as through the normal, and they do it
  // ASYMMETRICALLY. A valley loses more light than a crest gains, because a
  // crease occludes itself — that imbalance is what reads as a shadow pocket
  // under a fold rather than as a symmetrical ripple.
  float k = clamp(uFold * 0.040, 0.0, 0.26);
  float foldLum = max(fc, 0.0) * k * 0.55 - max(-fc, 0.0) * k * 2.05;
  // Normalised, not the raw fold amount: sheen is a 0..1 weight, and feeding the
  // relief strength straight in multiplied the highlight several times over and
  // blew it out to white.
  float sheenAmt = clamp(uFold * 0.28, 0.0, 1.0);

  // Tilting the normal with the local twist angle sweeps the highlight across
  // the form as it rotates — the second cue, after the sway, that this is a
  // surface turning rather than a silhouette changing width.
  vec3 n = normalize(vec3(
    -n2 * (1.0 - bulge) + relief * depth + vec2(sin(theta) * 0.40, 0.0),
    bulge * 0.9 + 0.16
  ));

  // Key from the upper left, agreeing with the artwork's own light.
  vec3 L = normalize(vec3(-0.45, 0.62, 0.64));
  vec3 V = vec3(0.0, 0.0, 1.0);
  // Less wrap than before. A near-flat wrap term put most of the surface into a
  // narrow bright band where every additive term then clipped together, which
  // is what flattened the mass and hid its folds.
  float diff = clamp(dot(n, L) * 0.66 + 0.34, 0.0, 1.0);
  float refl = max(dot(reflect(-L, n), V), 0.0);
  // Two lobes. The tight one is the wet catch-light; the broad one is its
  // rolloff. A single narrow lobe reads as a hard dot pasted on the surface,
  // which is the opposite of the soft studio falloff the reference shows.
  float spec = pow(refl, 72.0);
  float broad = pow(refl, 20.0);
  float sheen = pow(refl, 9.0);

  // Colour is a function of undeformed position, so the same material appears
  // to flow through every state instead of being repainted per state.
  // qColor is already in the emergence-scaled space, so the ramp's extent has to
  // be too — otherwise the form only samples the middle of the palette while it
  // is still small, and comes up flat green before turning yellow-to-teal.
  float span = uColorSpan / max(uEmerge, 0.02);
  float cy = clamp(qColor.y / (uAtlasSize.y * span) + 0.5, 0.0, 1.0);
  float cx = clamp(qColor.x / (uAtlasSize.x * max(span * 1.6, 0.5)) + 0.5, 0.0, 1.0);
  vec3 base = ramp(1.0 - cy - (cx - 0.5) * 0.16);

  // Budgeted so the sum sits near 1.0x base rather than roughly 2.3x. Every
  // term used to add on top of an already saturated ramp colour, so the whole
  // lit side clipped and the fold structure disappeared into flat green.
  vec3 col = base * (0.26 + 0.55 * diff);
  col *= 1.0 + foldLum;                                // fold light and shade
  col += base * pow(1.0 - depth, 2.6) * 0.19;          // interior light bleed
  col += mix(base, vec3(0.92, 1.0, 0.86), 0.30) * sheen * 0.20 * sheenAmt;
  col += mix(base, vec3(0.90, 1.0, 0.88), 0.55) * broad * 0.105 * sheenAmt;
  col += vec3(0.85, 1.0, 0.82) * spec * 0.165;         // membrane gloss
  col += base * smoothstep(0.13, 0.0, depth) * 0.24;   // edge tension

  // Bloom around the living material.
  //
  // This is retired as the mark resolves, for two reasons. Visually, the glow
  // belongs to wet biological material and not to a finished logo. Structurally,
  // an isotropic bloom also bleeds INTO the form's own concavities: it was
  // filling the S-channels and the pores with about a third of the body colour,
  // which is what made the channels read as too narrow and the pores as soft
  // stamps. It is also why the hand-over to the artwork showed a ghost — the
  // shader carried a halo the flat artwork does not have.
  // Tighter and much weaker than before: the form should read as lit material,
  // not as a light source.
  float glow = exp(-max(d, 0.0) * 0.145) * uGlow;

  vec3 rgb = col * alpha + base * glow * (1.0 - alpha);

  // Highlight rolloff. Clipping is what destroys fold detail: once two channels
  // pin at 1.0 the surface goes flat and the hue shifts. Compressing on the max
  // channel keeps saturation while giving the brightest areas somewhere to go,
  // so the folds stay legible through the peak of the light.
  // A firmer shoulder than before. The peak was measuring 244/255, which is
  // close enough to clipping that the brightest folds were still flattening.
  // A firmer shoulder with the mid-tone restore trimmed to match: this takes
  // the top off the brightest yellow ridges without lifting or flattening the
  // body, so the fold valleys keep their full depth.
  float peak = max(rgb.r, max(rgb.g, rgb.b));
  rgb *= 1.0 / (1.0 + peak * 0.78);
  rgb *= 1.30;   // restore mid-tone level after the compression
  // The canvas is opaque, so it paints the overlay's own ground rather than
  // black — otherwise the canvas box reads as a darker rectangle against it.
  outColor = vec4(rgb * uFade + VOID, 1.0);
}`;
