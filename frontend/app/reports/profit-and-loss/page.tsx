import ProfitAndLossReport from "@/components/Reports/ProfitAndLossReport";

export const metadata = {
  title: "Profit and Loss",
  description: "View profit and loss report",
};

export default async function ProfitAndLossPage() {
  // In production, fetch data based on date range
  const reportData = {
    totalDebit: 0,
    totalCredit: 0,
    balance: 0,
    accounts: [],
  };
  
  return <ProfitAndLossReport data={reportData} />;
}
