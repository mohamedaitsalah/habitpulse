import {
  TodayIcon,
  HabitsIcon,
  TasksIcon,
  GoalsIcon,
  InsightsIcon,
  SettingsIcon,
} from "./icons";
import { useAuth } from "../lib/auth";
import { cn } from "../utils/cn";

export type TabKey = "today" | "habits" | "tasks" | "goals" | "insights";

interface TopNavProps {
  active: TabKey;
  onChange: (k: TabKey) => void;
  onSettings: () => void;
}

const tabs: { key: TabKey; label: string; Icon: typeof TodayIcon }[] = [
  { key: "today", label: "Today", Icon: TodayIcon },
  { key: "habits", label: "Habits", Icon: HabitsIcon },
  { key: "tasks", label: "Tasks", Icon: TasksIcon },
  { key: "goals", label: "Goals", Icon: GoalsIcon },
  { key: "insights", label: "Insights", Icon: InsightsIcon },
];

export function TopNav({ active, onChange, onSettings }: TopNavProps) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 w-full bg-[#0A0A0A]/90 backdrop-blur-xl">
      <div className="mx-auto w-full max-w-[1600px] px-4 py-3 md:flex md:items-center md:justify-between md:gap-4 md:px-9 md:py-4">
        <div className="flex items-center justify-between md:w-[220px]">
          <h1 className="truncate text-[15px] font-extrabold uppercase tracking-[0.06em] text-[#F3F3F3]">
            {tabs.find((t) => t.key === active)?.label === "Tasks"
              ? "Task Tracker"
              : tabs.find((t) => t.key === active)?.label}
          </h1>

          <button
            onClick={onSettings}
            aria-label="Settings"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#5A626B] transition-colors hover:text-[#8B939C] md:hidden"
          >
            <SettingsIcon size={18} />
          </button>
        </div>

        <nav className="mt-2 w-full overflow-x-auto pb-1 md:mt-0 md:flex md:flex-1 md:justify-center md:overflow-visible md:px-2 md:pb-0">
          <div
            className="mx-auto flex w-max min-w-full items-center justify-between gap-0.5 rounded-full border border-[#1E1E1E] p-[5px] md:min-w-0"
            style={{ background: "#111111" }}
          >
            {tabs.map(({ key, label, Icon }) => {
              const isActive = active === key;
              const color = isActive ? "#28D0C0" : "#5A626B";

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onChange(key)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex min-w-0 flex-1 items-center justify-center gap-1 whitespace-nowrap rounded-full px-2 py-[9px] text-[11px] font-semibold transition-colors md:flex-none md:gap-[7px] md:px-[15px] md:text-[12.5px]",
                    isActive
                      ? "text-[#28D0C0]"
                      : "text-[#5A626B] hover:text-[#8B939C]"
                  )}
                >
                  <Icon size={15} color={color} />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        <div className="hidden w-[220px] items-center justify-end gap-3 md:flex">
          <span className="hidden max-w-[150px] truncate text-[11px] text-[#454B52] lg:block">
            {user?.display_name}
          </span>

          <button
            onClick={onSettings}
            aria-label="Settings"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#5A626B] transition-colors hover:text-[#8B939C]"
          >
            <SettingsIcon size={17} />
          </button>
        </div>
      </div>
    </header>
  );
}
