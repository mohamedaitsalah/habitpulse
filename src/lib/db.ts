// IndexedDB-based persistent database for HabitPulse
// Provides multi-user data isolation similar to Supabase with RLS

export type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  display_name: string;
  created_at: string;
};

export type ProfileRow = {
  id: string;
  user_id: string;
  display_name: string;
  created_at: string;
};

export type HabitRow = {
  id: string;
  user_id: string;
  name: string;
  color: string;
  frequency_type: "daily" | "weekly" | "monthly";
  selected_days: number[]; // 0-6 for weekly
  start_date: string; // YYYY-MM-DD
  end_date: string | null;
  category: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
};

export type GoalRowExtras = { completed_at: string | null };

export type PreferencesRowFull = {
  id: string;
  user_id: string;
  settings: string;
  created_at: string;
  updated_at: string;
};

export type HabitCompletionRow = {
  id: string;
  user_id: string;
  habit_id: string;
  completion_date: string; // YYYY-MM-DD
  created_at: string;
};

export type TaskRow = {
  id: string;
  user_id: string;
  title: string;
  task_date: string; // YYYY-MM-DD
  completed: boolean;
  created_at: string;
  updated_at: string;
};

export type MindsetEntryRow = {
  id: string;
  user_id: string;
  entry_date: string;
  energy: number;
  focus: number;
  motivation: number;
  created_at: string;
  updated_at: string;
};

export type GoalRow = {
  id: string;
  user_id: string;
  title: string;
  life_area: string;
  status: string;
  progress: number;
  start_date: string;
  target_date: string | null;
  pinned: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PreferencesRow = {
  id: string;
  user_id: string;
  week_starts_on: number;
  theme: string;
};

const DB_NAME = "habitpulse_db";
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      const stores: { name: string; key: string; indexes: { name: string; key: string | string[]; unique?: boolean }[] }[] = [
        { name: "users", key: "id", indexes: [{ name: "email", key: "email", unique: true }] },
        { name: "profiles", key: "id", indexes: [{ name: "user_id", key: "user_id", unique: true }] },
        {
          name: "habits",
          key: "id",
          indexes: [
            { name: "user_id", key: "user_id" },
            { name: "user_created", key: ["user_id", "created_at"] },
          ],
        },
        {
          name: "habit_completions",
          key: "id",
          indexes: [
            { name: "user_id", key: "user_id" },
            { name: "habit_id", key: "habit_id" },
            { name: "user_date", key: ["user_id", "completion_date"] },
            { name: "user_habit_date", key: ["user_id", "habit_id", "completion_date"], unique: true },
          ],
        },
        {
          name: "tasks",
          key: "id",
          indexes: [
            { name: "user_id", key: "user_id" },
            { name: "user_date", key: ["user_id", "task_date"] },
          ],
        },
        {
          name: "mindset_entries",
          key: "id",
          indexes: [
            { name: "user_id", key: "user_id" },
            { name: "user_date", key: ["user_id", "entry_date"], unique: true },
          ],
        },
        {
          name: "goals",
          key: "id",
          indexes: [
            { name: "user_id", key: "user_id" },
            { name: "user_pinned", key: ["user_id", "pinned"] },
          ],
        },
        {
          name: "preferences",
          key: "id",
          indexes: [{ name: "user_id", key: "user_id", unique: true }],
        },
        {
          name: "sessions",
          key: "id",
          indexes: [{ name: "user_id", key: "user_id" }],
        },
      ];

      for (const s of stores) {
        if (!db.objectStoreNames.contains(s.name)) {
          const store = db.createObjectStore(s.name, { keyPath: s.key });
          for (const idx of s.indexes) {
            store.createIndex(idx.name, idx.key as string | string[], {
              unique: !!idx.unique,
            });
          }
        }
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx<T>(
  storeNames: string | string[],
  mode: IDBTransactionMode,
  run: (t: IDBTransaction) => Promise<T> | T
): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(storeNames, mode);
        let result: T | Promise<T>;
        t.oncomplete = () => {
          Promise.resolve(result).then(resolve).catch(reject);
        };
        t.onerror = () => reject(t.error);
        t.onabort = () => reject(t.error);
        try {
          result = run(t);
        } catch (e) {
          reject(e);
        }
      })
  );
}

function req<T>(r: IDBRequest): Promise<T> {
  return new Promise((resolve, reject) => {
    r.onsuccess = () => resolve(r.result as T);
    r.onerror = () => reject(r.error);
  });
}

export function genId(): string {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 10)
  );
}

// Simple password hash (not for real production use; suitable for offline client DB)
export async function hashPassword(pw: string): Promise<string> {
  const data = new TextEncoder().encode(pw + "::habitpulse::v1");
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function putItem<T>(store: string, item: T): Promise<void> {
  await tx(store, "readwrite", (t) => {
    t.objectStore(store).put(item);
  });
}

export async function getItem<T>(store: string, key: string): Promise<T | undefined> {
  return tx(store, "readonly", (t) =>
    req<T | undefined>(t.objectStore(store).get(key))
  );
}

export async function getAll<T>(store: string): Promise<T[]> {
  return tx(store, "readonly", (t) =>
    req<T[]>(t.objectStore(store).getAll())
  );
}

export async function getByIndex<T>(
  store: string,
  indexName: string,
  value: IDBValidKey | IDBKeyRange
): Promise<T[]> {
  return tx(store, "readonly", (t) =>
    req<T[]>(t.objectStore(store).index(indexName).getAll(value))
  );
}

export async function getOneByIndex<T>(
  store: string,
  indexName: string,
  value: IDBValidKey
): Promise<T | undefined> {
  return tx(store, "readonly", (t) =>
    req<T | undefined>(t.objectStore(store).index(indexName).get(value))
  );
}

export async function deleteItem(store: string, key: string): Promise<void> {
  await tx(store, "readwrite", (t) => {
    t.objectStore(store).delete(key);
  });
}

export async function deleteByIndex(
  store: string,
  indexName: string,
  value: IDBValidKey
): Promise<void> {
  await tx(store, "readwrite", (t) => {
    const storeObj = t.objectStore(store);
    const idx = storeObj.index(indexName);
    const req = idx.openCursor(value);
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
  });
}