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
  assert.equal(c.options[c.answer], "۲۳:۲۹ تا ۲۳:۳۴");
  assert.equal(c.options.length, 4);
});

test("answer callback format remains compatible with case IDs", () => {
  const c = getCase("case-001");
  const callback = `answer:${c.id}:${c.answer}`;
  const [, caseId, raw] = callback.split(":");
  assert.equal(caseId, "case-001");
  assert.equal(Number(raw), c.answer);
});

test("bot uses reply keyboards instead of inline keyboards", () => {
  const source = fs.readFileSync("src/index.js", "utf8");
  assert.match(source, /keyboard:/);
  assert.doesNotMatch(source, /inline_keyboard/);
  assert.doesNotMatch(source, /callback_data/);
});

test("bot supports typing indicators and safe message reactions", () => {
  const source = fs.readFileSync("src/index.js", "utf8");
  assert.match(source, /sendChatAction/);
  assert.match(source, /action:\s*["']typing["']/);
  assert.match(source, /setMessageReaction/);
  assert.match(source, /type:\s*["']emoji["']/);
  assert.match(source, /reaction_error/);
});

test("help section has dedicated topic buttons and creator identity", () => {
  const source = fs.readFileSync("src/index.js", "utf8");
  assert.match(source, /HELP_LABEL/);
  assert.match(source, /نحوه بازی/);
  assert.match(source, /قوانین رازگشا/);
  assert.match(source, /امتیاز و رتبه‌بندی/);
  assert.match(source, /دستاوردها/);
  assert.match(source, /آیتم‌ها و کوله‌باز/);
  assert.match(source, /مأموریت روزانه/);
  assert.match(source, /حساب کاربری/);
  assert.match(source, /نکات کارآگاهی/);
  assert.match(source, /درباره رازگشا/);
  assert.match(source, /am_sepehr_s/);
});

test("D1 migrations contain required game tables", () => {
  const initial = fs.readFileSync("migrations/0001_initial.sql", "utf8");
  const rewards = fs.readFileSync("migrations/0002_case_rewards.sql", "utf8");
  const systems = fs.readFileSync("migrations/0003_accounts_and_game_system.sql", "utf8");
  assert.match(initial, /CREATE TABLE IF NOT EXISTS players/);
  assert.match(initial, /CREATE TABLE IF NOT EXISTS player_progress/);
  assert.match(rewards, /CREATE TABLE IF NOT EXISTS case_rewards/);
  assert.match(rewards, /UNIQUE\(player_id, case_id\)/);
  assert.match(systems, /account_status/);
  assert.match(systems, /CREATE TABLE IF NOT EXISTS player_achievements/);
  assert.match(systems, /CREATE TABLE IF NOT EXISTS player_inventory/);
  assert.match(systems, /CREATE TABLE IF NOT EXISTS daily_missions/);
});
