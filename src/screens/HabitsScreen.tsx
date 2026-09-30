import { useState, useMemo } from "react";
import {
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckIcon,
  FIRE,
  StarIcon,
  PencilIcon,
} from "../components/icons";
import { cn } from "../utils/cn";
import {
  useStore,
  computeStreak,
  computeBestStreak,
  habitScheduledOn,
  ymd,
  monthName,
  type Habit,
} from "../lib/store";
import { NewHabitModal } from "../components/NewHabitModal";

type View = "daily" | "weekly" | "monthly";

/**
 * Single stable "now" for the whole render pass.
 * Previously every cell called `new Date()` inline, which made the
 * future/past boundary jitter between cells and between renders.
 */
const todayNow = new Date();

export function HabitsScreen() {
  const store = useStore();
  const [view, setView] = useState<View>("daily");
  const [cursor, setCursor] = useState(() => new Date());
  const [modal, setModal] = useState<{ open: boolean; editId?: string }>({
    open: false,
  });

  const today = useMemo(() => new Date(), []);
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = ymd(today);

  const active = useMemo(
    () => store.habits.filter((h) => !h.archived),
    [store.habits]
  );

  const completionsByDate = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const c of store.completions) {
      let s = m.get(c.completion_date);
      if (!s) {
        s = new Set();
        m.set(c.completion_date, s);
      }
      s.add(c.habit_id);
    }
    return m;
  }, [store.completions]);

  /** day number (1-based) -> scheduled habit ids */
  const scheduledByDay = useMemo(() => {
    const m: Record<number, string[]> = {};
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      m[d] = active.filter((h) => habitScheduledOn(h, date)).map((h) => h.id);
    }
    return m;
  }, [active, year, month, daysInMonth]);

  /** overall trend: % of scheduled habits completed per day */
  const trend = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => {
      const d = i + 1;
      const ids = scheduledByDay[d];
      if (!ids || ids.length === 0) return null;
      const done = completionsByDate.get(ymd(new Date(year, month, d)));
      if (!done) return 0;
      return (ids.filter((id) => done.has(id)).length / ids.length) * 100;
    });
  }, [scheduledByDay, completionsByDate, year, month, daysInMonth]);

  /** today's completion for the header line */
  const todayScheduledIds = scheduledByDay[today.getDate()] ?? [];
  const todayDoneCount = todayScheduledIds.filter((id) =>
    completionsByDate.get(todayStr)?.has(id)
  ).length;

  const overallAvg = useMemo(() => {
    const vals = trend.filter((v): v is number => v !== null);
    if (vals.length === 0) return 0;
    // Average over days that have already elapsed / have data
    const relevant = vals.filter((_, i) => {
      const d = i + 1;
      const date = new Date(year, month, d);
      return date <= today;
    });
    const use = relevant.length > 0 ? relevant : vals;
    return Math.round(use.reduce((a, b) => a + b, 0) / use.length);
  }, [trend, year, month, today]);

  const rows = useMemo(() => {
    return active.map((h) => {
      const cells = Array.from({ length: daysInMonth }, (_, i) => {
        const d = i + 1;
        const date = new Date(year, month, d);
        const scheduled = habitScheduledOn(h, date);
        const done =
          scheduled &&
          (completionsByDate.get(ymd(date))?.has(h.id) ?? false);
        return { day: d, date, scheduled, done };
      });
      let sched = 0;
      let comp = 0;
      for (const c of cells) {
        if (c.scheduled && c.date <= today) {
          sched++;
          if (c.done) comp++;
        }
      }
      return {
        habit: h,
        cells,
        avg: sched === 0 ? 0 : Math.round((comp / sched) * 100),
        streak: computeStreak(h, store.completions, today),
        best: computeBestStreak(h, store.completions, today),
      };
    });
  }, [active, daysInMonth, year, month, completionsByDate, store.completions, today]);

  const shiftMonth = (n: number) =>
    setCursor(new Date(year, month + n, 1));

  return (
    <div className="pb-8">
      {/* Month header strip */}
      <div className="mb-3">
        <div className="flex items-end justify-between gap-4 px-1">
          <div>
            <div className="eyebrow">
              {monthName(month)} {year}
            </div>
            <div className="mt-[6px] text-[13px] font-bold text-[#F3F3F3] font-num">
              {todayDoneCount}/{todayScheduledIds.length} habits done today
            </div>
          </div>
          <div className="flex items-center gap-[10px]">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                shiftMonth(-1);
              }}
              aria-label="Previous month"
              title="Previous month"
              className="flex h-[38px] w-[38px] cursor-pointer items-center justify-center rounded-full border border-[#232323] bg-[#141414] text-[#737B84] transition-colors hover:border-[#333] hover:text-[#F3F3F3] focus:outline-none focus-visible:ring-1 focus-visible:ring-[#28D0C0]"
            >
              <ChevronLeftIcon size={15} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                shiftMonth(1);
              }}
              aria-label="Next month"
              title="Next month"
              className="flex h-[38px] w-[38px] cursor-pointer items-center justify-center rounded-full border border-[#232323] bg-[#141414] text-[#737B84] transition-colors hover:border-[#333] hover:text-[#F3F3F3] focus:outline-none focus-visible:ring-1 focus-visible:ring-[#28D0C0]"
            >
              <ChevronRightIcon size={15} />
            </button>
          </div>
        </div>
        {/* cyan progress line */}
        <div className="mt-[10px] h-[3px] w-full rounded-full bg-[#1B1B1B]">
          <div
            className="h-full rounded-full bg-[#28D0C0] transition-all duration-500"
            style={{
              width: `${(today.getDate() / daysInMonth) * 100}%`,
              boxShadow: "0 0 8px rgba(40,208,192,0.45)",
            }}
          />
        </div>
      </div>

      {/* Segmented control + new habit */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center rounded-full bg-[#111111] p-0"
          role="tablist"
          aria-label="Habit view"
        >
          {(["daily", "weekly", "monthly"] as View[]).map((v) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={view === v}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setView(v);
              }}
              className={cn(
                "flex-1 cursor-pointer rounded-full py-[15px] text-[11.5px] font-bold uppercase tracking-[0.16em] transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[#28D0C0]",
                view === v
                  ? "bg-[#28D0C0] text-[#0A0A0A]"
                  : "text-[#5A626B] hover:text-[#8B939C]"
              )}
            >
              {v}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setModal({ open: true, editId: undefined });
          }}
          className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-[7px] rounded-full bg-[#28D0C0] px-[20px] py-[14px] text-[12.5px] font-bold text-[#0A0A0A] transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#28D0C0]"
        >
          <PlusIcon size={13} color="#0A0A0A" />
          New Habit
        </button>
      </div>

      {/* Main matrix card */}
      <div className="rounded-[16px] border border-[#1E1E1E] bg-[#121212]">
        {active.length === 0 ? (
          <EmptyHabits onAdd={() => setModal({ open: true })} />
        ) : (
          <>
            <TrendStrip
              trend={trend}
              daysInMonth={daysInMonth}
              avg={overallAvg}
              label={
                view === "daily" ? "TREND" : view === "weekly" ? "WEEKLY AVG" : "MONTHLY TOTAL"
              }
            />
            {view === "daily" ? (
              <>
                <MatrixHeader
                  daysInMonth={daysInMonth}
                  highlight={
                    year === today.getFullYear() && month === today.getMonth()
                      ? today.getDate()
                      : -1
                  }
                />
                <div className="divide-y divide-[#1A1A1A]">
                  {rows.map((r) => (
                    <HabitMatrixRow
                      key={r.habit.id}
                      habit={r.habit}
                      cells={r.cells}
                      avg={r.avg}
                      streak={r.streak}
                      best={r.best}
                      highlight={
                        year === today.getFullYear() && month === today.getMonth()
                          ? today.getDate()
                          : -1
                      }
                      onToggleCell={(_day, date) => {
                        // guard duplicated here on purpose: the circle button
                        // is not `disabled`, so this is the real gate
                        if (date > todayNow) return;
                        if (!habitScheduledOn(r.habit, date)) return;
                        store.toggleHabitCompletion(r.habit.id, ymd(date));
                      }}
                      onOpen={() => setModal({ open: true, editId: r.habit.id })}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="px-4 py-4">
                {view === "weekly" ? (
                  <WeeklyBody active={active} completions={store.completions} today={today} />
                ) : (
                  <MonthlyBody active={active} completions={store.completions} today={today} />
                )}
              </div>
            )}
          </>
        )}
      </div>

      {modal.open && (
        <NewHabitModal
          editId={modal.editId}
          onClose={() => setModal({ open: false })}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function EmptyHabits({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center px-6 py-20 text-center">
      <div className="mb-4 text-[26px]">{FIRE}</div>
      <h3 className="text-[16px] font-semibold text-[#F3F3F3]">No habits yet</h3>
      <p className="mt-2 max-w-sm text-[12.5px] leading-relaxed text-[#737B84]">
        Your habit matrix will appear here once you create your first habit.
      </p>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onAdd();
        }}
        className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#28D0C0] px-[18px] py-[10px] text-[12.5px] font-bold text-[#0A0A0A] transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#28D0C0]"
      >
        <PlusIcon size={13} color="#0A0A0A" />
        New Habit
      </button>
    </div>
  );
}

function TrendStrip({
  trend,
  daysInMonth,
  avg,
  label,
}: {
  trend: (number | null)[];
  daysInMonth: number;
  avg: number;
  label: string;
}) {
  const W = 1000;
  const H = 96;
  const pts: [number, number][] = [];
  trend.forEach((v, i) => {
    if (v === null) return;
    pts.push([(i / Math.max(1, daysInMonth - 1)) * W, H - (v / 100) * (H - 18) - 9]);
  });

  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");
  const area =
    pts.length > 1
      ? `${line} L${pts[pts.length - 1][0]},${H} L${pts[0][0]},${H} Z`
      : "";

  return (
    <div className="flex items-stretch gap-3 border-b border-[#1A1A1A] px-3 py-3">
      <div className="flex w-[92px] shrink-0 items-center gap-[6px] pl-1">
        <span className="h-[6px] w-[6px] rounded-full bg-[#28D0C0]" />
        <span className="eyebrow !text-[9px]">{label}</span>
      </div>

      <div className="min-w-0 flex-1">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="h-[74px] w-full"
        >
          <defs>
            <linearGradient id="hp-trend" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#28D0C0" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#28D0C0" stopOpacity="0" />
            </linearGradient>
          </defs>
          {area && <path d={area} fill="url(#hp-trend)" />}
          {line && (
            <path
              d={line}
              fill="none"
              stroke="#28D0C0"
              strokeWidth="1.6"
              vectorEffect="non-scaling-stroke"
            />
          )}
          {pts.map(([x, y], i) => (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="2.6"
              fill="#0A0A0A"
              stroke="#28D0C0"
              strokeWidth="1.3"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
      </div>

      <div className="flex w-[104px] shrink-0 flex-col items-center justify-center gap-[6px]">
        <span className="eyebrow !text-[9px]">Avg</span>
        <span
          className="rounded-[10px] px-[13px] py-[7px] text-[13px] font-bold text-[#28D0C0] font-num"
          style={{ background: "rgba(40,208,192,0.09)" }}
        >
          {avg}%
        </span>
      </div>
    </div>
  );
}

function MatrixHeader({
  daysInMonth,
  highlight,
}: {
  daysInMonth: number;
  highlight: number;
}) {
  return (
    <div className="flex items-center border-b border-[#1A1A1A] py-[10px]">
      <div className="w-[104px] shrink-0 pl-4">
        <span className="eyebrow !text-[9px]">Habit</span>
      </div>
      <div className="min-w-0 flex-1 overflow-x-auto">
        <div className="flex min-w-[820px]">
          {Array.from({ length: daysInMonth }, (_, i) => {
            const d = i + 1;
            const isHi = d === highlight;
            return (
              <div
                key={d}
                className={cn(
                  "flex-1 text-center text-[9.5px] font-semibold font-num",
                  isHi ? "text-[#28D0C0]" : "text-[#454B52]"
                )}
              >
                {d}
              </div>
            );
          })}
        </div>
      </div>
      <div className="w-[132px] shrink-0 pr-4 text-right">
        <span className="eyebrow !text-[9px]">Stats</span>
      </div>
    </div>
  );
}

function HabitMatrixRow({
  habit,
  cells,
  avg,
  streak,
  best,
  highlight,
  onToggleCell,
  onOpen,
}: {
  habit: Habit;
  cells: { day: number; date: Date; scheduled: boolean; done: boolean }[];
  avg: number;
  streak: number;
  best: number;
  highlight: number;
  onToggleCell: (day: number, date: Date) => void;
  onOpen: () => void;
}) {
  return (
    <div className="group flex items-center py-[11px] transition-colors hover:bg-[#151515]">
      {/* name */}
      <div className="flex w-[104px] shrink-0 items-center gap-[7px] pl-4 pr-1">
        <span
          className="h-[6px] w-[6px] shrink-0 rounded-full"
          style={{ backgroundColor: habit.color }}
        />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onOpen();
          }}
          title={`${habit.name} — click to manage`}
          className="min-w-0 flex-1 cursor-pointer text-left text-[10px] font-semibold uppercase leading-[1.25] tracking-[0.03em] text-[#D8DBDE] hover:text-[#28D0C0] focus:outline-none focus-visible:text-[#28D0C0]"
        >
          {habit.name}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onOpen();
          }}
          aria-label={`Manage ${habit.name}`}
          className="shrink-0 cursor-pointer text-[#454B52] opacity-0 transition-opacity hover:text-[#28D0C0] focus:opacity-100 focus:outline-none group-hover:opacity-100"
        >
          <PencilIcon size={11} />
        </button>
      </div>

      {/* cells */}
      <div className="min-w-0 flex-1 overflow-x-auto">
        <div className="flex min-w-[820px]">
          {cells.map((c) => {
            const isHi = c.day === highlight;
            const future = c.date > todayNow;
            const editable = c.scheduled && !future;
            return (
              <div key={c.day} className="flex flex-1 justify-center">
                {/*
                  NOTE: intentionally NOT using the `disabled` attribute.
                  A disabled <button> is removed from the hit-testing tree in
                  most engines (implicit pointer-events: none) and never fires
                  pointer events, which made the circles feel dead. The same
                  guard lives in the handler instead, and the visual state is
                  unchanged (dimmed + cursor-default).
                */}
                <button
                  type="button"
                  aria-disabled={!editable}
                  aria-pressed={c.done}
                  aria-label={`${habit.name} — ${c.date.toDateString()}${c.done ? " completed" : ""}`}
                  title={
                    !editable
                      ? future
                        ? "Future date"
                        : "Not scheduled"
                      : c.done
                      ? "Mark incomplete"
                      : "Mark complete"
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    if (!editable) return;
                    onToggleCell(c.day, c.date);
                  }}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter" && e.key !== " ") return;
                    e.preventDefault();
                    if (!editable) return;
                    onToggleCell(c.day, c.date);
                  }}
                  style={{ pointerEvents: "auto" }}
                  className={cn(
                    "flex h-[21px] w-[21px] items-center justify-center rounded-full border transition-all",
                    c.done
                      ? "border-[#28D0C0] bg-[#28D0C0]"
                      : isHi
                      ? "border-[#28D0C0]/60 bg-[#101817] shadow-[0_0_9px_rgba(40,208,192,0.35)]"
                      : c.scheduled
                      ? "border-[#2E2E2E] bg-transparent hover:border-[#4A4A4A]"
                      : "border-[#232323] bg-transparent",
                    future ? "cursor-default opacity-45" : "cursor-pointer",
                    !c.scheduled && !isHi && "cursor-default",
                    "focus:outline-none focus-visible:ring-1 focus-visible:ring-[#28D0C0]"
                  )}
                >
                  {c.done && <CheckIcon size={11} color="#0A0A0A" />}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* stats */}
      <div className="flex w-[132px] shrink-0 items-center justify-end gap-[12px] pl-2 pr-4">
        <span className="text-[11.5px] font-bold text-[#F3F3F3] font-num">
          {avg}%
        </span>
        <span className="flex items-center gap-[3px] text-[11px] font-semibold text-[#F3F3F3] font-num">
          <span className="text-[10px]">{FIRE}</span>
          {streak}
        </span>
        <span className="flex items-center gap-[3px] text-[11px] font-semibold text-[#F3F3F3] font-num">
          <StarIcon size={11} />
          {best}
        </span>
      </div>
    </div>
  );
}

/* ----------------------- WEEKLY aggregation ----------------------- */

type Bucket = { label: string; sub: string; pct: number; scheduled: number; completed: number };

function aggregate(
  active: Habit[],
  completions: { habit_id: string; completion_date: string }[],
  buckets: { label: string; sub: string; dates: Date[] }[],
  today: Date
): Bucket[] {
  const doneByHabit = new Map<string, Set<string>>();
  for (const c of completions) {
    let s = doneByHabit.get(c.habit_id);
    if (!s) {
      s = new Set();
      doneByHabit.set(c.habit_id, s);
    }
    s.add(c.completion_date);
  }

  return buckets.map((b) => {
    let sched = 0;
    let comp = 0;
    for (const h of active) {
      const mine = doneByHabit.get(h.id);
      for (const d of b.dates) {
        if (d > today || !habitScheduledOn(h, d)) continue;
        sched++;
        if (mine?.has(ymd(d))) comp++;
      }
    }
    return {
      label: b.label,
      sub: b.sub,
      pct: sched === 0 ? 0 : Math.round((comp / sched) * 100),
      scheduled: sched,
      completed: comp,
    };
  });
}

function BucketGrid({ items, title }: { items: Bucket[]; title: string }) {
  return (
    <div>
      <div className="eyebrow mb-3">{title}</div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {items.map((w) => (
          <div
            key={w.label + w.sub}
            className="rounded-[12px] border border-[#232323] bg-[#111111] p-3"
          >
            <div className="eyebrow !text-[9px]">{w.label}</div>
            <div className="mt-[2px] text-[9.5px] text-[#454B52] font-num">{w.sub}</div>
            <div className="mt-[7px] text-[19px] font-bold text-[#F3F3F3] font-num">
              {w.pct}%
            </div>
            <div className="mt-[2px] text-[10px] text-[#5A626B] font-num">
              {w.completed}/{w.scheduled} done
            </div>
            <div className="mt-[8px] h-[3px] w-full rounded-full bg-[#1E1E1E]">
              <div
                className="h-full rounded-full bg-[#28D0C0] transition-all duration-500"
                style={{ width: `${w.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WeeklyBody({
  active,
  completions,
  today,
}: {
  active: Habit[];
  completions: { habit_id: string; completion_date: string }[];
  today: Date;
}) {
  const items = useMemo(() => {
    const y = today.getFullYear();
    const m = today.getMonth();
    const monthStart = new Date(y, m, 1);
    const monthEnd = new Date(y, m + 1, 0);

    const buckets: { label: string; sub: string; dates: Date[] }[] = [];
    let ws = new Date(monthStart);
    let i = 1;
    while (ws <= monthEnd) {
      const we = new Date(ws);
      we.setDate(we.getDate() + 6);
      const dates: Date[] = [];
      for (
        let d = new Date(ws);
        d <= we && d <= monthEnd;
        d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
      ) {
        dates.push(d);
      }
      buckets.push({
        label: `Week ${i}`,
        sub: `${ws.getDate()}/${ws.getMonth() + 1} - ${we.getDate()}/${we.getMonth() + 1}`,
        dates,
      });
      ws = new Date(we.getFullYear(), we.getMonth(), we.getDate() + 1);
      i++;
    }
    return aggregate(active, completions, buckets, today);
  }, [active, completions, today]);

  return <BucketGrid items={items} title="Weekly breakdown" />;
}

function MonthlyBody({
  active,
  completions,
  today,
}: {
  active: Habit[];
  completions: { habit_id: string; completion_date: string }[];
  today: Date;
}) {
  const items = useMemo(() => {
    const buckets: { label: string; sub: string; dates: Date[] }[] = [];
    for (let m = 5; m >= 0; m--) {
      const start = new Date(today.getFullYear(), today.getMonth() - m, 1);
      const end =
        m === 0 ? today : new Date(start.getFullYear(), start.getMonth() + 1, 0);
      const dates: Date[] = [];
      for (
        let d = new Date(start);
        d <= end;
        d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
      ) {
        dates.push(d);
      }
      buckets.push({
        label: monthName(start.getMonth()).slice(0, 3),
        sub: String(start.getFullYear()),
        dates,
      });
    }
    return aggregate(active, completions, buckets, today);
  }, [active, completions, today]);

  return <BucketGrid items={items} title="Monthly breakdown — last 6 months" />;
}
