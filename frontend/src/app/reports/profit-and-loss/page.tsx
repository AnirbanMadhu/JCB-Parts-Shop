import ProfitAndLossReport from "@/app/reports/_components/ProfitAndLossReport";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

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
  
  // Build query string
  const queryParams = new URLSearchParams();
  if (params.startDate) queryParams.set('startDate', params.startDate);
  if (params.endDate) queryParams.set('endDate', params.endDate);
  
  const queryString = queryParams.toString();
  const url = `${API_BASE_URL}/api/reports/profit-loss${queryString ? `?${queryString}` : ''}`;
  
  let reportData = {
    totalPurchases: 0,
    totalSales: 0,
    profitLoss: 0,
    profitMargin: '0%',
    startDate: params.startDate,
    endDate: params.endDate,
  };
  
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      reportData = {
        totalPurchases: Number(data.totalPurchases || 0),
        totalSales: Number(data.totalSales || 0),
        profitLoss: Number(data.profitLoss || 0),
        profitMargin: data.profitMargin || '0%',
        startDate: params.startDate,
        endDate: params.endDate,
      };
    }
  } catch (error) {
    console.error('Failed to fetch profit/loss data:', error);
  }
  
  return <ProfitAndLossReport data={reportData} />;
}
