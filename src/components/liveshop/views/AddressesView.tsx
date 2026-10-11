"use client";

import { useState, type ReactNode } from "react";
import { MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAppStore } from "@/store/app-store";
import {
  useAddressesStore,
  validateAddress,
  type Address,
  type AddressErrors,
  type AddressInput,
} from "@/store/addresses-store";
import { PROVINCES, citiesOf } from "@/lib/data/provinces";
import { toFa } from "@/lib/format";
import { PageHeader, EmptyState } from "@/components/liveshop/shared";

/* ─────────────────────────────────────────────────────────────
   آدرس‌ها — v1.9.0 (فهرست/افزودن/ویرایش/حذف/پیش‌فرض)
   ─ فهرست کارت‌ها: گیرنده + بج پیش‌فرض + نشانی (حداکثر ۲ خط) +
     موبایل ltr + ویرایش/حذف + «انتخاب پیش‌فرض» برای غیرپیش‌فرض
   ─ فرم افزودن/ویرایش در Sheet پایین با انتخاب استان → شهر وابسته
     (تغییر استان شهر را ریست می‌کند) و خطای قرمز زیر هر فیلد
   ─ حذف با دیالوگ تأیید؛ حالت خالی با EmptyState (آیکون MapPin)
   ─ دیتا از addresses-store (CRUD mock) — ذخیرهٔ موبایل/کدپستی لاتین
   ───────────────────────────────────────────────────────────── */

const EMPTY_FORM: AddressInput = {
  recipient: "",
  phone: "",
  province: "",
  city: "",
  line: "",
  postalCode: "",
};

/* نمایش موبایل به شکل دموی موجود — 09121234567 → ۰۹۱۲ ۱۲۳ ۴۵۶۷ */
function displayPhone(phone: string): string {
  const grouped =
    phone.length === 11
      ? `${phone.slice(0, 4)} ${phone.slice(4, 7)} ${phone.slice(7)}`
      : phone;
  return toFa(grouped);
}

/* برچسب سبز «پیش‌فرض» — هم‌شکل StatusChip سبز (bg-ls-green) */
function DefaultBadge() {
  return (
    <span className="shrink-0 rounded-full bg-ls-green px-2 py-0.5 text-[10px] font-extrabold text-[#04281e]">
      پیش‌فرض
    </span>
  );
}

function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefault,
}: {
  address: Address;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
}) {
  return (
    <article
      aria-label={`آدرس ${address.recipient}`}
      className="rounded-2xl border border-white/5 bg-ls-card p-3.5"
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-bold">{address.recipient}</p>
            {address.isDefault && <DefaultBadge />}
          </div>
          {/* یک خط نشانی — حداکثر ۲ خط */}
          <p className="mt-1 break-words text-xs leading-5 text-white/60 line-clamp-2">
            {address.city}، {address.line}
          </p>
          <p className="mt-1 text-xs tabular-nums text-white/45" dir="ltr">
            {displayPhone(address.phone)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={onEdit}
            aria-label={`ویرایش آدرس ${address.recipient}`}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 text-white/70 transition-colors hover:bg-white/5 active:scale-[.97]"
          >
            <Pencil className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label={`حذف آدرس ${address.recipient}`}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-400/20 text-red-400 transition-colors hover:bg-red-400/10 active:scale-[.97]"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
      {/* انتخاب پیش‌فرض — فقط برای آدرس غیرپیش‌فرض */}
      {!address.isDefault && (
        <div className="mt-2.5 border-t border-white/5 pt-2.5">
          <button
            type="button"
            onClick={onSetDefault}
            aria-label={`انتخاب آدرس ${address.recipient} به‌عنوان پیش‌فرض`}
            className="flex min-h-11 items-center gap-1.5 rounded-lg px-1.5 text-xs font-bold text-white/60 transition-colors hover:text-amber-300 active:scale-[.98]"
          >
            <Star className="h-3.5 w-3.5" aria-hidden />
            انتخاب پیش‌فرض
          </button>
        </div>
      )}
    </article>
  );
}

/* فیلد فرم با برچسب و خطای قرمز زیر آن */
function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <section aria-label={label}>
      <label
        htmlFor={htmlFor}
        className="mb-2 block text-sm font-extrabold text-white/90"
      >
        {label}
      </label>
      {children}
      {error && (
        <p role="alert" className="mt-1.5 text-xs font-bold text-red-400">
          {error}
        </p>
      )}
    </section>
  );
}

/* کلاس مشترک ورودی‌های فرم — هم‌سایر صفحات (bg-ls-card) */
const inputCls =
  "h-11 bg-ls-card border-white/10 text-sm data-[placeholder]:text-white/40";

export default function AddressesView() {
  const back = useAppStore((s) => s.back);
  const addresses = useAddressesStore((s) => s.addresses);
  const addAddress = useAddressesStore((s) => s.addAddress);
  const updateAddress = useAddressesStore((s) => s.updateAddress);
  const deleteAddress = useAddressesStore((s) => s.deleteAddress);
  const setDefault = useAddressesStore((s) => s.setDefault);

  /* شیت فرم — editingId = null یعنی افزودن */
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AddressInput>(EMPTY_FORM);
  const [errors, setErrors] = useState<AddressErrors>({});
  /* دیالوگ تأیید حذف — id آدرس هدف */
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  /* شهرهای استان انتخاب‌شده (Select شهر وابسته به استان است) */
  const cities = form.province ? citiesOf(form.province) : [];

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setSheetOpen(true);
  };

  const openEdit = (a: Address) => {
    setEditingId(a.id);
    setForm({
      recipient: a.recipient,
      phone: a.phone,
      province: a.province,
      city: a.city,
      line: a.line,
      postalCode: a.postalCode,
    });
    setErrors({});
    setSheetOpen(true);
  };

  const saveAddress = () => {
    const result = validateAddress(form);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    if (editingId) {
      updateAddress(editingId, result.value);
    } else {
      addAddress(result.value);
    }
    toast.success("آدرس ذخیره شد");
    setSheetOpen(false);
  };

  const confirmDelete = () => {
    if (!deleteTargetId) return;
    deleteAddress(deleteTargetId);
    setDeleteTargetId(null);
    toast.success("آدرس حذف شد");
  };

  const makeDefault = (id: string) => {
    setDefault(id);
    toast.success("آدرس پیش‌فرض شد");
  };

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="آدرس‌ها"
        subtitle={`${toFa(addresses.length)} آدرس`}
        onBack={back}
      />

      <div className="flex-1 space-y-3 px-4 pb-6 pt-4">
        {addresses.length > 0 ? (
          <>
            <div className="space-y-3" aria-label="فهرست آدرس‌ها">
              {addresses.map((a) => (
                <AddressCard
                  key={a.id}
                  address={a}
                  onEdit={() => openEdit(a)}
                  onDelete={() => setDeleteTargetId(a.id)}
                  onSetDefault={() => makeDefault(a.id)}
                />
              ))}
            </div>
            {/* دکمهٔ ثابت پایین فهرست */}
            <button
              type="button"
              onClick={openAdd}
              aria-label="افزودن آدرس جدید"
              className="sticky bottom-4 z-20 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-ls-purple text-sm font-extrabold text-white shadow-lg shadow-ls-purple/30 transition-colors hover:bg-ls-purple-deep active:scale-[.99]"
            >
              <Plus className="h-5 w-5" aria-hidden />
              افزودن آدرس جدید
            </button>
          </>
        ) : (
          <EmptyState
            lucide={MapPin}
            title="هنوز آدرسی ثبت نکردی"
            desc="برای ارسال سفارش‌ها یک آدرس پستی اضافه کن."
            action={
              <button
                type="button"
                onClick={openAdd}
                aria-label="افزودن آدرس جدید"
                className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-ls-purple px-6 text-sm font-extrabold text-white shadow-lg shadow-ls-purple/30 transition-colors hover:bg-ls-purple-deep active:scale-[.99]"
              >
                <Plus className="h-5 w-5" aria-hidden />
                افزودن آدرس جدید
              </button>
            }
          />
        )}
      </div>

      {/* ═══ شیت فرم افزودن/ویرایش آدرس ═══ */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[88dvh] overflow-y-auto rounded-t-3xl border-white/10 bg-ls-bg px-0 pb-[max(env(safe-area-inset-bottom),16px)] pt-2"
          aria-describedby={undefined}
        >
          <span
            className="mx-auto mb-1 block h-1 w-10 rounded-full bg-white/20"
            aria-hidden
          />
          <SheetHeader className="px-4 text-right">
            <SheetTitle className="text-base font-extrabold text-white">
              {editingId ? "ویرایش آدرس" : "افزودن آدرس جدید"}
            </SheetTitle>
            <SheetDescription className="sr-only">
              فرم آدرس پستی برای ارسال سفارش‌ها
            </SheetDescription>
          </SheetHeader>

          <form
            className="space-y-4 px-4 pb-2 pt-1"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              saveAddress();
            }}
          >
            {/* گیرنده */}
            <Field label="نام گیرنده" htmlFor="addr-recipient" error={errors.recipient}>
              <Input
                id="addr-recipient"
                value={form.recipient}
                onChange={(e) =>
                  setForm((f) => ({ ...f, recipient: e.target.value }))
                }
                placeholder="مثلاً علی رضایی"
                aria-label="نام گیرنده"
                aria-invalid={!!errors.recipient}
                className={`${inputCls} bg-ls-card`}
              />
            </Field>

            {/* موبایل */}
            <Field label="شمارهٔ موبایل" htmlFor="addr-phone" error={errors.phone}>
              <Input
                id="addr-phone"
                dir="ltr"
                inputMode="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="۰۹۱۲۱۲۳۴۵۶۷"
                aria-label="شمارهٔ موبایل گیرنده"
                aria-invalid={!!errors.phone}
                className={`${inputCls} bg-ls-card text-left tabular-nums`}
              />
            </Field>

            {/* استان */}
            <Field label="استان" htmlFor="addr-province" error={errors.province}>
              <Select
                value={form.province || undefined}
                onValueChange={(province) =>
                  /* تغییر استان شهر قبلی بی‌معنا می‌شود — ریست می‌کنیم */
                  setForm((f) => ({ ...f, province, city: "" }))
                }
              >
                <SelectTrigger
                  id="addr-province"
                  aria-label="انتخاب استان"
                  aria-invalid={!!errors.province}
                  className={`${inputCls} w-full bg-ls-card`}
                >
                  <SelectValue placeholder="انتخاب استان" />
                </SelectTrigger>
                <SelectContent className="max-h-72 rounded-2xl border-white/10 bg-ls-card text-white">
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
            </Field>

            {/* شهر — وابسته به استان */}
            <Field label="شهر" htmlFor="addr-city" error={errors.city}>
              <Select
                disabled={!form.province}
                value={form.city || undefined}
                onValueChange={(city) => setForm((f) => ({ ...f, city }))}
              >
                <SelectTrigger
                  id="addr-city"
                  aria-label="انتخاب شهر"
                  aria-invalid={!!errors.city}
                  className={`${inputCls} w-full bg-ls-card`}
                >
                  <SelectValue
                    placeholder={form.province ? "انتخاب شهر" : "اول استان را انتخاب کن"}
                  />
                </SelectTrigger>
                <SelectContent className="max-h-72 rounded-2xl border-white/10 bg-ls-card text-white">
                  {cities.map((c) => (
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
            </Field>

            {/* نشانی */}
            <Field label="نشانی کامل" htmlFor="addr-line" error={errors.line}>
              <Textarea
                id="addr-line"
                rows={3}
                value={form.line}
                onChange={(e) => setForm((f) => ({ ...f, line: e.target.value }))}
                placeholder="خیابان، کوچه، پلاک، واحد"
                aria-label="نشانی کامل پستی"
                aria-invalid={!!errors.line}
                className="min-h-24 bg-ls-card border-white/10 text-sm"
              />
            </Field>

            {/* کدپستی */}
            <Field
              label="کد پستی (اختیاری)"
              htmlFor="addr-postal"
              error={errors.postalCode}
            >
              <Input
                id="addr-postal"
                dir="ltr"
                inputMode="numeric"
                value={form.postalCode}
                onChange={(e) =>
                  setForm((f) => ({ ...f, postalCode: e.target.value }))
                }
                placeholder="۱۹۶۵۸۴۳۱۵۷"
                aria-label="کد پستی ده‌رقمی"
                aria-invalid={!!errors.postalCode}
                className={`${inputCls} bg-ls-card text-left tabular-nums`}
              />
            </Field>

            {/* ذخیره */}
            <button
              type="submit"
              aria-label="ذخیرهٔ آدرس"
              className="flex h-12 w-full items-center justify-center rounded-2xl bg-ls-purple text-sm font-extrabold text-white shadow-lg shadow-ls-purple/30 transition-colors hover:bg-ls-purple-deep active:scale-[.99]"
            >
              ذخیره آدرس
            </button>
          </form>
        </SheetContent>
      </Sheet>

      {/* ═══ دیالوگ تأیید حذف آدرس ═══ */}
      <AlertDialog
        open={deleteTargetId != null}
        onOpenChange={(v) => !v && setDeleteTargetId(null)}
      >
        <AlertDialogContent className="rounded-2xl border-white/10 bg-ls-card sm:max-w-sm">
          <AlertDialogHeader className="text-right sm:text-right">
            <AlertDialogTitle>این آدرس حذف شود؟</AlertDialogTitle>
            <AlertDialogDescription className="text-xs leading-5">
              آدرس حذف‌شده برگشت‌پذیر نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2 sm:justify-start">
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
              aria-label="تأیید حذف آدرس"
            >
              حذف کن
            </AlertDialogAction>
            <AlertDialogCancel className="border-white/15 bg-transparent text-white/70">
              منصرف شدم
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
