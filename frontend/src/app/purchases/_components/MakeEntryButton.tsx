// components/Purchases/MakeEntryButton.tsx
"use client";

import { useRouter } from "next/navigation";

type Props = {
  href: string;
};

export default function MakeEntryButton({ href }: Props) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push(href)}
      className="rounded-md px-4 py-2 text-white bg-neutral-800 hover:bg-neutral-900"
    >
      Make Entry
    </button>
  );
}
