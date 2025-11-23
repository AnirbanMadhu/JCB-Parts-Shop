'use client';

import DashboardCard from "./_components/DashboardCard";
import CashflowChart from "./_components/CashflowChart";
import SalesChart from "./_components/SalesChart";
import PurchaseChart from "./_components/PurchaseChart";

export default function DashboardClient() {
  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6">
      {/* Cashflow Chart */}
      <DashboardCard title="Cashflow">
        <CashflowChart />
      </DashboardCard>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
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
