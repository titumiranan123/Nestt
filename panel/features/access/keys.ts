export const accessKeys = {
  all: ["access"] as const,
  roles: () => [...accessKeys.all, "roles"] as const,
};
