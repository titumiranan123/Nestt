export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";
export type Product = {
  id: string;
  variantId: string;
  name: string;
  category: string;
  price: number;
  image: string;
  finish: string;
  stock: number;
  canAddToCart: boolean;
  isPriceOnRequest: boolean;
};
export type Address = {
  id: string;
  thanaId: string;
  label: string;
  fullName: string;
  phone: string;
  region: string;
  city: string;
  area: string;
  addressLine: string;
  postalCode: string;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
};
export type Profile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
};
export type OrderItem = {
  id: string;
  variantId: string | null;
  name: string;
  image?: string;
  variant: string;
  quantity: number;
  price: number;
};
export type CustomerOrder = {
  id: string;
  code: string;
  date: string;
  status: OrderStatus;
  payment: "UNPAID" | "PENDING" | "PAID" | "FAILED" | "PARTIALLY_REFUNDED" | "REFUNDED";
  method: string;
  cashOnDelivery: boolean;
  contactEmail?: string | null;
  orderPhoneVerifiedAt?: string | null;
  deliveredAt?: string;
  items: OrderItem[];
  shipping: Address;
  billing?: Address;
  subtotal: number;
  total: number;
  shippingCharge: number;
  discount: number;
  cancelReason?: string;
  returns: {
    itemId: string;
    reason: string;
    status: string;
    reference: string;
    date: string;
  }[];
  updates: { id: string; status: OrderStatus; note: string | null; date: string }[];
};
export type AccountState = {
  profile: Profile;
  orders: CustomerOrder[];
  addresses: Address[];
  wishlist: Product[];
};

export type DeliveryDivision = {
  id: string;
  name: string;
  districts: {
    id: string;
    name: string;
    thanas: { id: string; name: string; isDeliverable: boolean }[];
  }[];
};
