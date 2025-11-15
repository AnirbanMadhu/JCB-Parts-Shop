// components/Common/BackButton.tsx
"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export default function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="p-2 hover:bg-gray-100 rounded-md"
      aria-label="Go back"
    >
      <ChevronLeft className="w-4 h-4 text-gray-500" />
    </button>
  );
}
