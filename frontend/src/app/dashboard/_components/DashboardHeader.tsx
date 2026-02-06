"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { fetchWithTimeout } from "@/lib/fetch-utils";

export default function DashboardHeader() {
  const router = useRouter();
  const [stockBalance, setStockBalance] = useState<number>(0);
  const [netFlow, setNetFlow] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    
    // Fetch stock balance and net flow data
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch all data in parallel with timeout (15s)
        const [salesRes, purchasesRes, stockRes] = await Promise.all([
          fetchWithTimeout(`/api/invoices?type=SALE`, { 
            timeout: 15000,
            signal: controller.signal 
          }),
          fetchWithTimeout(`/api/invoices?type=PURCHASE`, { 
            timeout: 15000,
            signal: controller.signal 
          }),
          fetchWithTimeout(`/api/stock?onlyPurchased=true`, { 
            timeout: 15000,
            signal: controller.signal 
          })
        ]);
        
        // Process sales and purchases data
        if (salesRes.ok && purchasesRes.ok) {
          const [salesData, purchasesData] = await Promise.all([
            salesRes.json(),
            purchasesRes.json()
          ]);
          
          const totalSales = salesData.reduce((sum: number, inv: any) => sum + Number(inv.total || 0), 0);
          const totalPurchases = purchasesData.reduce((sum: number, inv: any) => sum + Number(inv.total || 0), 0);
          
          setNetFlow(totalSales - totalPurchases);
        }

        // Process stock data
        if (stockRes.ok) {
          const stockData = await stockRes.json();
          const balance = stockData.reduce((sum: number, item: any) => {
            const stockQty = Number(item.stock || 0);
            const price = Number(item.mrp || item.rtl || 0);
            return sum + (stockQty * price);
          }, 0);
          setStockBalance(balance);
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Error fetching dashboard data:', error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    
    // Cleanup: abort any pending requests
    return () => controller.abort();
  }, []);

  return (
    <header className="sticky top-0 z-10 bg-background border-b border-border px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-accent rounded-md transition-colors cursor-pointer">
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
      </div>
    </header>
  );
}
