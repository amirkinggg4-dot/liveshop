import type { Metadata } from "next";
import AdminApp from "@/components/admin/AdminApp";

export const metadata: Metadata = {
  title: "پنل مدیریت — LiveShop",
  description: "پنل ادمین LiveShop — بررسی درخواست‌های فروشندگی (دمو)",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminApp />;
}
