export const dynamic = 'force-dynamic';

export default function GetStartedPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Get Started</h1>
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          <p className="text-gray-600 mb-4">
            Welcome to S.P.TRADERS AND BUILDERS - Shop Management System
          </p>
          
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
    </div>
  );
}
