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
    <div className="bg-card rounded-lg border border-border p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-card-foreground">{title}</h2>
      </div>
      {children}
    </div>
  );
}
