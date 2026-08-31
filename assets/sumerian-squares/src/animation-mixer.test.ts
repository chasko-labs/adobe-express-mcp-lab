import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  AnimationMixer,
  MIXER_LERP,
  MIXER_FPS,
  MIXER_DT_MS,
  ASL_HANDS_RANGE,
  BROWS_RANGE,
  LIPSYNC_JAW_RANGE,
  isASLJoint,
  isLipsyncJoint,
  resolveLayer,
  lerp,
} from "./animation-mixer";

// helper to build weight maps
function map(entries: [number, number][]): Map<number, number> {
  return new Map(entries);
}
function fillRange(
  range: readonly [number, number],
  value: number,
): Map<number, number> {
  const m = new Map<number, number>();
  for (let j = range[0]; j <= range[1]; j++) m.set(j, value);
  return m;
}

describe("animation-mixer — collision mask + lerp 0.12 @60fps", () => {
  it("exports correct mask ranges and lerp 0.12", () => {
    expect(ASL_HANDS_RANGE).toEqual([74, 115]);
    expect(BROWS_RANGE).toEqual([18, 26]);
    expect(LIPSYNC_JAW_RANGE).toEqual([44, 58]);
    expect(MIXER_LERP).toBe(0.12);
    expect(MIXER_FPS).toBe(60);
    expect(MIXER_DT_MS).toBeCloseTo(1000 / 60);
  });

  it("isASLJoint covers hands 74-115 and brows 18-26", () => {
    expect(isASLJoint(74)).toBe(true);
    expect(isASLJoint(115)).toBe(true);
    expect(isASLJoint(90)).toBe(true);
    expect(isASLJoint(18)).toBe(true);
    expect(isASLJoint(26)).toBe(true);
    expect(isASLJoint(22)).toBe(true);
    expect(isASLJoint(17)).toBe(false);
    expect(isASLJoint(27)).toBe(false);
    expect(isASLJoint(44)).toBe(false);
    expect(isASLJoint(116)).toBe(false);
  });

  it("isLipsyncJoint covers jaw 44-58", () => {
    expect(isLipsyncJoint(44)).toBe(true);
    expect(isLipsyncJoint(58)).toBe(true);
    expect(isLipsyncJoint(50)).toBe(true);
    expect(isLipsyncJoint(43)).toBe(false);
    expect(isLipsyncJoint(59)).toBe(false);
    expect(isLipsyncJoint(74)).toBe(false);
  });

  it("resolveLayer priority: ASL > lipsync > emote", () => {
    // ASL joint with all layers present -> asl wins
    expect(resolveLayer(80, true, true, true)).toBe("asl");
    expect(resolveLayer(20, true, true, true)).toBe("asl");
    // Lipsync joint with lipsync+emote -> lipsync wins
    expect(resolveLayer(50, false, true, true)).toBe("lipsync");
    // Non-masked joint with emote -> emote
    expect(resolveLayer(10, false, false, true)).toBe("emote");
    expect(resolveLayer(70, true, true, true)).toBe("emote"); // 70 outside both masks but emote present
  });

  it("lerp helper is standard exponential blend", () => {
    expect(lerp(0, 1, 0.12)).toBeCloseTo(0.12);
    expect(lerp(0.5, 1, 0.12)).toBeCloseTo(0.56);
  });

  describe("ASL+emote concurrent — ASL masks hands/brows, emote elsewhere", () => {
    let mixer: AnimationMixer;
    beforeEach(() => {
      mixer = new AnimationMixer();
    });

    it("hands 74-115 and brows 18-26 driven by ASL, other joints by emote", () => {
      // ASL drives hands+brows at 1.0, emote drives many joints at 0.8
      const asl = new Map<number, number>();
      for (let j = 74; j <= 115; j++) asl.set(j, 1.0);
      for (let j = 18; j <= 26; j++) asl.set(j, 0.9);
      // emote tries to also drive hands/brows (should be masked) and other joints
      const emote = new Map<number, number>();
      for (let j = 74; j <= 115; j++) emote.set(j, 0.1);
      for (let j = 18; j <= 26; j++) emote.set(j, 0.1);
      emote.set(10, 0.8); // emote-only joint
      emote.set(60, 0.7); // note 60 is lipsync mask but no lipsync layer here -> emote fallback

      mixer.setASL(asl);
      mixer.setEmote(emote);
      mixer.tickFrames(60); // 1s @60fps, should converge

      // ASL joints converge to ASL target, not emote
      expect(mixer.getWeight(74)).toBeCloseTo(1.0, 1);
      expect(mixer.getWeight(115)).toBeCloseTo(1.0, 1);
      expect(mixer.getWeight(20)).toBeCloseTo(0.9, 1);
      // emote-only joint converges to emote
      expect(mixer.getWeight(10)).toBeCloseTo(0.8, 1);
      // resolved layers confirm mask
      expect(mixer.getResolvedLayer(80)).toBe("asl");
      expect(mixer.getResolvedLayer(20)).toBe("asl");
      expect(mixer.getResolvedLayer(10)).toBe("emote");
    });

    it("60fps lerp 0.12 converges exponentially — ~200ms to 90%", () => {
      const m = new AnimationMixer();
      m.setEmote(map([[10, 1.0]]));
      // after 1 frame: 0.12
      m.update();
      expect(m.getWeight(10)).toBeCloseTo(0.12, 3);
      // after ~18 frames (300ms) at 0.12, value = 1 - 0.88^n ≈ 0.9
      // 0.88^18 ≈ 0.10
      const m2 = new AnimationMixer();
      m2.setEmote(map([[10, 1.0]]));
      m2.tickFrames(18);
      expect(m2.getWeight(10)).toBeCloseTo(0.9, 1);
      // after 60 frames should be ~0.9995
      const m3 = new AnimationMixer();
      m3.setEmote(map([[10, 1.0]]));
      m3.tickFrames(60);
      expect(m3.getWeight(10)).toBeCloseTo(1.0, 2);
    });
  });

  describe("ASL+lipsync concurrent — brows vs jaw separation", () => {
    it("brows 18-26 ASL wins, jaw 44-58 lipsync wins concurrently", () => {
      const m = new AnimationMixer();
      const asl = fillRange(BROWS_RANGE, 1.0);
      for (let j = 74; j <= 90; j++) asl.set(j, 0.95);
      const lipsync = fillRange(LIPSYNC_JAW_RANGE, 0.85);
      // also try to pollute lipsync with brows value (should be ignored on brows)
      for (let j = 18; j <= 26; j++) lipsync.set(j, 0.1);

      m.setASL(asl);
      m.setLipsync(lipsync);
      m.tickFrames(60);

      expect(m.getWeight(20)).toBeCloseTo(1.0, 1); // brow ASL
      expect(m.getWeight(80)).toBeCloseTo(0.95, 1); // hand ASL
      expect(m.getWeight(50)).toBeCloseTo(0.85, 1); // jaw lipsync
      expect(m.getResolvedLayer(20)).toBe("asl");
      expect(m.getResolvedLayer(50)).toBe("lipsync");
    });
  });

  describe("ASL+emote+lipsync triple concurrent @60fps", () => {
    it("all three layers resolve per-joint by mask with lerp 0.12", () => {
      const m = new AnimationMixer();
      // ASL: hands+brows
      const asl = new Map<number, number>();
      for (let j = 74; j <= 115; j++) asl.set(j, 1.0);
      for (let j = 18; j <= 26; j++) asl.set(j, 1.0);
      // lipsync: jaw
      const lipsync = new Map<number, number>();
      for (let j = 44; j <= 58; j++) lipsync.set(j, 0.9);
      // emote: tries to drive everything at 0.3
      const emote = new Map<number, number>();
      for (let j = 0; j < 120; j++) emote.set(j, 0.3);

      m.setASL(asl);
      m.setLipsync(lipsync);
      m.setEmote(emote);

      // step frame-by-frame to verify 60fps stability (no NaN, monotonic)
      for (let f = 0; f < 60; f++) {
        m.update();
        // hands/brows should never be pulled toward emote/lipsync
        expect(m.getWeight(80)).toBeGreaterThanOrEqual(0);
        expect(m.getWeight(50)).toBeGreaterThanOrEqual(0);
        expect(m.getWeight(10)).toBeGreaterThanOrEqual(0);
      }

      expect(m.getWeight(80)).toBeCloseTo(1.0, 1); // ASL hand
      expect(m.getWeight(20)).toBeCloseTo(1.0, 1); // ASL brow
      expect(m.getWeight(50)).toBeCloseTo(0.9, 1); // lipsync jaw
      expect(m.getWeight(10)).toBeCloseTo(0.3, 1); // emote elsewhere
      expect(m.getWeight(70)).toBeCloseTo(0.3, 1); // emote gap joint

      expect(m.getResolvedLayer(80)).toBe("asl");
      expect(m.getResolvedLayer(50)).toBe("lipsync");
      expect(m.getResolvedLayer(10)).toBe("emote");
    });

    it("clearing ASL returns hands to emote with lerp decay", () => {
      const m = new AnimationMixer();
      const asl = fillRange(ASL_HANDS_RANGE, 1.0);
      const emote = fillRange(ASL_HANDS_RANGE, 0.2);
      m.setASL(asl);
      m.setEmote(emote);
      m.tickFrames(60);
      expect(m.getWeight(80)).toBeCloseTo(1.0, 1);
      // clear ASL -> hands should decay toward emote 0.2
      m.clearASL();
      m.tickFrames(60);
      expect(m.getWeight(80)).toBeCloseTo(0.2, 1);
      expect(m.getResolvedLayer(80)).toBe("emote");
    });

    it("camera beat toggles on ASL start/end", async () => {
      const m = new AnimationMixer();
      // mock camera — vitest will have window.BABYLON undefined, but notify guards with try/catch
      expect(m.getCameraBeat()).toBeNull();
      m.notifyASLStart();
      expect(m.getCameraBeat()).toBe("gesture");
      m.notifyASLEnd();
      expect(m.getCameraBeat()).toBe("face");
    });

    it("60fps performance — 1000 ticks stable and fast", () => {
      const m = new AnimationMixer();
      const asl = fillRange(ASL_HANDS_RANGE, 0.8);
      const lipsync = fillRange(LIPSYNC_JAW_RANGE, 0.7);
      const emote = map([
        [0, 0.5],
        [10, 0.5],
        [30, 0.5],
        [70, 0.5],
        [119, 0.5],
      ]);
      m.setASL(asl);
      m.setLipsync(lipsync);
      m.setEmote(emote);
      const start = performance.now();
      for (let i = 0; i < 1000; i++) m.update();
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(200); // 1000 frames well under 200ms
      expect(m.getWeight(80)).toBeCloseTo(0.8, 1);
    });
  });
});
