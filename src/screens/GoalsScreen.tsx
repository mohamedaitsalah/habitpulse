import { useState, useMemo } from "react";
import { ProgressRing } from "../components/ProgressRing";
import {
  PlusIcon,
  XIcon,
  PencilIcon,
  TrashIcon,
  PinIcon,
  CheckIcon,
  LIFE_AREA_EMOJI,
} from "../components/icons";
import { cn } from "../utils/cn";
import { useStore, ymd, parseYmd, type Goal } from "../lib/store";

export const LIFE_AREAS = [
  "Health & Fitness",
  "Career Growth",
  "Finances & Wealth",
  "Relationships",
  "Romance & Love",
  "Spirituality",
  "Home",
  "Adventure & Travel",
  "Fun & Hobbies",
  "Community",
];

const STATUSES = ["IN PROGRESS", "NOT STARTED", "COMPLETED", "PAUSED"];

export function GoalsScreen() {
  const store = useStore();
  const [areaFilter, setAreaFilter] = useState<string | null>(null);
  const [modal, setModal] = useState<{ open: boolean; editId?: string }>({ open: false });

  const goals = store.goals;
  const achieved = goals.filter((g) => g.progress >= 100).length;
  const ringVal = goals.length === 0 ? 0 : (achieved / goals.length) * 100;

  const areaStats = useMemo(() => {
    const m: Record<string, { goals: number; achieved: number }> = {};
    for (const a of LIFE_AREAS) m[a] = { goals: 0, achieved: 0 };
    for (const g of goals) {
      if (!m[g.life_area]) m[g.life_area] = { goals: 0, achieved: 0 };
      m[g.life_area].goals++;
      if (g.progress >= 100) m[g.life_area].achieved++;
    }
    return m;
  }, [goals]);

  const pinned = goals.filter((g) => g.pinned);
  const allGoals = useMemo(
    () =>
      areaFilter
        ? goals.filter((g) => g.life_area === areaFilter)
        : goals,
    [goals, areaFilter]
  );

  return (
    <div className="pb-8">
      {/* Summary card */}
      <div className="mb-7 flex items-center gap-[18px] rounded-[16px] border border-[#1E1E1E] bg-[#141414] px-[18px] py-[18px]">
        <ProgressRing value={ringVal} size={68} stroke={7}>
          <span className="text-[13px] font-bold text-[#F3F3F3] font-num">
            {achieved}/{goals.length}
          </span>
        </ProgressRing>
        <div>
          <div className="eyebrow">Goals achieved</div>
          <div className="mt-[5px] text-[13px] font-semibold text-[#F3F3F3]">
            Mastering 10 areas
          </div>
        </div>
        <button
          onClick={() => setModal({ open: true, editId: undefined })}
          className="ml-auto inline-flex shrink-0 items-center gap-[7px] rounded-full bg-[#28D0C0] px-[16px] py-[10px] text-[12px] font-bold text-[#0A0A0A]"
        >
          <PlusIcon size={12} color="#0A0A0A" />
          New Goal
        </button>
      </div>

      {/* Areas of life */}
      <div className="eyebrow mb-[11px] px-1">Areas of life</div>
      <div className="mb-8 grid grid-cols-1 gap-[10px] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {LIFE_AREAS.map((a) => {
          const s = areaStats[a];
          const active = areaFilter === a;
          return (
            <button
              key={a}
              onClick={() => setAreaFilter(active ? null : a)}
              className={cn(
                "rounded-[13px] border px-[14px] py-[13px] text-left transition-colors",
                active
                  ? "border-[#28D0C0]/45 bg-[#0E1615]"
                  : "border-[#232323] bg-[#141414] hover:border-[#333333]"
              )}
            >
              <div className="flex items-center gap-[9px]">
                <span className="text-[13px] leading-none">{LIFE_AREA_EMOJI[a]}</span>
                <span className="truncate text-[12.5px] font-semibold text-[#F3F3F3]">
                  {a}
                </span>
              </div>
              <div className="mt-[7px] text-[10.5px] text-[#737B84] font-num">
                {s.goals} goals · {s.achieved} achieved
              </div>
            </button>
          );
        })}
      </div>

      {/* Top priorities */}
      <div className="mb-[11px] flex items-center justify-between px-1">
        <span className="eyebrow">Top priorities</span>
        {areaFilter && (
          <button
            onClick={() => setAreaFilter(null)}
            className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#28D0C0]"
          >
            Clear filter: {areaFilter}
          </button>
        )}
      </div>

      {pinned.length === 0 ? (
        <div className="mb-8 flex flex-col items-center rounded-[16px] border border-dashed border-[#232323] bg-[#111111] px-6 py-12 text-center">
          <div className="mb-3 text-[#EC4899]">
            <PinIcon size={20} color="#EC4899" />
          </div>
          <h3 className="text-[15px] font-semibold text-[#F3F3F3]">No pinned goals yet</h3>
          <p className="mt-2 max-w-sm text-[12px] leading-relaxed text-[#737B84]">
            Pin a goal to feature it here as a top priority.
          </p>
        </div>
      ) : (
        <div className="mb-8 flex flex-col gap-[12px]">
          {pinned.map((g) => (
            <GoalCard
              key={g.id}
              goal={g}
              onEdit={() => setModal({ open: true, editId: g.id })}
              onDelete={() => {
                if (confirm("Delete this goal?")) store.deleteGoal(g.id);
              }}
              onPin={() => store.toggleGoalPin(g.id)}
              onProgress={(p) => store.updateGoal(g.id, { progress: p })}
            />
          ))}
        </div>
      )}

      {/* All goals */}
      <div className="mb-[11px] px-1">
        <span className="eyebrow">
          All goals{areaFilter ? ` — ${areaFilter}` : ""}
        </span>
      </div>

      {allGoals.length === 0 ? (
        <div className="flex flex-col items-center rounded-[16px] border border-dashed border-[#232323] bg-[#111111] px-6 py-12 text-center">
          <h3 className="text-[15px] font-semibold text-[#F3F3F3]">
            {areaFilter ? `No goals in ${areaFilter}` : "No goals yet"}
          </h3>
          <p className="mt-2 max-w-sm text-[12px] leading-relaxed text-[#737B84]">
            Set a goal in any area of life to start tracking progress.
          </p>
          <button
            onClick={() => setModal({ open: true })}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#28D0C0] px-[16px] py-[10px] text-[12px] font-bold text-[#0A0A0A]"
          >
            <PlusIcon size={12} color="#0A0A0A" />
            Create goal
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-[10px]">
          {allGoals.map((g) => (
            <GoalRowSmall
              key={g.id}
              goal={g}
              onEdit={() => setModal({ open: true, editId: g.id })}
              onDelete={() => {
                if (confirm("Delete this goal?")) store.deleteGoal(g.id);
              }}
              onPin={() => store.toggleGoalPin(g.id)}
            />
          ))}
        </div>
      )}

      {modal.open && (
        <GoalModal
          editId={modal.editId}
          onClose={() => setModal({ open: false })}
        />
      )}
    </div>
  );
}

/* --------------------------- Big priority card --------------------------- */

function GoalCard({
  goal,
  onEdit,
  onDelete,
  onPin,
  onProgress,
}: {
  goal: Goal;
  onEdit: () => void;
  onDelete: () => void;
  onPin: () => void;
  onProgress: (p: number) => void;
}) {
  const target = goal.target_date ? parseYmd(goal.target_date) : null;
  const daysLeft = target
    ? Math.max(0, Math.ceil((target.getTime() - Date.now()) / 86400000))
    : null;
  const complete = goal.progress >= 100;

  return (
    <div className="relative rounded-[16px] border border-[#1E1E1E] bg-[#131313] px-[20px] py-[18px]">
      <div className="flex items-start justify-between">
        <h4 className="pr-3 text-[16.5px] font-semibold text-[#F3F3F3]">{goal.title}</h4>
        <div className="flex shrink-0 items-center gap-[6px]">
          <button
            onClick={onEdit}
            aria-label="Edit goal"
            className="flex h-[28px] w-[28px] items-center justify-center rounded-full text-[#5A626B] hover:text-[#28D0C0]"
          >
            <PencilIcon size={12} />
          </button>
          <button
            onClick={onDelete}
            aria-label="Delete goal"
            className="flex h-[28px] w-[28px] items-center justify-center rounded-full text-[#5A626B] hover:text-[#EF4444]"
          >
            <TrashIcon size={12} />
          </button>
          <button
            onClick={onPin}
            aria-label={goal.pinned ? "Unpin goal" : "Pin goal"}
            className="ml-1 text-[#EC4899] transition-opacity hover:opacity-70"
          >
            <PinIcon size={16} color="#EC4899" />
          </button>
        </div>
      </div>

      <span
        className={cn(
          "mt-[11px] inline-block rounded-[6px] px-[10px] py-[5px] text-[9.5px] font-bold uppercase tracking-[0.1em]",
          complete ? "bg-[rgba(34,197,94,0.11)] text-[#22C55E]" : "bg-[rgba(40,208,192,0.11)] text-[#28D0C0]"
        )}
      >
        {complete ? "COMPLETED" : goal.status}
      </span>

      <div className="mt-[11px] text-[9.5px] font-semibold uppercase tracking-[0.14em] text-[#5A626B]">
        {goal.life_area}
      </div>
      {daysLeft !== null && (
        <div className="mt-[6px] text-[11px] text-[#737B84] font-num">
          {complete ? "Goal reached" : `${daysLeft} days left`}
        </div>
      )}

      <div className="mt-[15px] h-[5px] w-full rounded-full bg-[#232323]">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            complete ? "bg-[#22C55E]" : "bg-[#28D0C0]"
          )}
          style={{ width: `${goal.progress}%` }}
        />
      </div>

      <div className="mt-[10px] flex items-center gap-3">
        <input
          type="range"
          min={0}
          max={100}
          value={goal.progress}
          onChange={(e) => onProgress(Number(e.target.value))}
          className="h-[4px] w-[150px] cursor-pointer rounded-full"
          style={{
            background: `linear-gradient(90deg, #28D0C0 0%, #28D0C0 ${goal.progress}%, #232323 ${goal.progress}%, #232323 100%)`,
          }}
        />
        <span
          className={cn(
            "text-[11px] font-bold font-num",
            complete ? "text-[#22C55E]" : "text-[#28D0C0]"
          )}
        >
          {goal.progress}%
        </span>
        {!complete && (
          <button
            onClick={() => onProgress(100)}
            className="ml-auto inline-flex items-center gap-[5px] rounded-full border border-[#232323] px-[11px] py-[6px] text-[10px] font-semibold text-[#737B84] transition-colors hover:border-[#28D0C0]/40 hover:text-[#28D0C0]"
          >
            <CheckIcon size={10} color="#737B84" />
            Mark complete
          </button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------ Small row ------------------------------ */

function GoalRowSmall({
  goal,
  onEdit,
  onDelete,
  onPin,
}: {
  goal: Goal;
  onEdit: () => void;
  onDelete: () => void;
  onPin: () => void;
}) {
  return (
    <div className="group flex items-center gap-[13px] rounded-[13px] border border-[#1E1E1E] bg-[#141414] px-[16px] py-[13px]">
      <span className="text-[13px] leading-none">{LIFE_AREA_EMOJI[goal.life_area] ?? "🎯"}</span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[12.5px] font-semibold text-[#F3F3F3]">
          {goal.title}
        </div>
        <div className="mt-[3px] truncate text-[10px] uppercase tracking-[0.1em] text-[#5A626B]">
          {goal.life_area} · {goal.status}
        </div>
      </div>
      <div className="hidden h-[4px] w-[120px] shrink-0 rounded-full bg-[#232323] sm:block">
        <div
          className={cn(
            "h-full rounded-full",
            goal.progress >= 100 ? "bg-[#22C55E]" : "bg-[#28D0C0]"
          )}
          style={{ width: `${goal.progress}%` }}
        />
      </div>
      <span
        className={cn(
          "w-[38px] shrink-0 text-right text-[11.5px] font-bold font-num",
          goal.progress >= 100 ? "text-[#22C55E]" : "text-[#F3F3F3]"
        )}
      >
        {goal.progress}%
      </span>
      <div className="flex shrink-0 items-center gap-[4px]">
        <button
          onClick={onPin}
          aria-label="Toggle pin"
          className={cn(
            "flex h-[26px] w-[26px] items-center justify-center rounded-full transition-colors",
            goal.pinned ? "text-[#EC4899]" : "text-[#3F464D] hover:text-[#8B939C]"
          )}
        >
          <PinIcon size={13} color={goal.pinned ? "#EC4899" : "currentColor"} />
        </button>
        <button
          onClick={onEdit}
          aria-label="Edit goal"
          className="flex h-[26px] w-[26px] items-center justify-center rounded-full text-[#5A626B] hover:text-[#28D0C0]"
        >
          <PencilIcon size={11} />
        </button>
        <button
          onClick={onDelete}
          aria-label="Delete goal"
          className="flex h-[26px] w-[26px] items-center justify-center rounded-full text-[#5A626B] opacity-0 transition-opacity hover:text-[#EF4444] group-hover:opacity-100"
        >
          <TrashIcon size={11} />
        </button>
      </div>
    </div>
  );
}

/* -------------------------------- Modal -------------------------------- */

function GoalModal({ editId, onClose }: { editId?: string; onClose: () => void }) {
  const store = useStore();
  const editing = editId ? store.goals.find((g) => g.id === editId) : undefined;

  const [title, setTitle] = useState(editing?.title ?? "");
  const [area, setArea] = useState(editing?.life_area ?? LIFE_AREAS[0]);
  const [status, setStatus] = useState(editing?.status ?? "IN PROGRESS");
  const [progress, setProgress] = useState(editing?.progress ?? 0);
  const [startDate, setStartDate] = useState(editing?.start_date ?? ymd(new Date()));
  const [targetDate, setTargetDate] = useState(editing?.target_date ?? "");
  const [pinned, setPinned] = useState(editing?.pinned ?? true);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const t = title.trim();
    if (!t || busy) return;
    setBusy(true);
    try {
      const payload = {
        title: t,
        life_area: area,
        status: progress >= 100 ? "COMPLETED" : status,
        progress,
        start_date: startDate,
        target_date: targetDate || null,
        pinned,
      };
      if (editing) await store.updateGoal(editing.id, payload);
      else await store.createGoal(payload);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" onClick={onClose}>
      <div
        className="fade-in max-h-[90vh] w-full max-w-[460px] overflow-y-auto rounded-[18px] border border-[#232323] bg-[#141414] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between">
          <div>
            <div className="eyebrow">{editing ? "Manage goal" : "New goal"}</div>
            <h3 className="mt-[6px] text-[18px] font-bold text-[#F3F3F3]">
              {editing ? "Edit Goal" : "Create Goal"}
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-[32px] w-[32px] items-center justify-center rounded-full border border-[#232323] text-[#737B84] hover:text-[#F3F3F3]"
          >
            <XIcon size={15} />
          </button>
        </div>

        <div className="space-y-[20px]">
          <div>
            <label className="eyebrow mb-[9px] block">Goal title</label>
            <input
              value={title}
              autoFocus
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="e.g. Run a 5K"
              className="w-full rounded-[11px] border border-[#232323] bg-[#0F0F0F] px-[14px] py-[12px] text-[13.5px] text-[#F3F3F3] outline-none placeholder-[#454B52] focus:border-[#28D0C0]"
            />
          </div>

          <div>
            <label className="eyebrow mb-[9px] block">Area of life</label>
            <select
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="w-full rounded-[11px] border border-[#232323] bg-[#0F0F0F] px-[13px] py-[12px] text-[13px] text-[#F3F3F3] outline-none focus:border-[#28D0C0]"
            >
              {LIFE_AREAS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="eyebrow mb-[9px] block">Status</label>
            <div className="flex flex-wrap gap-[7px]">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={cn(
                    "rounded-full px-[12px] py-[7px] text-[10px] font-bold uppercase tracking-[0.08em] transition-colors",
                    status === s
                      ? "bg-[rgba(40,208,192,0.11)] text-[#28D0C0]"
                      : "border border-[#232323] bg-[#111111] text-[#737B84] hover:text-[#F3F3F3]"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-[9px] flex items-center justify-between">
              <span className="eyebrow">Progress</span>
              <span className="text-[13px] font-bold text-[#28D0C0] font-num">{progress}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              className="h-[5px] w-full cursor-pointer rounded-full"
              style={{
                background: `linear-gradient(90deg, #28D0C0 0%, #28D0C0 ${progress}%, #232323 ${progress}%, #232323 100%)`,
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="eyebrow mb-[9px] block">Start date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-[11px] border border-[#232323] bg-[#0F0F0F] px-[12px] py-[11px] text-[12.5px] text-[#F3F3F3] outline-none focus:border-[#28D0C0]"
              />
            </div>
            <div>
              <label className="eyebrow mb-[9px] block">Target date</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full rounded-[11px] border border-[#232323] bg-[#0F0F0F] px-[12px] py-[11px] text-[12.5px] text-[#F3F3F3] outline-none focus:border-[#28D0C0]"
              />
            </div>
          </div>

          <button
            onClick={() => setPinned((p) => !p)}
            className={cn(
              "flex w-full items-center justify-center gap-[8px] rounded-full border py-[11px] text-[11.5px] font-semibold transition-colors",
              pinned
                ? "border-[rgba(236,72,153,0.35)] bg-[rgba(236,72,153,0.09)] text-[#EC4899]"
                : "border-[#232323] text-[#737B84] hover:text-[#F3F3F3]"
            )}
          >
            <PinIcon size={13} color={pinned ? "#EC4899" : "currentColor"} />
            {pinned ? "Pinned to Top Priorities" : "Pin to Top Priorities"}
          </button>

          <button
            onClick={submit}
            disabled={!title.trim() || busy}
            className="flex w-full items-center justify-center gap-[7px] rounded-full bg-[#28D0C0] py-[12px] text-[12.5px] font-bold text-[#0A0A0A] disabled:opacity-45"
          >
            <CheckIcon size={13} color="#0A0A0A" />
            {editing ? "Save Changes" : "Create Goal"}
          </button>

          {editing && (
            <button
              onClick={async () => {
                if (confirm("Delete this goal?")) {
                  await store.deleteGoal(editing.id);
                  onClose();
                }
              }}
              className="flex w-full items-center justify-center gap-[6px] rounded-full border border-[rgba(239,68,68,0.3)] py-[11px] text-[11.5px] font-semibold text-[#EF4444] hover:bg-[rgba(239,68,68,0.08)]"
            >
              <TrashIcon size={12} color="#EF4444" />
              Delete Goal
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
