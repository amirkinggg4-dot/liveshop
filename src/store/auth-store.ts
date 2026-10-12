"use client";

/* ─────────────────────────────────────────────────────────────
   v1.9.0 — استور احراز هویت خریدار (ورود با پیامک OTP)
   ─ یک hook واحد useAuth برای کل اپ.
   ─ NEXT_PUBLIC_USE_API=false (پیش‌فرض دمو): همه‌چیز mock در حافظه است؛
     ماشین وضعیت OTP از src/lib/otp-state.ts (ماژول خالص با تست) می‌آید و
     کد دمو در sheet با برچسب «کد دمو» نشان داده می‌شود.
   ─ NEXT_PUBLIC_USE_API=true: /auth/otp/request و /verify و /refresh و /me
     طبق api-spec §1. accessToken و refreshToken فقط در حافظهٔ ماژول
     نگه داشته می‌شوند — هرگز localStorage (برای حالت واقعی باید refresh
     در httpOnly cookie سمت سرور باشد؛ توضیح در README).
   ─ حالت مهمان: مرور آزاد است؛ هر اقدام نیازمند ورود (خرید/فالو/چت/
     یادآوری) با requireAuth شیت ورود را باز می‌کند و همان اقدام بعد از
     ورود ادامه می‌یابد (pendingAction).
   ───────────────────────────────────────────────────────────── */

import { create } from "zustand";
import {
  OTP_ERROR_MESSAGE,
  initialOtpState,
  requestOtp,
  submitCode,
  type OtpState,
} from "@/lib/otp-state";
import { validatePhoneFa } from "@/lib/account-validate";
import { useSellerOnboardingStore } from "@/store/seller-onboarding-store";

/** flag — پیش‌فرض خاموش؛ فقط با NEXT_PUBLIC_USE_API="true" روشن می‌شود */
export const USE_AUTH_API = process.env.NEXT_PUBLIC_USE_API === "true";

export interface AuthUser {
  phone: string;
  name: string;
  username: string;
  /** ایموجی ساختاری آواتار (قرارداد پروژه) */
  avatarEmoji: string;
  avatarColor: string;
  /** برچسب عضویت مثل «عضو از ۱۴۰۲» */
  memberSince: string;
}

/* ── توکن‌ها فقط در حافظهٔ ماژول — هرگز localStorage ── */
let memAccessToken: string | null = null;
let memRefreshToken: string | null = null;

/** کاربر دموی لاگین‌شده (پیش‌فرض اپ تا رفتار قبلی صفحات عوض نشود) */
const DEMO_USER: AuthUser = {
  phone: "09121234567",
  name: "علی رضایی",
  username: "ali_rezaei",
  avatarEmoji: "🧑‍💻",
  avatarColor: "#6C5CFF",
  memberSince: "عضو از ۱۴۰۲",
};

interface AuthState {
  user: AuthUser | null;
  otp: OtpState;
  sheetOpen: boolean;
  /** اقدامی که بعد از ورود باید ادامه یابد (خرید/فالو/چت/یادآوری) */
  pendingAction: (() => void) | null;
  /** کد دمو (فقط حالت mock) — در UI با برچسب «کد دمو» نمایش داده می‌شود */
  demoCode: string | null;
  requestOtp: (rawPhone: string) => { ok: boolean; message?: string };
  verifyOtp: (code: string) => { ok: boolean; message?: string };
  startPhoneStep: () => void;
  openLoginSheet: (action?: () => void) => void;
  closeLoginSheet: () => void;
  logout: () => void;
  deleteAccount: () => void;
  updateProfile: (
    patch: Partial<Pick<AuthUser, "name" | "username" | "avatarEmoji" | "avatarColor">>
  ) => void;
}

/* ── API mode helpers (spec §1) ── */

async function apiPost(path: string, body: unknown) {
  const res = await fetch(`/api/v1${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const json = (await res.json().catch(() => null)) as
    | { ok?: boolean; error?: { code: string; message: string }; data?: Record<string, unknown> }
    | null;
  if (!res.ok || !json?.ok) {
    return { ok: false as const, error: json?.error ?? { code: "GENERIC", message: "خطایی رخ داد؛ دوباره تلاش کنید" } };
  }
  return { ok: true as const, data: json.data ?? {} };
}

function apiUserToAuthUser(u: Record<string, unknown>): AuthUser {
  const phone = String(u.phone ?? "");
  const name = u.name ? String(u.name) : "کاربر LiveShop";
  return {
    phone,
    name,
    username: `user_${phone.slice(-4)}`,
    avatarEmoji: "🧑‍💻",
    avatarColor: "#6C5CFF",
    memberSince: "عضو جدید",
  };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  /* دمو با کاربر لاگین‌شدهٔ seed شروع می‌شود تا صفحات موجود بدون رگرسیون کار کنند؛
     «خروج» کاربر را به مهمان تبدیل می‌کند و مسیر ورود/مهمان قابل تست است. */
  user: DEMO_USER,
  otp: initialOtpState(Date.now()),
  sheetOpen: false,
  pendingAction: null,
  demoCode: null,

  requestOtp: (rawPhone) => {
    const v = validatePhoneFa(rawPhone);
    if (!v.ok) return { ok: false, message: v.message };

    if (USE_AUTH_API) {
      /* حالت API — async داخل استور: نتیجه از طریق otp state آپدیت می‌شود.
         اینجا فقط درخواست می‌زنیم؛ UI با وضعیت بازگشتی پیام می‌دهد. */
      void apiPost("/auth/otp/request", { phone: v.phone }).then((r) => {
        if (!r.ok) {
          set((s) => ({
            otp: { ...s.otp, error: "RATE_LIMITED", phase: s.otp.phase },
            demoCode: null,
          }));
          return;
        }
        const devCode = typeof r.data.devCode === "string" ? r.data.devCode : null;
        set((s) => ({
          otp: {
            ...s.otp,
            phase: "sent",
            phone: v.phone,
            codeExpiresAtMs: Date.now() + 120_000,
            resendAvailableAtMs: Date.now() + 120_000,
            attemptsLeft: 5,
            error: null,
          },
          demoCode: devCode,
        }));
      });
      return { ok: true };
    }

    /* حالت mock — کد تصادفی ۶ رقمی مثل سرور */
    const code = String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");
    const now = Date.now();
    const r = requestOtp(get().otp, now, { expectedCode: code });
    if (!r.result.ok) {
      set({ otp: r.state });
      return { ok: false, message: OTP_ERROR_MESSAGE[r.result.error] };
    }
    /* شماره در state ماشین ست شده (withPhone در requestOtp) */
    set({ otp: r.state, demoCode: code });
    return { ok: true };
  },

  verifyOtp: (code) => {
    if (USE_AUTH_API) {
      const phone = get().otp.phone;
      void (async () => {
        const r = await apiPost("/auth/otp/verify", { phone, code });
        if (!r.ok) {
          const mapped =
            r.error.code === "INVALID_OTP"
              ? "INVALID_CODE"
              : r.error.code === "TOO_MANY_ATTEMPTS"
                ? "TOO_MANY_ATTEMPTS"
                : r.error.code === "OTP_EXPIRED"
                  ? "CODE_EXPIRED"
                  : "GENERIC";
          set((s) => ({ otp: { ...s.otp, error: mapped } }));
          return;
        }
        memAccessToken = typeof r.data.accessToken === "string" ? r.data.accessToken : null;
        memRefreshToken = typeof r.data.refreshToken === "string" ? r.data.refreshToken : null;
        const user = apiUserToAuthUser(
          (r.data.user as Record<string, unknown>) ?? {}
        );
        set((s) => ({
          user,
          otp: { ...initialOtpState(Date.now()), phase: "authenticated" as const },
          demoCode: null,
          sheetOpen: false,
        }));
        /* ادامهٔ اقدام معلق بعد از ورود */
        const act = get().pendingAction;
        if (act) {
          set({ pendingAction: null });
          act();
        }
      })();
      return { ok: true };
    }

    const now = Date.now();
    const r = submitCode(get().otp, code, now);
    if (!r.result.ok) {
      set({ otp: r.state });
      return { ok: false, message: OTP_ERROR_MESSAGE[r.result.error] };
    }
    const phone = r.state.phone;
    /* دمو: ورود با شمارهٔ کاربر seed → همان علی؛ هر شمارهٔ دیگر → کاربر جدید */
    const user: AuthUser =
      phone === DEMO_USER.phone
        ? DEMO_USER
        : {
            phone,
            name: "کاربر LiveShop",
            username: `user_${phone.slice(-4)}`,
            avatarEmoji: "🧑‍💻",
            avatarColor: "#00C896",
            memberSince: "عضو جدید",
          };
    set({ user, otp: r.state, demoCode: null, sheetOpen: false });
    /* v1.9.1 — ورود موفق = نشست کاربر تازه؛ وضعیت فروشنده از صفر شروع می‌شود */
    useSellerOnboardingStore.getState().hardReset();
    /* ادامهٔ اقدام معلق بعد از ورود */
    const act = get().pendingAction;
    if (act) {
      set({ pendingAction: null });
      act();
    }
    return { ok: true };
  },

  startPhoneStep: () =>
    set((s) => ({ otp: initialOtpState(Date.now()), demoCode: null, pendingAction: s.pendingAction })),

  openLoginSheet: (action) =>
    set((s) => ({
      sheetOpen: true,
      pendingAction: action ?? s.pendingAction,
      otp: s.otp.phase === "authenticated" ? initialOtpState(Date.now()) : s.otp,
      demoCode: s.otp.phase === "authenticated" ? null : s.demoCode,
    })),

  closeLoginSheet: () =>
    set((s) => ({
      sheetOpen: false,
      /* اقدام معلق در بستن شیت دور ریخته می‌شود — کاربر بعداً دوباره همان کار را می‌کند */
      pendingAction: null,
      otp: s.otp.phase === "authenticated" ? s.otp : initialOtpState(Date.now()),
      demoCode: s.otp.phase === "authenticated" ? s.demoCode : null,
    })),

  logout: () => {
    /* v1.9.1 — وضعیت فروشنده به کاربر متصل است؛ با خروج پاک می‌شود */
    useSellerOnboardingStore.getState().hardReset();
    set({
      user: null,
      otp: initialOtpState(Date.now()),
      demoCode: null,
      sheetOpen: false,
      pendingAction: null,
    });
  },

  deleteAccount: () => {
    memAccessToken = null;
    memRefreshToken = null;
    /* v1.9.1 — حذف حساب وضعیت فروشنده را هم پاک می‌کند */
    useSellerOnboardingStore.getState().hardReset();
    set({
      user: null,
      otp: initialOtpState(Date.now()),
      demoCode: null,
      sheetOpen: false,
      pendingAction: null,
    });
  },

  updateProfile: (patch) =>
    set((s) => {
      if (!s.user) return s;
      return { user: { ...s.user, ...patch } };
    }),
}));

/* ── hook واحد احراز هویت (قرارداد درخواست کاربر) ── */

export interface UseAuth {
  user: AuthUser | null;
  isAuthenticated: boolean;
  otp: OtpState;
  sheetOpen: boolean;
  demoCode: string | null;
  requestOtp: AuthState["requestOtp"];
  verifyOtp: AuthState["verifyOtp"];
  startPhoneStep: AuthState["startPhoneStep"];
  openLoginSheet: AuthState["openLoginSheet"];
  closeLoginSheet: AuthState["closeLoginSheet"];
  logout: AuthState["logout"];
  deleteAccount: AuthState["deleteAccount"];
  updateProfile: AuthState["updateProfile"];
  /** گیت مهمان: اگر لاگین است همان کار را انجام بده؛ وگرنه شیت ورود را باز کن و کار را معلق کن */
  requireAuth: (action: () => void) => void;
}

export function useAuth(): UseAuth {
  const user = useAuthStore((s) => s.user);
  const otp = useAuthStore((s) => s.otp);
  const sheetOpen = useAuthStore((s) => s.sheetOpen);
  const demoCode = useAuthStore((s) => s.demoCode);
  const store = useAuthStore;
  return {
    user,
    isAuthenticated: user !== null,
    otp,
    sheetOpen,
    demoCode,
    requestOtp: (raw) => store.getState().requestOtp(raw),
    verifyOtp: (code) => store.getState().verifyOtp(code),
    startPhoneStep: () => store.getState().startPhoneStep(),
    openLoginSheet: (action) => store.getState().openLoginSheet(action),
    closeLoginSheet: () => store.getState().closeLoginSheet(),
    logout: () => store.getState().logout(),
    deleteAccount: () => store.getState().deleteAccount(),
    updateProfile: (patch) => store.getState().updateProfile(patch),
    requireAuth: (action) => {
      if (store.getState().user) {
        action();
        return;
      }
      store.getState().openLoginSheet(action);
    },
  };
}
