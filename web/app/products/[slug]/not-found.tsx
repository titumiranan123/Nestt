import Link from "next/link";

export default function ProductNotFound() {
  return <main className="mx-auto max-w-md px-4 py-20 text-center">
    <h1 className="text-2xl font-semibold">Product unavailable</h1>
    <Link href="/products" className="mt-4 inline-block text-sm font-medium text-[#af3b17] underline">Browse furniture</Link>
  </main>;
}
