import React, { useState } from 'react';
import { Package, AlertCircle } from 'lucide-react';
import { getDispatchDeadlineStatus, formatINR } from '../lib/calculations';

interface NewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (orderData: any) => Promise<void>;
}

export const NewOrderModal: React.FC<NewOrderModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [gemOrderDate, setGemOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [dispatchDeadline, setDispatchDeadline] = useState('');
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [buyerName, setBuyerName] = useState('');
  const [buyerOrg, setBuyerOrg] = useState('');
  const [buyerAddress, setBuyerAddress] = useState('');
  const [buyerContact, setBuyerContact] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [orderTotal, setOrderTotal] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const deadlineCheck = dispatchDeadline ? getDispatchDeadlineStatus(dispatchDeadline) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!productName || !buyerOrg || !orderTotal || !dispatchDeadline) {
      setErrorMsg('Please fill in all mandatory fields (Product, Buyer Org, Total, Deadline).');
      return;
    }

    if (Number(orderTotal) <= 0) {
      setErrorMsg('Order value must be greater than zero.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        gemOrderDate,
        dispatchDeadline,
        productName,
        quantity: Number(quantity) || 1,
        buyerName,
        buyerOrg,
        buyerAddress,
        buyerContact,
        buyerEmail,
        orderTotal: Number(orderTotal),
        notes,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create order');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-4"
      >
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">New GeM Procurement Order</h3>
              <p className="text-xs text-slate-500">Record a new buyer contract from the Government e-Marketplace</p>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">GeM Order Date *</label>
            <input
              type="date"
              required
              value={gemOrderDate}
              onChange={(e) => setGemOrderDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Buyer Dispatch Deadline *</label>
            <input
              type="date"
              required
              value={dispatchDeadline}
              onChange={(e) => setDispatchDeadline(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500 focus:outline-none"
            />
            {deadlineCheck && deadlineCheck.isUrgent && (
              <span className="text-[10px] text-amber-700 font-semibold block mt-1">
                ⚠️ Warning: Dispatch deadline is within 5 days ({deadlineCheck.statusText})!
              </span>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className="font-bold text-slate-700 block mb-1">Product / Item Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. All-in-One Solar Street Light 60W MPPT"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Quantity *</label>
            <input
              type="number"
              required
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Order Total (₹ INR) *</label>
            <input
              type="number"
              required
              min="1"
              placeholder="e.g. 1140000"
              value={orderTotal}
              onChange={(e) => setOrderTotal(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="font-bold text-slate-700 block mb-1">Buyer Organization *</label>
            <input
              type="text"
              required
              placeholder="e.g. Public Works Department (PWD), Western Command"
              value={buyerOrg}
              onChange={(e) => setBuyerOrg(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Buyer Officer Name</label>
            <input
              type="text"
              placeholder="e.g. Er. Rajeshwar Singh, Executive Engineer"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Contact Phone</label>
            <input
              type="text"
              placeholder="e.g. +91 94140 55823"
              value={buyerContact}
              onChange={(e) => setBuyerContact(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Contact Email</label>
            <input
              type="email"
              placeholder="e.g. ee.pwd@gov.in"
              value={buyerEmail}
              onChange={(e) => setBuyerEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Consignee Delivery Address</label>
            <input
              type="text"
              placeholder="e.g. PWD Electrical Division, Civil Lines, Jaipur - 302006"
              value={buyerAddress}
              onChange={(e) => setBuyerAddress(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="font-bold text-slate-700 block mb-1">Notes / Specifications</label>
            <textarea
              rows={2}
              placeholder="Special instructions, packaging notes, tender contract terms..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
            {isSubmitting ? 'Creating Order...' : 'Create GeM Order'}
          </button>
        </div>
      </form>
    </div>
  );
};
