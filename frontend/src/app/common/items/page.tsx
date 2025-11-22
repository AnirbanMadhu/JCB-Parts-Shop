import ItemsList from "@/components/ui/ItemsList";
import { API_BASE_URL } from "@/lib/constants";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: "Items - Inventory Management",
  description: "View and manage inventory items",
};

async function fetchItems() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/parts`, { cache: "no-store" });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Failed to fetch items:", error);
    return [];
  }
}

export default async function ItemsPage() {
  const items = await fetchItems();
  return <ItemsList items={items} />;
}
