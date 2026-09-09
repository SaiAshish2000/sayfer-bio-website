"use client";

/**
 * Our Scaffold flagship — the approved R3 Blender asset
 * (public/models/sayfer-scaffold-v2.glb), web-optimized: ~172k tris, Draco
 * compressed, carrying a real per-vertex COLOR_0 (warm ochre base x ambient
 * occlusion, baked from the approved R3 high-poly source at ~1.56M triangles,
 * then gamma-shaped so exposed walls stay bright while cavities deepen).
 *
 * The runtime mesh's topology is too fragmented for UV-texel baking to hold
 * meaningful per-pixel detail (median UV-space triangle area measured well
 * under one texel even at 2048x2048 -- the porous surface breaks into many
 * small disconnected triangle clusters). Vertex colors sidestep UV packing
 * entirely: baked from the high-poly source, they're exact regardless of
 * topology, which is why this replaced an earlier UV+texture-map attempt.
 *
 * Because there are no UVs there is also no normal map, so the dry fibrous
 * micro-relief of the R3 render is reproduced the same way R3 itself produced
 * it: a procedural bump driven by OBJECT-SPACE noise (R3 used object-space
 * Voronoi + noise into a Bump node). Here it's injected into the standard
 * material via onBeforeCompile and perturbs the shading normal only.
 *
 * The mesh both casts and receives shadows: the top-right key in ScaffoldScene
 * throws real occlusion into the pores, which is what gives internal cavities
 * separation from the lit walls rather than a uniform mid-tone.
 *
 * The Draco decoder is self-hosted (public/draco/) rather than drei's default
 * gstatic.com CDN path — a production best practice with no third-party
 * runtime dependency.
 *
 * Composition (fixed, never repositioned between sections): large, close,
 * diagonally anchored, both longitudinal ends outside the frame, biased right so
 * the left-column text stays clear — the same language as the Home spindle.
 *
 * Motion: rotation ONLY around the model's local long axis. The GLB was exported
 * +Y-up, so the tube runs along local +Y; the inner `spin` group rotates on Y,
 * driven deterministically by accumulated scroll distance. No autoplay, no
 * momentum: the target holds still when scrolling stops, so the scaffold settles.
 */

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { sceneState } from "@/lib/scene-store";
import { damp } from "@/lib/anim";

const GLB_URL = "/models/sayfer-scaffold-v2.glb";
useGLTF.setDecoderPath("/draco/");
useGLTF.preload(GLB_URL, true);

/** scroll pixels -> radians. A full long Scaffold page is roughly two turns. */
const ROTATION_PER_PX = 0.0021;

/** Fixed composition, unchanged. Shared so the key light's shadow frustum can
 *  be centred on wherever the scaffold actually sits at this breakpoint. */
const NARROW_MAX = 820;
const POSE = {
  wide: { pos: [2.5, 0.35, 0], rot: [0.16, 0, 0.54], scale: 29 },
  narrow: { pos: [0.35, 3.35, -0.6], rot: [0.18, 0, 0.62], scale: 24 },
} as const;

export type Vec3 = [number, number, number];

export function scaffoldAnchor(width: number): Vec3 {
  return [...(width < NARROW_MAX ? POSE.narrow.pos : POSE.wide.pos)] as Vec3;
}

/** Desktop anchor, used where a breakpoint isn't available. */
export const SCAFFOLD_ANCHOR: Vec3 = [...POSE.wide.pos] as Vec3;

/**
 * Object-space procedural micro-relief. Two octaves of cheap value noise drive
 * a height field; the shading normal is perturbed from its screen-space
 * derivatives (the same construction three.js uses for bump maps). A fwidth
 * based fade drops the finest octave's contribution when the surface is
 * compressed on screen, so the grain doesn't shimmer while the tube rotates.
 */
const BUMP_CHUNK = /* glsl */ `
varying vec3 vScaffoldObjPos;
uniform float uBumpScale;

float sfHash(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float sfNoise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(sfHash(i + vec3(0,0,0)), sfHash(i + vec3(1,0,0)), f.x),
        mix(sfHash(i + vec3(0,1,0)), sfHash(i + vec3(1,1,0)), f.x), f.y),
    mix(mix(sfHash(i + vec3(0,0,1)), sfHash(i + vec3(1,0,1)), f.x),
        mix(sfHash(i + vec3(0,1,1)), sfHash(i + vec3(1,1,1)), f.x), f.y),
    f.z);
}

float sfHeight(vec3 p, float fine) {
  return 0.60 * sfNoise(p * 380.0) + 0.40 * fine * sfNoise(p * 950.0);
}
`;

/** Strength of the procedural micro-relief. Tuned by eye against the R3
 *  close-up: high values (>=0.35) turn the walls into granular sandpaper and
 *  swallow the pore forms, so this stays deliberately faint — just enough tooth
 *  that the walls aren't perfectly smooth. */
const BUMP_SCALE = 0.05;

function makeZein() {
  const m = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#ffffff"), // vertex colors already carry the full baked tone
    roughness: 0.9,
    metalness: 0.0,
    vertexColors: true, // baked ochre x AO in COLOR_0 -> real cavity depth
    envMapIntensity: 0.4,
    side: THREE.DoubleSide, // thin torn membrane walls
  });

  m.onBeforeCompile = (shader) => {
    shader.uniforms.uBumpScale = { value: BUMP_SCALE };
    m.userData.shader = shader;

    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vScaffoldObjPos;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\n  vScaffoldObjPos = position;");

    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\n${BUMP_CHUNK}`)
      // Dry biomaterial: a little coherent roughness variation, never a broad
      // plastic specular. Kept well inside the matte range.
      .replace(
        "#include <roughnessmap_fragment>",
        `#include <roughnessmap_fragment>
  roughnessFactor = clamp(roughnessFactor + (sfNoise(vScaffoldObjPos * 210.0) - 0.5) * 0.14, 0.62, 1.0);`
      )
      .replace(
        "#include <normal_fragment_maps>",
        `#include <normal_fragment_maps>
  {
    float sfFw = fwidth(vScaffoldObjPos.x + vScaffoldObjPos.y + vScaffoldObjPos.z);
    float sfFine = 1.0 - smoothstep(0.0006, 0.0030, sfFw);
    float sfAtten = 1.0 - smoothstep(0.0025, 0.0090, sfFw);
    float h = sfHeight(vScaffoldObjPos, sfFine);
    vec3 q0 = dFdx(-vViewPosition);
    vec3 q1 = dFdy(-vViewPosition);
    float dhx = dFdx(h);
    float dhy = dFdy(h);
    vec3 sfN = normal;
    vec3 r1 = cross(q1, sfN);
    vec3 r2 = cross(sfN, q0);
    float det = dot(q0, r1);
    vec3 surfGrad = sign(det) * (dhx * r1 + dhy * r2);
    normal = normalize(abs(det) * sfN - uBumpScale * sfAtten * surfGrad);
  }`
      );
  };
  m.customProgramCacheKey = () => "sayfer-scaffold-zein-v2";

  return m;
}

export function Scaffold() {
  const spin = useRef<THREE.Group>(null);
  const { size } = useThree();
  const { scene } = useGLTF(GLB_URL, true);

  const model = useMemo(() => {
    const root = scene.clone(true);
    const mat = makeZein();
    root.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        const mesh = o as THREE.Mesh;
        mesh.material = mat;
        // real self-shadowing: this is what separates cavity interiors from
        // the lit walls instead of every light-facing surface reading equally
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.frustumCulled = false; // intentionally cropped
      }
    });
    return root;
  }, [scene]);

  // Fixed composition per breakpoint. Narrow: the scaffold rises through the open
  // area above the bottom-aligned hero text, still cropped at both ends.
  const pose = size.width < NARROW_MAX ? POSE.narrow : POSE.wide;

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    if (!spin.current) return;
    const target = sceneState.scrollDistance * ROTATION_PER_PX;
    spin.current.rotation.y = damp(spin.current.rotation.y, target, 9, dt);
  });

  return (
    <group position={pose.pos as unknown as Vec3} rotation={pose.rot as unknown as Vec3} scale={pose.scale}>
      <group ref={spin}>
        <primitive object={model} />
      </group>
    </group>
  );
}
