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
const MUTATING = new Set(["plan_week", "plan_item", "plan_status", "plan", "begin", "task_start", "task_next", "task_rescope", "task_end", "extend", "end", "cancel"]);
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

const emptyState = () => ({ version: 1, blocks: [], calibration: [], plans: [] });
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

// ---------------------------------------------------------------------------
// Weekly plans: recurring slots (Mon–Sun) filled from an ordered queue of
// topics with hour budgets. The calendar is a deterministic projection from
// "now" and the minutes actually studied, so missed or extra sessions move the
// projected finish date instead of being assumed.
// ---------------------------------------------------------------------------
const DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const DAY_ALIASES = {
  sun: "sun", sunday: "sun", dom: "sun", domingo: "sun",
  mon: "mon", monday: "mon", lun: "mon", lunes: "mon",
  tue: "tue", tuesday: "tue", mar: "tue", martes: "tue",
  wed: "wed", wednesday: "wed", mie: "wed", "mié": "wed", miercoles: "wed", "miércoles": "wed",
  thu: "thu", thursday: "thu", jue: "thu", jueves: "thu",
  fri: "fri", friday: "fri", vie: "fri", viernes: "fri",
  sat: "sat", saturday: "sat", sab: "sat", "sáb": "sat", sabado: "sat", "sábado": "sat",
};
const DAY_LABEL = { sun: "Sun", mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat" };
const MIN_CHUNK = 15; // never schedule a topic fragment shorter than this
const HORIZON_DAYS = 1100; // projection limit (~3 years)

export function normDay(day) {
  const d = DAY_ALIASES[String(day ?? "").trim().toLowerCase()];
  if (!d) throw new Error(`Unknown day: ${day} (use mon..sun or lunes..domingo)`);
  return d;
}

function parseHHMM(s) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(s ?? ""));
  if (!m || Number(m[1]) > 23 || Number(m[2]) > 59) throw new Error(`Time must be HH:MM: ${s}`);
  return [Number(m[1]), Number(m[2])];
}

function parseDate(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s ?? ""));
  if (!m) throw new Error(`Date must be YYYY-MM-DD: ${s}`);
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).getTime();
}

const atTime = (dayMs, hhmmStr) => {
  const [h, m] = parseHHMM(hhmmStr);
  const d = new Date(dayMs);
  d.setHours(h, m, 0, 0);
  return d.getTime();
};
const startOfDay = ms => { const d = new Date(ms); d.setHours(0, 0, 0, 0); return d.getTime(); };
const nextDay = ms => { const d = new Date(ms); d.setDate(d.getDate() + 1); return d.getTime(); };
const itemLabel = it => it.topic ?? it.title ?? it.subject;

export function remainingMinutes(item) {
  if (item.status === "done") return 0;
  return Math.max(0, Math.round(item.hours * 60 - (item.doneMinutes ?? 0)));
}

// An item with `after: [subject or topic]` waits until every matching item has
// no remaining minutes in the projection (prerequisites scheduled first).
function prerequisitesMet(plan, item, rem) {
  return !(item.after ?? []).some(dep =>
    plan.items.some(o => o.id !== item.id && (o.subject === dep || o.topic === dep) && rem.get(o.id) > 0));
}

// Projects sessions from `fromMs`. `begun` slot keys (date@start) are skipped.
export function materialize(plan, fromMs, { maxDays = HORIZON_DAYS, maxSessions = 3000 } = {}) {
  const rem = new Map(plan.items.map(it => [it.id, remainingMinutes(it)]));
  const finish = new Map();
  const sessions = [];
  const begun = new Set(plan.begun ?? []);
  let day = startOfDay(Math.max(fromMs, parseDate(plan.startDate)));
  const lastDay = plan.until ? parseDate(plan.until) : Infinity;
  const slots = [...plan.slots].sort((a, b) => a.start.localeCompare(b.start));
  for (let i = 0; i < maxDays && day <= lastDay && sessions.length < maxSessions; i++, day = nextDay(day)) {
    if (![...rem.values()].some(v => v > 0)) break;
    const dow = DAYS[new Date(day).getDay()];
    const date = localDate(day);
    for (const slot of slots) {
      if (slot.day !== dow) continue;
      const start = atTime(day, slot.start);
      const end = start + slot.durationMinutes * 60_000;
      if (end <= fromMs || begun.has(`${date}@${slot.start}`)) continue;
      let left = slot.durationMinutes;
      const alloc = [];
      // Pass 1: the slot's preferred subject. Pass 2 (unless strict): next eligible topic in queue order.
      const passes = slot.subject ? (slot.strict ? [slot.subject] : [slot.subject, null]) : [null];
      for (const want of passes) {
        for (const it of plan.items) {
          if (left < MIN_CHUNK) break;
          const r = rem.get(it.id);
          if (r <= 0 || (want && it.subject !== want)) continue;
          if (it.days?.length && !it.days.includes(dow)) continue;
          if (!prerequisitesMet(plan, it, rem)) continue;
          const take = Math.min(left, r);
          const prev = alloc.find(a => a.itemId === it.id);
          if (prev) prev.minutes += take;
          else alloc.push({ itemId: it.id, subject: it.subject, label: itemLabel(it), minutes: take });
          rem.set(it.id, r - take);
          left -= take;
          if (r - take <= 0) finish.set(it.id, date);
        }
      }
      if (alloc.length) {
        sessions.push({ date, day: dow, start: slot.start, end: hhmm(end), startMs: start, minutes: slot.durationMinutes - left, alloc });
      }
    }
  }
  const unscheduled = plan.items
    .filter(it => rem.get(it.id) > 0)
    .map(it => ({ itemId: it.id, label: itemLabel(it), subject: it.subject, minutes: rem.get(it.id) }));
  return { sessions, finish, unscheduled };
}

export function planReport(plan, now, weeks = 1) {
  const proj = materialize(plan, now);
  const weeklyCapacity = plan.slots.reduce((s, x) => s + x.durationMinutes, 0);
  const subjects = new Map();
  for (const it of plan.items) {
    const s = subjects.get(it.subject) ?? { subject: it.subject, totalMin: 0, doneMin: 0, remainingMin: 0, finish: null, open: 0 };
    s.totalMin += Math.round(it.hours * 60);
    s.doneMin += Math.round(it.doneMinutes ?? 0);
    s.remainingMin += remainingMinutes(it);
    const f = proj.finish.get(it.id);
    if (remainingMinutes(it) > 0) {
      s.open++;
      if (f && (!s.finish || f > s.finish)) s.finish = f;
      if (!f) s.finish = "not within plan";
    }
    subjects.set(it.subject, s);
  }
  const overBudget = plan.items.filter(it => it.status !== "done" && remainingMinutes(it) === 0)
    .map(it => itemLabel(it));
  const horizonEnd = nextDay(startOfDay(now) + weeks * 7 * 86_400_000 - 1);
  const upcoming = proj.sessions.filter(s => s.startMs < horizonEnd);
  const allFinish = proj.unscheduled.length ? null : [...proj.finish.values()].sort().at(-1) ?? null;
  let deficit = null;
  if (proj.unscheduled.length) {
    const missing = proj.unscheduled.reduce((a, u) => a + u.minutes, 0);
    const weeksLeft = plan.until ? Math.max(1 / 7, (parseDate(plan.until) - startOfDay(now)) / (7 * 86_400_000) + 1 / 7) : null;
    deficit = {
      minutes: missing,
      reason: plan.until ? `does not fit before ${plan.until}` : "items with no matching slot (subject/day filters) or beyond the projection horizon",
      extraMinutesPerWeek: weeksLeft ? Math.ceil(missing / weeksLeft) : null,
      items: proj.unscheduled,
    };
  }
  return { weeklyCapacityMin: weeklyCapacity, subjects: [...subjects.values()], upcoming, finishAll: allFinish, deficit, overBudget };
}

export function formatPlan(plan, report) {
  const lines = [`Plan ${plan.id} "${plan.name}" (${plan.status}) from ${plan.startDate}${plan.until ? ` until ${plan.until}` : ""}; ${fmtMin(report.weeklyCapacityMin)} per week`];
  for (const s of report.subjects) {
    lines.push(`  ${s.subject}: ${fmtMin(s.doneMin)} studied / ${fmtMin(s.totalMin)} budget, ${fmtMin(s.remainingMin)} left, finish ${s.remainingMin ? s.finish : "budget used"}`);
  }
  lines.push(report.finishAll ? `  All topics projected to finish: ${report.finishAll}` : "  Not all topics fit:");
  if (report.deficit) {
    lines.push(`  ${fmtMin(report.deficit.minutes)} ${report.deficit.reason}${report.deficit.extraMinutesPerWeek ? `; needs about +${fmtMin(report.deficit.extraMinutesPerWeek)} per week` : ""}`);
  }
  if (report.overBudget.length) lines.push(`  Budget used but not marked done (adjust hours or mark done): ${report.overBudget.join(", ")}`);
  lines.push("  Upcoming:");
  for (const s of report.upcoming) {
    lines.push(`   ${DAY_LABEL[s.day]} ${s.date} ${s.start}–${s.end}: ${s.alloc.map(a => `${a.label} ${fmtMin(a.minutes)}`).join(" + ")}`);
  }
  if (!report.upcoming.length) lines.push("   (nothing in this window)");
  return lines.join("\n");
}

export function buildPlan(params, id, now) {
  if (!Array.isArray(params.slots) || !params.slots.length) throw new Error("plan_week requires slots: [{day, start: HH:MM, durationMinutes, subject?}].");
  if (!Array.isArray(params.items) || !params.items.length) throw new Error("plan_week requires items: [{subject, topic?, title?, hours, days?}] in study order.");
  const slots = params.slots.map(s => {
    parseHHMM(s.start);
    if (!(s.durationMinutes > 0)) throw new Error("Each slot needs durationMinutes > 0.");
    return { day: normDay(s.day), start: s.start.padStart(5, "0"), durationMinutes: s.durationMinutes, subject: s.subject || null, strict: Boolean(s.subject && s.strict) };
  });
  const items = params.items.map((it, i) => {
    if (!it.subject || !(it.hours > 0)) throw new Error("Each item needs subject and hours > 0.");
    return {
      id: `I${i + 1}`, subject: it.subject, topic: it.topic, title: it.title, hours: it.hours,
      days: it.days?.length ? it.days.map(normDay) : undefined, after: it.after?.length ? it.after : undefined, doneMinutes: 0, status: "open",
    };
  });
  const startDate = params.startDate ?? localDate(now);
  parseDate(startDate);
  if (params.until) parseDate(params.until);
  for (const subject of new Set(items.map(i => i.subject))) {
    if (!slots.some(s => !s.strict || s.subject === subject)) throw new Error(`No slot accepts subject ${subject}; every slot is strict to another subject.`);
  }
  const known = new Set(items.flatMap(i => [i.subject, i.topic].filter(Boolean)));
  for (const it of items) {
    for (const dep of it.after ?? []) if (!known.has(dep)) throw new Error(`${itemLabel(it)} is after unknown subject/topic ${dep}.`);
  }
  return { id, name: params.name ?? "Study plan", status: "active", startDate, until: params.until, slots, items, begun: [], createdAt: isoLocal(now) };
}

// Distribute a finished block's actual minutes over the plan items it covered.
export function attributeBlock(plan, block, actualMin) {
  const total = block.allocation.reduce((a, x) => a + x.minutes, 0);
  if (!total || actualMin <= 0) return;
  for (const a of block.allocation) {
    const it = plan.items.find(x => x.id === a.itemId);
    if (it) it.doneMinutes = Math.round(((it.doneMinutes ?? 0) + actualMin * (a.minutes / total)) * 10) / 10;
  }
}

export function todaySessions(plan, now) {
  if (plan.status !== "active") return [];
  const today = localDate(now);
  // Same projection as plan_view (from now), so today's topics match the calendar.
  return materialize(plan, now, { maxDays: 1 }).sessions.filter(s => s.date === today);
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
    data.plans ??= [];
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
        if (params.planId) {
          const plan = state.plans.find(p => p.id === params.planId && p.status === "active");
          if (!plan) throw new Error(`No active plan ${params.planId}.`);
          const sessions = todaySessions(plan, now);
          // start selects a slot only when it is HH:MM; "now" or anything else means the next session today.
          // A session may be started early or late: the block runs from now for the session's minutes.
          const at = /^\d{1,2}:\d{2}$/.test(params.start ?? "") ? params.start.padStart(5, "0") : null;
          const s = sessions.find(x => !at || x.start === at) ?? null;
          if (!s) {
            const list = sessions.map(x => `${x.start}–${x.end}`).join(", ") || "none";
            throw new Error(`Plan ${plan.id} has no remaining session today${at ? ` at ${at}` : ""} (today: ${list}). Use plan without planId for an extra block.`);
          }
          const subjects = [...new Set(s.alloc.map(a => a.subject))];
          const b = {
            id: nextId("B", state.blocks),
            subject: subjects.join("+"),
            topic: s.alloc.map(a => a.label).join(" + "),
            durationMin: s.minutes,
            plannedStart: isoLocal(s.startMs),
            status: "active",
            tasks: [],
            adjustments: [],
            createdAt: isoLocal(now),
            startedAt: isoLocal(now),
            endsAt: isoLocal(now + s.minutes * 60_000),
            planId: plan.id,
            allocation: s.alloc.map(a => ({ itemId: a.itemId, label: a.label, minutes: a.minutes })),
          };
          state.blocks.push(b);
          plan.begun.push(`${s.date}@${s.start}`);
          return {
            changed: true,
            message: `Began ${summarize(blockStatus(b, now))}\nTopics: ${s.alloc.map(a => `${a.label} ${fmtMin(a.minutes)}`).join(" + ")}`,
            block: b.id,
          };
        }
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
        let planNote = "";
        const plan = block.planId && state.plans.find(p => p.id === block.planId);
        if (plan && block.allocation) {
          attributeBlock(plan, block, used);
          const r = planReport(plan, now, 0);
          planNote = `\nPlan ${plan.id}: ${r.subjects.map(s => `${s.subject} ${fmtMin(s.doneMin)}/${fmtMin(s.totalMin)}`).join(", ")}; ${r.finishAll ? `projected finish ${r.finishAll}` : "not all topics fit (see plan_view)"}.`;
        }
        return { changed: true, message: `Ended ${block.id} after ${fmtMin(used)} of ${fmtMin(block.durationMin)} planned; tasks: ${block.tasks.map(x => `${x.id}=${x.status}`).join(", ") || "none"}.${planNote}` };
      }
      case "plan_week": {
        const existing = params.planId && state.plans.find(p => p.id === params.planId);
        const id = existing ? existing.id : nextId("P", state.plans);
        const plan = buildPlan(params, id, now);
        if (existing) {
          // Keep studied minutes and status for items that survive the edit (same subject+topic/title).
          for (const it of plan.items) {
            const old = existing.items.find(o => o.subject === it.subject && itemLabel(o) === itemLabel(it));
            if (old) { it.doneMinutes = old.doneMinutes; it.status = old.status; }
          }
          plan.begun = existing.begun;
          plan.createdAt = existing.createdAt;
          state.plans[state.plans.indexOf(existing)] = plan;
        } else {
          state.plans.push(plan);
        }
        const report = planReport(plan, now, params.weeks ?? 1);
        return { changed: true, message: `${existing ? "Updated" : "Created"} ${formatPlan(plan, report)}`, plan: plan.id, report };
      }
      case "plan_view": {
        const plans = params.planId ? state.plans.filter(p => p.id === params.planId) : state.plans.filter(p => p.status === "active");
        if (!plans.length) return { message: "No active weekly plans." };
        const reports = plans.map(p => ({ plan: p, report: planReport(p, now, params.weeks ?? 1) }));
        return { message: reports.map(r => formatPlan(r.plan, r.report)).join("\n\n"), reports: reports.map(r => ({ id: r.plan.id, ...r.report })) };
      }
      case "plan_item": {
        const plan = state.plans.find(p => p.id === params.planId);
        if (!plan) throw new Error("plan_item requires planId.");
        const it = plan.items.find(x => x.id === params.itemId || (params.topic && x.topic === params.topic));
        if (!it) throw new Error("plan_item requires itemId or topic of an item in that plan.");
        if (params.hours > 0) it.hours = params.hours;
        if (params.done === true) it.status = "done";
        if (params.done === false) it.status = "open"; // reopen
        const report = planReport(plan, now, 0);
        return { changed: true, message: `${itemLabel(it)}: ${fmtMin(it.doneMinutes)} studied of ${fmtMin(it.hours * 60)}, ${it.status}. ${report.finishAll ? `Plan finish ${report.finishAll}.` : "Not all topics fit."}` };
      }
      case "plan_status": {
        const plan = state.plans.find(p => p.id === params.planId);
        if (!plan) throw new Error("plan_status requires planId.");
        if (!["active", "paused", "cancelled", "completed"].includes(params.status)) throw new Error("status must be active, paused, cancelled, or completed.");
        plan.status = params.status;
        return { changed: true, message: `Plan ${plan.id} is now ${plan.status}.` };
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
      "Weekly plans: plan_week (name, slots [{day mon..sun, start HH:MM, durationMinutes, subject?}], items [{subject, topic?, title?, hours, days?}] in study order, startDate?, until?; planId to edit) |",
      "plan_view (planId?, weeks?) | plan_item (planId, itemId|topic, hours? | done true/false) | plan_status (planId, status active|paused|cancelled|completed) | begin (planId, start? HH:MM) starts today's next planned session now (early or late is fine) and credits its topics; use it instead of plan for planned days.",
      "Slots repeat weekly; a slot's subject is a preference (strict=true makes it exclusive); otherwise it takes the next eligible topic in queue order. Several topics share a slot when they fit, so topics are grouped by day automatically. Items with after=[...] wait for their prerequisites.",
      "The calendar is projected from now and the minutes actually studied: missed or extra sessions move the projected finish dates. With until, it reports hours that do not fit and the extra minutes per week needed.",
      "Keep bookkeeping cheap: the current time and block status already arrive with every user turn, so do not call status for them; tasks are lesson segments (roughly 15+ minutes), not single exercises. task_start/task_next report a calibrated estimate (from past actual/estimate ratios), whether it fits the remaining block time, and whether it must be the last task.",
      "Session-only unless alias + persist=true, which writes .teacher/learners/<alias>/schedule.json; use persistence only with the selected learner's consent for that file.",
      "Pass alias/persist once; later calls reuse that selection. Schedule data is planning data, never learning evidence.",
    ].join(" "),
    parameters: z.object({
      action: z.enum(["now", "status", "list", "plan", "begin", "task_start", "task_next", "task_rescope", "task_end", "extend", "end", "cancel", "plan_week", "plan_view", "plan_item", "plan_status"]),
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
      planId: z.string().optional(),
      name: z.string().optional(),
      startDate: z.string().optional().describe("YYYY-MM-DD, default today"),
      until: z.string().optional().describe("YYYY-MM-DD last day of the plan (optional; otherwise until all hours are scheduled)"),
      weeks: z.number().optional().describe("weeks of calendar to show (default 1)"),
      slots: z.array(z.object({
        day: z.string().describe("mon..sun or lunes..domingo"),
        start: z.string().describe("HH:MM local"),
        durationMinutes: z.number(),
        subject: z.string().optional().describe("preferred subject for this slot; when it has nothing available the slot takes the next topic in queue"),
        strict: z.boolean().optional().describe("true = only the preferred subject, leave the slot empty otherwise"),
      })).optional(),
      items: z.array(z.object({
        subject: z.string(),
        topic: z.string().optional(),
        title: z.string().optional(),
        hours: z.number().describe("hour budget for this topic"),
        days: z.array(z.string()).optional().describe("restrict this topic to these days"),
        after: z.array(z.string()).optional().describe("subjects or topics that must be fully scheduled first (prerequisites)"),
      })).optional().describe("topics in study order"),
      itemId: z.string().optional(),
      done: z.boolean().optional(),
      status: z.string().optional(),
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
    if (!ref.persist && memoryState.blocks.length === 0 && memoryState.plans.length === 0) return null;
    try {
      const state = load(cwd, ref);
      const active = activeBlock(state);
      const due = state.blocks.filter(b => b.status === "planned" && Date.parse(b.plannedStart) <= now);
      const today = state.plans.flatMap(p => todaySessions(p, now).map(s => ({ planId: p.id, ...s, dueNow: s.startMs <= now })));
      return { active: active ? blockStatus(active, now) : null, due: due.map(b => blockStatus(b, now)), today };
    } catch {
      return null;
    }
  }

  function events(status) {
    const out = [];
    for (const d of status.due) out.push([`${d.id}:due`, `Planned block ${d.id} (${d.subject}) is due now.`]);
    if (!status.active) {
      for (const s of status.today.filter(x => x.dueNow)) {
        out.push([`${s.planId}:${s.date}@${s.start}:due`, `Plan ${s.planId} session ${s.start}–${s.end} is due: ${s.alloc.map(a => `${a.label} ${fmtMin(a.minutes)}`).join(" + ")}. Start it with begin(planId) when the learner is ready.`]);
      }
    }
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
    for (const s of status?.today ?? []) {
      lines.push(`today (plan ${s.planId}): ${s.start}–${s.end} ${s.alloc.map(a => `${a.label} ${fmtMin(a.minutes)}`).join(" + ")}${s.dueNow ? " [due now]" : ""}`);
    }
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
