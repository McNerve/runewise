import { describe, it, expect } from "vitest";
import { generatePlan } from "./trainingPlan";
import { xpForLevel } from "./xp";

describe("generatePlan", () => {
  it("returns empty plan when all targets are already met", () => {
    const plan = generatePlan({ Attack: 70 }, { Attack: 70 });
    expect(plan.steps).toEqual([]);
    expect(plan.totalHours).toBe(0);
    expect(plan.skills).toEqual([]);
  });

  it("skips skills with no training methods", () => {
    const plan = generatePlan({ MadeUpSkill: 1 }, { MadeUpSkill: 50 });
    expect(plan.steps).toEqual([]);
  });

  it("builds a step with correct XP, actions, and hours for Attack", () => {
    const current = 1;
    const target = 50;
    const plan = generatePlan({ Attack: current }, { Attack: target }, "fastest");

    expect(plan.steps).toHaveLength(1);
    const step = plan.steps[0]!;
    expect(step.skill).toBe("Attack");
    expect(step.fromLevel).toBe(current);
    expect(step.toLevel).toBe(target);

    const xpNeeded = xpForLevel(target) - xpForLevel(current);
    expect(step.xpNeeded).toBe(xpNeeded);
    expect(step.actions).toBe(Math.ceil(xpNeeded / step.method.xp));
    expect(step.hours).toBeCloseTo(xpNeeded / (step.method.xpPerHour ?? 1), 5);
    expect(step.alternatives.length).toBeGreaterThan(0);
    expect(plan.totalHours).toBe(step.hours);
    expect(plan.skills).toEqual(["Attack"]);
  });

  it("prefers highest xp/hr for fastest preference", () => {
    const plan = generatePlan({ Attack: 70 }, { Attack: 80 }, "fastest");
    expect(plan.steps).toHaveLength(1);
    // At 70+, Nightmare Zone is the top Attack method by xp/hr.
    expect(plan.steps[0]!.method.name).toBe("Nightmare Zone");
  });

  it("prefers afk/low intensity methods when preference is afk", () => {
    const plan = generatePlan({ Attack: 70 }, { Attack: 80 }, "afk");
    expect(plan.steps).toHaveLength(1);
    const intensity = plan.steps[0]!.method.intensity ?? "medium";
    expect(["afk", "low"]).toContain(intensity);
  });

  it("filters out ironman-inviable methods when ironmanMode is true", () => {
    // Prayer has high-xp methods marked ironmanViable: false (e.g. dragon bones buyables).
    const main = generatePlan({ Prayer: 1 }, { Prayer: 43 }, "fastest", false);
    const iron = generatePlan({ Prayer: 1 }, { Prayer: 43 }, "fastest", true);

    expect(main.steps).toHaveLength(1);
    expect(iron.steps).toHaveLength(1);
    expect(iron.steps[0]!.method.ironmanViable).not.toBe(false);
    // Main mode can pick a non-iron method with higher xp/hr.
    expect(main.steps[0]!.method.xpPerHour ?? 0).toBeGreaterThanOrEqual(
      iron.steps[0]!.method.xpPerHour ?? 0
    );
  });

  it("sorts multi-skill steps by hours descending", () => {
    const plan = generatePlan(
      { Attack: 1, Strength: 1 },
      { Attack: 99, Strength: 50 },
      "fastest"
    );
    expect(plan.steps.length).toBe(2);
    expect(plan.steps[0]!.hours).toBeGreaterThanOrEqual(plan.steps[1]!.hours);
    expect(plan.totalHours).toBeCloseTo(
      plan.steps.reduce((sum, s) => sum + s.hours, 0),
      5
    );
  });
});
