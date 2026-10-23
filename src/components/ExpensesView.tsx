import React, { useState } from 'react';
import {
  Wallet,
  Plus,
  Download,
  Printer,
  Trash2,
  Edit,
  AlertTriangle,
  UserCheck,
  Tag,
  Paperclip,
  Package,
  Settings,
  Check,
} from 'lucide-react';
import { ExpenseRecord, AdvanceRecord, UserProfile, GeMOrder, ExpensePerson } from '../types';
import { formatINR, calculateExpenseFundBalance } from '../lib/calculations';

interface ExpensesViewProps {
  expenses: ExpenseRecord[];
  advances: AdvanceRecord[];
  orders: GeMOrder[];
  openingBalance: number;
  categories: string[];
  expensePersons: ExpensePerson[];
  user: UserProfile;
  searchQuery: string;
  onRefresh: () => void;
  onOpenNewExpense: (preselectedOrderId?: string) => void;
  onEditExpense: (expense: ExpenseRecord) => void;
  onOpenNewAdvance: () => void;
  onDeleteExpense: (id: string) => Promise<void>;
  onDeleteAdvance: (id: string) => Promise<void>;
  onUpdateOpeningBalance: (newBalance: number) => Promise<void>;
  onAddCategory: (name: string) => Promise<void>;
  onOpenSettings: () => void;
  onSelectOrderById?: (orderId: string) => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  expenses,
  advances,
  orders,
  openingBalance,
  categories,
  expensePersons,
  user,
  searchQuery,
  onOpenNewExpense,
  onEditExpense,
  onOpenNewAdvance,
  onDeleteExpense,
  onDeleteAdvance,
  onUpdateOpeningBalance,
  onAddCategory,
  onOpenSettings,
  onSelectOrderById,
}) => {
  const [activeTab, setActiveTab] = useState<'expenses' | 'advances' | 'summary'>('expenses');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedPerson, setSelectedPerson] = useState<string>('All');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Quick edit opening balance inline state
  const [isEditingOpening, setIsEditingOpening] = useState(false);
  const [openingInput, setOpeningInput] = useState(String(openingBalance));

  // Quick add category inline state
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const fundSummary = calculateExpenseFundBalance(openingBalance, advances, expenses, 10000);

  const filterCategories = ['All', ...categories];

  // Combine configured expensePersons with any historical person names on expenses
  const allPersonNames = Array.from(
    new Set([
      ...expensePersons.map((p) => p.name),
      ...expenses.map((e) => e.madeBy).filter(Boolean),
    ])
  );

  // Filtered expenses
  const filteredExpenses = expenses.filter((e) => {
    if (selectedCategory !== 'All' && e.category !== selectedCategory) return false;
    if (selectedPerson !== 'All' && e.madeBy !== selectedPerson) return false;
    if (startDate && e.date < startDate) return false;
    if (endDate && e.date > endDate) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        e.description.toLowerCase().includes(q) ||
        e.madeBy.toLowerCase().includes(q) ||
        e.forPersonOrDept.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        (e.linkedOrderId && e.linkedOrderId.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleDownloadCsv = () => {
    window.location.href = '/api/reports/expenses-csv';
  };

  const handlePrintStatement = () => {
    window.print();
  };

  const handleSaveOpeningBalance = async () => {
    const val = Number(openingInput);
    if (!isNaN(val) && val >= 0) {
      await onUpdateOpeningBalance(val);
      setIsEditingOpening(false);
    }
  };

  const handleQuickAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    await onAddCategory(newCategoryName.trim());
    setNewCategoryName('');
    setIsAddingCategory(false);
  };

  // Group expenses by category and by person
  const categoryTotals = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {} as Record<string, number>);

  const personTotals = expenses.reduce((acc, exp) => {
    acc[exp.madeBy] = (acc[exp.madeBy] || 0) + exp.amount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <Wallet className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900">
              Daily Expense & Office Advance Management
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Track daily office expenses, custom categories, expense persons (who took money), advance funds, and automatic available balance calculations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
            title="Configure Categories, Persons & Opening Balance in Settings"
          >
            <Settings className="w-4 h-4 text-slate-500" />
            <span>Customize Categories & Staff</span>
          </button>
          <button
            onClick={handlePrintStatement}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print Statement</span>
          </button>
          <button
            onClick={handleDownloadCsv}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => onOpenNewExpense()}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-700 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Record Expense</span>
          </button>
        </div>
      </div>

      {/* Available Funds Master Equation Banner */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Office Liquidity Status
            </span>
            <div className="flex items-baseline gap-3 mt-1">
              <span
                className={`text-3xl font-extrabold ${
                  fundSummary.isLowBalance ? 'text-red-600' : 'text-slate-900'
                }`}
              >
                {formatINR(fundSummary.availableBalance)}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                Current Available Balance
              </span>
            </div>
            {fundSummary.isLowBalance && (
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-50 text-red-700 border border-red-200 text-xs font-semibold">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>{fundSummary.warningMessage}</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onOpenNewAdvance}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-blue-700 transition shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Record Advance / Fund Received</span>
            </button>
          </div>
        </div>

        {/* Master Formula Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-500">Opening Cash Balance</span>
              {!isEditingOpening && (
                <button
                  onClick={() => {
                    setOpeningInput(String(openingBalance));
                    setIsEditingOpening(true);
                  }}
                  className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Edit className="w-3 h-3" />
                  <span>Change</span>
                </button>
              )}
            </div>

            {isEditingOpening ? (
              <div className="mt-2 flex items-center gap-1.5">
                <input
                  type="number"
                  min="0"
                  value={openingInput}
                  onChange={(e) => setOpeningInput(e.target.value)}
                  className="w-full rounded-lg border border-blue-400 bg-white px-2 py-1 text-xs font-bold text-slate-900 focus:outline-none"
                />
                <button
                  onClick={handleSaveOpeningBalance}
                  className="rounded-lg bg-blue-600 p-1.5 text-white hover:bg-blue-700"
                  title="Save Opening Balance"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsEditingOpening(false)}
                  className="rounded-lg bg-slate-200 px-2 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-300"
                >
                  ✕
                </button>
              </div>
            ) : (
              <>
                <span className="text-lg font-bold text-slate-800 mt-0.5 block">
                  {formatINR(fundSummary.openingBalance)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Configurable in Settings or inline
                </span>
              </>
            )}
          </div>

          <div className="p-3.5 bg-blue-50/70 rounded-2xl border border-blue-100">
            <span className="text-[11px] font-medium text-blue-700 block">+ Advances Received</span>
            <span className="text-lg font-bold text-blue-900 mt-0.5 block">
              {formatINR(fundSummary.totalAdvances)}
            </span>
            <span className="text-[10px] text-blue-600 block mt-0.5">
              {advances.length} advance injections
            </span>
          </div>

          <div className="p-3.5 bg-indigo-50/70 rounded-2xl border border-indigo-100">
            <span className="text-[11px] font-medium text-indigo-700 block">= Total Available Funds</span>
            <span className="text-lg font-bold text-indigo-900 mt-0.5 block">
              {formatINR(fundSummary.totalFunds)}
            </span>
            <span className="text-[10px] text-indigo-600 block mt-0.5">
              Opening + Advances
            </span>
          </div>

          <div className="p-3.5 bg-rose-50/70 rounded-2xl border border-rose-100">
            <span className="text-[11px] font-medium text-rose-700 block">- Recorded Expenses</span>
            <span className="text-lg font-bold text-rose-900 mt-0.5 block">
              {formatINR(fundSummary.totalExpenses)}
            </span>
            <span className="text-[10px] text-rose-600 block mt-0.5">
              {expenses.length} expenses logged
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-2 text-xs font-semibold print:hidden">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-3 py-1.5 rounded-xl transition ${
              activeTab === 'expenses'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Expenses Log ({expenses.length})
          </button>
          <button
            onClick={() => setActiveTab('advances')}
            className={`px-3 py-1.5 rounded-xl transition ${
              activeTab === 'advances'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Advances & Receipts ({advances.length})
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-3 py-1.5 rounded-xl transition ${
              activeTab === 'summary'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Category & Person Breakdown
          </button>
        </div>
      </div>

      {/* TAB 1: EXPENSES TABLE */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 text-xs shadow-xs print:hidden">
            <div className="flex flex-wrap items-center gap-3">
              {/* Category Filter + Quick Add Category */}
              <div className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-500 font-semibold">Category:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
                >
                  {filterCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                {!isAddingCategory ? (
                  <button
                    onClick={() => setIsAddingCategory(true)}
                    className="rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-[11px] font-bold text-blue-700 hover:bg-blue-100"
                    title="Add a new custom expense category"
                  >
                    + Category
                  </button>
                ) : (
                  <form onSubmit={handleQuickAddCategory} className="flex items-center gap-1">
                    <input
                      type="text"
                      placeholder="New category..."
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="rounded-lg border border-blue-400 px-2 py-1 text-xs focus:outline-none w-32"
                    />
                    <button
                      type="submit"
                      className="rounded-lg bg-blue-600 px-2 py-1 text-white font-bold text-[11px]"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingCategory(false)}
                      className="text-slate-400 hover:text-slate-600 px-1"
                    >
                      ✕
                    </button>
                  </form>
                )}
              </div>

              {/* Expense Person Filter */}
              <div className="flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-slate-500 font-semibold">Expense Person:</span>
                <select
                  value={selectedPerson}
                  onChange={(e) => setSelectedPerson(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
                >
                  <option value="All">All Persons</option>
                  {allPersonNames.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-400 font-semibold">Date Range:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700"
              />
              {(startDate || endDate || selectedCategory !== 'All' || selectedPerson !== 'All') && (
                <button
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                    setSelectedCategory('All');
                    setSelectedPerson('All');
                  }}
                  className="text-xs text-blue-600 hover:underline font-semibold ml-1"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Expenses Table */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-semibold tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Date & ID</th>
                    <th className="py-3 px-4">Description & Justification</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Expense Person (Took Money)</th>
                    <th className="py-3 px-4">Linked GeM Order</th>
                    <th className="py-3 px-4">Payment Mode</th>
                    <th className="py-3 px-4 text-right">Amount (₹)</th>
                    <th className="py-3 px-4 text-right print:hidden">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-400">
                        No expenses match your current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{exp.date}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{exp.id}</div>
                        </td>

                        <td className="py-3 px-4 max-w-[260px]">
                          <div className="font-medium text-slate-800 leading-snug">
                            {exp.description}
                          </div>
                          {exp.receiptName && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-blue-600 mt-1">
                              <Paperclip className="w-3 h-3" />
                              {exp.receiptName}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                            {exp.category}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="text-slate-900 font-bold flex items-center gap-1">
                            <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{exp.madeBy}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 pl-4">{exp.forPersonOrDept}</div>
                        </td>

                        {/* Linked GeM Order (Rule 8) */}
                        <td className="py-3 px-4">
                          {exp.linkedOrderId ? (
                            <button
                              onClick={() => onSelectOrderById && onSelectOrderById(exp.linkedOrderId!)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-[10px] transition border border-blue-200"
                              title="Click to view CRM Order"
                            >
                              <Package className="w-3 h-3 text-blue-600" />
                              <span>{exp.linkedOrderId}</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">General Office</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-slate-600">{exp.paymentMode}</td>

                        <td className="py-3 px-4 text-right">
                          <span className="font-bold text-rose-700 text-sm">
                            {formatINR(exp.amount)}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right print:hidden">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => onEditExpense(exp)}
                              className="text-slate-400 hover:text-blue-600 p-1 rounded-lg hover:bg-blue-50"
                              title="Edit Expense Category, Person, or Amount"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            {user.role === 'admin' && (
                              <button
                                onClick={() => onDeleteExpense(exp.id)}
                                className="text-slate-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50"
                                title="Delete Expense (Admin only)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ADVANCES & FUNDS RECEIVED */}
      {activeTab === 'advances' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Advance Funds History</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Every cash/bank transfer deposited for office expenses and field operations.
              </p>
            </div>
            <button
              onClick={onOpenNewAdvance}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              <span>Record Advance</span>
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="py-3 px-4">Date & ID</th>
                  <th className="py-3 px-4">Fund Source / Deposit Channel</th>
                  <th className="py-3 px-4">Description / Purpose</th>
                  <th className="py-3 px-4 text-right">Advance Amount (₹)</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {advances.map((adv) => (
                  <tr key={adv.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{adv.date}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{adv.id}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{adv.source}</td>
                    <td className="py-3 px-4 text-slate-600">{adv.description || 'N/A'}</td>
                    <td className="py-3 px-4 text-right font-bold text-blue-700 text-sm">
                      {formatINR(adv.amount)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {user.role === 'admin' && (
                        <button
                          onClick={() => onDeleteAdvance(adv.id)}
                          className="text-slate-400 hover:text-red-600 p-1"
                          title="Delete advance"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CATEGORY & EXPENSE PERSON BREAKDOWN */}
      {activeTab === 'summary' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-emerald-600" />
                <span>Expenses by Category</span>
              </h3>
              <button
                onClick={onOpenSettings}
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                Manage Categories in Settings
              </button>
            </div>
            <div className="space-y-3">
              {Object.entries(categoryTotals).map(([cat, amount]) => {
                const percentage = Math.round((amount / (fundSummary.totalExpenses || 1)) * 100) || 0;
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-700">{cat}</span>
                      <span className="text-slate-900">
                        {formatINR(amount)} ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-blue-600" />
                <span>Expenses by Person (Who Took Money)</span>
              </h3>
              <button
                onClick={onOpenSettings}
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                Manage Persons in Settings
              </button>
            </div>
            <div className="space-y-3">
              {Object.entries(personTotals).map(([personName, amount]) => {
                const percentage = Math.round((amount / (fundSummary.totalExpenses || 1)) * 100) || 0;
                const personInfo = expensePersons.find((p) => p.name === personName);
                return (
                  <div key={personName} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <div>
                        <span className="text-slate-800">{personName}</span>
                        {personInfo && (
                          <span className="ml-1.5 text-[10px] text-slate-400">
                            ({personInfo.roleOrDept})
                          </span>
                        )}
                      </div>
                      <span className="text-slate-900">
                        {formatINR(amount)} ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-600 to-sky-400 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
