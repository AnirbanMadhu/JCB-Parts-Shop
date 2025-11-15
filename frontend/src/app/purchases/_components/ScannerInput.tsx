// components/Purchases/ScannerInput.tsx
"use client";

import { useEffect, useRef, useState } from "react";

export default function ScannerInput({
  onScan,
  placeholder = "Scan barcode / enter part number and hit Enter",
}: {
  onScan: (code: string) => void;
  placeholder?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");

  // Keep focus to accept wireless/USB scanner input (keyboard-wedge)
  useEffect(() => {
    const i = inputRef.current;
    if (!i) return;
    const keepFocus = () => i.focus();
    window.addEventListener("click", keepFocus);
    i.focus();
    return () => window.removeEventListener("click", keepFocus);
  }, []);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const c = value.trim();
        if (c) {
          onScan(c);
          setValue("");
        }
      }}
      className="flex items-center gap-2"
    >
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full md:w-[520px] rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-neutral-800"
      />
      <button
        type="submit"
        className="rounded-md px-3 py-2 bg-neutral-800 text-white hover:bg-neutral-900"
      >
        Add
      </button>
    </form>
  );
}
