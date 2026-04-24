"use client";

import { useEffect, useState } from "react";
import ItemsList from "@/components/ui/ItemsList";
import { authFetch } from "@/lib/auth";
import type { Item } from "@/lib/api";

export const dynamic = "force-dynamic";

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadItems = async () => {
      try {
        const response = await authFetch('/api/stock');
        const data = response.ok ? await response.json() : [];
        setItems(data);
      } finally {
        setLoading(false);
      }
    };

    loadItems();
  }, []);

  if (loading) {
    return <div className="p-6 text-muted-foreground">Loading items...</div>;
  }

  return <ItemsList items={items} />;
}
