"use client";

import { useEffect, useState } from "react";

interface MonthlyData {
  month: number;
  year: number;
  monthName: string;
  monthYear: string;
  sales: number;
  purchases: number;
  netCashflow: number;
  stockBalance: number;
}

interface CashflowData {
  startMonth: string;
  endMonth: string;
  data: MonthlyData[];
}

interface TooltipData {
  x: number;
  y: number;
  month: string;
  sales: number;
  purchases: number;
  netCashflow: number;
  stockBalance: number;
  show: boolean;
}

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
  const [currentMonth, setCurrentMonth] = useState<{ year: number; month: number }>(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });
  const [tooltip, setTooltip] = useState<TooltipData>({
    x: 0,
    y: 0,
    month: '',
    sales: 0,
    purchases: 0,
    netCashflow: 0,
    stockBalance: 0,
    show: false
  });
  const [hoveredPoint, setHoveredPoint] = useState<{ type: 'sales' | 'purchases' | 'stock' | null, index: number | null }>({ type: null, index: null });

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
      setCashflowData(data);
    } catch (error) {
      console.error("Failed to fetch cashflow data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[250px] flex items-center justify-center">
        <p className="text-sm text-gray-400">Loading cashflow data...</p>
      </div>
    );
  }

  if (!cashflowData || cashflowData.data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-sm font-medium text-gray-500">No cashflow data available</p>
          <p className="text-xs text-gray-400 mt-1">Data will appear once invoices are created</p>
        </div>
      </div>
    );
  }

  const totalSales = cashflowData.data.reduce((sum, d) => sum + d.sales, 0);
  const totalPurchases = cashflowData.data.reduce((sum, d) => sum + d.purchases, 0);
  const netProfit = totalSales - totalPurchases;
  const profitMargin = totalSales > 0 ? ((netProfit / totalSales) * 100) : 0;
  const currentStockBalance = cashflowData.data[cashflowData.data.length - 1]?.stockBalance || 0;

  // Calculate max value for scaling with some headroom
  const maxValue = Math.max(
    ...cashflowData.data.map((d) => Math.max(d.sales, d.purchases, d.stockBalance)),
    1 // Minimum value to avoid division by zero
  );
  const chartMax = maxValue * 1.1; // Add 10% headroom
  
  const chartHeight = 200;
  const chartWidth = 1000;
  const padding = { top: 30, right: 40, bottom: 35, left: 55 };
  const plotHeight = chartHeight - padding.top - padding.bottom;
  const plotWidth = chartWidth - padding.left - padding.right;

  // Calculate points for sales and purchases lines
  const getYPosition = (value: number) => {
    if (chartMax === 0) return plotHeight + padding.top;
    return plotHeight + padding.top - (value / chartMax) * plotHeight;
  };

  const monthWidth = plotWidth / 12;

  const salesPoints = cashflowData.data
    .map((d, i) => {
      const x = padding.left + i * monthWidth + monthWidth / 2;
      const y = getYPosition(d.sales);
      return `${x},${y}`;
    })
    .join(" ");

  const purchasesPoints = cashflowData.data
    .map((d, i) => {
      const x = padding.left + i * monthWidth + monthWidth / 2;
      const y = getYPosition(d.purchases);
      return `${x},${y}`;
    })
    .join(" ");

  const stockBalancePoints = cashflowData.data
    .map((d, i) => {
      const x = padding.left + i * monthWidth + monthWidth / 2;
      const y = getYPosition(d.stockBalance);
      return `${x},${y}`;
    })
    .join(" ");

  // Grid lines (5 horizontal lines)
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
    const y = padding.top + plotHeight * (1 - ratio);
    const value = chartMax * ratio;
    return { y, value };
  });

  const handlePointHover = (
    event: React.MouseEvent<SVGCircleElement>,
    type: 'sales' | 'purchases' | 'stock',
    data: MonthlyData,
    index: number
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const svgRect = event.currentTarget.ownerSVGElement?.getBoundingClientRect();
    
    if (svgRect) {
      setTooltip({
        x: rect.left - svgRect.left + rect.width / 2,
        y: rect.top - svgRect.top,
        month: data.monthYear,
        sales: data.sales,
        purchases: data.purchases,
        netCashflow: data.netCashflow,
        stockBalance: data.stockBalance,
        show: true
      });
      setHoveredPoint({ type, index });
    }
  };

  const handlePointLeave = () => {
    setTooltip(prev => ({ ...prev, show: false }));
    setHoveredPoint({ type: null, index: null });
  };

  return (
    <div className="w-full space-y-3">
      {/* Enhanced Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="relative overflow-hidden p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white opacity-5 rounded-full -mr-10 -mt-10"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-semibold text-emerald-100 uppercase tracking-wider">Total Sales</p>
              <svg className="w-4 h-4 text-emerald-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <p className="text-xl font-bold text-white mb-0.5">
              {formatFullCurrency(totalSales)}
            </p>
            <div className="flex items-center gap-1 text-emerald-100 text-[10px]">
              <span className="flex items-center gap-0.5">
                <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                Revenue
              </span>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden p-3 bg-gradient-to-br from-rose-500 to-red-600 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white opacity-5 rounded-full -mr-10 -mt-10"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-semibold text-rose-100 uppercase tracking-wider">Total Purchases</p>
              <svg className="w-4 h-4 text-rose-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            </div>
            <p className="text-xl font-bold text-white mb-0.5">
              {formatFullCurrency(totalPurchases)}
            </p>
            <div className="flex items-center gap-1 text-rose-100 text-[10px]">
              <span className="flex items-center gap-0.5">
                <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Expenses
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Title and Period */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-gray-800">Monthly Cashflow Analysis</h3>
          <p className="text-xs text-gray-500">{cashflowData.startMonth} - {cashflowData.endMonth}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-0.5 bg-gradient-to-r from-emerald-500 to-green-600 rounded-full"></div>
            <span className="text-xs font-semibold text-gray-700">Sales</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-0.5 bg-gradient-to-r from-rose-500 to-red-600 rounded-full"></div>
            <span className="text-xs font-semibold text-gray-700">Purchases</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"></div>
            <span className="text-xs font-semibold text-gray-700">Stock Balance</span>
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="relative w-full overflow-hidden bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="w-full overflow-x-auto p-4">
          <svg
            className="w-full min-w-[900px]"
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Gradient Definitions */}
            <defs>
              <linearGradient id="salesGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
              </linearGradient>
              <linearGradient id="purchasesGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0.02" />
              </linearGradient>
              <linearGradient id="salesLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#059669" />
                <stop offset="50%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#34d399" />
              </linearGradient>
            <linearGradient id="purchasesLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#dc2626" />
              <stop offset="50%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#f87171" />
            </linearGradient>
            <linearGradient id="stockLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2563eb" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#60a5fa" />
            </linearGradient>
            <linearGradient id="stockGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
            </linearGradient>
              <filter id="shadow">
                <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
                <feOffset dx="0" dy="2" result="offsetblur"/>
                <feComponentTransfer>
                  <feFuncA type="linear" slope="0.2"/>
                </feComponentTransfer>
                <feMerge>
                  <feMergeNode/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
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
              x={padding.left - 10}
              y={line.y + 4}
              textAnchor="end"
              fontSize="11"
              fill="#6b7280"
              fontWeight="600"
            >
              {formatCurrency(line.value)}
            </text>
            <line
              x1={chartWidth - padding.right}
              y1={line.y}
              x2={chartWidth - padding.right + 10}
              y2={line.y}
              stroke="#d1d5db"
              strokeWidth="1.5"
            />
          </g>
        ))}

        {/* Month labels */}
        {cashflowData.data.map((d, i) => (
          <text
            key={i}
            x={padding.left + i * monthWidth + monthWidth / 2}
            y={chartHeight - padding.bottom + 20}
            textAnchor="middle"
            fontSize="11"
            fill="#374151"
            fontWeight="600"
          >
            {d.monthName}
          </text>
        ))}
        
        {/* Year labels (show year when month changes) */}
        {cashflowData.data.map((d, i) => {
          const showYear = i === 0 || d.month === 1;
          if (!showYear) return null;
          return (
            <text
              key={`year-${i}`}
              x={padding.left + i * monthWidth + monthWidth / 2}
              y={chartHeight - padding.bottom + 32}
              textAnchor="middle"
              fontSize="9"
              fill="#9ca3af"
              fontWeight="500"
            >
              {d.year}
            </text>
          );
        })}

        {/* Area gradients under lines */}
        {/* Sales area */}
        <path
          d={`M ${padding.left},${plotHeight + padding.top} ${salesPoints} L ${padding.left + plotWidth},${plotHeight + padding.top} Z`}
          fill="url(#salesGradient)"
        />
        
        {/* Stock Balance area */}
        <path
          d={`M ${padding.left},${plotHeight + padding.top} ${stockBalancePoints} L ${padding.left + plotWidth},${plotHeight + padding.top} Z`}
          fill="url(#stockGradient)"
        />

        {/* Stock Balance line */}
        <polyline
          points={stockBalancePoints}
          fill="none"
          stroke="url(#stockLineGradient)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#shadow)"
        />

        {/* Sales line */}
        <polyline
          points={salesPoints}
          fill="none"
          stroke="url(#salesLineGradient)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#shadow)"
        />

        {/* Purchases line */}
        <polyline
          points={purchasesPoints}
          fill="none"
          stroke="url(#purchasesLineGradient)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#shadow)"
        />

        {/* Sales points */}
        {cashflowData.data.map((d, i) => {
          const x = padding.left + i * monthWidth + monthWidth / 2;
          const y = getYPosition(d.sales);
          if (d.sales === 0) return null;
          const isHovered = hoveredPoint.type === 'sales' && hoveredPoint.index === i;
          return (
            <g key={`sales-${i}`}>
              <circle
                cx={x}
                cy={y}
                r={isHovered ? "6" : "4"}
                fill="#10b981"
                stroke="white"
                strokeWidth="2"
                filter={isHovered ? "url(#glow)" : "url(#shadow)"}
                style={{ 
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out'
                }}
                onMouseEnter={(e) => handlePointHover(e, 'sales', d, i)}
                onMouseLeave={handlePointLeave}
              />
              {isHovered && (
                <circle
                  cx={x}
                  cy={y}
                  r="12"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  opacity="0.3"
                >
                  <animate
                    attributeName="r"
                    from="12"
                    to="20"
                    dur="1s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    from="0.3"
                    to="0"
                    dur="1s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}
            </g>
          );
        })}

        {/* Purchases points */}
        {cashflowData.data.map((d, i) => {
          const x = padding.left + i * monthWidth + monthWidth / 2;
          const y = getYPosition(d.purchases);
          if (d.purchases === 0) return null;
          const isHovered = hoveredPoint.type === 'purchases' && hoveredPoint.index === i;
          return (
            <g key={`purchase-${i}`}>
              <circle
                cx={x}
                cy={y}
                r={isHovered ? "6" : "4"}
                fill="#ef4444"
                stroke="white"
                strokeWidth="2"
                filter={isHovered ? "url(#glow)" : "url(#shadow)"}
                style={{ 
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out'
                }}
                onMouseEnter={(e) => handlePointHover(e, 'purchases', d, i)}
                onMouseLeave={handlePointLeave}
              />
              {isHovered && (
                <circle
                  cx={x}
                  cy={y}
                  r="12"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2"
                  opacity="0.3"
                >
                  <animate
                    attributeName="r"
                    from="12"
                    to="20"
                    dur="1s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    from="0.3"
                    to="0"
                    dur="1s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}
            </g>
          );
        })}

        {/* Stock Balance points */}
        {cashflowData.data.map((d, i) => {
          const x = padding.left + i * monthWidth + monthWidth / 2;
          const y = getYPosition(d.stockBalance);
          if (d.stockBalance === 0 && i === 0) return null;
          const isHovered = hoveredPoint.type === 'stock' && hoveredPoint.index === i;
          return (
            <g key={`stock-${i}`}>
              <circle
                cx={x}
                cy={y}
                r={isHovered ? "6" : "4"}
                fill="#3b82f6"
                stroke="white"
                strokeWidth="2"
                filter={isHovered ? "url(#glow)" : "url(#shadow)"}
                style={{ 
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out'
                }}
                onMouseEnter={(e) => handlePointHover(e, 'stock', d, i)}
                onMouseLeave={handlePointLeave}
              />
              {isHovered && (
                <circle
                  cx={x}
                  cy={y}
                  r="12"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  opacity="0.3"
                >
                  <animate
                    attributeName="r"
                    from="12"
                    to="20"
                    dur="1s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    from="0.3"
                    to="0"
                    dur="1s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}
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
          <div className="bg-gray-900 text-white rounded-md shadow-xl p-3 min-w-[180px] border border-gray-700">
            <div className="font-bold text-xs mb-2 text-gray-200 border-b border-gray-700 pb-1.5">
              {tooltip.month}
            </div>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                  <span className="text-gray-300">Sales</span>
                </span>
                <span className="font-bold text-emerald-400">{formatFullCurrency(tooltip.sales)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                  <span className="text-gray-300">Purchases</span>
                </span>
                <span className="font-bold text-rose-400">{formatFullCurrency(tooltip.purchases)}</span>
              </div>
              <div className="pt-1.5 mt-1.5 border-t border-gray-700">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                    <span className="text-gray-300">Stock Balance</span>
                  </span>
                  <span className="font-bold text-blue-400">{formatFullCurrency(tooltip.stockBalance)}</span>
                </div>
              </div>
              <div className="pt-1.5 mt-1.5 border-t border-gray-700">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-300">Net Flow</span>
                  <span className={`font-bold ${tooltip.netCashflow >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {tooltip.netCashflow >= 0 ? '+' : ''}{formatFullCurrency(tooltip.netCashflow)}
                  </span>
                </div>
              </div>
            </div>
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
              <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-gray-900"></div>
            </div>
          </div>
        </div>
      )}
      </div>
      </div>
    </div>
  );
}
