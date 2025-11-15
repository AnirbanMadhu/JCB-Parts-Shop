import BalanceSheetReport from "@/app/reports/_components/BalanceSheetReport";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

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
  
  // Build query string
  const queryParams = new URLSearchParams();
  if (params.asOfDate) queryParams.set('asOfDate', params.asOfDate);
  
  const queryString = queryParams.toString();
  const url = `${API_BASE_URL}/api/reports/balance-sheet${queryString ? `?${queryString}` : ''}`;
  
  let reportData = {
    asOfDate: params.asOfDate || new Date().toISOString().split('T')[0],
    assets: {
      currentAssets: {
        cash: 0,
        accountsReceivable: 0,
        inventory: 0,
        total: 0
      },
      total: 0
    },
    liabilities: {
      currentLiabilities: {
        accountsPayable: 0,
        total: 0
      },
      total: 0
    },
    equity: {
      retainedEarnings: 0,
      total: 0
    },
    totalLiabilitiesAndEquity: 0
  };
  
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (res.ok) {
      reportData = await res.json();
    }
  } catch (error) {
    console.error('Failed to fetch balance sheet data:', error);
  }
  
  return <BalanceSheetReport data={reportData} />;
}
