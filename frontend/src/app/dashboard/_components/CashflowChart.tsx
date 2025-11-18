"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MonthlyData {
  month: number;
  year: number;
  monthName: string;
  monthYear: string;
  sales: number;
  purchases: number;
  netCashflow: number;
  stockBalance: number;
  date: string;
}

interface CashflowData {
  startMonth: string;
  endMonth: string;
  data: MonthlyData[];
}

const chartConfig = {
  sales: {
    label: "Sales",
    theme: {
      light: "hsl(142, 76%, 36%)",
      dark: "hsl(142, 70%, 45%)",
    },
  },
  purchases: {
    label: "Purchases",
    theme: {
      light: "hsl(0, 84%, 60%)",
      dark: "hsl(0, 72%, 55%)",
    },
  },
  stockBalance: {
    label: "Stock Balance",
    theme: {
      light: "hsl(217, 91%, 60%)",
      dark: "hsl(217, 91%, 65%)",
    },
  },
} satisfies ChartConfig;

// Helper function to format large numbers
const formatCurrency = (value: number): string => {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
  return `₹${value.toFixed(0)}`;
};

const formatFullCurrency = (value: number): string => {
  return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

export default function CashflowChart() {
  const [cashflowData, setCashflowData] = useState<CashflowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("12");
  const [currentMonth, setCurrentMonth] = useState<{ year: number; month: number }>(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });

  // Filter data based on selected time range - must be before conditional returns
  const filteredData = React.useMemo(() => {
    if (!cashflowData) return [];
    const months = parseInt(timeRange);
    return cashflowData.data.slice(-months);
  }, [cashflowData, timeRange]);

  const totalSales = React.useMemo(() => 
    filteredData.reduce((sum, d) => sum + d.sales, 0), 
    [filteredData]
  );
  
  const totalPurchases = React.useMemo(() => 
    filteredData.reduce((sum, d) => sum + d.purchases, 0), 
    [filteredData]
  );
  
  const netProfit = React.useMemo(() => 
    totalSales - totalPurchases, 
    [totalSales, totalPurchases]
  );

  useEffect(() => {
    fetchCashflowData();
  }, [currentMonth]);

  useEffect(() => {
    // Check every hour if the month has changed
    const checkMonthChange = () => {
      const now = new Date();
      const newYear = now.getFullYear();
      const newMonth = now.getMonth() + 1;
      
      if (newYear !== currentMonth.year || newMonth !== currentMonth.month) {
        setCurrentMonth({ year: newYear, month: newMonth });
      }
    };

    // Check immediately
    checkMonthChange();

    // Set up interval to check every hour (3600000 ms)
    const interval = setInterval(checkMonthChange, 3600000);

    return () => clearInterval(interval);
  }, [currentMonth]);

  const fetchCashflowData = async () => {
    try {
      setLoading(true);
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
      const response = await fetch(
        `${API_BASE_URL}/api/reports/cashflow?year=${currentMonth.year}&month=${currentMonth.month}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Add date field for each data point
      const dataWithDates = {
        ...data,
        data: data.data.map((item: MonthlyData) => ({
          ...item,
          date: `${item.year}-${String(item.month).padStart(2, '0')}-01`
        }))
      };
      
      setCashflowData(dataWithDates);
    } catch (error) {
      console.error("Failed to fetch cashflow data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading cashflow data...</p>
        </CardContent>
      </Card>
    );
  }

  if (!cashflowData || cashflowData.data.length === 0) {
    return (
      <Card>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="text-center">
            <svg className="w-16 h-16 mx-auto text-muted-foreground/30 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-sm font-medium text-muted-foreground">No cashflow data available</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Data will appear once invoices are created</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="pt-0">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>Monthly Cashflow Analysis</CardTitle>
          <CardDescription>
            {cashflowData.startMonth} - {cashflowData.endMonth}
          </CardDescription>
        </div>
        <div className="flex items-center gap-4">
          {/* Summary Stats */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[hsl(142,76%,36%)] dark:bg-[hsl(142,70%,45%)]" />
              <span className="font-medium text-foreground">Sales: {formatCurrency(totalSales)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[hsl(0,84%,60%)] dark:bg-[hsl(0,62%,50%)]" />
              <span className="font-medium text-foreground">Purchases: {formatCurrency(totalPurchases)}</span>
            </div>
            <div className={`font-semibold ${netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              Net: {formatCurrency(netProfit)}
            </div>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="w-[160px] rounded-lg sm:ml-auto"
              aria-label="Select time range"
            >
              <SelectValue placeholder="Last 12 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="3" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="6" className="rounded-lg">
                Last 6 months
              </SelectItem>
              <SelectItem value="12" className="rounded-lg">
                Last 12 months
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[300px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillSales" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-sales)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-sales)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillPurchases" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-purchases)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-purchases)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillStockBalance" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-stockBalance)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-stockBalance)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid 
              vertical={false} 
              strokeDasharray="3 3" 
              stroke="currentColor"
              opacity={0.2}
            />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tick={{ fill: 'currentColor' }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  year: "2-digit",
                });
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fill: 'currentColor' }}
              tickFormatter={formatCurrency}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    });
                  }}
                  formatter={(value, name) => {
                    const labels: Record<string, string> = {
                      sales: "Sales",
                      purchases: "Purchases",
                      stockBalance: "Stock Balance"
                    };
                    return [formatFullCurrency(Number(value)), labels[name as string] || name];
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="stockBalance"
              type="natural"
              fill="url(#fillStockBalance)"
              stroke="var(--color-stockBalance)"
              strokeWidth={2}
              dot={false}
            />
            <Area
              dataKey="purchases"
              type="natural"
              fill="url(#fillPurchases)"
              stroke="var(--color-purchases)"
              strokeWidth={2}
              dot={false}
            />
            <Area
              dataKey="sales"
              type="natural"
              fill="url(#fillSales)"
              stroke="var(--color-sales)"
              strokeWidth={2}
              dot={false}
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
