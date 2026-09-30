import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export type AuthUser = { id: string; email: string; display_name: string };
type AuthContextType = {
  user: AuthUser | null; loading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<AuthUser>;
  signIn: (email: string, password: string) => Promise<AuthUser>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<AuthUser>) => Promise<void>;
};
const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapUser(u: User): AuthUser {
  return { id: u.id, email: u.email ?? "", display_name: String(u.user_metadata?.display_name ?? u.email?.split("@")[0] ?? "User") };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) { setUser(data.session?.user ? mapUser(data.session.user) : null); setLoading(false); }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? mapUser(session.user) : null); setLoading(false);
    });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, []);

  const signUp = async (email: string, password: string, displayName: string) => {
    const normalized = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signUp({
      email: normalized, password,
      options: { data: { display_name: displayName.trim() || normalized.split("@")[0] } },
    });
    if (error) throw error;
    if (!data.user) throw new Error("Could not create account.");
    const mapped = mapUser(data.user);
    if (data.session) setUser(mapped);
    return mapped;
  };
  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (error) throw error;
    const mapped = mapUser(data.user); setUser(mapped); return mapped;
  };
  const signOut = async () => { const { error } = await supabase.auth.signOut(); if (error) throw error; setUser(null); };
  const updateProfile = async (updates: Partial<AuthUser>) => {
    if (!user) return;
    const attrs: { email?: string; data?: Record<string, string> } = {};
    if (updates.email && updates.email !== user.email) attrs.email = updates.email.trim().toLowerCase();
    if (updates.display_name !== undefined) attrs.data = { display_name: updates.display_name };
    const { data, error } = await supabase.auth.updateUser(attrs); if (error) throw error;
    if (updates.display_name !== undefined) {
      const { error: pErr } = await supabase.from("profiles").update({ display_name: updates.display_name }).eq("user_id", user.id);
      if (pErr) throw pErr;
    }
    if (data.user) setUser(mapUser(data.user));
  };
  return <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut, updateProfile }}>{children}</AuthContext.Provider>;
}
export function useAuth() { const ctx = useContext(AuthContext); if (!ctx) throw new Error("useAuth must be used within AuthProvider"); return ctx; }
