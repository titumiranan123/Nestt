import type { Metadata } from "next";
import { RoomPlanner } from "@/components/ar/RoomPlanner";

export const metadata: Metadata = {
  title: "Design Your Room in 3D | Nestt",
  description: "Arrange sample furniture models in a 3D room, adjust room dimensions, and share your design.",
};

export default function RoomPlannerPage() {
  return <RoomPlanner androidStoreUrl={process.env.ANDROID_STORE_URL} iosStoreUrl={process.env.IOS_STORE_URL} />;
}
