"use client";

import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { useFrame, useThree, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import {
  isThrustPressed,
  getNormalizedShipSpeed,
  getNormalizedTurboSpeed,
} from "./controls";

const ENGINE1_SFX_URL = "/sfx/engine1.ogg";
const ENGINE2_SFX_URL = "/sfx/engine2.mp3";
const SHOT_SFX_URL = "/sfx/shot.mp3";
const HIT_SFX_URL = "/sfx/hit.mp3";
const EXPLOSION_SFX_URL = "/sfx/explosion.mp3";
const COLLISION_SFX_URL = "/sfx/collision.mp3";
const SHOT_SOUND_POOL_SIZE = 10;
const HIT_SOUND_POOL_SIZE = 6;
const EXPLOSION_SOUND_POOL_SIZE = 4;
const COLLISION_SOUND_POOL_SIZE = 4;
const DETUNE_MAX = 1200;

const SHOT_FILTER = {
  convolver: true,
  loop: false,
  volume: 12.0,
  filter: {
    type: "highpass" as BiquadFilterType,
    frequency: 100,
    q: 1.0,
  }
};

const HIT_FILTER = {
  convolver: true,
  loop: false,
  volume: 70.0,
  refDistance: 8,
  detune: -400,
  filter: {
    type: "highpass" as BiquadFilterType,
    frequency: 100,
    q: 1.0,
  }
};

const EXPLOSION_FILTER = {
  // convolver: true,
  loop: false,
  volume: 10.0,
  refDistance: 15,
  filter: {
    type: "highpass" as BiquadFilterType,
    frequency: 60,
    q: 1.0,
  }
};

const COLLISION_FILTER = {
  // convolver: true,
  loop: false,
  volume: 8.0,
  refDistance: 10,
  detune: 200,
  filter: {
    type: "highpass" as BiquadFilterType,
    frequency: 190,
    q: 1.0,
  }
};

export interface AudioConfig {
  loop?: boolean;
  refDistance?: number;
  detune?: number;
  gain?: number;
  playbackRate?: number
  convolver?: boolean
  volume?: number
  filter?: {
    type: BiquadFilterType;
    frequency: number;
    q: number;
  };
}

export function applyAudioConfig(
  sound: THREE.PositionalAudio | null,
  buffer: AudioBuffer | undefined,
  audioContext: AudioContext,
  config: AudioConfig = {}
) {
  if (!sound || !buffer) return;
  sound.setBuffer(buffer);
  sound.setRefDistance(config.refDistance ?? 1);
  sound.setLoop(config.loop ?? false);
  sound.setDetune(config.detune ?? 0);
  sound.setPlaybackRate(config.playbackRate ?? 1.0)
  sound.setVolume(config.volume ?? 1.0)

  if (config.gain !== undefined) {
    (sound as unknown as { gain: GainNode }).gain.gain.value = config.gain;
  }
  const filters: AudioNode[] = []

  
  if (config.convolver) {
    const sampleRate = audioContext.sampleRate;
    const length = sampleRate * 0.08;
    const buffer = audioContext.createBuffer(2, length, sampleRate);

    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        const decay = 1 + (1 - 0.9) * 5;
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }
    
    const convolver = audioContext.createConvolver();
    convolver.buffer = buffer;
    convolver.normalize = true;
    
    filters.push(convolver)
  }
  if (config.filter) {
    const filter = audioContext.createBiquadFilter();
    filter.type = config.filter.type;
    filter.frequency.value = config.filter.frequency;
    filter.Q.value = config.filter.q;
    filters.push(filter)
  }
  sound.setFilters(filters)
}

export const ShotSoundPool = forwardRef<{ play: () => void }, object>(
  function ShotSoundPool(_, ref) {
    const { camera } = useThree();
    const buffer = useLoader(THREE.AudioLoader, SHOT_SFX_URL);
    const [listener] = useState(() => new THREE.AudioListener());
    const soundRefs = useRef<(THREE.PositionalAudio | null)[]>(
      Array.from({ length: SHOT_SOUND_POOL_SIZE }, () => null)
    );
    const indexRef = useRef(0);

    useEffect(() => {
      camera.add(listener);
      return () => {
        camera.remove(listener);
      };
    }, [camera, listener]);

    useEffect(() => {
      if (!buffer) return;
      const ctx = listener.context;
      soundRefs.current.forEach((sound) =>
        applyAudioConfig(sound, buffer, ctx, SHOT_FILTER)
      );
    }, [buffer, listener.context]);

    useImperativeHandle(
      ref,
      () => ({
        play: () => {
          const sounds = soundRefs.current;
          const i = indexRef.current % sounds.length;
          indexRef.current = i + 1;
          const sound = sounds[i];
          if (sound) {
            sound.setDetune(Math.random() * DETUNE_MAX);
            sound.play();
          }
        },
      }),
      []
    );

    return (
      <>
        {Array.from({ length: SHOT_SOUND_POOL_SIZE }, (_, i) => (
          <positionalAudio
            key={i}
            ref={(el) => {
              soundRefs.current[i] = el;
              if (el && buffer)
                applyAudioConfig(el, buffer, listener.context, SHOT_FILTER);
            }}
            args={[listener]}
          />
        ))}
      </>
    );
  }
);

export const HitSoundPool = forwardRef<
  { playAt: (position: THREE.Vector3) => void },
  object
>(function HitSoundPool(_, ref) {
  const { camera } = useThree();
  const buffer = useLoader(THREE.AudioLoader, HIT_SFX_URL);
  const [listener] = useState(() => new THREE.AudioListener());
  const groupRefs = useRef<(THREE.Group | null)[]>(
    Array.from({ length: HIT_SOUND_POOL_SIZE }, () => null)
  );
  const soundRefs = useRef<(THREE.PositionalAudio | null)[]>(
    Array.from({ length: HIT_SOUND_POOL_SIZE }, () => null)
  );
  const indexRef = useRef(0);

  useEffect(() => {
    camera.add(listener);
    return () => {
      camera.remove(listener);
    };
  }, [camera, listener]);

  useEffect(() => {
    if (!buffer) return;
    const ctx = listener.context;
    soundRefs.current.forEach((sound) =>
      applyAudioConfig(sound, buffer, ctx, HIT_FILTER)
    );
  }, [buffer, listener.context]);

  useImperativeHandle(
    ref,
    () => ({
      playAt: (position: THREE.Vector3) => {
        const groups = groupRefs.current;
        const sounds = soundRefs.current;
        const i = indexRef.current % sounds.length;
        indexRef.current = i + 1;
        const group = groups[i];
        const sound = sounds[i];
        if (group && sound) {
          group.position.copy(position);
          sound.play();
        }
      },
    }),
    []
  );

  return (
    <>
      {Array.from({ length: HIT_SOUND_POOL_SIZE }, (_, i) => (
        <group
          key={i}
          ref={(el) => {
            groupRefs.current[i] = el;
          }}
        >
          <positionalAudio
            ref={(el) => {
              soundRefs.current[i] = el;
              if (el && buffer)
                applyAudioConfig(el, buffer, listener.context, HIT_FILTER);
            }}
            args={[listener]}
          />
        </group>
      ))}
    </>
  );
});

function createPositionalSoundPool(
  url: string,
  poolSize: number,
  config: AudioConfig,
  displayName: string
) {
  const Pool = forwardRef<
    { playAt: (position: THREE.Vector3) => void },
    object
  >(function Pool(_, ref) {
    const { camera } = useThree();
    const buffer = useLoader(THREE.AudioLoader, url);
    const [listener] = useState(() => new THREE.AudioListener());
    const groupRefs = useRef<(THREE.Group | null)[]>(
      Array.from({ length: poolSize }, () => null)
    );
    const soundRefs = useRef<(THREE.PositionalAudio | null)[]>(
      Array.from({ length: poolSize }, () => null)
    );
    const indexRef = useRef(0);

    useEffect(() => {
      camera.add(listener);
      return () => {
        camera.remove(listener);
      };
    }, [camera, listener]);

    useEffect(() => {
      if (!buffer) return;
      const ctx = listener.context;
      soundRefs.current.forEach((sound) =>
        applyAudioConfig(sound, buffer, ctx, config)
      );
    }, [buffer, listener.context]);

    useImperativeHandle(
      ref,
      () => ({
        playAt: (position: THREE.Vector3) => {
          const groups = groupRefs.current;
          const sounds = soundRefs.current;
          const i = indexRef.current % sounds.length;
          indexRef.current = i + 1;
          const group = groups[i];
          const sound = sounds[i];
          if (group && sound) {
            group.position.copy(position);
            sound.play();
          }
        },
      }),
      []
    );

    return (
      <>
        {Array.from({ length: poolSize }, (_, i) => (
          <group
            key={i}
            ref={(el) => {
              groupRefs.current[i] = el;
            }}
          >
            <positionalAudio
              ref={(el) => {
                soundRefs.current[i] = el;
                if (el && buffer)
                  applyAudioConfig(el, buffer, listener.context, config);
              }}
              args={[listener]}
            />
          </group>
        ))}
      </>
    );
  });
  Pool.displayName = displayName;
  return Pool;
}

export const ExplosionSoundPool = createPositionalSoundPool(
  EXPLOSION_SFX_URL,
  EXPLOSION_SOUND_POOL_SIZE,
  EXPLOSION_FILTER,
  "ExplosionSoundPool"
);

export const CollisionSoundPool = createPositionalSoundPool(
  COLLISION_SFX_URL,
  COLLISION_SOUND_POOL_SIZE,
  COLLISION_FILTER,
  "CollisionSoundPool"
);

const ENGINE_FILTER = {
  detune: 0,
  playbackRate: 1.6,
  loop: true,
  volume: 0.6,
  filter: {
    type: "highpass" as BiquadFilterType,
    frequency: 100,
    q: 0.8,
  }
};

const ENGINE_2_FILTER = {
  loop: true,
  volume: 0.3,
  filter: {
    type: "highpass" as BiquadFilterType,
    frequency: 50,
    q: 0.8,
  },
};

export function EngineSounds() {
  const { camera } = useThree();
  const [listener] = useState(() => new THREE.AudioListener());
  const engine1Buffer = useLoader(THREE.AudioLoader, ENGINE1_SFX_URL);
  const engine2Buffer = useLoader(THREE.AudioLoader, ENGINE2_SFX_URL);
  const engine1Ref = useRef<THREE.PositionalAudio>(null);
  const engine2Ref = useRef<THREE.PositionalAudio>(null);

  useEffect(() => {
    camera.add(listener);
    return () => {
      camera.remove(listener);
    };
  }, [camera, listener]);

  useEffect(() => {
    const ctx = listener.context;
    applyAudioConfig(engine1Ref.current, engine1Buffer, ctx, ENGINE_FILTER);
    applyAudioConfig(engine2Ref.current, engine2Buffer, ctx, ENGINE_2_FILTER);
    const engine2 = engine2Ref.current;
    const engine1 = engine1Ref.current;
    if (engine2 && engine2Buffer) {
      engine2.play();
    }
    if (engine1 && engine1Buffer) {
      engine1.play();
    }
  }, [engine1Buffer, engine2Buffer, listener.context]);

  useFrame(() => {
    const engine1 = engine1Ref.current;
    const engine2 = engine2Ref.current;
    if (!engine1 || !engine2) return;
    const normShip = getNormalizedShipSpeed();
    const normTurbo = getNormalizedTurboSpeed();
    const fullSpeed = normShip + normTurbo;
    engine1.setVolume((fullSpeed/2) - 0.2);
    engine1.setDetune((fullSpeed / 2) * 800);
    engine2.setDetune((fullSpeed / 2) * 1100);
    if (isThrustPressed()) {
      if (!engine1.isPlaying) {
        engine1.play();
      }
    } else {
      if (engine1.isPlaying) engine1.stop();
    }
  });

  return (
    <>
      <positionalAudio ref={engine1Ref} args={[listener]} />
      <positionalAudio ref={engine2Ref} args={[listener]} />
    </>
  );
}
