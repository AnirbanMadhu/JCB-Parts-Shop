"use client";

interface DashboardCardProps {
  title: string;
  children: React.ReactNode;
}

export default function DashboardCard({
  title,
  children,
}: DashboardCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-gray-700">{title}</h2>
      </div>
      {children}
    </div>
  );
}
