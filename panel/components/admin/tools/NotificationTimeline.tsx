import { Bell } from "lucide-react";

import type { DemoNotification } from "@/lib/admin-tools-demo";

import { NotificationRow } from "./NotificationRow";

export function NotificationTimeline({ items, onOpen }: { items: DemoNotification[]; onOpen: (item: DemoNotification) => void }) {
  return <div className="divide-y divide-gray-100">{items.length ? items.map((item) => <NotificationRow key={item.id} item={item} onOpen={onOpen}/>) : <div className="px-6 py-14 text-center"><Bell size={22} className="mx-auto text-brand"/><h3 className="mt-3 text-base font-bold text-gray-900">No notifications found</h3><p className="mt-1 text-sm text-gray-500">New activity will show up here.</p></div>}</div>;
}
