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
    <div className="bg-card rounded-lg border border-border p-4 sm:p-5 shadow-sm overflow-hidden">
      <div className="mb-3 sm:mb-4">
        <h2 className="text-sm sm:text-base font-semibold text-card-foreground">{title}</h2>
      </div>
      <div className="overflow-hidden">
        {children}
      </div>
    </div>
  );
}
