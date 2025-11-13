export default function GetStartedPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Get Started</h1>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-gray-600 mb-4">
            Welcome to Layer Dream - JCB Parts Shop Management System
          </p>
          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Quick Start Guide</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>Set up your suppliers and customers</li>
                <li>Add items to your inventory</li>
                <li>Create purchase and sales invoices</li>
                <li>Track payments and generate reports</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
