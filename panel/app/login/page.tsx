import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return <Suspense fallback={<div className="grid min-h-svh place-items-center text-sm text-gray-500">Loading sign in…</div>}><LoginForm /></Suspense>;
}
