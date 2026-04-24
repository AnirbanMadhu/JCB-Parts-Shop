import ItemsList from "@/components/ui/ItemsList";
import { fetchItems } from "@/lib/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Items - Inventory Management",
  description: "View and manage inventory items",
};

export default async function ItemsPage() {
  const items = await fetchItems();
  return <ItemsList items={items} />;
}
