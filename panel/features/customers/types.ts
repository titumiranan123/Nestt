export type CustomerStatus = "ACTIVE" | "SUSPENDED" | "BANNED";

export type CustomerDraft = {
  name: string;
  email: string;
  phone: string;
  location: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
};

export type Customer = CustomerDraft & {
  id: string;
  orders: number;
  reviews: number;
  status: CustomerStatus;
  joinedAt: string;
  avatarPath: string | null;
};

export type CustomerSummary = { total: number; active: number; verified: number; restricted: number };
export type CustomerDateRange = { from: string; to: string };
export type CustomerListQuery = CustomerDateRange & {
  search: string;
  status: string;
  verification: string;
  page: number;
  limit: number;
};
export type CustomerList = { items: Customer[]; total: number; summary: CustomerSummary };
export type CustomerSaveInput = CustomerDraft & { status: CustomerStatus; password?: string };
