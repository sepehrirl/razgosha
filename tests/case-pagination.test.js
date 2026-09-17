import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { CASES } from "../src/cases.js";
import { CASES_PER_PAGE, getCasePage, getUnlockedCaseId } from "../src/case-pagination.js";
import { getSolvedCaseIds } from "../src/index.js";

test("case archive is paginated into 10 cases per page", () => {
  assert.equal(CASES_PER_PAGE, 10);
  const first = getCasePage(CASES, 1);
  const tenth = getCasePage(CASES, 10);
  assert.equal(first.items.length, 10);
  assert.equal(tenth.items.length, 10);
  assert.equal(first.items[0].id, "case-001");
  assert.equal(tenth.items[0].id, "case-091");
  assert.equal(first.totalPages, 10);
});

test("case archive clamps invalid pages", () => {
  assert.equal(getCasePage(CASES, 0).page, 1);
  assert.equal(getCasePage(CASES, 99).page, 10);
});

test("next unlocked case is the first unsolved case in sequence", () => {
  assert.equal(getUnlockedCaseId(CASES, new Set()), "case-001");
  assert.equal(getUnlockedCaseId(CASES, new Set(["case-001"])), "case-002");
  assert.equal(getUnlockedCaseId(CASES, new Set(["case-001", "case-002"])), "case-003");
});

test("solved case rows treat numeric and string zero as unsolved", () => {
  assert.deepEqual(
    [...getSolvedCaseIds([
      { case_id: "case-001", solved: 0 },
      { case_id: "case-002", solved: "0" },
      { case_id: "case-003", solved: 1 },
      { case_id: "case-004", solved: "1" }
    ])],
    ["case-003", "case-004"]
  );
});

test("index uses compact archive controls instead of 100 case buttons", () => {
  const source = fs.readFileSync("src/index.js", "utf8");
  assert.match(source, /caseListKeyboard/);
  assert.match(source, /getCasePage/);
  assert.match(source, /پرونده قابل انجام/);
});
