'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart-context';
import { formatPKR } from '@/lib/formatters';
import { useCurrency } from '@/lib/currency-context';
import { normalizeCurrencyCode, type CurrencyCode } from '@/lib/currency';
import { CurrencySwitcher } from '@/components/storefront/currency-switcher';
import { trackStoreEvent, getOrCreateSessionId } from '@/lib/analytics';
import {
  ShieldCheck,
  CreditCard,
  Banknote,
  ArrowLeft,
  AlertCircle,
  Copy,
  Check,
  Building2,
  Globe,
  Mail,
  ExternalLink,
  MessageCircle,
  Loader2,
} from 'lucide-react';

export interface CheckoutStoreSettings {
  storeName: string;
  logoText: string;
  freeShippingThreshold: number;
  shippingFee: number;
  enableCod: boolean;
  enableCard: boolean;
  codNotice: string;
  enableBankTransfer: boolean;
  bankName: string;
  bankAccountTitle: string;
  bankAccountNumber: string;
  bankIban: string;
  bankBranch: string;
  bankInstructions: string;
  enablePayoneer: boolean;
  payoneerTitle: string;
  payoneerEmail: string;
  payoneerAccountHolder: string;
  payoneerBankName: string;
  payoneerAccountNumber: string;
  payoneerRoutingNumber: string;
  payoneerCurrency: string;
  payoneerPayLink: string;
  payoneerInstructions: string;
  enableInternationalTransfer: boolean;
  internationalTitle: string;
  payoneerAccount: string;
  paypalAccount: string;
  wiseAccount: string;
  internationalInstructions: string;
  supportPhone: string;
  whatsappNumber: string;
  supportEmail: string;
  cardGatewayName: string;
  cardInstructions: string;
  cardMode: string;
}

type PaymentMethodKey =
  | 'COD'
  | 'BANK_TRANSFER'
  | 'PAYONEER'
  | 'INTERNATIONAL_TRANSFER'
  | 'CARD';

function getInitialPaymentMethod(
  s: CheckoutStoreSettings,
  preferInternational: boolean
): PaymentMethodKey {
  if (preferInternational) {
    if (s.enablePayoneer) return 'PAYONEER';
    if (s.enableInternationalTransfer) return 'INTERNATIONAL_TRANSFER';
    if (s.enableCard) return 'CARD';
  }
  if (s.enableCod) return 'COD';
  if (s.enableBankTransfer) return 'BANK_TRANSFER';
  if (s.enablePayoneer) return 'PAYONEER';
  if (s.enableInternationalTransfer) return 'INTERNATIONAL_TRANSFER';
  if (s.enableCard) return 'CARD';
  return 'COD';
}

function toWaDigits(phone: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.startsWith('03') && digits.length === 11) return `92${digits.slice(1)}`;
  return digits;
}

export function CheckoutClient({
  initialStoreSettings: storeSettings,
}: {
  initialStoreSettings: CheckoutStoreSettings;
}) {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const {
    currency,
    isInternational: isInternationalCurrency,
    formatPrice,
    convertAmount,
  } = useCurrency();

  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    firstName: '',
    lastName: '',
    address: '',
    city: isInternationalCurrency ? '' : 'Lahore',
    province: isInternationalCurrency ? '' : 'Punjab',
    postalCode: '',
    paymentMethod: getInitialPaymentMethod(
      storeSettings,
      isInternationalCurrency
    ) as PaymentMethodKey,
    directPaymentContact: '',
    notes: '',
  });

  const [discountCode, setDiscountCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountMessage, setDiscountMessage] = useState('');
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const checkoutTrackedRef = React.useRef(false);

  const isInternationalMethod =
    formData.paymentMethod === 'PAYONEER' ||
    formData.paymentMethod === 'INTERNATIONAL_TRANSFER';

  // Detect whether buyer entered an email or WhatsApp number in the direct contact field
  const directContactBadge = useMemo(() => {
    const val = formData.directPaymentContact.trim();
    if (!val) return null;
    if (val.includes('@') && val.includes('.')) {
      return { type: 'email' as const, label: 'Email detected' };
    }
    const digits = val.replace(/\D/g, '');
    if (digits.length >= 7 && digits.length <= 15) {
      return { type: 'whatsapp' as const, label: 'WhatsApp detected' };
    }
    return null;
  }, [formData.directPaymentContact]);

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

  const handleCopy = (text: string, field: string) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField((prev) => (prev === field ? null : prev)), 2200);
  };

  const handleSelectPayment = (method: PaymentMethodKey) => {
    setCheckoutError('');
    setFormData((prev) => {
      const next = { ...prev, paymentMethod: method };
      if (method === 'PAYONEER' || method === 'INTERNATIONAL_TRANSFER') {
        if (!prev.directPaymentContact) {
          next.directPaymentContact = prev.email || prev.phone;
        }
      } else {
        // Restore standard Pakistan defaults if buyer switches back to COD / Local Bank
        if (!prev.city.trim()) next.city = 'Lahore';
        if (!prev.province.trim()) next.province = 'Punjab';
      }
      return next;
    });
  };

  const shippingFee =
    subtotal >= storeSettings.freeShippingThreshold || subtotal === 0
      ? 0
      : storeSettings.shippingFee;
  const grandTotal = Math.max(0, subtotal - discountAmount + shippingFee);

  // Payoneer target currency amount (defaults to store's configured Payoneer receiving currency e.g. USD)
  const payoneerTargetCurrency: CurrencyCode =
    normalizeCurrencyCode(storeSettings.payoneerCurrency) || 'USD';
  const payoneerExactAmount = convertAmount(grandTotal, payoneerTargetCurrency);
  const payoneerExactFormatted = `${formatPrice(grandTotal, payoneerTargetCurrency)} ${payoneerTargetCurrency}`;
  const activeDisplayTotal = formatPrice(grandTotal);

  const storeWaDigits = toWaDigits(storeSettings.whatsappNumber || storeSettings.supportPhone);
  const storeWaUrl = storeWaDigits
    ? `https://wa.me/${storeWaDigits}?text=${encodeURIComponent(
        `Hi ${storeSettings.storeName}! I have a quick question about paying for my order.`
      )}`
    : null;

  const hasPayoneerDetails = Boolean(
    storeSettings.payoneerEmail.trim() ||
      storeSettings.payoneerAccountHolder.trim() ||
      storeSettings.payoneerBankName.trim() ||
      storeSettings.payoneerAccountNumber.trim() ||
      storeSettings.payoneerRoutingNumber.trim()
  );

  const allPayoneerCopyText = useMemo(() => {
    const lines: string[] = [];
    if (storeSettings.payoneerEmail.trim())
      lines.push(`Payoneer Email: ${storeSettings.payoneerEmail.trim()}`);
    if (storeSettings.payoneerAccountHolder.trim())
      lines.push(`Account Holder: ${storeSettings.payoneerAccountHolder.trim()}`);
    if (storeSettings.payoneerBankName.trim())
      lines.push(
        `Receiving Bank (${storeSettings.payoneerCurrency || 'USD'}): ${storeSettings.payoneerBankName.trim()}`
      );
    if (storeSettings.payoneerAccountNumber.trim())
      lines.push(`Account / IBAN: ${storeSettings.payoneerAccountNumber.trim()}`);
    if (storeSettings.payoneerRoutingNumber.trim())
      lines.push(`Routing / SWIFT: ${storeSettings.payoneerRoutingNumber.trim()}`);
    return lines.join('\n');
  }, [storeSettings]);

  const allBankCopyText = useMemo(() => {
    const lines = [
      `Bank: ${storeSettings.bankName}${storeSettings.bankBranch ? ` (${storeSettings.bankBranch})` : ''}`,
      `Account Title: ${storeSettings.bankAccountTitle}`,
      `Account Number: ${storeSettings.bankAccountNumber}`,
      `IBAN (Raast): ${storeSettings.bankIban}`,
    ];
    return lines.join('\n');
  }, [storeSettings]);

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
    } catch {
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
      setCheckoutError('Please enter your First Name for delivery.');
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

    if (isInternationalMethod) {
      const contactVal = formData.directPaymentContact.trim();
      const contactDigits = contactVal.replace(/\D/g, '');
      const isValidEmail = contactVal.includes('@') && contactVal.includes('.');
      const isValidPhone = contactDigits.length >= 7 && contactDigits.length <= 15;
      if (!contactVal || (!isValidEmail && !isValidPhone)) {
        setCheckoutError(
          'Please enter your Email address or WhatsApp number inside the payment box so we can connect with you directly.'
        );
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: `${formData.firstName} ${formData.lastName}`.trim(),
          customerEmail: formData.email || undefined,
          customerPhone: formData.phone,
          shippingAddress: formData.address,
          city: formData.city.trim() || 'Lahore',
          province: formData.province.trim() || 'Punjab',
          postalCode: formData.postalCode,
          subtotalPrice: subtotal,
          shippingPrice: shippingFee,
          totalPrice: grandTotal,
          paymentMethod: formData.paymentMethod,
          directPaymentContact: isInternationalMethod
            ? formData.directPaymentContact.trim()
            : undefined,
          buyerCurrency:
            formData.paymentMethod === 'PAYONEER' ? payoneerTargetCurrency : currency,
          buyerTotalFormatted:
            formData.paymentMethod === 'PAYONEER'
              ? payoneerExactFormatted
              : isInternationalCurrency
                ? `${activeDisplayTotal} ${currency}`
                : undefined,
          discountCode: discountAmount > 0 ? discountCode : undefined,
          idempotencyKey: `${formData.phone.replace(/\D/g, '')}_${items
            .map((i) => `${i.variantId || i.productId}:${i.quantity}`)
            .join('_')}`,
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
          skipBeacon: true,
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
    } catch {
      setCheckoutError('Network connection error while processing your order. Please retry.');
      setIsSubmitting(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const renderDirectContactInput = (required: boolean) => (
    <div className="pt-3.5 border-t border-neutral-100 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-[11px] font-semibold text-neutral-900">
          Your Email or WhatsApp Number <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-2">
          {directContactBadge && (
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-semibold">
              <Check className="w-3 h-3" />
              <span>{directContactBadge.label}</span>
            </span>
          )}
          {(formData.email || formData.phone) &&
            formData.directPaymentContact !== (formData.email || formData.phone) && (
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    directPaymentContact: prev.email || prev.phone,
                  }))
                }
                className="text-[11px] font-medium text-neutral-500 hover:text-black underline underline-offset-2 cursor-pointer"
              >
                Use contact above
              </button>
            )}
        </div>
      </div>

      <input
        type="text"
        required={required}
        placeholder="e.g. +44 7911 123456 or buyer@email.com"
        value={formData.directPaymentContact}
        onChange={(e) =>
          setFormData({
            ...formData,
            directPaymentContact: e.target.value,
          })
        }
        className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 text-xs font-mono text-black placeholder-neutral-400 focus:outline-none focus:border-black transition-colors"
      />
      <p className="text-[11px] text-neutral-500 leading-relaxed">
        Enter either your WhatsApp number (with country code) or Email so we can connect directly to confirm payment or send a Payoneer request.
      </p>
    </div>
  );

  const renderDirectSupportBar = (instructions: string) => (
    <div className="pt-3 border-t border-neutral-100 space-y-2 text-[11px] text-neutral-600">
      <p className="leading-relaxed">{instructions}</p>
      <div className="flex flex-wrap items-center gap-2 pt-0.5">
        {storeWaUrl && (
          <a
            href={storeWaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-800 font-medium transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-mono">{storeSettings.whatsappNumber}</span>
          </a>
        )}
        {storeSettings.supportEmail && (
          <a
            href={`mailto:${storeSettings.supportEmail}?subject=${encodeURIComponent(
              `${storeSettings.storeName} — Order Payment Inquiry`
            )}`}
            className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-800 font-medium transition-colors"
          >
            <Mail className="w-3.5 h-3.5 text-neutral-600" />
            <span>{storeSettings.supportEmail}</span>
          </a>
        )}
      </div>
    </div>
  );

  const renderCopyRow = (label: string, value: string, fieldKey: string) => (
    <div className="flex items-center justify-between py-2.5 gap-3">
      <div className="min-w-0">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 block">
          {label}
        </span>
        <span className="text-xs font-mono font-semibold text-neutral-900 break-all">
          {value}
        </span>
      </div>
      <button
        type="button"
        onClick={() => handleCopy(value, fieldKey)}
        className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider border border-neutral-200 hover:border-black text-neutral-700 hover:text-black flex items-center space-x-1 cursor-pointer transition-colors shrink-0 bg-white"
      >
        {copiedField === fieldKey ? (
          <>
            <Check className="w-3 h-3 text-emerald-600" />
            <span className="text-emerald-700">Copied</span>
          </>
        ) : (
          <>
            <Copy className="w-3 h-3 text-neutral-400" />
            <span>Copy</span>
          </>
        )}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Top Simple Checkout Header */}
      <header className="border-b border-neutral-100 py-5 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="inline-block">
            <span className="font-extrabold text-xl sm:text-2xl tracking-[0.25em] uppercase text-black">
              {storeSettings.logoText}
            </span>
          </Link>
          <div className="flex items-center space-x-3 sm:space-x-5">
            <CurrencySwitcher variant="header" />
            <div className="flex items-center space-x-2 text-xs text-neutral-500">
              <ShieldCheck className="w-4 h-4 text-black" />
              <span className="hidden sm:inline uppercase tracking-widest font-semibold">
                Secure Checkout
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Checkout Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {checkoutError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 text-xs font-medium flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
            <span>{checkoutError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left: Customer Information & Delivery Form (7 cols) */}
          <div className="lg:col-span-7 space-y-7 text-left">
            <Link
              href="/"
              className="inline-flex items-center space-x-2 text-xs font-medium text-neutral-500 hover:text-black transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Shopping</span>
            </Link>

            <form onSubmit={handleSubmitOrder} className="space-y-7">
              {/* Contact Information */}
              <div className="space-y-4">
                <div className="flex justify-between items-baseline gap-2">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-black">
                    Contact Details
                  </h2>
                  <span className="text-[11px] text-neutral-400">
                    {isInternationalMethod
                      ? 'WhatsApp or Email updates'
                      : 'Order updates via SMS / WhatsApp'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                      {isInternationalMethod
                        ? 'Phone / WhatsApp (with country code) *'
                        : 'Mobile Phone Number (03XX-XXXXXXX) *'}
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder={isInternationalMethod ? '+44 7911 123456' : '0300 1234567'}
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-neutral-300 text-xs focus:outline-none focus:border-black font-mono transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      placeholder="your.email@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-neutral-300 text-xs focus:outline-none focus:border-black transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="space-y-4 pt-6 border-t border-neutral-100">
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-black">
                    {isInternationalMethod
                      ? 'Shipping Address (Worldwide & Pakistan)'
                      : 'Shipping Address (Pakistan)'}
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ali"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-neutral-300 text-xs focus:outline-none focus:border-black transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      placeholder="Ahmed"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-neutral-300 text-xs focus:outline-none focus:border-black transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                    Complete Street Address (House / Street / Area) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={
                      isInternationalMethod
                        ? '221B Baker Street, Apartment 4'
                        : 'House 14-B, Street 3, Block C, Gulberg'
                    }
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-neutral-300 text-xs focus:outline-none focus:border-black transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                      City *
                    </label>
                    {isInternationalMethod ? (
                      <input
                        type="text"
                        required
                        placeholder="e.g. London / Lahore"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-3.5 py-2.5 border border-neutral-300 text-xs focus:outline-none focus:border-black transition-colors"
                      />
                    ) : (
                      <select
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-3 py-2.5 border border-neutral-300 text-xs focus:outline-none focus:border-black bg-white transition-colors"
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
                    )}
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                      {isInternationalMethod ? 'Country / State *' : 'Province *'}
                    </label>
                    {isInternationalMethod ? (
                      <input
                        type="text"
                        required
                        placeholder="e.g. United Kingdom / USA"
                        value={formData.province}
                        onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                        className="w-full px-3.5 py-2.5 border border-neutral-300 text-xs focus:outline-none focus:border-black transition-colors"
                      />
                    ) : (
                      <select
                        value={formData.province}
                        onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                        className="w-full px-3 py-2.5 border border-neutral-300 text-xs focus:outline-none focus:border-black bg-white transition-colors"
                      >
                        <option value="Punjab">Punjab</option>
                        <option value="Sindh">Sindh</option>
                        <option value="Khyber Pakhtunkhwa">KPK</option>
                        <option value="Balochistan">Balochistan</option>
                        <option value="Islamabad Capital Territory">Islamabad (ICT)</option>
                        <option value="Azad Kashmir">AJK</option>
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                      Postal / ZIP Code
                    </label>
                    <input
                      type="text"
                      placeholder="54000"
                      value={formData.postalCode}
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-neutral-300 text-xs focus:outline-none focus:border-black transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Payment Gateways */}
              <div className="space-y-3 pt-6 border-t border-neutral-100">
                <h2 className="text-xs font-bold uppercase tracking-widest text-black">
                  Payment Method
                </h2>

                <div className="space-y-2.5">
                  {/* 1. Cash on Delivery */}
                  {storeSettings.enableCod && (
                    <label
                      className={`flex items-start p-4 border cursor-pointer transition-[border-color,background-color] duration-150 ${
                        formData.paymentMethod === 'COD'
                          ? 'border-black bg-neutral-50/70'
                          : 'border-neutral-200 hover:border-neutral-300 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="COD"
                        checked={formData.paymentMethod === 'COD'}
                        onChange={() => handleSelectPayment('COD')}
                        className="mt-0.5 accent-black"
                      />
                      <div className="ml-3 flex-1">
                        <div className="flex items-center space-x-2">
                          <Banknote className="w-4 h-4 text-black shrink-0" />
                          <span className="text-xs font-bold uppercase tracking-wider text-black">
                            Cash on Delivery (Nationwide COD)
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">
                          {storeSettings.codNotice}
                        </p>
                      </div>
                    </label>
                  )}

                  {/* 2. Direct Bank Transfer (Raast / IBAN) */}
                  {storeSettings.enableBankTransfer && (
                    <div
                      className={`border transition-[border-color,background-color] duration-150 ${
                        formData.paymentMethod === 'BANK_TRANSFER'
                          ? 'border-black bg-neutral-50/70'
                          : 'border-neutral-200 hover:border-neutral-300 bg-white'
                      }`}
                    >
                      <label className="flex items-start p-4 cursor-pointer">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="BANK_TRANSFER"
                          checked={formData.paymentMethod === 'BANK_TRANSFER'}
                          onChange={() => handleSelectPayment('BANK_TRANSFER')}
                          className="mt-0.5 accent-black"
                        />
                        <div className="ml-3 flex-1">
                          <div className="flex items-center space-x-2">
                            <Building2 className="w-4 h-4 text-black shrink-0" />
                            <span className="text-xs font-bold uppercase tracking-wider text-black">
                              Direct Bank Transfer (Raast / IBAN / Online Banking)
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">
                            Transfer directly to official store account and share receipt via WhatsApp.
                          </p>
                        </div>
                      </label>

                      {formData.paymentMethod === 'BANK_TRANSFER' && (
                        <div className="px-4 pb-4 pt-1">
                          <div className="bg-white border border-neutral-200 px-4 py-3 space-y-1">
                            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                                Official Store Bank Details
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopy(allBankCopyText, 'bankAll')}
                                className="inline-flex items-center space-x-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-600 hover:text-black cursor-pointer"
                              >
                                {copiedField === 'bankAll' ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    <span className="text-emerald-700">Copied All</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy All</span>
                                  </>
                                )}
                              </button>
                            </div>

                            <div className="divide-y divide-neutral-100">
                              <div className="flex items-center justify-between py-2.5 gap-3">
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                                  Bank &amp; Branch
                                </span>
                                <span className="text-xs font-semibold text-black text-right">
                                  {storeSettings.bankName}
                                  {storeSettings.bankBranch && (
                                    <span className="font-normal text-neutral-500">
                                      {' '}
                                      ({storeSettings.bankBranch})
                                    </span>
                                  )}
                                </span>
                              </div>
                              <div className="flex items-center justify-between py-2.5 gap-3">
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                                  Account Title
                                </span>
                                <span className="text-xs font-semibold text-black uppercase text-right">
                                  {storeSettings.bankAccountTitle}
                                </span>
                              </div>
                              {renderCopyRow(
                                'Account Number',
                                storeSettings.bankAccountNumber,
                                'account'
                              )}
                              {renderCopyRow(
                                'IBAN (Raast & All Pakistan Banks)',
                                storeSettings.bankIban,
                                'iban'
                              )}
                            </div>

                            <p className="pt-2.5 border-t border-neutral-100 text-[11px] text-neutral-500 leading-relaxed">
                              {storeSettings.bankInstructions}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 3. Dedicated Payoneer (International Payment) */}
                  {storeSettings.enablePayoneer && (
                    <div
                      className={`border transition-[border-color,background-color] duration-150 ${
                        formData.paymentMethod === 'PAYONEER'
                          ? 'border-black bg-neutral-50/70'
                          : 'border-neutral-200 hover:border-neutral-300 bg-white'
                      }`}
                    >
                      <label className="flex items-start p-4 cursor-pointer">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="PAYONEER"
                          checked={formData.paymentMethod === 'PAYONEER'}
                          onChange={() => handleSelectPayment('PAYONEER')}
                          className="mt-0.5 accent-black"
                        />
                        <div className="ml-3 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Globe className="w-4 h-4 text-black shrink-0" />
                            <span className="text-xs font-bold uppercase tracking-wider text-black">
                              {storeSettings.payoneerTitle || 'Payoneer (International Payment)'}
                            </span>
                            {storeSettings.payoneerCurrency && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-neutral-200/80 text-neutral-800 uppercase tracking-wide">
                                {storeSettings.payoneerCurrency}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">
                            Pay easily via Payoneer or international bank transfer directly to our Payoneer receiving account.
                          </p>
                        </div>
                      </label>

                      {formData.paymentMethod === 'PAYONEER' && (
                        <div className="px-4 pb-4 pt-1">
                          <div className="bg-white border border-neutral-200 px-4 py-3.5 space-y-3">
                            {/* Exact Converted Payoneer Amount Banner */}
                            <div className="flex items-center justify-between gap-3 bg-neutral-50 border border-neutral-200 px-3.5 py-2.5">
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block">
                                  Exact Amount to Transfer ({payoneerTargetCurrency})
                                </span>
                                <div className="flex items-baseline gap-2 mt-0.5 tabular-nums">
                                  <span className="text-sm font-extrabold text-black font-mono">
                                    {payoneerExactFormatted}
                                  </span>
                                  <span className="text-[11px] text-neutral-400">
                                    ≈ {formatPKR(grandTotal)}
                                  </span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  handleCopy(String(payoneerExactAmount), 'payoneerAmount')
                                }
                                className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider border border-neutral-300 hover:border-black text-neutral-700 hover:text-black flex items-center space-x-1 cursor-pointer transition-colors shrink-0 bg-white"
                              >
                                {copiedField === 'payoneerAmount' ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    <span className="text-emerald-700">Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3 text-neutral-400" />
                                    <span>Copy Amount</span>
                                  </>
                                )}
                              </button>
                            </div>

                            {hasPayoneerDetails ? (
                              <>
                                <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                                    Payoneer Receiving Details ({storeSettings.payoneerCurrency || 'USD'})
                                  </span>
                                  {allPayoneerCopyText && (
                                    <button
                                      type="button"
                                      onClick={() => handleCopy(allPayoneerCopyText, 'payoneerAll')}
                                      className="inline-flex items-center space-x-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-600 hover:text-black cursor-pointer"
                                    >
                                      {copiedField === 'payoneerAll' ? (
                                        <>
                                          <Check className="w-3 h-3 text-emerald-600" />
                                          <span className="text-emerald-700">Copied All</span>
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="w-3 h-3" />
                                          <span>Copy All</span>
                                        </>
                                      )}
                                    </button>
                                  )}
                                </div>

                                <div className="divide-y divide-neutral-100">
                                  {storeSettings.payoneerEmail.trim() &&
                                    renderCopyRow(
                                      'Payoneer Email (Payoneer-to-Payoneer)',
                                      storeSettings.payoneerEmail.trim(),
                                      'payoneerEmail'
                                    )}

                                  {storeSettings.payoneerAccountHolder.trim() && (
                                    <div className="flex items-center justify-between py-2.5 gap-3">
                                      <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                                        Beneficiary / Account Holder
                                      </span>
                                      <span className="text-xs font-semibold text-black uppercase text-right">
                                        {storeSettings.payoneerAccountHolder}
                                      </span>
                                    </div>
                                  )}

                                  {storeSettings.payoneerBankName.trim() && (
                                    <div className="flex items-center justify-between py-2.5 gap-3">
                                      <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                                        Receiving Bank ({storeSettings.payoneerCurrency || 'USD'})
                                      </span>
                                      <span className="text-xs font-semibold text-black text-right">
                                        {storeSettings.payoneerBankName}
                                      </span>
                                    </div>
                                  )}

                                  {storeSettings.payoneerAccountNumber.trim() &&
                                    renderCopyRow(
                                      'Account Number / IBAN',
                                      storeSettings.payoneerAccountNumber.trim(),
                                      'payoneerAccount'
                                    )}

                                  {storeSettings.payoneerRoutingNumber.trim() &&
                                    renderCopyRow(
                                      'Routing Number (ABA) / SWIFT / BIC',
                                      storeSettings.payoneerRoutingNumber.trim(),
                                      'payoneerRouting'
                                    )}
                                </div>
                              </>
                            ) : (
                              <p className="text-xs text-neutral-600 leading-relaxed">
                                Enter your Email or WhatsApp below and complete your order — we will send you our Payoneer payment request / receiving details directly.
                              </p>
                            )}

                            {/^https?:\/\//i.test(storeSettings.payoneerPayLink.trim()) && (
                              <a
                                href={storeSettings.payoneerPayLink.trim()}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center space-x-1.5 w-full py-2.5 px-3 bg-neutral-900 hover:bg-black text-white text-[11px] font-bold uppercase tracking-wider transition-colors"
                              >
                                <span>Open Payoneer Payment Link</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}

                            {renderDirectContactInput(formData.paymentMethod === 'PAYONEER')}
                            {renderDirectSupportBar(storeSettings.payoneerInstructions)}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 4. Other International Transfer (PayPal / Wise) */}
                  {storeSettings.enableInternationalTransfer && (
                    <div
                      className={`border transition-[border-color,background-color] duration-150 ${
                        formData.paymentMethod === 'INTERNATIONAL_TRANSFER'
                          ? 'border-black bg-neutral-50/70'
                          : 'border-neutral-200 hover:border-neutral-300 bg-white'
                      }`}
                    >
                      <label className="flex items-start p-4 cursor-pointer">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="INTERNATIONAL_TRANSFER"
                          checked={formData.paymentMethod === 'INTERNATIONAL_TRANSFER'}
                          onChange={() => handleSelectPayment('INTERNATIONAL_TRANSFER')}
                          className="mt-0.5 accent-black"
                        />
                        <div className="ml-3 flex-1">
                          <div className="flex items-center space-x-2">
                            <Globe className="w-4 h-4 text-black shrink-0" />
                            <span className="text-xs font-bold uppercase tracking-wider text-black">
                              {storeSettings.internationalTitle ||
                                'International Transfer (PayPal / Wise)'}
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">
                            Pay internationally via PayPal, Wise, or SWIFT and share your receipt via WhatsApp or Email.
                          </p>
                        </div>
                      </label>

                      {formData.paymentMethod === 'INTERNATIONAL_TRANSFER' && (
                        <div className="px-4 pb-4 pt-1">
                          <div className="bg-white border border-neutral-200 px-4 py-3.5 space-y-3">
                            {storeSettings.payoneerAccount.trim() ||
                            storeSettings.paypalAccount.trim() ||
                            storeSettings.wiseAccount.trim() ? (
                              <div className="divide-y divide-neutral-100">
                                {storeSettings.payoneerAccount.trim() &&
                                  renderCopyRow(
                                    'Payoneer Account / Email',
                                    storeSettings.payoneerAccount.trim(),
                                    'payoneer'
                                  )}
                                {storeSettings.paypalAccount.trim() &&
                                  renderCopyRow(
                                    'PayPal Email / PayPal.me',
                                    storeSettings.paypalAccount.trim(),
                                    'paypal'
                                  )}
                                {storeSettings.wiseAccount.trim() &&
                                  renderCopyRow(
                                    'Wise / SWIFT / International Bank',
                                    storeSettings.wiseAccount.trim(),
                                    'wise'
                                  )}
                              </div>
                            ) : (
                              <p className="text-xs text-neutral-600 leading-relaxed">
                                Enter your Email or WhatsApp below and complete your order — our team will send verified international payment details directly to you.
                              </p>
                            )}

                            {renderDirectContactInput(
                              formData.paymentMethod === 'INTERNATIONAL_TRANSFER'
                            )}
                            {renderDirectSupportBar(storeSettings.internationalInstructions)}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 5. Credit / Debit Card */}
                  {storeSettings.enableCard && (
                    <div
                      className={`border transition-[border-color,background-color] duration-150 ${
                        formData.paymentMethod === 'CARD'
                          ? 'border-black bg-neutral-50/70'
                          : 'border-neutral-200 hover:border-neutral-300 bg-white'
                      }`}
                    >
                      <label className="flex items-start p-4 cursor-pointer">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="CARD"
                          checked={formData.paymentMethod === 'CARD'}
                          onChange={() => handleSelectPayment('CARD')}
                          className="mt-0.5 accent-black"
                        />
                        <div className="ml-3 flex-1">
                          <div className="flex items-center space-x-2">
                            <CreditCard className="w-4 h-4 text-black shrink-0" />
                            <span className="text-xs font-bold uppercase tracking-wider text-black">
                              {storeSettings.cardGatewayName ||
                                'Credit / Debit Card (Visa / Mastercard)'}
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-neutral-200 text-neutral-700 uppercase">
                              {storeSettings.cardMode}
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">
                            {storeSettings.cardInstructions}
                          </p>
                        </div>
                      </label>

                      {formData.paymentMethod === 'CARD' && (
                        <div className="px-4 pb-4 pt-1">
                          <div className="bg-white border border-neutral-200 p-4 space-y-3">
                            <div className="text-[11px] font-bold uppercase tracking-wider text-black">
                              Card Information (3D Secure Sandbox)
                            </div>
                            <div className="space-y-2.5">
                              <input
                                type="text"
                                placeholder="Card number (4000 1234 5678 9010)"
                                className="w-full p-2.5 border border-neutral-300 text-xs font-mono focus:outline-none focus:border-black"
                                defaultValue="4000 •••• •••• 9010"
                              />
                              <div className="grid grid-cols-2 gap-2.5">
                                <input
                                  type="text"
                                  placeholder="MM / YY"
                                  className="w-full p-2.5 border border-neutral-300 text-xs font-mono focus:outline-none focus:border-black"
                                  defaultValue="12/28"
                                />
                                <input
                                  type="text"
                                  placeholder="CVC"
                                  className="w-full p-2.5 border border-neutral-300 text-xs font-mono focus:outline-none focus:border-black"
                                  defaultValue="888"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {!storeSettings.enableCod &&
                    !storeSettings.enableCard &&
                    !storeSettings.enableBankTransfer &&
                    !storeSettings.enablePayoneer &&
                    !storeSettings.enableInternationalTransfer && (
                      <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs">
                        No payment gateway currently active. Please contact merchant admin.
                      </div>
                    )}
                </div>
              </div>

              {/* Submit Button & Inline Error */}
              <div className="pt-2 space-y-3">
                {checkoutError && (
                  <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 text-xs font-medium flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
                    <span>{checkoutError}</span>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-black text-white text-xs font-extrabold uppercase tracking-[0.2em] hover:bg-neutral-800 transition-colors disabled:bg-neutral-400 cursor-pointer flex items-center justify-center space-x-2 tabular-nums"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Placing Order...</span>
                    </>
                  ) : (
                    <span>Complete Order — {activeDisplayTotal}</span>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Right: Sticky Order Summary Sidebar (5 cols) */}
          <div className="lg:col-span-5 bg-neutral-50 p-6 sm:p-8 border border-neutral-200/80 text-left h-fit lg:sticky lg:top-8 space-y-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-black pb-3 border-b border-neutral-200">
              Order Summary ({items.length} {items.length === 1 ? 'item' : 'items'})
            </h2>

            {/* Line items */}
            <div className="divide-y divide-neutral-200 max-h-80 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.variantId} className="py-3 flex space-x-3 items-center">
                  <div className="relative w-14 h-14 bg-white border border-neutral-200 flex-shrink-0 p-1">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-contain object-center"
                    />
                    <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-4 h-4 text-[9px] font-bold text-white bg-neutral-900 rounded-full tabular-nums">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-black truncate uppercase tracking-wider">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-neutral-500">{item.variantTitle}</p>
                  </div>
                  <div className="text-xs font-bold text-black tabular-nums">
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            {/* Discount Code Input */}
            <form onSubmit={handleApplyDiscount} className="pt-2">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Discount code"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white border border-neutral-300 text-xs uppercase font-mono focus:outline-none focus:border-black transition-colors"
                />
                <button
                  type="submit"
                  disabled={isApplyingDiscount}
                  className="px-4 py-2 bg-neutral-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors disabled:bg-neutral-400 cursor-pointer"
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
            <div className="space-y-2 pt-4 border-t border-neutral-200 text-xs tabular-nums">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal</span>
                <span className="font-semibold text-black">{formatPrice(subtotal)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Promotional Discount</span>
                  <span>-{formatPrice(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-neutral-600">
                <span>{isInternationalMethod ? 'Shipping' : 'Nationwide Shipping'}</span>
                <span className="font-semibold text-black">
                  {shippingFee === 0 ? (
                    <span className="text-emerald-700 font-bold uppercase text-[11px]">
                      FREE
                    </span>
                  ) : (
                    formatPrice(shippingFee)
                  )}
                </span>
              </div>

              <div className="flex justify-between items-baseline text-base font-extrabold text-black pt-3 border-t border-neutral-200">
                <span>Total</span>
                <div className="text-right">
                  <div>
                    <span className="text-[10px] text-neutral-400 font-normal mr-1">
                      {currency}
                    </span>
                    <span>{activeDisplayTotal}</span>
                  </div>
                  {isInternationalCurrency && (
                    <span className="block text-[10px] font-normal text-neutral-400 mt-0.5">
                      ≈ {formatPKR(grandTotal)} PKR
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
