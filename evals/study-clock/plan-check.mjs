// Deterministic checks for the weekly-plan engine and block bookkeeping in
// .omp/extensions/study-clock.js. No model calls, no learner data.
// Usage: node evals/study-clock/plan-check.mjs [path/to/study-clock.js]
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const extPath = resolve(process.argv[2] ?? new URL("../../.omp/extensions/study-clock.js", import.meta.url).pathname);
const m = await import(pathToFileURL(extPath).href);
let passed = 0;
const check = (name, fn) => { fn(); passed++; console.log(`ok - ${name}`); };

// Wednesday 2026-10-28 08:00 local time (tests use local dates throughout).
const at = (y, mo, d, h = 8, mi = 0) => new Date(y, mo - 1, d, h, mi).getTime();
const NOW = at(2026, 10, 28);
const weekdays = [
  ...["lunes", "miércoles", "viernes"].map(day => ({ day, start: "19:00", durationMinutes: 120, subject: "ELE101" })),
  ...["martes", "jueves"].map(day => ({ day, start: "19:00", durationMinutes: 120, subject: "QUI101" })),
  { day: "sábado", start: "09:00", durationMinutes: 180 },
];
const items = [
  { subject: "FIS001", topic: "FIS001-T01", hours: 6 },
  { subject: "FIS001", topic: "FIS001-T02", hours: 6 },
  { subject: "QUI101", topic: "QUI101-T01", hours: 4, after: ["FIS001"] },
  { subject: "ELE101", topic: "ELE101-T01", hours: 5, after: ["FIS001"] },
  { subject: "DIS101", topic: "DIS101-T01", hours: 1, days: ["sat"] },
];
const plan = () => m.buildPlan({ name: "t", slots: weekdays, items }, "P1", NOW);

check("Spanish and English day names normalize", () => {
  assert.equal(m.normDay("miércoles"), "wed");
  assert.equal(m.normDay("Sat"), "sat");
  assert.throws(() => m.normDay("funday"));
});

check("every scheduled minute equals the hour budget", () => {
  const { sessions, unscheduled } = m.materialize(plan(), NOW);
  assert.equal(unscheduled.length, 0);
  const total = sessions.flatMap(s => s.alloc).reduce((a, x) => a + x.minutes, 0);
  assert.equal(total, items.reduce((a, x) => a + x.hours * 60, 0));
  for (const s of sessions) assert.ok(s.minutes <= 180);
});

check("prerequisites are scheduled before dependent topics", () => {
  const { sessions } = m.materialize(plan(), NOW);
  const firstOf = subject => sessions.findIndex(s => s.alloc.some(a => a.subject === subject));
  const lastFis = sessions.findLastIndex(s => s.alloc.some(a => a.subject === "FIS001"));
  assert.ok(firstOf("QUI101") >= lastFis && firstOf("ELE101") >= lastFis);
});

check("a preferred-subject slot falls back to the queue; strict slots do not", () => {
  const first = m.materialize(plan(), NOW).sessions[0];
  assert.equal(first.date, "2026-10-28");
  assert.equal(first.alloc[0].subject, "FIS001"); // Wednesday prefers ELE101, which waits for FIS001
  const strict = m.buildPlan({ slots: weekdays.map(s => (s.subject ? { ...s, strict: true } : s)), items }, "P2", NOW);
  const weekdaySessions = m.materialize(strict, NOW).sessions.filter(s => s.day !== "sat");
  for (const s of weekdaySessions) for (const a of s.alloc) assert.equal(a.subject, weekdays.find(w => m.normDay(w.day) === s.day).subject);
});

check("days restriction and grouping of several topics in one slot", () => {
  const { sessions } = m.materialize(plan(), NOW);
  const dis = sessions.filter(s => s.alloc.some(a => a.subject === "DIS101"));
  assert.ok(dis.length && dis.every(s => s.day === "sat"));
  assert.ok(sessions.some(s => s.alloc.length > 1), "expected at least one slot with several topics");
});

check("until reports the deficit and the extra minutes per week", () => {
  const p = m.buildPlan({ slots: weekdays, items, until: "2026-11-01" }, "P3", NOW);
  const r = m.planReport(p, NOW, 1);
  assert.equal(r.finishAll, null);
  assert.ok(r.deficit.minutes > 0 && r.deficit.extraMinutesPerWeek > 0);
});

check("studied minutes are credited and missed sessions move the finish date", () => {
  const p = plan();
  const baseline = m.planReport(p, NOW).finishAll;
  m.attributeBlock(p, { allocation: [{ itemId: "I1", minutes: 120 }] }, 90);
  assert.equal(p.items[0].doneMinutes, 90);
  const skipped = m.planReport(p, at(2026, 11, 3)).finishAll; // nothing else studied for several days
  assert.ok(skipped > baseline, `${skipped} should be after ${baseline}`);
});

check("today's session is consistent with the calendar and skips begun slots", () => {
  const p = plan();
  const today = m.todaySessions(p, NOW);
  assert.equal(today.length, 1);
  assert.equal(today[0].start, "19:00");
  p.begun.push("2026-10-28@19:00");
  assert.equal(m.todaySessions(p, NOW).length, 0);
});

check("invalid plans are rejected", () => {
  assert.throws(() => m.buildPlan({ slots: [], items }, "P", NOW));
  assert.throws(() => m.buildPlan({ slots: weekdays, items: [{ subject: "X", hours: 1, after: ["NOPE"] }] }, "P", NOW));
  assert.throws(() => m.buildPlan({ slots: [{ day: "mon", start: "25:00", durationMinutes: 60 }], items }, "P", NOW));
  assert.throws(() => m.buildPlan({ slots: [{ day: "mon", start: "19:00", durationMinutes: 60, subject: "A", strict: true }], items: [{ subject: "B", hours: 1 }] }, "P", NOW));
});

check("task estimate calibration and fit decision", () => {
  const samples = Array.from({ length: 3 }, () => ({ subject: "S", estimateMin: 20, actualMin: 30 }));
  assert.deepEqual(m.calibration(samples, "S"), { factor: 1.5, basis: "subject", samples: 3 });
  assert.equal(m.calibration([], "S").factor, 1);
});

console.log(`\n${passed} checks passed (${extPath})`);
