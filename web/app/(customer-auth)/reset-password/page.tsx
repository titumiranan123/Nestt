import { CustomerAuthScreen } from "@/components/account/CustomerAuthScreen";

export const metadata = { title: "Reset your password" };

export default function Page() {
  return <CustomerAuthScreen mode="reset" />;
}
