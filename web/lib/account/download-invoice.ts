import { accountApi } from "./api";

export async function downloadOrderInvoice(orderId: string, orderCode: string) {
  const pdf = await accountApi.invoice(orderId);
  const url = URL.createObjectURL(pdf);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Nestt-${orderCode.replace(/[^\w-]/g, "-")}.pdf`;
  document.body.append(link);
  try {
    link.click();
  } finally {
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 5_000);
  }
}
