"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { staffApi } from "./api";
import { staffKeys } from "./keys";
import type { CreateStaffInput, StaffListQuery, UpdateStaffInput } from "./types";

export function useStaffList(query: StaffListQuery) {
  return useQuery({
    queryKey: staffKeys.list(query),
    queryFn: () => staffApi.list(query),
    placeholderData: keepPreviousData,
  });
}

function useStaffMutation<TInput>(mutationFn: (input: TInput) => Promise<unknown>, successMessage: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    meta: { successMessage },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: staffKeys.lists() }),
  });
}

export function useCreateStaff() {
  return useStaffMutation((input: CreateStaffInput) => staffApi.create(input), "Staff account created.");
}

export function useUpdateStaff() {
  return useStaffMutation(({ id, input }: { id: string; input: UpdateStaffInput }) => staffApi.update(id, input), "Staff profile updated.");
}

export function useDeleteStaff() {
  return useStaffMutation((id: string) => staffApi.remove(id), "Staff account deactivated.");
}

export function useResetStaffPassword() {
  return useStaffMutation(({ id, password }: { id: string; password: string }) => staffApi.resetPassword(id, password), "Staff password reset and sessions revoked.");
}
