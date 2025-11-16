"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useState, useEffect } from "react";

export default function DashboardHeader() {
  const router = useRouter();
  const [stockBalance, setStockBalance] = useState<number>(0);
  const [netFlow, setNetFlow] = useState<number>(0);

  useEffect(() => {
    // Fetch stock balance and net flow data
    const fetchData = async () => {
      try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
        
        // Fetch invoices to calculate net flow
        const salesRes = await fetch(`${API_BASE_URL}/api/invoices?type=SALE`);
        const purchasesRes = await fetch(`${API_BASE_URL}/api/invoices?type=PURCHASE`);
        
        if (salesRes.ok && purchasesRes.ok) {
          const salesData = await salesRes.json();
          const purchasesData = await purchasesRes.json();
          
          const totalSales = salesData.reduce((sum: number, inv: any) => sum + Number(inv.total || 0), 0);
          const totalPurchases = purchasesData.reduce((sum: number, inv: any) => sum + Number(inv.total || 0), 0);
          
          const flow = totalSales - totalPurchases;
          setNetFlow(flow);
        }

        // Fetch stock data for stock balance
        const stockRes = await fetch(`${API_BASE_URL}/api/stock`);
        if (stockRes.ok) {
          const stockData = await stockRes.json();
          const balance = stockData.reduce((sum: number, item: any) => {
            return sum + (Number(item.quantity || 0) * Number(item.unitPrice || 0));
          }, 0);
          setStockBalance(balance);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-md">
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </button>
        <h1 className="text-xl font-semibold text-gray-800">Dashboard</h1>
      </div>
    </header>
  );
}
