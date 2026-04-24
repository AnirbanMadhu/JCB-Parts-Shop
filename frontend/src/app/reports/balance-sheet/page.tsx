import BalanceSheetReport from "@/app/reports/_components/BalanceSheetReport";
import { fetchBalanceSheet } from "@/lib/api";



export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Balance Sheet",
  description: "View balance sheet report",
};

type SearchParams = {
  asOfDate?: string;
};

export default async function BalanceSheetPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const reportData = await fetchBalanceSheet(params.asOfDate);
  
  return <BalanceSheetReport data={reportData} />;
}
