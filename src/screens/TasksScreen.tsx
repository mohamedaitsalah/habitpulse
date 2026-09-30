import { useState, useMemo } from "react";
import { ProgressRing } from "../components/ProgressRing";
import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  CopyIcon,
  XIcon,
  PencilIcon,
  TrashIcon,
} from "../components/icons";
import { cn } from "../utils/cn";
import {
  useStore,
  ymd,
  parseYmd,
  addDays,
  startOfWeek,
  dayFull,
  dayShort,
  monthName,
  type MindsetEntry,
} from "../lib/store";

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export function TasksScreen() {
  const store = useStore();
  const [weekOffset, setWeekOffset] = useState(0);
  const [mindsetDate, setMindsetDate] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const today = useMemo(() => new Date(), []);
  const weekStart = useMemo(
    () => addDays(startOfWeek(today, 0), weekOffset * 7),
    [today, weekOffset]
  );

  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = addDays(weekStart, i);
        return {
          date: d,
          dateStr: ymd(d),
          name: dayFull(d.getDay()),
          short: dayShort(d.getDay()),
        };
      }),
    [weekStart]
  );

  const tasksByDate = useMemo(() => {
    const m: Record<string, typeof store.tasks> = {};
    for (const t of store.tasks) m[t.task_date] = [...(m[t.task_date] ?? []), t];
    return m;
  }, [store.tasks]);

  const mindsetByDate = useMemo(() => {
    const m: Record<string, MindsetEntry> = {};
    for (const e of store.mindset) m[e.entry_date] = e;
    return m;
  }, [store.mindset]);

  const dayStats = useMemo(
    () =>
      days.map((d) => {
        const ts = tasksByDate[d.dateStr] ?? [];
        const done = ts.filter((t) => t.completed).length;
        return {
          ...d,
          tasks: ts,
          done,
          total: ts.length,
          pct: ts.length === 0 ? 0 : Math.round((done / ts.length) * 100),
        };
      }),
    [days, tasksByDate]
  );

  const weekStats = useMemo(() => {
    const total = dayStats.reduce((a, d) => a + d.total, 0);
    const done = dayStats.reduce((a, d) => a + d.done, 0);
    return { total, done, pct: total === 0 ? 0 : Math.round((done / total) * 100) };
  }, [dayStats]);

  // AVG FOCUS: only days that actually have a focus entry
  const focusValues = useMemo(
    () =>
      days
        .map((d) => mindsetByDate[d.dateStr]?.focus)
        .filter((v): v is number => typeof v === "number" && v > 0),
    [days, mindsetByDate]
  );
  const avgFocus =
    focusValues.length === 0
      ? null
      : Math.round((focusValues.reduce((a, b) => a + b, 0) / focusValues.length) * 10) / 10;

  // PEAK DAY: highest focus, first chronologically on tie
  const peakDay = useMemo(() => {
    let best: { short: string; v: number } | null = null;
    for (const d of days) {
      const v = mindsetByDate[d.dateStr]?.focus ?? 0;
      if (v > 0 && (!best || v > best.v)) best = { short: d.short, v };
    }
    return best;
  }, [days, mindsetByDate]);

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  };

  const ws = weekStart;
  const we = addDays(weekStart, 6);
  const weekLabel = `${String(ws.getDate()).padStart(2, "0")} ${MONTHS_SHORT[ws.getMonth()]} - ${String(
    we.getDate()
  ).padStart(2, "0")} ${MONTHS_SHORT[we.getMonth()]} ${we.getFullYear()}`;

  return (
    <div className="pb-8">
      {/* ---------- top row ---------- */}
      <div className="mb-3 grid grid-cols-1 gap-3 lg:grid-cols-[48.5fr_51.5fr]">
        {/* Weekly progress */}
        <div className="rounded-[16px] border border-[#1E1E1E] bg-[#141414] px-4 py-[18px]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="eyebrow">Week starting</div>
              <div
                className="mt-[9px] inline-block rounded-[8px] px-[11px] py-[6px] text-[11.5px] font-bold text-[#28D0C0]"
                style={{ background: "rgba(40,208,192,0.09)" }}
              >
                {weekLabel}
              </div>
            </div>
            <div className="flex items-center gap-[6px]">
              <button
                onClick={() => setWeekOffset((w) => w - 1)}
                aria-label="Previous week"
                className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] border border-[#232323] bg-[#171717] text-[#737B84] transition-colors hover:text-[#F3F3F3]"
              >
                <ChevronLeftIcon size={13} />
              </button>
              <button
                onClick={() => setWeekOffset(0)}
                className="h-[34px] rounded-[10px] border border-[#232323] bg-[#171717] px-[14px] text-[11.5px] font-semibold text-[#D8DBDE] transition-colors hover:border-[#333]"
              >
                This week
              </button>
              <button
                onClick={() => setWeekOffset((w) => w + 1)}
                aria-label="Next week"
                className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] border border-[#232323] bg-[#171717] text-[#737B84] transition-colors hover:text-[#F3F3F3]"
              >
                <ChevronRightIcon size={13} />
              </button>
            </div>
          </div>

          <div className="mt-[16px] text-center">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#D8DBDE]">
              Overall progress
            </span>
          </div>

          <div className="mt-[14px] flex items-end gap-4">
            {/* bars */}
            <div className="flex min-w-0 flex-1 items-end gap-[6px] sm:gap-[10px]">
              {dayStats.map((d) => (
                <div key={d.dateStr} className="flex flex-1 flex-col items-center gap-[7px]">
                  <div className="relative flex h-[92px] w-full items-end justify-center">
                    {d.pct > 0 ? (
                      <>
                        <div
                          className="absolute inset-x-0 top-0 rounded-[10px] bg-[#1E1E1E]"
                          style={{ height: "100%" }}
                        />
                        <div
                          className="absolute inset-x-0 bottom-0 rounded-[10px] bg-[#28D0C0] transition-all duration-500"
                          style={{ height: `${Math.max(6, d.pct)}%` }}
                        />
                      </>
                    ) : (
                      <div className="absolute inset-x-[18%] bottom-0 h-[4px] rounded-full bg-[#242424]" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-[9.5px] font-semibold",
                      d.dateStr === ymd(today) ? "text-[#28D0C0]" : "text-[#5A626B]"
                    )}
                  >
                    {d.short}
                  </span>
                </div>
              ))}
            </div>

            {/* ring */}
            <div className="flex shrink-0 flex-col items-center">
              <ProgressRing value={weekStats.pct} size={112} stroke={9}>
                <div className="text-[25px] font-bold text-[#F3F3F3] font-num">
                  {weekStats.pct}%
                </div>
              </ProgressRing>
              <div className="mt-[10px] text-[10.5px] text-[#737B84] font-num">
                {weekStats.done} / {weekStats.total} completed
              </div>
            </div>
          </div>
        </div>

        {/* Mindset tracker */}
        <div className="rounded-[16px] border border-[#1E1E1E] bg-[#141414] px-4 py-[18px]">
          <div className="text-center text-[11px] font-bold uppercase tracking-[0.14em] text-[#D8DBDE]">
            Mindset tracker
          </div>
          <div className="mt-[10px] flex items-center gap-[13px]">
            <Legend color="#EF4444" label="Energy" />
            <Legend color="#28D0C0" label="Focus" />
            <Legend color="#A78BFA" label="Motivation" />
          </div>
          <MindsetChart days={days} data={mindsetByDate} onPick={(d) => setMindsetDate(d)} />
          <div className="mt-[6px] flex items-end justify-between">
            <div>
              <div className="eyebrow !text-[9px]">Avg focus</div>
              <div className="mt-[3px] text-[17px] font-bold text-[#F3F3F3] font-num">
                {avgFocus === null ? "—" : avgFocus.toFixed(1)}
              </div>
            </div>
            <div className="text-right">
              <div className="eyebrow !text-[9px]">Peak day</div>
              <div className="mt-[3px] text-[17px] font-bold text-[#F3F3F3]">
                {peakDay ? peakDay.short : "—"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- 7 day cards ---------- */}
      <div className="grid grid-cols-1 gap-[10px] sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {dayStats.map((d) => (
          <DayCard
            key={d.dateStr}
            day={d}
            mindset={mindsetByDate[d.dateStr]}
            isToday={d.dateStr === ymd(today)}
            onToggle={(id) => store.toggleTaskCompletion(id)}
            onAdd={(title) => store.createTask({ title, task_date: d.dateStr })}
            onRename={(id, title) => store.updateTask(id, { title })}
            onDelete={(id) => store.deleteTask(id)}
            onCopyYesterday={async () => {
              const yStr = ymd(addDays(d.date, -1));
              const count = (tasksByDate[yStr] ?? []).length;
              if (count === 0) {
                flash("No tasks yesterday to copy.");
                return;
              }
              await store.copyTasksFromYesterday(d.dateStr);
              flash(`${count} task${count > 1 ? "s" : ""} copied.`);
            }}
            onEditMindset={() => setMindsetDate(d.dateStr)}
          />
        ))}
      </div>

      {mindsetDate && (
        <MindsetModal
          dateStr={mindsetDate}
          initial={mindsetByDate[mindsetDate]}
          onClose={() => setMindsetDate(null)}
          onSave={async (v) => {
            await store.upsertMindset(mindsetDate, v);
            setMindsetDate(null);
          }}
        />
      )}

      {toast && (
        <div className="fade-in fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-[#2A2A2A] bg-[#171717] px-[18px] py-[10px] text-[12px] font-medium text-[#F3F3F3] shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-[5px]">
      <span className="h-[5px] w-[5px] rounded-full" style={{ background: color }} />
      <span className="text-[9.5px] font-medium text-[#737B84]">{label}</span>
    </span>
  );
}

function MindsetChart({
  days,
  data,
  onPick,
}: {
  days: { dateStr: string; short: string }[];
  data: Record<string, MindsetEntry>;
  onPick: (d: string) => void;
}) {
  const W = 560;
  const H = 168;
  const pad = { l: 8, r: 8, t: 12, b: 22 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;

  const series = (key: "energy" | "focus" | "motivation") =>
    days.map((d, i) => {
      const v = data[d.dateStr]?.[key] ?? 0;
      return [pad.l + (i / Math.max(1, days.length - 1)) * iw, pad.t + ih - (v / 10) * ih] as [number, number];
    });

  const path = (pts: [number, number][]) => {
    if (pts.every(([, y]) => y === pad.t + ih)) return "";
    return pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");
  };

  const energy = series("energy");
  const focus = series("focus");
  const motivation = series("motivation");
  const hasData = days.some((d) => !!data[d.dateStr]);

  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-[2px] h-[168px] w-full" preserveAspectRatio="none">
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <line
            key={f}
            x1={pad.l}
            x2={W - pad.r}
            y1={pad.t + ih * f}
            y2={pad.t + ih * f}
            stroke="#1C1C1C"
            strokeWidth="1"
          />
        ))}
        {hasData && (
          <>
            <path d={path(motivation)} fill="none" stroke="#A78BFA" strokeWidth="1.7" vectorEffect="non-scaling-stroke" />
            <path d={path(focus)} fill="none" stroke="#28D0C0" strokeWidth="1.7" vectorEffect="non-scaling-stroke" />
            <path d={path(energy)} fill="none" stroke="#EF4444" strokeWidth="1.7" vectorEffect="non-scaling-stroke" />
          </>
        )}
        {days.map((d, i) => {
          const x = pad.l + (i / Math.max(1, days.length - 1)) * iw;
          return (
            <g key={d.dateStr}>
              <rect
                x={x - iw / (days.length * 2)}
                y={0}
                width={iw / days.length}
                height={H}
                fill="transparent"
                style={{ cursor: "pointer" }}
                onClick={() => onPick(d.dateStr)}
              />
              {hasData && (
                <>
                  <circle cx={x} cy={motivation[i][1]} r="2.2" fill="#A78BFA" />
                  <circle cx={x} cy={focus[i][1]} r="2.2" fill="#28D0C0" />
                  <circle cx={x} cy={energy[i][1]} r="2.2" fill="#EF4444" />
                </>
              )}
              <text
                x={x}
                y={H - 6}
                textAnchor="middle"
                fontSize="9.5"
                fill="#5A626B"
                style={{ fontFamily: "Inter, sans-serif", pointerEvents: "none" }}
              >
                {d.short}
              </text>
            </g>
          );
        })}
      </svg>
      {!hasData && (
        <div className="-mt-[100px] flex h-[100px] items-center justify-center">
          <button
            onClick={() => onPick(days[0]?.dateStr ?? "")}
            className="rounded-full border border-[#2A2A2A] bg-[#171717] px-[13px] py-[7px] text-[10.5px] font-semibold text-[#737B84] transition-colors hover:text-[#F3F3F3]"
          >
            Log mindset to see your week
          </button>
        </div>
      )}
    </>
  );
}

/* ------------------------------- Day card ------------------------------- */

type DayStat = {
  date: Date;
  dateStr: string;
  name: string;
  short: string;
  tasks: { id: string; title: string; completed: boolean }[];
  done: number;
  total: number;
  pct: number;
};

function DayCard({
  day,
  mindset,
  isToday,
  onToggle,
  onAdd,
  onRename,
  onDelete,
  onCopyYesterday,
  onEditMindset,
}: {
  day: DayStat;
  mindset?: MindsetEntry;
  isToday: boolean;
  onToggle: (id: string) => void;
  onAdd: (title: string) => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onCopyYesterday: () => void;
  onEditMindset: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const dateLabel = `${String(day.date.getDate()).padStart(2, "0")}/${String(
    day.date.getMonth() + 1
  ).padStart(2, "0")}/${day.date.getFullYear()}`;

  const submit = () => {
    const t = title.trim();
    if (t) {
      onAdd(t);
      setTitle("");
      setAdding(false);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col rounded-[16px] border px-[13px] pb-[13px] pt-[15px] transition-colors",
        isToday
          ? "border-[#28D0C0]/45 bg-[#0E1615]"
          : "border-[#1E1E1E] bg-[#141414]"
      )}
    >
      <div className="text-center text-[13.5px] font-bold text-[#F3F3F3]">{day.name}</div>
      <div className="mt-[3px] text-center text-[9.5px] text-[#5A626B] font-num">
        {dateLabel}
      </div>

      <div className="mt-[13px] flex justify-center">
        <ProgressRing value={day.pct} size={74} stroke={6}>
          <div className="text-[12.5px] font-bold text-[#F3F3F3] font-num">{day.pct}%</div>
        </ProgressRing>
      </div>

      <div className="mt-[15px] text-center text-[9px] font-semibold uppercase tracking-[0.2em] text-[#5A626B]">
        Tasks
      </div>

      <div className="mt-[9px] flex flex-1 flex-col gap-[6px]">
        {day.tasks.length === 0 && !adding && (
          <div className="rounded-[10px] border border-dashed border-[#2A2A2A] px-[10px] py-[9px] text-[10.5px] text-[#454B52]">
            No tasks yet
          </div>
        )}

        {day.tasks.map((t) =>
          editId === t.id ? (
            <div key={t.id} className="flex items-center gap-[5px]">
              <input
                value={editTitle}
                autoFocus
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && editTitle.trim()) {
                    onRename(t.id, editTitle.trim());
                    setEditId(null);
                  }
                  if (e.key === "Escape") setEditId(null);
                }}
                className="min-w-0 flex-1 rounded-[9px] border border-[#28D0C0]/40 bg-[#0F0F0F] px-[9px] py-[8px] text-[10.5px] text-[#F3F3F3] outline-none"
              />
              <button
                onClick={() => {
                  if (editTitle.trim()) onRename(t.id, editTitle.trim());
                  setEditId(null);
                }}
                className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-[8px] bg-[#28D0C0]"
              >
                <CheckIcon size={12} color="#0A0A0A" />
              </button>
            </div>
          ) : (
            <div
              key={t.id}
              className="group flex items-start gap-[8px] rounded-[10px] bg-[#171717] px-[10px] py-[9px]"
            >
              <button
                onClick={() => onToggle(t.id)}
                aria-label={t.completed ? "Mark incomplete" : "Mark complete"}
                className={cn(
                  "mt-[1px] flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-[5px] border transition-colors",
                  t.completed ? "border-[#28D0C0] bg-[#28D0C0]" : "border-[#3A3A3A] bg-[#101010]"
                )}
              >
                {t.completed && <CheckIcon size={9} color="#0A0A0A" />}
              </button>
              <button
                onClick={() => onToggle(t.id)}
                className={cn(
                  "min-w-0 flex-1 text-left text-[10.5px] leading-[1.35]",
                  t.completed ? "text-[#5A626B] line-through" : "text-[#E7EAED]"
                )}
              >
                {t.title}
              </button>
              <span className="flex shrink-0 items-center gap-[3px] opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => {
                    setEditId(t.id);
                    setEditTitle(t.title);
                  }}
                  aria-label="Edit task"
                  className="text-[#5A626B] hover:text-[#28D0C0]"
                >
                  <PencilIcon size={10} />
                </button>
                <button
                  onClick={() => onDelete(t.id)}
                  aria-label="Delete task"
                  className="text-[#5A626B] hover:text-[#EF4444]"
                >
                  <TrashIcon size={10} />
                </button>
              </span>
            </div>
          )
        )}

        {adding ? (
          <div className="flex items-center gap-[5px]">
            <input
              value={title}
              autoFocus
              placeholder="Task name"
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
                if (e.key === "Escape") setAdding(false);
              }}
              className="min-w-0 flex-1 rounded-[9px] border border-[#28D0C0]/40 bg-[#0F0F0F] px-[9px] py-[8px] text-[10.5px] text-[#F3F3F3] outline-none placeholder-[#454B52]"
            />
            <button
              onClick={submit}
              className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-[8px] bg-[#28D0C0]"
            >
              <CheckIcon size={12} color="#0A0A0A" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="rounded-[10px] border border-dashed border-[#2A2A2A] px-[10px] py-[9px] text-left text-[10.5px] text-[#5A626B] transition-colors hover:border-[#3A3A3A] hover:text-[#9AA2AA]"
          >
            + Add task
          </button>
        )}

        <button
          onClick={onCopyYesterday}
          className="mt-[2px] flex items-center justify-center gap-[5px] py-[3px] text-[10px] text-[#5A626B] transition-colors hover:text-[#28D0C0]"
        >
          <CopyIcon size={10} />
          Copy yesterday's list
        </button>
      </div>

      {/* Mindset footer */}
      <button
        onClick={onEditMindset}
        className="mt-[13px] flex items-center justify-between border-t border-[#1E1E1E] pt-[11px] text-left"
      >
        <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#5A626B]">
          Mindset
        </span>
        <span className="text-[12px] leading-none text-[#5A626B] hover:text-[#28D0C0]">
          <PlusIcon size={11} />
        </span>
      </button>

      <div className="mt-[9px] space-y-[6px]">
        <MiniBar label="Energy" value={mindset?.energy} color="#EF4444" />
        <MiniBar label="Focus" value={mindset?.focus} color="#28D0C0" />
        <MiniBar label="Motivation" value={mindset?.motivation} color="#A78BFA" />
      </div>

      <div className="mt-[11px] space-y-[5px] border-t border-[#1E1E1E] pt-[11px]">
        <Row label="Completed" value={day.done} />
        <Row label="Not completed" value={day.total - day.done} />
      </div>
    </div>
  );
}

function MiniBar({
  label,
  value,
  color,
}: {
  label: string;
  value?: number;
  color: string;
}) {
  const v = value ?? 0;
  return (
    <div className="flex items-center gap-[7px]">
      <span className="w-[52px] shrink-0 text-[9px] text-[#5A626B]">{label}</span>
      <div className="h-[3px] min-w-0 flex-1 rounded-full bg-[#1E1E1E]">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${(v / 10) * 100}%`, background: color }}
        />
      </div>
      <span className="w-[12px] shrink-0 text-right text-[9.5px] text-[#9AA2AA] font-num">
        {value === undefined || value === 0 ? "—" : value}
      </span>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[9.5px] text-[#5A626B]">{label}</span>
      <span className="text-[10px] font-bold text-[#28D0C0] font-num">{value}</span>
    </div>
  );
}

/* ---------------------------- Mindset modal ---------------------------- */

function MindsetModal({
  dateStr,
  initial,
  onClose,
  onSave,
}: {
  dateStr: string;
  initial?: MindsetEntry;
  onClose: () => void;
  onSave: (v: { energy: number; focus: number; motivation: number }) => void;
}) {
  const [energy, setEnergy] = useState(initial?.energy ?? 5);
  const [focus, setFocus] = useState(initial?.focus ?? 5);
  const [motivation, setMotivation] = useState(initial?.motivation ?? 5);
  const d = parseYmd(dateStr);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" onClick={onClose}>
      <div
        className="fade-in w-full max-w-[400px] rounded-[18px] border border-[#232323] bg-[#141414] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between">
          <div>
            <div className="eyebrow">Mindset</div>
            <h3 className="mt-[6px] text-[18px] font-bold text-[#F3F3F3]">
              {dayFull(d.getDay())}, {d.getDate()} {monthName(d.getMonth())}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="flex h-[32px] w-[32px] items-center justify-center rounded-full border border-[#232323] text-[#737B84] hover:text-[#F3F3F3]"
          >
            <XIcon size={15} />
          </button>
        </div>

        <div className="space-y-[22px]">
          <Slider label="Energy" color="#EF4444" value={energy} onChange={setEnergy} />
          <Slider label="Focus" color="#28D0C0" value={focus} onChange={setFocus} />
          <Slider label="Motivation" color="#A78BFA" value={motivation} onChange={setMotivation} />
        </div>

        <button
          onClick={() => onSave({ energy, focus, motivation })}
          className="mt-7 w-full rounded-full bg-[#28D0C0] py-[12px] text-[12.5px] font-bold text-[#0A0A0A]"
        >
          {initial ? "Update Mindset" : "Save Mindset"}
        </button>
      </div>
    </div>
  );
}

function Slider({
  label,
  color,
  value,
  onChange,
}: {
  label: string;
  color: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-[9px] flex items-center justify-between">
        <span className="eyebrow">{label}</span>
        <span className="text-[13px] font-bold font-num" style={{ color }}>
          {value}/10
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={10}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-[5px] w-full cursor-pointer rounded-full"
        style={{
          background: `linear-gradient(90deg, ${color} 0%, ${color} ${value * 10}%, #232323 ${value * 10}%, #232323 100%)`,
        }}
      />
    </div>
  );
}
