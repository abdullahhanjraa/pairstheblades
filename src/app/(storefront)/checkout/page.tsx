'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart-context';
import { formatPKR } from '@/lib/formatters';
import { trackStoreEvent, getOrCreateSessionId } from '@/lib/analytics';
import {
  ShieldCheck,
  Truck,
  CreditCard,
  Banknote,
  ShoppingBag,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Copy,
  Check,
  Building2,
  Globe,
} from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();

  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    firstName: '',
    lastName: '',
    address: '',
    city: 'Lahore',
    province: 'Punjab',
    postalCode: '',
    paymentMethod: 'COD',
    notes: '',
  });

  const [discountCode, setDiscountCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountMessage, setDiscountMessage] = useState('');
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const checkoutTrackedRef = React.useRef(false);

  // Track InitiateCheckout once when shopper enters checkout with items in cart
  React.useEffect(() => {
    if (checkoutTrackedRef.current || items.length === 0) return;
    checkoutTrackedRef.current = true;
    trackStoreEvent('CHECKOUT_START', {
      contentIds: items.map((i) => i.productId),
      numItems: items.reduce((sum, i) => sum + i.quantity, 0),
      value: subtotal,
    });
  }, [items, subtotal]);

  const [copiedField, setCopiedField] = useState<
    'iban' | 'account' | 'payoneer' | 'paypal' | 'wise' | null
  >(null);

  const [storeSettings, setStoreSettings] = useState({
    freeShippingThreshold: 5000.0,
    shippingFee: 250.0,
    enableCod: true,
    enableCard: true,
    codNotice: 'Pay with cash upon delivery at your doorstep anywhere in Pakistan.',
    enableBankTransfer: true,
    bankName: 'Meezan Bank Ltd',
    bankAccountTitle: 'PAIRS KNIFE & SWORD CO.',
    bankAccountNumber: '01020304050607',
    bankIban: 'PK36MEZN0001020304050607',
    bankBranch: 'Main Boulevard, Gujranwala',
    bankInstructions:
      'Please transfer total amount via Raast / Online Banking and WhatsApp receipt with Order # to support.',
    enableInternationalTransfer: true,
    internationalTitle: 'International Transfer (Payoneer / PayPal / Wise)',
    payoneerAccount: '',
    paypalAccount: '',
    wiseAccount: '',
    internationalInstructions:
      'Transfer your order total via Payoneer, PayPal, or Wise and share your payment receipt with Order # on WhatsApp.',
    supportPhone: '+92 300 1234567',
    cardGatewayName: 'Visa / Mastercard Secure Gateway',
    cardInstructions: 'Instant checkout via 3D Secure card processing sandbox.',
    cardMode: 'SANDBOX',
  });

  const handleCopy = (
    text: string,
    field: 'iban' | 'account' | 'payoneer' | 'paypal' | 'wise'
  ) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2500);
  };

  React.useEffect(() => {
    fetch('/api/admin/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data?.store) {
          const s = data.store;
          setStoreSettings({
            freeShippingThreshold: Number(s.freeShippingThreshold) || 5000.0,
            shippingFee: Number(s.shippingFee) || 250.0,
            enableCod: s.enableCod !== undefined ? Boolean(s.enableCod) : true,
            enableCard: s.enableCard !== undefined ? Boolean(s.enableCard) : true,
            codNotice:
              s.codNotice ||
              'Pay with cash upon delivery at your doorstep anywhere in Pakistan.',
            enableBankTransfer:
              s.enableBankTransfer !== undefined ? Boolean(s.enableBankTransfer) : true,
            bankName: s.bankName || 'Meezan Bank Ltd',
            bankAccountTitle: s.bankAccountTitle || 'PAIRS KNIFE & SWORD CO.',
            bankAccountNumber: s.bankAccountNumber || '01020304050607',
            bankIban: s.bankIban || 'PK36MEZN0001020304050607',
            bankBranch: s.bankBranch || 'Main Boulevard, Gujranwala',
            bankInstructions:
              s.bankInstructions ||
              'Please transfer total amount via Raast / Online Banking and WhatsApp receipt with Order # to support.',
            enableInternationalTransfer:
              s.enableInternationalTransfer !== undefined
                ? Boolean(s.enableInternationalTransfer)
                : true,
            internationalTitle:
              s.internationalTitle || 'International Transfer (Payoneer / PayPal / Wise)',
            payoneerAccount: s.payoneerAccount || '',
            paypalAccount: s.paypalAccount || '',
            wiseAccount: s.wiseAccount || '',
            internationalInstructions:
              s.internationalInstructions ||
              'Transfer your order total via Payoneer, PayPal, or Wise and share your payment receipt with Order # on WhatsApp.',
            supportPhone: s.supportPhone || '+92 300 1234567',
            cardGatewayName: s.cardGatewayName || 'Visa / Mastercard Secure Gateway',
            cardInstructions:
              s.cardInstructions || 'Instant checkout via 3D Secure card processing sandbox.',
            cardMode: s.cardMode || 'SANDBOX',
          });

          // Priority auto-selection if COD is disabled
          if (s.enableCod === false) {
            if (s.enableBankTransfer) {
              setFormData((prev) => ({ ...prev, paymentMethod: 'BANK_TRANSFER' }));
            } else if (s.enableInternationalTransfer) {
              setFormData((prev) => ({ ...prev, paymentMethod: 'INTERNATIONAL_TRANSFER' }));
            } else if (s.enableCard) {
              setFormData((prev) => ({ ...prev, paymentMethod: 'CARD' }));
            }
          }
        }
      })
      .catch((err) => console.error('Error fetching settings in checkout', err));
  }, []);

  const shippingFee =
    subtotal >= storeSettings.freeShippingThreshold || subtotal === 0
      ? 0
      : storeSettings.shippingFee;
  const grandTotal = Math.max(0, subtotal - discountAmount + shippingFee);

  // Validate discount code against real database engine
  const handleApplyDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discountCode.trim()) return;

    setIsApplyingDiscount(true);
    setDiscountMessage('');

    try {
      const res = await fetch('/api/discounts/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: discountCode,
          subtotal,
        }),
      });

      const data = await res.json();
      if (data.valid) {
        setDiscountAmount(data.discountAmount);
        setDiscountMessage(data.message);
      } else {
        setDiscountAmount(0);
        setDiscountMessage(data.message || 'Invalid promotional code');
      }
    } catch (err) {
      setDiscountAmount(0);
      setDiscountMessage('Error applying discount');
    } finally {
      setIsApplyingDiscount(false);
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError('');

    if (items.length === 0) {
      setCheckoutError('Your shopping bag is empty. Please add items to proceed.');
      return;
    }

    if (!formData.firstName.trim()) {
      setCheckoutError('Please enter your First Name for courier delivery.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!formData.address.trim()) {
      setCheckoutError('Please provide your complete delivery street address.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      setCheckoutError(
        'Please enter a valid contact phone number (e.g. 0321 1234567 or international +1 / +44 number).'
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: `${formData.firstName} ${formData.lastName}`.trim(),
          customerEmail: formData.email || `${formData.phone.replace(/[^0-9]/g, '')}@pairs.pk`,
          customerPhone: formData.phone,
          shippingAddress: formData.address,
          city: formData.city,
          province: formData.province,
          postalCode: formData.postalCode,
          subtotalPrice: subtotal,
          shippingPrice: shippingFee,
          totalPrice: grandTotal,
          paymentMethod: formData.paymentMethod,
          discountCode: discountAmount > 0 ? discountCode : undefined,
          idempotencyKey: `${formData.phone.replace(/\D/g, '')}_${items.map((i) => `${i.variantId || i.productId}:${i.quantity}`).join('_')}`,
          analyticsSessionId: getOrCreateSessionId(),
          notes: formData.notes,
          items: items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            title: i.title,
            variantTitle: i.variantTitle,
            price: i.price,
            quantity: i.quantity,
            image: i.image,
          })),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success && (data.order || data.orderNumber)) {
        const orderNum = data.orderNumber || data.order?.orderNumber;
        trackStoreEvent('PURCHASE', {
          orderNumber: orderNum,
          contentIds: items.map((i) => i.productId),
          numItems: items.reduce((sum, i) => sum + i.quantity, 0),
          value: grandTotal,
          skipBeacon: true, // Server /api/checkout already guarantees DB PURCHASE row
        });
        clearCart();
        router.push(`/order-success?orderNumber=${orderNum}`);
      } else {
        const errorMsg =
          data.error ||
          (res.status === 409
            ? 'Sorry, one or more selected items have insufficient stock. Please check your bag.'
            : 'Failed to place order. Please check your details and try again.');
        setCheckoutError(errorMsg);
        setIsSubmitting(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setCheckoutError('Network connection error while processing your order. Please retry.');
      setIsSubmitting(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Top Simple Checkout Header */}
      <header className="border-b border-neutral-100 py-6 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="inline-block">
            <span className="font-extrabold text-2xl tracking-[0.25em] uppercase text-black">
              PAIRS
            </span>
          </Link>
          <div className="flex items-center space-x-2 text-xs text-neutral-500">
            <ShieldCheck className="w-4 h-4 text-black" />
            <span className="hidden sm:inline uppercase tracking-widest font-semibold">
              Secure Checkout
            </span>
          </div>
        </div>
      </header>

      {/* Main Checkout Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {checkoutError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 text-xs font-medium rounded flex items-center space-x-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
            <span>{checkoutError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left: Customer Information & Delivery Form (7 cols) */}
          <div className="lg:col-span-7 space-y-8 text-left">
            <Link
              href="/"
              className="inline-flex items-center space-x-2 text-xs font-semibold text-neutral-500 hover:text-black transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Shopping</span>
            </Link>

            <form onSubmit={handleSubmitOrder} className="space-y-6">
              {/* Contact Information */}
              <div className="space-y-4">
                <div className="flex justify-between items-baseline">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-black">
                    Contact Details
                  </h2>
                  <span className="text-[11px] text-neutral-400">
                    COD confirmation sent via SMS/WhatsApp
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-medium text-neutral-500 mb-1">
                    Mobile Phone Number (03XX-XXXXXXX) *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0300 1234567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-neutral-300 text-xs focus:outline-none focus:border-black font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-medium text-neutral-500 mb-1">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="your.email@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-neutral-300 text-xs focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              {/* Delivery Address */}
              <div className="space-y-4 pt-4 border-t border-neutral-100">
                <h2 className="text-xs font-bold uppercase tracking-widest text-black">
                  Shipping Address (Pakistan Only)
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider font-medium text-neutral-500 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ali"
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 border border-neutral-300 text-xs focus:outline-none focus:border-black"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider font-medium text-neutral-500 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      placeholder="Ahmed"
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 border border-neutral-300 text-xs focus:outline-none focus:border-black"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-medium text-neutral-500 mb-1">
                    Complete Street Address (House/Street/Area) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="House 14-B, Street 3, Block C, Gulberg"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-neutral-300 text-xs focus:outline-none focus:border-black"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider font-medium text-neutral-500 mb-1">
                      City *
                    </label>
                    <select
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3 py-2.5 border border-neutral-300 text-xs focus:outline-none focus:border-black bg-white"
                    >
                      <option value="Lahore">Lahore</option>
                      <option value="Karachi">Karachi</option>
                      <option value="Islamabad">Islamabad</option>
                      <option value="Rawalpindi">Rawalpindi</option>
                      <option value="Faisalabad">Faisalabad</option>
                      <option value="Multan">Multan</option>
                      <option value="Peshawar">Peshawar</option>
                      <option value="Quetta">Quetta</option>
                      <option value="Sialkot">Sialkot</option>
                      <option value="Gujranwala">Gujranwala</option>
                      <option value="Other">Other City</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider font-medium text-neutral-500 mb-1">
                      Province *
                    </label>
                    <select
                      value={formData.province}
                      onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                      className="w-full px-3 py-2.5 border border-neutral-300 text-xs focus:outline-none focus:border-black bg-white"
                    >
                      <option value="Punjab">Punjab</option>
                      <option value="Sindh">Sindh</option>
                      <option value="Khyber Pakhtunkhwa">KPK</option>
                      <option value="Balochistan">Balochistan</option>
                      <option value="Islamabad Capital Territory">Islamabad (ICT)</option>
                      <option value="Azad Kashmir">AJK</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider font-medium text-neutral-500 mb-1">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      placeholder="54000"
                      value={formData.postalCode}
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-neutral-300 text-xs focus:outline-none focus:border-black"
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Payment Gateways */}
              <div className="space-y-3 pt-4 border-t border-neutral-100">
                <h2 className="text-xs font-bold uppercase tracking-widest text-black">
                  Payment Method
                </h2>
                <div className="space-y-2">
                  {/* Cash on delivery (if enabled in admin) */}
                  {storeSettings.enableCod && (
                    <label
                      className={`flex items-start p-4 border cursor-pointer transition-colors ${
                        formData.paymentMethod === 'COD'
                          ? 'border-black bg-neutral-50'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="COD"
                        checked={formData.paymentMethod === 'COD'}
                        onChange={() => setFormData({ ...formData, paymentMethod: 'COD' })}
                        className="mt-0.5 text-black focus:ring-black"
                      />
                      <div className="ml-3">
                        <div className="flex items-center space-x-2">
                          <Banknote className="w-4 h-4 text-black" />
                          <span className="text-xs font-bold uppercase tracking-wider text-black">
                            Cash on Delivery (Nationwide COD)
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-500 mt-0.5">
                          {storeSettings.codNotice}
                        </p>
                      </div>
                    </label>
                  )}

                  {/* Direct Bank Transfer (Raast / IBAN) */}
                  {storeSettings.enableBankTransfer && (
                    <div
                      className={`border transition-colors ${
                        formData.paymentMethod === 'BANK_TRANSFER'
                          ? 'border-black bg-neutral-50'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <label className="flex items-start p-4 cursor-pointer">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="BANK_TRANSFER"
                          checked={formData.paymentMethod === 'BANK_TRANSFER'}
                          onChange={() =>
                            setFormData({ ...formData, paymentMethod: 'BANK_TRANSFER' })
                          }
                          className="mt-0.5 text-black focus:ring-black"
                        />
                        <div className="ml-3 flex-1">
                          <div className="flex items-center space-x-2">
                            <Building2 className="w-4 h-4 text-black" />
                            <span className="text-xs font-bold uppercase tracking-wider text-black">
                              Direct Bank Transfer (Raast / IBAN / Online Banking)
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-500 mt-0.5">
                            Transfer directly to official store account and share receipt via WhatsApp.
                          </p>
                        </div>
                      </label>

                      {/* Expanded Bank Details Card */}
                      {formData.paymentMethod === 'BANK_TRANSFER' && (
                        <div className="mx-4 mb-4 p-4 bg-white border border-neutral-300 rounded-xs space-y-3 animate-in fade-in">
                          <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                              Bank Name & Branch
                            </span>
                            <span className="text-xs font-bold text-black">
                              {storeSettings.bankName}{' '}
                              {storeSettings.bankBranch && (
                                <span className="font-normal text-neutral-500">
                                  ({storeSettings.bankBranch})
                                </span>
                              )}
                            </span>
                          </div>

                          <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                              Account Title
                            </span>
                            <span className="text-xs font-bold text-black uppercase">
                              {storeSettings.bankAccountTitle}
                            </span>
                          </div>

                          <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                                Account Number
                              </span>
                              <span className="text-xs font-mono font-bold text-black">
                                {storeSettings.bankAccountNumber}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopy(storeSettings.bankAccountNumber, 'account')}
                              className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border border-neutral-300 hover:border-black flex items-center space-x-1 cursor-pointer transition-colors"
                            >
                              {copiedField === 'account' ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span className="text-emerald-700">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3 text-neutral-500" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>

                          <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                                IBAN (Raast & All Pakistan Banks)
                              </span>
                              <span className="text-xs font-mono font-bold text-black break-all">
                                {storeSettings.bankIban}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopy(storeSettings.bankIban, 'iban')}
                              className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border border-neutral-300 hover:border-black flex items-center space-x-1 cursor-pointer transition-colors"
                            >
                              {copiedField === 'iban' ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span className="text-emerald-700">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3 text-neutral-500" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>

                          <div className="pt-1 text-[11px] text-neutral-600 leading-normal bg-neutral-50 p-2.5 border border-neutral-200">
                            <strong>Note:</strong> {storeSettings.bankInstructions}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* International Transfer (Payoneer / PayPal / Wise) */}
                  {storeSettings.enableInternationalTransfer && (
                    <div
                      className={`border transition-colors ${
                        formData.paymentMethod === 'INTERNATIONAL_TRANSFER'
                          ? 'border-black bg-neutral-50'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <label className="flex items-start p-4 cursor-pointer">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="INTERNATIONAL_TRANSFER"
                          checked={formData.paymentMethod === 'INTERNATIONAL_TRANSFER'}
                          onChange={() =>
                            setFormData({
                              ...formData,
                              paymentMethod: 'INTERNATIONAL_TRANSFER',
                            })
                          }
                          className="mt-0.5 text-black focus:ring-black"
                        />
                        <div className="ml-3 flex-1">
                          <div className="flex items-center space-x-2">
                            <Globe className="w-4 h-4 text-black" />
                            <span className="text-xs font-bold uppercase tracking-wider text-black">
                              {storeSettings.internationalTitle ||
                                'International Transfer (Payoneer / PayPal / Wise)'}
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-500 mt-0.5">
                            Pay internationally via Payoneer, PayPal, Wise, or SWIFT and share your receipt via WhatsApp.
                          </p>
                        </div>
                      </label>

                      {formData.paymentMethod === 'INTERNATIONAL_TRANSFER' && (
                        <div className="mx-4 mb-4 p-4 bg-white border border-neutral-300 rounded-xs space-y-3 animate-in fade-in">
                          {storeSettings.payoneerAccount.trim() && (
                            <div className="flex items-center justify-between border-b border-neutral-100 pb-2 gap-3">
                              <div className="min-w-0">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                                  Payoneer Account / Email
                                </span>
                                <span className="text-xs font-mono font-bold text-black break-all">
                                  {storeSettings.payoneerAccount}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  handleCopy(storeSettings.payoneerAccount, 'payoneer')
                                }
                                className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border border-neutral-300 hover:border-black flex items-center space-x-1 cursor-pointer transition-colors shrink-0"
                              >
                                {copiedField === 'payoneer' ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    <span className="text-emerald-700">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3 text-neutral-500" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}

                          {storeSettings.paypalAccount.trim() && (
                            <div className="flex items-center justify-between border-b border-neutral-100 pb-2 gap-3">
                              <div className="min-w-0">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                                  PayPal Email / PayPal.me
                                </span>
                                <span className="text-xs font-mono font-bold text-black break-all">
                                  {storeSettings.paypalAccount}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopy(storeSettings.paypalAccount, 'paypal')}
                                className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border border-neutral-300 hover:border-black flex items-center space-x-1 cursor-pointer transition-colors shrink-0"
                              >
                                {copiedField === 'paypal' ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    <span className="text-emerald-700">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3 text-neutral-500" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}

                          {storeSettings.wiseAccount.trim() && (
                            <div className="flex items-center justify-between border-b border-neutral-100 pb-2 gap-3">
                              <div className="min-w-0">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                                  Wise / SWIFT / International Bank
                                </span>
                                <span className="text-xs font-mono font-bold text-black break-all">
                                  {storeSettings.wiseAccount}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopy(storeSettings.wiseAccount, 'wise')}
                                className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border border-neutral-300 hover:border-black flex items-center space-x-1 cursor-pointer transition-colors shrink-0"
                              >
                                {copiedField === 'wise' ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    <span className="text-emerald-700">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3 text-neutral-500" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}

                          {!storeSettings.payoneerAccount.trim() &&
                            !storeSettings.paypalAccount.trim() &&
                            !storeSettings.wiseAccount.trim() && (
                              <div className="text-xs text-neutral-700 bg-neutral-50 p-3 border border-neutral-200">
                                Place your order now and our team will share our verified Payoneer / PayPal / Wise payment details directly on WhatsApp ({storeSettings.supportPhone}).
                              </div>
                            )}

                          <div className="pt-1 text-[11px] text-neutral-600 leading-normal bg-neutral-50 p-2.5 border border-neutral-200">
                            <strong>Note:</strong> {storeSettings.internationalInstructions}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Card payment sandbox (if enabled in admin) */}
                  {storeSettings.enableCard && (
                    <div
                      className={`border transition-colors ${
                        formData.paymentMethod === 'CARD'
                          ? 'border-black bg-neutral-50'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <label className="flex items-start p-4 cursor-pointer">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="CARD"
                          checked={formData.paymentMethod === 'CARD'}
                          onChange={() => setFormData({ ...formData, paymentMethod: 'CARD' })}
                          className="mt-0.5 text-black focus:ring-black"
                        />
                        <div className="ml-3 flex-1">
                          <div className="flex items-center space-x-2">
                            <CreditCard className="w-4 h-4 text-black" />
                            <span className="text-xs font-bold uppercase tracking-wider text-black">
                              {storeSettings.cardGatewayName || 'Credit / Debit Card (Visa / Mastercard)'}
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-neutral-200 text-neutral-700 rounded uppercase">
                              {storeSettings.cardMode}
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-500 mt-0.5">
                            {storeSettings.cardInstructions}
                          </p>
                        </div>
                      </label>

                      {formData.paymentMethod === 'CARD' && (
                        <div className="mx-4 mb-4 p-4 bg-white border border-neutral-300 rounded-xs space-y-3 animate-in fade-in">
                          <div className="text-xs font-bold uppercase tracking-wider text-black">
                            Card Information (3D Secure Sandbox)
                          </div>
                          <div className="space-y-3">
                            <input
                              type="text"
                              placeholder="Card number (4000 1234 5678 9010)"
                              className="w-full p-2.5 border border-neutral-300 text-xs font-mono"
                              defaultValue="4000 •••• •••• 9010"
                            />
                            <div className="grid grid-cols-2 gap-3">
                              <input
                                type="text"
                                placeholder="MM / YY"
                                className="w-full p-2.5 border border-neutral-300 text-xs font-mono"
                                defaultValue="12/28"
                              />
                              <input
                                type="text"
                                placeholder="CVC"
                                className="w-full p-2.5 border border-neutral-300 text-xs font-mono"
                                defaultValue="888"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {!storeSettings.enableCod &&
                    !storeSettings.enableCard &&
                    !storeSettings.enableBankTransfer &&
                    !storeSettings.enableInternationalTransfer && (
                      <div className="p-3 bg-red-50 text-red-700 text-xs">
                        No payment gateway currently active. Please contact merchant admin.
                      </div>
                    )}
                </div>
              </div>

              {/* Submit Button & Inline Error */}
              <div className="pt-4 space-y-3">
                {checkoutError && (
                  <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 text-xs font-semibold rounded flex items-center space-x-2 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
                    <span>{checkoutError}</span>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-black text-white text-xs font-extrabold uppercase tracking-[0.2em] hover:bg-neutral-800 transition-colors shadow-lg disabled:bg-neutral-400 cursor-pointer"
                >
                  {isSubmitting ? 'Placing Order...' : `Complete Order — ${formatPKR(grandTotal)}`}
                </button>
              </div>
            </form>
          </div>

          {/* Right: Order Summary Sidebar (5 cols) */}
          <div className="lg:col-span-5 bg-neutral-50 p-6 sm:p-8 border border-neutral-100 text-left h-fit space-y-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-black pb-3 border-b border-neutral-200">
              Order Summary ({items.length} {items.length === 1 ? 'item' : 'items'})
            </h2>

            {/* Line items */}
            <div className="divide-y divide-neutral-200 max-h-80 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.variantId} className="py-3 flex space-x-3 items-center">
                  <div className="relative w-14 h-14 bg-neutral-50 border border-neutral-200 flex-shrink-0 rounded-xs p-1">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-contain object-center"
                    />
                    <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-4 h-4 text-[9px] font-bold text-white bg-neutral-800 rounded-full">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-black truncate uppercase tracking-wider">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-neutral-500">{item.variantTitle}</p>
                  </div>
                  <div className="text-xs font-bold text-black">
                    {formatPKR(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            {/* Discount Code Input */}
            <form onSubmit={handleApplyDiscount} className="pt-2">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Discount code (e.g. DROP001)"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  className="flex-1 px-3 py-2 border border-neutral-300 text-xs uppercase font-mono focus:outline-none focus:border-black"
                />
                <button
                  type="submit"
                  disabled={isApplyingDiscount}
                  className="px-4 py-2 bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors disabled:bg-neutral-400 cursor-pointer"
                >
                  {isApplyingDiscount ? '...' : 'Apply'}
                </button>
              </div>
              {discountMessage && (
                <p
                  className={`text-[11px] mt-1.5 font-medium ${
                    discountAmount > 0 ? 'text-emerald-700' : 'text-red-600'
                  }`}
                >
                  {discountMessage}
                </p>
              )}
            </form>

            {/* Pricing Totals */}
            <div className="space-y-2 pt-4 border-t border-neutral-200 text-xs">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal</span>
                <span className="font-semibold text-black">{formatPKR(subtotal)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Promotional Discount</span>
                  <span>-{formatPKR(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-neutral-600">
                <span>Nationwide Shipping</span>
                <span className="font-semibold text-black">
                  {shippingFee === 0 ? (
                    <span className="text-emerald-700 font-bold uppercase text-[11px]">
                      FREE
                    </span>
                  ) : (
                    formatPKR(shippingFee)
                  )}
                </span>
              </div>

              <div className="flex justify-between text-base font-extrabold text-black pt-3 border-t border-neutral-200">
                <span>Total</span>
                <div className="text-right">
                  <span className="text-[10px] text-neutral-400 font-normal mr-1">PKR</span>
                  <span>{formatPKR(grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
