import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  Layers,
  Wallet,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  Tag,
} from 'lucide-react';
import { GeMOrder, ExpenseRecord, AdvanceRecord, DashboardStats } from '../types';
import { formatINR, calculateExpenseFundBalance } from '../lib/calculations';

interface ReportsViewProps {
  orders: GeMOrder[];
  expenses: ExpenseRecord[];
  advances: AdvanceRecord[];
  stats: DashboardStats | null;
  openingBalance: number;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  orders,
  expenses,
  advances,
  stats,
  openingBalance,
}) => {
  const [selectedReportModule, setSelectedReportModule] = useState<'both' | 'crm' | 'expenses'>('both');
  const [timeRange, setTimeRange] = useState<'all' | 'oct2026' | 'q3' | 'custom'>('all');

  const fundSummary = calculateExpenseFundBalance(openingBalance, advances, expenses, 10000);

  // CRM Analytics
  const totalOrderValue = orders.reduce((s, o) => s + o.orderTotal, 0);
  const totalReceivedPayments = orders.reduce((s, o) => s + (o.financials?.totalReceived || 0), 0);
  const totalOutstandingPayments = orders.reduce((s, o) => s + (o.financials?.outstandingBalance || 0), 0);
  const overdueOrders = orders.filter((o) => o.deadlineAlert?.isOverdue && o.orderStatus !== 'Dispatched' && o.orderStatus !== 'Closed');
  const awaitingDispatch = orders.filter((o) => o.orderStatus === 'Confirmed' || o.orderStatus === 'Draft');
  const pendingCrac = orders.filter((o) => (o.orderStatus === 'Dispatched' || o.buyerReceiptDate) && !o.cracGenerated);

  // Expense Analytics
  const expensesByPerson = expenses.reduce((acc, exp) => {
    acc[exp.madeBy] = (acc[exp.madeBy] || 0) + exp.amount;
    return acc;
  }, {} as Record<string, number>);

  const expensesByCategory = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-100 text-blue-700">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900">Enterprise Reports & Analytics</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Audit-grade performance metrics, cash burn breakdowns, GeM contract fulfillment status, and one-click CSV data exports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { window.location.href = '/api/reports/crm-csv'; }}
            className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 transition"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>Export CRM CSV</span>
          </button>
          <button
            onClick={() => { window.location.href = '/api/reports/expenses-csv'; }}
            className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Export Expenses CSV</span>
          </button>
        </div>
      </div>

      {/* Module Filter Switcher */}
      <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 text-xs font-semibold w-fit">
        <button
          onClick={() => setSelectedReportModule('both')}
          className={`px-3 py-1.5 rounded-xl transition ${
            selectedReportModule === 'both' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Unified Overview
        </button>
        <button
          onClick={() => setSelectedReportModule('crm')}
          className={`px-3 py-1.5 rounded-xl transition ${
            selectedReportModule === 'crm' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          CRM Performance
        </button>
        <button
          onClick={() => setSelectedReportModule('expenses')}
          className={`px-3 py-1.5 rounded-xl transition ${
            selectedReportModule === 'expenses' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Office Cash Flow
        </button>
      </div>

      {/* SECTION 1: CRM REPORTS */}
      {(selectedReportModule === 'both' || selectedReportModule === 'crm') && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-bold text-slate-900">INDOSATI CRM Fulfillment Metrics</h3>
            </div>
            <span className="text-xs text-slate-400 font-medium">Real-time DB Records</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-slate-500 block">Orders Generated</span>
              <span className="text-lg font-bold text-slate-900 mt-0.5 block">{orders.length}</span>
              <span className="text-[10px] text-slate-400">{formatINR(totalOrderValue)}</span>
            </div>

            <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-100">
              <span className="text-amber-800 block">Awaiting Dispatch</span>
              <span className="text-lg font-bold text-amber-900 mt-0.5 block">{awaitingDispatch.length}</span>
              <span className="text-[10px] text-amber-700">In production / packaging</span>
            </div>

            <div className="p-3 bg-red-50/70 rounded-2xl border border-red-100">
              <span className="text-red-800 block">Overdue Dispatches</span>
              <span className="text-lg font-bold text-red-900 mt-0.5 block">{overdueOrders.length}</span>
              <span className="text-[10px] text-red-700">Past buyer deadline</span>
            </div>

            <div className="p-3 bg-indigo-50/70 rounded-2xl border border-indigo-100">
              <span className="text-indigo-800 block">Pending CRAC</span>
              <span className="text-lg font-bold text-indigo-900 mt-0.5 block">{pendingCrac.length}</span>
              <span className="text-[10px] text-indigo-700">Delivered consignments</span>
            </div>

            <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-100">
              <span className="text-emerald-800 block">Payments Received</span>
              <span className="text-base font-bold text-emerald-900 mt-0.5 block truncate">
                {formatINR(totalReceivedPayments)}
              </span>
              <span className="text-[10px] text-emerald-700">Cleared in bank</span>
            </div>

            <div className="p-3 bg-blue-50/70 rounded-2xl border border-blue-100">
              <span className="text-blue-800 block">Outstanding Balance</span>
              <span className="text-base font-bold text-blue-900 mt-0.5 block truncate">
                {formatINR(totalOutstandingPayments)}
              </span>
              <span className="text-[10px] text-blue-700">Pending collections</span>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: DAILY EXPENSES & ADVANCES REPORTS */}
      {(selectedReportModule === 'both' || selectedReportModule === 'expenses') && (
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Office Expense & Liquidity Summary</h3>
              </div>
              <span className="text-xs text-slate-400 font-medium">Automatic Balance Model</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-slate-500 block">Total Office Spend</span>
                <span className="text-xl font-bold text-slate-900 mt-1 block">
                  {formatINR(fundSummary.totalExpenses)}
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Across {expenses.length} expense transactions
                </span>
              </div>

              <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-100">
                <span className="text-blue-700 block">Total Funds Injected</span>
                <span className="text-xl font-bold text-blue-900 mt-1 block">
                  {formatINR(fundSummary.totalFunds)}
                </span>
                <span className="text-[11px] text-blue-600 mt-0.5 block">
                  Opening ({formatINR(fundSummary.openingBalance)}) + Advances ({formatINR(fundSummary.totalAdvances)})
                </span>
              </div>

              <div className={`p-4 rounded-2xl border ${
                fundSummary.isLowBalance ? 'bg-red-50 border-red-200 text-red-900' : 'bg-emerald-50/70 border-emerald-100 text-emerald-900'
              }`}>
                <span className="block font-medium">Remaining Office Liquidity</span>
                <span className="text-xl font-bold mt-1 block">
                  {formatINR(fundSummary.availableBalance)}
                </span>
                <span className="text-[11px] mt-0.5 block">
                  {fundSummary.isLowBalance ? 'Low balance warning active' : 'Sufficient operating reserves'}
                </span>
              </div>

              <div className="p-4 bg-purple-50/70 rounded-2xl border border-purple-100">
                <span className="text-purple-700 block">GeM Linked Expenses</span>
                <span className="text-xl font-bold text-purple-900 mt-1 block">
                  {formatINR(
                    expenses.filter((e) => e.linkedOrderId).reduce((s, e) => s + e.amount, 0)
                  )}
                </span>
                <span className="text-[11px] text-purple-600 mt-0.5 block">
                  Tied directly to contract delivery
                </span>
              </div>
            </div>
          </div>

          {/* Breakdown Grids */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Expenses by Person */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                Expenses Incurred by Team Member
              </h4>
              <div className="space-y-2 text-xs">
                {Object.entries(expensesByPerson).map(([person, total]) => (
                  <div key={person} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="font-semibold text-slate-800">{person}</span>
                    <span className="font-bold text-slate-900">{formatINR(total)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Expenses by Category */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-emerald-600" />
                Expenses by Operational Category
              </h4>
              <div className="space-y-2 text-xs">
                {Object.entries(expensesByCategory).map(([cat, total]) => (
                  <div key={cat} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="font-semibold text-slate-800">{cat}</span>
                    <span className="font-bold text-slate-900">{formatINR(total)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
