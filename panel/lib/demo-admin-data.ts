export type OrderStatus = "Processing" | "Confirmed" | "Shipped" | "Delivered" | "Cancelled";
export type PaymentStatus = "Paid" | "Pending" | "Refunded";

export type DemoOrder = {
  id: string;
  customer: string;
  email: string;
  phone: string;
  total: number;
  status: OrderStatus;
  payment: PaymentStatus;
  method: string;
  date: string;
  address: string;
  city: string;
  items: { name: string; sku: string; quantity: number; price: number; color: string }[];
  timeline: { label: string; date: string; done: boolean }[];
};

const orderSeed = [
  ["ORD-2026-1084", "Maliha Rahman", "maliha.rahman@example.com", "+880 1712-345678", 34800, "Processing", "Pending", "Cash on delivery", "Oct 28, 2026", "House 14, Road 7, Dhanmondi", "Dhaka", "Haven 3-seat sofa", "NT-SF-204", 1, 34800, "#e6d2be"],
  ["ORD-2026-1083", "Fahim Ahmed", "fahim.ahmed@example.com", "+880 1819-445522", 12900, "Confirmed", "Paid", "Card ·•• 4821", "Oct 28, 2026", "Flat 5B, Bashundhara R/A", "Dhaka", "Forma lounge chair", "NT-CH-113", 1, 12900, "#b7c3b0"],
  ["ORD-2026-1082", "Nusrat Jahan", "nusrat.j@example.com", "+880 1911-876543", 7850, "Shipped", "Paid", "SSL Commerz", "Oct 27, 2026", "12/A North Avenue, Gulshan", "Dhaka", "Oakline side table", "NT-TB-026", 1, 7850, "#c19a74"],
  ["ORD-2026-1081", "Tanvir Hasan", "tanvir.hasan@example.com", "+880 1610-765432", 52400, "Delivered", "Paid", "Card ·•• 1946", "Oct 27, 2026", "House 9, Road 3, Uttara", "Dhaka", "Haven 3-seat sofa", "NT-SF-204", 1, 34800, "#e6d2be"],
  ["ORD-2026-1080", "Sadia Islam", "sadia.islam@example.com", "+880 1555-321098", 17600, "Processing", "Pending", "Cash on delivery", "Oct 26, 2026", "Flat 2C, Mirpur DOHS", "Dhaka", "Luma bedside pair", "NT-BD-018", 2, 8800, "#d7c4ad"],
  ["ORD-2026-1079", "Arif Chowdhury", "arif.c@example.com", "+880 1700-887766", 24900, "Confirmed", "Paid", "Visa ·•• 7304", "Oct 26, 2026", "Plot 22, Sector 11, Uttara", "Dhaka", "Morrow dining set", "NT-DN-080", 1, 24900, "#a87f5e"],
  ["ORD-2026-1078", "Raisa Mahmud", "raisa.m@example.com", "+880 1866-221100", 6400, "Cancelled", "Refunded", "SSL Commerz", "Oct 25, 2026", "24 Lake Circus, Kalabagan", "Dhaka", "Arlo accent stool", "NT-ST-012", 1, 6400, "#c4b0a2"],
  ["ORD-2026-1077", "Mehedi Hasan", "mehedi.h@example.com", "+880 1955-441122", 21900, "Shipped", "Paid", "Cash on delivery", "Oct 25, 2026", "House 3, Road 11, Banani", "Dhaka", "Forma lounge chair", "NT-CH-113", 1, 12900, "#b7c3b0"],
] as const;

export const demoOrders: DemoOrder[] = orderSeed.map((row) => ({
  id: row[0], customer: row[1], email: row[2], phone: row[3], total: row[4],
  status: row[5] as OrderStatus, payment: row[6] as PaymentStatus, method: row[7],
  date: row[8], address: row[9], city: row[10],
  items: [{ name: row[11], sku: row[12], quantity: row[13], price: row[14], color: row[15] }],
  timeline: [
    { label: "Order placed", date: row[8], done: true },
    { label: "Confirmed", date: ["Confirmed", "Shipped", "Delivered"].includes(row[5]) ? row[8] : "Waiting for confirmation", done: ["Confirmed", "Shipped", "Delivered"].includes(row[5]) },
    { label: "Ready for delivery", date: row[5] === "Shipped" || row[5] === "Delivered" ? "Oct 28, 2026 · 10:20 AM" : "Pending", done: ["Shipped", "Delivered"].includes(row[5]) },
    { label: "Delivered", date: row[5] === "Delivered" ? "Oct 28, 2026 · 4:40 PM" : "Pending", done: row[5] === "Delivered" },
  ],
}));

export const money = (amount: number) => `৳${amount.toLocaleString("en-BD")}`;
