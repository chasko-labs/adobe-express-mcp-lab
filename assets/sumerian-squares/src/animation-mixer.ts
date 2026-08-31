// Collision mask + mixer — ASL hands 74-115+brows 18-26 > lipsync jaw 44-58 > emote, lerp 0.12 per 60fps frame.
// Prior refs: blender-projects/latrodectus-bishopi-hand.blend 42 joints HOST_SCORECARD 74-115 (21/hand),
// fixtures/asl/<gloss>.glb 72 clips NLA→KHR_animation_pointer additive, validate-joints 74-115.

import { zoomToFace, zoomToGesture } from "./camera";

// --- joint masks (inclusive ranges) ---
export const ASL_HANDS_RANGE = [74, 115] as const;
export const BROWS_RANGE = [18, 26] as const;
export const LIPSYNC_JAW_RANGE = [44, 58] as const;

// lerp factor per tick at 60fps — exponential smoothing; ~0.12 yields ~200ms to 90% convergence
export const MIXER_LERP = 0.12;
export const MIXER_FPS = 60;
export const MIXER_DT_MS = 1000 / MIXER_FPS;

// --- helpers ---
export function inRange(
  joint: number,
  range: readonly [number, number],
): boolean {
  return joint >= range[0] && joint <= range[1];
}

export function isASLJoint(joint: number): boolean {
  return inRange(joint, ASL_HANDS_RANGE) || inRange(joint, BROWS_RANGE);
}

export function isLipsyncJoint(joint: number): boolean {
  return inRange(joint, LIPSYNC_JAW_RANGE);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// Priority resolver: ASL masked joints dominate, then lipsync jaw, then emote fallback.
// Masks enforce that a layer only drives joints inside its ownership; emote is the catch-all.
export type Layer = "asl" | "lipsync" | "emote" | "idle";

export function resolveLayer(
  joint: number,
  hasASL: boolean,
  hasLipsync: boolean,
  hasEmote: boolean,
): Layer | null {
  if (isASLJoint(joint) && hasASL) return "asl";
  if (isLipsyncJoint(joint) && hasLipsync) return "lipsync";
  if (hasEmote) return "emote";
  // fallback for joints outside all masks but still driven by higher layers
  // (should not occur for well-formed masks, but preserve priority)
  if (hasASL) return "asl";
  if (hasLipsync) return "lipsync";
  return null;
}

// --- core mixer ---
export type JointWeights = Map<number, number>;

export class AnimationMixer {
  /** current blended output weights per joint */
  private current = new Map<number, number>();
  private asl = new Map<number, number>();
  private lipsync = new Map<number, number>();
  private emote = new Map<number, number>();
  private _lerp = MIXER_LERP;

  // camera beat tracking — so update() can optionally drive framing
  private cameraBeat: "face" | "gesture" | null = null;

  get lerpFactor(): number {
    return this._lerp;
  }
  set lerpFactor(v: number) {
    this._lerp = v;
  }

  // --- layer setters ---
  setASL(weights: JointWeights | Record<number, number> | null): void {
    this.asl.clear();
    if (!weights) return;
    for (const [k, v] of weights instanceof Map
      ? weights
      : Object.entries(weights)) {
      this.asl.set(Number(k), v as number);
    }
  }
  setLipsync(weights: JointWeights | Record<number, number> | null): void {
    this.lipsync.clear();
    if (!weights) return;
    for (const [k, v] of weights instanceof Map
      ? weights
      : Object.entries(weights)) {
      this.lipsync.set(Number(k), v as number);
    }
  }
  setEmote(weights: JointWeights | Record<number, number> | null): void {
    this.emote.clear();
    if (!weights) return;
    for (const [k, v] of weights instanceof Map
      ? weights
      : Object.entries(weights)) {
      this.emote.set(Number(k), v as number);
    }
  }
  clearASL(): void {
    this.asl.clear();
  }
  clearLipsync(): void {
    this.lipsync.clear();
  }
  clearEmote(): void {
    this.emote.clear();
  }
  clearAll(): void {
    this.asl.clear();
    this.lipsync.clear();
    this.emote.clear();
  }

  /** all joints that have any target */
  private allJoints(): Set<number> {
    const s = new Set<number>();
    for (const k of this.asl.keys()) s.add(k);
    for (const k of this.lipsync.keys()) s.add(k);
    for (const k of this.emote.keys()) s.add(k);
    for (const k of this.current.keys()) s.add(k);
    return s;
  }

  private targetFor(joint: number): number | null {
    const hasASL = this.asl.has(joint);
    const hasLipsync = this.lipsync.has(joint);
    const hasEmote = this.emote.has(joint);
    const layer = resolveLayer(joint, hasASL, hasLipsync, hasEmote);
    if (layer === "asl") return this.asl.get(joint)!;
    if (layer === "lipsync") return this.lipsync.get(joint)!;
    if (layer === "emote") return this.emote.get(joint)!;
    return null;
  }

  /** One 60fps tick: exponential lerp 0.12 toward resolved target per joint. */
  update(): void {
    for (const joint of this.allJoints()) {
      const target = this.targetFor(joint);
      if (target === null) {
        // decay to 0 when no layer drives this joint
        const cur = this.current.get(joint) ?? 0;
        this.current.set(joint, lerp(cur, 0, this._lerp));
      } else {
        const cur = this.current.get(joint) ?? 0;
        this.current.set(joint, lerp(cur, target, this._lerp));
      }
    }
  }

  /** Advance n frames (dt = 1000/60 each) */
  tickFrames(n: number): void {
    for (let i = 0; i < n; i++) this.update();
  }

  getWeight(joint: number): number {
    return this.current.get(joint) ?? 0;
  }

  getOutput(): ReadonlyMap<number, number> {
    return this.current;
  }

  // snapshot of resolved layer per joint (for tests/debug)
  getResolvedLayer(joint: number): Layer | null {
    return resolveLayer(
      joint,
      this.asl.has(joint),
      this.lipsync.has(joint),
      this.emote.has(joint),
    );
  }

  // --- camera wiring ---
  /** Call when ASL gloss starts — drives gesture framing so hands read. */
  notifyASLStart(): void {
    this.cameraBeat = "gesture";
    try {
      zoomToGesture();
    } catch {}
  }
  /** Call when ASL gloss ends — return to face framing. */
  notifyASLEnd(): void {
    this.cameraBeat = "face";
    try {
      zoomToFace();
    } catch {}
  }
  getCameraBeat(): "face" | "gesture" | null {
    return this.cameraBeat;
  }

  // --- diagnostics ---
  isASLJoint = isASLJoint;
  isLipsyncJoint = isLipsyncJoint;
}

// singleton wired to game-controller
export const animationMixer = new AnimationMixer();

// convenience for game-controller: play an ASL gloss by name, clearing prior ASL
export function playASLGloss(
  gloss: string,
  weights: JointWeights | Record<number, number>,
): void {
  // gloss param retained for tracing (matches fixtures/asl/<gloss>.glb, G01-G72, 420ms)
  void gloss;
  animationMixer.setASL(weights as JointWeights);
  animationMixer.notifyASLStart();
}
export function stopASLGloss(): void {
  animationMixer.clearASL();
  animationMixer.notifyASLEnd();
}

// re-export range constants for tests (prior result 1 parity)
export const HAND_JOINTS = ASL_HANDS_RANGE;
export const BROW_JOINTS = BROWS_RANGE;
export const JAW_JOINTS = LIPSYNC_JAW_RANGE;
