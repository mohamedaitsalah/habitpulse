import { useEffect, useState } from "react";
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

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
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
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  const installApp = async () => {
    if (installPrompt) {
      await installPrompt.prompt();
      await installPrompt.userChoice;
      setInstallPrompt(null);
      return;
    }

    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent);

    if (isIOS) {
      alert(
        'To install HabitPulse: tap the Share button in Safari, then choose "Add to Home Screen".'
      );
    } else {
      alert(
        'Open your browser menu and choose "Install app" or "Add to Home screen".'
      );
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-[#0A0A0A]/90 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4 px-5 py-4 md:px-9">
        <div className="flex w-[220px] min-w-0 items-center">
          <h1 className="truncate text-[15px] font-extrabold uppercase tracking-[0.06em] text-[#F3F3F3]">
            {tabs.find((t) => t.key === active)?.label === "Tasks"
              ? "Task Tracker"
              : tabs.find((t) => t.key === active)?.label}
          </h1>
        </div>

        <nav className="flex flex-1 justify-center px-2 min-w-0">
          <div
            className="flex items-center gap-0.5 rounded-full border border-[#1E1E1E] p-[5px]"
            style={{ background: "#111111" }}
          >
            {tabs.map(({ key, label, Icon }) => {
              const isActive = active === key;
              const color = isActive ? "#28D0C0" : "#5A626B";

              return (
                <button
                  key={key}
                  onClick={() => onChange(key)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-[7px] whitespace-nowrap rounded-full px-3 py-[9px] text-[12.5px] font-semibold transition-colors md:px-[15px]",
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

        <div className="flex w-[220px] items-center justify-end gap-3">
          <button
            onClick={installApp}
            className="whitespace-nowrap rounded-full border border-[#28D0C0]/30 px-3 py-2 text-[11px] font-semibold text-[#28D0C0] transition-colors hover:bg-[#28D0C0]/10"
          >
            ↓ Install
          </button>

          <span className="hidden max-w-[120px] truncate text-[11px] text-[#454B52] lg:block">
            {user?.display_name}
          </span>

          <button
            onClick={onSettings}
            aria-label="Settings"
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#5A626B] transition-colors hover:text-[#8B939C]"
          >
            <SettingsIcon size={17} />
          </button>
        </div>
      </div>
    </header>
  );
}
