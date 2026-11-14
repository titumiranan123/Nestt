import type { StaffListQuery } from "./types";

export const staffKeys = {
  all: ["staff"] as const,
  lists: () => [...staffKeys.all, "list"] as const,
  list: (query: StaffListQuery) => [...staffKeys.lists(), query] as const,
};
