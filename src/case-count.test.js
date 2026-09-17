import test from "node:test";
import assert from "node:assert/strict";
import { CASES } from "./cases.js";

test("Razgosha has 100 playable cases", () => {
  assert.equal(CASES.length, 100);
});

test("case IDs are unique and sequential from 001 to 100", () => {
  const ids = CASES.map(({ id }) => id);
  assert.equal(new Set(ids).size, 100);
  assert.deepEqual(ids, Array.from({ length: 100 }, (_, i) => `case-${String(i + 1).padStart(3, "0")}`));
});
