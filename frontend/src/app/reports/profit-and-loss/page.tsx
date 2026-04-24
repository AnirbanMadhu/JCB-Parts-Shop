"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProfitAndLossReport from "@/app/reports/_components/ProfitAndLossReport";
import { authFetch } from "@/lib/auth";



export const dynamic = 'force-dynamic';

export default function ProfitAndLossPage() {
  const searchParams = useSearchParams();
  const startDate = searchParams?.get('startDate') || undefined;
  const endDate = searchParams?.get('endDate') || undefined;
  const [reportData, setReportData] = useState<any>({
    totalPurchases: 0,
    totalSales: 0,
    profitLoss: 0,
    profitMargin: '0%',
    startDate,
    endDate,
  });

  useEffect(() => {
    const loadReport = async () => {
      const query = new URLSearchParams();
      if (startDate) query.set('startDate', startDate);
      if (endDate) query.set('endDate', endDate);

      const response = await authFetch(`/api/reports/profit-loss${query.toString() ? `?${query.toString()}` : ''}`);
      const data = response.ok ? await response.json() : {
        totalPurchases: 0,
        totalSales: 0,
        profitLoss: 0,
        profitMargin: '0%',
        startDate,
        endDate,
      };
      setReportData(data);
    };

    loadReport();
  }, [startDate, endDate]);

  return <ProfitAndLossReport data={reportData} />;
}
