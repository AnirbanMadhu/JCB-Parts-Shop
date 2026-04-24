import ProfitAndLossReport from "@/app/reports/_components/ProfitAndLossReport";
import { fetchProfitAndLoss } from "@/lib/api";



export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Profit and Loss",
  description: "View profit and loss report",
};

type SearchParams = {
  startDate?: string;
  endDate?: string;
};

export default async function ProfitAndLossPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const reportData = await fetchProfitAndLoss(params.startDate, params.endDate);
  
  return <ProfitAndLossReport data={reportData} />;
}
