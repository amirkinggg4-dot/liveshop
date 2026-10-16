"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronRight, Plus, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { faNum } from "@/lib/format";
import { SELLER_ONBOARDING_TOTAL_STEPS } from "@/lib/seller-onboarding-steps";
import { SELL_CHANNEL_LABEL } from "@/lib/seller-profile-pick";
import {
  OTHER_PLATFORM_IDS,
  OTHER_PLATFORM_LABEL,
  OTHER_ROWS_MAX,
  SOCIAL_PLATFORM_IDS,
  SOCIAL_PLATFORM_LABEL,
  SOCIAL_ROWS_MAX,
  newPresenceRowId,
  presenceSectionsFor,
  prunePresenceDraft,
  shouldSkipPresence,
  validatePresenceDraft,
  type OtherPlatformId,
  type SellerPresenceDraft,
  type SocialPlatformId,
} from "@/lib/seller-presence";
import { PROVINCES, citiesOf } from "@/lib/data/provinces";
import type { SellerType } from "@/lib/seller-identity";
import { useAppStore } from "@/store/app-store";
import {
  useSellerOnboardingStore,
} from "@/store/seller-onboarding-store";

/* ─────────────────────────────────────────────────────────────
   v2.0.6 — مرحلهٔ ۵ ثبت‌نام فروشنده: «حضور آنلاین» (تمام‌صفحه)
   پس از «بعدی» مرحلهٔ ویژگی‌های فروش می‌آید و با «بعدی» به فرم
   «شروع فروش» می‌رود. عنوان «آدرس صفحه‌هایت را وارد کن» — فقط
   بخش‌های مربوط به انتخاب مرحلهٔ ۴ نمایش داده می‌شود:
   ─ حقیقی: هر بخشِ نمایش‌داده‌شده حداقل یک ردیف معتبر لازم دارد.
   ─ حقوقی: هر ۴ بخش، همه اختیاری (فقط مقدارِ پرشده اعتبارسنجی می‌شود).
   «هیچ‌جا؛ تازه شروع می‌کنم» ← کل این مرحله در جلو و عقب پرش می‌شود
   (گارد دفاعی در همین صفحه هم هست).
   امنیت: هیچ درخواستی به این آدرس‌ها زده نمی‌شود؛ لینک نمایشی شبکهٔ
   اجتماعی همیشه از handle ساخته می‌شود (SECURITY.md).
   «بعدی» تا اعتبار شبیه غیرفعال است ولی لمس‌پذیر می‌ماند تا فیلدهای
   خالی یا نامعتبر با حاشیهٔ قرمز و پیام مشخص علامت بخورند
   (aria-disabled — هم‌الگوی مراحل قبل).
   صفحات اجتماعی/بازارها: تا ۵ ردیف قابل افزودن/حذف؛ صفحه‌کلید فیلدهای
   URL و نام کاربری LTR است. فارسی/RTL/بدون ایموجی؛ هدف لمسی ≥۴۴px.
   ───────────────────────────────────────────────────────────── */

/* v2.0.6 — کل مراحل wizard از تک‌منبع مشترک (مرحلهٔ این صفحه = ۵ حضور آنلاین) */
const WIZARD_TOTAL_STEPS = SELLER_ONBOARDING_TOTAL_STEPS;
const WIZARD_STEP = 5;

const SELECT_CONTENT_CLS =
  "max-h-72 rounded-2xl border-white/10 bg-ls-card text-white";

export default function SellerPresencePickView() {
  const back = useAppStore((s) => s.back);
  const setRoot = useAppStore((s) => s.setRoot);
  const push = useAppStore((s) => s.push);
  const replace = useAppStore((s) => s.replace);
  /* دو مسیر ورود: «بعدی» مرحلهٔ ویژگی‌های فروش (برگشت ← همان مرحله)
     یا لمس کارت «حضور آنلاین» در فرم «شروع فروش» (برگشت ← خود فرم). */
  const prevView = useAppStore((s) => s.stack[s.stack.length - 2]?.view);
  const backLabel =
    prevView === "sellerOnboarding"
      ? "بازگشت به فرم شروع فروش"
      : "بازگشت به ویژگی‌های فروش";

  const sellerTypeDraft = useSellerOnboardingStore((s) => s.sellerTypeDraft);
  const sellChannelsDraft = useSellerOnboardingStore(
    (s) => s.sellChannelsDraft
  );
  const presenceDraft = useSellerOnboardingStore((s) => s.presenceDraft);
  const setPresenceDraft = useSellerOnboardingStore((s) => s.setPresenceDraft);

  const variant: SellerType = sellerTypeDraft ?? "individual";
  const sections = useMemo(
    () => presenceSectionsFor(variant, sellChannelsDraft),
    [variant, sellChannelsDraft]
  );

  const [showErrors, setShowErrors] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);

  /* پرش مرحله — «هیچ‌جا؛ تازه شروع می‌کنم»: اگر این صفحه با انتخاب
     انحصاری باز شود (نشست کهنه/مسیر غیرمنتظره) مستقیم به فرم می‌رود */
  const skipPresence =
    variant === "individual" && shouldSkipPresence(sellChannelsDraft);
  useEffect(() => {
    if (skipPresence) replace("sellerOnboarding");
  }, [skipPresence, replace]);

  /* هر بخشِ نمایش‌داده‌شده با یک ردیف خالی شروع می‌شود (روی mount؛
     ردیف‌های خالیِ اضافه در «بعدی» هرس می‌شوند) */
  useEffect(() => {
    if (skipPresence) return;
    const store = useSellerOnboardingStore.getState();
    const cur = store.presenceDraft;
    const secs = presenceSectionsFor(
      store.sellerTypeDraft ?? "individual",
      store.sellChannelsDraft
    );
    let next = cur;
    if (secs.includes("social") && cur.social.length === 0) {
      next = {
        ...next,
        social: [
          { id: newPresenceRowId("soc"), platform: "instagram", handle: "" },
        ],
      };
    }
    if (secs.includes("other_platforms") && cur.otherPlatforms.length === 0) {
      next = {
        ...next,
        otherPlatforms: [
          { id: newPresenceRowId("oth"), platform: "divar", url: "" },
        ],
      };
    }
    if (next !== cur) store.setPresenceDraft(next);
  }, []);

  /* اعتبارسنجی زنده — پیام‌ها فقط بعد از لمس «بعدی» نمایش داده می‌شوند */
  const validation = useMemo(
    () =>
      validatePresenceDraft(presenceDraft, {
        sellerType: variant,
        channels: sellChannelsDraft,
      }),
    [presenceDraft, variant, sellChannelsDraft]
  );
  const errors: Record<string, string> = showErrors ? validation.errors : {};

  /* همهٔ ویرایش‌ها از getState می‌خوانند — هیچ ورودی کهنه‌ای بازنویسی نمی‌شود */
  const update = (mutate: (cur: SellerPresenceDraft) => SellerPresenceDraft) => {
    const store = useSellerOnboardingStore.getState();
    store.setPresenceDraft(mutate(store.presenceDraft));
  };

  const setWebsiteUrl = (v: string) =>
    update((cur) => ({ ...cur, websiteUrl: v }));

  const addSocialRow = () =>
    update((cur) =>
      cur.social.length >= SOCIAL_ROWS_MAX
        ? cur
        : {
            ...cur,
            social: [
              ...cur.social,
              { id: newPresenceRowId("soc"), platform: "instagram", handle: "" },
            ],
          }
    );
  const updateSocialRow = (
    id: string,
    patch: Partial<{ platform: SocialPlatformId; handle: string }>
  ) =>
    update((cur) => ({
      ...cur,
      social: cur.social.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }));
  const removeSocialRow = (id: string) =>
    update((cur) => ({
      ...cur,
      social: cur.social.filter((r) => r.id !== id),
    }));

  const addOtherRow = () =>
    update((cur) =>
      cur.otherPlatforms.length >= OTHER_ROWS_MAX
        ? cur
        : {
            ...cur,
            otherPlatforms: [
              ...cur.otherPlatforms,
              { id: newPresenceRowId("oth"), platform: "divar", url: "" },
            ],
          }
    );
  const updateOtherRow = (
    id: string,
    patch: Partial<{ platform: OtherPlatformId; url: string }>
  ) =>
    update((cur) => ({
      ...cur,
      otherPlatforms: cur.otherPlatforms.map((r) =>
        r.id === id ? { ...r, ...patch } : r
      ),
    }));
  const removeOtherRow = (id: string) =>
    update((cur) => ({
      ...cur,
      otherPlatforms: cur.otherPlatforms.filter((r) => r.id !== id),
    }));

  const setStoreField = (
    patch: Partial<SellerPresenceDraft["store"]>,
    resetCity = false
  ) =>
    update((cur) => ({
      ...cur,
      store: {
        ...cur.store,
        ...patch,
        /* با تغییر استان، شهر قبلی بی‌معناست */
        ...(resetCity ? { city: "" } : {}),
      },
    }));

  const setLinksPublic = (v: boolean) =>
    update((cur) => ({ ...cur, linksPublic: v }));

  /* «بعدی» — ناعتبر: علامت‌گذاری فیلدها (بدون رفتن)؛ معتبر: هرس ردیف‌های
     خالی و رفتن به فرم «شروع فروش» */
  const onNext = () => {
    const store = useSellerOnboardingStore.getState();
    const v = validatePresenceDraft(store.presenceDraft, {
      sellerType: store.sellerTypeDraft ?? "individual",
      channels: store.sellChannelsDraft,
    });
    if (!v.ok) {
      setShowErrors(true);
      return;
    }
    store.setPresenceDraft(prunePresenceDraft(store.presenceDraft));
    push("sellerOnboarding");
  };

  const onExit = () => {
    setExitOpen(false);
    setRoot("home");
  };

  const cityOptions = citiesOf(presenceDraft.store.province);
  const inputBase =
    "h-11 rounded-xl border-white/10 bg-ls-card-2 text-sm placeholder:text-white/35";

  return (
    <div
      className="flex min-h-0 flex-1 flex-col"
      aria-label="حضور آنلاین"
    >
      {/* ── سربرگ: برگشت به مرحلهٔ ویژگی‌ها + خروج با تأیید ── */}
      <div className="flex items-center justify-between px-3 pt-3">
        <button
          type="button"
          onClick={back}
          aria-label={backLabel}
          className="flex h-11 w-11 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <ChevronRight className="h-5 w-5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => setExitOpen(true)}
          aria-label="خروج از ثبت‌نام فروشندگی"
          className="flex h-11 w-11 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>

      {/* ── عنوان و زیرعنوان ── */}
      <div className="px-4 pt-1">
        <h1 className="text-lg font-black leading-7">
          آدرس صفحه‌هایت را وارد کن
        </h1>
        <p className="mt-1.5 text-xs leading-5 text-white/55">
          تا فروشگاهت سریع‌تر بررسی شود. فقط تیم LiveShop می‌بیند مگر خودت
          نمایش عمومی را روشن کنی.
        </p>
      </div>

      {/* ── بخش‌ها (فقط مربوط به انتخاب مرحلهٔ ۴) ── */}
      <div
        className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-4 pt-4 [scrollbar-width:thin]"
        aria-label="فرم حضور آنلاین"
      >
        {/* وب‌سایت — یک فیلد URL */}
        {sections.includes("website") && (
          <section
            aria-label={SELL_CHANNEL_LABEL.website}
            className="space-y-2 rounded-2xl border border-white/10 bg-ls-card/60 p-4"
          >
            <h2 className="text-sm font-black">{SELL_CHANNEL_LABEL.website}</h2>
            <label
              htmlFor="presence-website"
              className="block text-[11px] font-bold text-white/55"
            >
              آدرس صفحه (URL)
            </label>
            <Input
              id="presence-website"
              dir="ltr"
              inputMode="url"
              autoComplete="url"
              value={presenceDraft.websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://example.com"
              aria-invalid={!!errors["website.url"]}
              aria-describedby={
                errors["website.url"] ? "presence-website-error" : undefined
              }
              className={cn(
                inputBase,
                "text-left",
                !!errors["website.url"] && "border-ls-pink/70"
              )}
            />
            {errors["website.url"] && (
              <p
                id="presence-website-error"
                role="alert"
                className="text-[10px] font-bold text-ls-pink"
              >
                {errors["website.url"]}
              </p>
            )}
          </section>
        )}

        {/* شبکه‌های اجتماعی و پیام‌رسان‌ها — تا ۵ ردیف */}
        {sections.includes("social") && (
          <section
            aria-label={SELL_CHANNEL_LABEL.social}
            className="space-y-3 rounded-2xl border border-white/10 bg-ls-card/60 p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-black">{SELL_CHANNEL_LABEL.social}</h2>
              <span className="text-[10px] text-white/40">
                تا {faNum(SOCIAL_ROWS_MAX)} ردیف
              </span>
            </div>
            {presenceDraft.social.map((row, i) => {
              const rowError = errors[`social.${row.id}.handle`];
              return (
                <div key={row.id} className="flex items-start gap-2">
                  <Select
                    value={row.platform}
                    onValueChange={(v) =>
                      updateSocialRow(row.id, { platform: v as SocialPlatformId })
                    }
                  >
                    <SelectTrigger
                      aria-label={`پلتفرم ردیف ${faNum(i + 1)}`}
                      className={cn(
                        inputBase,
                        "w-32 shrink-0 px-3",
                        !!rowError && "border-ls-pink/70"
                      )}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className={SELECT_CONTENT_CLS}>
                      {SOCIAL_PLATFORM_IDS.map((p) => (
                        <SelectItem
                          key={p}
                          value={p}
                          className="rounded-xl text-sm focus:bg-white/10"
                        >
                          {SOCIAL_PLATFORM_LABEL[p]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="min-w-0 flex-1 space-y-1">
                    <Input
                      dir="ltr"
                      value={row.handle}
                      onChange={(e) =>
                        updateSocialRow(row.id, { handle: e.target.value })
                      }
                      placeholder="@username یا لینک"
                      aria-label={`${SOCIAL_PLATFORM_LABEL[row.platform]} — نام کاربری یا لینک، ردیف ${faNum(i + 1)}`}
                      aria-invalid={!!rowError}
                      className={cn(
                        inputBase,
                        "text-left",
                        !!rowError && "border-ls-pink/70"
                      )}
                    />
                    {rowError && (
                      <p role="alert" className="text-[10px] font-bold text-ls-pink">
                        {rowError}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSocialRow(row.id)}
                    aria-label={`حذف ردیف ${faNum(i + 1)} شبکهٔ اجتماعی`}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 text-white/50 transition-colors hover:border-ls-pink/50 hover:text-ls-pink"
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              );
            })}
            {errors["social.section"] && (
              <p role="alert" className="text-[10px] font-bold text-ls-pink">
                {errors["social.section"]}
              </p>
            )}
            <button
              type="button"
              onClick={addSocialRow}
              disabled={presenceDraft.social.length >= SOCIAL_ROWS_MAX}
              aria-label="افزودن ردیف شبکهٔ اجتماعی"
              className="flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/15 text-xs font-bold text-white/60 transition-colors hover:border-ls-purple/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus className="h-4 w-4" aria-hidden />
              افزودن ردیف
            </button>
          </section>
        )}

        {/* فروشگاه یا انبار فیزیکی — استان/شهر + نشانی + تلفن اختیاری */}
        {sections.includes("physical_store") && (
          <section
            aria-label={SELL_CHANNEL_LABEL.physical_store}
            className="space-y-3 rounded-2xl border border-white/10 bg-ls-card/60 p-4"
          >
            <h2 className="text-sm font-black">
              {SELL_CHANNEL_LABEL.physical_store}
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label
                  htmlFor="presence-province"
                  className="block text-[11px] font-bold text-white/55"
                >
                  استان
                </label>
                <Select
                  value={presenceDraft.store.province}
                  onValueChange={(v) => setStoreField({ province: v }, true)}
                >
                  <SelectTrigger
                    id="presence-province"
                    aria-label="انتخاب استان"
                    aria-invalid={!!errors["store.province"]}
                    className={cn(
                      inputBase,
                      "w-full",
                      !!errors["store.province"] && "border-ls-pink/70"
                    )}
                  >
                    <SelectValue placeholder="انتخاب استان" />
                  </SelectTrigger>
                  <SelectContent className={SELECT_CONTENT_CLS}>
                    {PROVINCES.map((p) => (
                      <SelectItem
                        key={p.id}
                        value={p.name}
                        className="rounded-xl text-sm focus:bg-white/10"
                      >
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors["store.province"] && (
                  <p role="alert" className="text-[10px] font-bold text-ls-pink">
                    {errors["store.province"]}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="presence-city"
                  className="block text-[11px] font-bold text-white/55"
                >
                  شهر
                </label>
                <Select
                  value={presenceDraft.store.city}
                  onValueChange={(v) => setStoreField({ city: v })}
                  disabled={!presenceDraft.store.province}
                >
                  <SelectTrigger
                    id="presence-city"
                    aria-label="انتخاب شهر"
                    aria-invalid={!!errors["store.city"]}
                    className={cn(
                      inputBase,
                      "w-full",
                      !!errors["store.city"] && "border-ls-pink/70"
                    )}
                  >
                    <SelectValue placeholder="انتخاب شهر" />
                  </SelectTrigger>
                  <SelectContent className={SELECT_CONTENT_CLS}>
                    {cityOptions.map((c) => (
                      <SelectItem
                        key={c}
                        value={c}
                        className="rounded-xl text-sm focus:bg-white/10"
                      >
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors["store.city"] && (
                  <p role="alert" className="text-[10px] font-bold text-ls-pink">
                    {errors["store.city"]}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <label
                htmlFor="presence-address"
                className="block text-[11px] font-bold text-white/55"
              >
                نشانی کامل
              </label>
              <Textarea
                id="presence-address"
                rows={2}
                value={presenceDraft.store.address}
                onChange={(e) => setStoreField({ address: e.target.value })}
                placeholder="مثلاً خیابان ولیعصر، پاساژ نگین، پلاک ۱۲، واحد ۳"
                aria-invalid={!!errors["store.address"]}
                aria-describedby={
                  errors["store.address"] ? "presence-address-error" : undefined
                }
                className={cn(
                  "rounded-xl border-white/10 bg-ls-card-2 text-sm placeholder:text-white/35",
                  !!errors["store.address"] && "border-ls-pink/70"
                )}
              />
              {errors["store.address"] && (
                <p
                  id="presence-address-error"
                  role="alert"
                  className="text-[10px] font-bold text-ls-pink"
                >
                  {errors["store.address"]}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <label
                htmlFor="presence-phone"
                className="block text-[11px] font-bold text-white/55"
              >
                تلفن <span className="text-white/40">(اختیاری)</span>
              </label>
              <Input
                id="presence-phone"
                dir="ltr"
                inputMode="tel"
                value={presenceDraft.store.phone}
                onChange={(e) => setStoreField({ phone: e.target.value })}
                placeholder="02112345678"
                aria-invalid={!!errors["store.phone"]}
                aria-describedby={
                  errors["store.phone"] ? "presence-phone-error" : undefined
                }
                className={cn(
                  inputBase,
                  "text-left tabular-nums",
                  !!errors["store.phone"] && "border-ls-pink/70"
                )}
              />
              {errors["store.phone"] && (
                <p
                  id="presence-phone-error"
                  role="alert"
                  className="text-[10px] font-bold text-ls-pink"
                >
                  {errors["store.phone"]}
                </p>
              )}
            </div>
          </section>
        )}

        {/* بازارهای آنلاین دیگر — تا ۵ ردیف لینک */}
        {sections.includes("other_platforms") && (
          <section
            aria-label={SELL_CHANNEL_LABEL.other_platforms}
            className="space-y-3 rounded-2xl border border-white/10 bg-ls-card/60 p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-black">
                {SELL_CHANNEL_LABEL.other_platforms}
              </h2>
              <span className="text-[10px] text-white/40">
                تا {faNum(OTHER_ROWS_MAX)} ردیف
              </span>
            </div>
            {presenceDraft.otherPlatforms.map((row, i) => {
              const rowError = errors[`other.${row.id}.url`];
              return (
                <div key={row.id} className="flex items-start gap-2">
                  <Select
                    value={row.platform}
                    onValueChange={(v) =>
                      updateOtherRow(row.id, { platform: v as OtherPlatformId })
                    }
                  >
                    <SelectTrigger
                      aria-label={`بازار ردیف ${faNum(i + 1)}`}
                      className={cn(
                        inputBase,
                        "w-32 shrink-0 px-3",
                        !!rowError && "border-ls-pink/70"
                      )}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className={SELECT_CONTENT_CLS}>
                      {OTHER_PLATFORM_IDS.map((p) => (
                        <SelectItem
                          key={p}
                          value={p}
                          className="rounded-xl text-sm focus:bg-white/10"
                        >
                          {OTHER_PLATFORM_LABEL[p]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="min-w-0 flex-1 space-y-1">
                    <Input
                      dir="ltr"
                      inputMode="url"
                      value={row.url}
                      onChange={(e) =>
                        updateOtherRow(row.id, { url: e.target.value })
                      }
                      placeholder="https://..."
                      aria-label={`${OTHER_PLATFORM_LABEL[row.platform]} — لینک، ردیف ${faNum(i + 1)}`}
                      aria-invalid={!!rowError}
                      className={cn(
                        inputBase,
                        "text-left",
                        !!rowError && "border-ls-pink/70"
                      )}
                    />
                    {rowError && (
                      <p role="alert" className="text-[10px] font-bold text-ls-pink">
                        {rowError}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeOtherRow(row.id)}
                    aria-label={`حذف ردیف ${faNum(i + 1)} بازار آنلاین`}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 text-white/50 transition-colors hover:border-ls-pink/50 hover:text-ls-pink"
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              );
            })}
            {errors["other.section"] && (
              <p role="alert" className="text-[10px] font-bold text-ls-pink">
                {errors["other.section"]}
              </p>
            )}
            <button
              type="button"
              onClick={addOtherRow}
              disabled={presenceDraft.otherPlatforms.length >= OTHER_ROWS_MAX}
              aria-label="افزودن ردیف بازار آنلاین"
              className="flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/15 text-xs font-bold text-white/60 transition-colors hover:border-ls-purple/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus className="h-4 w-4" aria-hidden />
              افزودن ردیف
            </button>
          </section>
        )}

        {/* سوئیچ نمایش عمومی */}
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-ls-card/60 p-4">
          <div className="min-w-0">
            <p className="text-xs font-black text-white/90">
              نمایش لینک‌ها در پروفایل فروشگاه
            </p>
            <p className="mt-0.5 text-[10px] leading-4 text-white/50">
              تا وقتی خاموش است فقط تیم LiveShop لینک‌ها را می‌بیند.
            </p>
          </div>
          <Switch
            checked={presenceDraft.linksPublic}
            onCheckedChange={setLinksPublic}
            aria-label="نمایش لینک‌ها در پروفایل فروشگاه"
          />
        </div>
      </div>

      {/* ── نوار پایین ثابت: پیشرفت + بعدی ── */}
      <div className="shrink-0 border-t border-white/5 bg-ls-bg/95 px-4 pb-[max(env(safe-area-inset-bottom),16px)] pt-3 backdrop-blur-md">
        <div className="mb-3 flex items-center gap-3">
          <div
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={WIZARD_TOTAL_STEPS}
            aria-valuenow={WIZARD_STEP}
            aria-label={`مرحلهٔ ${faNum(WIZARD_STEP)} از ${faNum(WIZARD_TOTAL_STEPS)} ثبت‌نام فروشندگی`}
            className="flex flex-1 gap-1.5"
          >
            {Array.from({ length: WIZARD_TOTAL_STEPS }).map((_, i) => (
              <span
                key={i}
                aria-hidden
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors",
                  i < WIZARD_STEP ? "bg-ls-purple" : "bg-white/10"
                )}
              />
            ))}
          </div>
          <span className="shrink-0 text-[11px] font-bold text-white/60">
            مرحله {faNum(WIZARD_STEP)} از {faNum(WIZARD_TOTAL_STEPS)}
          </span>
        </div>
        {/* نامعتبر: غیرفعال به‌نظر می‌رسد ولی لمس‌پذیر است تا فیلدها
            حاشیهٔ قرمز و پیام بگیرند — aria-disabled برای صفحه‌خوان */}
        <button
          type="button"
          onClick={onNext}
          aria-disabled={!validation.ok}
          aria-label={
            validation.ok
              ? "بعدی — رفتن به فرم شروع فروش"
              : "بعدی — تکمیل یا اصلاح فیلدهای علامت‌خورده"
          }
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-black transition-all active:scale-[.99]",
            validation.ok
              ? "bg-ls-pink text-white shadow-lg shadow-ls-pink/30 hover:bg-ls-pink/90"
              : "cursor-not-allowed bg-ls-card-2 text-white/40"
          )}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          بعدی
        </button>
      </div>

      {/* ── خروج با تأیید (همان دیالوگ مراحل قبلی) ── */}
      <AlertDialog open={exitOpen} onOpenChange={setExitOpen}>
        <AlertDialogContent dir="rtl" className="max-w-sm rounded-2xl border-white/10 bg-ls-card text-right">
          <AlertDialogHeader className="space-y-2 text-right">
            <AlertDialogTitle className="text-base font-black">
              از ثبت‌نام فروشندگی خارج می‌شوی؟
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs leading-5 text-white/65">
              پیشرفتت ذخیره می‌شود — انتخاب دسته‌هایت می‌ماند و با برگشتن از
              همین‌جا ادامه می‌دهی.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogAction
              onClick={onExit}
              aria-label="خروج از ثبت‌نام"
              className="flex-1 rounded-xl bg-ls-pink text-sm font-black text-white hover:bg-ls-pink/90"
            >
              خروج
            </AlertDialogAction>
            <AlertDialogCancel
              aria-label="ادامهٔ ثبت‌نام"
              className="flex-1 rounded-xl border-white/10 bg-ls-card-2 text-sm font-extrabold text-white/80 hover:text-white"
            >
              ادامه
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
