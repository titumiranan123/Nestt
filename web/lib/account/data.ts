import type { AccountState, Address, CustomerOrder, Product } from "./types";

export const products: Product[] = [
  {
    id: "oslo",
    name: "Oslo High-Back Recliner",
    category: "Lounge seating",
    price: 48500,
    image: "/assets/figma-home/product-oslo.png",
    finish: "Natural ivory",
    stock: 8,
    options: ["Natural ivory", "Warm taupe"],
  },
  {
    id: "kyoto",
    name: "Kyoto Extendable Dining Table",
    category: "Dining tables",
    price: 62000,
    image: "/assets/figma-home/product-kyoto.png",
    finish: "Natural oak",
    stock: 5,
    options: ["Natural oak", "Walnut"],
  },
  {
    id: "arcus",
    name: "Arcus Fluted Timber Credenza",
    category: "Storage & cabinets",
    price: 56000,
    image: "/assets/figma-home/product-arcus.png",
    finish: "Walnut oak",
    stock: 4,
    options: ["Walnut oak"],
  },
  {
    id: "sylvan",
    name: "Sylvan Hydraulic King Bed",
    category: "Beds & bed frames",
    price: 94000,
    image: "/assets/figma-home/product-sylvan.png",
    finish: "Natural oak",
    stock: 3,
    options: ["King / Natural oak", "King / Walnut"],
  },
  {
    id: "aero",
    name: "Aero Bentwood Occasional Chair",
    category: "Accent chairs",
    price: 32500,
    image: "/assets/figma-home/fresh-aero.png",
    finish: "Oak / Ivory",
    stock: 6,
    options: ["Oak / Ivory"],
  },
  {
    id: "krona",
    name: "Krona Smart Study Desk",
    category: "Home office",
    price: 41000,
    image: "/assets/figma-home/fresh-krona.png",
    finish: "Natural oak",
    stock: 0,
    options: ["Natural oak"],
  },
  {
    id: "marlow",
    name: "Marlow 3-seater sofa",
    category: "Sofas",
    price: 68900,
    image: "/assets/hero/quality-living-room.webp",
    finish: "Natural ivory / 3 seater",
    stock: 5,
    options: ["Natural ivory / 3 seater", "Warm taupe / 3 seater"],
  },
];
export const money = (amount: number) =>
  `৳${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amount)}`;
export const dateLabel = (date: string) =>
  new Date(`${date.slice(0, 10)}T12:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
export const orderTotal = (order: CustomerOrder) =>
  order.items.reduce((sum, item) => sum + item.price * item.quantity, 0) +
  order.shippingCharge -
  order.discount;
export const statusLabel = (value: string) =>
  value.charAt(0) + value.slice(1).toLowerCase();
export const initialAddress: Address = {
  id: "home",
  label: "Home",
  fullName: "Raihan Ahmed",
  phone: "+8801700000000",
  region: "Dhaka",
  city: "Dhaka",
  area: "Gulshan 2",
  addressLine: "House 12, Road 132",
  postalCode: "1212",
  isDefaultShipping: true,
  isDefaultBilling: true,
};
const order = (
  id: string,
  date: string,
  productId: string,
  status: CustomerOrder["status"],
  payment: CustomerOrder["payment"] = "PAID",
): CustomerOrder => {
  const p = products.find((p) => p.id === productId)!;
  return {
    id,
    date,
    status,
    payment,
    method: payment === "PENDING" ? "Cash on delivery" : "SSL Commerz",
    transaction: payment === "PAID" ? `SSL${id.slice(4)}` : undefined,
    delivery:
      status === "SHIPPED" || status === "PROCESSING"
        ? "15–17 Nov 2026"
        : undefined,
    deliveredAt:
      status === "DELIVERED"
        ? id === "NST-10396"
          ? "2026-11-01"
          : date
        : undefined,
    items: [
      {
        id: `${id}-1`,
        productId,
        name: p.name,
        image: p.image,
        variant: p.finish,
        quantity: 1,
        price: p.price,
      },
    ],
    shipping: { ...initialAddress },
    shippingCharge: productId === "marlow" ? 1000 : 0,
    discount: 0,
    returns: [],
  };
};
export function createInitialState(): AccountState {
  return {
    version: 1,
    signedOut: false,
    profile: {
      name: "Raihan Ahmed",
      email: "raihan@example.com",
      phone: "+8801700000000",
      isEmailVerified: true,
      isPhoneVerified: true,
    },
    wishlist: ["oslo", "kyoto", "arcus", "sylvan", "aero", "krona"],
    addresses: [
      { ...initialAddress },
      {
        ...initialAddress,
        id: "office",
        label: "Office",
        addressLine: "Level 5, Road 11",
        area: "Banani",
        postalCode: "1213",
        isDefaultShipping: false,
        isDefaultBilling: false,
      },
    ],
    bag: [],
    orders: [
      order("NST-10482", "2026-11-11", "marlow", "SHIPPED"),
      order("NST-10470", "2026-11-10", "kyoto", "PROCESSING", "PENDING"),
      order("NST-10396", "2026-10-28", "oslo", "DELIVERED"),
      order("NST-10290", "2026-10-03", "arcus", "CANCELLED", "REFUNDED"),
      order("NST-10254", "2026-09-16", "kyoto", "DELIVERED"),
      order("NST-10221", "2026-09-03", "aero", "DELIVERED"),
      order("NST-10150", "2026-08-15", "sylvan", "DELIVERED"),
      order("NST-10102", "2026-08-01", "arcus", "DELIVERED"),
    ],
  };
}
