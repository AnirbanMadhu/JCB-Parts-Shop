import ItemsList from "@/components/Common/ItemsList";
import { fetchItems } from "@/lib/api";

export const metadata = {
  title: "Items",
  description: "Manage inventory items",
};

export default async function ItemsPage() {
  const items = await fetchItems();
  
  return <ItemsList items={items} />;
}
