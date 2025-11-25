import ItemsList from "@/components/ui/ItemsList";
import { INTERNAL_API_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Items - Inventory Management",
  description: "View and manage inventory items",
};

async function fetchItems() {
  try {
    const res = await fetch(`${INTERNAL_API_URL}/api/stock?onlyPurchased=true`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    // Stock API returns array of parts with stock
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Failed to fetch purchased items:", error);
    return [];
  }
}

export default async function ItemsPage() {
  const items = await fetchItems();
  return <ItemsList items={items} />;
}
