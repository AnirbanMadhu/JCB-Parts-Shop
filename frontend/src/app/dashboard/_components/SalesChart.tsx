"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { fetchWithTimeout } from "@/lib/fetch-utils";
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
  sales: number;
  invoiceCount: number;
}

interface SalesChartData {
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
  sales: {
    label: "Sales Amount",
    theme: {
      light: "hsl(217, 91%, 60%)",
      dark: "hsl(217, 91%, 65%)",
    },
  },
  invoiceCount: {
    label: "Invoice Count",
    theme: {
      light: "hsl(142, 76%, 36%)",
      dark: "hsl(142, 70%, 45%)",
    },
  },
} satisfies ChartConfig;

export default function SalesChart() {
  const [salesData, setSalesData] = useState<SalesChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeChart, setActiveChart] = React.useState<keyof typeof chartConfig>("sales");
  const [currentMonth, setCurrentMonth] = useState<{ year: number; month: number }>(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });

  const total = React.useMemo(
    () => ({
      sales: salesData?.weeks.reduce((acc, curr) => acc + curr.sales, 0) || 0,
      invoiceCount: salesData?.weeks.reduce((acc, curr) => acc + curr.invoiceCount, 0) || 0,
    }),
    [salesData]
  );

  useEffect(() => {
    fetchWeeklySalesData();
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

  const fetchWeeklySalesData = async () => {
    const controller = new AbortController();
    
    try {
      setLoading(true);
      
      const response = await fetchWithTimeout(
        `/api/reports/weekly-sales?year=${currentMonth.year}&month=${currentMonth.month}`,
        { 
          timeout: 15000,
          signal: controller.signal 
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setSalesData(data);
    } catch (error) {
      console.error("Failed to fetch weekly sales data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading sales data...</p>
        </CardContent>
      </Card>
    );
  }

  if (!salesData || salesData.weeks.length === 0) {
    return (
      <Card>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto text-muted-foreground/30 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-sm font-medium text-muted-foreground">No sales data available</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Create sales invoices to see the chart</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const averageWeeklySales = total.sales / salesData.weeks.length;

  return (
    <Card className="py-0">
      <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:!py-6">
          <CardTitle>Sales Chart</CardTitle>
          <CardDescription>
            {salesData.month} {salesData.year}
          </CardDescription>
        </div>
        <div className="flex">
          {(["sales", "invoiceCount"] as const).map((key) => {
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
                  {key === "sales" 
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
              {formatCurrency(averageWeeklySales)}
            </span>
          </button>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[280px] sm:h-[250px] w-full"
        >
          <BarChart
            accessibilityLayer
            data={salesData.weeks}
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
              tick={{ fill: 'currentColor', fontSize: 11 }}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={60}
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
                    if (name === "sales") {
                      return [formatFullCurrency(Number(value)), "Sales"];
                    }
                    return [value, "Invoices"];
                  }}
                />
              }
            />
            <Bar 
              dataKey="sales"
              fill="var(--color-sales)"
              radius={[4, 4, 0, 0]}
              hide={activeChart !== "sales"}
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
