import ItemEditForm from "@/components/ui/ItemEditForm";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

async function getItem(id: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/parts/${id}`, {
      cache: 'no-store',
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
      <div className="p-6">
        <div className="text-center py-12">
          <h1 className="text-xl font-semibold text-red-600">Item not found</h1>
          <p className="mt-2 text-gray-600">The item you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return <ItemEditForm item={item} />;
}
