import { redirect } from "next/navigation";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { next } = await searchParams;
  const query = new URLSearchParams();
  if (typeof next === "string") query.set("next", next);
  redirect(`/register${query.size ? `?${query}` : ""}`);
}
