// Native OMP extension: deterministic local clock and timed study blocks.
// Time always comes from the host system clock; the model never guesses it.
// Session-only by default; with an explicit alias and persist=true the schedule
// is stored in .teacher/learners/<alias>/schedule.json (private, git-ignored).
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ALIAS = /^[a-z0-9][a-z0-9-]{0,47}$/;
const TICK_MS = 60_000;
const LAST_TASK_MARGIN_MIN = 10; // less than this left after a task => it is the last task
const WARN_MINUTES = [5, 15]; // ascending: the tightest crossed threshold is reported
const CALIBRATION_MIN_SAMPLES = 3;
const CALIBRATION_WINDOW = 20;
const MUTATING = new Set(["plan", "begin", "task_start", "task_next", "task_rescope", "task_end", "extend", "end", "cancel"]);
const CLOCK_POLICY = "A <study-clock> message from the host accompanies each user turn with the deterministic local time and any active study block. Use it (or the study_clock tool) instead of guessing time; schedules are planning data, not learning evidence.";

const pad = n => String(Math.trunc(Math.abs(n))).padStart(2, "0");
const timeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone ?? "unknown";

export function isoLocal(ms) {
  const d = new Date(ms);
  const off = -d.getTimezoneOffset();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}${off >= 0 ? "+" : "-"}${pad(off / 60)}:${pad(off % 60)}`;
}
const localDate = ms => isoLocal(ms).slice(0, 10);
const hhmm = ms => isoLocal(ms).slice(11, 16);
const minutesBetween = (a, b) => (b - a) / 60_000;
const round1 = x => Math.round(x * 10) / 10;

export function fmtMin(min) {
  const sign = min < 0 ? "-" : "";
  const total = Math.round(Math.abs(min));
  const h = Math.floor(total / 60);
  return `${sign}${h ? `${h}h ` : ""}${total % 60}m`;
}

// "now" | "HH:MM" (today, local) | ISO 8601 with offset
export function parseStart(input, now) {
  if (input === undefined || input === "" || input === "now") return now;
  const m = /^(\d{1,2}):(\d{2})$/.exec(input);
  if (m) {
    const d = new Date(now);
    d.setHours(Number(m[1]), Number(m[2]), 0, 0);
    if (Number(m[1]) > 23 || Number(m[2]) > 59) throw new Error(`Invalid time: ${input}`);
    return d.getTime();
  }
  if (!/[zZ]|[+-]\d{2}:?\d{2}$/.test(input)) throw new Error(`Start must be "now", "HH:MM", or ISO 8601 with offset: ${input}`);
  const ms = Date.parse(input);
  if (Number.isNaN(ms)) throw new Error(`Invalid start: ${input}`);
  return ms;
}

const median = xs => {
  const s = [...xs].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

// Ratio actual/estimate from completed tasks; subject-specific when enough samples.
export function calibration(samples, subject) {
  const pick = list => list.slice(-CALIBRATION_WINDOW).map(s => s.actualMin / s.estimateMin);
  const same = samples.filter(s => s.subject === subject);
  let basis = "none";
  let ratios = [];
  if (same.length >= CALIBRATION_MIN_SAMPLES) { basis = "subject"; ratios = pick(same); }
  else if (samples.length >= CALIBRATION_MIN_SAMPLES) { basis = "all"; ratios = pick(samples); }
  const factor = ratios.length ? Math.min(3, Math.max(0.5, median(ratios))) : 1;
  return { factor: Math.round(factor * 100) / 100, basis, samples: ratios.length };
}

const emptyState = () => ({ version: 1, blocks: [], calibration: [] });
const activeBlock = state => state.blocks.find(b => b.status === "active");
const runningTask = block => block?.tasks.find(t => t.status === "running");
// remaining = block time left measured from the task's start; elapsed task time counts against it.
function fitTask(state, block, estimateMin, taskStart, now) {
  const cal = calibration(state.calibration, block.subject);
  const adjusted = Math.max(1, Math.round(estimateMin * cal.factor));
  const remaining = minutesBetween(taskStart, Date.parse(block.endsAt));
  const fits = adjusted <= remaining;
  const lastTask = !fits || remaining - adjusted < LAST_TASK_MARGIN_MIN;
  const left = minutesBetween(now, Date.parse(block.endsAt));
  const decision = fits
    ? lastTask ? "fits; last task of this block (too little time would remain for another)" : "fits; more tasks can follow"
    : `does not fit: needs ~${fmtMin(adjusted)}, block allows ${fmtMin(remaining)} (${fmtMin(left)} left now). Last task: reduce its scope with task_rescope or move the rest to another block.`;
  return { cal, adjusted, remaining, fits, lastTask, decision };
}

export function blockStatus(block, now) {
  const start = Date.parse(block.startedAt ?? block.plannedStart);
  const ends = block.endsAt ? Date.parse(block.endsAt) : start + block.durationMin * 60_000;
  const out = {
    id: block.id,
    subject: block.subject,
    topic: block.topic ?? null,
    status: block.status,
    start: isoLocal(start),
    endsAt: isoLocal(ends),
    durationMin: block.durationMin,
  };
  if (block.status === "planned") {
    out.startsInMin = round1(minutesBetween(now, start));
    out.due = now >= start;
    return out;
  }
  if (block.status !== "active") {
    out.endedAt = block.endedAt ?? null;
    return out;
  }
  out.elapsedMin = round1(minutesBetween(start, now));
  out.remainingMin = round1(minutesBetween(now, ends));
  out.overtime = out.remainingMin < 0;
  const task = runningTask(block);
  if (task) {
    const tStart = Date.parse(task.startedAt);
    const projected = tStart + task.adjustedMin * 60_000;
    out.task = {
      id: task.id,
      title: task.title,
      estimateMin: task.estimateMin,
      adjustedMin: task.adjustedMin,
      elapsedMin: round1(minutesBetween(tStart, now)),
      projectedEnd: isoLocal(projected),
      overrun: now > projected,
      spillsPastBlock: projected > ends,
      lastTask: task.lastTask,
    };
  }
  out.onTime = !out.overtime && !(out.task?.spillsPastBlock);
  return out;
}

export function summarize(status) {
  if (status.status === "planned") {
    return `${status.id} ${status.subject} planned ${hhmm(Date.parse(status.start))}–${hhmm(Date.parse(status.endsAt))} (${status.due ? "due now" : `starts in ${fmtMin(status.startsInMin)}`})`;
  }
  if (status.status !== "active") return `${status.id} ${status.subject} ${status.status}`;
  const parts = [
    `${status.id} ${status.subject}${status.topic ? ` ${status.topic}` : ""} ${hhmm(Date.parse(status.start))}–${hhmm(Date.parse(status.endsAt))}`,
    `elapsed ${fmtMin(status.elapsedMin)}`,
    status.overtime ? `OVERTIME ${fmtMin(-status.remainingMin)}` : `remaining ${fmtMin(status.remainingMin)}`,
  ];
  if (status.task) {
    const t = status.task;
    parts.push(`task ${t.id} "${t.title}" ${fmtMin(t.elapsedMin)}/${fmtMin(t.adjustedMin)}${t.overrun ? " (over estimate)" : ""}${t.spillsPastBlock ? " (spills past block end)" : ""}${t.lastTask ? " [last task]" : ""}`);
  }
  parts.push(status.onTime ? "on time" : "behind");
  return parts.join("; ");
}

export default function (pi) {
  const z = pi.zod;
  let memoryState = emptyState(); // session-only schedule
  let ref = { alias: null, persist: false }; // last schedule the learner explicitly used
  const notified = new Set();

  const filePath = (cwd, alias) => join(cwd, ".teacher", "learners", alias, "schedule.json");

  function resolveRef(cwd, params) {
    if (params.alias === undefined) return ref;
    if (!ALIAS.test(params.alias)) throw new Error("Alias must match [a-z0-9][a-z0-9-]{0,47}; ask the learner for a safe alias.");
    const persist = params.persist === true;
    if (persist && !existsSync(join(cwd, ".teacher", "learners", params.alias, "profile.md"))) {
      throw new Error(`No selected profile at .teacher/learners/${params.alias}/profile.md; persistence needs an existing, consenting profile. Use persist=false for session-only.`);
    }
    return { alias: params.alias, persist };
  }

  function load(cwd, r) {
    if (!r.persist) return memoryState;
    const p = filePath(cwd, r.alias);
    if (!existsSync(p)) return emptyState();
    const data = JSON.parse(readFileSync(p, "utf8"));
    if (data?.version !== 1 || !Array.isArray(data.blocks)) throw new Error(`Unrecognized schedule format in ${p}`);
    data.calibration ??= [];
    return data;
  }

  function save(cwd, r, state) {
    if (!r.persist) { memoryState = state; return null; }
    const p = filePath(cwd, r.alias);
    mkdirSync(join(cwd, ".teacher", "learners", r.alias), { recursive: true });
    const tmp = `${p}.tmp-${process.pid}`;
    writeFileSync(tmp, `${JSON.stringify(state, null, 2)}\n`);
    renameSync(tmp, p);
    return `.teacher/learners/${r.alias}/schedule.json`;
  }

  function nextId(prefix, list) {
    const n = list.reduce((max, x) => Math.max(max, Number(String(x.id).slice(prefix.length)) || 0), 0) + 1;
    return `${prefix}${String(n).padStart(prefix === "B" ? 3 : 1, "0")}`;
  }

  function clockInfo(now) {
    return {
      now: isoLocal(now),
      epochMs: now,
      timeZone: timeZone(),
      weekday: new Date(now).toLocaleDateString("en-US", { weekday: "long" }),
    };
  }

  function apply(action, params, state, now) {
    const block = activeBlock(state);
    switch (action) {
      case "now":
      case "status":
        return { message: block ? summarize(blockStatus(block, now)) : "No active study block." };
      case "list": {
        const day = params.date ?? localDate(now);
        const blocks = state.blocks
          .filter(b => localDate(Date.parse(b.startedAt ?? b.plannedStart)) === day)
          .map(b => blockStatus(b, now));
        return { message: blocks.length ? blocks.map(summarize).join("\n") : `No blocks on ${day}.`, blocks };
      }
      case "plan": {
        if (!params.subject) throw new Error("plan requires subject (code or name as the learner's plan states it).");
        if (!(params.durationMinutes > 0)) throw new Error("plan requires durationMinutes > 0.");
        const start = parseStart(params.start, now);
        const immediate = start <= now;
        if (immediate && block) throw new Error(`Block ${block.id} is already active; end it before starting another.`);
        const b = {
          id: nextId("B", state.blocks),
          subject: params.subject,
          topic: params.topic,
          durationMin: params.durationMinutes,
          plannedStart: isoLocal(start),
          status: immediate ? "active" : "planned",
          tasks: [],
          adjustments: [],
          createdAt: isoLocal(now),
        };
        if (immediate) {
          b.startedAt = isoLocal(now);
          b.endsAt = isoLocal(now + b.durationMin * 60_000);
        }
        state.blocks.push(b);
        const created = `Created ${summarize(blockStatus(b, now))}`;
        if (immediate && params.title && params.estimateMinutes > 0) {
          // One call for "start the block and its first task" saves a model round trip.
          const first = apply("task_start", params, state, now);
          return { ...first, message: `${created}\n${first.message}`, block: b.id };
        }
        return { changed: true, message: created, block: b.id };
      }
      case "begin": {
        if (block) throw new Error(`Block ${block.id} is already active.`);
        const b = state.blocks.find(x => x.id === params.blockId && x.status === "planned")
          ?? (!params.blockId ? state.blocks.find(x => x.status === "planned" && localDate(Date.parse(x.plannedStart)) === localDate(now)) : undefined);
        if (!b) throw new Error("No matching planned block to begin.");
        b.status = "active";
        b.startedAt = isoLocal(now);
        b.endsAt = isoLocal(now + b.durationMin * 60_000);
        return { changed: true, message: `Began ${summarize(blockStatus(b, now))}`, block: b.id };
      }
      case "task_next": {
        // End the running task (if any) and start the next one in a single call.
        const ended = runningTask(block) ? apply("task_end", params, state, now).message : null;
        const started = apply("task_start", params, state, now);
        return { ...started, message: [ended, started.message].filter(Boolean).join("\n") };
      }
      case "task_start": {
        if (!block) throw new Error("No active block; plan or begin one first.");
        if (runningTask(block)) throw new Error(`Task ${runningTask(block).id} is still running; use task_next (or task_end first).`);
        if (!params.title || !(params.estimateMinutes > 0)) throw new Error("task_start requires title and estimateMinutes > 0.");
        const fit = fitTask(state, block, params.estimateMinutes, now, now);
        const t = {
          id: nextId("T", block.tasks),
          title: params.title,
          estimateMin: params.estimateMinutes,
          adjustedMin: fit.adjusted,
          calibration: fit.cal,
          startedAt: isoLocal(now),
          status: "running",
          lastTask: fit.lastTask,
          fitsAtStart: fit.fits,
        };
        block.tasks.push(t);
        return {
          changed: true,
          message: `Started ${t.id} (estimate ${fmtMin(t.estimateMin)} × calibration ${fit.cal.factor} [${fit.cal.basis}, n=${fit.cal.samples}] = ${fmtMin(fit.adjusted)}); ${fit.decision}`,
          task: { ...t, remainingMin: round1(fit.remaining), fits: fit.fits },
        };
      }
      case "task_rescope": {
        const t = runningTask(block);
        if (!t) throw new Error("No running task to rescope.");
        if (!(params.estimateMinutes > 0)) throw new Error("task_rescope requires estimateMinutes > 0 (total minutes for the reduced task, counted from its start).");
        const fit = fitTask(state, block, params.estimateMinutes, Date.parse(t.startedAt), now);
        (t.rescoped ??= []).push({ at: isoLocal(now), fromTitle: t.title, fromEstimateMin: t.estimateMin, note: params.note });
        if (params.title) t.title = params.title;
        t.estimateMin = params.estimateMinutes;
        t.adjustedMin = fit.adjusted;
        t.calibration = fit.cal;
        const wasLast = t.lastTask;
        t.lastTask = wasLast || fit.lastTask; // a task that did not fit stays the last task
        return {
          changed: true,
          message: `Rescoped ${t.id} "${t.title}" to ${fmtMin(t.estimateMin)} (calibrated ${fmtMin(fit.adjusted)}, ends ~${hhmm(Date.parse(t.startedAt) + fit.adjusted * 60_000)}); ${fit.fits ? "now fits" : fit.decision}${t.lastTask ? "; still the last task: use leftover time to close (summary/homework)" : ""}`,
        };
      }
      case "task_end": {
        const t = runningTask(block);
        if (!t) throw new Error("No running task.");
        const outcome = params.outcome ?? "completed";
        t.status = outcome;
        t.endedAt = isoLocal(now);
        t.actualMin = round1(minutesBetween(Date.parse(t.startedAt), now));
        if (params.note) t.note = params.note;
        if (outcome === "completed" && t.actualMin > 0) {
          state.calibration.push({ subject: block.subject, estimateMin: t.estimateMin, actualMin: t.actualMin, at: t.endedAt });
          state.calibration = state.calibration.slice(-200);
        }
        const remaining = minutesBetween(now, Date.parse(block.endsAt));
        return {
          changed: true,
          message: `Ended ${t.id} (${outcome}) after ${fmtMin(t.actualMin)} vs estimate ${fmtMin(t.estimateMin)}; block remaining ${fmtMin(remaining)}${t.lastTask || remaining < LAST_TASK_MARGIN_MIN ? "; close the block now (summary/homework per plan)" : ""}.`,
        };
      }
      case "extend": {
        if (!block) throw new Error("No active block.");
        if (!params.minutes) throw new Error("extend requires non-zero minutes.");
        if (block.durationMin + params.minutes <= 0) throw new Error("extend cannot shorten the block to zero or less.");
        block.endsAt = isoLocal(Date.parse(block.endsAt) + params.minutes * 60_000);
        block.durationMin += params.minutes;
        block.adjustments.push({ at: isoLocal(now), minutes: params.minutes, note: params.note });
        notified.forEach(k => k.startsWith(`${block.id}:`) && notified.delete(k));
        return { changed: true, message: `Adjusted ${block.id} by ${params.minutes}m; now ${summarize(blockStatus(block, now))}` };
      }
      case "end": {
        if (!block) throw new Error("No active block.");
        const t = runningTask(block);
        if (t) {
          t.status = "partial";
          t.endedAt = isoLocal(now);
          t.actualMin = round1(minutesBetween(Date.parse(t.startedAt), now));
        }
        block.status = "ended";
        block.endedAt = isoLocal(now);
        if (params.note) block.note = params.note;
        const used = minutesBetween(Date.parse(block.startedAt), now);
        return { changed: true, message: `Ended ${block.id} after ${fmtMin(used)} of ${fmtMin(block.durationMin)} planned; tasks: ${block.tasks.map(x => `${x.id}=${x.status}`).join(", ") || "none"}.` };
      }
      case "cancel": {
        const b = state.blocks.find(x => x.id === params.blockId && x.status === "planned");
        if (!b) throw new Error("cancel requires the blockId of a planned block.");
        b.status = "cancelled";
        return { changed: true, message: `Cancelled ${b.id}.` };
      }
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  pi.registerTool({
    name: "study_clock",
    label: "Study Clock",
    description: [
      "Deterministic local clock and timed study-block schedule. Use it instead of guessing the time or elapsed minutes.",
      "Actions: now | status | list (date YYYY-MM-DD) | plan (subject, topic?, durationMinutes, start: now|HH:MM|ISO; optional title+estimateMinutes also starts the first task) | begin (blockId?) |",
      "task_start (title, estimateMinutes: honest minutes for this learner) | task_next (ends the running task with outcome, starts title/estimateMinutes) | task_rescope (estimateMinutes: total minutes of the reduced task from its start, title?, note?) |",
      "task_end (outcome: completed|partial|abandoned, note?) |",
      "extend (minutes, may be negative) | end (note?) | cancel (blockId).",
      "Keep bookkeeping cheap: the current time and block status already arrive with every user turn, so do not call status for them; tasks are lesson segments (roughly 15+ minutes), not single exercises. task_start/task_next report a calibrated estimate (from past actual/estimate ratios), whether it fits the remaining block time, and whether it must be the last task.",
      "Session-only unless alias + persist=true, which writes .teacher/learners/<alias>/schedule.json; use persistence only with the selected learner's consent for that file.",
      "Pass alias/persist once; later calls reuse that selection. Schedule data is planning data, never learning evidence.",
    ].join(" "),
    parameters: z.object({
      action: z.enum(["now", "status", "list", "plan", "begin", "task_start", "task_next", "task_rescope", "task_end", "extend", "end", "cancel"]),
      alias: z.string().optional().describe("Explicitly selected learner alias"),
      persist: z.boolean().optional().describe("true = store in the alias's schedule.json (consent required)"),
      subject: z.string().optional(),
      topic: z.string().optional(),
      durationMinutes: z.number().optional(),
      start: z.string().optional().describe('"now", "HH:MM" today (local), or ISO 8601 with offset'),
      blockId: z.string().optional(),
      title: z.string().optional(),
      estimateMinutes: z.number().optional(),
      outcome: z.enum(["completed", "partial", "abandoned"]).optional(),
      minutes: z.number().optional(),
      note: z.string().optional(),
      date: z.string().optional(),
    }),
    approval: args => (MUTATING.has(args?.action) && args?.persist !== false ? "write" : "read"),
    async execute(_id, params, _signal, _onUpdate, ctx) {
      const cwd = ctx?.cwd ?? pi.cwd ?? process.cwd();
      const now = Date.now();
      const r = resolveRef(cwd, params);
      const state = load(cwd, r);
      const result = apply(params.action, params, state, now);
      const saved = result.changed ? save(cwd, r, state) : null;
      ref = r;
      const block = activeBlock(state);
      const details = {
        clock: clockInfo(now),
        storage: r.persist ? `.teacher/learners/${r.alias}/schedule.json` : "session-only (memory)",
        saved,
        active: block ? blockStatus(block, now) : null,
        ...result,
      };
      const text = [`Now: ${details.clock.now} (${details.clock.timeZone}, ${details.clock.weekday})`, result.message, saved ? `Saved: ${saved}` : null]
        .filter(Boolean).join("\n");
      return { content: [{ type: "text", text }], details };
    },
  });

  function currentStatus(cwd, now) {
    if (!ref.persist && memoryState.blocks.length === 0) return null;
    try {
      const state = load(cwd, ref);
      const active = activeBlock(state);
      const due = state.blocks.filter(b => b.status === "planned" && Date.parse(b.plannedStart) <= now);
      return { active: active ? blockStatus(active, now) : null, due: due.map(b => blockStatus(b, now)) };
    } catch {
      return null;
    }
  }

  function events(status) {
    const out = [];
    for (const d of status.due) out.push([`${d.id}:due`, `Planned block ${d.id} (${d.subject}) is due now.`]);
    const a = status.active;
    if (!a) return out;
    if (a.overtime) out.push([`${a.id}:ended`, `Study block ${a.id} (${a.subject}) has reached its planned end. Close it: summarize, assign homework per plan, or extend only if the learner chooses.`]);
    else for (const w of WARN_MINUTES) if (a.remainingMin <= w) { out.push([`${a.id}:warn${w}`, `Study block ${a.id} (${a.subject}): ${fmtMin(a.remainingMin)} left.`]); break; }
    if (a.task?.spillsPastBlock) out.push([`${a.id}:${a.task.id}:spill`, `Task ${a.task.id} is projected to finish after the block ends; treat it as the last task and reduce its scope.`]);
    if (a.task?.overrun) out.push([`${a.id}:${a.task.id}:overrun`, `Task ${a.task.id} has passed its calibrated estimate (${fmtMin(a.task.adjustedMin)}). Check progress and adapt.`]);
    return out;
  }

  pi.on("session_start", async (_event, ctx) => {
    if (ctx.agent?.kind === "sub") return;
    ctx.setInterval(() => {
      const status = currentStatus(ctx.cwd, Date.now());
      if (!status) return;
      if (ctx.hasUI) ctx.ui.setStatus?.("study-clock", status.active ? `⏱ ${summarize(status.active)}` : undefined);
      for (const [key, text] of events(status)) {
        if (notified.has(key)) continue;
        notified.add(key);
        ctx.ui.notify?.(text, key.endsWith(":ended") || key.endsWith(":spill") ? "warning" : "info");
        pi.sendMessage(
          { customType: "study-clock", content: `[study clock ${isoLocal(Date.now())}] ${text}`, display: true, attribution: "agent" },
          { deliverAs: ctx.isIdle() ? "nextTurn" : "aside" },
        );
      }
    }, TICK_MS);
  });

  pi.on("before_agent_start", (event, ctx) => {
    if (event.reason === "revive" || ctx.agent?.kind === "sub") return;
    const now = Date.now();
    const status = currentStatus(ctx.cwd, now);
    const info = clockInfo(now);
    const lines = [`now: ${info.now} (${info.timeZone}, ${info.weekday})`];
    if (status?.active) lines.push(`active block: ${summarize(status.active)}`);
    for (const d of status?.due ?? []) lines.push(`due: ${summarize(d)}`);
    // The system prompt gets only a constant note: a changing system prompt would
    // invalidate the provider's prompt cache for the whole conversation each turn.
    // The changing clock reading travels as a small hidden message after the user turn.
    return {
      systemPrompt: [...event.systemPrompt, CLOCK_POLICY],
      message: {
        customType: "study-clock",
        content: `<study-clock>\n${lines.join("\n")}\n</study-clock>`,
        display: false,
        attribution: "agent",
      },
    };
  });
}
