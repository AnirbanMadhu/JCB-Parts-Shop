// components/Common/ActionButton.tsx
import Link from "next/link";

type Props = {
  href: string;
  label: string;
};

export default function ActionButton({ href, label }: Props) {
  return (
    <Link
      href={href}
      className="p-2 bg-[#2c3e50] text-white rounded-md hover:bg-[#1a252f] transition-colors inline-flex items-center justify-center min-w-[32px] min-h-[32px]"
    >
      {label}
    </Link>
  );
}
