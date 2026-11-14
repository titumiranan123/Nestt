"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { demoNotifications, type DemoNotification } from "@/lib/admin-tools-demo";
import { showAdminNotice } from "@/lib/admin-swal";
import { NotificationFilters } from "@/components/admin/tools/NotificationFilters";
import { NotificationHero } from "@/components/admin/tools/NotificationHero";
import { TablePagination } from "@/components/admin/shared/TablePagination";
import { NotificationSummaryCards } from "@/components/admin/tools/NotificationSummaryCards";
import { NotificationTimeline } from "@/components/admin/tools/NotificationTimeline";

type NotificationFilter = "all" | "unread" | "read";
const pageSize = 6;

export function NotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<DemoNotification[]>(() => demoNotifications.map((item) => ({ ...item })));
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [page, setPage] = useState(1);
  const unreadCount = items.filter((item) => !item.isRead).length;
  const filtered = useMemo(() => items.filter((item) => filter === "all" || (filter === "unread" ? !item.isRead : item.isRead)), [items, filter]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);

  const markAllRead = () => {
    setItems((current) => current.map((item) => ({ ...item, isRead: true })));
    void showAdminNotice("Inbox updated", "All notifications are marked as read in this demo session.", "success");
  };
  const openNotification = (item: DemoNotification) => {
    setItems((current) => current.map((row) => row.id === item.id ? { ...row, isRead: true } : row));
    if (item.target) router.push(item.target);
    else void showAdminNotice(item.title, item.body, "info");
  };

  return <div className="animate-fade-up space-y-5">
    <NotificationHero unreadCount={unreadCount} onMarkAllRead={markAllRead}/>
    <NotificationSummaryCards unreadCount={unreadCount} total={items.length}/>
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <NotificationFilters filter={filter} count={filtered.length} pageCount={pageCount} page={page} onFilter={(value) => { setFilter(value); setPage(1); }} onPage={setPage}/>
      <NotificationTimeline items={visible} onOpen={openNotification}/>
      <TablePagination total={filtered.length} page={page} pageSize={pageSize} pageCount={pageCount} itemLabel="notifications" onPage={setPage} hideWhenSinglePage/>
    </section>
    <p className="text-xs text-gray-500">Notifications use temporary sample data and reset when this page reloads.</p>
  </div>;
}
