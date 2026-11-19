"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { DemoNotification } from "@/lib/admin-tools-demo";
import { notificationApi } from "@/lib/api/admin-tools";
import { getErrorMessage } from "@/lib/api/errors";
import { confirmAdminAction, showAdminNotice } from "@/lib/admin-swal";
import { NotificationFilters } from "@/components/admin/tools/NotificationFilters";
import { NotificationHero } from "@/components/admin/tools/NotificationHero";
import { TablePagination } from "@/components/admin/shared/TablePagination";
import { NotificationSummaryCards } from "@/components/admin/tools/NotificationSummaryCards";
import { NotificationTimeline } from "@/components/admin/tools/NotificationTimeline";

type NotificationFilter = "all" | "unread" | "read";
const pageSize = 6;

export function NotificationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const queryKey = ["admin", "notifications"];
  const notifications = useQuery({ queryKey, queryFn: ({ signal }) => notificationApi.list(signal) });
  const items = notifications.data ?? [];
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [page, setPage] = useState(1);
  const unreadCount = items.filter((item) => !item.isRead).length;
  const filtered = useMemo(() => items.filter((item) => filter === "all" || (filter === "unread" ? !item.isRead : item.isRead)), [items, filter]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);

  const markAllRead = async () => {
    if (!unreadCount || !await confirmAdminAction("Mark all notifications as read?", "Unread notifications will be marked as read.")) return;
    try { await notificationApi.readAll(); await queryClient.invalidateQueries({ queryKey }); void showAdminNotice("Inbox updated", "All notifications are marked as read.", "success"); }
    catch (error) { void showAdminNotice("Inbox could not be updated", getErrorMessage(error), "error"); }
  };
  const openNotification = async (item: DemoNotification) => {
    if (!item.isRead) {
      try { await notificationApi.read(item.id); await queryClient.invalidateQueries({ queryKey }); }
      catch (error) { void showAdminNotice("Notification could not be updated", getErrorMessage(error), "error"); }
    }
    if (item.target) router.push(item.target);
    else void showAdminNotice(item.title, item.body, "info");
  };

  return <div className="animate-fade-up space-y-5">
    {notifications.isError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{getErrorMessage(notifications.error)} <button onClick={() => void notifications.refetch()} className="ml-2 font-semibold underline">Retry</button></div>}
    <NotificationHero unreadCount={unreadCount} onMarkAllRead={() => void markAllRead()}/>
    <NotificationSummaryCards unreadCount={unreadCount} total={items.length}/>
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <NotificationFilters filter={filter} count={filtered.length} pageCount={pageCount} page={page} onFilter={(value) => { setFilter(value); setPage(1); }} onPage={setPage}/>
      <NotificationTimeline items={visible} onOpen={openNotification}/>
      <TablePagination total={filtered.length} page={page} pageSize={pageSize} pageCount={pageCount} itemLabel="notifications" onPage={setPage} hideWhenSinglePage/>
    </section>
    <p className="text-xs text-gray-500">Notifications are loaded from your admin inbox.</p>
  </div>;
}
