import type { DemoStaff } from "@/lib/admin-operations-demo";

export type StaffStatus = "ACTIVE" | "SUSPENDED";
export type StaffListQuery = {
  page: number;
  limit: number;
  search?: string;
  role?: DemoStaff["role"];
  status?: StaffStatus;
};

export type StaffListResponse = {
  items: DemoStaff[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  summary: { total: number; active: number; admins: number; managers: number };
};

export type CreateStaffInput = {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: Exclude<DemoStaff["role"], "SUPER_ADMIN">;
  status: StaffStatus;
  verified: boolean;
};

export type UpdateStaffInput = Omit<CreateStaffInput, "password">;
