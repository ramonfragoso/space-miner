"use client";
import * as THREE from "three/webgpu";
import { pass, mrt, output, emissive } from "three/tsl";
import { bloom } from "three/addons/tsl/display/BloomNode.js";
import { useThree, useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";

interface PostProcessingProps {
  strength?: number;
  radius?: number;
  threshold?: number;
}

export function PostProcessing({
  strength = 1.5,
  radius = 0.5,
  threshold = 0.6,
}: PostProcessingProps) {
  const { gl: renderer, scene, camera } = useThree();
  const postProcessingRef = useRef<THREE.PostProcessing | null>(null);

  useEffect(() => {
    if (!renderer || !scene || !camera) return;

    const scenePass = pass(scene, camera, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
    });

    scenePass.setMRT(
      mrt({
        output: output,
        emissive: emissive,
      })
    );

    const scenePassColor = scenePass.getTextureNode("output");
    const scenePassEmissive = scenePass.getTextureNode("emissive");

    const bloomPass = bloom(scenePassEmissive, strength, radius, threshold);

    const postProcessing = new THREE.PostProcessing(renderer);
    postProcessing.outputNode = scenePassColor.add(bloomPass);
    postProcessingRef.current = postProcessing;

    return () => {
      postProcessingRef.current = null;
    };
  }, [renderer, scene, camera, strength, radius, threshold]);

  useFrame(() => {
    if (postProcessingRef.current) {
      postProcessingRef.current.render();
    }
  }, 1);

  return null;
}
