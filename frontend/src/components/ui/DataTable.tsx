'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronDown, 
  ChevronUp, 
  ChevronsUpDown, 
  Search, 
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { staggerContainer, staggerItem } from '@/lib/motion';

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
  className?: string;
  exportValue?: (row: T) => string | number;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchable?: boolean;
  searchKeys?: (keyof T)[];
  exportable?: boolean;
  exportFileName?: string;
  pagination?: boolean;
  pageSize?: number;
  className?: string;
  emptyMessage?: string;
  loading?: boolean;
}

type SortDirection = 'asc' | 'desc' | null;

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchable = true,
  searchKeys,
  exportable = true,
  exportFileName = 'data-export',
  pagination = true,
  pageSize = 10,
  className = '',
  emptyMessage = 'No data found',
  loading = false,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!searchQuery || !searchKeys) return data;

    const query = searchQuery.toLowerCase();
    return data.filter((row) =>
      searchKeys.some((key) => {
        const value = row[key];
        return value?.toString().toLowerCase().includes(query);
      })
    );
  }, [data, searchQuery, searchKeys]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      if (aValue === bValue) return 0;

      const comparison = aValue < bValue ? -1 : 1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortColumn, sortDirection]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, pageSize, pagination]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  // Handle sort
  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortColumn(null);
      }
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  // Export to CSV
  const handleExport = () => {
    const headers = columns.map((col) => col.header);
    const rows = sortedData.map((row) =>
      columns.map((col) => {
        if (col.exportValue) {
          return col.exportValue(row);
        }
        const value = row[col.key];
        return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
      })
    );

    const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${exportFileName}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderSortIcon = (columnKey: string) => {
    if (sortColumn !== columnKey) {
      return <ChevronsUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4 text-blue-600" />
    ) : (
      <ChevronDown className="w-4 h-4 text-blue-600" />
    );
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow ${className}`}>
        <div className="p-8 text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-card rounded-lg shadow ${className}`}>
      {/* Header with search and export */}
      {(searchable || exportable) && (
        <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-border flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          {searchable && (
            <div className="flex-1 min-w-0 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-border rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-primary focus:border-blue-500 dark:focus:border-primary outline-none bg-white dark:bg-background text-gray-900 dark:text-foreground"
              />
            </div>
          )}
          {exportable && (
            <button
              onClick={handleExport}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-muted hover:bg-gray-200 dark:hover:bg-muted/80 text-gray-700 dark:text-foreground rounded-lg transition-colors font-medium cursor-pointer touch-manipulation text-sm sm:text-base"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export CSV</span>
              <span className="sm:hidden">Export</span>
            </button>
          )}
        </div>
      )}

      {/* Table - Desktop View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-muted/30 border-b border-gray-200 dark:border-border">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-muted-foreground uppercase tracking-wider ${
                    column.sortable ? 'cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-muted/50' : ''
                  } ${column.className || ''}`}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    {column.header}
                    {column.sortable && renderSortIcon(column.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <motion.tbody
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="bg-white dark:bg-card divide-y divide-gray-200 dark:divide-border"
          >
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center">
                  <p className="text-gray-500 dark:text-muted-foreground">{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <motion.tr
                  key={rowIndex}
                  variants={staggerItem}
                  className="hover:bg-gray-50 dark:hover:bg-muted/20 transition-colors"
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-foreground ${column.className || ''}`}
                    >
                      {column.render ? column.render(row) : row[column.key]}
                    </td>
                  ))}
                </motion.tr>
              ))
            )}
          </motion.tbody>
        </table>
      </div>

      {/* Card View - Mobile */}
      <div className="md:hidden">
        {paginatedData.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-gray-500 dark:text-muted-foreground">{emptyMessage}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-border">
            {paginatedData.map((row, rowIndex) => (
              <motion.div
                key={rowIndex}
                variants={staggerItem}
                initial="hidden"
                animate="visible"
                className="p-4 space-y-2"
              >
                {columns.map((column) => (
                  <div key={column.key} className="flex justify-between items-start gap-2">
                    <span className="text-xs font-medium text-gray-500 dark:text-muted-foreground uppercase">
                      {column.header}:
                    </span>
                    <span className="text-sm text-gray-900 dark:text-foreground text-right flex-1">
                      {column.render ? column.render(row) : row[column.key]}
                    </span>
                  </div>
                ))}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="px-3 sm:px-6 py-3 sm:py-4 border-t border-gray-200 dark:border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs sm:text-sm text-gray-700 dark:text-foreground text-center sm:text-left">
            Showing{' '}
            <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{' '}
            <span className="font-medium">
              {Math.min(currentPage * pageSize, sortedData.length)}
            </span>{' '}
            of <span className="font-medium">{sortedData.length}</span> results
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer touch-manipulation"
              aria-label="First page"
            >
              <ChevronsLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer touch-manipulation"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (page) =>
                    page === 1 ||
                    page === totalPages ||
                    Math.abs(page - currentPage) <= 1
                )
                .map((page, index, array) => (
                  <div key={page} className="flex items-center">
                    {index > 0 && array[index - 1] !== page - 1 && (
                      <span className="px-1 sm:px-2 text-gray-400 dark:text-muted-foreground text-xs sm:text-sm">...</span>
                    )}
                    <button
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-[28px] sm:min-w-[36px] px-2 sm:px-3 py-1 rounded-lg transition-colors cursor-pointer touch-manipulation text-xs sm:text-sm ${
                        currentPage === page
                          ? 'bg-blue-600 dark:bg-primary text-white'
                          : 'hover:bg-gray-100 dark:hover:bg-muted text-gray-700 dark:text-foreground'
                      }`}
                    >
                      {page}
                    </button>
                  </div>
                ))}
            </div>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer touch-manipulation"
              aria-label="Next page"
            >
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer touch-manipulation"
              aria-label="Last page"
            >
              <ChevronsRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
