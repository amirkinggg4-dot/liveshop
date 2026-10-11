"use client";

/* ═══════════════════════════════════════════════════════════════════════════
   v1.8.0 — «تماس با فروشنده» — رشتهٔ پیام ساده mock داخل همان سفارش
   پیام‌ها در خود سفارش ذخیره می‌شوند (orders-store) و پاسخ فروشنده
   mock با تأخیر کوتاه می‌آید.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useState } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OrderMessage } from "@/lib/data/types";
import { useOrdersStore } from "@/store/orders-store";
import { StepTime } from "@/components/liveshop/order-ui";
import { Avatar } from "@/components/liveshop/shared";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";

/* اسنپ‌شات پایدار برای حالت «بدون پیام» — آرایهٔ نو نسازیم (حلقهٔ رندر) */
const EMPTY_MESSAGES: OrderMessage[] = [];

export default function OrderContactSheet({
  orderId,
  sellerName,
  sellerEmoji,
  sellerColor,
  open,
  onOpenChange,
}: {
  orderId: string;
  sellerName: string;
  sellerEmoji: string;
  sellerColor: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const messages = useOrdersStore(
    (s) => s.orders.find((o) => o.id === orderId)?.messages ?? EMPTY_MESSAGES
  );
  const sendOrderMessage = useOrdersStore((s) => s.sendOrderMessage);
  const [draft, setDraft] = useState("");

  const send = () => {
    if (!draft.trim()) return;
    sendOrderMessage(orderId, draft);
    setDraft("");
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-ls-card border-t border-ls-purple/30 rounded-t-3xl h-[80vh]">
        <DrawerHeader className="text-right pb-2 shrink-0">
          <DrawerTitle className="flex items-center gap-2 text-base font-black">
            <Avatar emoji={sellerEmoji} color={sellerColor} size="sm" />
            گفتگو با {sellerName}
          </DrawerTitle>
          <DrawerDescription className="sr-only">
            پیام‌های این گفتگو داخل همین سفارش ذخیره می‌شود
          </DrawerDescription>
        </DrawerHeader>

        {/* رشتهٔ پیام‌ها */}
        <div
          className="flex-1 space-y-2.5 overflow-y-auto scroll-thin px-4 pb-3"
          aria-label={`پیام‌های گفتگو با ${sellerName}`}
        >
          {messages.length === 0 ? (
            <p className="py-10 text-center text-sm text-white/45">
              هنوز پیامی نیست — سؤالت را بپرس.
            </p>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "flex flex-col gap-1",
                  m.from === "buyer" ? "items-start" : "items-end"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3.5 py-2.5 border",
                    m.from === "buyer"
                      ? "self-start bg-ls-purple/15 border-ls-purple/25 rounded-bl-sm"
                      : "self-end bg-ls-green/10 border-ls-green/25 rounded-br-sm"
                  )}
                  aria-label={`${m.from === "buyer" ? "پیام تو" : `پیام ${sellerName}`}: ${m.text}`}
                >
                  <p className="text-[13px] leading-6 text-white/90 break-words">
                    {m.text}
                  </p>
                </div>
                <StepTime
                  ms={m.atMs}
                  className="text-[9px] text-white/35"
                />
              </div>
            ))
          )}
        </div>

        {/* ورودی پیام */}
        <div className="shrink-0 flex items-center gap-2 border-t border-white/10 bg-ls-card px-4 py-3 pb-[max(env(safe-area-inset-bottom),12px)]">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") send();
            }}
            placeholder="پیامت را بنویس…"
            aria-label="متن پیام به فروشنده"
            className="h-11 rounded-xl bg-ls-bg/60 border-white/10 text-sm text-right"
          />
          <button
            onClick={send}
            disabled={!draft.trim()}
            aria-label="ارسال پیام"
            className="h-11 w-11 shrink-0 rounded-xl bg-ls-purple text-white flex items-center justify-center disabled:opacity-40 hover:bg-ls-purple-deep active:scale-95 transition-all"
          >
            <Send className="w-4.5 h-4.5 rotate-180" aria-hidden />
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
