"use client";

/* ─────────────────────────────────────────────────────────────
   v1.7.0 — ورودی عددی فارسی با جداکنندهٔ هزارگان + پسوند واحد
   منبع حقیقت همیشه یک عدد صحیح است؛ حین تایپ ارقام فارسی/لاتین
   پذیرفته می‌شود، بقیهٔ کاراکترها حذف و نمایش «۶٬۵۰۰٬۰۰۰» فرمت می‌شود.
   ───────────────────────────────────────────────────────────── */

import { digitsOnlyFa, formatFaThousands } from "@/lib/fa-number";
import { cn } from "@/lib/utils";

export function FaNumberInput({
  value,
  onValueChange,
  suffix,
  className,
  inputClassName,
  placeholder = "۰",
  ariaLabel,
  id,
  disabled,
}: {
  value: number;
  onValueChange: (n: number) => void;
  /** پسوند واحد مثل «تومان» یا «گرم» — کوچک و کم‌رنگ داخل کادر */
  suffix?: string;
  className?: string;
  inputClassName?: string;
  placeholder?: string;
  ariaLabel: string;
  id?: string;
  disabled?: boolean;
}) {
  const display = value > 0 ? formatFaThousands(value) : "";

  return (
    <div className={cn("relative", className)}>
      <input
        id={id}
        dir="ltr"
        inputMode="numeric"
        type="text"
        disabled={disabled}
        aria-label={ariaLabel}
        value={display}
        placeholder={placeholder}
        onChange={(e) => onValueChange(Number(digitsOnlyFa(e.target.value) || "0"))}
        className={cn(
          "h-10 w-full rounded-xl border border-white/10 bg-ls-card-2 text-left text-sm tabular-nums outline-none focus:border-ls-purple/60 transition-colors disabled:opacity-60",
          suffix && "pl-16",
          inputClassName
        )}
      />
      {suffix && (
        <span
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white/40"
          aria-hidden
        >
          {suffix}
        </span>
      )}
    </div>
  );
}
