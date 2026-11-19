"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { accessApi } from "./api";
import { accessKeys } from "./keys";
import type { AccessRolesResponse, StaffRole, UpdateRolePermissionsInput } from "./types";

export function useAccessRoles() {
  return useQuery({
    queryKey: accessKeys.roles(),
    queryFn: accessApi.roles,
  });
}

export function useFetchRoleAudit() {
  const queryClient = useQueryClient();
  return (role: StaffRole) => queryClient.fetchQuery({
    queryKey: accessKeys.audit(role),
    queryFn: ({ signal }) => accessApi.audit(role, signal),
    staleTime: 0,
  }).catch(() => undefined);
}

export function useUpdateRolePermissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ role, permissions }: UpdateRolePermissionsInput) =>
      accessApi.updateRolePermissions(role, permissions),
    meta: { successMessage: "Role permissions saved." },
    onSuccess: (updated) => {
      queryClient.setQueryData<AccessRolesResponse>(accessKeys.roles(), (current) => current && {
        ...current,
        roles: current.roles.map((role) => role.role === updated.role ? updated : role),
      });
      return queryClient.invalidateQueries({ queryKey: accessKeys.roles() });
    },
  });
}
