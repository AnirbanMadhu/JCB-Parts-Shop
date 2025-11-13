"use client";

import { useEffect, useState } from "react";

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

interface TooltipData {
  x: number;
  y: number;
  week: string;
  purchases: number;
  invoiceCount: number;
  show: boolean;
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

export default function PurchaseChart() {
  const [purchaseData, setPurchaseData] = useState<PurchaseChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState<{ year: number; month: number }>(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });
  const [tooltip, setTooltip] = useState<TooltipData>({
    x: 0,
    y: 0,
    week: '',
    purchases: 0,
    invoiceCount: 0,
    show: false
  });
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

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
      <div className="h-[200px] flex items-center justify-center">
        <p className="text-sm text-gray-400">Loading purchase data...</p>
      </div>
    );
  }

  if (!purchaseData || purchaseData.weeks.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200">
        <div className="text-center">
          <svg className="w-12 h-12 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-sm font-medium text-gray-500">No purchase data available</p>
          <p className="text-xs text-gray-400 mt-1">Create purchase invoices to see the chart</p>
        </div>
      </div>
    );
  }

  const totalPurchases = purchaseData.weeks.reduce((sum, w) => sum + w.purchases, 0);
  const totalInvoices = purchaseData.weeks.reduce((sum, w) => sum + w.invoiceCount, 0);
  const averageWeeklyPurchases = totalPurchases / purchaseData.weeks.length;
  const maxPurchases = Math.max(...purchaseData.weeks.map(w => w.purchases), 1);

  const chartHeight = 180;
  const chartWidth = 500;
  const padding = { top: 20, right: 30, bottom: 40, left: 50 };
  const plotHeight = chartHeight - padding.top - padding.bottom;
  const plotWidth = chartWidth - padding.left - padding.right;

  const barWidth = plotWidth / (purchaseData.weeks.length * 1.5);
  const barSpacing = barWidth * 0.5;

  const getBarHeight = (value: number) => {
    return (value / maxPurchases) * plotHeight;
  };

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
    const y = padding.top + plotHeight * (1 - ratio);
    const value = maxPurchases * ratio;
    return { y, value };
  });

  const handleBarHover = (
    event: React.MouseEvent<SVGRectElement>,
    week: WeeklyData,
    index: number
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const svgRect = event.currentTarget.ownerSVGElement?.getBoundingClientRect();
    
    if (svgRect) {
      setTooltip({
        x: rect.left - svgRect.left + rect.width / 2,
        y: rect.top - svgRect.top,
        week: week.dateRange,
        purchases: week.purchases,
        invoiceCount: week.invoiceCount,
        show: true
      });
      setHoveredBar(index);
    }
  };

  const handleBarLeave = () => {
    setTooltip(prev => ({ ...prev, show: false }));
    setHoveredBar(null);
  };

  return (
    <div className="w-full space-y-3">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2.5 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
          <p className="text-[10px] font-semibold text-orange-600 uppercase tracking-wider mb-0.5">Total Purchases</p>
          <p className="text-base font-bold text-orange-900">{formatFullCurrency(totalPurchases)}</p>
        </div>
        <div className="p-2.5 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg border border-amber-200">
          <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider mb-0.5">Invoices</p>
          <p className="text-base font-bold text-amber-900">{totalInvoices}</p>
        </div>
        <div className="p-2.5 bg-gradient-to-br from-red-50 to-red-100 rounded-lg border border-red-200">
          <p className="text-[10px] font-semibold text-red-600 uppercase tracking-wider mb-0.5">Avg/Week</p>
          <p className="text-base font-bold text-red-900">{formatCurrency(averageWeeklyPurchases)}</p>
        </div>
      </div>

      {/* Chart Title */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-800">Weekly Purchase Overview</h3>
          <p className="text-xs text-gray-500">{purchaseData.month} {purchaseData.year}</p>
        </div>
      </div>

      {/* Chart Container */}
      <div className="relative w-full bg-white rounded-lg shadow-sm border border-gray-200 p-3">
        <svg
          className="w-full"
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Gradient Definitions */}
          <defs>
            <linearGradient id="purchaseBarGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#c2410c" />
            </linearGradient>
            <linearGradient id="purchaseBarHoverGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fb923c" />
              <stop offset="100%" stopColor="#f97316" />
            </linearGradient>
            <filter id="purchaseBarShadow">
              <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
              <feOffset dx="0" dy="2" result="offsetblur"/>
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.3"/>
              </feComponentTransfer>
              <feMerge>
                <feMergeNode/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Grid lines and labels */}
          {gridLines.map((line, i) => (
            <g key={i}>
              <line
                x1={padding.left}
                y1={line.y}
                x2={chartWidth - padding.right}
                y2={line.y}
                stroke={i === 0 ? "#d1d5db" : "#e5e7eb"}
                strokeWidth={i === 0 ? "1.5" : "1"}
                strokeDasharray={i === 0 ? "0" : "5,5"}
                opacity={i === 0 ? "0.8" : "0.5"}
              />
              <text
                x={padding.left - 8}
                y={line.y + 3}
                textAnchor="end"
                fontSize="10"
                fill="#6b7280"
                fontWeight="500"
              >
                {formatCurrency(line.value)}
              </text>
            </g>
          ))}

          {/* Bars */}
          {purchaseData.weeks.map((week, i) => {
            const x = padding.left + i * (barWidth + barSpacing) + barSpacing;
            const barHeight = getBarHeight(week.purchases);
            const y = padding.top + plotHeight - barHeight;
            const isHovered = hoveredBar === i;

            return (
              <g key={i}>
                {/* Bar */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={isHovered ? "url(#purchaseBarHoverGradient)" : "url(#purchaseBarGradient)"}
                  rx="3"
                  ry="3"
                  filter="url(#purchaseBarShadow)"
                  style={{ 
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out'
                  }}
                  onMouseEnter={(e) => handleBarHover(e, week, i)}
                  onMouseLeave={handleBarLeave}
                  opacity={isHovered ? "1" : "0.9"}
                />
                
                {/* Value on top of bar */}
                {week.purchases > 0 && (
                  <text
                    x={x + barWidth / 2}
                    y={y - 5}
                    textAnchor="middle"
                    fontSize="9"
                    fill="#374151"
                    fontWeight="600"
                  >
                    {formatCurrency(week.purchases)}
                  </text>
                )}

                {/* Week label */}
                <text
                  x={x + barWidth / 2}
                  y={chartHeight - padding.bottom + 15}
                  textAnchor="middle"
                  fontSize="9"
                  fill="#374151"
                  fontWeight="600"
                >
                  {week.dateRange}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Custom Tooltip */}
        {tooltip.show && (
          <div
            className="absolute z-50 pointer-events-none transition-all duration-200"
            style={{
              left: `${tooltip.x}px`,
              top: `${tooltip.y - 10}px`,
              transform: 'translate(-50%, -100%)'
            }}
          >
            <div className="bg-gray-900 text-white rounded-md shadow-xl p-2.5 min-w-[140px] border border-gray-700">
              <div className="font-bold text-xs mb-1.5 text-gray-200 border-b border-gray-700 pb-1">
                {tooltip.week}
              </div>
              <div className="space-y-1 text-[11px]">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-gray-300">Purchases</span>
                  <span className="font-bold text-orange-400">{formatFullCurrency(tooltip.purchases)}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-gray-300">Invoices</span>
                  <span className="font-bold text-amber-400">{tooltip.invoiceCount}</span>
                </div>
              </div>
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                <div className="w-0 h-0 border-l-6 border-r-6 border-t-6 border-l-transparent border-r-transparent border-t-gray-900"></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
