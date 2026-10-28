// Local cost of the study clock, without model calls: per-minute tick and
// per-turn prompt injection, with a persisted schedule of realistic size.
// Usage: node evals/study-clock/tick-bench.mjs [path/to/study-clock.js]
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const extPath = resolve(process.argv[2] ?? new URL("../../.omp/extensions/study-clock.js", import.meta.url).pathname);
const mod = await import(pathToFileURL(extPath).href);

const cwd = mkdtempSync(join(tmpdir(), "clock-bench-"));
const dir = join(cwd, ".teacher", "learners", "bench-fictional");
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, "profile.md"), "fictional benchmark profile\n");

const s = { optional: () => s, describe: () => s };
const z = { object: o => o, enum: () => s, string: () => s, boolean: () => s, number: () => s, array: () => s };
const handlers = {};
let tool;
let tick;
mod.default({ zod: z, registerTool: t => (tool = t), on: (e, h) => (handlers[e] = h), sendMessage: () => {} });
const ctx = {
  cwd, agent: { kind: "main" }, hasUI: true, isIdle: () => true,
  ui: { notify: () => {}, setStatus: () => {} }, setInterval: fn => (tick = fn),
};
await handlers.session_start({}, ctx);

// A year of history: 300 ended blocks with 4 tasks each, plus one active block.
const call = p => tool.execute("b", p, null, null, ctx);
await call({ action: "plan", alias: "bench-fictional", persist: true, subject: "MAT000", durationMinutes: 120 });
const { readFileSync } = await import("node:fs");
const file = join(dir, "schedule.json");
const state = JSON.parse(readFileSync(file, "utf8"));
const active = state.blocks[0];
for (let i = 0; i < 300; i++) {
  state.blocks.unshift({ ...active, id: `H${i}`, status: "ended", tasks: Array.from({ length: 4 }, (_, k) => ({ id: `T${k}`, title: "x", estimateMin: 20, adjustedMin: 20, startedAt: active.startedAt, status: "completed", actualMin: 25 })) });
}
state.calibration = Array.from({ length: 200 }, () => ({ subject: "MAT000", estimateMin: 20, actualMin: 25 }));
writeFileSync(file, JSON.stringify(state, null, 2));
await call({ action: "task_start", title: "bench", estimateMinutes: 30 });
// A cycle-sized weekly plan: 5 courses x 4 topics x 32 h, Mon–Sat slots.
await call({
  action: "plan_week", name: "bench cycle",
  slots: ["mon", "tue", "wed", "thu", "fri"].map(day => ({ day, start: "19:00", durationMinutes: 120 })).concat([{ day: "sat", start: "09:00", durationMinutes: 180 }]),
  items: ["A", "B", "C", "D", "E"].flatMap(c => [1, 2, 3, 4].map(t => ({ subject: c, topic: `${c}-T${t}`, hours: 32 }))),
});

function bench(label, fn, n) {
  for (let i = 0; i < 50; i++) fn();
  const t0 = process.hrtime.bigint();
  for (let i = 0; i < n; i++) fn();
  const us = Number(process.hrtime.bigint() - t0) / 1e3 / n;
  console.log(`${label.padEnd(34)} ${us.toFixed(1).padStart(8)} µs/call  (n=${n})`);
  return us;
}

const size = readFileSync(file).length;
console.log(`extension: ${extPath}`);
console.log(`schedule.json: ${(size / 1024).toFixed(0)} KiB, ${state.blocks.length} blocks`);
const tickUs = bench("per-minute tick", () => tick(), 2000);
const { materialize } = mod;
const plan = JSON.parse(readFileSync(file, "utf8")).plans[0];
bench("full plan projection (640 h)", () => materialize(plan, Date.now()), 200);
let injected = "";
const turnUs = bench("per-turn injection (before_agent_start)", () => {
  const r = handlers.before_agent_start({ systemPrompt: ["base"], reason: "prompt" }, ctx);
  injected = JSON.stringify(r?.message ?? r?.systemPrompt?.slice(1) ?? "");
}, 2000);
console.log(`injected text per turn: ${injected.length} chars (~${Math.ceil(injected.length / 4)} tokens)`);
console.log(`share of one minute spent in ticks: ${(tickUs / 60e6 * 100).toExponential(1)} %`);
rmSync(cwd, { recursive: true });
void turnUs;
