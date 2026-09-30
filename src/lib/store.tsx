import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
  useCallback,
} from "react";
import type {
  HabitRow, HabitCompletionRow, TaskRow, MindsetEntryRow, GoalRow,
} from "./db";
import { supabase } from "./supabase";
import { useAuth } from "./auth";

// ---------- Date helpers ----------
export const ymd = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const parseYmd = (s: string): Date => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (d: Date, n: number): Date => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

export const startOfMonth = (d: Date): Date =>
  new Date(d.getFullYear(), d.getMonth(), 1);

export const endOfMonth = (d: Date): Date =>
  new Date(d.getFullYear(), d.getMonth() + 1, 0);

export const startOfWeek = (d: Date, weekStart = 1): Date => {
  const x = new Date(d);
  const day = x.getDay();
  const diff = (day - weekStart + 7) % 7;
  x.setDate(x.getDate() - diff);
  return x;
};

export const dayShort = (i: number): string =>
  ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][i];

export const dayFull = (i: number): string =>
  [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ][i];

export const monthName = (i: number): string =>
  [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ][i];

// ---------- Types ----------
export type Habit = HabitRow;
export type HabitCompletion = HabitCompletionRow;
export type Task = TaskRow;
export type MindsetEntry = MindsetEntryRow;
export type Goal = GoalRow;

type StoreContextType = {
  habits: Habit[];
  completions: HabitCompletion[];
  tasks: Task[];
  mindset: MindsetEntry[];
  goals: Goal[];

  reload: () => Promise<void>;

  // Habits
  createHabit: (data: Omit<HabitRow, "id" | "user_id" | "created_at" | "updated_at">) => Promise<Habit>;
  updateHabit: (id: string, updates: Partial<HabitRow>) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  toggleHabitCompletion: (habitId: string, date: string) => Promise<void>;

  // Tasks
  createTask: (data: { title: string; task_date: string }) => Promise<Task>;
  updateTask: (id: string, updates: Partial<TaskRow>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskCompletion: (id: string) => Promise<void>;
  copyTasksFromYesterday: (today: string) => Promise<void>;

  // Mindset
  upsertMindset: (
    entry_date: string,
    values: { energy: number; focus: number; motivation: number }
  ) => Promise<void>;

  // Goals
  createGoal: (data: Omit<GoalRow, "id" | "user_id" | "created_at" | "updated_at" | "completed_at">) => Promise<Goal>;
  updateGoal: (id: string, updates: Partial<GoalRow>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  toggleGoalPin: (id: string) => Promise<void>;
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;
  const [habits, setHabits] = useState<Habit[]>([]), [completions, setCompletions] = useState<HabitCompletion[]>([]), [tasks, setTasks] = useState<Task[]>([]), [mindset, setMindset] = useState<MindsetEntry[]>([]), [goals, setGoals] = useState<Goal[]>([]);
  const mustUser = () => { if (!userId) throw new Error("Not authenticated"); return userId; };
  const check = (error: any) => { if (error) throw error; };

  const reload = useCallback(async () => {
    if (!userId) { setHabits([]); setCompletions([]); setTasks([]); setMindset([]); setGoals([]); return; }
    const [h,c,t,m,g] = await Promise.all([
      supabase.from("habits").select("*").order("created_at"),
      supabase.from("habit_completions").select("*"),
      supabase.from("tasks").select("*").order("created_at"),
      supabase.from("mindset_entries").select("*"),
      supabase.from("goals").select("*").order("created_at"),
    ]);
    [h,c,t,m,g].forEach(x => check(x.error));
    setHabits((h.data ?? []) as Habit[]); setCompletions((c.data ?? []) as HabitCompletion[]); setTasks((t.data ?? []) as Task[]); setMindset((m.data ?? []) as MindsetEntry[]); setGoals((g.data ?? []) as Goal[]);
  }, [userId]);
  useEffect(() => { void reload(); }, [reload]);

  const createHabit: StoreContextType["createHabit"] = async data => { const uid=mustUser(); const {data:row,error}=await supabase.from("habits").insert({...data,user_id:uid}).select().single(); check(error); setHabits(p=>[...p,row as Habit]); return row as Habit; };
  const updateHabit: StoreContextType["updateHabit"] = async (id,updates) => { mustUser(); const {data,error}=await supabase.from("habits").update(updates).eq("id",id).select().single(); check(error); setHabits(p=>p.map(x=>x.id===id?data as Habit:x)); };
  const deleteHabit: StoreContextType["deleteHabit"] = async id => { mustUser(); const {error}=await supabase.from("habits").delete().eq("id",id); check(error); setHabits(p=>p.filter(x=>x.id!==id)); setCompletions(p=>p.filter(x=>x.habit_id!==id)); };
  const toggleHabitCompletion: StoreContextType["toggleHabitCompletion"] = async (habitId,date) => { const uid=mustUser(); const existing=completions.find(c=>c.habit_id===habitId&&c.completion_date===date); if(existing){const {error}=await supabase.from("habit_completions").delete().eq("id",existing.id);check(error);setCompletions(p=>p.filter(c=>c.id!==existing.id));}else{const {data,error}=await supabase.from("habit_completions").insert({user_id:uid,habit_id:habitId,completion_date:date}).select().single();check(error);setCompletions(p=>[...p,data as HabitCompletion]);} };

  const createTask: StoreContextType["createTask"] = async d => {const uid=mustUser();const {data,error}=await supabase.from("tasks").insert({user_id:uid,title:d.title.trim(),task_date:d.task_date,completed:false}).select().single();check(error);setTasks(p=>[...p,data as Task]);return data as Task;};
  const updateTask: StoreContextType["updateTask"] = async(id,updates)=>{mustUser();const {data,error}=await supabase.from("tasks").update(updates).eq("id",id).select().single();check(error);setTasks(p=>p.map(x=>x.id===id?data as Task:x));};
  const deleteTask: StoreContextType["deleteTask"] = async id=>{mustUser();const {error}=await supabase.from("tasks").delete().eq("id",id);check(error);setTasks(p=>p.filter(x=>x.id!==id));};
  const toggleTaskCompletion: StoreContextType["toggleTaskCompletion"] = async id=>{const cur=tasks.find(t=>t.id===id);if(!cur)throw new Error("Not found");await updateTask(id,{completed:!cur.completed});};
  const copyTasksFromYesterday: StoreContextType["copyTasksFromYesterday"] = async today=>{const uid=mustUser();const yesterday=ymd(addDays(parseYmd(today),-1));const {data:ys,error:e}=await supabase.from("tasks").select("title").eq("task_date",yesterday);check(e);if(!ys?.length)return;const {data,error}=await supabase.from("tasks").insert(ys.map(x=>({user_id:uid,title:x.title,task_date:today,completed:false}))).select();check(error);setTasks(p=>[...p,...(data as Task[])]);};

  const upsertMindset: StoreContextType["upsertMindset"] = async(entry_date,values)=>{const uid=mustUser();const {data,error}=await supabase.from("mindset_entries").upsert({user_id:uid,entry_date,...values},{onConflict:"user_id,entry_date"}).select().single();check(error);setMindset(p=>{const i=p.findIndex(x=>x.entry_date===entry_date);return i<0?[...p,data as MindsetEntry]:p.map((x,j)=>j===i?data as MindsetEntry:x)});};

  const createGoal: StoreContextType["createGoal"] = async d=>{const uid=mustUser();const {data,error}=await supabase.from("goals").insert({...d,user_id:uid,completed_at:d.progress>=100?new Date().toISOString():null}).select().single();check(error);setGoals(p=>[...p,data as Goal]);return data as Goal;};
  const updateGoal: StoreContextType["updateGoal"] = async(id,updates)=>{mustUser();const cur=goals.find(g=>g.id===id);if(!cur)throw new Error("Not found");const progress=updates.progress??cur.progress;const completed_at=progress>=100?(cur.completed_at??new Date().toISOString()):null;const {data,error}=await supabase.from("goals").update({...updates,completed_at}).eq("id",id).select().single();check(error);setGoals(p=>p.map(x=>x.id===id?data as Goal:x));};
  const deleteGoal: StoreContextType["deleteGoal"] = async id=>{mustUser();const {error}=await supabase.from("goals").delete().eq("id",id);check(error);setGoals(p=>p.filter(x=>x.id!==id));};
  const toggleGoalPin: StoreContextType["toggleGoalPin"] = async id=>{const cur=goals.find(g=>g.id===id);if(!cur)throw new Error("Not found");await updateGoal(id,{pinned:!cur.pinned});};

  const value=useMemo<StoreContextType>(()=>({habits,completions,tasks,mindset,goals,reload,createHabit,updateHabit,deleteHabit,toggleHabitCompletion,createTask,updateTask,deleteTask,toggleTaskCompletion,copyTasksFromYesterday,upsertMindset,createGoal,updateGoal,deleteGoal,toggleGoalPin}),[habits,completions,tasks,mindset,goals,userId]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
export function useStore(){const ctx=useContext(StoreContext);if(!ctx)throw new Error("useStore must be used within StoreProvider");return ctx;}

// ---------- Derived helpers ----------

export function habitScheduledOn(habit: Habit, date: Date): boolean {
  const start = parseYmd(habit.start_date);
  if (date < start) return false;
  if (habit.end_date) {
    const end = parseYmd(habit.end_date);
    if (date > end) return false;
  }
  if (habit.frequency_type === "daily") return true;
  if (habit.frequency_type === "weekly") {
    if (!habit.selected_days || habit.selected_days.length === 0) return true;
    return habit.selected_days.includes(date.getDay());
  }
  if (habit.frequency_type === "monthly") {
    return date.getDate() === start.getDate();
  }
  return true;
}

export function computeStreak(
  habit: Habit,
  completions: HabitCompletion[],
  today: Date
): number {
  let streak = 0;
  let cursor = new Date(today);
  while (true) {
    if (!habitScheduledOn(habit, cursor)) {
      // Skip non-scheduled days without breaking streak
      cursor = addDays(cursor, -1);
      if (cursor < parseYmd(habit.start_date)) break;
      if (cursor < new Date(2000, 0, 1)) break;
      continue;
    }
    const cursorStr = ymd(cursor);
    const done = completions.some(
      (c) => c.habit_id === habit.id && c.completion_date === cursorStr
    );
    if (done) {
      streak++;
      cursor = addDays(cursor, -1);
    } else {
      break;
    }
  }
  return streak;
}

/** Longest run of consecutive completed scheduled occurrences, ever. */
export function computeBestStreak(
  habit: Habit,
  completions: HabitCompletion[],
  today: Date
): number {
  const doneDates = new Set(
    completions.filter((c) => c.habit_id === habit.id).map((c) => c.completion_date)
  );
  if (doneDates.size === 0) return 0;

  let best = 0;
  let run = 0;
  let cursor = parseYmd(habit.start_date);
  const lastScheduled = new Date(today);

  while (cursor <= lastScheduled && run <= 4000) {
    if (habitScheduledOn(habit, cursor)) {
      if (doneDates.has(ymd(cursor))) {
        run++;
        if (run > best) best = run;
      } else {
        run = 0;
      }
    }
    cursor = addDays(cursor, 1);
  }
  return best;
}

/** Aggregate a habit's scheduled/completed counts over an arbitrary date list. */
export function habitPeriodStats(
  habit: Habit,
  completions: HabitCompletion[],
  dates: Date[]
): { scheduled: number; completed: number; pct: number } {
  const done = new Set(
    completions.filter((c) => c.habit_id === habit.id).map((c) => c.completion_date)
  );
  let scheduled = 0;
  let completed = 0;
  for (const d of dates) {
    if (!habitScheduledOn(habit, d)) continue;
    scheduled++;
    if (done.has(ymd(d))) completed++;
  }
  return { scheduled, completed, pct: scheduled === 0 ? 0 : Math.round((completed / scheduled) * 100) };
}
