import { CustomerAuthScreen } from "@/components/account/CustomerAuthScreen";

export const metadata = { title: "Create your account" };

export default function Page() {
  return <CustomerAuthScreen mode="register" />;
}
