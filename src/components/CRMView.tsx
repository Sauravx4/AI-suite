import React, { useState } from 'react';
import {
  Package,
  Calendar,
  Truck,
  FileCheck,
  CreditCard,
  Plus,
  Search,
  Filter,
  Download,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Trash2,
  Edit,
  Eye,
  Shield,
  MapPin,
  Mail,
  Phone,
  Building,
  Receipt,
  FileText,
} from 'lucide-react';
import { GeMOrder, PaymentRecord, UserProfile } from '../types';
import { formatINR, getDispatchDeadlineStatus } from '../lib/calculations';

interface CRMViewProps {
  orders: GeMOrder[];
  user: UserProfile;
  searchQuery: string;
  onRefresh: () => void;
  onOpenNewOrder: () => void;
  onSelectOrder: (order: GeMOrder) => void;
  selectedOrder: GeMOrder | null;
  onCloseOrderDetails: () => void;
  onAddPayment: (orderId: string, paymentData: any) => Promise<void>;
  onDeletePayment: (orderId: string, pmtId: string) => Promise<void>;
  onUpdateOrderStatus: (orderId: string, statusData: any) => Promise<void>;
  onDeleteOrder: (orderId: string) => Promise<void>;
  onOpenNewExpenseForOrder: (orderId: string) => void;
}

export const CRMView: React.FC<CRMViewProps> = ({
  orders,
  user,
  searchQuery,
  onRefresh,
  onOpenNewOrder,
  onSelectOrder,
  selectedOrder,
  onCloseOrderDetails,
  onAddPayment,
  onDeletePayment,
  onUpdateOrderStatus,
  onDeleteOrder,
  onOpenNewExpenseForOrder,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterPayment, setFilterPayment] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'deadline' | 'value' | 'date'>('date');

  // Payment Modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentMode, setPaymentMode] = useState('Bank Transfer (RTGS/NEFT)');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Dispatch / Status update modal
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [transporterName, setTransporterName] = useState('');
  const [docketNumber, setDocketNumber] = useState('');
  const [dispatchDate, setDispatchDate] = useState(new Date().toISOString().split('T')[0]);

  // CRAC update modal
  const [showCracModal, setShowCracModal] = useState(false);
  const [cracDate, setCracDate] = useState(new Date().toISOString().split('T')[0]);

  // Filter orders
  let filtered = orders.filter((o) => {
    if (filterStatus !== 'All' && o.orderStatus !== filterStatus) return false;
    if (filterPayment !== 'All' && o.financials?.paymentStatus !== filterPayment) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        o.id.toLowerCase().includes(q) ||
        o.buyerOrg.toLowerCase().includes(q) ||
        o.buyerName.toLowerCase().includes(q) ||
        o.productName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Sort
  if (sortBy === 'deadline') {
    filtered.sort((a, b) => new Date(a.dispatchDeadline).getTime() - new Date(b.dispatchDeadline).getTime());
  } else if (sortBy === 'value') {
    filtered.sort((a, b) => b.orderTotal - a.orderTotal);
  } else {
    filtered.sort((a, b) => new Date(b.gemOrderDate).getTime() - new Date(a.gemOrderDate).getTime());
  }

  // Quick stats
  const totalValue = orders.reduce((sum, o) => sum + o.orderTotal, 0);
  const totalReceived = orders.reduce((sum, o) => sum + (o.financials?.totalReceived || 0), 0);
  const totalOutstanding = orders.reduce((sum, o) => sum + (o.financials?.outstandingBalance || 0), 0);

  const handleAddPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !paymentAmount) return;
    setIsSubmittingPayment(true);
    try {
      await onAddPayment(selectedOrder.id, {
        amount: Number(paymentAmount),
        paymentDate,
        reference: paymentRef,
        paymentMode,
      });
      setShowPaymentModal(false);
      setPaymentAmount('');
      setPaymentRef('');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleDispatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    await onUpdateOrderStatus(selectedOrder.id, {
      orderStatus: 'Dispatched',
      dispatchDate,
      transporterName,
      docketNumber,
    });
    setShowDispatchModal(false);
  };

  const handleCracSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    await onUpdateOrderStatus(selectedOrder.id, {
      orderStatus: 'CRAC Generated',
      cracGenerated: true,
      cracDate,
      buyerReceiptDate: cracDate,
    });
    setShowCracModal(false);
  };

  const handleDownloadCsv = () => {
    window.location.href = '/api/reports/crm-csv';
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-100 text-blue-700">
              <Package className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900">INDOSATI CRM — GeM Order Management</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Track government orders from GeM confirmation, dispatch deadline compliance, transporter booking, CRAC certification to multi-stage payment collections.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleDownloadCsv}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={onOpenNewOrder}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4" />
            <span>New GeM Order</span>
          </button>
        </div>
      </div>

      {/* Financial Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
            Total Contract Value
          </span>
          <span className="text-xl font-extrabold text-slate-900 mt-1 block">
            {formatINR(totalValue)}
          </span>
          <span className="text-[11px] text-slate-500 block mt-0.5">
            Across {orders.length} GeM contract orders
          </span>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 block">
            Total Received Funds
          </span>
          <span className="text-xl font-extrabold text-emerald-900 mt-1 block">
            {formatINR(totalReceived)}
          </span>
          <span className="text-[11px] text-emerald-700 block mt-0.5">
            Verified in bank accounts
          </span>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-700 block">
            Outstanding Receivables
          </span>
          <span className="text-xl font-extrabold text-blue-900 mt-1 block">
            {formatINR(totalOutstanding)}
          </span>
          <span className="text-[11px] text-blue-700 block mt-0.5">
            Contract value minus all recorded receipts
          </span>
        </div>
      </div>

      {/* Filter and Tab Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-1 text-xs">
          <span className="text-slate-400 font-semibold mr-1">Status:</span>
          {['All', 'Confirmed', 'Dispatched', 'CRAC Generated', 'Closed'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                filterStatus === st
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Payment Filter & Sorting */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-semibold">Payment:</span>
            <select
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="All">All Payments</option>
              <option value="UNPAID">Unpaid</option>
              <option value="PARTIAL">Partially Paid</option>
              <option value="PAID">Fully Paid</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-semibold">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="date">Order Date (Newest)</option>
              <option value="deadline">Dispatch Deadline</option>
              <option value="value">Order Value (Highest)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Data Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-semibold tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Order ID & Date</th>
                <th className="py-3 px-4">Buyer Organization</th>
                <th className="py-3 px-4">Product & Qty</th>
                <th className="py-3 px-4">Dispatch Deadline</th>
                <th className="py-3 px-4">Order Value</th>
                <th className="py-3 px-4">Paid / Balance</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No GeM orders match your current filter or search criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((order) => {
                  const fin = order.financials;
                  const deadline = order.deadlineAlert;
                  const isUndispatched = order.orderStatus === 'Draft' || order.orderStatus === 'Confirmed';
                  const isUrgent = deadline?.isUrgent && isUndispatched;

                  return (
                    <tr
                      key={order.id}
                      onClick={() => onSelectOrder(order)}
                      className="hover:bg-blue-50/40 transition cursor-pointer group"
                    >
                      {/* Order ID & Date */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-blue-700 group-hover:underline">
                          {order.id}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {order.gemOrderDate}
                        </div>
                      </td>

                      {/* Buyer Org */}
                      <td className="py-3.5 px-4 max-w-[220px]">
                        <div className="font-semibold text-slate-800 truncate" title={order.buyerOrg}>
                          {order.buyerOrg}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate" title={order.buyerName}>
                          {order.buyerName}
                        </div>
                      </td>

                      {/* Product */}
                      <td className="py-3.5 px-4 max-w-[200px]">
                        <div className="font-medium text-slate-800 truncate" title={order.productName}>
                          {order.productName}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Qty: <strong>{order.quantity} units</strong>
                        </div>
                      </td>

                      {/* Dispatch Deadline & 5-day Reminder */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">
                          {order.dispatchDeadline}
                        </div>
                        {isUrgent ? (
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${
                            deadline?.isOverdue
                              ? 'bg-red-100 text-red-700 border border-red-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}>
                            <AlertCircle className="w-3 h-3" />
                            {deadline?.statusText}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            {order.orderStatus === 'Dispatched' || order.orderStatus === 'CRAC Generated'
                              ? 'Dispatched'
                              : `${deadline?.daysRemaining} days left`}
                          </span>
                        )}
                      </td>

                      {/* Order Total */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          {formatINR(order.orderTotal)}
                        </div>
                        {order.linkedExpenseCount ? (
                          <div className="text-[10px] text-indigo-600 mt-0.5">
                            {order.linkedExpenseCount} linked expense{order.linkedExpenseCount === 1 ? '' : 's'}
                          </div>
                        ) : null}
                      </td>

                      {/* Received & Outstanding */}
                      <td className="py-3.5 px-4">
                        <div className="text-emerald-700 font-semibold">
                          {formatINR(fin?.totalReceived || 0)}
                        </div>
                        <div className={`text-[11px] font-medium mt-0.5 ${
                          (fin?.outstandingBalance || 0) > 0 ? 'text-amber-700' : 'text-slate-400'
                        }`}>
                          Bal: {formatINR(fin?.outstandingBalance || 0)}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          order.orderStatus === 'CRAC Generated'
                            ? 'bg-emerald-100 text-emerald-800'
                            : order.orderStatus === 'Dispatched'
                            ? 'bg-sky-100 text-sky-800'
                            : order.orderStatus === 'Confirmed'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {order.orderStatus}
                        </span>
                        {order.cracGenerated && (
                          <span className="block text-[10px] text-emerald-600 font-medium mt-0.5">
                            CRAC Verified
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => onSelectOrder(order)}
                            title="View Order Details"
                            className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {user.role === 'admin' && (
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete order ${order.id}?`)) {
                                  onDeleteOrder(order.id);
                                }
                              }}
                              title="Delete Order (Admin only)"
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ORDER DETAILS MODAL / DRAWER */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
          <div className="relative w-full max-w-4xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto space-y-6">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-extrabold text-slate-900">{selectedOrder.id}</span>
                  <span className={`rounded-md px-2.5 py-0.5 text-xs font-bold ${
                    selectedOrder.orderStatus === 'CRAC Generated'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selectedOrder.orderStatus === 'Dispatched'
                      ? 'bg-sky-100 text-sky-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {selectedOrder.orderStatus}
                  </span>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                    Payment: {selectedOrder.financials?.paymentStatus}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  GeM Order Placed: <strong>{selectedOrder.gemOrderDate}</strong> • Dispatch Deadline:{' '}
                  <strong className={selectedOrder.deadlineAlert?.isUrgent ? 'text-amber-700 font-bold' : ''}>
                    {selectedOrder.dispatchDeadline} ({selectedOrder.deadlineAlert?.statusText})
                  </strong>
                </p>
              </div>

              <button
                onClick={onCloseOrderDetails}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            {/* Quick Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[11px] text-slate-400 block font-medium">Total Order Value</span>
                <span className="text-lg font-bold text-slate-900 mt-0.5 block">
                  {formatINR(selectedOrder.orderTotal)}
                </span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                <span className="text-[11px] text-emerald-700 block font-medium">Total Received</span>
                <span className="text-lg font-bold text-emerald-900 mt-0.5 block">
                  {formatINR(selectedOrder.financials?.totalReceived || 0)}
                </span>
              </div>
              <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100">
                <span className="text-[11px] text-blue-700 block font-medium">Outstanding Balance</span>
                <span className="text-lg font-bold text-blue-900 mt-0.5 block">
                  {formatINR(selectedOrder.financials?.outstandingBalance || 0)}
                </span>
              </div>
              <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-100 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] text-indigo-700 block font-medium">CRAC Status</span>
                  <span className="text-sm font-bold text-indigo-950 mt-0.5 block">
                    {selectedOrder.cracGenerated ? 'Verified & Accepted' : 'Pending Generation'}
                  </span>
                </div>
                {!selectedOrder.cracGenerated && (
                  <button
                    onClick={() => setShowCracModal(true)}
                    className="mt-1 text-[11px] font-bold text-indigo-600 hover:underline text-left"
                  >
                    + Record CRAC Upload
                  </button>
                )}
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Buyer & Delivery Info */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-blue-600" />
                  Buyer & Consignee Details
                </h4>
                <div className="text-xs space-y-1.5 text-slate-700">
                  <p><strong>Organization:</strong> {selectedOrder.buyerOrg}</p>
                  <p><strong>Contact Officer:</strong> {selectedOrder.buyerName}</p>
                  <p><strong>Address:</strong> {selectedOrder.buyerAddress || 'On file with GeM portal'}</p>
                  <p><strong>Phone:</strong> {selectedOrder.buyerContact || 'N/A'}</p>
                  <p><strong>Email:</strong> {selectedOrder.buyerEmail || 'N/A'}</p>
                </div>
              </div>

              {/* Product & Logistics Info */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-blue-600" />
                    Dispatch & Transportation
                  </h4>
                  {selectedOrder.orderStatus !== 'Dispatched' && selectedOrder.orderStatus !== 'CRAC Generated' && (
                    <button
                      onClick={() => setShowDispatchModal(true)}
                      className="text-[11px] font-bold text-blue-600 hover:underline"
                    >
                      Update Dispatch
                    </button>
                  )}
                </div>
                <div className="text-xs space-y-1.5 text-slate-700">
                  <p><strong>Product:</strong> {selectedOrder.productName}</p>
                  <p><strong>Contract Qty:</strong> {selectedOrder.quantity} units</p>
                  <p><strong>Transporter:</strong> {selectedOrder.transporterName || 'Pending booking'}</p>
                  <p><strong>Docket / Tracking:</strong> {selectedOrder.docketNumber || 'Not generated yet'}</p>
                  <p><strong>Dispatch Date:</strong> {selectedOrder.dispatchDate || 'Awaiting dispatch'}</p>
                  {selectedOrder.notes && (
                    <p className="text-slate-500 italic mt-2">"{selectedOrder.notes}"</p>
                  )}
                </div>
              </div>
            </div>

            {/* PAYMENT RECEIPTS MANAGER */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                    Payment Receipts Against This Order ({selectedOrder.payments?.length || 0})
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Outstanding balance is strictly calculated as Order Value minus recorded receipts.
                  </p>
                </div>
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow hover:bg-emerald-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Payment Receipt</span>
                </button>
              </div>

              {/* Payments Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 text-[10px] font-semibold uppercase">
                    <tr>
                      <th className="py-2 px-3">Receipt ID</th>
                      <th className="py-2 px-3">Payment Date</th>
                      <th className="py-2 px-3">Mode</th>
                      <th className="py-2 px-3">Reference / UTR</th>
                      <th className="py-2 px-3">Amount Received</th>
                      <th className="py-2 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {!selectedOrder.payments || selectedOrder.payments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-4 text-center text-slate-400">
                          No payment receipts recorded yet. Order is currently marked UNPAID.
                        </td>
                      </tr>
                    ) : (
                      selectedOrder.payments.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-semibold text-slate-800">{p.id}</td>
                          <td className="py-2.5 px-3 text-slate-600">{p.paymentDate}</td>
                          <td className="py-2.5 px-3 text-slate-600">{p.paymentMode}</td>
                          <td className="py-2.5 px-3 text-slate-600">{p.reference || 'N/A'}</td>
                          <td className="py-2.5 px-3 font-bold text-emerald-700">{formatINR(p.amount)}</td>
                          <td className="py-2.5 px-3 text-right">
                            {user.role === 'admin' && (
                              <button
                                onClick={() => {
                                  if (confirm(`Delete payment of ${formatINR(p.amount)}?`)) {
                                    onDeletePayment(selectedOrder.id, p.id);
                                  }
                                }}
                                className="text-slate-400 hover:text-red-600 p-1"
                                title="Delete payment"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* CROSS-MODULE LINKAGE: LINKED DAILY EXPENSES (RULE 8) */}
            <div className="p-4 rounded-2xl border border-indigo-200 bg-indigo-50/30 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-indigo-600" />
                    Office Expenses Linked to This Order
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Operational costs incurred for this contract (packaging, transit freight, inspections). Does not alter buyer payment balance.
                  </p>
                </div>
                <button
                  onClick={() => onOpenNewExpenseForOrder(selectedOrder.id)}
                  className="flex items-center gap-1 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow hover:bg-indigo-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Link New Expense</span>
                </button>
              </div>

              {/* Linked Expenses List */}
              {selectedOrder.linkedExpenses && selectedOrder.linkedExpenses.length > 0 ? (
                <div className="space-y-2">
                  {selectedOrder.linkedExpenses.map((exp: any) => (
                    <div
                      key={exp.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-indigo-100 text-xs shadow-2xs"
                    >
                      <div className="space-y-0.5">
                        <span className="font-semibold text-slate-800">{exp.description}</span>
                        <div className="text-[10px] text-slate-500">
                          {exp.date} • {exp.category} • Paid by {exp.madeBy} ({exp.paymentMode})
                        </div>
                      </div>
                      <span className="font-bold text-slate-900">{formatINR(exp.amount)}</span>
                    </div>
                  ))}
                  <div className="text-right text-xs font-bold text-indigo-900 pt-1">
                    Total Contract Operational Expenses:{' '}
                    {formatINR(
                      selectedOrder.linkedExpenses.reduce((s: number, e: any) => s + (Number(e.amount) || 0), 0)
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-400 py-2">
                  No office expenses have been recorded against this contract yet.
                </div>
              )}
            </div>

            {/* ORDER ACTIVITY HISTORY */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/30 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Audit Trail & History
              </h4>
              <div className="space-y-2 text-xs">
                {selectedOrder.history && selectedOrder.history.length > 0 ? (
                  selectedOrder.history.map((h) => (
                    <div key={h.id} className="flex items-start gap-3 p-2 rounded-xl bg-white border border-slate-100">
                      <span className="text-[10px] text-slate-400 shrink-0 mt-0.5">
                        {new Date(h.timestamp).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <div>
                        <span className="font-semibold text-slate-800">{h.action}</span>: {h.details}{' '}
                        <span className="text-[10px] text-slate-400">({h.performedBy})</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-xs">No activity logged yet.</p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                onClick={onCloseOrderDetails}
                className="rounded-xl bg-slate-800 px-5 py-2 text-xs font-bold text-white hover:bg-slate-900"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD PAYMENT MODAL */}
      {showPaymentModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <form
            onSubmit={handleAddPaymentSubmit}
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add Payment Receipt</h3>
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl text-xs space-y-1">
              <div><strong>Order:</strong> {selectedOrder.id} ({selectedOrder.buyerOrg})</div>
              <div><strong>Order Total:</strong> {formatINR(selectedOrder.orderTotal)}</div>
              <div><strong>Outstanding Balance:</strong> {formatINR(selectedOrder.financials?.outstandingBalance || 0)}</div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Payment Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={selectedOrder.orderTotal * 1.5}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="e.g. 250000"
                  className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Payment Date *</label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Payment Mode</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500 focus:outline-none"
                >
                  <option value="Bank Transfer (RTGS)">Bank Transfer (RTGS)</option>
                  <option value="Bank Transfer (NEFT)">Bank Transfer (NEFT)</option>
                  <option value="GeM Virtual Account">GeM Virtual Account</option>
                  <option value="Cheque / DD">Cheque / Demand Draft</option>
                  <option value="UPI">UPI</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Transaction Ref / UTR / Remarks</label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="e.g. UTR #HDFC0001928341"
                  className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingPayment}
                className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow"
              >
                {isSubmittingPayment ? 'Saving...' : 'Record Payment'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* DISPATCH UPDATE MODAL */}
      {showDispatchModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <form
            onSubmit={handleDispatchSubmit}
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Record Consignment Dispatch</h3>
              <button
                type="button"
                onClick={() => setShowDispatchModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Dispatch Date *</label>
                <input
                  type="date"
                  required
                  value={dispatchDate}
                  onChange={(e) => setDispatchDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Transporter / Courier Name *</label>
                <input
                  type="text"
                  required
                  value={transporterName}
                  onChange={(e) => setTransporterName(e.target.value)}
                  placeholder="e.g. VRL Logistics, SafeXpress, Blue Dart"
                  className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Docket Number / Tracking ID *</label>
                <input
                  type="text"
                  required
                  value={docketNumber}
                  onChange={(e) => setDocketNumber(e.target.value)}
                  placeholder="e.g. VRL-CHD-994821"
                  className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDispatchModal(false)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow"
              >
                Confirm Dispatch
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CRAC UPDATE MODAL */}
      {showCracModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <form
            onSubmit={handleCracSubmit}
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Record CRAC Verification</h3>
              <button
                type="button"
                onClick={() => setShowCracModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Confirm that the buyer department has accepted the consignment on GeM and issued the Consignee Receipt and Acceptance Certificate (CRAC).
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">CRAC Generation Date *</label>
                <input
                  type="date"
                  required
                  value={cracDate}
                  onChange={(e) => setCracDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCracModal(false)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow"
              >
                Mark CRAC Generated
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
