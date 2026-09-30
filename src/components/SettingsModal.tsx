import { useState } from "react";
import { useAuth } from "../lib/auth";
import { XIcon, CheckIcon } from "./icons";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const { user, updateProfile, signOut } = useAuth();
  const [name, setName] = useState(user?.display_name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!open) return null;

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await updateProfile({ display_name: name.trim() || user!.display_name, email: email.trim() || user!.email });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-[18px] border border-[rgba(255,255,255,0.06)] p-6"
        style={{
          background:
            "linear-gradient(180deg, rgba(20,20,20,1) 0%, rgba(17,17,17,1) 100%)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-[#28D0C0] mb-1">
              Preferences
            </div>
            <h3 className="text-[20px] font-semibold text-[#F3F3F3]">Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-full border border-[rgba(255,255,255,0.06)] text-[#737B84] hover:text-[#F3F3F3] flex items-center justify-center"
          >
            <XIcon size={16} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-[#737B84] block mb-2">
              Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#0F0F0F] text-[#F3F3F3] text-[14px] outline-none focus:border-[#28D0C0]"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-[#737B84] block mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#0F0F0F] text-[#F3F3F3] text-[14px] outline-none focus:border-[#28D0C0]"
            />
          </div>

          <div className="pt-2 border-t border-[rgba(255,255,255,0.06)]">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#737B84] mb-3">
              App Preferences
            </div>
            {[
              { label: "Theme", value: "Dark" },
              { label: "Week starts on", value: "Monday" },
              { label: "Time zone", value: "Local" },
              { label: "Language", value: "English" },
            ].map((s) => (
              <div
                key={s.label}
                className="flex items-center justify-between px-4 py-3 rounded-xl border border-[rgba(255,255,255,0.06)] mb-2"
                style={{ background: "rgba(12,15,18,0.7)" }}
              >
                <span className="text-[13px] text-[#F3F3F3]">{s.label}</span>
                <span className="text-[12px] text-[#737B84]">{s.value}</span>
              </div>
            ))}
          </div>

          <button
            onClick={save}
            disabled={saving}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full text-[13px] font-semibold text-[#0A0A0A] disabled:opacity-60"
            style={{
              background: "linear-gradient(180deg, #2ADCCB 0%, #22BCAD 100%)",
              boxShadow: "0 0 24px rgba(40,208,192,0.35)",
            }}
          >
            {saved ? (
              <>
                <CheckIcon size={14} />
                Saved
              </>
            ) : saving ? (
              "Saving..."
            ) : (
              "Save Changes"
            )}
          </button>

          <button
            onClick={async () => {
              if (confirm("Sign out of HabitPulse?")) {
                await signOut();
                onClose();
              }
            }}
            className="w-full inline-flex items-center justify-center px-5 py-3 rounded-full text-[12px] font-semibold text-[#EF4444] border border-[rgba(239,68,68,0.3)] hover:bg-[rgba(239,68,68,0.08)] transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}