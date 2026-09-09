"use client";

/* eslint-disable react-hooks/immutability -- three.js camera/renderer are mutated per frame by design */

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, AdaptiveDpr } from "@react-three/drei";
import * as THREE from "three";
import { sceneState, type Quality } from "@/lib/scene-store";
import { damp } from "@/lib/anim";
import { Scaffold, scaffoldAnchor } from "./Scaffold";

/** Camera stays fixed. A very small pointer parallax only, never an orbit. */
function CameraParallax() {
  const { camera } = useThree();
  const home = useRef(new THREE.Vector3(0, 0, 9));
  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const amt = sceneState.reducedMotion ? 0 : 1;
    camera.position.x = damp(camera.position.x, sceneState.pointerX * 0.12 * amt, 2, dt);
    camera.position.y = damp(camera.position.y, home.current.y + sceneState.pointerY * 0.08 * amt, 2, dt);
    camera.position.z = damp(camera.position.z, home.current.z, 2, dt);
    camera.lookAt(0, 0, 0);
  });
  return null;
}

/**
 * Our Scaffold 3D scene. Dark, restrained, premium.
 *
 * The read is built around ONE dominant top-right key that rakes across the
 * porous surface and CASTS REAL SHADOWS into the cavities. Everything else is
 * deliberately secondary: previously four directional lights of comparable
 * strength arrived from four different sides, so each one filled the others'
 * shadows and the scaffold flattened into a uniform mid-tone. Now the fills
 * only exist to keep the key's shadow side readable as the tube rotates, never
 * to compete with it.
 *
 * Shadow casting is enabled route-locally (the shared SceneCanvas is untouched,
 * so Home is unaffected); with no shadow-casting light in a scene the shadow
 * pass costs nothing, so `shadowMap.enabled` can stay on while the key's
 * `castShadow` is what actually gates the work by quality tier.
 */
export function ScaffoldScene({ quality }: { quality: Quality }) {
  const low = quality === "low";
  const { gl, size } = useThree();
  gl.shadowMap.enabled = true;
  gl.shadowMap.type = THREE.PCFShadowMap;

  // The key's shadow frustum is centred on the scaffold itself (not the world
  // origin) so the ortho bounds stay tight and the shadow texels stay small
  // enough to resolve pore-scale occlusion. Follows the same breakpoint pose
  // the scaffold uses, so the frustum tracks it at every viewport width.
  const keyTarget = useMemo(() => new THREE.Object3D(), []);
  keyTarget.position.set(...scaffoldAnchor(size.width));

  const shadowMapSize = quality === "high" ? 2048 : 1536;

  return (
    <>
      <fog attach="fog" args={["#0a0c0b", 20, 44]} />

      {/* Restrained ambient: enough that a cavity never reads as a dead black
          hole, low enough that the key's shadows survive. */}
      <ambientLight intensity={0.06} />
      <hemisphereLight intensity={0.12} color="#efe7d6" groundColor="#100e0b" />

      {/* KEY — top-right, raking. Mostly lateral/overhead with only a small
          frontal component, so it skims the surface and lights pore rims and
          bridges from the side instead of flooding straight into the cavities
          the way the old near-head-on front-left key did. */}
      <primitive object={keyTarget} />
      <directionalLight
        position={[7.2, 6.4, 1.8]}
        target={keyTarget}
        intensity={low ? 3.0 : 3.6}
        color="#fff2dc"
        castShadow={!low}
        shadow-mapSize-width={shadowMapSize}
        shadow-mapSize-height={shadowMapSize}
        shadow-camera-near={2}
        shadow-camera-far={26}
        shadow-camera-left={-3.4}
        shadow-camera-right={3.4}
        shadow-camera-top={3.4}
        shadow-camera-bottom={-3.4}
        shadow-normalBias={0.022}
        shadow-radius={2}
      />

      {/* Secondary rake from the opposite (lower-left) side. Weak on purpose —
          it only keeps the key's shadow side from going featureless as the tube
          rotates through 360 degrees. */}
      <directionalLight position={[-6, -1.4, 3.2]} intensity={low ? 0.5 : 0.62} color="#ffe9cc" />

      {/* Warm back rim, upper-right-behind: separates the porous silhouette from
          the dark page. Secondary — silhouette only, not a second key. */}
      <directionalLight position={[3.4, 3.0, -7.5]} intensity={low ? 0.95 : 1.15} color="#ffddab" />

      {/* Very faint cool bounce so deep shadow never reads as pure black. */}
      <directionalLight position={[-1.5, -3, 5]} intensity={0.14} color="#c6cdd6" />

      <Environment
        resolution={low ? 128 : 256}
        environmentIntensity={low ? 0.2 : 0.26}
      >
        <Lightformer form="rect" intensity={0.12} position={[0, 0, 9]} scale={[26, 26, 1]} color="#443729" />
        <Lightformer form="rect" intensity={0.24} position={[0, 12, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[24, 24, 1]} color="#5a4a37" />
        {/* soft warm card upper-RIGHT now, matching the new key direction */}
        <Lightformer form="rect" intensity={0.7} position={[6, 4.5, 5]} scale={[8, 10, 1]} color="#ffe6c2" />
        {/* narrow grazing band for pore-edge highlights, also from the right */}
        <Lightformer form="rect" intensity={0.42} position={[5, 1.5, 4.5]} scale={[1.3, 11, 1]} color="#ffd9a4" />
        {/* LEFT CONTENT REGION reflector: broad, soft, faintly warm value shape */}
        <Lightformer form="rect" intensity={0.26} position={[-6, 0.5, 4.5]} scale={[5, 9, 1]} color="#e3dbca" />
      </Environment>

      <CameraParallax />
      <Scaffold />

      <AdaptiveDpr pixelated />
    </>
  );
}
