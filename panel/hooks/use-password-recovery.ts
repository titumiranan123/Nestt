"use client";

import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";

export type ForgotPasswordInput = { email: string };
export type ResetPasswordInput = { email: string; code: string; password: string };
type MessageResponse = { message: string };

export function useForgotPassword() {
  return useMutation({
    mutationFn: (input: ForgotPasswordInput) => apiClient<MessageResponse>("/auth/email/forgot-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
      authRequired: false,
    }),
    meta: { silent: true },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (input: ResetPasswordInput) => apiClient<MessageResponse>("/auth/email/reset-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
      authRequired: false,
    }),
    meta: { silent: true },
  });
}
