import ItemEditForm from "@/components/ui/ItemEditForm";
import { API_BASE_URL } from '@/lib/constants';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getItem(id: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/parts/${id}`, {
      cache: 'no-store',
      next: { revalidate: 0 }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('Failed to fetch item:', error);
    return null;
  }
}

export default async function EditItemPage({ 
  params 
}: { 
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const item = await getItem(id);

  if (!item) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="text-center py-12">
          <h1 className="text-xl font-semibold text-destructive">Item not found</h1>
          <p className="mt-2 text-muted-foreground">The item you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return <ItemEditForm item={item} />;
}
