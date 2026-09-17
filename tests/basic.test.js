import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { CASES, getCase } from "../src/cases.js";

test("worker entry and case engine exist", () => {
  assert.equal(fs.existsSync("src/index.js"), true);
  assert.equal(CASES.length, 100);
  assert.ok(CASES.every(c => c.id && c.question && c.options.length === 4));
});

test("case answers use zero-based indexes and case 001 accepts option B", () => {
  const c = getCase("case-001");
  assert.ok(c);
  assert.equal(c.answer, 1);
