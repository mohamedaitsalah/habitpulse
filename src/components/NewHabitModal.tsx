import { useState } from "react";
import { useStore, ymd } from "../lib/store";
import { PlusIcon, XIcon, CheckIcon, TrashIcon } from "./icons";
import { cn } from "../utils/cn";

interface NewHabitModalProps {
  onClose: () => void;
  editId?: string;
}

const COLORS = ["#A78BFA", "#EF4444", "#22C55E", "#3B82F6", "#F59E0B", "#EC4899", "#28D0C0"];

const CATEGORIES = [
  "Health",
  "Fitness",
  "Mindfulness",
  "Productivity",
  "Learning",
  "Wellness",
  "Other",
];

const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

export function NewHabitModal({ onClose, editId }: NewHabitModalProps) {
  const store = useStore();
  const editing = editId ? store.habits.find((h) => h.id === editId) : undefined;

  const [name, setName] = useState(editing?.name ?? "");
  const [color, setColor] = useState(editing?.color ?? COLORS[6]);
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly">(
    editing?.frequency_type ?? "daily"
  );
  const [selectedDays, setSelectedDays] = useState<number[]>(
    editing?.selected_days?.length ? editing.selected_days : [1, 2, 3, 4, 5]
  );
  const [startDate, setStartDate] = useState(editing?.start_date ?? ymd(new Date()));
  const [endDate, setEndDate] = useState(editing?.end_date ?? "");
  const [category, setCategory] = useState(editing?.category ?? "Health");
  const [busy, setBusy] = useState(false);

  const toggleDay = (d: number) =>
    setSelectedDays((p) => (p.includes(d) ? p.filter((x) => x !== d) : [...p, d].sort()));

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    try {
      const payload = {
        name: trimmed,
        color,
        frequency_type: frequency,
        selected_days: frequency === "weekly" ? selectedDays : [],
        start_date: startDate,
        end_date: endDate || null,
        category,
        archived: false,
      };
      if (editing) await store.updateHabit(editing.id, payload);
      else await store.createHabit(payload);
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
            <div className="eyebrow">{editing ? "Manage habit" : "New habit"}</div>
            <h3 className="mt-[6px] text-[18px] font-bold text-[#F3F3F3]">
              {editing ? "Edit Habit" : "Create Habit"}
            </h3>
          </div>
          <button type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-[32px] w-[32px] cursor-pointer items-center justify-center rounded-full border border-[#232323] text-[#737B84] hover:text-[#F3F3F3] focus:outline-none"
          >
            <XIcon size={15} />
          </button>
        </div>

        <div className="space-y-[20px]">
          {/* Name */}
          <div>
            <label className="eyebrow mb-[9px] block">Habit name</label>
            <input
              value={name}
              autoFocus
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="e.g. Read 10 pages"
              className="w-full rounded-[11px] border border-[#232323] bg-[#0F0F0F] px-[14px] py-[12px] text-[13.5px] text-[#F3F3F3] outline-none transition-colors placeholder-[#454B52] focus:border-[#28D0C0]"
            />
          </div>

          {/* Colour */}
          <div>
            <label className="eyebrow mb-[9px] block">Colour</label>
            <div className="flex flex-wrap gap-[9px]">
              {COLORS.map((c) => (
                <button type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  aria-label={`Colour ${c}`}
                  className={cn(
                    "flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-full transition-all focus:outline-none focus-visible:ring-1 focus-visible:ring-[#28D0C0]",
                    color === c ? "ring-2 ring-[#F3F3F3]/70 ring-offset-2 ring-offset-[#141414]" : ""
                  )}
                  style={{ background: c }}
                >
                  {color === c && <CheckIcon size={13} color="#0A0A0A" />}
                </button>
              ))}
            </div>
          </div>

          {/* Frequency */}
          <div>
            <label className="eyebrow mb-[9px] block">Frequency</label>
            <div className="flex gap-0 overflow-hidden rounded-full bg-[#111111]">
              {(["daily", "weekly", "monthly"] as const).map((f) => (
                <button type="button"
                  key={f}
                  onClick={() => setFrequency(f)}
                  className={cn(
                    "flex-1 cursor-pointer py-[11px] text-[11px] font-bold uppercase tracking-[0.14em] transition-colors focus:outline-none",
                    frequency === f
                      ? "rounded-full bg-[#28D0C0] text-[#0A0A0A]"
                      : "text-[#5A626B] hover:text-[#8B939C]"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Weekly days */}
          {frequency === "weekly" && (
            <div>
              <label className="eyebrow mb-[9px] block">Repeat on</label>
              <div className="flex gap-[8px]">
                {DAY_LETTERS.map((l, i) => (
                  <button type="button"
                    key={i}
                    onClick={() => toggleDay(i)}
                    className={cn(
                      "h-[34px] flex-1 cursor-pointer rounded-[10px] text-[11.5px] font-bold transition-colors focus:outline-none",
                      selectedDays.includes(i)
                        ? "bg-[#28D0C0] text-[#0A0A0A]"
                        : "border border-[#232323] bg-[#111111] text-[#5A626B] hover:text-[#8B939C]"
                    )}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Dates */}
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
              <label className="eyebrow mb-[9px] block">End date (optional)</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-[11px] border border-[#232323] bg-[#0F0F0F] px-[12px] py-[11px] text-[12.5px] text-[#F3F3F3] outline-none focus:border-[#28D0C0]"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="eyebrow mb-[9px] block">Category (optional)</label>
            <div className="flex flex-wrap gap-[7px]">
              {CATEGORIES.map((c) => (
                <button type="button"
                  key={c}
                  onClick={() => setCategory(c)}
                  className={cn(
                    "cursor-pointer rounded-full px-[12px] py-[7px] text-[10.5px] font-semibold transition-colors focus:outline-none",
                    category === c
                      ? "bg-[rgba(40,208,192,0.11)] text-[#28D0C0]"
                      : "border border-[#232323] bg-[#111111] text-[#737B84] hover:text-[#F3F3F3]"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <button type="button"
            onClick={submit}
            disabled={!name.trim() || busy}
            className="mt-[4px] flex w-full cursor-pointer items-center justify-center gap-[7px] rounded-full bg-[#28D0C0] py-[12px] text-[12.5px] font-bold text-[#0A0A0A] disabled:opacity-45 focus:outline-none"
          >
            <PlusIcon size={13} color="#0A0A0A" />
            {editing ? "Save Changes" : "Create Habit"}
          </button>

          {editing && (
            <div className="flex gap-3">
              {editing.archived ? (
                <button type="button"
                  onClick={async () => {
                    await store.updateHabit(editing.id, { archived: false });
                    onClose();
                  }}
                  className="flex-1 cursor-pointer rounded-full border border-[#232323] py-[11px] text-[11.5px] font-semibold text-[#737B84] hover:text-[#F3F3F3] focus:outline-none"
                >
                  Restore
                </button>
              ) : (
                <button type="button"
                  onClick={async () => {
                    await store.updateHabit(editing.id, { archived: true });
                    onClose();
                  }}
                  className="flex-1 cursor-pointer rounded-full border border-[#232323] py-[11px] text-[11.5px] font-semibold text-[#737B84] hover:text-[#F3F3F3] focus:outline-none"
                >
                  Archive
                </button>
              )}
              <button type="button"
                onClick={async () => {
                  if (confirm("Delete this habit and all its history?")) {
                    await store.deleteHabit(editing.id);
                    onClose();
                  }
                }}
                className="flex flex-1 cursor-pointer items-center justify-center gap-[6px] rounded-full border border-[rgba(239,68,68,0.3)] py-[11px] text-[11.5px] font-semibold text-[#EF4444] hover:bg-[rgba(239,68,68,0.08)] focus:outline-none"
              >
                <TrashIcon size={12} color="#EF4444" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
