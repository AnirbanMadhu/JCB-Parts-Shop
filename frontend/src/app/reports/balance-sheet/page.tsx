"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import BalanceSheetReport from "@/app/reports/_components/BalanceSheetReport";
import { authFetch } from "@/lib/auth";



export const dynamic = 'force-dynamic';

export default function BalanceSheetPage() {
  const searchParams = useSearchParams();
  const asOfDate = searchParams?.get('asOfDate') || undefined;
  const [reportData, setReportData] = useState<any>({
    asOfDate: asOfDate || new Date().toISOString().split('T')[0],
    assets: {
      currentAssets: { cash: 0, accountsReceivable: 0, inventory: 0, total: 0 },
      total: 0,
    },
    liabilities: {
      currentLiabilities: { accountsPayable: 0, total: 0 },
      total: 0,
    },
    equity: { retainedEarnings: 0, total: 0 },
    totalLiabilitiesAndEquity: 0,
  });

  useEffect(() => {
    const loadReport = async () => {
      const query = new URLSearchParams();
      if (asOfDate) query.set('asOfDate', asOfDate);

      const response = await authFetch(`/api/reports/balance-sheet${query.toString() ? `?${query.toString()}` : ''}`);
      const data = response.ok ? await response.json() : {
        asOfDate: asOfDate || new Date().toISOString().split('T')[0],
        assets: {
          currentAssets: { cash: 0, accountsReceivable: 0, inventory: 0, total: 0 },
          total: 0,
        },
        liabilities: {
          currentLiabilities: { accountsPayable: 0, total: 0 },
          total: 0,
        },
        equity: { retainedEarnings: 0, total: 0 },
        totalLiabilitiesAndEquity: 0,
      };
      setReportData(data);
    };

    loadReport();
  }, [asOfDate]);

  return <BalanceSheetReport data={reportData} />;
}
