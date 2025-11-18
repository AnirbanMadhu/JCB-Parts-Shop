"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
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
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface WeeklyData {
  weekNumber: number;
  weekLabel: string;
  dateRange: string;
  startDate: string;
  endDate: string;
  purchases: number;
  invoiceCount: number;
}

interface PurchaseChartData {
  month: string;
  year: number;
  weeks: WeeklyData[];
}

const formatCurrency = (value: number): string => {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
  return `₹${value.toFixed(0)}`;
};

const formatFullCurrency = (value: number): string => {
  return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

const chartConfig = {
  purchases: {
    label: "Purchase Amount",
    theme: {
      light: "hsl(24, 95%, 53%)",
      dark: "hsl(24, 90%, 58%)",
    },
  },
  invoiceCount: {
    label: "Invoice Count",
    theme: {
      light: "hsl(45, 93%, 47%)",
      dark: "hsl(45, 88%, 55%)",
    },
  },
} satisfies ChartConfig;

export default function PurchaseChart() {
  const [purchaseData, setPurchaseData] = useState<PurchaseChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeChart, setActiveChart] = React.useState<keyof typeof chartConfig>("purchases");
  const [currentMonth, setCurrentMonth] = useState<{ year: number; month: number }>(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });

  const total = React.useMemo(
    () => ({
      purchases: purchaseData?.weeks.reduce((acc, curr) => acc + curr.purchases, 0) || 0,
      invoiceCount: purchaseData?.weeks.reduce((acc, curr) => acc + curr.invoiceCount, 0) || 0,
    }),
    [purchaseData]
  );

  useEffect(() => {
    fetchWeeklyPurchaseData();
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

  const fetchWeeklyPurchaseData = async () => {
    try {
      setLoading(true);
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
      const response = await fetch(
        `${API_BASE_URL}/api/reports/weekly-purchases?year=${currentMonth.year}&month=${currentMonth.month}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setPurchaseData(data);
    } catch (error) {
      console.error("Failed to fetch weekly purchase data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading purchase data...</p>
        </CardContent>
      </Card>
    );
  }

  if (!purchaseData || purchaseData.weeks.length === 0) {
    return (
      <Card>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto text-muted-foreground/30 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-sm font-medium text-muted-foreground">No purchase data available</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Create purchase invoices to see the chart</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const averageWeeklyPurchases = total.purchases / purchaseData.weeks.length;

  return (
    <Card className="py-0">
      <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:!py-6">
          <CardTitle>Purchase Chart</CardTitle>
          <CardDescription>
            {purchaseData.month} {purchaseData.year}
          </CardDescription>
        </div>
        <div className="flex">
          {(["purchases", "invoiceCount"] as const).map((key) => {
            const chart = key as keyof typeof chartConfig;
            return (
              <button
                key={chart}
                data-active={activeChart === chart}
                className="data-[active=true]:bg-muted/50 relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6"
                onClick={() => setActiveChart(chart)}
              >
                <span className="text-muted-foreground text-xs uppercase">
                  {chartConfig[chart].label}
                </span>
                <span className="text-lg leading-none font-bold sm:text-2xl">
                  {key === "purchases" 
                    ? formatCurrency(total[key])
                    : total[key]
                  }
                </span>
              </button>
            );
          })}
          <button
            className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6 bg-muted/30"
          >
            <span className="text-muted-foreground text-xs uppercase">
              AVG/WEEK
            </span>
            <span className="text-lg leading-none font-bold sm:text-2xl">
              {formatCurrency(averageWeeklyPurchases)}
            </span>
          </button>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <BarChart
            accessibilityLayer
            data={purchaseData.weeks}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid 
              vertical={false} 
              strokeDasharray="3 3" 
              stroke="currentColor"
              opacity={0.2}
            />
            <XAxis
              dataKey="dateRange"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tick={{ fill: 'currentColor' }}
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
                  className="w-[150px]"
                  labelFormatter={(value, payload) => {
                    if (payload && payload[0]) {
                      return payload[0].payload.dateRange;
                    }
                    return value;
                  }}
                  formatter={(value, name) => {
                    if (name === "purchases") {
                      return [formatFullCurrency(Number(value)), "Purchases"];
                    }
                    return [value, "Invoices"];
                  }}
                />
              }
            />
            <Bar 
              dataKey="purchases"
              fill="var(--color-purchases)"
              radius={[4, 4, 0, 0]}
              hide={activeChart !== "purchases"}
            />
            <Bar 
              dataKey="invoiceCount"
              fill="var(--color-invoiceCount)"
              radius={[4, 4, 0, 0]}
              hide={activeChart !== "invoiceCount"}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
