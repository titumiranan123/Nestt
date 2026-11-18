import { CustomerAuthScreen } from "@/components/account/CustomerAuthScreen";

export const metadata = { title: "Verify your phone" };

export default function Page() {
  return <CustomerAuthScreen mode="verify" />;
}
