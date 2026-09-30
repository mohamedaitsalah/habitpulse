import { useMemo, useState } from "react";
import { ProgressRing } from "../components/ProgressRing";
import {
  CheckIcon,
  FreezeIcon,
  FIRE,
  PlusIcon,
} from "../components/icons";
import { cn } from "../utils/cn";
import {
  useStore,
  computeStreak,
  habitScheduledOn,
  ymd,
  dayFull,
  monthName,
  startOfMonth,
  parseYmd,
  type Habit,
} from "../lib/store";
import { NewHabitModal } from "../components/NewHabitModal";

export function TodayScreen() {
  const store = useStore();
  const [showNew, setShowNew] = useState(false);
  const today = useMemo(() => new Date(), []);
  const todayStr = ymd(today);

  const scheduled = useMemo(
    () => store.habits.filter((h) => !h.archived && habitScheduledOn(h, today)),
    [store.habits, today]
  );

  const doneIds = useMemo(
    () =>
      new Set(
        store.completions
          .filter((c) => c.completion_date === todayStr)
          .map((c) => c.habit_id)
      ),
    [store.completions, todayStr]
  );

  const total = scheduled.length;
  const done = scheduled.filter((h) => doneIds.has(h.id)).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  // Freeze tokens: 9 per month, one consumed per missed scheduled occurrence
  const freezeTokens = useMemo(() => {
    const monthStart = startOfMonth(today);
    let missed = 0;
    for (let d = new Date(monthStart); d < today; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
      for (const h of store.habits) {
        if (h.archived || !habitScheduledOn(h, d)) continue;
        const ds = ymd(d);
        if (!store.completions.some((c) => c.habit_id === h.id && c.completion_date === ds)) missed++;
      }
    }
    return Math.max(0, 9 - missed);
  }, [store.habits, store.completions, today]);

  const leftCol = scheduled.slice(0, Math.ceil(scheduled.length / 2));
  const rightCol = scheduled.slice(Math.ceil(scheduled.length / 2));

  return (
    <div className="pb-6">
      {/* Ring block */}
      <div className="flex flex-col items-center pt-6 pb-9">
        <ProgressRing value={pct} size={182} stroke={12}>
          <div className="text-[40px] font-bold tracking-[-0.02em] text-[#F3F3F3] font-num">
            {pct}%
          </div>
          <div className="mt-[7px] text-[9.5px] font-semibold uppercase tracking-[0.16em] text-[#5A626B]">
            Today
          </div>
        </ProgressRing>

        <div className="mt-7 text-[13.5px] font-bold uppercase tracking-[0.05em] text-[#F3F3F3]">
          {dayFull(today.getDay())} {today.getDate()} {monthName(today.getMonth())}
        </div>
        <div className="mt-[7px] text-[12px] text-[#737B84] font-num">
          {done} / {total} habits completed
        </div>

        <div
          className="mt-[22px] inline-flex items-center gap-[7px] rounded-full border px-[15px] py-[8px]"
          style={{
            background: "rgba(40,208,192,0.07)",
            borderColor: "rgba(40,208,192,0.18)",
          }}
        >
          <FreezeIcon size={13} color="#28D0C0" />
          <span className="text-[10.5px] font-bold uppercase tracking-[0.11em] text-[#28D0C0] font-num">
            {freezeTokens} freeze tokens available
          </span>
        </div>
      </div>

      {/* Habit grid */}
      {total === 0 ? (
        <EmptyToday onAdd={() => setShowNew(true)} />
      ) : (
        <div className="mx-auto grid max-w-[1180px] grid-cols-1 gap-x-[14px] gap-y-[12px] md:grid-cols-2">
          <div className="flex flex-col gap-[12px]">
            {leftCol.map((h) => (
              <TodayHabitRow
                key={h.id}
                habit={h}
                done={doneIds.has(h.id)}
                streak={computeStreak(h, store.completions, today)}
                onToggle={() => store.toggleHabitCompletion(h.id, todayStr)}
              />
            ))}
          </div>
          <div className="flex flex-col gap-[12px]">
            {rightCol.map((h) => (
              <TodayHabitRow
                key={h.id}
                habit={h}
                done={doneIds.has(h.id)}
                streak={computeStreak(h, store.completions, today)}
                onToggle={() => store.toggleHabitCompletion(h.id, todayStr)}
              />
            ))}
          </div>
        </div>
      )}

      {showNew && <NewHabitModal onClose={() => setShowNew(false)} />}
    </div>
  );
}

function TodayHabitRow({
  habit,
  done,
  streak,
  onToggle,
}: {
  habit: Habit;
  done: boolean;
  streak: number;
  onToggle: () => void;
}) {
  return (
    <div
      className={cn(
        "flex h-[66px] items-center gap-[15px] rounded-[18px] border px-[17px] transition-colors",
        done
          ? "border-[#1E2624] bg-[#0F1514]"
          : "border-[#1E1E1E] bg-[#131313] hover:border-[#2A2A2A]"
      )}
    >
      <button
        onClick={onToggle}
        aria-label={done ? `Mark ${habit.name} incomplete` : `Mark ${habit.name} complete`}
        className={cn(
          "flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[11px] border transition-colors",
          done ? "border-[#28D0C0]" : "border-[#2A2A2A] bg-[#191919] hover:border-[#3A3A3A]"
        )}
        style={done ? { background: "#28D0C0" } : undefined}
      >
        {done && <CheckIcon size={17} color="#0A0A0A" />}
      </button>

      <span
        className="h-[7px] w-[7px] shrink-0 rounded-full"
        style={{ backgroundColor: habit.color }}
      />

      <button
        onClick={onToggle}
        className={cn(
          "min-w-0 flex-1 truncate text-left text-[13px] font-medium",
          done ? "text-[#6E7680] line-through" : "text-[#F3F3F3]"
        )}
      >
        {habit.name}
      </button>

      <div className="flex shrink-0 items-center gap-[10px]">
        {streak === 0 && !done && <FreezeIcon size={15} color="#3B82F6" />}
        <span className="flex items-center gap-[4px] text-[12.5px] font-semibold text-[#F3F3F3] font-num">
          <span className="text-[12px]">{FIRE}</span>
          {streak}
        </span>
      </div>
    </div>
  );
}

function EmptyToday({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="mx-auto max-w-[1180px]">
      <div className="flex flex-col items-center rounded-[18px] border border-dashed border-[#232323] bg-[#111111] px-6 py-14 text-center">
        <div className="mb-4 text-[26px]">{FIRE}</div>
        <h3 className="text-[16px] font-semibold text-[#F3F3F3]">
          No habits scheduled today
        </h3>
        <p className="mt-2 max-w-sm text-[12.5px] leading-relaxed text-[#737B84]">
          Create a habit and it will show up here whenever it is scheduled.
        </p>
        <button
          onClick={onAdd}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#28D0C0] px-[18px] py-[10px] text-[12.5px] font-bold text-[#0A0A0A]"
        >
          <PlusIcon size={13} color="#0A0A0A" />
          New Habit
        </button>
      </div>
    </div>
  );
}

export { parseYmd };