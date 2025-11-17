'use client';

import Image from 'next/image';

export default function GetStartedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Get Started</h1>
        </div>

        {/* Logo and Welcome Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8 animate-fade-in">
          <div className="flex flex-col items-center justify-center">
            {/* Animated Logo */}
            <div className="mb-6 animate-scale-in relative w-80 h-64">
              <Image 
                src="/logo.svg" 
                alt="S.P.TRADERS AND BUILDERS Logo" 
                fill
                className="animate-float object-contain"
                priority
              />
            </div>
            
            {/* Welcome Text */}
            <h2 className="text-2xl md:text-3xl font-bold text-[#6b4423] mb-3 animate-slide-up text-center">
              Welcome to S.P.TRADERS AND BUILDERS
            </h2>
            <p className="text-lg text-gray-600 mb-6 text-center max-w-2xl animate-slide-up-delay">
              Your Complete Shop Management System for Seamless Business Operations
            </p>

            {/* Key Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full mt-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg text-center transform hover:scale-105 transition-transform duration-300">
                <div className="text-3xl mb-2">📊</div>
                <h3 className="font-semibold text-gray-800 mb-1">Inventory Management</h3>
                <p className="text-xs text-gray-600">Track stock in real-time</p>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg text-center transform hover:scale-105 transition-transform duration-300">
                <div className="text-3xl mb-2">🧾</div>
                <h3 className="font-semibold text-gray-800 mb-1">GST Invoicing</h3>
                <p className="text-xs text-gray-600">Professional tax invoices</p>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg text-center transform hover:scale-105 transition-transform duration-300">
                <div className="text-3xl mb-2">💰</div>
                <h3 className="font-semibold text-gray-800 mb-1">Payment Tracking</h3>
                <p className="text-xs text-gray-600">Monitor all transactions</p>
              </div>
              
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg text-center transform hover:scale-105 transition-transform duration-300">
                <div className="text-3xl mb-2">📈</div>
                <h3 className="font-semibold text-gray-800 mb-1">Smart Reports</h3>
                <p className="text-xs text-gray-600">Insights at your fingertips</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          
          <div className="space-y-6">
            {/* Quick Start Guide */}
            <div className="border-l-4 border-blue-500 pl-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Quick Start Guide</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>Set up your suppliers and customers</li>
                <li>Add items to your inventory</li>
                <li>Create purchase and sales invoices</li>
                <li>Track payments and generate reports</li>
              </ul>
            </div>

            {/* Billing Section */}
            <div className="border-l-4 border-green-500 pl-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Billing & Invoicing</h2>
              <p className="text-gray-600 mb-3">
                Create professional GST-compliant invoices for your business transactions.
              </p>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-md font-semibold text-gray-700 mb-2">Sales Invoices</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-600 ml-2">
                    <li>Generate tax invoices with complete customer details</li>
                    <li>Add multiple items with HSN codes, quantity, and rates</li>
                    <li>Automatic calculation of CGST, SGST, and total amounts</li>
                    <li>Print or download PDF invoices</li>
                    <li>Track invoice status: Draft, Submitted, Paid, Cancelled</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-md font-semibold text-gray-700 mb-2">Purchase Invoices</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-600 ml-2">
                    <li>Record purchases from suppliers with complete details</li>
                    <li>Automatic inventory updates on purchase</li>
                    <li>Track supplier invoices and payment status</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-md font-semibold text-gray-700 mb-2">Invoice Features</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-600 ml-2">
                    <li><strong>GST Compliance:</strong> Automatic CGST/SGST calculation based on tax rates</li>
                    <li><strong>Discount Management:</strong> Apply percentage-based discounts</li>
                    <li><strong>Round Off:</strong> Automatic rounding to nearest rupee</li>
                    <li><strong>Amount in Words:</strong> Total amount displayed in words</li>
                    <li><strong>Professional Format:</strong> Standard tax invoice layout with company details</li>
                  </ul>
                </div>

                <div className="bg-blue-50 p-4 rounded-md">
                  <h3 className="text-md font-semibold text-blue-900 mb-2">How to Create an Invoice</h3>
                  <ol className="list-decimal list-inside space-y-1 text-blue-800 ml-2">
                    <li>Go to Sales → Invoices → New Invoice</li>
                    <li>Select customer from the list</li>
                    <li>Add invoice number and date</li>
                    <li>Add items by selecting parts and entering quantity & rate</li>
                    <li>System automatically calculates taxes and total</li>
                    <li>Save as Draft or Submit the invoice</li>
                    <li>View and print the professional tax invoice</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Animation Styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.8s ease-out;
        }

        .animate-scale-in {
          animation: scaleIn 1s ease-out;
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-slide-up {
          animation: slideUp 0.8s ease-out 0.3s both;
        }

        .animate-slide-up-delay {
          animation: slideUp 0.8s ease-out 0.5s both;
        }
      `}</style>
    </div>
  );
}
