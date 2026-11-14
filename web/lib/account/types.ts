export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";
export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  finish: string;
  stock: number;
  options: string[];
};
export type Address = {
  id: string;
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
  name: string;
  email: string;
  phone: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
};
export type OrderItem = {
  id: string;
  productId: string;
  name: string;
  image: string;
  variant: string;
  quantity: number;
  price: number;
};
export type CustomerOrder = {
  id: string;
  date: string;
  status: OrderStatus;
  payment: "PAID" | "PENDING" | "REFUNDED";
  method: string;
  transaction?: string;
  delivery?: string;
  deliveredAt?: string;
  items: OrderItem[];
  shipping: Address;
  shippingCharge: number;
  discount: number;
  cancelReason?: string;
  returns: {
    itemId: string;
    reason: string;
    note: string;
    reference: string;
    date: string;
  }[];
};
export type BagItem = { productId: string; option: string; quantity: number };
export type AccountState = {
  version: 1;
  profile: Profile;
  orders: CustomerOrder[];
  addresses: Address[];
  wishlist: string[];
  bag: BagItem[];
  signedOut: boolean;
};
