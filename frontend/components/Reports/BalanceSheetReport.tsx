// components/Reports/BalanceSheetReport.tsx
import BackButton from "../Common/BackButton";
import DateRangeFilter from "../Common/DateRangeFilter";

type Props = {
  data: {
    totalDebit: number;
    totalCredit: number;
    balance: number;
    accounts: any[];
  };
};

export default function BalanceSheetReport({ data }: Props) {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BackButton />
          <h1 className="text-[17px] font-semibold text-gray-900">Balance Sheet</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors border border-gray-200">
            Export
          </button>
        </div>
      </header>

      {/* Filter Section */}
      <DateRangeFilter />

      {/* Table Container */}
      <div className="px-6 py-6">
        <div className="bg-white">
          {/* Table Header */}
          <div className="grid grid-cols-[60px_1fr_150px_150px_150px] gap-4 px-4 py-3 border-b border-gray-200">
            <div className="text-xs font-medium text-gray-500">#</div>
            <div className="text-xs font-medium text-gray-500">Account</div>
            <div className="text-xs font-medium text-gray-500 text-right">Debit</div>
            <div className="text-xs font-medium text-gray-500 text-right">Credit</div>
            <div className="text-xs font-medium text-gray-500 text-right">Balance</div>
          </div>

          {/* Empty State / No Data */}
          <div className="px-4 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Closing</span>
              <div className="flex gap-8">
                <span className="text-sm text-gray-600 w-[150px] text-right">
                  {data.totalDebit.toLocaleString(undefined, {
                    style: "currency",
                    currency: "INR",
                    maximumFractionDigits: 2,
                  })}
                </span>
                <span className="text-sm text-gray-600 w-[150px] text-right">
                  {data.totalCredit.toLocaleString(undefined, {
                    style: "currency",
                    currency: "INR",
                    maximumFractionDigits: 2,
                  })}
                </span>
                <span className="text-sm text-gray-600 w-[150px] text-right">
                  {data.balance.toLocaleString(undefined, {
                    style: "currency",
                    currency: "INR",
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
