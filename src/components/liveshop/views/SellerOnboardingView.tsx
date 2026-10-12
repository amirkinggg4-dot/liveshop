"use client";

import { useMemo, useState } from "react";
import { Camera, CheckCircle2, Send, Store } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/store/app-store";
import {
  useForcedSellerStatus,
  useSellerOnboardingStore,
  type SellerApplication,
} from "@/store/seller-onboarding-store";
import {
  maskNationalId,
  maskSheba,
  validateNationalId,
  validateSheba,
  validateSlug,
} from "@/lib/seller-validate";
import { CATEGORIES } from "@/lib/data/categories";
import { PageHeader } from "@/components/liveshop/shared";
import {
  SellerStatusCard,
  SellerStatusChip,
} from "@/components/liveshop/seller-status-cards";

/* ─────────────────────────────────────────────────────────────
   v1.7.0 — «شروع فروش» (onboarding فروشنده — بخش ۶ قرارداد API:
   POST /seller/apply). وضعیت‌ها: فرم → در انتظار تأیید / تأیید شد /
   رد شد با دلیل / تعلیق.
   ─ کد ملی (۱۰ رقم با رقم کنترل) و شبا (IR+۲۴ با mod-97) با
     اعتبارسنجی زنده؛ در UI فقط ماسک نمایش داده می‌شود.
   ─ تا تأیید نشدن، «شروع لایو» و «لیستینگ» در پنل فروشنده قفل است
     و علتش نمایش داده می‌شود (useSellerGate در SellerDashboardView).
   ─ کلید دموی ?seller=none|pending|approved|rejected|suspended کارت
     همان وضعیت را اجباری می‌کند (الگوی ?state= نماهای دیگر).
   ─ v1.9.1 — کارت‌های وضعیت به seller-status-cards منتقل شدند
     (مشترک با گیت تب «فروش»)؛ دکمهٔ دموی «شبیه‌سازی تأیید ادمین» حذف
     شد — تأیید/رد/تعلیق از پنل ادمین (/admin) انجام می‌شود و وضعیت
     همان لحظه در نمای فروشنده تغییر می‌کند (mock مشترک).
   ───────────────────────────────────────────────────────────── */

type NidState = { value: string; valid: boolean; touched: boolean };
type ShebaState = { value: string; valid: boolean; touched: boolean };
type SlugState = { value: string; valid: boolean; touched: boolean };

/* ═══════════════ صفحهٔ اصلی ═══════════════ */
export default function SellerOnboardingView() {
  const back = useAppStore((s) => s.back);

  const storeStatus = useSellerOnboardingStore((s) => s.status);
  const application = useSellerOnboardingStore((s) => s.application);
  const submit = useSellerOnboardingStore((s) => s.submit);
  const reopenForm = useSellerOnboardingStore((s) => s.reopenForm);

  const forced = useForcedSellerStatus();
  /* کلید دمو اگر بود، وضعیت نمایشی را اجباری می‌کند */
  const status = forced ?? storeStatus;

  /* ── فیلدهای فرم (پیش‌فرض: آخرین درخواست اگر باشد) ── */
  const [storeName, setStoreName] = useState(application?.storeName ?? "");
  const [slug, setSlug] = useState<SlugState>({
    value: application?.slug ?? "",
    valid: false,
    touched: false,
  });
  const [category, setCategory] = useState(
    application?.mainCategoryLabel ?? "کتونی و کفش"
  );
  const [nid, setNid] = useState<NidState>({
    value: application?.nationalId ?? "",
    valid: false,
    touched: false,
  });
  const [sheba, setSheba] = useState<ShebaState>({
    value: application?.sheba ?? "",
    valid: false,
    touched: false,
  });
  const [idPhoto, setIdPhoto] = useState(application?.idPhotoAccepted ?? false);
  const [terms, setTerms] = useState(application?.termsAccepted ?? false);

  /* اعتبارسنجی زنده — مقدار کامل هرگز لاگ یا toast نمی‌شود */
  const slugCheck = useMemo(() => validateSlug(slug.value), [slug.value]);
  const nidCheck = useMemo(() => validateNationalId(nid.value), [nid.value]);
  const shebaCheck = useMemo(() => validateSheba(sheba.value), [sheba.value]);

  /* نسخهٔ گسسته برای JSX (تنگ‌تر شدن نوع) */
  const slugError = slugCheck.ok ? null : slugCheck.error;
  const nidValid = nidCheck.ok;
  const nidError = nidCheck.ok ? null : nidCheck.error;
  const nidMasked = nidCheck.ok ? maskNationalId(nidCheck.normalized) : null;
  const shebaValid = shebaCheck.ok;
  const shebaError = shebaCheck.ok ? null : shebaCheck.error;
  const shebaMasked = shebaCheck.ok ? maskSheba(shebaCheck.normalized) : null;

  const formValid =
    storeName.trim().length >= 3 &&
    slugCheck.ok &&
    nidCheck.ok &&
    shebaCheck.ok &&
    idPhoto &&
    terms;

  const onSlugChange = (v: string) =>
    setSlug({
      value: v,
      valid: validateSlug(v).ok,
      touched: true,
    });
  const onNidChange = (v: string) =>
    setNid({
      value: v,
      valid: validateNationalId(v).ok,
      touched: true,
    });
  const onShebaChange = (v: string) =>
    setSheba({
      value: v,
      valid: validateSheba(v).ok,
      touched: true,
    });

  const onSubmit = (): void => {
    if (!storeName.trim() || storeName.trim().length < 3) {
      toast.error("نام فروشگاه را وارد کن (حداقل ۳ حرف)");
      return;
    }
    if (!slugCheck.ok) {
      toast.error(slugCheck.error);
      return;
    }
    if (!nidCheck.ok) {
      toast.error(nidCheck.error);
      return;
    }
    if (!shebaCheck.ok) {
      toast.error(shebaCheck.error);
      return;
    }
    if (!idPhoto) {
      toast.error("عکس مدرک هویتی را بارگذاری کن");
      return;
    }
    if (!terms) {
      toast.error("برای ارسال، پذیرش قوانین الزامی است");
      return;
    }
    /* ماسک — مقدار کامل کد ملی/شبا در toast نمی‌رود */
    const app: SellerApplication = {
      storeName: storeName.trim(),
      slug: slugCheck.normalized,
      mainCategoryLabel: category,
      nationalId: nidCheck.normalized,
      sheba: shebaCheck.normalized,
      idPhotoAccepted: true,
      termsAccepted: true,
      submittedAtLabel: "همین حالا",
    };
    const r = submit(app);
    if (!r.ok) {
      toast.error(r.message);
      return;
    }
    toast.success(
      `درخواست فروشندگی «${storeName.trim()}» ثبت شد — ${maskNationalId(nidCheck.ok ? nidCheck.normalized : "")}`
    );
  };

  const showForm = status === "none";

  return (
    <div className="flex-1 flex flex-col" aria-label="شروع فروش">
      <PageHeader
        title="شروع فروش"
        subtitle="درخواست فروشندگی در LiveShop"
        onBack={back}
      />

      <div className="px-4 pt-4 pb-8 space-y-4">
        {!showForm && (
          <>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-extrabold">وضعیت درخواست</h2>
              <SellerStatusChip status={status} />
            </div>
            <SellerStatusCard
              status={status}
              reason={application?.rejectionReason ?? application?.suspendedReason}
              onEdit={() => {
                const r = reopenForm();
                if (r.ok) toast("فرم با اطلاعات قبلی برای اصلاح باز شد");
              }}
            />
          </>
        )}

        {showForm && (
          <>
            {/* معرفی */}
            <section
              aria-label="معرفی شروع فروش"
              className="rounded-2xl border border-ls-purple/30 bg-gradient-to-l from-ls-purple/15 to-ls-pink/10 p-4"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ls-purple/20 text-ls-purple-soft">
                  <Store className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-black">فروشندهٔ LiveShop شو</p>
                  <p className="mt-0.5 text-[11px] leading-4 text-white/60">
                    فروش زنده با قیمت ثابت، تسویهٔ امن و پشتیبانی ارسال
                  </p>
                </div>
              </div>
            </section>

            {/* نام فروشگاه */}
            <div className="space-y-1.5">
              <label
                htmlFor="ob-store-name"
                className="block text-xs font-bold text-white/70"
              >
                نام فروشگاه
              </label>
              <Input
                id="ob-store-name"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="مثلاً کفش‌خانهٔ سینا"
                aria-label="نام فروشگاه"
                className="h-11 rounded-xl border-white/10 bg-ls-card text-sm placeholder:text-white/35"
              />
            </div>

            {/* شناسهٔ فروشگاه */}
            <div className="space-y-1.5">
              <label
                htmlFor="ob-slug"
                className="block text-xs font-bold text-white/70"
              >
                شناسهٔ فروشگاه <span className="text-white/40">(لاتین)</span>
              </label>
              <Input
                id="ob-slug"
                dir="ltr"
                value={slug.value}
                onChange={(e) => onSlugChange(e.target.value)}
                placeholder="sina-kicks"
                aria-label="شناسهٔ فروشگاه به لاتین"
                aria-invalid={slug.touched && !slug.valid}
                className={cn(
                  "h-11 rounded-xl border-white/10 bg-ls-card text-left text-sm placeholder:text-white/35",
                  slug.touched && !slug.valid && "border-ls-pink/60",
                  slug.valid && "border-ls-green/50"
                )}
              />
              <p className="text-[10px] leading-4 text-white/40">
                آدرس فروشگاهت می‌شود{" "}
                <span dir="ltr">liveshop.ir/@{slug.value || "..."}</span>
              </p>
              {slug.touched && !slug.valid && (
                <p className="text-[10px] font-bold text-ls-pink" role="alert">
                  {slugError}
                </p>
              )}
            </div>

            {/* دستهٔ اصلی */}
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-white/70">دستهٔ اصلی فروش</p>
              <div
                className="flex flex-wrap gap-2"
                role="group"
                aria-label="انتخاب دستهٔ اصلی"
              >
                {CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.label)}
                    aria-pressed={category === c.label}
                    aria-label={`دستهٔ اصلی ${c.label}`}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
                      category === c.label
                        ? "bg-ls-purple text-white"
                        : "bg-ls-card-2 text-white/60 hover:text-white"
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* کد ملی */}
            <div className="space-y-1.5">
              <label
                htmlFor="ob-nid"
                className="block text-xs font-bold text-white/70"
              >
                کد ملی <span className="text-white/40">(۱۰ رقم)</span>
              </label>
              <Input
                id="ob-nid"
                dir="ltr"
                inputMode="numeric"
                value={nid.value}
                onChange={(e) => onNidChange(e.target.value)}
                placeholder="۰۰۱۰۵۱۵۵۲۶"
                aria-label="کد ملی — ده رقم"
                aria-invalid={nid.touched && !nid.valid}
                className={cn(
                  "h-11 rounded-xl border-white/10 bg-ls-card text-left text-sm tabular-nums placeholder:text-white/35",
                  nid.touched && !nid.valid && "border-ls-pink/60",
                  nid.valid && "border-ls-green/50"
                )}
              />
              {nid.touched && (
                <p
                  className={cn(
                    "text-[10px] font-bold",
                    nid.valid ? "text-ls-green" : "text-ls-pink"
                  )}
                  role={nid.valid ? undefined : "alert"}
                >
                  {nid.valid
                    ? `کد ملی معتبر است — نمایش: ${nidMasked ?? ""}`
                    : nidError}
                </p>
              )}
            </div>

            {/* شبا */}
            <div className="space-y-1.5">
              <label
                htmlFor="ob-sheba"
                className="block text-xs font-bold text-white/70"
              >
                شماره شبا <span className="text-white/40">(IR + ۲۴ رقم)</span>
              </label>
              <Input
                id="ob-sheba"
                dir="ltr"
                value={sheba.value}
                onChange={(e) => onShebaChange(e.target.value)}
                placeholder="IR580540105180021273113007"
                aria-label="شماره شبا — آی‌آر و بیست‌وچهار رقم"
                aria-invalid={sheba.touched && !sheba.valid}
                className={cn(
                  "h-11 rounded-xl border-white/10 bg-ls-card text-left text-xs tabular-nums placeholder:text-white/35",
                  sheba.touched && !sheba.valid && "border-ls-pink/60",
                  sheba.valid && "border-ls-green/50"
                )}
              />
              {sheba.touched && (
                <p
                  className={cn(
                    "text-[10px] font-bold",
                    sheba.valid ? "text-ls-green" : "text-ls-pink"
                  )}
                  role={sheba.valid ? undefined : "alert"}
                >
                  {sheba.valid
                    ? `شبا معتبر است — نمایش: ${shebaMasked ?? ""}`
                    : shebaError}
                </p>
              )}
              <p className="text-[10px] leading-4 text-white/40">
                تسویهٔ فروش‌ها به همین حساب واریز می‌شود.
              </p>
            </div>

            {/* عکس مدرک — placeholder */}
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-white/70">عکس مدرک هویتی</p>
              <button
                type="button"
                onClick={() => setIdPhoto((v) => !v)}
                aria-pressed={idPhoto}
                aria-label="بارگذاری عکس مدرک هویتی (دمو)"
                className={cn(
                  "flex w-full flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed p-5 transition-colors active:scale-[.99]",
                  idPhoto
                    ? "border-ls-green/50 bg-ls-green/10"
                    : "border-white/15 bg-ls-card/60 hover:border-ls-purple/50"
                )}
              >
                {idPhoto ? (
                  <>
                    <CheckCircle2
                      className="h-7 w-7 text-ls-green"
                      aria-hidden
                    />
                    <span className="text-xs font-bold text-ls-green">
                      عکس مدرک پیوست شد (دمو)
                    </span>
                  </>
                ) : (
                  <>
                    <Camera
                      className="h-7 w-7 text-white/40"
                      aria-hidden
                    />
                    <span className="text-xs font-bold text-white/70">
                      بارگذاری عکس کارت ملی
                    </span>
                    <span className="text-[10px] text-white/40">
                      JPG یا PNG — حداکثر ۵ مگابایت
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* پذیرش قوانین */}
            <button
              type="button"
              onClick={() => setTerms((v) => !v)}
              aria-pressed={terms}
              className="flex w-full items-start gap-2.5 rounded-2xl border border-white/10 bg-ls-card p-3.5 text-right transition-colors hover:border-ls-purple/40"
            >
              <span
                className={cn(
                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                  terms
                    ? "border-ls-purple bg-ls-purple text-white"
                    : "border-white/25 text-transparent"
                )}
                aria-hidden
              >
                ✓
              </span>
              <span className="min-w-0 flex-1 text-xs leading-5 text-white/75">
                قوانین فروشندگی، سیاست ارسال و نرخ کمیسیون LiveShop را خواندم و
                می‌پذیرم.
              </span>
            </button>

            {/* ارسال */}
            <button
              type="button"
              onClick={onSubmit}
              disabled={!formValid}
              aria-label="ارسال درخواست فروشندگی"
              className={cn(
                "w-full rounded-2xl py-4 text-sm font-black transition-all active:scale-[.99]",
                formValid
                  ? "bg-ls-pink text-white shadow-lg shadow-ls-pink/30 hover:bg-ls-pink/90"
                  : "cursor-not-allowed bg-ls-card-2 text-white/40"
              )}
            >
              <span className="inline-flex items-center justify-center gap-2">
                <Send className="h-4 w-4" aria-hidden />
                ارسال درخواست فروشندگی
              </span>
            </button>
            {!formValid && (
              <p className="text-center text-[10px] text-white/40">
                همهٔ فیلدها با اعتبارسنجی موفق لازم است
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
