import { redirect } from "next/navigation";

export default function Page() {
  redirect("/admin/reports/products-inventory?view=inventory");
}
