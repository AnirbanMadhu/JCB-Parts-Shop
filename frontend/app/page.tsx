import DashboardHeader from "@/components/Dashboard/DashboardHeader";
import DashboardCard from "@/components/Dashboard/DashboardCard";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />

      <div className="p-6 space-y-6">
        {/* Cashflow Chart */}
        <DashboardCard title="Cashflow" showFilter={false}>
          <div className="h-[250px] flex items-center justify-center">
            <div className="relative w-full h-full">
              {/* Placeholder for chart */}
              <div className="absolute inset-0 flex items-center justify-center">
                <svg
                  className="w-full h-full"
                  viewBox="0 0 800 200"
                  preserveAspectRatio="none"
                >
                  {/* Grid lines */}
                  <line
                    x1="0"
                    y1="50"
                    x2="800"
                    y2="50"
                    stroke="#f0f0f0"
                    strokeWidth="1"
                  />
                  <line
                    x1="0"
                    y1="100"
                    x2="800"
                    y2="100"
                    stroke="#f0f0f0"
                    strokeWidth="1"
                  />
                  <line
                    x1="0"
                    y1="150"
                    x2="800"
                    y2="150"
                    stroke="#f0f0f0"
                    strokeWidth="1"
                  />

                  {/* Line chart */}
                  <polyline
                    points="0,120 100,80 200,100 300,60 400,90 500,40 600,70 700,100 800,120"
                    fill="none"
                    stroke="#e5e5e5"
                    strokeWidth="2"
                  />
                </svg>
              </div>
            </div>
          </div>
        </DashboardCard>

        {/* Two column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Invoice */}
          <DashboardCard title="Sales Invoice">
            <div className="space-y-3">
              <div className="h-8 bg-gray-100 rounded animate-pulse"></div>
              <div className="h-8 bg-gray-100 rounded animate-pulse"></div>
            </div>
          </DashboardCard>

          {/* Purchase Invoice */}
          <DashboardCard title="Purchase Invoice">
            <div className="space-y-3">
              <div className="h-8 bg-gray-100 rounded animate-pulse"></div>
              <div className="h-8 bg-gray-100 rounded animate-pulse"></div>
            </div>
          </DashboardCard>

          {/* Profit and Loss */}
          <DashboardCard title="Profit and Loss">
            <div className="h-[150px] flex items-center justify-center">
              <p className="text-sm text-gray-400">No transactions yet</p>
            </div>
          </DashboardCard>

          {/* Top Expenses */}
          <DashboardCard title="Top Expenses">
            <div className="h-[150px] flex items-center justify-center">
              <p className="text-sm text-gray-400">No expenses in this period</p>
            </div>
          </DashboardCard>
        </div>
      </div>
    </div>
  );
}
