import { useAnimations, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState, useCallback } from "react";
import { useChat } from "../hooks/useChat";
import * as THREE from "three";

// ─── FACS-accurate facial expressions ────────────────────────────────────────
const facialExpressions = {
  default: {},
  smile: {
    mouthSmileLeft: 0.6,
    mouthSmileRight: 0.6,
    cheekSquintLeft: 0.5,
    cheekSquintRight: 0.5,
    eyeSquintLeft: 0.35,
    eyeSquintRight: 0.35,
    browInnerUp: 0.1,
    noseSneerLeft: 0.08,
    noseSneerRight: 0.08,
  },
  sad: {
    mouthFrownLeft: 1,
    mouthFrownRight: 1,
    mouthShrugLower: 0.78,
    browInnerUp: 0.45,
    eyeSquintLeft: 0.72,
    eyeSquintRight: 0.75,
    eyeLookDownLeft: 0.5,
    eyeLookDownRight: 0.5,
    jawForward: 0.3,
  },
  angry: {
    browDownLeft: 1,
    browDownRight: 1,
    eyeSquintLeft: 1,
    eyeSquintRight: 1,
    jawForward: 0.6,
    mouthShrugLower: 0.8,
    noseSneerLeft: 1,
    noseSneerRight: 0.42,
    cheekSquintLeft: 1,
    cheekSquintRight: 1,
    mouthClose: 0.23,
    mouthFunnel: 0.63,
    mouthDimpleRight: 1,
  },
  surprised: {
    browInnerUp: 0.8,
    browOuterUpLeft: 0.7,
    browOuterUpRight: 0.7,
    eyeWideLeft: 0.8,
    eyeWideRight: 0.8,
    jawOpen: 0.4,
    mouthShrugUpper: 0.3,
  },
  empathetic: {
    browInnerUp: 0.5,
    mouthFrownLeft: 0.2,
    mouthFrownRight: 0.2,
    mouthShrugLower: 0.15,
    eyeSquintLeft: 0.2,
    eyeSquintRight: 0.2,
  },
  curious: {
    browInnerUp: 0.3,
    browOuterUpLeft: 0.15,
    eyeSquintLeft: 0.1,
    mouthPressLeft: 0.1,
    mouthSmileLeft: 0.1,
    mouthSmileRight: 0.05,
  },
};

// All expression morph keys (pre-computed so useFrame doesn't allocate)
const ALL_EXPR_KEYS = [
  ...new Set(Object.values(facialExpressions).flatMap((e) => Object.keys(e))),
];

// ─── Fixed Rhubarb → RPM Oculus viseme mapping ───────────────────────────────
// D was "viseme_AA" (wrong case), X was "viseme_PP" (wrong — should be silence)
const VISEME_MAP = {
  A: "viseme_PP",
  B: "viseme_kk",
  C: "viseme_I",
  D: "viseme_aa",
  E: "viseme_O",
  F: "viseme_U",
  G: "viseme_FF",
  H: "viseme_TH",
  X: "viseme_sil",
};
const ALL_VISEMES = [...new Set(Object.values(VISEME_MAP))];

// ─── Organic pseudo-noise (multi-sine, no external dep) ──────────────────────
const noise = (t, seed = 0) =>
  Math.sin(t * 1.3 + seed) * 0.5 +
  Math.sin(t * 2.7 + seed * 1.7) * 0.3 +
  Math.sin(t * 0.6 + seed * 0.4) * 0.2;

export function Avatar(props) {
  const { nodes, materials, scene } = useGLTF(
    "/models/64f1a714fe61576b46f27ca2.glb"
  );
  const { message, onMessagePlayed } = useChat();
  const { animations } = useGLTF("/models/animations.glb");
  const group = useRef();
  const { actions } = useAnimations(animations, group);

  const [animation, setAnimation] = useState("Idle");
  const [facialExpression, setFacialExpression] = useState("default");
  const [lipsync, setLipsync] = useState(null);
  const [blink, setBlink] = useState(false);
  const [audio, setAudio] = useState(null);

  const isTalking = useRef(false);
  const currentAnimRef = useRef(null);
  const morphMeshes = useRef({});
  const bones = useRef({});
  const eyeTarget = useRef({ x: 0, y: 0 });
  const saccadeTimer = useRef(THREE.MathUtils.randFloat(1, 3));

  // ─── Cache morph target indices once ─────────────────────────────────────
  useEffect(() => {
    const map = {};
    scene.traverse((child) => {
      if (child.isSkinnedMesh && child.morphTargetDictionary) {
        Object.entries(child.morphTargetDictionary).forEach(([key, idx]) => {
          if (!map[key]) map[key] = [];
          map[key].push({ mesh: child, index: idx });
        });
      }
    });
    morphMeshes.current = map;
  }, [scene]);

  // ─── Cache bone refs once ─────────────────────────────────────────────────
  useEffect(() => {
    [
      "Spine", "Spine1", "Spine2", "Neck", "Head", "Hips",
      "LeftShoulder", "RightShoulder",
    ].forEach((name) => {
      const bone = scene.getObjectByName(name);
      if (bone) bones.current[name] = bone;
    });
  }, [scene]);

  // ─── Frame-rate-independent lerp, no scene.traverse ──────────────────────
  const lerpMorphTarget = useCallback((target, value, speed, delta) => {
    const entries = morphMeshes.current[target];
    if (!entries) return;
    const alpha = 1 - Math.exp(-speed * delta * 60);
    for (const { mesh, index } of entries) {
      if (mesh.morphTargetInfluences[index] === undefined) continue;
      mesh.morphTargetInfluences[index] = THREE.MathUtils.lerp(
        mesh.morphTargetInfluences[index],
        value,
        alpha
      );
    }
  }, []);

  // ─── Crossfade animations properly (no mixer.stats hack) ─────────────────
  useEffect(() => {
    if (!actions[animation]) return;
    const next = actions[animation];
    const prevName = currentAnimRef.current;
    const prev = prevName ? actions[prevName] : null;

    next.reset();
    next.setEffectiveTimeScale(1);
    next.setEffectiveWeight(1);

    if (prev && prevName !== animation) {
      next.play();
      prev.crossFadeTo(next, 0.4, true);
    } else {
      next.fadeIn(0.3).play();
    }
    currentAnimRef.current = animation;
  }, [animation, actions]);

  // ─── Handle incoming message ──────────────────────────────────────────────
  useEffect(() => {
    if (!message) {
      setAnimation("Idle");
      isTalking.current = false;
      return;
    }

    setAnimation(message.animation || "Idle");
    setFacialExpression(message.facialExpression || "default");
    setLipsync(message.lipsync || null);

    if (message.audio) {
      // Stop any previous audio cleanly
      setAudio((prev) => {
        if (prev) { prev.pause(); prev.src = ""; }
        return null;
      });
      const newAudio = new Audio("data:audio/mp3;base64," + message.audio);
      newAudio.play();
      isTalking.current = true;
      newAudio.onended = () => {
        isTalking.current = false;
        onMessagePlayed();
      };
      setAudio(newAudio);
    } else {
      isTalking.current = false;
      onMessagePlayed();
    }
  }, [message]);

  // ─── Natural blink with occasional double-blink ───────────────────────────
  useEffect(() => {
    let timer;
    const scheduleBlink = () => {
      timer = setTimeout(() => {
        setBlink(true);
        const dur = THREE.MathUtils.randInt(100, 220);
        setTimeout(() => {
          setBlink(false);
          if (Math.random() < 0.2) {
            setTimeout(() => {
              setBlink(true);
              setTimeout(() => { setBlink(false); scheduleBlink(); }, dur);
            }, 80);
          } else {
            scheduleBlink();
          }
        }, dur);
      }, THREE.MathUtils.randInt(2000, 7000));
    };
    scheduleBlink();
    return () => clearTimeout(timer);
  }, []);

  // ─── Main render loop (priority 1 → runs after drei's mixer.update at 0) ──
  useFrame((state, delta) => {
    const d = Math.min(delta, 0.1); // guard against NaN / tab-background spikes
    const t = state.clock.elapsedTime;

    // Blink
    lerpMorphTarget("eyeBlinkLeft",  blink ? 1 : 0, 10, d);
    lerpMorphTarget("eyeBlinkRight", blink ? 1 : 0, 10, d);

    // Facial expression — lerp all known keys toward current mapping
    const mapping = facialExpressions[facialExpression] || {};
    for (const key of ALL_EXPR_KEYS) {
      if (key === "eyeBlinkLeft" || key === "eyeBlinkRight") continue;
      lerpMorphTarget(key, mapping[key] ?? 0, 3, d);
    }

    // ── Lip sync with co-articulation ──────────────────────────────────────
    // Reset all viseme weights each frame
    const visemeWeights = {};
    for (const v of ALL_VISEMES) visemeWeights[v] = 0;

    if (message && lipsync && audio) {
      const ct = audio.currentTime;
      const cues = lipsync.mouthCues;
      for (let i = 0; i < cues.length; i++) {
        const cue = cues[i];
        if (ct >= cue.start && ct <= cue.end) {
          const progress = (ct - cue.start) / Math.max(cue.end - cue.start, 0.001);
          // Current viseme fades out in last 20% of its window
          const curW = progress > 0.8 ? 1 - (progress - 0.8) / 0.2 : 1;
          const cv = VISEME_MAP[cue.value];
          if (cv) visemeWeights[cv] = Math.max(visemeWeights[cv], curW);
          // Next viseme fades in during last 20% (co-articulation)
          const next = cues[i + 1];
          if (next && progress > 0.8) {
            const nv = VISEME_MAP[next.value];
            if (nv) visemeWeights[nv] = Math.max(visemeWeights[nv], (progress - 0.8) / 0.2);
          }
          break;
        }
      }
    }
    for (const [v, w] of Object.entries(visemeWeights)) {
      lerpMorphTarget(v, w, 12, d);
    }

    // ── Saccadic eye movement ─────────────────────────────────────────────
    saccadeTimer.current -= d;
    if (saccadeTimer.current <= 0) {
      eyeTarget.current = {
        x: THREE.MathUtils.randFloat(-0.25, 0.25),
        y: THREE.MathUtils.randFloat(-0.1, 0.15),
      };
      saccadeTimer.current = THREE.MathUtils.randFloat(1.5, 5);
    }
    const ex = eyeTarget.current.x;
    const ey = eyeTarget.current.y;
    lerpMorphTarget("eyeLookOutLeft",   Math.max(-ex, 0) * 0.4, 8, d);
    lerpMorphTarget("eyeLookInLeft",    Math.max(ex, 0)  * 0.4, 8, d);
    lerpMorphTarget("eyeLookOutRight",  Math.max(ex, 0)  * 0.4, 8, d);
    lerpMorphTarget("eyeLookInRight",   Math.max(-ex, 0) * 0.4, 8, d);
    lerpMorphTarget("eyeLookUpLeft",    Math.max(ey, 0)  * 0.3, 8, d);
    lerpMorphTarget("eyeLookDownLeft",  Math.max(-ey, 0) * 0.3, 8, d);
    lerpMorphTarget("eyeLookUpRight",   Math.max(ey, 0)  * 0.3, 8, d);
    lerpMorphTarget("eyeLookDownRight", Math.max(-ey, 0) * 0.3, 8, d);

    // ── Procedural body — runs after drei's mixer.update (priority 1) ─────
    const talking = isTalking.current;

    // Breathing: Spine/Chest rise on inhale, shoulders rise slightly
    const breathHz  = talking ? 0.35 : 0.2;
    const breathAmt = Math.sin(t * breathHz * Math.PI * 2);
    if (bones.current.Spine)  bones.current.Spine.rotation.x  += breathAmt * 0.006;
    if (bones.current.Spine1) bones.current.Spine1.rotation.x += breathAmt * 0.009;
    if (bones.current.LeftShoulder)  bones.current.LeftShoulder.rotation.z  += breathAmt * 0.004;
    if (bones.current.RightShoulder) bones.current.RightShoulder.rotation.z -= breathAmt * 0.004;

    // Idle sway — organic multi-sine noise on hips
    if (!talking) {
      const swayX = noise(t * 0.10, 0) * 0.012;
      const swayZ = noise(t * 0.07, 3) * 0.008;
      if (bones.current.Hips) {
        bones.current.Hips.rotation.x += swayX;
        bones.current.Hips.rotation.z += swayZ;
      }
    }

    // Head movement: bob during speech, gentle drift while idle
    if (talking) {
      const bob = Math.sin(t * 4.0) * 0.012 + noise(t * 0.5, 7) * 0.006;
      if (bones.current.Head) bones.current.Head.rotation.x += bob;
      if (bones.current.Neck) bones.current.Neck.rotation.x += bob * 0.3;
    } else {
      if (bones.current.Head) {
        bones.current.Head.rotation.y += noise(t * 0.08, 2) * 0.005;
        bones.current.Head.rotation.z += noise(t * 0.05, 5) * 0.003;
      }
    }
  }, 1);

  return (
    <group {...props} dispose={null} ref={group}>
      <primitive object={nodes.Hips} />
      <skinnedMesh name="Wolf3D_Body" geometry={nodes.Wolf3D_Body.geometry} material={materials.Wolf3D_Body} skeleton={nodes.Wolf3D_Body.skeleton} />
      <skinnedMesh name="Wolf3D_Outfit_Bottom" geometry={nodes.Wolf3D_Outfit_Bottom.geometry} material={materials.Wolf3D_Outfit_Bottom} skeleton={nodes.Wolf3D_Outfit_Bottom.skeleton} />
      <skinnedMesh name="Wolf3D_Outfit_Footwear" geometry={nodes.Wolf3D_Outfit_Footwear.geometry} material={materials.Wolf3D_Outfit_Footwear} skeleton={nodes.Wolf3D_Outfit_Footwear.skeleton} />
      <skinnedMesh name="Wolf3D_Outfit_Top" geometry={nodes.Wolf3D_Outfit_Top.geometry} material={materials.Wolf3D_Outfit_Top} skeleton={nodes.Wolf3D_Outfit_Top.skeleton} />
      <skinnedMesh name="Wolf3D_Hair" geometry={nodes.Wolf3D_Hair.geometry} material={materials.Wolf3D_Hair} skeleton={nodes.Wolf3D_Hair.skeleton} />
      <skinnedMesh name="EyeLeft" geometry={nodes.EyeLeft.geometry} material={materials.Wolf3D_Eye} skeleton={nodes.EyeLeft.skeleton} morphTargetDictionary={nodes.EyeLeft.morphTargetDictionary} morphTargetInfluences={nodes.EyeLeft.morphTargetInfluences} />
      <skinnedMesh name="EyeRight" geometry={nodes.EyeRight.geometry} material={materials.Wolf3D_Eye} skeleton={nodes.EyeRight.skeleton} morphTargetDictionary={nodes.EyeRight.morphTargetDictionary} morphTargetInfluences={nodes.EyeRight.morphTargetInfluences} />
      <skinnedMesh name="Wolf3D_Head" geometry={nodes.Wolf3D_Head.geometry} material={materials.Wolf3D_Skin} skeleton={nodes.Wolf3D_Head.skeleton} morphTargetDictionary={nodes.Wolf3D_Head.morphTargetDictionary} morphTargetInfluences={nodes.Wolf3D_Head.morphTargetInfluences} />
      <skinnedMesh name="Wolf3D_Teeth" geometry={nodes.Wolf3D_Teeth.geometry} material={materials.Wolf3D_Teeth} skeleton={nodes.Wolf3D_Teeth.skeleton} morphTargetDictionary={nodes.Wolf3D_Teeth.morphTargetDictionary} morphTargetInfluences={nodes.Wolf3D_Teeth.morphTargetInfluences} />
    </group>
  );
}

useGLTF.preload("/models/64f1a714fe61576b46f27ca2.glb");
useGLTF.preload("/models/animations.glb");
