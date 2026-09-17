import test from "node:test";
import assert from "node:assert/strict";
import { CASES, getCase, getDifficultyStats } from "../src/case-catalog.js";

test("case catalog exposes all 100 detective cases", () => {
  assert.equal(CASES.length, 100);
  assert.equal(getCase("case-001")?.id, "case-001");
  assert.equal(getCase("case-060")?.id, "case-060");
  assert.equal(getCase("case-100")?.id, "case-100");
  assert.equal(CASES.filter(c => c.advanced).length, 90);
});

test("100-case catalog keeps the actual difficulty distribution", () => {
  assert.deepEqual(getDifficultyStats(), {
    "آسان": 13,
    "متوسط": 25,
    "سخت": 25,
    "خیلی سخت": 21,
    "نابغه": 5,
    "ویژه": 10,
    "افسانه‌ای": 1
  });
});
