import * as THREE from "three";

/**
 * Cultivated-cell material system.
 *
 * Membrane: a semi-translucent biological body — off-round silhouette from
 * layered trig noise (large lobes + folds + fine wrinkle, seeded per cell) with
 * a normal perturbed by the displacement gradient so folds catch light. Rendered
 * additively at restrained values so it reads as backlit translucent tissue over
 * the dark page, never a hard disc and never a glowing orb.
 *
 * Nucleus: a soft-edged interior concentration, offset slightly off-centre per
 * cell for internal depth.
 *
 * `uOpacity` is driven per cell by the text-safe / proliferation system.
 */

const noiseGLSL = /* glsl */ `
  float tnoise(vec3 p) {
    float a = sin(p.x * 1.7 + p.z * 0.9) * cos(p.y * 1.9 - p.x * 0.6);
    float b = sin(p.y * 3.1 + p.z * 2.3) * cos(p.x * 2.7 + p.y * 0.4);
    float c = sin(p.z * 4.3 - p.x * 1.1) * cos(p.y * 3.7);
    return (a + 0.55 * b + 0.3 * c) * 0.5;   // ~[-0.9, 0.9]
  }
`;

const membraneVert = /* glsl */ `
  uniform float uTime;
  uniform float uWobble;
  uniform float uSeed;
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  varying float vFold;

  ${noiseGLSL}

  float shp(vec3 dir) {
    vec3 s = vec3(uSeed * 8.3, uSeed * 5.1, uSeed * 11.7);
    float t = uTime * 0.12;
    float lobes = tnoise(dir * 1.5 + s + t * 0.3);
    float folds = tnoise(dir * 3.3 + s * 1.6 - t * 0.4);
    float fine  = tnoise(dir * 7.0 + s * 2.2);
    return lobes * 0.12 + folds * 0.055 + fine * 0.022;   // gentle
  }

  void main() {
    vec3 n0 = normalize(position);
    float d = shp(n0) + sin(uTime * 1.6 + uSeed * 6.28) * 0.012 * uWobble;
    vec3 p = position + n0 * d;

    // normal perturbation from the displacement gradient (folds read in light)
    vec3 ref = abs(n0.y) < 0.9 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
    vec3 t1 = normalize(cross(n0, ref));
    vec3 t2 = cross(n0, t1);
    float e = 0.15;
    float da = shp(normalize(n0 + t1 * e)) - d;
    float db = shp(normalize(n0 + t2 * e)) - d;
    vec3 n = normalize(n0 - (t1 * da + t2 * db) * 5.0);

    vFold = shp(n0 * 2.0 + uSeed * 3.0);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vNormalW = normalize(normalMatrix * n);
    vViewDir = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const membraneFrag = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uRim;
  uniform vec3 uDeep;
  uniform float uOpacity;
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  varying float vFold;

  void main() {
    vec3 n = normalize(vNormalW);
    vec3 v = normalize(vViewDir);
    float ndv = clamp(dot(n, v), 0.0, 1.0);

    float fres = pow(1.0 - ndv, 2.6);          // subtle edge only
    float rim  = pow(1.0 - ndv, 1.4);

    float key  = clamp(dot(n, normalize(vec3(0.35, 0.7, 0.45))) * 0.5 + 0.5, 0.0, 1.0);
    float back = clamp(dot(n, normalize(vec3(-0.25, -0.4, -0.75))) * 0.5 + 0.5, 0.0, 1.0);
    float fold = 0.5 + 0.5 * sin(vFold * 3.4);

    // a fairly even milky tissue tone: NOT a bright-ring / dark-centre bubble
    vec3 col = mix(uDeep, uColor, 0.58 + key * 0.34);
    col = mix(col, uRim, fres * 0.35);       // gentle rim lift
    col += back * 0.13;                      // translucency through the far side
    col *= 0.94 + fold * 0.13;               // soft folds
    col += 0.1;                              // keep faint cells reading as tissue

    // body-dominant alpha: the whole cell reads as a soft translucent body,
    // only slightly denser at the very edge.
    float alpha = clamp((0.52 + rim * 0.13) * uOpacity, 0.0, 0.86);

    gl_FragColor = vec4(col, alpha);
    #include <colorspace_fragment>
  }
`;

const nucleusVert = /* glsl */ `
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const nucleusFrag = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    float ndv = clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0);
    float core = pow(ndv, 1.6);
    // darker, denser interior body seen through the translucent membrane
    float alpha = clamp((0.30 + core * 0.45) * uOpacity, 0.0, 0.85);
    vec3 c = uColor * (0.6 + core * 0.5);
    gl_FragColor = vec4(c, alpha);
    #include <colorspace_fragment>
  }
`;

function shader(
  vertexShader: string,
  fragmentShader: string,
  uniforms: Record<string, THREE.IUniform>,
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    transparent: true,
    depthWrite: false,
    side: THREE.FrontSide,
  });
}

export function createCellMaterial(): THREE.ShaderMaterial {
  return shader(membraneVert, membraneFrag, {
    uTime: { value: 0 },
    uWobble: { value: 1 },
    uSeed: { value: Math.random() },
    uOpacity: { value: 0 },
    uColor: { value: new THREE.Color("#cbe0d4") },
    uRim: { value: new THREE.Color("#f2f8f2") },
    uDeep: { value: new THREE.Color("#8ba79a") },
  });
}

export function createNucleusMaterial(): THREE.ShaderMaterial {
  return shader(nucleusVert, nucleusFrag, {
    uColor: { value: new THREE.Color("#8fb6a0") },
    uOpacity: { value: 0 },
  });
}
