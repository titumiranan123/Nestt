import { CustomerAuthScreen } from "@/components/account/CustomerAuthScreen";

export const metadata = { title: "Forgot password" };

export default function Page() {
  return <CustomerAuthScreen mode="forgot" />;
}
