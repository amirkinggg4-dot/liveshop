/* ─────────────────────────────────────────────────────────────
   تست‌های واحد v1.9.1 — کدپستی اجباری در فرم آدرس (validateAddress)
   فرمول اعتبارسنجی کدپستی همان قبلی است (validatePostalCodeFa) —
   فقط «خالی» دیگر مجاز نیست.
   ───────────────────────────────────────────────────────────── */

import { describe, expect, test } from "bun:test";
import {
  POSTAL_REQUIRED_MESSAGE,
  validateAddress,
  type AddressInput,
} from "@/store/addresses-store";

const VALID: AddressInput = {
  recipient: "علی رضایی",
  phone: "۰۹۱۲۱۲۳۴۵۶۷",
  province: "تهران",
  city: "تهران",
  line: "خیابان ولیعصر، پلاک ۶۴",
  postalCode: "۱۹۶۵۸۴۳۱۵۷",
};

describe("validateAddress — کدپستی اجباری", () => {
  test("آدرس کامل با کدپستی معتبر (فارسی) قبول می‌شود و نرمال لاتین برمی‌گردد", () => {
    const r = validateAddress(VALID);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.postalCode).toBe("1965843157");
  });

  test("کدپستی خالی رد می‌شود", () => {
    const r = validateAddress({ ...VALID, postalCode: "" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.postalCode).toBe(POSTAL_REQUIRED_MESSAGE);
  });

  test("کدپستی فقط فاصله رد می‌شود", () => {
    const r = validateAddress({ ...VALID, postalCode: "   " });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.postalCode).toBe(POSTAL_REQUIRED_MESSAGE);
  });

  test("کدپستی کوتاه‌تر از ۱۰ رقم با همان فرمول قبلی رد می‌شود", () => {
    const r = validateAddress({ ...VALID, postalCode: "196584315" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.postalCode).toBe("کدپستی باید ۱۰ رقم باشد");
  });

  test("کدپستی شروع با صفر رد می‌شود (فرمول قبلی)", () => {
    const r = validateAddress({ ...VALID, postalCode: "0965843157" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.postalCode).toBe("کدپستی نمی‌تواند با صفر شروع شود");
  });

  test("خطای کدپستی با سایر خطاها جمع می‌شود (همه با هم نمایش داده می‌شوند)", () => {
    const r = validateAddress({
      ...VALID,
      recipient: "",
      postalCode: "",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.recipient).toBeTruthy();
      expect(r.errors.postalCode).toBe(POSTAL_REQUIRED_MESSAGE);
    }
  });
});
