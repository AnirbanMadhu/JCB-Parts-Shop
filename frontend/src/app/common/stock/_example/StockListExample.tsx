'use client';

import { motion } from 'framer-motion';
import { DataTable, Column } from '@/components/ui/DataTable';
import { useStock } from '@/hooks/useAPI';
import { fadeIn } from '@/lib/motion';
import { Package, TrendingDown, TrendingUp } from 'lucide-react';

interface StockItem {
  id: number;
  partNumber: string;
  itemName: string;
  stock: number;
  mrp?: number;
  rtl?: number;
  unit: string;
}

export default function StockListExample() {
  const { data: stockData, error, isLoading } = useStock();

  const columns: Column<StockItem>[] = [
    {
      key: 'partNumber',
      header: 'Part Number',
      sortable: true,
      render: (row) => (
        <div className="font-mono font-medium text-gray-900">{row.partNumber}</div>
      ),
    },
    {
      key: 'itemName',
      header: 'Item Name',
      sortable: true,
      className: 'max-w-xs',
      render: (row) => (
        <div className="truncate" title={row.itemName}>
          {row.itemName}
        </div>
      ),
    },
    {
      key: 'stock',
      header: 'Stock',
      sortable: true,
      render: (row) => {
        const stock = row.stock || 0;
        const isLow = stock <= 10;
        const isCritical = stock <= 3;
        
        return (
          <div className="flex items-center gap-2">
            {isCritical ? (
              <TrendingDown className="w-4 h-4 text-red-600" />
            ) : isLow ? (
              <TrendingDown className="w-4 h-4 text-yellow-600" />
            ) : (
              <TrendingUp className="w-4 h-4 text-green-600" />
            )}
            <span className={`font-semibold ${
              isCritical ? 'text-red-600' : 
              isLow ? 'text-yellow-600' : 
              'text-green-600'
            }`}>
              {stock}
            </span>
            <span className="text-gray-500 text-sm">{row.unit}</span>
          </div>
        );
      },
      exportValue: (row) => row.stock || 0,
    },
    {
      key: 'mrp',
      header: 'MRP',
      sortable: true,
      className: 'text-right',
      render: (row) => (
        <span className="font-medium">
          {row.mrp ? `₹${row.mrp.toFixed(2)}` : '-'}
        </span>
      ),
      exportValue: (row) => row.mrp || 0,
    },
    {
      key: 'rtl',
      header: 'RTL',
      sortable: true,
      className: 'text-right',
      render: (row) => (
        <span className="font-medium">
          {row.rtl ? `₹${row.rtl.toFixed(2)}` : '-'}
        </span>
      ),
      exportValue: (row) => row.rtl || 0,
    },
  ];

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          <p className="font-semibold">Error loading stock data</p>
          <p className="text-sm mt-1">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="p-6"
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Package className="w-7 h-7" />
          Stock Inventory
        </h1>
        <p className="text-gray-600 mt-1">
          Real-time stock levels for all parts
        </p>
      </div>

      <DataTable
        data={stockData || []}
        columns={columns}
        searchable={true}
        searchKeys={['partNumber', 'itemName']}
        exportable={true}
        exportFileName="stock-inventory"
        pagination={true}
        pageSize={20}
        loading={isLoading}
        emptyMessage="No stock data available"
      />
    </motion.div>
  );
}
