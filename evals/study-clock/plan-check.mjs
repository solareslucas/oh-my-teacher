// Deterministic checks for the weekly-plan engine and block bookkeeping in
// .omp/extensions/study-clock.js. No model calls, no learner data.
// Usage: node evals/study-clock/plan-check.mjs [path/to/study-clock.js]
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const extPath = resolve(process.argv[2] ?? new URL("../../.omp/extensions/study-clock.js", import.meta.url).pathname);
const m = await import(pathToFileURL(extPath).href);
let passed = 0;
const check = (name, fn) => { fn(); passed++; console.log(`ok - ${name}`); };
const checkAsync = async (name, fn) => { await fn(); passed++; console.log(`ok - ${name}`); };

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

// Native tool/event regression harness. Only fictional temporary records are
// used; no OMP process, model provider, timers, or repository profiles are read.
const MINUTE = 60_000;
function host(cwd) {
  const schema = { optional() { return this; }, describe() { return this; } };
  const z = {
    object: o => o, enum: values => ({ ...schema, values }),
    string: () => schema, boolean: () => schema, number: () => schema, array: () => schema,
  };
  const handlers = {};
  const alerts = [];
  const messages = [];
  const statuses = [];
  let tool, tick;
  m.default({
    zod: z, registerTool: t => (tool = t), on: (event, fn) => (handlers[event] = fn),
    sendMessage: (...args) => messages.push(args),
  });
  const ctx = {
    cwd, agent: { kind: "main" }, hasUI: true, isIdle: () => true,
    ui: { notify: (...args) => alerts.push(args), setStatus: (...args) => statuses.push(args) },
    setInterval: (fn, ms) => { assert.equal(ms, MINUTE); tick = fn; },
  };
  return {
    tool, handlers, alerts, messages, statuses, ctx,
    call: async params => (await tool.execute("check", params, null, null, ctx)).details,
    start: () => handlers.session_start({}, ctx),
    tick: () => tick(),
    turn: () => handlers.before_agent_start({ reason: "prompt", systemPrompt: ["base"] }, ctx),
  };
}
async function withClock(fn) {
  const cwd = mkdtempSync(join(tmpdir(), "clock-check-"));
  const dir = join(cwd, ".teacher", "learners", "clock-fictional");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "profile.md"), "Fictional temporary clock-test profile.\n");
  const file = join(dir, "schedule.json");
  const originalNow = Date.now;
  let now = NOW;
  Date.now = () => now;
  try {
    await fn({
      ...host(cwd), cwd, file,
      set: minutes => { now = NOW + minutes * MINUTE; },
      reload: () => host(cwd),
      persisted: () => JSON.parse(readFileSync(file, "utf8")),
      select: { alias: "clock-fictional", persist: true },
    });
  } finally {
    Date.now = originalNow;
    rmSync(cwd, { recursive: true, force: true });
  }
}
const basic = { action: "plan", subject: "CLOCK000", durationMinutes: 60, title: "Fictional task", estimateMinutes: 30 };
const weekly = {
  action: "plan_week", name: "Fictional weekly plan",
  slots: [{ day: "wed", start: "08:00", durationMinutes: 60 }],
  items: [{ subject: "CLOCK000", topic: "First", hours: 0.5 }, { subject: "CLOCK000", topic: "Second", hours: 1 }],
};

await checkAsync("pause/resume are native actions with write approval and invalid transitions are atomic", () => withClock(async h => {
  assert.ok(h.tool.parameters.action.values.includes("pause"));
  assert.ok(h.tool.parameters.action.values.includes("resume"));
  for (const action of ["pause", "resume"]) {
    assert.equal(h.tool.approval({ action }), "write");
    assert.equal(h.tool.approval({ action, persist: false }), "read");
    await assert.rejects(h.call({ action }), /No .*block/);
  }
  const before = await h.call(basic);
  await assert.rejects(h.call({ action: "resume" }), /No paused block/);
  assert.deepEqual((await h.call({ action: "status" })).active, before.active);
}));

await checkAsync("paused block/task status freezes while host time and turn injection continue", () => withClock(async h => {
  await h.call(basic);
  h.set(10);
  const paused = (await h.call({ action: "pause" })).active;
  h.set(100);
  const status = await h.call({ action: "status" });
  assert.equal(status.clock.epochMs, NOW + 100 * MINUTE);
  assert.equal(status.active.status, "paused");
  assert.equal(status.active.elapsedMin, 10);
  assert.equal(status.active.remainingMin, 50);
  assert.deepEqual(status.active.task, paused.task);
  assert.equal(status.active.task.elapsedMin, 10);
  assert.equal(status.active.task.remainingMin, 20);
  assert.equal(status.active.overtime, false);
  assert.equal(status.active.pausedMin, 90);
  assert.match(status.message, /PAUSED.*frozen/);
  assert.match(h.turn().message.content, /paused block:.*PAUSED/);
  assert.equal((await h.call({ action: "list" })).blocks[0].remainingMin, 50);
  assert.equal(h.turn().systemPrompt[0], "base");
}));

await checkAsync("multiple pause cycles shift deadlines without changing block/task identity or start", () => withClock(async h => {
  const original = (await h.call(basic)).active;
  h.set(5);
  await h.call({ action: "pause" });
  h.set(35);
  let resumed = (await h.call({ action: "resume" })).active;
  assert.equal(Date.parse(resumed.endsAt), NOW + 90 * MINUTE);
  assert.equal(Date.parse(resumed.task.projectedEnd), NOW + 60 * MINUTE);
  h.set(40);
  await h.call({ action: "pause" });
  h.set(50);
  resumed = (await h.call({ action: "resume" })).active;
  assert.equal(resumed.id, original.id);
  assert.equal(resumed.task.id, original.task.id);
  assert.equal(resumed.start, original.start);
  assert.equal(resumed.elapsedMin, 10);
  assert.equal(resumed.task.elapsedMin, 10);
  assert.equal(resumed.remainingMin, 50);
  assert.equal(resumed.pausedMin, 40);
  assert.equal(Date.parse(resumed.endsAt), NOW + 100 * MINUTE);
  assert.equal(Date.parse(resumed.task.projectedEnd), NOW + 70 * MINUTE);
  h.set(55);
  assert.equal((await h.call({ action: "status" })).active.task.elapsedMin, 15);
}));

await checkAsync("rescoping after a break uses study-time fit and shifted task projection", () => withClock(async h => {
  await h.call({ action: "plan", subject: "CLOCK000", durationMinutes: 60 });
  h.set(10);
  await h.call({ action: "task_start", title: "Oversized", estimateMinutes: 70 });
  h.set(20);
  await h.call({ action: "pause" });
  h.set(50);
  await h.call({ action: "resume" });
  const tooLarge = await h.call({ action: "task_rescope", estimateMinutes: 70 });
  assert.match(tooLarge.message, /does not fit/); // 50 study minutes available, not 80.
  const fit = await h.call({ action: "task_rescope", title: "Reduced", estimateMinutes: 50 });
  assert.match(fit.message, /now fits/);
  assert.equal(fit.active.task.elapsedMin, 10);
  assert.equal(fit.active.task.spillsPastBlock, false);
  assert.equal(fit.active.task.lastTask, true);
  assert.equal(Date.parse(fit.active.task.projectedEnd), NOW + 90 * MINUTE);
  assert.match(fit.message, new RegExp(m.isoLocal(NOW + 90 * MINUTE).slice(11, 16)));
}));

await checkAsync("task calibration and weekly credit exclude breaks, including tasks started afterward", () => withClock(async h => {
  await h.call({ ...weekly, ...h.select });
  await h.call({ action: "begin", planId: "P1" });
  await h.call({ action: "task_start", title: "Before break", estimateMinutes: 20 });
  h.set(10);
  await h.call({ action: "pause" });
  h.set(40);
  await h.call({ action: "resume" });
  h.set(50);
  await h.call({ action: "task_next", title: "After break", estimateMinutes: 10 });
  h.set(60);
  await h.call({ action: "task_end", outcome: "completed" });
  const ended = await h.call({ action: "end" });
  assert.equal(ended.active, null);
  const state = h.persisted();
  assert.deepEqual(state.blocks[0].tasks.map(t => t.actualMin), [20, 10]);
  assert.deepEqual(state.calibration.map(s => s.actualMin), [20, 10]);
  assert.equal(state.blocks[0].actualMin, 30);
  assert.deepEqual(state.plans[0].items.map(i => i.doneMinutes), [15, 15]);
  assert.equal(state.blocks[0].tasks[0].startedAt, m.isoLocal(NOW));
  assert.equal(state.blocks[0].tasks[1].startedAt, m.isoLocal(NOW + 50 * MINUTE));
  assert.match(ended.message, /after 30m of 1h 0m planned/);
}));

await checkAsync("ending while paused closes the same task and credits only study minutes", () => withClock(async h => {
  await h.call({ ...weekly, ...h.select });
  await h.call({ action: "begin", planId: "P1" });
  h.set(5);
  await h.call({ action: "task_start", title: "Partial", estimateMinutes: 20 });
  h.set(10);
  await h.call({ action: "pause" });
  h.set(30);
  await h.call({ action: "resume" });
  h.set(40);
  await h.call({ action: "pause" });
  h.set(100);
  const ended = await h.call({ action: "end", note: "Stopped during a break" });
  assert.equal(ended.active, null);
  const state = h.persisted();
  const b = state.blocks[0];
  assert.equal(b.status, "ended");
  assert.equal(b.actualMin, 20);
  assert.equal(b.pausedMs, 80 * MINUTE);
  assert.equal(b.pausedAt, undefined);
  assert.equal(b.startedAt, m.isoLocal(NOW));
  assert.equal(b.endedAt, m.isoLocal(NOW + 100 * MINUTE));
  assert.equal(b.tasks[0].status, "partial");
  assert.equal(b.tasks[0].actualMin, 15);
  assert.equal(b.tasks[0].pausedMs, 80 * MINUTE);
  assert.equal(state.calibration.length, 0);
  assert.deepEqual(state.plans[0].items.map(i => i.doneMinutes), [10, 10]);
  await assert.rejects(h.call({ action: "resume" }), /No paused block/);
  await h.call({ action: "plan", subject: "NEW000", durationMinutes: 20 });
}));

await checkAsync("paused task mutations, extensions, and competing starts fail without memory/disk changes", () => withClock(async h => {
  for (const persist of [false, true]) {
    const select = { ...h.select, persist };
    await h.call({ ...basic, ...select });
    await h.call({ action: "plan", subject: "FUTURE000", durationMinutes: 20, start: m.isoLocal(NOW + 120 * MINUTE) });
    await h.call({ action: "pause" });
    const before = (await h.call({ action: "status" })).active;
    const disk = persist ? readFileSync(h.file, "utf8") : null;
    for (const params of [
      { action: "pause" },
      { action: "task_start", title: "Blocked", estimateMinutes: 10 },
      { action: "task_next", title: "Blocked", estimateMinutes: 10 },
      { action: "task_rescope", estimateMinutes: 10 },
      { action: "task_end", outcome: "completed" },
      { action: "extend", minutes: 10 },
      { action: "plan", subject: "CONFLICT000", durationMinutes: 10 },
      { action: "begin", blockId: "B002" },
      { action: "begin", planId: "P1" },
    ]) {
      await assert.rejects(h.call(params), /paused/);
      assert.deepEqual((await h.call({ action: "status" })).active, before);
      if (persist) assert.equal(readFileSync(h.file, "utf8"), disk);
    }
    assert.equal((await h.call({ action: "list" })).blocks.length, 2);
    await h.call({ action: "end" });
  }
}));

await checkAsync("paused persistence survives fresh extension instances and legacy v1 fields remain optional", () => withClock(async h => {
  // Legacy v1 fixture deliberately has no plans, calibration, or pause fields.
  writeFileSync(h.file, JSON.stringify({
    version: 1,
    blocks: [{
      id: "B001", subject: "LEGACY000", status: "active", durationMin: 60,
      plannedStart: m.isoLocal(NOW), startedAt: m.isoLocal(NOW), endsAt: m.isoLocal(NOW + 60 * MINUTE),
      adjustments: [], tasks: [{
        id: "T1", title: "Legacy task", status: "running", startedAt: m.isoLocal(NOW),
        estimateMin: 30, adjustedMin: 30,
      }],
    }],
  }));
  h.set(10);
  assert.equal((await h.call({ action: "status", ...h.select })).active.elapsedMin, 10);
  await h.call({ action: "pause" });
  h.set(40);
  const reloaded = h.reload();
  const frozen = (await reloaded.call({ action: "status", ...h.select })).active;
  assert.equal(frozen.status, "paused");
  assert.equal(frozen.elapsedMin, 10);
  assert.equal(frozen.task.elapsedMin, 10);
  assert.match(reloaded.turn().message.content, /paused block:/);
  const disk = readFileSync(h.file, "utf8");
  await assert.rejects(reloaded.call({ action: "task_next", title: "Invalid", estimateMinutes: 5 }), /paused/);
  assert.equal(readFileSync(h.file, "utf8"), disk);
  const resumed = (await reloaded.call({ action: "resume" })).active;
  assert.equal(Date.parse(resumed.endsAt), NOW + 90 * MINUTE);
  assert.equal(Date.parse(resumed.task.projectedEnd), NOW + 60 * MINUTE);
  h.set(45);
  await reloaded.call({ action: "pause" });
  h.set(55);
  const again = h.reload();
  await again.call({ action: "status", ...h.select });
  const twice = (await again.call({ action: "resume" })).active;
  assert.equal(twice.elapsedMin, 15);
  assert.equal(twice.task.elapsedMin, 15);
  assert.equal(Date.parse(twice.endsAt), NOW + 100 * MINUTE);
  h.set(60);
  await again.call({ action: "task_end", outcome: "completed" });
  assert.equal(h.persisted().calibration[0].actualMin, 20);
  assert.equal(h.persisted().version, 1);
}));

await checkAsync("timer suppresses block/task alerts during pause and resumes normal alerts afterward", () => withClock(async h => {
  await h.start();
  await h.call({ ...basic, durationMinutes: 30, estimateMinutes: 40 });
  h.set(25);
  await h.call({ action: "pause" });
  h.set(100);
  h.tick();
  h.tick();
  assert.equal(h.alerts.length, 0);
  assert.equal(h.messages.length, 0);
  assert.match(h.statuses.at(-1)[1], /PAUSED/);
  const resumed = (await h.call({ action: "resume" })).active;
  assert.equal(resumed.remainingMin, 5);
  h.tick();
  assert.ok(h.alerts.some(([text]) => /5m left/.test(text)));
  assert.ok(h.alerts.some(([text]) => /projected to finish after/.test(text)));
  const n = h.alerts.length;
  h.tick();
  assert.equal(h.alerts.length, n, "alerts remain deduplicated");
  h.set(116);
  h.tick();
  assert.ok(h.alerts.some(([text]) => /reached its planned end/.test(text)));
  assert.ok(h.alerts.some(([text]) => /passed its calibrated estimate/.test(text)));
}));

await checkAsync("a block can pause without a task and later tasks do not inherit earlier breaks", () => withClock(async h => {
  await h.call({ ...basic, title: undefined });
  h.set(5);
  await h.call({ action: "pause" });
  h.set(35);
  await h.call({ action: "resume" });
  const started = await h.call({ action: "task_start", title: "New task", estimateMinutes: 20 });
  assert.equal(started.active.task.elapsedMin, 0);
  assert.equal(Date.parse(started.active.task.projectedEnd), NOW + 55 * MINUTE);
  h.set(45);
  const ended = await h.call({ action: "task_end" });
  assert.match(ended.message, /after 10m/);
  await h.call({ action: "pause" });
  h.set(100);
  assert.match((await h.call({ action: "end" })).message, /after 15m/);
}));

await checkAsync("failed compound task_next never partially ends/calibrates a task", () => withClock(async h => {
  for (const persist of [false, true]) {
    await h.call({ ...basic, ...h.select, persist });
    h.set(10);
    const before = (await h.call({ action: "status" })).active;
    const disk = persist ? readFileSync(h.file, "utf8") : null;
    await assert.rejects(h.call({ action: "task_next", estimateMinutes: 10 }), /requires title/);
    assert.deepEqual((await h.call({ action: "status" })).active, before);
    if (persist) assert.equal(readFileSync(h.file, "utf8"), disk);
    await h.call({ action: "task_end" });
    if (persist) assert.equal(h.persisted().calibration.length, 1);
    await h.call({ action: "end" });
    h.set(0);
  }
}));

console.log(`\n${passed} checks passed (${extPath})`);
