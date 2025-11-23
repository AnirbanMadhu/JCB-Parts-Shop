'use client';

import DashboardCard from "./_components/DashboardCard";
import CashflowChart from "./_components/CashflowChart";
import SalesChart from "./_components/SalesChart";
import PurchaseChart from "./_components/PurchaseChart";

export default function DashboardClient() {
  return (
    <div className="h-full p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 overflow-auto">
      {/* Cashflow Chart */}
      <DashboardCard title="Cashflow">
        <CashflowChart />
      </DashboardCard>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Sales Chart */}
        <DashboardCard title="Sales Chart">
          <SalesChart />
        </DashboardCard>

        {/* Purchase Chart */}
        <DashboardCard title="Purchase Chart">
          <PurchaseChart />
        </DashboardCard>
      </div>
    </div>
  );
}
