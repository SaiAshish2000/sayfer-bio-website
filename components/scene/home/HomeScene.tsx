"use client";

/* eslint-disable react-hooks/immutability -- three.js camera is mutated per frame by design */

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, AdaptiveDpr } from "@react-three/drei";
import * as THREE from "three";
import { sceneState, type Quality } from "@/lib/scene-store";
import { damp } from "@/lib/anim";
import { Spindle } from "./Spindle";
import { Cells } from "./Cells";

/** Camera stays fixed. A very small pointer parallax only, never an orbit. */
function CameraParallax() {
  const { camera } = useThree();
  const home = useRef(new THREE.Vector3(0, 0, 9));
  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const amt = sceneState.reducedMotion ? 0 : 1;
    camera.position.x = damp(camera.position.x, sceneState.pointerX * 0.14 * amt, 2, dt);
    camera.position.y = damp(camera.position.y, home.current.y + sceneState.pointerY * 0.09 * amt, 2, dt);
    camera.position.z = damp(camera.position.z, home.current.z, 2, dt);
    camera.lookAt(0, 0, 0);
  });
  return null;
}

export function HomeScene({ quality }: { quality: Quality }) {
  const low = quality === "low";

  return (
    <>
      {/* Matches the page ground so the scene feels integrated, not a void. */}
      <fog attach="fog" args={["#0a0c0b", 20, 44]} />

      {/* Restrained direct light. The brushed-steel read comes mostly from the
          reflection cards in <Environment/>, not from raw brightness. */}
      <ambientLight intensity={0.42} />
      <hemisphereLight intensity={0.62} color="#e2e7ee" groundColor="#171a16" />
      {/* soft front fill so blade backs settle at dark grey, never teal/black */}
      <directionalLight position={[-2, 1, 7]} intensity={0.55} color="#dfe3e8" />
      <directionalLight position={[1, -3, 4]} intensity={0.35} color="#d7dbe0" />
      <directionalLight position={[5, 6, 6]} intensity={low ? 1.6 : 2.0} color="#f2f4f8" />
      {/* rim from behind-right so the steel edges read against the dark page */}
      <directionalLight position={[3.5, 3, -8]} intensity={low ? 1.5 : 1.9} color="#ccd1d6" />

      <Environment
        resolution={low ? 128 : 256}
        environmentIntensity={low ? 1.15 : 1.32}
      >
        {/* dim all-round fill so the metal is never pure black, never blown.
            Neutral greys — no cyan cast. */}
        <Lightformer form="rect" intensity={0.44} position={[0, 0, 9]} scale={[26, 26, 1]} color="#616872" />
        <Lightformer form="rect" intensity={0.36} position={[0, 0, -11]} scale={[26, 26, 1]} color="#4c535b" />
        <Lightformer form="rect" intensity={0.48} position={[0, 11, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[24, 24, 1]} color="#828993" />
        {/* left + right soft fills so no blade back falls to teal/black */}
        <Lightformer form="rect" intensity={0.7} position={[-8, 1, 2]} scale={[7, 12, 1]} color="#9096a0" />
        <Lightformer form="rect" intensity={0.55} position={[7, 1, 3]} scale={[6, 10, 1]} color="#9aa0a8" />

        {/* main key — broad and soft, not a hotspot */}
        <Lightformer form="rect" intensity={1.35} position={[5, 5, 6.5]} scale={[9, 11, 1]} color="#eef0f5" />
        {/* one broad brushed-steel highlight band (widened + softened so a single
            blade face never suddenly blows out) */}
        <Lightformer form="rect" intensity={0.85} position={[1.4, 1.5, 5.5]} scale={[1.4, 11, 1]} color="#e9eef5" />

        {/* LEFT CONTENT REGION reflector: a broad, soft, faintly warm value shape
            standing in for the page's left column. Blurred light, never a
            readable reflection. */}
        <Lightformer
          form="rect"
          intensity={0.62}
          position={[-6, 0.5, 4.5]}
          scale={[5, 9, 1]}
          color="#e4e9e2"
        />
        <Lightformer form="ring" intensity={0.7} position={[-4, -1.5, -5]} scale={5} color="#aab3b8" />
      </Environment>

      <CameraParallax />
      <Spindle />
      <Cells quality={quality} />

      <AdaptiveDpr pixelated />
    </>
  );
}
