import { useEffect, useState } from "react";
import { TopNav, type TabKey } from "./components/TopNav";
import { TodayScreen } from "./screens/TodayScreen";
import { HabitsScreen } from "./screens/HabitsScreen";
import { TasksScreen } from "./screens/TasksScreen";
import { GoalsScreen } from "./screens/GoalsScreen";
import { InsightsScreen } from "./screens/InsightsScreen";
import { SettingsModal } from "./components/SettingsModal";
import { AuthProvider, useAuth } from "./lib/auth";
import { StoreProvider } from "./lib/store";
import { AuthScreen } from "./screens/AuthScreen";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export default function App() {
  return (
    <AuthProvider>
      <StoreProvider><AppShell /></StoreProvider>
    </AuthProvider>
  );
}

function AppShell() {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<TabKey>("today");
  const [settings, setSettings] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    setInstalled(standalone);

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const installApp = async () => {
    if (installPrompt) {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === "accepted") setInstallPrompt(null);
      return;
    }
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
      alert('Open HabitPulse in Safari, tap Share, then tap "Add to Home Screen".');
    } else {
      alert('Use your browser menu and choose "Install app" or "Add to Home screen".');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]"><div className="h-10 w-10 rounded-full border-2 border-t-[#27E7DB] animate-spin" /></div>;

  if (!user) return <AuthScreen installApp={installApp} showInstall={!installed} />;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F7FA]">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-96 w-96 rounded-full opacity-30" style={{ background: "radial-gradient(circle, rgba(40,208,192,0.12) 0%, transparent 70%)" }} />
        <div className="absolute top-1/3 -right-40 h-96 w-96 rounded-full opacity-20" style={{ background: "radial-gradient(circle, rgba(167,139,250,0.06) 0%, transparent 70%)" }} />
      </div>

      <TopNav active={tab} onChange={setTab} onSettings={() => setSettings(true)} />

      {!installed && (
        <div className="relative mx-auto w-full max-w-[1600px] px-3 pt-2 md:px-6">
          <button
            type="button"
            onClick={installApp}
            className="w-full rounded-2xl border border-[#28D0C0]/30 bg-[#101414] px-4 py-3 text-[13px] font-bold text-[#28D0C0] transition-colors hover:bg-[#28D0C0]/10"
          >
            ↓ Install HabitPulse
          </button>
        </div>
      )}

      <main className="relative mx-auto w-full max-w-[1600px] px-3 pb-4 pt-1 md:px-6">
        {tab === "today" && <TodayScreen />}
        {tab === "habits" && <HabitsScreen />}
        {tab === "tasks" && <TasksScreen />}
        {tab === "goals" && <GoalsScreen />}
        {tab === "insights" && <InsightsScreen />}
        <footer className="mt-12 pt-6 border-t border-[#1E1E1E] flex flex-col md:flex-row items-center justify-between gap-2 text-[10px] uppercase tracking-[0.2em] text-[#454B52]">
          <div>HabitPulse · Build Better Habits</div><div>© 2026 · All Systems Operational</div>
        </footer>
      </main>
      <SettingsModal open={settings} onClose={() => setSettings(false)} />
    </div>
  );
}
