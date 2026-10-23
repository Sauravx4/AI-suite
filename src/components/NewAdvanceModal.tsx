import React, { useState } from 'react';
import { ShieldCheck, Plus } from 'lucide-react';

interface NewAdvanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (advanceData: any) => Promise<void>;
}

export const NewAdvanceModal: React.FC<NewAdvanceModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState('Director Current Account');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!amount || Number(amount) <= 0 || !source) {
      setErrorMsg('Please specify advance amount and source.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        date,
        amount: Number(amount),
        source,
        description: description || 'Office operations and petty cash advance',
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to record advance');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-4"
      >
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Record Advance / Fund Received</h3>
              <p className="text-xs text-slate-500">Inject liquidity into the available office expense fund</p>
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
          <div>
            <label className="font-bold text-slate-700 block mb-1">Deposit Date *</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Advance Amount (₹ INR) *</label>
            <input
              type="number"
              required
              min="1"
              placeholder="e.g. 100000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500 focus:outline-none font-bold text-blue-900"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Fund Source / Channel *</label>
            <input
              type="text"
              required
              placeholder="e.g. Director Current Account (HDFC Bank), Company Main Account"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Description / Purpose</label>
            <textarea
              rows={2}
              placeholder="e.g. Monthly petty cash & dispatch logistics buffer for October"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500 focus:outline-none"
            />
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
            className="rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Adding Funds...' : 'Add Advance Funds'}
          </button>
        </div>
      </form>
    </div>
  );
};
