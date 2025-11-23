'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

export default function GetStartedPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  const features = [
    {
      icon: '📊',
      title: 'Inventory Management',
      description: 'Track stock in real-time',
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900'
    },
    {
      icon: '🧾',
      title: 'GST Invoicing',
      description: 'Professional tax invoices',
      gradient: 'from-emerald-500 to-emerald-600',
      bgGradient: 'from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900'
    },
    {
      icon: '💰',
      title: 'Payment Tracking',
      description: 'Monitor all transactions',
      gradient: 'from-violet-500 to-violet-600',
      bgGradient: 'from-violet-50 to-violet-100 dark:from-violet-950 dark:to-violet-900'
    },
    {
      icon: '📈',
      title: 'Smart Reports',
      description: 'Insights at your fingertips',
      gradient: 'from-amber-500 to-amber-600',
      bgGradient: 'from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900'
    }
  ];

  return (
    <div className="h-full overflow-auto bg-background p-3 sm:p-4 md:p-6 lg:p-8">
      <motion.div 
        className="max-w-7xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Hero Section */}
        <motion.div 
          variants={itemVariants}
          className="relative overflow-hidden bg-card rounded-2xl sm:rounded-3xl shadow-lg p-6 sm:p-8 lg:p-12 mb-6 sm:mb-8 border border-border"
        >
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          
          <div className="relative z-10 flex flex-col items-center justify-center">
            {/* Logo */}
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-6 sm:mb-8 relative w-48 h-36 sm:w-64 sm:h-48 lg:w-80 lg:h-60 mx-auto"
            >
              <Image 
                src="/logo.svg" 
                alt="S.P.TRADERS AND BUILDERS Logo" 
                fill
                className="object-contain drop-shadow-2xl animate-float"
                priority
              />
            </motion.div>
            
            {/* Welcome Text */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-center mb-6 sm:mb-8 px-4"
            >
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 dark:from-blue-400 dark:via-indigo-400 dark:to-violet-400 bg-clip-text text-transparent mb-3 sm:mb-4">
                Welcome to S.P.TRADERS AND BUILDERS
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Your Complete Business Management System for Seamless Operations
              </p>
            </motion.div>

            {/* Key Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 w-full mt-6 sm:mt-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="relative overflow-hidden bg-card p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 border border-border touch-manipulation"
                >
                  <div className="text-4xl sm:text-5xl mb-3 sm:mb-4 drop-shadow-lg">{feature.icon}</div>
                  <h3 className="font-bold text-base sm:text-lg mb-1 sm:mb-2 text-card-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Content Grid */}
        <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
          {/* Quick Start Guide */}
          <motion.div 
            variants={itemVariants}
            className="bg-card rounded-xl sm:rounded-2xl shadow-md p-4 sm:p-6 lg:p-8 border border-border hover:shadow-lg transition-shadow duration-300"
          >
            <div className="flex items-center mb-4 sm:mb-6">
              <div className="w-1 sm:w-1.5 h-10 sm:h-12 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full mr-3 sm:mr-4" />
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-card-foreground">Quick Start Guide</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">Get up and running in minutes</p>
              </div>
            </div>
            <div className="space-y-4">
              {[
                { icon: '👥', text: 'Set up your suppliers and customers', color: 'blue' },
                { icon: '📦', text: 'Add items with part numbers (e.g., 550/42835C)', color: 'emerald' },
                { icon: '📄', text: 'Create purchase and sales invoices', color: 'violet' },
                { icon: '📊', text: 'Track payments and generate reports', color: 'amber' }
              ].map((step, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1 + idx * 0.1 }}
                  className="flex items-start space-x-4 p-4 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors duration-200 border border-border"
                >
                  <span className="text-3xl flex-shrink-0">{step.icon}</span>
                  <p className="text-foreground pt-1">{step.text}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* System Capabilities */}
          <motion.div 
            variants={itemVariants}
            className="bg-card rounded-2xl shadow-md p-6 lg:p-8 border border-border hover:shadow-lg transition-shadow duration-300"
          >
            <div className="flex items-center mb-6">
              <div className="w-1.5 h-12 bg-gradient-to-b from-emerald-500 to-emerald-600 rounded-full mr-4" />
              <div>
                <h2 className="text-2xl font-bold text-card-foreground">System Capabilities</h2>
                <p className="text-sm text-muted-foreground">Everything you need in one place</p>
              </div>
            </div>
            <div className="space-y-4">
              {[
                { title: 'GST Compliance', desc: 'Automatic tax calculations', icon: '✓', bgColor: 'bg-emerald-500' },
                { title: 'Real-time Tracking', desc: 'Live inventory updates', icon: '✓', bgColor: 'bg-blue-500' },
                { title: 'Multi-user Support', desc: 'Team collaboration features', icon: '✓', bgColor: 'bg-violet-500' },
                { title: 'Secure & Reliable', desc: 'Enterprise-grade security', icon: '✓', bgColor: 'bg-amber-500' }
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1 + idx * 0.1 }}
                  className="flex items-center space-x-4 p-4 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors duration-200 border border-border"
                >
                  <div className={`w-8 h-8 rounded-full ${item.bgColor} flex items-center justify-center text-white font-bold flex-shrink-0`}>
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Detailed Features Section */}
        <motion.div 
          variants={itemVariants}
          className="bg-card rounded-2xl shadow-md p-6 lg:p-8 border border-border"
        >
          <div className="flex items-center mb-8">
            <div className="w-1.5 h-12 bg-gradient-to-b from-indigo-500 to-indigo-600 rounded-full mr-4" />
            <div>
              <h2 className="text-2xl font-bold text-card-foreground">Billing & Invoicing Features</h2>
              <p className="text-sm text-muted-foreground">Professional GST-compliant invoicing</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Sales Invoices */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xl">
                  🧾
                </div>
                <h3 className="text-xl font-bold text-card-foreground">Sales Invoices</h3>
              </div>
              <ul className="space-y-3">
                {[
                  'Generate tax invoices with customer details',
                  'Multiple items with HSN codes',
                  'Automatic CGST, SGST calculations',
                  'Print or download PDF invoices',
                  'Track status: Draft, Paid, Cancelled'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start space-x-3">
                    <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 flex items-center justify-center text-xs mt-0.5 flex-shrink-0">✓</span>
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Purchase Invoices */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-xl">
                  📦
                </div>
                <h3 className="text-xl font-bold text-card-foreground">Purchase Invoices</h3>
              </div>
              <ul className="space-y-3">
                {[
                  'Record supplier purchases with details',
                  'Automatic inventory updates',
                  'Track supplier invoice status',
                  'Payment tracking and reminders',
                  'Supplier ledger management'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start space-x-3">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-xs mt-0.5 flex-shrink-0">✓</span>
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* How to Create Invoice */}
          <div className="mt-8 p-6 rounded-xl bg-secondary border border-border">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center">
              <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm mr-3">?</span>
              How to Create an Invoice
            </h3>
            <ol className="space-y-3">
              {[
                'Navigate to Sales → Invoices → New Invoice',
                'Select customer from your list',
                'Add invoice number and date',
                'Add items with quantity and rate',
                'System calculates taxes automatically',
                'Save as Draft or Submit',
                'View and print professional invoice'
              ].map((step, idx) => (
                <li key={idx} className="flex items-start space-x-4">
                  <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-foreground pt-1">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </motion.div>
      </motion.div>

      {/* Animation Styles */}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-15px);
          }
        }

        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
