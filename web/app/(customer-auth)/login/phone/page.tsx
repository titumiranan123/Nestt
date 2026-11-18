import { redirect } from "next/navigation";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { next } = await searchParams;
  const query = new URLSearchParams({ method: "sms" });
  if (typeof next === "string") query.set("next", next);
  redirect(`/login?${query}`);
}
