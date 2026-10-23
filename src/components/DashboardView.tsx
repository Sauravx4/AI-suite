import React from 'react';
import {
  Layers,
  Wallet,
  ArrowRight,
  AlertTriangle,
  Clock,
  Package,
  ShieldAlert,
  Plus,
  Boxes,
  Settings,
} from 'lucide-react';
import {
  DashboardStats,
  GeMOrder,
  ExpenseRecord,
  SystemNotification,
  LinkedAppModule,
} from '../types';
import { formatINR } from '../lib/calculations';

interface DashboardViewProps {
  stats: DashboardStats | null;
  orders: GeMOrder[];
  expenses: ExpenseRecord[];
  notifications: SystemNotification[];
  linkedApps: LinkedAppModule[];
  onOpenCRM: () => void;
  onOpenExpenses: () => void;
  onOpenNewOrder: () => void;
  onOpenNewExpense: () => void;
  onSelectOrder: (order: GeMOrder) => void;
  onOpenLinkedApp: (app: LinkedAppModule) => void;
  onOpenSettings: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  orders,
  expenses,
  linkedApps,
  onOpenCRM,
  onOpenExpenses,
  onOpenNewOrder,
  onOpenNewExpense,
  onSelectOrder,
  onOpenLinkedApp,
  onOpenSettings,
}) => {
  const urgentOrders = orders.filter(
    (o) =>
      o.deadlineAlert?.isUrgent &&
      (o.orderStatus === 'Confirmed' || o.orderStatus === 'Draft')
  );

  return (
    <div className="space-y-6">
      {/* Welcome & Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-950 via-slate-900 to-blue-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-medium text-sky-200">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live Unified Office Operations
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            INDOSATI Office Management Suite
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Centralized hub synchronizing government GeM procurement contracts, transportation tracking, CRAC verifications, and real-time daily office petty cash & advance funds.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2.5">
          <button
            onClick={onOpenNewOrder}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-blue-500 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New GeM Order</span>
          </button>
          <button
            onClick={onOpenNewExpense}
            className="flex items-center gap-2 rounded-xl bg-white/10 border border-white/20 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>New Expense</span>
          </button>
        </div>
      </div>

      {/* Critical Reminders & Warnings Bar (if triggered) */}
      {(stats?.expenses.isLowBalance || urgentOrders.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {urgentOrders.length > 0 && (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 shadow-xs">
              <div className="p-2 rounded-xl bg-amber-200/60 text-amber-800 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                    5-Day Dispatch Alert ({urgentOrders.length} Order{urgentOrders.length === 1 ? '' : 's'})
                  </h4>
                  <button
                    onClick={onOpenCRM}
                    className="text-xs font-semibold text-amber-800 underline hover:text-amber-950"
                  >
                    View CRM
                  </button>
                </div>
                <p className="text-xs text-amber-800 mt-1">
                  Urgent GeM order dispatch deadline is approaching within 5 days or is overdue.
                </p>
                <div className="mt-2 space-y-1">
                  {urgentOrders.slice(0, 2).map((order) => (
                    <div
                      key={order.id}
                      onClick={() => onSelectOrder(order)}
                      className="cursor-pointer text-xs font-medium text-amber-950 hover:underline flex items-center justify-between bg-amber-100/70 px-2.5 py-1 rounded-lg"
                    >
                      <span className="truncate max-w-[200px]">
                        <strong>{order.id}</strong> — {order.buyerOrg}
                      </span>
                      <span className="font-bold shrink-0">{order.deadlineAlert?.statusText}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {stats?.expenses.isLowBalance && (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 shadow-xs">
              <div className="p-2 rounded-xl bg-red-200/60 text-red-800 shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-red-900">
                    Office Fund Safety Warning
                  </h4>
                  <button
                    onClick={onOpenExpenses}
                    className="text-xs font-semibold text-red-800 underline hover:text-red-950"
                  >
                    Manage Funds
                  </button>
                </div>
                <p className="text-xs text-red-800 mt-1">
                  {stats.expenses.warningMessage}
                </p>
                <div className="mt-2 flex items-center gap-3 text-xs">
                  <span>
                    Current Balance:{' '}
                    <strong className="font-bold text-red-950">
                      {formatINR(stats.expenses.availableBalance)}
                    </strong>
                  </span>
                  <span>•</span>
                  <span>Safety Threshold: <strong>₹10,000</strong></span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: TWO LARGE CLICKABLE MODULE CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CARD 1: INDOSATI CRM */}
        <div className="group relative flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-sm transition duration-200 hover:shadow-xl hover:border-blue-400">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-700 to-sky-500 text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition">
                  <Layers className="w-7 h-7" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                    Module 01
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mt-0.5">INDOSATI CRM</h2>
                </div>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                Government e-Marketplace
              </span>
            </div>

            {/* Short Description */}
            <p className="text-xs text-slate-600 leading-relaxed">
              Manage GeM orders, buyers, dispatch, transportation, CRAC, and payments.
            </p>

            {/* Real Stats Grid from DB */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="rounded-2xl bg-slate-50 p-3 border border-slate-100">
                <span className="text-[11px] font-medium text-slate-500 block">Total Orders</span>
                <span className="text-lg font-bold text-slate-900 mt-0.5 block">
                  {stats ? stats.crm.totalOrders : '...'}
                </span>
              </div>
              <div className="rounded-2xl bg-amber-50/70 p-3 border border-amber-100">
                <span className="text-[11px] font-medium text-amber-700 block">Pending Dispatch</span>
                <span className="text-lg font-bold text-amber-900 mt-0.5 block">
                  {stats ? stats.crm.pendingDispatches : '...'}
                </span>
              </div>
              <div className="rounded-2xl bg-indigo-50/70 p-3 border border-indigo-100">
                <span className="text-[11px] font-medium text-indigo-700 block">Pending CRAC</span>
                <span className="text-lg font-bold text-indigo-900 mt-0.5 block">
                  {stats ? stats.crm.pendingCrac : '...'}
                </span>
              </div>
              <div className="rounded-2xl bg-emerald-50/70 p-3 border border-emerald-100">
                <span className="text-[11px] font-medium text-emerald-700 block">Outstanding</span>
                <span
                  className="text-base font-bold text-emerald-900 mt-0.5 block truncate"
                  title={stats ? formatINR(stats.crm.totalOutstanding) : ''}
                >
                  {stats ? formatINR(stats.crm.totalOutstanding) : '...'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">
              Real-time payment tracking & 5-day reminders
            </span>
            <button
              onClick={onOpenCRM}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/25 hover:bg-blue-700 transition group-hover:translate-x-1"
            >
              <span>Open CRM</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* CARD 2: DAILY EXPENSE MANAGEMENT */}
        <div className="group relative flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-sm transition duration-200 hover:shadow-xl hover:border-emerald-400">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition">
                  <Wallet className="w-7 h-7" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    Module 02
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                    Daily Expense Management
                  </h2>
                </div>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                Office Petty Cash
              </span>
            </div>

            {/* Short Description */}
            <p className="text-xs text-slate-600 leading-relaxed">
              Record office expenses, manage advances, and monitor available funds.
            </p>

            {/* Real Stats Grid from DB */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="rounded-2xl bg-slate-50 p-3 border border-slate-100">
                <span className="text-[11px] font-medium text-slate-500 block">Total Expenses</span>
                <span className="text-base font-bold text-slate-900 mt-0.5 block truncate">
                  {stats ? formatINR(stats.expenses.totalExpenses) : '...'}
                </span>
              </div>
              <div
                className={`rounded-2xl p-3 border ${
                  stats?.expenses.isLowBalance
                    ? 'bg-red-50 border-red-200 text-red-900'
                    : 'bg-emerald-50/80 border-emerald-100 text-emerald-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium block">Available Balance</span>
                  {stats?.expenses.isLowBalance && (
                    <span className="text-[10px] font-bold bg-red-200 text-red-800 px-1.5 rounded">
                      Low
                    </span>
                  )}
                </div>
                <span className="text-base font-bold mt-0.5 block truncate">
                  {stats ? formatINR(stats.expenses.availableBalance) : '...'}
                </span>
              </div>
              <div className="rounded-2xl bg-blue-50/70 p-3 border border-blue-100">
                <span className="text-[11px] font-medium text-blue-700 block">
                  Advances Received
                </span>
                <span className="text-base font-bold text-blue-900 mt-0.5 block truncate">
                  {stats ? formatINR(stats.expenses.totalAdvances) : '...'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">
              Funds: Opening ({stats ? formatINR(stats.expenses.openingBalance) : '₹500'}) + Advances - Expenses
            </span>
            <button
              onClick={onOpenExpenses}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-500/25 hover:bg-emerald-700 transition group-hover:translate-x-1"
            >
              <span>Open Expenses</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Connected / Future Management App Modules Hub */}
      <div className="rounded-3xl border border-indigo-200/80 bg-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
              <Boxes className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Connected Management Modules ({linkedApps.length})
              </h3>
              <p className="text-xs text-slate-500">
                Expand your INDOSATI Suite by linking external Lovable apps or building internal modules.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-50 border border-indigo-200 px-3.5 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition self-start sm:self-auto"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>+ Link / Create App in Settings</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {linkedApps.map((appItem) => (
            <div
              key={appItem.id}
              onClick={() => onOpenLinkedApp(appItem)}
              className="group cursor-pointer rounded-2xl border border-slate-200 p-4 hover:border-indigo-400 hover:bg-indigo-50/20 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                    {appItem.category}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-700">Active Module</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 mt-1.5 group-hover:text-indigo-700">
                  {appItem.name}
                </h4>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {appItem.shortDescription}
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600">
                <span>Open Module</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Unified Cross-Module Activity Feed */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Office Operations</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live chronological stream of GeM contract events and recorded office expenses.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenCRM}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              All Orders ({orders.length})
            </button>
            <span className="text-slate-300">•</span>
            <button
              onClick={onOpenExpenses}
              className="text-xs font-semibold text-emerald-600 hover:underline"
            >
              All Expenses ({expenses.length})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Recent Orders */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Latest GeM Contracts
            </h4>
            {orders.slice(0, 3).map((order) => (
              <div
                key={order.id}
                onClick={() => onSelectOrder(order)}
                className="group flex items-center justify-between p-3 rounded-2xl border border-slate-100 hover:border-blue-300 hover:bg-blue-50/40 transition cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                    <Package className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {order.id}
                      </span>
                      <span className="text-[10px] font-semibold bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                        {order.orderStatus}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {order.buyerOrg}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0 pl-3">
                  <span className="text-xs font-bold text-slate-900 block">
                    {formatINR(order.orderTotal)}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Due: {order.dispatchDeadline}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Expenses */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Latest Office Expenses
            </h4>
            {expenses.slice(0, 3).map((exp) => (
              <div
                key={exp.id}
                onClick={onOpenExpenses}
                className="group flex items-center justify-between p-3 rounded-2xl border border-slate-100 hover:border-emerald-300 hover:bg-emerald-50/40 transition cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {exp.description}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                      <span>{exp.category}</span>
                      {exp.linkedOrderId && (
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 rounded font-semibold">
                          Linked: {exp.linkedOrderId}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 pl-3">
                  <span className="text-xs font-bold text-emerald-800 block">
                    - {formatINR(exp.amount)}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {exp.date} • {exp.madeBy}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
