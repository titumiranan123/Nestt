import { CustomerAuthScreen } from "@/components/account/CustomerAuthScreen";

export const metadata = { title: "Sign in" };

export default function Page() {
  return <CustomerAuthScreen mode="login" />;
}
