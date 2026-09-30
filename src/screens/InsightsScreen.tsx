import { useState, useMemo } from "react";
import { ChevronDownIcon, FIRE, MEDALS } from "../components/icons";
import { cn } from "../utils/cn";
import {
  useStore,
  computeStreak,
  habitScheduledOn,
  ymd,
  addDays,
  startOfWeek,
  monthName,
} from "../lib/store";

type Scope = "OVERALL" | "HABITS" | "TASKS";
type RangeKey = "LAST_15" | "LAST_30" | "LAST_90";
type Period = "D" | "W" | "M";

const RANGE_LABEL: Record<RangeKey, string> = {
  LAST_15: "LAST 15 DAYS",
  LAST_30: "LAST 30 DAYS",
  LAST_90: "LAST 90 DAYS",
};

export function InsightsScreen() {
  const store = useStore();
  const [scope, setScope] = useState<Scope>("OVERALL");
  const [scopeOpen, setScopeOpen] = useState(false);
  const [range, setRange] = useState<RangeKey>("LAST_15");
  const [rangeOpen, setRangeOpen] = useState(false);
  const [period, setPeriod] = useState<Period>("D");

  const today = useMemo(() => new Date(), []);
  const rangeDays = range === "LAST_15" ? 15 : range === "LAST_30" ? 30 : 90;

  const active = useMemo(() => store.habits.filter((h) => !h.archived), [store.habits]);

  const dates = useMemo(
    () => Array.from({ length: rangeDays }, (_, i) => addDays(today, -(rangeDays - 1 - i))),
    [rangeDays, today]
  );

  const doneByDate = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const c of store.completions) {
      let s = m.get(c.completion_date);
      if (!s) { s = new Set(); m.set(c.completion_date, s); }
      s.add(c.habit_id);
    }
    return m;
  }, [store.completions]);

  /** per-day consistency: completed scheduled / scheduled */
  const consistency = useMemo(
    () =>
      dates.map((d) => {
        const ds = ymd(d);
        const sched = active.filter((h) => habitScheduledOn(h, d));
        if (sched.length === 0) return null;
        const done = doneByDate.get(ds);
        if (!done) return 0;
        return (sched.filter((h) => done.has(h.id)).length / sched.length) * 100;
      }),
    [dates, active, doneByDate]
  );

  /** Overall consistency = all completed scheduled occurrences / all scheduled, in range */
  const overall = useMemo(() => {
    let sched = 0;
    let done = 0;
    active.forEach((h) => {
      for (const d of dates) {
        if (d > today || !habitScheduledOn(h, d)) continue;
        sched++;
        if (doneByDate.get(ymd(d))?.has(h.id)) done++;
      }
    });
    return sched === 0 ? 0 : Math.round((done / sched) * 100);
  }, [active, dates, doneByDate, today]);

  const taskConsistency = useMemo(() => {
    let total = 0;
    let done = 0;
    for (const t of store.tasks) {
      const d = parseYmdSafe(t.task_date);
      if (!dates.some((x) => ymd(x) === t.task_date)) continue;
      if (d > today) continue;
      total++;
      if (t.completed) done++;
    }
    return total === 0 ? null : Math.round((done / total) * 100);
  }, [store.tasks, dates, today]);

  const headline = scope === "TASKS" ? (taskConsistency ?? 0) : overall;

  const chartData = useMemo(() => {
    if (scope === "TASKS") {
      return dates.map((d) => {
        const ds = ymd(d);
        const ts = store.tasks.filter((t) => t.task_date === ds);
        if (ts.length === 0) return null;
        return (ts.filter((t) => t.completed).length / ts.length) * 100;
      });
    }
    return consistency;
  }, [scope, dates, store.tasks, consistency]);

  /* ---- THIS WEEK / VS LAST WEEK (week = Sun..Sat containing today) ---- */
  const weekPct = (offset: number) => {
    const ws = addDays(startOfWeek(today, 0), offset * 7);
    const days = Array.from({ length: 7 }, (_, i) => addDays(ws, i));
    let sched = 0;
    let done = 0;
    for (const h of active) {
      for (const d of days) {
        if (d > today || !habitScheduledOn(h, d)) continue;
        sched++;
        if (doneByDate.get(ymd(d))?.has(h.id)) done++;
      }
    }
    return sched === 0 ? 0 : Math.round((done / sched) * 100);
  };
  const thisWeek = weekPct(0);
  const lastWeek = weekPct(-1);
  const delta = thisWeek - lastWeek;

  /* ---- habit period stats ---- */
  const habitStats = useMemo(() => {
    const periodDays = period === "D" ? 1 : period === "W" ? 7 : 30;
    const pDates = Array.from({ length: periodDays }, (_, i) => addDays(today, -i));
    return active.map((h) => {
      const build = (ds: Date[]) => {
        let sched = 0;
        let done = 0;
        const myDone = new Set(
          store.completions.filter((c) => c.habit_id === h.id).map((c) => c.completion_date)
        );
        for (const d of ds) {
          if (d > today || !habitScheduledOn(h, d)) continue;
          sched++;
          if (myDone.has(ymd(d))) done++;
        }
        return sched === 0 ? 0 : Math.round((done / sched) * 100);
      };
      return {
        habit: h,
        pct: build(pDates),
        streak: computeStreak(h, store.completions, today),
      };
    });
  }, [active, period, store.completions, today]);

  const leaderboard = useMemo(
    () => [...habitStats].sort((a, b) => b.pct - a.pct).slice(0, 3),
    [habitStats]
  );

  const topStreaks = useMemo(
    () =>
      [...habitStats]
        .filter((h) => h.streak > 0)
        .sort((a, b) => b.streak - a.streak)
        .slice(0, 3),
    [habitStats]
  );

  const bestStreak = useMemo(() => {
    let best = { name: "", streak: 0 };
    for (const h of habitStats) if (h.streak > best.streak) best = { name: h.habit.name, streak: h.streak };
    return best;
  }, [habitStats]);

  const needsAttention = useMemo(() => {
    const recent = Array.from({ length: 14 }, (_, i) => addDays(today, -i));
    let worst: { name: string; pct: number } | null = null;
    for (const h of active) {
      let sched = 0;
      let done = 0;
      const myDone = new Set(
        store.completions.filter((c) => c.habit_id === h.id).map((c) => c.completion_date)
      );
      for (const d of recent) {
        if (!habitScheduledOn(h, d)) continue;
        sched++;
        if (myDone.has(ymd(d))) done++;
      }
      if (sched < 2) continue;
      const pct = Math.round((done / sched) * 100);
      if (!worst || pct < worst.pct) worst = { name: h.name, pct };
    }
    return worst;
  }, [active, store.completions, today]);

  const hasAnyData = active.length > 0;

  return (
    <div className="pb-8">
      {/* Main chart card */}
      <div className="mb-3 rounded-[16px] border border-[#1E1E1E] bg-[#141414] px-[18px] pb-[10px] pt-[20px]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="eyebrow">Overall consistency</div>
            <div className="mt-[10px] text-[46px] font-bold leading-none tracking-[-0.02em] text-[#F3F3F3] font-num">
              {headline}%
            </div>
          </div>
          <div className="flex shrink-0 gap-[10px]">
            <Dropdown
              value={scope}
              open={scopeOpen}
              setOpen={setScopeOpen}
              options={["OVERALL", "HABITS", "TASKS"]}
              onSelect={(v) => setScope(v as Scope)}
            />
            <Dropdown
              value={RANGE_LABEL[range]}
              open={rangeOpen}
              setOpen={setRangeOpen}
              options={Object.values(RANGE_LABEL)}
              onSelect={(v) =>
                setRange(
                  (Object.keys(RANGE_LABEL) as RangeKey[]).find((k) => RANGE_LABEL[k] === v) ??
                    "LAST_15"
                )
              }
            />
          </div>
        </div>

        <ConsistencyChart data={chartData} dates={dates} />
      </div>

      {/* Stat cards */}
      <div className="mb-3 grid grid-cols-2 gap-[10px] lg:grid-cols-4">
        <StatCard label="This week" value={`${thisWeek}%`} />
        <StatCard
          label="vs last week"
          value={`${delta >= 0 ? "+" : ""}${delta}%`}
          tone={delta >= 0 ? "cyan" : "down"}
        />
        <StatCard label="Best streak" value={bestStreak.streak > 0 ? `${FIRE} ${bestStreak.streak}` : "—"} />
        <StatCard
          label="Needs attention"
          value={needsAttention ? needsAttention.name : hasAnyData ? "—" : "No data"}
        />
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {/* Leaderboard */}
        <div className="rounded-[16px] border border-[#1E1E1E] bg-[#141414] px-[18px] py-[18px]">
          <div className="flex items-center justify-between">
            <span className="eyebrow">Habit leaderboard</span>
            <div className="flex items-center gap-[2px] rounded-full bg-[#111111] p-[3px]">
              {(["D", "W", "M"] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={cn(
                    "flex h-[20px] w-[20px] items-center justify-center rounded-full text-[9px] font-bold transition-colors",
                    period === p ? "bg-[#28D0C0] text-[#0A0A0A]" : "text-[#5A626B] hover:text-[#8B939C]"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {leaderboard.length === 0 ? (
            <EmptyBlock text="Create habits to build a leaderboard." />
          ) : (
            <div className="mt-[16px] space-y-[14px]">
              {leaderboard.map((h, i) => (
                <ListRow
                  key={h.habit.id}
                  medal={MEDALS[i]}
                  name={h.habit.name}
                  right={`${h.pct}%`}
                  pct={h.pct}
                />
              ))}
            </div>
          )}
        </div>

        {/* Top streaks */}
        <div className="rounded-[16px] border border-[#1E1E1E] bg-[#141414] px-[18px] py-[18px]">
          <span className="eyebrow">Top streaks</span>
          {topStreaks.length === 0 ? (
            <EmptyBlock text="Complete habits on consecutive days to build streaks." />
          ) : (
            <div className="mt-[16px] space-y-[14px]">
              {topStreaks.map((h, i) => (
                <ListRow
                  key={h.habit.id}
                  medal={MEDALS[i]}
                  name={h.habit.name}
                  right={`${h.streak}d`}
                  pct={Math.min(100, (h.streak / 7) * 100)}
                  rightColor="#28D0C0"
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {!hasAnyData && (
        <div className="mt-3 rounded-[16px] border border-dashed border-[#232323] bg-[#111111] px-6 py-10 text-center">
          <h3 className="text-[15px] font-semibold text-[#F3F3F3]">No insights yet</h3>
          <p className="mx-auto mt-2 max-w-md text-[12px] leading-relaxed text-[#737B84]">
            Create habits and check them off — your consistency chart, leaderboard and streaks
            will be generated from your own activity.
          </p>
        </div>
      )}
    </div>
  );
}

function parseYmdSafe(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function EmptyBlock({ text }: { text: string }) {
  return (
    <div className="mt-[16px] rounded-[12px] border border-dashed border-[#232323] px-4 py-7 text-center text-[11.5px] text-[#5A626B]">
      {text}
    </div>
  );
}

function Dropdown({
  value,
  open,
  setOpen,
  options,
  onSelect,
}: {
  value: string;
  open: boolean;
  setOpen: (b: boolean) => void;
  options: string[];
  onSelect: (v: string) => void;
}) {
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex h-[38px] items-center gap-[10px] rounded-[10px] border border-[#232323] bg-[#171717] px-[14px] text-[10.5px] font-bold tracking-[0.06em] text-[#E7EAED] transition-colors hover:border-[#333]"
      >
        {value}
        <ChevronDownIcon size={11} color="#737B84" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="fade-in absolute right-0 z-50 mt-[6px] min-w-[150px] overflow-hidden rounded-[11px] border border-[#232323] bg-[#171717]">
            {options.map((o) => (
              <button
                key={o}
                onClick={() => {
                  onSelect(o);
                  setOpen(false);
                }}
                className={cn(
                  "block w-full px-[14px] py-[10px] text-left text-[10.5px] font-bold tracking-[0.06em] transition-colors hover:bg-[#1F1F1F]",
                  o === value ? "text-[#28D0C0]" : "text-[#B9C0C7]"
                )}
              >
                {o}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ConsistencyChart({
  data,
  dates,
}: {
  data: (number | null)[];
  dates: Date[];
}) {
  const [hover, setHover] = useState<number | null>(null);

  const W = 1000;
  const H = 300;
  const pad = { l: 4, r: 4, t: 34, b: 30 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;

  const pts: [number, number][] = [];
  data.forEach((v, i) => {
    if (v === null) return;
    pts.push([pad.l + (i / Math.max(1, data.length - 1)) * iw, pad.t + ih - (v / 100) * ih]);
  });

  // Smooth cardinal spline
  const smooth = (p: [number, number][]) => {
    if (p.length < 2) return "";
    let d = `M ${p[0][0]},${p[0][1]}`;
    for (let i = 0; i < p.length - 1; i++) {
      const p0 = p[i - 1] ?? p[i];
      const p1 = p[i];
      const p2 = p[i + 1];
      const p3 = p[i + 2] ?? p2;
      const t = 0.2;
      d += ` C ${p1[0] + (p2[0] - p0[0]) * t},${p1[1] + (p2[1] - p0[1]) * t} ${
        p2[0] - (p3[0] - p1[0]) * t
      },${p2[1] - (p3[1] - p1[1]) * t} ${p2[0]},${p2[1]}`;
    }
    return d;
  };

  const line = smooth(pts);
  const area = pts.length > 1 ? `${line} L ${pts[pts.length - 1][0]},${pad.t + ih} L ${pts[0][0]},${pad.t + ih} Z` : "";

  // peak point (marker in reference)
  let peakIdx = -1;
  data.forEach((v, i) => {
    if (v === null) return;
    if (peakIdx === -1 || (v ?? 0) > (data[peakIdx] ?? 0)) peakIdx = i;
  });

  const labelEvery = data.length > 40 ? 14 : data.length > 20 ? 2 : 2;

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const idx = Math.round(((x - pad.l) / iw) * (data.length - 1));
    setHover(Math.max(0, Math.min(data.length - 1, idx)));
  };

  const hoverVal = hover !== null ? data[hover] : null;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="h-[250px] w-full cursor-crosshair"
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="ins-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#28D0C0" stopOpacity="0.26" />
            <stop offset="55%" stopColor="#28D0C0" stopOpacity="0.09" />
            <stop offset="100%" stopColor="#28D0C0" stopOpacity="0" />
          </linearGradient>
        </defs>

        {area && <path d={area} fill="url(#ins-area)" />}
        {line && (
          <path d={line} fill="none" stroke="#28D0C0" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        )}

        {/* hover marker */}
        {hover !== null && hoverVal !== null && pts[hover] && (
          <>
            <line
              x1={pts[hover][0]}
              x2={pts[hover][0]}
              y1={pts[hover][1] + 8}
              y2={pad.t + ih}
              stroke="#28D0C0"
              strokeOpacity="0.5"
              strokeDasharray="2 4"
              vectorEffect="non-scaling-stroke"
            />
            <circle cx={pts[hover][0]} cy={pts[hover][1]} r="6" fill="#0A0A0A" stroke="#28D0C0" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          </>
        )}

        {/* peak marker (default visible point) */}
        {peakIdx >= 0 && hover === null && pts[peakIdx] && (
          <>
            <line
              x1={pts[peakIdx][0]}
              x2={pts[peakIdx][0]}
              y1={pts[peakIdx][1] + 8}
              y2={pad.t + ih}
              stroke="#28D0C0"
              strokeOpacity="0.45"
              strokeDasharray="2 4"
              vectorEffect="non-scaling-stroke"
            />
            <circle cx={pts[peakIdx][0]} cy={pts[peakIdx][1]} r="6" fill="#0A0A0A" stroke="#28D0C0" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          </>
        )}

        {/* x labels */}
        {dates.map((d, i) =>
          i % labelEvery === 0 || i === dates.length - 1 ? (
            <text
              key={i}
              x={pad.l + (i / Math.max(1, data.length - 1)) * iw}
              y={H - 8}
              textAnchor={i === 0 ? "start" : i === dates.length - 1 ? "end" : "middle"}
              fontSize="10.5"
              fill="#5A626B"
              style={{ fontFamily: "Inter, sans-serif", pointerEvents: "none" }}
            >
              {d.getDate()} {monthName(d.getMonth()).slice(0, 3)}
            </text>
          ) : null
        )}
      </svg>

      {hover !== null && hoverVal !== null && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full"
          style={{
            left: `${((pts[hover]?.[0] ?? 0) / W) * 100}%`,
            top: `${(((pts[hover]?.[1] ?? 0) - 8) / H) * 100}%`,
          }}
        >
          <div className="rounded-[12px] border border-[#2A2A2A] bg-[#141414] px-[13px] py-[8px] text-center">
            <div className="text-[9.5px] font-semibold text-[#737B84]">
              {dates[hover].getDate()} {monthName(dates[hover].getMonth()).slice(0, 3).toUpperCase()}
            </div>
            <div className="mt-[2px] text-[15px] font-bold text-[#28D0C0] font-num">
              {Math.round(hoverVal)}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  tone = "white",
}: {
  label: string;
  value: string;
  tone?: "white" | "cyan" | "down";
}) {
  return (
    <div className="rounded-[16px] border border-[#1E1E1E] bg-[#141414] px-4 py-[15px] text-center">
      <div className="eyebrow">{label}</div>
      <div
        className={cn(
          "mt-[9px] truncate text-[24px] font-bold leading-none font-num",
          tone === "cyan" && "text-[#28D0C0]",
          tone === "down" && "text-[#EF4444]",
          tone === "white" && "text-[#F3F3F3]"
        )}
      >
        {value}
      </div>
    </div>
  );
}

function ListRow({
  medal,
  name,
  right,
  rightColor = "#F3F3F3",
  pct,
}: {
  medal: string;
  name: string;
  right: string;
  rightColor?: string;
  pct: number;
}) {
  return (
    <div>
      <div className="flex items-center gap-[10px]">
        <span className="text-[12px] leading-none">{medal}</span>
        <span className="min-w-0 flex-1 truncate text-[11.5px] font-bold uppercase tracking-[0.04em] text-[#E7EAED]">
          {name}
        </span>
        <span className="shrink-0 text-[11.5px] font-bold font-num" style={{ color: rightColor }}>
          {right}
        </span>
      </div>
      <div className="mt-[7px] h-[5px] w-full rounded-full bg-[#1F1F1F]">
        <div
          className="h-full rounded-full bg-[#28D0C0] transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
