'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { formatPKR, formatDate } from '@/lib/formatters';
import {
  Truck,
  CheckCircle2,
  Clock,
  X,
  Search,
  Phone,
  MapPin,
  Eye,
  Printer,
  Download,
  AlertTriangle,
  MessageCircle,
  Trash2,
  Ban,
  RotateCcw,
  CheckSquare,
  Square,
  RefreshCw,
  ShieldAlert,
  Copy,
  Check,
  Edit2,
  Save,
  Mail,
} from 'lucide-react';
import { AdminToastContainer, ToastMessage } from '@/components/admin/admin-toast';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';

interface OrdersTableProps {
  initialOrders: any[];
  store?: any;
}

export function OrdersTable({ initialOrders, store }: OrdersTableProps) {
  const [orders, setOrders] = useState(initialOrders);
  const [filter, setFilter] = useState<
    'ALL' | 'UNFULFILLED' | 'FULFILLED' | 'PAID' | 'CANCELLED'
  >('ALL');
  const [search, setSearch] = useState('');
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Modals state
  const [fulfillOrder, setFulfillOrder] = useState<any | null>(null);
  const [inspectOrder, setInspectOrder] = useState<any | null>(null);
  const [printSlipOrder, setPrintSlipOrder] = useState<any | null>(null);
  const [isEditingSlip, setIsEditingSlip] = useState(false);
  const [slipData, setSlipData] = useState<any | null>(null);
  const [isSavingSlipToOrder, setIsSavingSlipToOrder] = useState(false);
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [purgeConfirmationText, setPurgeConfirmationText] = useState('');
  const [isPurging, setIsPurging] = useState(false);

  const [carrier, setCarrier] = useState('TCS');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Accessible Dialog & Toast States
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [confirmDeleteOrderId, setConfirmDeleteOrderId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleOpenPrintSlip = (order: any) => {
    setPrintSlipOrder(order);
    setIsEditingSlip(false);
    setSlipData({
      storeName: store?.name || 'PAIRS KNIFE & SWORD CO.',
      storeAddress: store?.contactAddress || store?.supportCity || 'Drop Studio — Gujranwala, Pakistan',
      storePhone: store?.supportPhone || '+92 300 1234567',
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      customerName: order.customerName || '',
      shippingAddress: order.shippingAddress || '',
      city: order.city || '',
      province: order.province || '',
      postalCode: order.postalCode || '',
      customerPhone: order.customerPhone || '',
      paymentMethod: order.paymentMethod || 'COD',
      totalPrice: Number(order.totalPrice) || 0,
      financialStatus: order.financialStatus || 'PENDING',
      items: (order.items || []).map((it: any) => ({
        id: it.id,
        title: it.title,
        variantTitle:
          it.variantTitle && it.variantTitle !== 'Standard' && it.variantTitle !== 'Default'
            ? it.variantTitle
            : 'Standard Item',
        quantity: it.quantity,
        price: it.price,
      })),
    });
  };

  const handleSaveSlipToDatabase = async () => {
    if (!printSlipOrder || !slipData) return;
    setIsSavingSlipToOrder(true);
    try {
      const res = await fetch(`/api/admin/orders/${printSlipOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: slipData.customerName,
          customerPhone: slipData.customerPhone,
          shippingAddress: slipData.shippingAddress,
          city: slipData.city,
          province: slipData.province,
          postalCode: slipData.postalCode,
          totalPrice: slipData.totalPrice,
          paymentMethod: slipData.paymentMethod,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update order details');
      }
      setOrders((prev) =>
        prev.map((o) => (o.id === printSlipOrder.id ? { ...o, ...data.order } : o))
      );
      setPrintSlipOrder((prev: any) => (prev ? { ...prev, ...data.order } : null));
      showToast('Slip & order details synchronized with database.', 'success', 'Order Updated');
      setIsEditingSlip(false);
    } catch (err: any) {
      showToast(err.message || 'Could not save slip edits to order.', 'error', 'Update Failed');
    } finally {
      setIsSavingSlipToOrder(false);
    }
  };

  const showToast = (
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'success',
    title?: string
  ) => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, message, type, title }]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleCopyText = (text: string, key: string, label: string) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      showToast(`${label} copied to clipboard!`, 'info');
      setTimeout(() => setCopiedKey(null), 2500);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (filter === 'UNFULFILLED' && o.fulfillmentStatus !== 'UNFULFILLED') return false;
    if (filter === 'FULFILLED' && o.fulfillmentStatus !== 'FULFILLED') return false;
    if (filter === 'PAID' && o.financialStatus !== 'PAID') return false;
    if (filter === 'CANCELLED' && o.financialStatus !== 'CANCELLED') return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = o.customerName?.toLowerCase().includes(q);
      const matchPhone = o.customerPhone?.includes(q);
      const matchOrderNum = o.orderNumber?.toString().includes(q);
      const matchCity = o.city?.toLowerCase().includes(q);
      return matchName || matchPhone || matchOrderNum || matchCity;
    }
    return true;
  });

  // Selection handlers
  const handleToggleSelect = (orderId: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const handleToggleSelectAll = () => {
    const visibleIds = filteredOrders.map((o) => o.id);
    const allSelected = visibleIds.every((id) => selectedOrderIds.includes(id));

    if (allSelected) {
      setSelectedOrderIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedOrderIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  // Bulk Delete Execution
  const handleTriggerBulkDelete = () => {
    if (selectedOrderIds.length === 0) return;
    setConfirmBulkDelete(true);
  };

  const executeBulkDelete = async () => {
    setIsBulkLoading(true);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_selected',
          orderIds: selectedOrderIds,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setOrders((prev) => prev.filter((o) => !selectedOrderIds.includes(o.id)));
        showToast(
          data.message || `Deleted ${data.deletedOrdersCount || selectedOrderIds.length} orders successfully.`,
          'success',
          'Bulk Orders Deleted'
        );
        setSelectedOrderIds([]);
        setConfirmBulkDelete(false);
      } else {
        showToast(data.error || 'Failed to delete orders', 'error', 'Bulk Delete Failed');
      }
    } catch (err: any) {
      console.error(err);
      showToast('Network error deleting selected orders', 'error');
    } finally {
      setIsBulkLoading(false);
    }
  };

  // Bulk Fulfill
  const handleBulkFulfill = async () => {
    if (selectedOrderIds.length === 0) return;
    setIsBulkLoading(true);
    setFeedbackMessage(null);

    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulk_fulfill',
          orderIds: selectedOrderIds,
          carrier: 'TCS Express',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setOrders((prev) =>
          prev.map((o) =>
            selectedOrderIds.includes(o.id)
              ? {
                  ...o,
                  fulfillmentStatus: 'FULFILLED',
                  trackingCompany: 'TCS Express',
                  trackingNumber: o.trackingNumber || `TRK-${Math.floor(100000 + Math.random() * 900000)}`,
                }
              : o
          )
        );
        setSelectedOrderIds([]);
        setFeedbackMessage({
          type: 'success',
          text: data.message || `Marked ${selectedOrderIds.length} orders as Dispatched.`,
        });
      } else {
        setFeedbackMessage({ type: 'error', text: data.error || 'Failed to fulfill orders' });
      }
    } catch (err: any) {
      console.error(err);
      setFeedbackMessage({ type: 'error', text: 'Network error fulfilling orders' });
    } finally {
      setIsBulkLoading(false);
    }
  };

  // Bulk Mark as Paid
  const handleBulkMarkPaid = async () => {
    if (selectedOrderIds.length === 0) return;
    setIsBulkLoading(true);
    setFeedbackMessage(null);

    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulk_mark_paid',
          orderIds: selectedOrderIds,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setOrders((prev) =>
          prev.map((o) =>
            selectedOrderIds.includes(o.id)
              ? { ...o, financialStatus: 'PAID' }
              : o
          )
        );
        setSelectedOrderIds([]);
        setFeedbackMessage({
          type: 'success',
          text: data.message || `Marked ${selectedOrderIds.length} orders as Paid.`,
        });
      } else {
        setFeedbackMessage({ type: 'error', text: data.error || 'Failed to update orders' });
      }
    } catch (err: any) {
      console.error(err);
      setFeedbackMessage({ type: 'error', text: 'Network error marking orders paid' });
    } finally {
      setIsBulkLoading(false);
    }
  };

  // Purge All Orders & Start Fresh (Execution)
  const handleExecutePurgeAll = async () => {
    setIsPurging(true);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'purge_all' }),
      });

      const data = await res.json();
      if (data.success) {
        setOrders([]);
        setSelectedOrderIds([]);
        setShowPurgeModal(false);
        showToast(
          data.message || 'All orders have been purged. You have a fresh, pristine database for launch!',
          'success',
          'Database Reset Complete'
        );
      } else {
        showToast(data.error || 'Failed to purge orders', 'error', 'Purge Failed');
      }
    } catch (err: any) {
      console.error(err);
      showToast('Network error purging orders', 'error');
    } finally {
      setIsPurging(false);
    }
  };

  const handleOpenFulfillModal = (order: any) => {
    setFulfillOrder(order);
    setCarrier(order.trackingCompany || 'TCS');
    setTrackingNumber(order.trackingNumber || '');
  };

  const handleConfirmFulfillment = async () => {
    if (!fulfillOrder) return;
    setIsUpdating(true);

    try {
      const trk = trackingNumber || `TRK-${Math.floor(100000 + Math.random() * 900000)}`;
      const res = await fetch(`/api/admin/orders/${fulfillOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fulfillmentStatus: 'FULFILLED',
          trackingCompany: carrier,
          trackingNumber: trk,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === fulfillOrder.id
              ? {
                  ...o,
                  fulfillmentStatus: 'FULFILLED',
                  trackingCompany: carrier,
                  trackingNumber: trk,
                }
              : o
          )
        );
        showToast(
          `Order #${fulfillOrder.orderNumber} fulfilled via ${carrier} (${trk})!`,
          'success',
          'Dispatched'
        );
        setFulfillOrder(null);
      } else {
        showToast(data.error || 'Failed to update order', 'error', 'Fulfillment Error');
      }
    } catch (e) {
      console.error(e);
      showToast('Error updating order fulfillment status', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMarkAsPaid = async (orderId: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          financialStatus: 'PAID',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, financialStatus: 'PAID' } : o))
        );
        if (inspectOrder?.id === orderId) {
          setInspectOrder((prev: any) => ({ ...prev, financialStatus: 'PAID' }));
        }
        showToast('Order marked as PAID!', 'success');
      }
    } catch (e) {
      console.error(e);
      showToast('Error marking order paid', 'error');
    }
  };

  const handleExecuteSingleDelete = async () => {
    if (!confirmDeleteOrderId) return;
    const orderId = confirmDeleteOrderId;

    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
        setSelectedOrderIds((prev) => prev.filter((id) => id !== orderId));
        if (inspectOrder?.id === orderId) setInspectOrder(null);
        showToast('Order deleted successfully', 'info', 'Record Removed');
        setConfirmDeleteOrderId(null);
      } else {
        showToast(data.error || 'Failed to delete order', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Network error deleting order', 'error');
    }
  };

  // Export orders to CSV formatted for Pakistani courier booking (TCS / Trax / Leopards)
  const handleExportCSV = () => {
    if (orders.length === 0) {
      showToast('No orders available to export in current filter.', 'warning', 'Export Empty');
      return;
    }

    const headers = [
      'Order Number',
      'Date',
      'Customer Name',
      'Phone',
      'Email',
      'Address',
      'City',
      'Province',
      'Postal Code',
      'Payment Method',
      'COD Amount (PKR)',
      'Fulfillment Status',
      'Carrier',
      'Tracking Number',
    ];

    const rows = orders.map((o) => [
      `#${o.orderNumber}`,
      formatDate(o.createdAt),
      `"${o.customerName}"`,
      `"${o.customerPhone}"`,
      o.customerEmail,
      `"${o.shippingAddress.replace(/"/g, '""')}"`,
      o.city,
      o.province,
      o.postalCode || '',
      o.paymentMethod,
      o.totalPrice,
      o.fulfillmentStatus,
      o.trackingCompany || '',
      o.trackingNumber || '',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `PairsClothing_Orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isAllVisibleSelected =
    filteredOrders.length > 0 &&
    filteredOrders.every((o) => selectedOrderIds.includes(o.id));

  return (
    <div className="space-y-6">
      {/* Feedback Banner */}
      {feedbackMessage && (
        <div
          className={`p-3 text-xs font-semibold flex items-center justify-between border ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-neutral-500 hover:text-black cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 border border-neutral-200">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { key: 'ALL', label: 'All Orders' },
              { key: 'UNFULFILLED', label: 'Awaiting Dispatch' },
              { key: 'FULFILLED', label: 'Dispatched' },
              { key: 'PAID', label: 'Paid' },
              { key: 'CANCELLED', label: 'Cancelled' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                filter === tab.key
                  ? 'bg-black text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right Controls: Search, Export, and Purge All Fresh Button */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-neutral-400" />
            <input
              type="text"
              placeholder="Search name, phone, #order..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-neutral-300 text-xs focus:outline-none focus:border-black"
            />
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap"
            title="Download CSV for Courier Booking"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Export CSV</span>
          </button>

          {/* PURGE ALL ORDERS / START FRESH BUTTON */}
          <button
            type="button"
            onClick={() => {
              setPurgeConfirmationText('');
              setShowPurgeModal(true);
            }}
            className="flex items-center space-x-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap"
            title="Start fresh by deleting all demo/test orders before launch"
          >
            <RotateCcw className="w-3.5 h-3.5 text-red-600" />
            <span>Reset All Orders</span>
          </button>
        </div>
      </div>

      {/* FLOATING / STICKY BULK ACTION BAR */}
      {selectedOrderIds.length > 0 && (
        <div className="bg-neutral-900 text-white p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-lg border border-neutral-800 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center space-x-3">
            <span className="px-2.5 py-1 bg-white text-black font-mono font-bold text-xs">
              {selectedOrderIds.length} SELECTED
            </span>
            <span className="text-xs text-neutral-300">
              Apply bulk action to selected orders:
            </span>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* Bulk Mark as Dispatched */}
            <button
              type="button"
              disabled={isBulkLoading}
              onClick={handleBulkFulfill}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Truck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Mark Dispatched</span>
            </button>

            {/* Bulk Mark as Paid */}
            <button
              type="button"
              disabled={isBulkLoading}
              onClick={handleBulkMarkPaid}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Mark Paid</span>
            </button>

            {/* Bulk Delete Selected */}
            <button
              type="button"
              disabled={isBulkLoading}
              onClick={handleTriggerBulkDelete}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected</span>
            </button>

            {/* Deselect All */}
            <button
              type="button"
              onClick={() => setSelectedOrderIds([])}
              className="p-1.5 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              title="Deselect all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white border border-neutral-200 overflow-x-auto shadow-xs">
        {filteredOrders.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto text-neutral-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-black uppercase tracking-wider">No orders found</p>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              {orders.length === 0
                ? 'Your order book is completely fresh and pristine. Ready to receive customer orders!'
                : 'Try adjusting your search query or filter selection.'}
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-100/70 border-b border-neutral-200 text-neutral-600 uppercase tracking-wider font-bold text-[10px]">
                {/* Checkbox column */}
                <th className="py-3 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllVisibleSelected}
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 rounded border-neutral-300 text-black focus:ring-black cursor-pointer"
                    title={isAllVisibleSelected ? 'Deselect all visible' : 'Select all visible'}
                  />
                </th>
                <th className="py-3 px-4">Order</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Customer & Contact</th>
                <th className="py-3 px-4">City / Area</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Fulfillment Status</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredOrders.map((order) => {
                const isSelected = selectedOrderIds.includes(order.id);
                const isFulfilled = order.fulfillmentStatus === 'FULFILLED';
                const isPaid = order.financialStatus === 'PAID';
                const isCancelled = order.financialStatus === 'CANCELLED';

                return (
                  <tr
                    key={order.id}
                    className={`transition-colors ${
                      isSelected ? 'bg-neutral-100/80' : 'hover:bg-neutral-50/60'
                    }`}
                  >
                    {/* Row Checkbox */}
                    <td className="py-4 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(order.id)}
                        className="w-4 h-4 rounded border-neutral-300 text-black focus:ring-black cursor-pointer"
                      />
                    </td>

                    {/* Order Number */}
                    <td className="py-4 px-4 font-bold text-black whitespace-nowrap font-mono">
                      #{order.orderNumber}
                    </td>

                    {/* Date */}
                    <td className="py-4 px-4 text-neutral-500 whitespace-nowrap">
                      {formatDate(order.createdAt)}
                    </td>

                    {/* Customer */}
                    <td className="py-4 px-4 font-medium text-black">
                      <div className="font-semibold">{order.customerName}</div>
                      <div className="flex items-center space-x-1.5 text-[11px] text-neutral-500 font-mono mt-0.5">
                        <Phone className="w-3 h-3 text-neutral-400" />
                        <span>{order.customerPhone}</span>
                      </div>
                    </td>

                    {/* Destination City */}
                    <td className="py-4 px-4 text-neutral-600">
                      <div className="font-semibold text-neutral-900">{order.city}</div>
                      <div className="text-[10px] text-neutral-400 truncate max-w-[140px]">
                        {order.shippingAddress}
                      </div>
                    </td>

                    {/* Payment Status */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono font-bold text-[11px] text-neutral-800">
                          {order.paymentMethod}
                        </span>
                        <span
                          className={`px-1.5 py-0.2 text-[9px] font-bold uppercase rounded ${
                            isCancelled
                              ? 'bg-red-100 text-red-800'
                              : isPaid
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {order.financialStatus}
                        </span>
                      </div>
                    </td>

                    {/* Fulfillment Status */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded inline-flex items-center space-x-1 ${
                            isFulfilled
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-neutral-200 text-neutral-800'
                          }`}
                        >
                          {isFulfilled ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Dispatched</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Pending</span>
                            </>
                          )}
                        </span>

                        {isFulfilled && order.trackingCompany && (
                          <span className="text-[10px] text-neutral-500 font-mono">
                            {order.trackingCompany} ({order.trackingNumber})
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Total Amount */}
                    <td className="py-4 px-4 font-bold text-black whitespace-nowrap">
                      {formatPKR(order.totalPrice)}
                    </td>

                    {/* Actions Menu */}
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1.5">
                        {/* View Order Details */}
                        <button
                          type="button"
                          onClick={() => setInspectOrder(order)}
                          className="p-1.5 text-neutral-500 hover:text-black hover:bg-neutral-100 rounded transition-colors cursor-pointer"
                          title="View Order Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Print Dispatch Slip */}
                        <button
                          type="button"
                          onClick={() => handleOpenPrintSlip(order)}
                          className="p-1.5 text-neutral-500 hover:text-black hover:bg-neutral-100 rounded transition-colors cursor-pointer"
                          title="Print Courier Packing Slip"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {/* WhatsApp Direct Notification */}
                        {(() => {
                          const directWaMatch = order.notes?.match(/Direct WhatsApp:\s*([^|]+)/i);
                          const waTarget = (directWaMatch ? directWaMatch[1] : order.customerPhone || '').replace(/\D/g, '');
                          const realEmail =
                            order.customerEmail &&
                            !order.customerEmail.toLowerCase().endsWith('@pairs.pk')
                              ? order.customerEmail
                              : null;
                          return (
                            <>
                              <a
                                href={`https://wa.me/${waTarget}?text=${encodeURIComponent(
                                  `Assalam-o-Alaikum ${order.customerName}, this is ${store?.name || 'Pairs Knife & Sword Co.'} regarding your order #${order.orderNumber}. Your order is ${
                                    isFulfilled
                                      ? `dispatched via ${order.trackingCompany} (Tracking #${order.trackingNumber})`
                                      : 'received and being processed'
                                  }.`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                                title="WhatsApp Customer"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </a>
                              {realEmail && (
                                <a
                                  href={`mailto:${realEmail}?subject=${encodeURIComponent(
                                    `${store?.name || 'Pairs Blades'} — Order #${order.orderNumber}`
                                  )}&body=${encodeURIComponent(
                                    `Hi ${order.customerName},\n\nThank you for your order #${order.orderNumber} (${formatPKR(order.totalPrice)}).`
                                  )}`}
                                  className="p-1.5 text-neutral-600 hover:text-black hover:bg-neutral-100 rounded transition-colors"
                                  title={`Email ${realEmail}`}
                                >
                                  <Mail className="w-4 h-4" />
                                </a>
                              )}
                            </>
                          );
                        })()}

                        {/* Fulfill Action */}
                        {!isFulfilled && !isCancelled && (
                          <button
                            type="button"
                            onClick={() => handleOpenFulfillModal(order)}
                            className="px-2.5 py-1 bg-black hover:bg-neutral-800 text-white text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                          >
                            Dispatch
                          </button>
                        )}

                        {/* Mark as Paid Action */}
                        {!isPaid && !isCancelled && (
                          <button
                            type="button"
                            onClick={() => handleMarkAsPaid(order.id)}
                            className="px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                          >
                            Mark Paid
                          </button>
                        )}

                        {/* Delete Single Order */}
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteOrderId(order.id)}
                          className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                          title="Delete Order Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL: PURGE ALL ORDERS & RESET (START FRESH BEFORE LAUNCH) */}
      {showPurgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border-2 border-red-600 w-full max-w-lg p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <div className="flex items-center space-x-2 text-red-600">
                <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                <h3 className="text-sm font-black uppercase tracking-wider">
                  DANGER ZONE: Purge All Orders & Start Fresh
                </h3>
              </div>
              <button
                onClick={() => setShowPurgeModal(false)}
                className="text-neutral-400 hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs space-y-3 text-neutral-700">
              <p className="font-semibold text-black">
                You are about to permanently delete all {orders.length} orders and their order items from the store database.
              </p>
              <p>
                This action is specifically designed for store founders before official public launch:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-neutral-600">
                <li>Wipes all test/demo orders, customer details, and mock tracking records.</li>
                <li>Gives you a clean, zero-order dashboard ready for real customer purchases.</li>
                <li><strong>This cannot be undone.</strong></li>
              </ul>

              <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-[11px] font-mono">
                Type <strong>RESET</strong> in capital letters below to confirm:
              </div>

              <input
                type="text"
                value={purgeConfirmationText}
                onChange={(e) => setPurgeConfirmationText(e.target.value)}
                placeholder="Type RESET here"
                className="w-full p-2.5 border-2 border-neutral-300 focus:outline-none focus:border-red-600 font-mono font-bold text-center text-sm uppercase tracking-widest"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-neutral-200">
              <button
                type="button"
                onClick={() => setShowPurgeModal(false)}
                className="px-4 py-2 border border-neutral-300 text-xs font-bold uppercase tracking-wider text-neutral-700 hover:bg-neutral-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={purgeConfirmationText.trim().toUpperCase() !== 'RESET' || isPurging}
                onClick={handleExecutePurgeAll}
                className="flex items-center space-x-2 px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                {isPurging && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Permanently Purge All Orders</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: COURIER DISPATCH / FULFILL */}
      {fulfillOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-neutral-300 w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="text-sm font-bold uppercase tracking-wider text-black flex items-center space-x-2">
                <Truck className="w-4 h-4" />
                <span>Book Courier Dispatch #{fulfillOrder.orderNumber}</span>
              </h3>
              <button
                onClick={() => setFulfillOrder(null)}
                className="text-neutral-400 hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs space-y-3">
              <p className="text-neutral-600">
                Fulfilling order for <strong>{fulfillOrder.customerName}</strong> in{' '}
                <strong>{fulfillOrder.city}</strong>.
              </p>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                  Courier Logistic Partner
                </label>
                <select
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  className="w-full p-2.5 border border-neutral-300 text-xs focus:outline-none focus:border-black bg-white"
                >
                  <option value="TCS">TCS Express</option>
                  <option value="Trax">Trax Logistics</option>
                  <option value="Call Courier">Call Courier</option>
                  <option value="Leopards">Leopards Courier</option>
                  <option value="PostEx">PostEx COD</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                  Consignment Tracking Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. TRX-98213456"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full p-2.5 border border-neutral-300 text-xs focus:outline-none focus:border-black font-mono"
                />
                <p className="text-[10px] text-neutral-400 mt-1">
                  Leave empty to auto-generate a valid simulated tracking number.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setFulfillOrder(null)}
                className="px-3 py-1.5 border border-neutral-300 text-xs font-bold uppercase tracking-wider text-neutral-700 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUpdating}
                onClick={handleConfirmFulfillment}
                className="px-4 py-1.5 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
              >
                {isUpdating ? 'Generating Consignment...' : 'Confirm Dispatch'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: INSPECT ORDER DETAILS */}
      {inspectOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-neutral-300 w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                  Order Details
                </span>
                <h3 className="text-base font-black uppercase tracking-wider text-black font-mono">
                  #{inspectOrder.orderNumber}
                </h3>
              </div>
              <button
                onClick={() => setInspectOrder(null)}
                className="text-neutral-400 hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer & Shipping Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-neutral-50 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                  Customer & Contact
                </span>
                <p className="font-bold text-black">{inspectOrder.customerName}</p>
                <p className="text-neutral-600 font-mono">{inspectOrder.customerPhone}</p>
                <p className="text-neutral-500">{inspectOrder.customerEmail}</p>
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  {inspectOrder.customerPhone && (
                    <a
                      href={`https://wa.me/${(
                        inspectOrder.notes?.match(/Direct WhatsApp:\s*([^|]+)/i)?.[1] ||
                        inspectOrder.customerPhone
                      ).replace(/\D/g, '')}?text=${encodeURIComponent(
                        `Salam ${inspectOrder.customerName}, this is ${store?.name || 'Pairs Blades'} regarding your Order #${inspectOrder.orderNumber}`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center space-x-1 text-[11px] font-bold text-emerald-700 hover:underline"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Open WhatsApp Chat</span>
                    </a>
                  )}
                  {inspectOrder.customerEmail &&
                    !inspectOrder.customerEmail.toLowerCase().endsWith('@pairs.pk') && (
                      <a
                        href={`mailto:${inspectOrder.customerEmail}?subject=${encodeURIComponent(
                          `${store?.name || 'Pairs Blades'} — Order #${inspectOrder.orderNumber}`
                        )}`}
                        className="inline-flex items-center space-x-1 text-[11px] font-bold text-black hover:underline"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Email Buyer</span>
                      </a>
                    )}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                  Delivery Destination
                </span>
                <p className="text-black font-medium">{inspectOrder.shippingAddress}</p>
                <p className="font-bold text-black uppercase">
                  {inspectOrder.city}, {inspectOrder.province} {inspectOrder.postalCode}
                </p>
                {inspectOrder.notes && (
                  <p className="mt-2 text-[11px] text-amber-800 bg-amber-50 p-2 border border-amber-200">
                    <strong>Buyer Note:</strong> {inspectOrder.notes}
                  </p>
                )}
              </div>
            </div>

            {/* Ordered Items Manifest */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-black">
                Purchased Items ({inspectOrder.items?.length || 0})
              </h4>
              <div className="divide-y divide-neutral-100 border border-neutral-200">
                {inspectOrder.items?.map((item: any) => (
                  <div key={item.id} className="p-3 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-3">
                      {item.image ? (
                        <div className="relative w-12 h-14 bg-neutral-100 overflow-hidden border border-neutral-200">
                          <Image
                            src={item.image}
                            alt={item.title}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-14 bg-neutral-100 flex items-center justify-center text-[10px] text-neutral-400">
                          No Pic
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-black">{item.title}</p>
                        <p className="text-neutral-500 text-[11px] font-mono">
                          {item.variantTitle || 'Standard'}
                        </p>
                        <p className="text-neutral-400 text-[10px]">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <p className="font-bold text-black">{formatPKR(item.price * item.quantity)}</p>
                      <p className="text-[10px] text-neutral-400">
                        {formatPKR(item.price)} each
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing Financial Summary */}
            <div className="p-4 bg-neutral-50 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal:</span>
                <span>{formatPKR(inspectOrder.subtotalPrice)}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Shipping Fee:</span>
                <span>
                  {inspectOrder.shippingPrice === 0
                    ? 'FREE'
                    : formatPKR(inspectOrder.shippingPrice)}
                </span>
              </div>
              <div className="flex justify-between font-bold text-sm text-black pt-2 border-t border-neutral-200">
                <span>Total Amount:</span>
                <span>{formatPKR(inspectOrder.totalPrice)}</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setConfirmDeleteOrderId(inspectOrder.id)}
                className="text-red-600 hover:text-red-700 text-xs font-bold uppercase tracking-wider flex items-center space-x-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Order</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    handleOpenPrintSlip(inspectOrder);
                    setInspectOrder(null);
                  }}
                  className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-black text-xs font-bold uppercase tracking-wider flex items-center space-x-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Slip</span>
                </button>

                {inspectOrder.financialStatus !== 'PAID' && (
                  <button
                    type="button"
                    onClick={() => handleMarkAsPaid(inspectOrder.id)}
                    className="px-3 py-1.5 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Mark Paid
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: PRINT PACKING SLIP & EDITABLE SLIP MODAL */}
      {printSlipOrder && slipData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="bg-white border border-neutral-300 w-full max-w-2xl p-6 space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 print:hidden">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-black">
                  Courier Packing & Dispatch Slip
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded">
                  Order #{slipData.orderNumber}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditingSlip(!isEditingSlip)}
                  className={`px-3 py-1 text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-colors cursor-pointer border ${
                    isEditingSlip
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'bg-white text-neutral-800 border-neutral-300 hover:border-black'
                  }`}
                  title="Toggle Edit Mode for Slip"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>{isEditingSlip ? 'Preview Slip' : 'Edit Slip'}</span>
                </button>

                {!isEditingSlip && (
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3 py-1 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 flex items-center space-x-1 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Slip</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setPrintSlipOrder(null);
                    setSlipData(null);
                    setIsEditingSlip(false);
                  }}
                  className="p-1 text-neutral-400 hover:text-black cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {isEditingSlip ? (
              <div className="space-y-4 p-4 bg-neutral-50/70 border border-neutral-200 rounded-xs text-xs">
                {/* 1. Store Header Info */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b border-neutral-200 pb-1">
                    <span className="font-bold text-[11px] uppercase tracking-wider text-black">
                      1. Store & Dispatch Header
                    </span>
                    <span className="text-[10px] text-neutral-500 font-mono">Prints at top of slip</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-neutral-600 mb-1">
                        Store / Brand Name
                      </label>
                      <input
                        type="text"
                        value={slipData.storeName}
                        onChange={(e) => setSlipData({ ...slipData, storeName: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 text-xs font-bold text-black focus:border-black outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-neutral-600 mb-1">
                        Dispatch Origin
                      </label>
                      <input
                        type="text"
                        value={slipData.storeAddress}
                        onChange={(e) => setSlipData({ ...slipData, storeAddress: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 text-xs text-black focus:border-black outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-neutral-600 mb-1">
                        Support Phone
                      </label>
                      <input
                        type="text"
                        value={slipData.storePhone}
                        onChange={(e) => setSlipData({ ...slipData, storePhone: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 text-xs font-mono text-black focus:border-black outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Consignee Info */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b border-neutral-200 pb-1">
                    <span className="font-bold text-[11px] uppercase tracking-wider text-black">
                      2. Consignee Delivery Details
                    </span>
                    <span className="text-[10px] text-neutral-500 font-mono">Recipient info & phone</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-neutral-600 mb-1">
                        Customer Full Name
                      </label>
                      <input
                        type="text"
                        value={slipData.customerName}
                        onChange={(e) => setSlipData({ ...slipData, customerName: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 text-xs font-bold text-black focus:border-black outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-neutral-600 mb-1">
                        Customer Phone Number
                      </label>
                      <input
                        type="text"
                        value={slipData.customerPhone}
                        onChange={(e) => setSlipData({ ...slipData, customerPhone: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 text-xs font-mono font-bold text-black focus:border-black outline-hidden"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-neutral-600 mb-1">
                      Street Address
                    </label>
                    <input
                      type="text"
                      value={slipData.shippingAddress}
                      onChange={(e) => setSlipData({ ...slipData, shippingAddress: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 text-xs text-black focus:border-black outline-hidden"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-neutral-600 mb-1">City</label>
                      <input
                        type="text"
                        value={slipData.city}
                        onChange={(e) => setSlipData({ ...slipData, city: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 text-xs font-semibold text-black focus:border-black outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-neutral-600 mb-1">Province</label>
                      <input
                        type="text"
                        value={slipData.province}
                        onChange={(e) => setSlipData({ ...slipData, province: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 text-xs text-black focus:border-black outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-neutral-600 mb-1">Postal Code</label>
                      <input
                        type="text"
                        value={slipData.postalCode}
                        onChange={(e) => setSlipData({ ...slipData, postalCode: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 text-xs font-mono text-black focus:border-black outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Payment & COD Amount */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b border-neutral-200 pb-1">
                    <span className="font-bold text-[11px] uppercase tracking-wider text-black">
                      3. Payment Method & Cash to Collect
                    </span>
                    <span className="text-[10px] text-neutral-500 font-mono">Amount rider collects</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-neutral-600 mb-1">Payment Method</label>
                      <select
                        value={slipData.paymentMethod}
                        onChange={(e) => setSlipData({ ...slipData, paymentMethod: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 text-xs font-semibold text-black focus:border-black outline-hidden"
                      >
                        <option value="COD">CASH ON DELIVERY (COD)</option>
                        <option value="BANK_TRANSFER">DIRECT BANK TRANSFER</option>
                        <option value="CARD">CARD PAYMENT</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-neutral-600 mb-1">COD Total Amount (PKR)</label>
                      <input
                        type="number"
                        value={slipData.totalPrice}
                        onChange={(e) => setSlipData({ ...slipData, totalPrice: parseFloat(e.target.value) || 0 })}
                        className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 text-xs font-mono font-bold text-black focus:border-black outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Manifest Items */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b border-neutral-200 pb-1">
                    <span className="font-bold text-[11px] uppercase tracking-wider text-black">
                      4. Manifest Line Items
                    </span>
                    <span className="text-[10px] text-neutral-500 font-mono">{slipData.items?.length || 0} items</span>
                  </div>
                  <div className="space-y-2">
                    {slipData.items?.map((item: any, idx: number) => (
                      <div key={item.id || idx} className="grid grid-cols-12 gap-2 items-center bg-white p-2 border border-neutral-200">
                        <div className="col-span-5">
                          <label className="text-[9px] text-neutral-400 uppercase font-mono block">Item Name</label>
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) => {
                              const updated = [...slipData.items];
                              updated[idx] = { ...updated[idx], title: e.target.value };
                              setSlipData({ ...slipData, items: updated });
                            }}
                            className="w-full px-2 py-1 text-xs border border-neutral-200 text-black font-medium focus:border-black outline-hidden"
                          />
                        </div>
                        <div className="col-span-3">
                          <label className="text-[9px] text-neutral-400 uppercase font-mono block">Option/Details</label>
                          <input
                            type="text"
                            value={item.variantTitle}
                            onChange={(e) => {
                              const updated = [...slipData.items];
                              updated[idx] = { ...updated[idx], variantTitle: e.target.value };
                              setSlipData({ ...slipData, items: updated });
                            }}
                            className="w-full px-2 py-1 text-xs border border-neutral-200 text-neutral-700 font-mono focus:border-black outline-hidden"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="text-[9px] text-neutral-400 uppercase font-mono block text-center">Qty</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => {
                              const updated = [...slipData.items];
                              updated[idx] = { ...updated[idx], quantity: parseInt(e.target.value) || 1 };
                              setSlipData({ ...slipData, items: updated });
                            }}
                            className="w-full px-2 py-1 text-xs border border-neutral-200 text-center font-bold font-mono focus:border-black outline-hidden"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="text-[9px] text-neutral-400 uppercase font-mono block text-right">Price</label>
                          <input
                            type="number"
                            value={item.price}
                            onChange={(e) => {
                              const updated = [...slipData.items];
                              updated[idx] = { ...updated[idx], price: parseFloat(e.target.value) || 0 };
                              setSlipData({ ...slipData, items: updated });
                            }}
                            className="w-full px-2 py-1 text-xs border border-neutral-200 text-right font-mono font-bold focus:border-black outline-hidden"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Edit Actions Bottom Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-neutral-200">
                  <button
                    type="button"
                    onClick={() => setIsEditingSlip(false)}
                    className="w-full sm:w-auto px-4 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 text-xs font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Done Editing (Preview Slip)
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveSlipToDatabase}
                    disabled={isSavingSlipToOrder}
                    className="w-full sm:w-auto px-4 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSavingSlipToOrder ? 'Saving to Database...' : 'Save Changes to Order Record'}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Printable Document Sheet */
              <div className="border-2 border-dashed border-neutral-300 p-6 space-y-6 bg-white font-sans text-xs">
                {/* Slip Header */}
                <div className="flex justify-between items-start border-b-2 border-black pb-4">
                  <div>
                    <h1 className="text-2xl font-black uppercase tracking-[0.2em] font-mono">
                      {slipData.storeName || 'PAIRS KNIFE & SWORD CO.'}
                    </h1>
                    <p className="text-[10px] text-neutral-500 uppercase tracking-widest mt-0.5">
                      {slipData.storeAddress || 'Drop Studio — Gujranwala, Pakistan'}
                    </p>
                    <p className="text-[10px] text-neutral-500 font-mono">
                      Support: {slipData.storePhone || '+92 300 1234567'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 bg-black text-white font-mono font-bold text-xs uppercase">
                      Order #{slipData.orderNumber}
                    </span>
                    <p className="text-[10px] text-neutral-400 mt-1">
                      {formatDate(slipData.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Barcode Mock */}
                <div className="py-2 text-center border-b border-neutral-200">
                  <div className="h-10 w-64 mx-auto bg-neutral-900 flex items-center justify-around px-2 text-white font-mono text-[9px] tracking-[0.3em]">
                    ||| | | |||| | ||| || ||| | ||
                  </div>
                  <span className="text-[10px] font-mono text-neutral-600 mt-1 block">
                    TRK-{slipData.orderNumber}-{(slipData.city || 'PAK').toUpperCase()}
                  </span>
                </div>

                {/* Recipient Details & Cash to Collect Box */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      Deliver To (Consignee):
                    </span>
                    <p className="text-sm font-black text-black">{slipData.customerName}</p>
                    <p className="text-neutral-700 leading-tight">{slipData.shippingAddress}</p>
                    <p className="font-bold text-black uppercase">
                      {slipData.city}, {slipData.province} {slipData.postalCode}
                    </p>
                    <p className="font-mono font-bold text-black text-xs pt-1">
                      Phone: {slipData.customerPhone}
                    </p>
                  </div>

                  <div className="p-4 border-2 border-black bg-neutral-50 flex flex-col justify-center items-center text-center space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-600">
                      {slipData.paymentMethod === 'COD'
                        ? 'CASH TO COLLECT (COD)'
                        : slipData.paymentMethod === 'BANK_TRANSFER'
                        ? 'DIRECT BANK TRANSFER'
                        : slipData.paymentMethod === 'PAYONEER'
                        ? 'PAYONEER (INTERNATIONAL)'
                        : slipData.paymentMethod === 'INTERNATIONAL_TRANSFER'
                        ? 'INTERNATIONAL TRANSFER'
                        : 'CARD PAYMENT (ONLINE)'}
                    </span>
                    <span className="text-2xl font-black text-black font-mono">
                      {slipData.paymentMethod === 'COD'
                        ? formatPKR(slipData.totalPrice)
                        : slipData.financialStatus === 'PAID'
                        ? 'PAID IN ADVANCE'
                        : 'PENDING VERIFICATION'}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider text-neutral-400">
                      {slipData.paymentMethod === 'COD'
                        ? 'Collect exact cash from rider'
                        : 'Do not collect cash from customer'}
                    </span>
                  </div>
                </div>

                {/* Manifest Items Table */}
                <div className="space-y-2 pt-2 border-t border-neutral-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Parcel Manifest:
                  </span>
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="border-b border-neutral-300 font-bold uppercase text-[9px]">
                        <th className="py-1">Item Title</th>
                        <th className="py-1">Option / Details</th>
                        <th className="py-1 text-center">Qty</th>
                        <th className="py-1 text-right">Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {(slipData.items || []).map((item: any) => (
                        <tr key={item.id}>
                          <td className="py-1.5 font-medium">{item.title}</td>
                          <td className="py-1.5 font-mono">
                            {item.variantTitle && item.variantTitle !== 'Standard' && item.variantTitle !== 'Default'
                              ? item.variantTitle
                              : 'Standard Item'}
                          </td>
                          <td className="py-1.5 text-center font-bold">{item.quantity}</td>
                          <td className="py-1.5 text-right font-mono">{formatPKR(item.price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Rider Signature Box */}
                <div className="grid grid-cols-2 gap-6 pt-4 border-t border-neutral-200 text-[10px]">
                  <div className="space-y-6">
                    <span>Courier Rider Signature:</span>
                    <div className="border-b border-neutral-400 w-36"></div>
                  </div>
                  <div className="space-y-6 text-right">
                    <span>Consignee Signature:</span>
                    <div className="border-b border-neutral-400 w-36 ml-auto"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Accessible Bulk Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmBulkDelete}
        title="Delete Selected Orders"
        message={`Are you sure you want to permanently delete ${selectedOrderIds.length} selected orders? This action will permanently remove all associated shipment records and cannot be undone.`}
        confirmText={`Delete ${selectedOrderIds.length} Orders`}
        cancelText="Cancel"
        variant="danger"
        isLoading={isBulkLoading}
        onConfirm={executeBulkDelete}
        onClose={() => setConfirmBulkDelete(false)}
      />

      {/* Accessible Single Order Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(confirmDeleteOrderId)}
        title="Delete Order Record"
        message="Are you sure you want to permanently delete this customer order record? This action cannot be undone."
        confirmText="Delete Order"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleExecuteSingleDelete}
        onClose={() => setConfirmDeleteOrderId(null)}
      />

      {/* Admin Toast Notifications */}
      <AdminToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
