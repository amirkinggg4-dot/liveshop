"use client";

/* ─────────────────────────────────────────────────────────────
   v1.9.0 — ویرایش پروفایل (نام، نام کاربری، عکس — عکس mock است:
   انتخاب از آواتارهای آماده با رنگ؛ آپلود واقعی اینجا نیست)
   ───────────────────────────────────────────────────────────── */

import { useState } from "react";
import { toast } from "sonner";
import { BadgeCheck, Camera, Check } from "lucide-react";
import { PageHeader } from "@/components/liveshop/shared";
import { Avatar } from "@/components/liveshop/shared";
import { useAppStore } from "@/store/app-store";
import { useAuth } from "@/store/auth-store";
import { cn } from "@/lib/utils";

const AVATAR_PRESETS: Array<{ emoji: string; color: string }> = [
  { emoji: "🧑‍💻", color: "#6C5CFF" },
  { emoji: "👟", color: "#FF3B8B" },
  { emoji: "🌱", color: "#00C896" },
  { emoji: "🎧", color: "#FFB020" },
  { emoji: "💎", color: "#8B5CF6" },
  { emoji: "🛍️", color: "#FF3B8B" },
];

export default function ProfileEditView() {
  const back = useAppStore((s) => s.back);
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState(user?.name ?? "");
  const [username, setUsername] = useState(user?.username ?? "");
  const [avatar, setAvatar] = useState(
    AVATAR_PRESETS.find((p) => p.emoji === user?.avatarEmoji) ?? AVATAR_PRESETS[0]
  );
  const [nameError, setNameError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  const onSave = () => {
    let bad = false;
    if (!name.trim()) {
      setNameError("نام را وارد کن");
      bad = true;
    } else setNameError(null);
    const u = username.trim().replace(/^@/, "");
    if (!u) {
      setUsernameError("نام کاربری را وارد کن");
      bad = true;
    } else if (!/^[a-zA-Z0-9_]{3,20}$/.test(u)) {
      setUsernameError("نام کاربری فقط حروف انگلیسی، رقم و _ (۳ تا ۲۰ کاراکتر)");
      bad = true;
    } else setUsernameError(null);
    if (bad) return;

    updateProfile({ name: name.trim(), username: u, avatarEmoji: avatar.emoji, avatarColor: avatar.color });
    toast.success("پروفایل ذخیره شد");
    back();
  };

  return (
    <div className="flex flex-1 flex-col" aria-label="ویرایش پروفایل">
      <PageHeader title="ویرایش پروفایل" onBack={back} />

      <div className="px-4 py-4 space-y-5">
        {/* ── عکس (mock) ── */}
        <section className="bg-ls-card border border-white/5 rounded-2xl p-4 space-y-3" aria-label="انتخاب عکس پروفایل">
          <div className="flex items-center justify-between">
            <p className="text-sm font-extrabold flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-ls-purple-soft" aria-hidden />
              عکس پروفایل
            </p>
            <span className="text-[10px] text-white/35">دمو — آپلود واقعی اینجا نیست</span>
          </div>
          <div className="flex items-center gap-3">
            <Avatar emoji={avatar.emoji} color={avatar.color} size="xl" />
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="آواتارهای آماده">
              {AVATAR_PRESETS.map((p) => (
                <button
                  key={p.emoji}
                  type="button"
                  role="radio"
                  aria-checked={p.emoji === avatar.emoji}
                  onClick={() => setAvatar(p)}
                  aria-label={`آواتار ${p.emoji}`}
                  className={cn(
                    "relative flex h-11 w-11 items-center justify-center rounded-2xl border-2 text-lg transition-all",
                    p.emoji === avatar.emoji
                      ? "border-ls-purple scale-105"
                      : "border-white/10 hover:border-white/25"
                  )}
                  style={{ backgroundColor: `${p.color}22` }}
                >
                  {p.emoji}
                  {p.emoji === avatar.emoji && (
                    <Check className="absolute -bottom-1 -left-1 h-4 w-4 rounded-full bg-ls-purple p-0.5 text-white" aria-hidden />
                  )}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── نام ── */}
        <section className="space-y-1.5" aria-label="نام و نام خانوادگی">
          <label htmlFor="pf-name" className="text-xs font-bold text-white/70">
            نام
          </label>
          <input
            id="pf-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={!!nameError}
            className={cn(
              "h-12 w-full rounded-xl border bg-ls-card-2 px-3 text-sm outline-none transition-colors",
              nameError ? "border-red-400/60" : "border-white/10 focus:border-ls-purple/70"
            )}
          />
          {nameError && (
            <p role="alert" className="text-[11px] font-bold text-red-400">
              {nameError}
            </p>
          )}
        </section>

        {/* ── نام کاربری ── */}
        <section className="space-y-1.5" aria-label="نام کاربری">
          <label htmlFor="pf-username" className="text-xs font-bold text-white/70">
            نام کاربری
          </label>
          <div dir="ltr" className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-white/35">@</span>
            <input
              id="pf-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              aria-invalid={!!usernameError}
              className={cn(
                "h-12 w-full rounded-xl border bg-ls-card-2 pl-8 pr-3 text-sm outline-none transition-colors",
                usernameError ? "border-red-400/60" : "border-white/10 focus:border-ls-purple/70"
              )}
            />
          </div>
          {usernameError ? (
            <p role="alert" className="text-[11px] font-bold text-red-400">
              {usernameError}
            </p>
          ) : (
            <p className="flex items-center gap-1 text-[11px] text-white/40">
              <BadgeCheck className="h-3.5 w-3.5 text-ls-green" aria-hidden />
              با این نام در چت لایو دیده می‌شوی
            </p>
          )}
        </section>

        {/* ── ذخیره ── */}
        <button
          type="button"
          onClick={onSave}
          className="h-12 w-full rounded-xl bg-ls-purple text-sm font-black text-white transition-all hover:bg-ls-purple/90 active:scale-[.98]"
          aria-label="ذخیرهٔ تغییرات پروفایل"
        >
          ذخیره
        </button>
      </div>
    </div>
  );
}
