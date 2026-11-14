import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { RecoveryProviders } from "@/components/auth/RecoveryProviders";

export default function ResetPasswordPage() {
  return <RecoveryProviders><Suspense fallback={<div className="grid min-h-svh place-items-center text-sm text-gray-500">Loading password reset…</div>}><ResetPasswordForm /></Suspense></RecoveryProviders>;
}
