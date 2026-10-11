"use client";

import { create } from "zustand";
import {
  validatePhoneFa,
  validatePostalCodeFa,
  validateRequiredFa,
  type RequiredValidation,
} from "@/lib/account-validate";
import { citiesOf } from "@/lib/data/provinces";

/* ─────────────────────────────────────────────────────────────
   LiveShop v1.9.0 — استور آدرس‌های خریدار (CRUD mock حافظه‌ای)
   ─ seed هماهنگ با دموی موجود: آدرس پیش‌فرض همان DEFAULT_ADDRESS
     در src/lib/data/orders.ts است (گیرنده/موبایل/نشانی) و یک
     آدرس دوم غیرپیش‌فرض در اصفهان
   ─ ذخیره‌سازی نرمال: موبایل و کدپستی همیشه لاتین (نمایش فارسی
     در UI با toFa انجام می‌شود)
   ─ قواعد: اولین آدرس خودکار پیش‌فرض می‌شود؛ اگر پیش‌فرض حذف شود
     قدیمی‌ترین باقی‌مانده (اول فهرست) پیش‌فرض می‌شود؛ در هر لحظه
     حداکثر یک آدرس پیش‌فرض وجود دارد
   ─ validateAddress تابع خالص است (بدون وابستگی به استور) تا
     تست‌پذیر بماند و بعداً همین منطق به API منتقل شود

   این فایل مستقل است — اتصال Checkout/quick-checkout در تسک بعدی.
   ───────────────────────────────────────────────────────────── */

export interface Address {
  id: string;
  recipient: string;
  phone: string;
  province: string;
  city: string;
  line: string;
  postalCode: string;
  isDefault: boolean;
}

/** فیلدهای قابل‌ویرایش آدرس (id و isDefault را استور مدیریت می‌کند) */
export type AddressInput = Omit<Address, "id" | "isDefault">;

export type AddressField = keyof AddressInput;

/** خطاهای فرم آدرس — کلید = فیلد، مقدار = پیام فارسی */
export type AddressErrors = Partial<Record<AddressField, string>>;

export type AddressValidation =
  | { ok: true; value: AddressInput }
  | { ok: false; errors: AddressErrors };

/** پیام شهر خارج از فهرست استان — تک منبع برای UI */
export const CITY_NOT_IN_PROVINCE_MESSAGE =
  "شهر را از فهرست استان انتخاب کن";

/* ── seed: آدرس پیش‌فرض دموی فعلی + یک آدرس دوم در اصفهان ──
   موبایل و کدپستی به شکل لاتین ذخیره می‌شوند (۰۹۱۲ ۴۵۶ ۷۸۹۰ →
   09121234567 و ۱۹۶۵۸۴۳۱۵۷ → 1965843157) */
const SEED_ADDRESSES: Address[] = [
  {
    id: "addr-1",
    recipient: "علی رضایی",
    phone: "09121234567",
    province: "تهران",
    city: "تهران",
    line: "خیابان ولیعصر، کوچهٔ یاس، پلاک ۶۴، واحد ۳",
    postalCode: "1965843157",
    isDefault: true,
  },
  {
    id: "addr-2",
    recipient: "سارا محمدی",
    phone: "09131112233",
    province: "اصفهان",
    city: "اصفهان",
    line: "خیابان چهارباغ بالا، کوچهٔ گل‌ها، پلاک ۱۲",
    postalCode: "8173745123",
    isDefault: false,
  },
];

/* شمارندهٔ id آدرس‌های جدید — seed دست‌نخورده می‌ماند */
let createdCount = 0;

function nextAddressId(): string {
  createdCount += 1;
  return `addr-user-${createdCount}`;
}

/* استخراج مقدار موفق اعتبارسنجی اجباری — فقط بعد از رد شدن شاخهٔ
   خطا صدا زده می‌شود (در مسیر موفق همهٔ فیلدها ok هستند) */
function unwrapRequired(v: RequiredValidation): string {
  return v.ok ? v.value : "";
}

/* ─────────────────────────────────────────────────────────────
   validateAddress — اعتبارسنجی خالص فرم آدرس با پیام‌های فارسی
   ─ اجباری‌ها: گیرنده، استان، شهر، نشانی (validateRequiredFa)
   ─ موبایل: validatePhoneFa → نرمال 09xxxxxxxxx (لاتین)
   ─ کدپستی: اجباری نیست؛ فقط اگر چیزی وارد شده باشد
     validatePostalCodeFa اجرا می‌شود → لاتین ۱۰ رقمی
   ─ شهر باید از فهرست شهرهای همان استان (citiesOf) باشد
   ───────────────────────────────────────────────────────────── */
export function validateAddress(input: AddressInput): AddressValidation {
  const errors: AddressErrors = {};

  const recipient = validateRequiredFa(input.recipient, "نام گیرنده");
  if (!recipient.ok) errors.recipient = recipient.message;

  const province = validateRequiredFa(input.province, "استان");
  if (!province.ok) errors.province = province.message;

  const city = validateRequiredFa(input.city, "شهر");
  if (!city.ok) {
    errors.city = city.message;
  } else if (province.ok) {
    /* شهر باید از فهرست شهرهای همان استان انتخاب شده باشد */
    const cities = citiesOf(province.value);
    if (cities.length > 0 && !cities.includes(city.value)) {
      errors.city = CITY_NOT_IN_PROVINCE_MESSAGE;
    }
  }

  const line = validateRequiredFa(input.line, "نشانی");
  if (!line.ok) errors.line = line.message;

  const phone = validatePhoneFa(input.phone);
  if (!phone.ok) errors.phone = phone.message;

  /* کدپستی اختیاری است — فقط اگر پر شده باشد قواعدش بررسی می‌شود */
  const postal = validatePostalCodeFa(input.postalCode);
  if (!postal.ok && input.postalCode.trim()) {
    errors.postalCode = postal.message;
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  /* همهٔ متن‌ها trim شده؛ موبایل/کدپستی نرمال لاتین ذخیره می‌شوند */
  return {
    ok: true,
    value: {
      recipient: unwrapRequired(recipient),
      phone: phone.ok ? phone.phone : input.phone.trim(),
      province: unwrapRequired(province),
      city: unwrapRequired(city),
      line: unwrapRequired(line),
      postalCode: postal.ok ? postal.postalCode : input.postalCode.trim(),
    },
  };
}

/* ─────────────────────────────────────────────────────────────
   استور — الگوی CRUD مثل seller-inventory-store
   ───────────────────────────────────────────────────────────── */

interface AddressesState {
  addresses: Address[];
  /** افزودن آدرس — بدون id/isDefault؛ اگر اولین آدرس باشد خودکار پیش‌فرض می‌شود */
  addAddress: (data: AddressInput) => Address;
  /** ویرایش فیلدهای آدرس (patch شامل id/isDefault نمی‌شود) */
  updateAddress: (id: string, patch: Partial<AddressInput>) => void;
  /** حذف آدرس — اگر پیش‌فرض حذف شود، قدیمی‌ترین باقی‌مانده پیش‌فرض می‌شود */
  deleteAddress: (id: string) => void;
  /** انتخاب پیش‌فرض — پیش‌فرض قبلی برداشته می‌شود */
  setDefault: (id: string) => void;
}

export const useAddressesStore = create<AddressesState>((set, get) => ({
  addresses: SEED_ADDRESSES.map((a) => ({ ...a })),

  addAddress: (data) => {
    const address: Address = {
      ...data,
      id: nextAddressId(),
      /* اولین آدرس حساب همیشه پیش‌فرض است */
      isDefault: get().addresses.length === 0,
    };
    set((s) => ({ addresses: [...s.addresses, address] }));
    return address;
  },

  updateAddress: (id, patch) =>
    set((s) => ({
      addresses: s.addresses.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    })),

  deleteAddress: (id) =>
    set((s) => {
      const removed = s.addresses.find((a) => a.id === id);
      const rest = s.addresses.filter((a) => a.id !== id);
      /* پیش‌فرض حذف شد → قدیمی‌ترین باقی‌مانده (اول فهرست) پیش‌فرض می‌شود */
      if (removed?.isDefault && rest.length > 0) {
        return {
          addresses: rest.map((a, i) =>
            i === 0 ? { ...a, isDefault: true } : a
          ),
        };
      }
      return { addresses: rest };
    }),

  setDefault: (id) => {
    /* id ناموجود → هیچ تغییری (همیشه حداقل یک پیش‌فرض باقی می‌ماند) */
    if (!get().addresses.some((a) => a.id === id)) return;
    set((s) => ({
      addresses: s.addresses.map((a) => ({ ...a, isDefault: a.id === id })),
    }));
  },
}));

/* ── سلکتور پیش‌فرض — خواندن آدرس پیش‌فرض ──
   React:  useAddressesStore(selectDefaultAddress)
   خارج از React:  selectDefaultAddress(useAddressesStore.getState())
   مرجع خروجی پایدار است (شیء آدرس یا null) تا رندر اضافی رخ ندهد */
export function selectDefaultAddress(state: AddressesState): Address | null {
  return state.addresses.find((a) => a.isDefault) ?? null;
}
