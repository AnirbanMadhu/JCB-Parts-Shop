import DashboardHeader from "./_components/DashboardHeader";
import DashboardCard from "./_components/DashboardCard";
import CashflowChart from "./_components/CashflowChart";
import SalesChart from "./_components/SalesChart";
import PurchaseChart from "./_components/PurchaseChart";

export const dynamic = 'force-dynamic';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />

      <div className="p-6 space-y-6">
        {/* Cashflow Chart */}
        <DashboardCard title="Cashflow">
          <CashflowChart />
        </DashboardCard>

        {/* Two column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
    </div>
  );
}
