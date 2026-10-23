import React, { useState, useEffect } from 'react';
import { Wallet, Package, Plus, UserCheck, Tag } from 'lucide-react';
import { GeMOrder, ExpenseRecord, ExpensePerson } from '../types';

interface NewExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (expenseData: any, editingId?: string) => Promise<void>;
  orders: GeMOrder[];
  categories: string[];
  expensePersons: ExpensePerson[];
  preselectedOrderId?: string;
  defaultMadeBy?: string;
  editingExpense?: ExpenseRecord | null;
}

export const NewExpenseModal: React.FC<NewExpenseModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  orders,
  categories,
  expensePersons,
  preselectedOrderId,
  defaultMadeBy = 'Saurav Mourya',
  editingExpense,
}) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(categories[0] || 'Logistics & Dispatch');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState('');

  const [madeBy, setMadeBy] = useState(defaultMadeBy);
  const [isCustomPerson, setIsCustomPerson] = useState(false);
  const [customPersonName, setCustomPersonName] = useState('');

  const [forPersonOrDept, setForPersonOrDept] = useState('');
  const [description, setDescription] = useState('');
  const [linkedOrderId, setLinkedOrderId] = useState(preselectedOrderId || '');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [receiptName, setReceiptName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (editingExpense) {
      setDate(editingExpense.date);
      setAmount(String(editingExpense.amount));
      setCategory(editingExpense.category);
      setIsCustomCategory(false);
      setCustomCategoryName('');
      setMadeBy(editingExpense.madeBy);
      setIsCustomPerson(false);
      setCustomPersonName('');
      setForPersonOrDept(editingExpense.forPersonOrDept || '');
      setDescription(editingExpense.description || '');
      setLinkedOrderId(editingExpense.linkedOrderId || '');
      setPaymentMode(editingExpense.paymentMode || 'UPI');
      setReceiptName(editingExpense.receiptName || '');
    } else {
      setDate(new Date().toISOString().split('T')[0]);
      setAmount('');
      setCategory(categories[0] || 'Logistics & Dispatch');
      setIsCustomCategory(false);
      setCustomCategoryName('');
      setMadeBy(defaultMadeBy);
      setIsCustomPerson(false);
      setCustomPersonName('');
      setForPersonOrDept('');
      setDescription('');
      setLinkedOrderId(preselectedOrderId || '');
      setPaymentMode('UPI');
      setReceiptName('');
    }
    setErrorMsg('');
  }, [editingExpense, preselectedOrderId, isOpen, categories, defaultMadeBy]);

  if (!isOpen) return null;

  const handlePersonChange = (selectedName: string) => {
    setMadeBy(selectedName);
    const matched = expensePersons.find((p) => p.name === selectedName);
    if (matched && !forPersonOrDept) {
      setForPersonOrDept(matched.roleOrDept);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const finalCategory = isCustomCategory ? customCategoryName.trim() : category;
    const finalPerson = isCustomPerson ? customPersonName.trim() : madeBy.trim();

    if (!amount || Number(amount) <= 0 || !finalCategory || !description || !finalPerson) {
      setErrorMsg('Please specify valid amount, category, expense person, and description.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(
        {
          date,
          amount: Number(amount),
          category: finalCategory,
          madeBy: finalPerson,
          forPersonOrDept: forPersonOrDept || 'General Office',
          description,
          linkedOrderId: linkedOrderId || null,
          paymentMode,
          receiptName: receiptName || null,
        },
        editingExpense?.id
      );
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-4"
      >
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {editingExpense ? `Edit Expense (${editingExpense.id})` : 'Record Daily Office Expense'}
              </h3>
              <p className="text-xs text-slate-500">
                {editingExpense
                  ? 'Modify category, expense person, amount, or justification'
                  : 'Deduct cash, UPI or card payment from available office funds'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
            {errorMsg}
          </div>
        )}

        <div className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Expense Date *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Expense Amount (₹ INR) *</label>
              <input
                type="number"
                required
                min="1"
                step="any"
                placeholder="e.g. 4500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500 focus:outline-none font-bold text-slate-900"
              />
            </div>
          </div>

          {/* Editable / Custom Expense Category */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-emerald-600" />
                <span>Expense Category *</span>
              </label>
              <button
                type="button"
                onClick={() => setIsCustomCategory(!isCustomCategory)}
                className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-0.5"
              >
                {isCustomCategory ? (
                  'Select from Saved Categories'
                ) : (
                  <>
                    <Plus className="w-3 h-3" />
                    <span>Add / Type Custom Category</span>
                  </>
                )}
              </button>
            </div>

            {isCustomCategory ? (
              <div className="space-y-1">
                <input
                  type="text"
                  required
                  placeholder="Type your custom category (e.g. Factory Machinery, Courier, GST Fee)..."
                  value={customCategoryName}
                  onChange={(e) => setCustomCategoryName(e.target.value)}
                  className="w-full rounded-xl border border-blue-300 bg-white p-2.5 focus:border-blue-500 focus:outline-none font-semibold text-slate-900"
                />
                <p className="text-[10px] text-slate-500">
                  This new category will also be saved automatically to Settings for future use.
                </p>
              </div>
            ) : (
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white p-2.5 focus:border-blue-500 focus:outline-none font-medium text-slate-800"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Expense Person (Who Takes Money for Expense) */}
          <div className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-emerald-950 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Expense Person (Who Takes Money) *</span>
              </label>
              <button
                type="button"
                onClick={() => setIsCustomPerson(!isCustomPerson)}
                className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-0.5"
              >
                {isCustomPerson ? (
                  'Select from Staff List'
                ) : (
                  <>
                    <Plus className="w-3 h-3" />
                    <span>Add New Person</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                {isCustomPerson ? (
                  <input
                    type="text"
                    required
                    placeholder="Enter person name (e.g. Amit Verma)"
                    value={customPersonName}
                    onChange={(e) => setCustomPersonName(e.target.value)}
                    className="w-full rounded-xl border border-emerald-300 bg-white p-2.5 focus:border-emerald-600 focus:outline-none font-semibold text-slate-900"
                  />
                ) : (
                  <select
                    value={madeBy}
                    onChange={(e) => handlePersonChange(e.target.value)}
                    className="w-full rounded-xl border border-emerald-200 bg-white p-2.5 focus:border-emerald-600 focus:outline-none font-semibold text-slate-800"
                  >
                    {expensePersons.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name} ({p.roleOrDept})
                      </option>
                    ))}
                    {!expensePersons.some((p) => p.name === madeBy) && madeBy && (
                      <option value={madeBy}>{madeBy}</option>
                    )}
                  </select>
                )}
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Department / Purpose (e.g. Warehouse)"
                  value={forPersonOrDept}
                  onChange={(e) => setForPersonOrDept(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Description / Justification *</label>
            <textarea
              rows={2}
              required
              placeholder="e.g. Wooden crates & thermocol packing for Chandimandir dispatch"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* CROSS-MODULE LINKAGE (RULE 8) */}
          <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-200">
            <label className="font-bold text-blue-900 block mb-1 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-blue-600" />
              Optional: Link to GeM CRM Order
            </label>
            <p className="text-[11px] text-slate-500 mb-2">
              If this expense is for fulfilling a specific government contract (e.g. freight, crates, travel).
            </p>
            <select
              value={linkedOrderId}
              onChange={(e) => setLinkedOrderId(e.target.value)}
              className="w-full rounded-xl border border-blue-200 bg-white p-2.5 focus:border-blue-500 focus:outline-none font-medium text-slate-800"
            >
              <option value="">-- No Linked Order (General Office Overhead) --</option>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.id} — {o.buyerOrg.substring(0, 35)}...
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Payment Mode</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500 focus:outline-none"
              >
                <option value="Cash">Cash (Petty Cash)</option>
                <option value="UPI">UPI (GooglePay / PhonePe)</option>
                <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                <option value="Company Card">Company Card</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Receipt / Invoice Name</label>
              <input
                type="text"
                placeholder="e.g. inv_crates_984.pdf"
                value={receiptName}
                onChange={(e) => setReceiptName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : editingExpense ? 'Save Changes' : 'Record Expense'}
          </button>
        </div>
      </form>
    </div>
  );
};
