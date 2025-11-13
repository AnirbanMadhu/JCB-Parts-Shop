import BalanceSheetReport from "@/components/Reports/BalanceSheetReport";

export const metadata = {
  title: "Balance Sheet",
  description: "View balance sheet report",
};

export default async function BalanceSheetPage() {
  // In production, fetch data based on date range
  const reportData = {
    totalDebit: 0,
    totalCredit: 0,
    balance: 0,
    accounts: [],
  };
  
  return <BalanceSheetReport data={reportData} />;
}
