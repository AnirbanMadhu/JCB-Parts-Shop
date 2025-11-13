import DashboardHeader from "@/components/Dashboard/DashboardHeader";
import DashboardCard from "@/components/Dashboard/DashboardCard";
import CashflowChart from "@/components/Dashboard/CashflowChart";
import SalesChart from "@/components/Dashboard/SalesChart";
import PurchaseChart from "@/components/Dashboard/PurchaseChart";

export default function Home() {
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
