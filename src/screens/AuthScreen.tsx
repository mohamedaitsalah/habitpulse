import { useState } from "react";
import { useAuth } from "../lib/auth";
import { SparkleIcon, CheckIcon } from "../components/icons";

export function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signin") {
        await signIn(email, password);
      } else {
        if (!email || !password) throw new Error("Please fill in all fields.");
        if (password.length < 6)
          throw new Error("Password must be at least 6 characters.");
        await signUp(email, password, name);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 relative overflow-hidden">
      <div className="absolute -top-40 left-1/4 h-96 w-96 rounded-full opacity-30 pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(40,208,192,0.18) 0%, transparent 70%)" }}
      />
      <div className="absolute -bottom-40 right-1/4 h-96 w-96 rounded-full opacity-20 pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(167,139,250,0.18) 0%, transparent 70%)" }}
      />

      <div className="relative w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="h-12 w-12 rounded-2xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, rgba(40,208,192,0.25) 0%, rgba(40,208,192,0.08) 100%)",
              boxShadow: "0 0 32px rgba(40,208,192,0.35)",
            }}
          >
            <SparkleIcon size={22} className="text-[#28D0C0]" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-[#737B84] mb-0.5">
              Welcome to
            </div>
            <div className="text-[22px] font-semibold tracking-tight text-[#F3F3F3]">
              HabitPulse
            </div>
          </div>
        </div>

        <div
          className="rounded-[18px] border border-[rgba(255,255,255,0.06)] p-6 md:p-8"
          style={{
            background:
              "linear-gradient(180deg, rgba(20,20,20,1) 0%, rgba(17,17,17,1) 100%)",
          }}
        >
          <div
            className="inline-flex items-center gap-1 p-1 rounded-full border border-[rgba(255,255,255,0.06)] mb-6 w-full"
            style={{ background: "rgba(17,17,17,1)" }}
          >
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 px-4 py-2 rounded-full text-[12px] uppercase tracking-[0.2em] font-semibold transition-all ${
                  mode === m ? "text-[#0A0A0A]" : "text-[#737B84]"
                }`}
                style={
                  mode === m
                    ? {
                        background:
                          "linear-gradient(180deg, #2ADCCB 0%, #22BCAD 100%)",
                        boxShadow: "0 0 16px rgba(40,208,192,0.35)",
                      }
                    : undefined
                }
              >
                {m === "signin" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <Field
                label="Display Name"
                value={name}
                onChange={setName}
                placeholder="Your name"
              />
            )}
            <Field
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@habitpulse.com"
            />
            <Field
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
            />

            {error && (
              <div className="text-[12px] text-[#EF4444] bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.25)] rounded-xl px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full text-[13px] font-semibold text-[#0A0A0A] disabled:opacity-60"
              style={{
                background: "linear-gradient(180deg, #2ADCCB 0%, #22BCAD 100%)",
                boxShadow: "0 0 24px rgba(40,208,192,0.35)",
              }}
            >
              {loading
                ? "Please wait..."
                : mode === "signin"
                ? "Sign In"
                : "Create Account"}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[rgba(255,255,255,0.06)]">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#737B84] mb-3">
              Why HabitPulse
            </div>
            <ul className="space-y-2 text-[12px] text-[#F3F3F3]">
              {[
                "Private account & data",
                "Track habits, tasks & goals",
                "Beautiful insights",
              ].map((b) => (
                <li key={b} className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full bg-[rgba(40,208,192,0.15)] border border-[rgba(40,208,192,0.3)] flex items-center justify-center flex-shrink-0">
                    <CheckIcon size={10} className="text-[#28D0C0]" strokeWidth={3.5} />
                  </span>
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-6 text-center text-[10px] uppercase tracking-[0.2em] text-[#454B52]">
          Your data. Your habits. Your pulse.
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (s: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-[0.2em] text-[#737B84] block mb-2">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#0F0F0F] text-[#F3F3F3] text-[14px] outline-none focus:border-[#28D0C0] transition-colors placeholder-[#4C5561]"
      />
    </div>
  );
}