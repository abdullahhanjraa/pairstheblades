'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Store,
  Palette,
  Truck,
  CreditCard,
  Share2,
  Tag,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Plus,
  Trash2,
  Power,
  FileText,
  Building2,
  ImageDown,
  RefreshCw,
  AlertTriangle,
  Upload,
  MessageCircle,
  Shield,
  KeyRound,
  Eye,
  EyeOff,
  Lock,
  Activity,
} from 'lucide-react';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { validateHeroBanner } from '@/lib/image-validator';

interface SettingsFormProps {
  initialStore: any;
  initialDiscounts: any[];
  initialHasCustomPassword?: boolean;
}

export function SettingsForm({
  initialStore,
  initialDiscounts,
  initialHasCustomPassword = false,
}: SettingsFormProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    | 'general'
    | 'theme'
    | 'shipping'
    | 'payments'
    | 'social'
    | 'discounts'
    | 'policies'
    | 'pixels'
    | 'security'
  >('general');

  // Master Store Form State
  const [store, setStore] = useState({
    name: initialStore?.name ?? 'Pairs Knife & Sword Co.',
    legalName: initialStore?.legalName ?? 'Pairs Knife & Sword Co. Pvt Ltd',
    logoText: initialStore?.logoText ?? 'PAIRS',
    supportEmail: initialStore?.supportEmail ?? 'support@pairsblades.com',
    supportPhone: initialStore?.supportPhone ?? '+92 300 1234567',
    supportCity: initialStore?.supportCity ?? 'Gujranwala, Pakistan',
    contactAddress:
      initialStore?.contactAddress ?? 'Drop Studio, Main Boulevard, Gujranwala, Pakistan',

    // Announcement
    enableAnnouncement: initialStore?.enableAnnouncement ?? true,
    announcement:
      initialStore?.announcement ??
      'Shipping all over Pakistan! Cash on delivery available nationwide. Handcrafted blades live now!',

    // Hero Section
    heroTag: initialStore?.heroTag ?? 'Master Forged / Live Now',
    heroTitle: initialStore?.heroTitle ?? 'Precision Steel',
    heroDescription:
      initialStore?.heroDescription ??
      'Handcrafted Damascus blades, chef knives, and swords with unrivaled edge retention and nationwide cash on delivery.',
    heroImageUrl:
      initialStore?.heroImageUrl ??
      'https://cdn.shopify.com/s/files/1/0971/9447/5817/files/IMG_7003.png?v=1794397107&width=3840',
    heroCtaText: initialStore?.heroCtaText ?? 'Explore Blades',
    heroCtaLink: initialStore?.heroCtaLink ?? '#products',

    // Value Props
    valueProp1: initialStore?.valueProp1 ?? 'Free Shipping Over Rs. 5,000',
    valueProp2: initialStore?.valueProp2 ?? 'Cash On Delivery Nationwide',
    valueProp3: initialStore?.valueProp3 ?? 'Hand-Inspected Edge & Blade Warranty',

    // Catalog Header
    catalogTitle: initialStore?.catalogTitle ?? '_FEATURED BLADES >>>_',
    catalogSubtitle:
      initialStore?.catalogSubtitle ??
      'Limited production batch forged from premium high-carbon Damascus steel.',

    // VIP Community
    communityTitle: initialStore?.communityTitle ?? '_Join VIP Blade Club !_',
    communitySubtitle:
      initialStore?.communitySubtitle ??
      'Get early access to exclusive Damascus drops, custom forged pieces, and collector discounts.',
    communityLink: initialStore?.communityLink ?? '',
    communityCtaText: initialStore?.communityCtaText ?? 'Access',

    // Social Links & Granular Toggles
    enableSocialLinks: initialStore?.enableSocialLinks ?? true,
    enableInstagram: initialStore?.enableInstagram ?? true,
    enableTiktok: initialStore?.enableTiktok ?? true,
    enableYoutube: initialStore?.enableYoutube ?? true,
    enableWhatsApp: initialStore?.enableWhatsApp ?? true,
    enableFloatingWhatsApp: initialStore?.enableFloatingWhatsApp ?? true,
    whatsappNumber:
      initialStore?.whatsappNumber ?? initialStore?.supportPhone ?? '+923001234567',
    whatsappDefaultMsg:
      initialStore?.whatsappDefaultMsg ??
      'Hi Pairs Blades, I would like to inquire about handcrafted blades.',
    instagramUrl: initialStore?.instagramUrl ?? '',
    tiktokUrl: initialStore?.tiktokUrl ?? '',
    youtubeUrl: initialStore?.youtubeUrl ?? '',

    // Shipping & Currency
    freeShippingThreshold: initialStore?.freeShippingThreshold ?? 5000,
    shippingFee: initialStore?.shippingFee ?? 250,
    estimatedDeliveryDays:
      initialStore?.estimatedDeliveryDays ?? '2-4 Business Days',

    // Payment Gateways
    enableCod: initialStore?.enableCod ?? true,
    enableCard: initialStore?.enableCard ?? true,
    codNotice:
      initialStore?.codNotice ??
      'Cash on Delivery is available nationwide across Pakistan.',
    enableBankTransfer: initialStore?.enableBankTransfer ?? true,
    bankName: initialStore?.bankName ?? 'Meezan Bank Ltd',
    bankAccountTitle: initialStore?.bankAccountTitle ?? 'PAIRS KNIFE & SWORD CO.',
    bankAccountNumber: initialStore?.bankAccountNumber ?? '01020304050607',
    bankIban: initialStore?.bankIban ?? 'PK36MEZN0001020304050607',
    bankBranch: initialStore?.bankBranch ?? 'Main Boulevard, Gujranwala',
    bankInstructions:
      initialStore?.bankInstructions ??
      'Please transfer total amount via Raast / Online Banking and WhatsApp receipt with Order # to +92 300 1234567',
    cardGatewayName:
      initialStore?.cardGatewayName ?? 'Visa / Mastercard Secure Gateway',
    cardInstructions:
      initialStore?.cardInstructions ??
      'Instant checkout via 3D Secure card processing sandbox.',
    cardMode: initialStore?.cardMode ?? 'SANDBOX',

    // Store Policies & Custom Content
    policyRefund: initialStore?.policyRefund ?? '',
    policyShipping: initialStore?.policyShipping ?? '',
    policyTerms: initialStore?.policyTerms ?? '',
    policyPrivacy: initialStore?.policyPrivacy ?? '',
    policyContact: initialStore?.policyContact ?? '',

    // Marketing Pixels & Conversion Tracking
    metaPixelId: initialStore?.metaPixelId ?? '',
    tiktokPixelId: initialStore?.tiktokPixelId ?? '',
    ga4MeasurementId: initialStore?.ga4MeasurementId ?? '',
  });

  // Discounts state
  const [discounts, setDiscounts] = useState<any[]>(initialDiscounts || []);
  const [newDiscount, setNewDiscount] = useState({
    code: '',
    type: 'PERCENTAGE',
    value: 10,
    minSubtotal: 0,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isSubmittingDiscount, setIsSubmittingDiscount] = useState(false);
  const [confirmDeleteDiscountId, setConfirmDeleteDiscountId] = useState<string | null>(null);
  const [couponError, setCouponError] = useState('');
  const [savedFeedback, setSavedFeedback] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [imageVerifyStatus, setImageVerifyStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [bannerUploadError, setBannerUploadError] = useState<string | null>(null);
  const bannerFileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Security & Master Password Change State
  const [hasCustomPassword, setHasCustomPassword] = useState(initialHasCustomPassword);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const handleBannerFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBannerUploadError(null);
    setIsUploadingBanner(true);

    try {
      // 1. Strict Client-Side Resolution, Aspect-Ratio & Weight Guard
      const check = await validateHeroBanner(file);
      if (!check.valid) {
        setBannerUploadError(check.error || 'Banner dimensions or file format unfit.');
        setIsUploadingBanner(false);
        if (bannerFileInputRef.current) bannerFileInputRef.current.value = '';
        return;
      }

      // 2. Transmit to Secure Local Upload Pipeline
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'banners');

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setBannerUploadError(data.error || 'Failed to upload hero banner to server.');
        setIsUploadingBanner(false);
        return;
      }

      // 3. Update store state and persist atomically to database
      const updatedStore = { ...store, heroImageUrl: data.url };
      setStore(updatedStore);
      setImageVerifyStatus('valid');

      const saveRes = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedStore),
      });
      const saveData = await saveRes.json();
      if (saveData.success && saveData.store) {
        setStore((prev: any) => ({ ...prev, ...saveData.store }));
        router.refresh();
      }

      setSavedFeedback(
        `✓ Hero banner uploaded & saved to database (${check.width}×${check.height}px, ${(check.sizeMB || 0).toFixed(1)}MB). Live on store!`
      );
      setTimeout(() => setSavedFeedback(''), 5000);
    } catch (err: any) {
      console.error('Banner upload error:', err);
      setBannerUploadError(err.message || 'Error processing banner upload.');
    } finally {
      setIsUploadingBanner(false);
      if (bannerFileInputRef.current) bannerFileInputRef.current.value = '';
    }
  };

  const handleVerifyImageUrl = (url: string) => {
    if (!url) return;
    setImageVerifyStatus('checking');
    if (typeof window !== 'undefined') {
      const img = new window.Image();
      img.onload = () => setImageVerifyStatus('valid');
      img.onerror = () => setImageVerifyStatus('invalid');
      img.src = url;
    }
  };

  // Handle saving master store configuration
  const handleSaveStore = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setSavedFeedback('');
    setErrorMessage('');

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(store),
      });

      const data = await res.json();
      if (data.success && data.store) {
        setStore((prev) => ({
          ...prev,
          ...data.store,
        }));
        setSavedFeedback('✓ All settings saved to database & synchronized across live storefront!');
        router.refresh();
        setTimeout(() => setSavedFeedback(''), 5000);
      } else {
        setErrorMessage(data.error || 'Failed to persist settings');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Network error while saving settings');
    } finally {
      setIsSaving(false);
    }
  };

  // Create new discount code
  const handleCreateDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDiscount.code.trim()) return;

    setIsSubmittingDiscount(true);
    setCouponError('');

    try {
      const res = await fetch('/api/admin/discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDiscount),
      });
      const data = await res.json();
      if (data.success && data.discount) {
        setDiscounts([data.discount, ...discounts]);
        setNewDiscount({ code: '', type: 'PERCENTAGE', value: 10, minSubtotal: 0 });
        setSavedFeedback(`✓ Discount code '${data.discount.code}' created and live in checkout!`);
        setTimeout(() => setSavedFeedback(''), 4000);
      } else {
        setCouponError(data.error || 'Failed to create discount');
      }
    } catch (e) {
      setCouponError('Network error creating discount');
    } finally {
      setIsSubmittingDiscount(false);
    }
  };

  // Toggle discount active/inactive
  const handleToggleDiscount = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await fetch(`/api/admin/discounts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setDiscounts(
          discounts.map((d) => (d.id === id ? { ...d, status: newStatus } : d))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete discount execution
  const handleExecuteDeleteDiscount = async () => {
    if (!confirmDeleteDiscountId) return;
    const id = confirmDeleteDiscountId;
    try {
      const res = await fetch(`/api/admin/discounts/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setDiscounts(discounts.filter((d) => d.id !== id));
        setSavedFeedback('✓ Promotional discount coupon deleted successfully.');
        setTimeout(() => setSavedFeedback(''), 4000);
        setConfirmDeleteDiscountId(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setPasswordError('Please fill in all three password fields.');
      return;
    }

    if (newPassword.trim().length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword.trim() !== confirmPassword.trim()) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    if (newPassword.trim() === currentPassword.trim()) {
      setPasswordError('New password must be different from your current password.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: currentPassword.trim(),
          newPassword: newPassword.trim(),
          confirmPassword: confirmPassword.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPasswordSuccess(
          data.message ||
            'Master password updated & all old sessions locked! Redirecting to login gate...'
        );
        setHasCustomPassword(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowCurrentPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);

        // Immediately redirect to login gate so founder verifies & signs in with the new password
        setTimeout(() => {
          window.location.href = '/adminusman/login?passwordChanged=1';
        }, 1200);
      } else {
        setPasswordError(data.error || 'Failed to update password. Please verify your current password.');
      }
    } catch (err: any) {
      setPasswordError(err.message || 'Network error while updating password.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'General & Identity', icon: Store },
    { id: 'theme', label: 'Homepage Customizer', icon: Palette },
    { id: 'shipping', label: 'Shipping & Delivery', icon: Truck },
    { id: 'payments', label: 'Payment Gateways', icon: CreditCard },
    { id: 'social', label: 'Social Channels', icon: Share2 },
    { id: 'discounts', label: 'Discounts & Coupons', icon: Tag },
    { id: 'policies', label: 'Store Policies & Content', icon: FileText },
    { id: 'pixels', label: 'Pixels & Tracking', icon: Activity },
    { id: 'security', label: 'Security & Password', icon: Shield },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Top Save & Status Bar */}
      <div className="bg-white border border-neutral-200 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs sticky top-16 z-30">
        <div className="flex items-center space-x-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-black">
            Enterprise Control Center
          </span>
          {savedFeedback && (
            <span className="text-xs font-semibold text-emerald-700 animate-in fade-in flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{savedFeedback}</span>
            </span>
          )}
          {errorMessage && (
            <span className="text-xs font-semibold text-red-600 animate-in fade-in flex items-center space-x-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errorMessage}</span>
            </span>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {activeTab === 'security' ? (
            <span className="px-3 py-1.5 bg-neutral-100 border border-neutral-200 text-neutral-700 text-[11px] font-bold uppercase tracking-wider flex items-center space-x-1.5">
              <Shield className="w-3.5 h-3.5 text-black" />
              <span>Security Tab Active — Use Update Password Below</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => handleSaveStore()}
              disabled={isSaving}
              className="px-6 py-2 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-neutral-800 disabled:bg-neutral-400 transition-colors shadow-sm cursor-pointer"
            >
              {isSaving ? 'Synchronizing...' : 'Save All Settings'}
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-neutral-200 overflow-x-auto space-x-1 bg-white p-1.5 shadow-xs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors rounded-xs ${
                isActive
                  ? 'bg-black text-white shadow-xs'
                  : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.id === 'discounts' && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-neutral-800 text-white' : 'bg-neutral-200 text-black'
                  }`}
                >
                  {discounts.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Tab Panels */}
      <div className="bg-white border border-neutral-200 p-6 sm:p-8 shadow-xs">
        {/* TAB 1: GENERAL & IDENTITY */}
        {activeTab === 'general' && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-black">
                Store Identity & Support Details
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Manage your store branding, official company name, and buyer support channels.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                  Store Display Name
                </label>
                <input
                  type="text"
                  value={store.name}
                  onChange={(e) => setStore({ ...store, name: e.target.value })}
                  className="w-full p-2.5 border border-neutral-300 focus:outline-none focus:border-black text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                  Navbar Logo Typography Text
                </label>
                <input
                  type="text"
                  value={store.logoText}
                  onChange={(e) => setStore({ ...store, logoText: e.target.value })}
                  className="w-full p-2.5 border border-neutral-300 focus:outline-none focus:border-black text-xs font-mono font-bold tracking-[0.2em]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                  Official Legal Entity Name
                </label>
                <input
                  type="text"
                  value={store.legalName}
                  onChange={(e) => setStore({ ...store, legalName: e.target.value })}
                  className="w-full p-2.5 border border-neutral-300 focus:outline-none focus:border-black text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                  Customer Support Email
                </label>
                <input
                  type="email"
                  value={store.supportEmail}
                  onChange={(e) => setStore({ ...store, supportEmail: e.target.value })}
                  className="w-full p-2.5 border border-neutral-300 focus:outline-none focus:border-black text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                  Support Phone / WhatsApp
                </label>
                <input
                  type="text"
                  value={store.supportPhone}
                  onChange={(e) => setStore({ ...store, supportPhone: e.target.value })}
                  className="w-full p-2.5 border border-neutral-300 focus:outline-none focus:border-black text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                  Warehouse Hub / Fulfillment City
                </label>
                <input
                  type="text"
                  value={store.supportCity}
                  onChange={(e) => setStore({ ...store, supportCity: e.target.value })}
                  className="w-full p-2.5 border border-neutral-300 focus:outline-none focus:border-black text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                  Studio / Dispatch Address
                </label>
                <input
                  type="text"
                  value={store.contactAddress}
                  onChange={(e) => setStore({ ...store, contactAddress: e.target.value })}
                  className="w-full p-2.5 border border-neutral-300 focus:outline-none focus:border-black text-xs"
                />
              </div>
            </div>

            {/* Save General Settings Button */}
            <div className="pt-6 border-t border-neutral-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <p className="text-xs text-neutral-500">
                Update store identity, brand names, and primary support contact channels.
              </p>
              <button
                type="button"
                onClick={() => handleSaveStore()}
                disabled={isSaving}
                className="w-full sm:w-auto px-6 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 disabled:bg-neutral-400 transition-colors cursor-pointer rounded-xs shadow-xs"
              >
                {isSaving ? 'Saving...' : 'Save General Settings'}
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: HOMEPAGE & THEME CUSTOMIZER */}
        {activeTab === 'theme' && (
          <div className="space-y-8 max-w-4xl">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-black">
                Shopify Theme Sections & Content Customizer
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Every section of the storefront is completely dynamic and controlled from this panel.
              </p>
            </div>

            {/* 1. Announcement Marquee */}
            <div className="p-5 border border-neutral-200 bg-neutral-50/60 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-black">
                    Announcement Marquee Bar
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    Displays top scrolling announcement ticker across all storefront pages.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={store.enableAnnouncement}
                    onChange={(e) =>
                      setStore({ ...store, enableAnnouncement: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                  <span className="ml-2 text-[11px] font-bold uppercase text-black">
                    {store.enableAnnouncement ? 'Visible' : 'Hidden'}
                  </span>
                </label>
              </div>

              <div>
                <input
                  type="text"
                  value={store.announcement}
                  onChange={(e) => setStore({ ...store, announcement: e.target.value })}
                  disabled={!store.enableAnnouncement}
                  className="w-full p-2.5 border border-neutral-300 focus:outline-none focus:border-black text-xs bg-white disabled:bg-neutral-100 disabled:text-neutral-400"
                />
              </div>
            </div>

            {/* 2. Hero Section */}
            <div className="p-5 border border-neutral-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-black">
                  Hero Banner Controls
                </h3>
                <span className="text-[10px] uppercase font-mono font-bold bg-neutral-100 text-neutral-700 px-2 py-0.5 border border-neutral-200">
                  Widescreen 16:9 / 21:9
                </span>
              </div>

              {/* PRO IMAGE DIMENSION & QUALITY GUIDELINES */}
              <div className="p-4 bg-neutral-50 border border-neutral-300 text-xs space-y-2">
                <div className="flex items-center space-x-2 text-black font-bold uppercase tracking-wider text-[11px]">
                  <ImageDown className="w-4 h-4 text-black" />
                  <span>Pro Image Dimension & Quality Instructions</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] text-neutral-600 pt-1">
                  <div className="p-2.5 bg-white border border-neutral-200">
                    <strong className="block text-black uppercase text-[10px] tracking-wider mb-0.5">
                      📐 Resolution
                    </strong>
                    <span><strong>1920 × 1080 px</strong> (16:9) or <strong>2000 × 1200 px</strong> (16:10). Minimum 1440px wide.</span>
                  </div>
                  <div className="p-2.5 bg-white border border-neutral-200">
                    <strong className="block text-black uppercase text-[10px] tracking-wider mb-0.5">
                      ⚡ File Weight
                    </strong>
                    <span><strong>Under 2.5 MB</strong> in <code>.webp</code>, <code>.png</code>, or compressed <code>.jpg</code> for instant 4G load.</span>
                  </div>
                  <div className="p-2.5 bg-white border border-neutral-200">
                    <strong className="block text-black uppercase text-[10px] tracking-wider mb-0.5">
                      📱 Mobile Safe Area
                    </strong>
                    <span>Keep blade product centered in the <strong>middle 60%</strong> of the canvas to prevent mobile vertical cropping.</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-black">
                        Hero Background Image URL / Path
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setStore({ ...store, heroImageUrl: '/images/hero-banner.png' });
                          setImageVerifyStatus('valid');
                        }}
                        className="text-[10px] text-neutral-600 hover:text-black font-semibold underline underline-offset-2 cursor-pointer"
                      >
                        Load Official Drop 001 Banner
                      </button>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={store.heroImageUrl}
                        onChange={(e) => {
                          setStore({ ...store, heroImageUrl: e.target.value });
                          setImageVerifyStatus('idle');
                        }}
                        placeholder="e.g. /images/hero-banner.png or https://..."
                        className="w-full p-2.5 border border-neutral-300 focus:outline-none focus:border-black text-xs font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => handleVerifyImageUrl(store.heroImageUrl)}
                        className="px-3 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-black text-xs font-bold uppercase tracking-wider whitespace-nowrap border border-neutral-300 cursor-pointer"
                      >
                        Verify Link
                      </button>
                    </div>

                    {/* Direct Device Upload Action */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2">
                      <button
                        type="button"
                        disabled={isUploadingBanner}
                        onClick={() => bannerFileInputRef.current?.click()}
                        className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider rounded-xs cursor-pointer shadow-xs disabled:opacity-50 transition-colors"
                      >
                        {isUploadingBanner ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Inspecting & Uploading...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5" />
                            <span>Upload Banner from Device (PC / Mobile)</span>
                          </>
                        )}
                      </button>
                      <input
                        ref={bannerFileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        className="hidden"
                        onChange={handleBannerFileSelect}
                      />
                      <span className="text-[10px] text-neutral-500 font-light text-center sm:text-left">
                        Auto-validated for 1440px+ width, 16:9 ratio, and &lt;3MB size
                      </span>
                    </div>

                    {/* Banner Dimension & Format Error Alert */}
                    {bannerUploadError && (
                      <div className="mt-2 p-3 bg-red-50 border-2 border-red-500 text-red-900 rounded-xs flex items-start space-x-2.5 text-xs animate-in fade-in">
                        <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <span className="font-black uppercase tracking-wider block text-[11px] text-red-700">
                            Banner Unfit: Dimension / Format Rule Violated
                          </span>
                          <p className="font-medium text-neutral-800 leading-relaxed text-[11px]">
                            {bannerUploadError}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Image Verification Feedback */}
                    {imageVerifyStatus === 'checking' && (
                      <p className="text-[10px] text-neutral-500 mt-1 flex items-center space-x-1">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>Pinging image URL...</span>
                      </p>
                    )}
                    {imageVerifyStatus === 'valid' && (
                      <p className="text-[10px] text-emerald-700 font-semibold mt-1 flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Reachable: Image loaded successfully (200 OK).</span>
                      </p>
                    )}
                    {imageVerifyStatus === 'invalid' && (
                      <p className="text-[10px] text-red-600 font-semibold mt-1 flex items-center space-x-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                        <span>Warning: Image failed to load. Check for 404 or broken URL.</span>
                      </p>
                    )}

                    {/* Live Hero Banner Thumbnail Preview */}
                    {store.heroImageUrl && (
                      <div className="mt-2.5 p-2.5 border border-neutral-200 bg-white flex items-center space-x-3.5 rounded-xs">
                        <div className="relative w-24 h-14 bg-neutral-900 border border-neutral-300 flex-shrink-0 overflow-hidden shadow-xs">
                          <img
                            src={store.heroImageUrl}
                            alt="Hero Banner Preview"
                            className="w-full h-full object-cover object-center"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="40" viewBox="0 0 24 24" fill="none" stroke="%23999" stroke-width="1"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                            }}
                          />
                        </div>
                        <div className="text-[10px] text-neutral-600">
                          <span className="font-bold text-black uppercase tracking-wider block text-[11px]">
                            Live Hero Banner Preview
                          </span>
                          Active background image currently rendered on the storefront hero section.
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                        Hero Badge Tag
                      </label>
                      <input
                        type="text"
                        value={store.heroTag}
                        onChange={(e) => setStore({ ...store, heroTag: e.target.value })}
                        className="w-full p-2.5 border border-neutral-300 focus:outline-none focus:border-black text-xs font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                        Hero Main Headline
                      </label>
                      <input
                        type="text"
                        value={store.heroTitle}
                        onChange={(e) => setStore({ ...store, heroTitle: e.target.value })}
                        className="w-full p-2.5 border border-neutral-300 focus:outline-none focus:border-black text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                      Hero Description Subtext
                    </label>
                    <textarea
                      rows={2}
                      value={store.heroDescription}
                      onChange={(e) => setStore({ ...store, heroDescription: e.target.value })}
                      className="w-full p-2.5 border border-neutral-300 focus:outline-none focus:border-black text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                        Button Label
                      </label>
                      <input
                        type="text"
                        value={store.heroCtaText}
                        onChange={(e) => setStore({ ...store, heroCtaText: e.target.value })}
                        className="w-full p-2.5 border border-neutral-300 focus:outline-none focus:border-black text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                        Button Link
                      </label>
                      <input
                        type="text"
                        value={store.heroCtaLink}
                        onChange={(e) => setStore({ ...store, heroCtaLink: e.target.value })}
                        className="w-full p-2.5 border border-neutral-300 focus:outline-none focus:border-black text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Live Image Preview Thumbnail */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-black">
                    Live Banner Preview
                  </label>
                  <div className="relative aspect-4/3 w-full bg-neutral-900 overflow-hidden border border-neutral-300 shadow-inner group">
                    {store.heroImageUrl ? (
                      <Image
                        src={store.heroImageUrl}
                        alt="Hero preview"
                        fill
                        unoptimized
                        className="object-cover object-center"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-neutral-400 text-xs">
                        No image specified
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex flex-col justify-end p-3 text-white">
                      <span className="text-[9px] font-semibold tracking-widest uppercase bg-white/20 px-1.5 py-0.5 w-fit">
                        {store.heroTag}
                      </span>
                      <span className="text-xs font-extrabold uppercase mt-1">
                        {store.heroTitle}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Value Propositions (Trust Badges) */}
            <div className="p-5 border border-neutral-200 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-black">
                Value Propositions (3 Trust Badges Bar)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                    Badge 1 (Shipping)
                  </label>
                  <input
                    type="text"
                    value={store.valueProp1}
                    onChange={(e) => setStore({ ...store, valueProp1: e.target.value })}
                    className="w-full p-2 border border-neutral-300 focus:outline-none focus:border-black text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                    Badge 2 (Payment Guarantee)
                  </label>
                  <input
                    type="text"
                    value={store.valueProp2}
                    onChange={(e) => setStore({ ...store, valueProp2: e.target.value })}
                    className="w-full p-2 border border-neutral-300 focus:outline-none focus:border-black text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                    Badge 3 (Exchanges)
                  </label>
                  <input
                    type="text"
                    value={store.valueProp3}
                    onChange={(e) => setStore({ ...store, valueProp3: e.target.value })}
                    className="w-full p-2 border border-neutral-300 focus:outline-none focus:border-black text-xs"
                  />
                </div>
              </div>
            </div>

            {/* 4. Catalog Heading */}
            <div className="p-5 border border-neutral-200 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-black">
                Blades Catalog Section Header
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                    Catalog Title (Supports Italic Markup)
                  </label>
                  <input
                    type="text"
                    value={store.catalogTitle}
                    onChange={(e) => setStore({ ...store, catalogTitle: e.target.value })}
                    className="w-full p-2.5 border border-neutral-300 focus:outline-none focus:border-black text-xs font-serif italic"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                    Catalog Subtitle
                  </label>
                  <input
                    type="text"
                    value={store.catalogSubtitle}
                    onChange={(e) => setStore({ ...store, catalogSubtitle: e.target.value })}
                    className="w-full p-2.5 border border-neutral-300 focus:outline-none focus:border-black text-xs font-light"
                  />
                </div>
              </div>
            </div>

            {/* 5. VIP Community Section */}
            <div className="p-5 border border-neutral-200 bg-neutral-900 text-white space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                VIP WhatsApp Community Banner
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-1">
                    Community Headline
                  </label>
                  <input
                    type="text"
                    value={store.communityTitle}
                    onChange={(e) => setStore({ ...store, communityTitle: e.target.value })}
                    className="w-full p-2.5 border border-neutral-700 bg-neutral-800 text-white focus:outline-none focus:border-white text-xs font-serif italic"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-1">
                    Button Label
                  </label>
                  <input
                    type="text"
                    value={store.communityCtaText}
                    onChange={(e) => setStore({ ...store, communityCtaText: e.target.value })}
                    className="w-full p-2.5 border border-neutral-700 bg-neutral-800 text-white focus:outline-none focus:border-white text-xs uppercase font-bold"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-1">
                    Subtext Description
                  </label>
                  <input
                    type="text"
                    value={store.communitySubtitle}
                    onChange={(e) => setStore({ ...store, communitySubtitle: e.target.value })}
                    className="w-full p-2.5 border border-neutral-700 bg-neutral-800 text-white focus:outline-none focus:border-white text-xs font-light"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-1">
                    Official WhatsApp Channel / Group Invite Link
                  </label>
                  <input
                    type="text"
                    value={store.communityLink}
                    onChange={(e) => setStore({ ...store, communityLink: e.target.value })}
                    className="w-full p-2.5 border border-neutral-700 bg-neutral-800 text-white focus:outline-none focus:border-white text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Save Theme Settings Button */}
            <div className="pt-6 border-t border-neutral-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <p className="text-xs text-neutral-500">
                Persist hero banner, headlines, announcement text, and value propositions.
              </p>
              <button
                type="button"
                onClick={() => handleSaveStore()}
                disabled={isSaving}
                className="w-full sm:w-auto px-6 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 disabled:bg-neutral-400 transition-colors cursor-pointer rounded-xs shadow-xs"
              >
                {isSaving ? 'Saving...' : 'Save Theme & Banner Settings'}
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: SHIPPING & LOGISTICS */}
        {activeTab === 'shipping' && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-black">
                Shipping Rates & Logistics
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Configure nationwide courier charges, free delivery qualification cutoff, and delivery turnaround.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                  Standard Courier Delivery Fee (PKR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-neutral-400 font-bold">
                    Rs.
                  </span>
                  <input
                    type="number"
                    value={store.shippingFee}
                    onChange={(e) =>
                      setStore({ ...store, shippingFee: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full p-2.5 pl-10 border border-neutral-300 focus:outline-none focus:border-black text-xs font-semibold"
                  />
                </div>
                <p className="text-[11px] text-neutral-400 mt-1">
                  Applied automatically at checkout for orders under the threshold.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                  Free Shipping Threshold (PKR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-neutral-400 font-bold">
                    Rs.
                  </span>
                  <input
                    type="number"
                    value={store.freeShippingThreshold}
                    onChange={(e) =>
                      setStore({
                        ...store,
                        freeShippingThreshold: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full p-2.5 pl-10 border border-neutral-300 focus:outline-none focus:border-black text-xs font-semibold"
                  />
                </div>
                <p className="text-[11px] text-neutral-400 mt-1">
                  Calculates live in the cart drawer progress bar and waives courier fee.
                </p>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                  Estimated Delivery Turnaround
                </label>
                <input
                  type="text"
                  value={store.estimatedDeliveryDays}
                  onChange={(e) =>
                    setStore({ ...store, estimatedDeliveryDays: e.target.value })
                  }
                  className="w-full p-2.5 border border-neutral-300 focus:outline-none focus:border-black text-xs"
                />
              </div>
            </div>

            {/* Save Shipping Settings Button */}
            <div className="pt-6 border-t border-neutral-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <p className="text-xs text-neutral-500">
                Persist courier delivery rates, free shipping cutoff, and transit times.
              </p>
              <button
                type="button"
                onClick={() => handleSaveStore()}
                disabled={isSaving}
                className="w-full sm:w-auto px-6 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 disabled:bg-neutral-400 transition-colors cursor-pointer rounded-xs shadow-xs"
              >
                {isSaving ? 'Saving...' : 'Save Shipping Settings'}
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: PAYMENT GATEWAYS */}
        {activeTab === 'payments' && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-black">
                Payment Gateways & Checkout Control
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Configure Cash on Delivery, Direct Bank Transfer (Raast / IBAN), and Card Gateways.
              </p>
            </div>

            <div className="space-y-6 pt-2">
              {/* 1. Cash on Delivery (COD) */}
              <div className="p-5 border border-neutral-200 bg-white space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-black">
                      1. Cash On Delivery (COD) Nationwide
                    </h3>
                    <p className="text-[11px] text-neutral-500">
                      Buyers pay courier cash upon doorstep arrival. The primary payment method in Pakistan.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={store.enableCod}
                      onChange={(e) => setStore({ ...store, enableCod: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    <span className="ml-2 text-[11px] font-bold uppercase text-black">
                      {store.enableCod ? 'Active' : 'Disabled'}
                    </span>
                  </label>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                    Custom COD Instructions Note on Checkout Screen
                  </label>
                  <textarea
                    rows={2}
                    value={store.codNotice}
                    onChange={(e) => setStore({ ...store, codNotice: e.target.value })}
                    className="w-full p-2.5 border border-neutral-300 focus:outline-none focus:border-black text-xs"
                  />
                </div>
              </div>

              {/* 2. Direct Bank Transfer / Raast / IBAN */}
              <div className="p-5 border border-neutral-200 bg-white space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-black" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-black">
                        2. Direct Bank Transfer / Raast / IBAN
                      </h3>
                    </div>
                    <p className="text-[11px] text-neutral-500">
                      Display your official bank account details on checkout so customers can transfer directly via mobile banking or Raast.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={store.enableBankTransfer}
                      onChange={(e) =>
                        setStore({ ...store, enableBankTransfer: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    <span className="ml-2 text-[11px] font-bold uppercase text-black">
                      {store.enableBankTransfer ? 'Active' : 'Disabled'}
                    </span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Meezan Bank Ltd"
                      value={store.bankName}
                      onChange={(e) => setStore({ ...store, bankName: e.target.value })}
                      className="w-full p-2.5 border border-neutral-300 focus:outline-none focus:border-black text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                      Account Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. PAIRS KNIFE & SWORD CO."
                      value={store.bankAccountTitle}
                      onChange={(e) =>
                        setStore({ ...store, bankAccountTitle: e.target.value })
                      }
                      className="w-full p-2.5 border border-neutral-300 focus:outline-none focus:border-black text-xs uppercase font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                      Account Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 01020304050607"
                      value={store.bankAccountNumber}
                      onChange={(e) =>
                        setStore({ ...store, bankAccountNumber: e.target.value })
                      }
                      className="w-full p-2.5 border border-neutral-300 focus:outline-none focus:border-black text-xs font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                      IBAN (24-Digit International Account Number)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. PK36MEZN0001020304050607"
                      value={store.bankIban}
                      onChange={(e) =>
                        setStore({ ...store, bankIban: e.target.value.toUpperCase() })
                      }
                      className="w-full p-2.5 border border-neutral-300 focus:outline-none focus:border-black text-xs font-mono font-bold uppercase"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                      Branch Name / Code
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Main Boulevard Branch, Gujranwala (Code: 0102)"
                      value={store.bankBranch}
                      onChange={(e) => setStore({ ...store, bankBranch: e.target.value })}
                      className="w-full p-2.5 border border-neutral-300 focus:outline-none focus:border-black text-xs"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                      Buyer Payment Instructions (Shown on Checkout & Order Success)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Please transfer total amount via Raast / Online Banking and WhatsApp receipt with Order # to +92 300 1234567"
                      value={store.bankInstructions}
                      onChange={(e) =>
                        setStore({ ...store, bankInstructions: e.target.value })
                      }
                      className="w-full p-2.5 border border-neutral-300 focus:outline-none focus:border-black text-xs"
                    />
                  </div>

                  {/* Live Bank Preview Card for Checkout Simulation */}
                  <div className="sm:col-span-2 pt-3 border-t border-neutral-200">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block mb-2">
                      Customer Checkout Simulation (Real-Time Preview):
                    </span>
                    <div className="bg-amber-50/70 border border-amber-200 p-4 space-y-2 text-xs rounded-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Building2 className="w-4 h-4 text-amber-800" />
                          <span className="font-extrabold uppercase tracking-wider text-amber-950 text-[11px]">
                            Direct Bank Transfer Instructions
                          </span>
                        </div>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-amber-200/70 text-amber-900 rounded">
                          Buyer Screen
                        </span>
                      </div>
                      <div className="bg-white p-3 border border-amber-200/80 font-mono text-[11px] space-y-1 text-black">
                        <div className="flex justify-between py-0.5 border-b border-neutral-100">
                          <span className="text-neutral-500 font-sans">Bank:</span>
                          <span className="font-bold">{store.bankName || 'Meezan Bank Ltd'}</span>
                        </div>
                        <div className="flex justify-between py-0.5 border-b border-neutral-100">
                          <span className="text-neutral-500 font-sans">Title:</span>
                          <span className="font-bold">{store.bankAccountTitle || 'PAIRS KNIFE & SWORD CO.'}</span>
                        </div>
                        <div className="flex justify-between py-0.5 border-b border-neutral-100">
                          <span className="text-neutral-500 font-sans">Account #:</span>
                          <span className="font-bold">{store.bankAccountNumber || '01020304050607'}</span>
                        </div>
                        <div className="flex justify-between py-0.5 border-b border-neutral-100">
                          <span className="text-neutral-500 font-sans">IBAN (Raast):</span>
                          <span className="font-bold">{store.bankIban || 'PK36MEZN0001020304050607'}</span>
                        </div>
                        {store.bankBranch && (
                          <div className="flex justify-between py-0.5 border-b border-neutral-100">
                            <span className="text-neutral-500 font-sans">Branch:</span>
                            <span>{store.bankBranch}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-600 font-light italic">
                        "{store.bankInstructions || 'Please transfer total amount via Raast / Online Banking and WhatsApp receipt with Order #.'}"
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Credit / Debit Card (Visa / Mastercard) */}
              <div className="p-5 border border-neutral-200 bg-white space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <CreditCard className="w-4 h-4 text-black" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-black">
                        3. Credit / Debit Card (Visa / Mastercard)
                      </h3>
                    </div>
                    <p className="text-[11px] text-neutral-500">
                      Enable online card payments with 3D Secure authentication.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={store.enableCard}
                      onChange={(e) => setStore({ ...store, enableCard: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    <span className="ml-2 text-[11px] font-bold uppercase text-black">
                      {store.enableCard ? 'Active' : 'Disabled'}
                    </span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                      Gateway Display Name
                    </label>
                    <input
                      type="text"
                      value={store.cardGatewayName}
                      onChange={(e) =>
                        setStore({ ...store, cardGatewayName: e.target.value })
                      }
                      className="w-full p-2.5 border border-neutral-300 focus:outline-none focus:border-black text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                      Gateway Mode
                    </label>
                    <select
                      value={store.cardMode}
                      onChange={(e) => setStore({ ...store, cardMode: e.target.value })}
                      className="w-full p-2.5 border border-neutral-300 focus:outline-none focus:border-black text-xs font-bold uppercase"
                    >
                      <option value="SANDBOX">Sandbox / Demo Mode (Test Cards)</option>
                      <option value="LIVE">Live Production Mode</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                      Card Checkout Note
                    </label>
                    <textarea
                      rows={2}
                      value={store.cardInstructions}
                      onChange={(e) =>
                        setStore({ ...store, cardInstructions: e.target.value })
                      }
                      className="w-full p-2.5 border border-neutral-300 focus:outline-none focus:border-black text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Save Payment Gateways Button */}
            <div className="pt-6 border-t border-neutral-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <p className="text-xs text-neutral-500">
                Persist Cash on Delivery, Raast / Bank account instructions, and Card settings.
              </p>
              <button
                type="button"
                onClick={() => handleSaveStore()}
                disabled={isSaving}
                className="w-full sm:w-auto px-6 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 disabled:bg-neutral-400 transition-colors cursor-pointer rounded-xs shadow-xs"
              >
                {isSaving ? 'Saving...' : 'Save Payment Settings'}
              </button>
            </div>
          </div>
        )}

        {/* TAB 5: SOCIAL CHANNELS */}
        {activeTab === 'social' && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-black">
                Official Social Media Channels
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                These URLs automatically power the navigation and footer links across the site.
              </p>
            </div>

            {/* Social Channels Master Visibility Toggle */}
            <div className="p-4 border border-neutral-200 bg-white flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-black">
                  Display Social Channels on Storefront
                </h3>
                <p className="text-[11px] text-neutral-500">
                  Toggle off or on to control whether Instagram, TikTok, and YouTube links are displayed in the footer and community sections across the website.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={store.enableSocialLinks}
                  onChange={(e) => setStore({ ...store, enableSocialLinks: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                <span className="ml-2 text-[11px] font-bold uppercase text-black">
                  {store.enableSocialLinks ? 'Active' : 'Hidden'}
                </span>
              </label>
            </div>

            <div className="space-y-4 pt-2">
              {/* Instagram Card */}
              <div className="p-4 border border-neutral-200 bg-white space-y-3 rounded-xs">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-xs uppercase tracking-wider text-black">
                      Instagram Channel
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                        store.enableInstagram
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-neutral-100 text-neutral-500'
                      }`}
                    >
                      {store.enableInstagram ? 'Active' : 'Hidden'}
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={store.enableInstagram}
                      onChange={(e) =>
                        setStore({ ...store, enableInstagram: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                    Instagram Profile URL
                  </label>
                  <input
                    type="text"
                    placeholder="https://instagram.com/yourbrand"
                    value={store.instagramUrl}
                    onChange={(e) =>
                      setStore({ ...store, instagramUrl: e.target.value })
                    }
                    className="w-full p-2.5 border border-neutral-300 focus:outline-none focus:border-black text-xs font-mono"
                  />
                </div>
              </div>

              {/* TikTok Card */}
              <div className="p-4 border border-neutral-200 bg-white space-y-3 rounded-xs">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-xs uppercase tracking-wider text-black">
                      TikTok Channel
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                        store.enableTiktok
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-neutral-100 text-neutral-500'
                      }`}
                    >
                      {store.enableTiktok ? 'Active' : 'Hidden'}
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={store.enableTiktok}
                      onChange={(e) =>
                        setStore({ ...store, enableTiktok: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                    TikTok Profile URL
                  </label>
                  <input
                    type="text"
                    placeholder="https://tiktok.com/@yourbrand"
                    value={store.tiktokUrl}
                    onChange={(e) =>
                      setStore({ ...store, tiktokUrl: e.target.value })
                    }
                    className="w-full p-2.5 border border-neutral-300 focus:outline-none focus:border-black text-xs font-mono"
                  />
                </div>
              </div>

              {/* YouTube Card */}
              <div className="p-4 border border-neutral-200 bg-white space-y-3 rounded-xs">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-xs uppercase tracking-wider text-black">
                      YouTube Channel
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                        store.enableYoutube
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-neutral-100 text-neutral-500'
                      }`}
                    >
                      {store.enableYoutube ? 'Active' : 'Hidden'}
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={store.enableYoutube}
                      onChange={(e) =>
                        setStore({ ...store, enableYoutube: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                    YouTube Channel URL
                  </label>
                  <input
                    type="text"
                    placeholder="https://youtube.com/@yourbrand"
                    value={store.youtubeUrl}
                    onChange={(e) =>
                      setStore({ ...store, youtubeUrl: e.target.value })
                    }
                    className="w-full p-2.5 border border-neutral-300 focus:outline-none focus:border-black text-xs font-mono"
                  />
                </div>
              </div>

              {/* WhatsApp Customer Care (Dual Toggles) */}
              <div className="p-4 border border-neutral-200 bg-white space-y-4 rounded-xs">
                <div className="pb-2 border-b border-neutral-100 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-xs uppercase tracking-wider text-black">
                      WhatsApp Support & Customer Widget
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    Dual Controls
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-neutral-50 border border-neutral-200">
                  {/* Toggle 1: Footer WhatsApp Icon */}
                  <div className="flex items-center justify-between p-2 bg-white border border-neutral-200">
                    <div>
                      <span className="text-[11px] font-bold text-black uppercase block">
                        Footer WhatsApp Icon
                      </span>
                      <span className="text-[9px] text-neutral-400">
                        Shows in storefront footer
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={store.enableWhatsApp}
                        onChange={(e) =>
                          setStore({ ...store, enableWhatsApp: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-9 h-4.5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  {/* Toggle 2: Floating WhatsApp Button */}
                  <div className="flex items-center justify-between p-2 bg-white border border-neutral-200">
                    <div>
                      <span className="text-[11px] font-bold text-black uppercase block">
                        Floating WhatsApp Button
                      </span>
                      <span className="text-[9px] text-neutral-400">
                        Bottom-right floating chat
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={store.enableFloatingWhatsApp}
                        onChange={(e) =>
                          setStore({
                            ...store,
                            enableFloatingWhatsApp: e.target.checked,
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-9 h-4.5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                      WhatsApp Phone Number
                    </label>
                    <input
                      type="text"
                      placeholder="+92 300 1234567"
                      value={store.whatsappNumber}
                      onChange={(e) =>
                        setStore({ ...store, whatsappNumber: e.target.value })
                      }
                      className="w-full p-2.5 border border-neutral-300 focus:outline-none focus:border-black text-xs font-mono font-bold"
                    />
                    <p className="text-[10px] text-neutral-400 mt-1">
                      Auto-sanitized to international format on click.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                      Default Customer Greeting Message
                    </label>
                    <input
                      type="text"
                      placeholder="Hi Pairs Cutlery, I would like to inquire about..."
                      value={store.whatsappDefaultMsg}
                      onChange={(e) =>
                        setStore({ ...store, whatsappDefaultMsg: e.target.value })
                      }
                      className="w-full p-2.5 border border-neutral-300 focus:outline-none focus:border-black text-xs"
                    />
                    <p className="text-[10px] text-neutral-400 mt-1">
                      Pre-filled when the customer opens WhatsApp.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Social Channels Button */}
            <div className="pt-6 border-t border-neutral-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <p className="text-xs text-neutral-500">
                Persist social toggles, channel profile links, and customer support WhatsApp.
              </p>
              <button
                type="button"
                onClick={() => handleSaveStore()}
                disabled={isSaving}
                className="w-full sm:w-auto px-6 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 disabled:bg-neutral-400 transition-colors cursor-pointer rounded-xs shadow-xs"
              >
                {isSaving ? 'Saving...' : 'Save Social Settings'}
              </button>
            </div>
          </div>
        )}

        {/* TAB 6: DISCOUNTS & COUPONS */}
        {activeTab === 'discounts' && (
          <div className="space-y-8 max-w-4xl">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-black">
                Promotional Discounts & Coupon Engine
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Create promotional discount codes that validate dynamically in the customer checkout.
              </p>
            </div>

            {/* Create New Coupon Form */}
            <form
              onSubmit={handleCreateDiscount}
              className="p-5 border border-neutral-200 bg-neutral-50/70 space-y-4"
            >
              <h3 className="text-xs font-bold uppercase tracking-wider text-black flex items-center space-x-1.5">
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Coupon</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-neutral-600 mb-1">
                    Coupon Code
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DROP002"
                    value={newDiscount.code}
                    onChange={(e) =>
                      setNewDiscount({ ...newDiscount, code: e.target.value.toUpperCase() })
                    }
                    className="w-full p-2 border border-neutral-300 focus:outline-none focus:border-black text-xs uppercase font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-neutral-600 mb-1">
                    Discount Type
                  </label>
                  <select
                    value={newDiscount.type}
                    onChange={(e) =>
                      setNewDiscount({ ...newDiscount, type: e.target.value })
                    }
                    className="w-full p-2 border border-neutral-300 focus:outline-none focus:border-black text-xs"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount (PKR)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-neutral-600 mb-1">
                    Value {newDiscount.type === 'PERCENTAGE' ? '(%)' : '(PKR)'}
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newDiscount.value}
                    onChange={(e) =>
                      setNewDiscount({ ...newDiscount, value: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full p-2 border border-neutral-300 focus:outline-none focus:border-black text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-neutral-600 mb-1">
                    Min Subtotal (PKR)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newDiscount.minSubtotal}
                    onChange={(e) =>
                      setNewDiscount({
                        ...newDiscount,
                        minSubtotal: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full p-2 border border-neutral-300 focus:outline-none focus:border-black text-xs font-medium"
                  />
                </div>
              </div>

              {couponError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{couponError}</span>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingDiscount}
                  className="px-5 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 disabled:bg-neutral-400 transition-colors cursor-pointer flex items-center space-x-2"
                >
                  {isSubmittingDiscount ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Add Promo Code</span>
                  )}
                </button>
              </div>
            </form>

            {/* Existing Coupons Table */}
            <div className="border border-neutral-200 overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-neutral-100/70 border-b border-neutral-200 text-neutral-600 uppercase tracking-wider font-bold text-[10px]">
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-4">Discount</th>
                    <th className="py-3 px-4">Min. Subtotal</th>
                    <th className="py-3 px-4">Times Used</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {discounts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-neutral-400">
                        No promotional discounts created yet.
                      </td>
                    </tr>
                  ) : (
                    discounts.map((d) => (
                      <tr key={d.id} className="hover:bg-neutral-50/50">
                        <td className="py-3 px-4 font-mono font-bold text-black text-xs">
                          {d.code}
                        </td>
                        <td className="py-3 px-4 font-medium text-neutral-800">
                          {d.type === 'PERCENTAGE' ? `${d.value}% OFF` : `Rs. ${d.value} OFF`}
                        </td>
                        <td className="py-3 px-4 text-neutral-600">
                          {d.minSubtotal > 0 ? `Rs. ${d.minSubtotal.toLocaleString()}` : 'None'}
                        </td>
                        <td className="py-3 px-4 font-mono text-neutral-500">
                          {d.usageCount || 0}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => handleToggleDiscount(d.id, d.status)}
                            className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded cursor-pointer transition-colors ${
                              d.status === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-neutral-200 text-neutral-600 hover:bg-neutral-300'
                            }`}
                          >
                            {d.status}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteDiscountId(d.id)}
                            className="p-1 text-neutral-400 hover:text-red-600 transition-colors cursor-pointer"
                            title="Delete coupon"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 7: STORE POLICIES & CONTENT */}
        {activeTab === 'policies' && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-black">
                Store Policies & Legal Pages
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Customize legal, exchange, shipping, and privacy policies displayed to buyers. If left empty, default store policies will be used.
              </p>
            </div>

            <div className="space-y-6 pt-2">
              {/* Refund Policy */}
              <div className="p-5 border border-neutral-200 bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-black">
                    Refund & Exchange Policy
                  </h3>
                  <a
                    href="/policies/refund-policy"
                    target="_blank"
                    className="text-[11px] text-neutral-400 hover:text-black flex items-center space-x-1"
                  >
                    <span>View Live</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-[11px] text-neutral-500">
                  Visible on <code>/policies/refund-policy</code> and during checkout guarantees.
                </p>
                <textarea
                  rows={5}
                  value={store.policyRefund}
                  placeholder="Enter your custom return & exchange policy (separate paragraphs with blank lines)..."
                  onChange={(e) => setStore({ ...store, policyRefund: e.target.value })}
                  className="w-full p-3 border border-neutral-300 focus:outline-none focus:border-black text-xs font-sans leading-relaxed"
                />
              </div>

              {/* Shipping Policy */}
              <div className="p-5 border border-neutral-200 bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-black">
                    Shipping & Courier Policy
                  </h3>
                  <a
                    href="/policies/shipping-policy"
                    target="_blank"
                    className="text-[11px] text-neutral-400 hover:text-black flex items-center space-x-1"
                  >
                    <span>View Live</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-[11px] text-neutral-500">
                  Visible on <code>/policies/shipping-policy</code>. Detail courier tracking, dispatch timelines, and delivery areas.
                </p>
                <textarea
                  rows={5}
                  value={store.policyShipping}
                  placeholder="Enter your custom nationwide shipping policy..."
                  onChange={(e) => setStore({ ...store, policyShipping: e.target.value })}
                  className="w-full p-3 border border-neutral-300 focus:outline-none focus:border-black text-xs font-sans leading-relaxed"
                />
              </div>

              {/* Terms of Service */}
              <div className="p-5 border border-neutral-200 bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-black">
                    Terms of Service
                  </h3>
                  <a
                    href="/policies/terms-of-service"
                    target="_blank"
                    className="text-[11px] text-neutral-400 hover:text-black flex items-center space-x-1"
                  >
                    <span>View Live</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-[11px] text-neutral-500">
                  Visible on <code>/policies/terms-of-service</code>.
                </p>
                <textarea
                  rows={5}
                  value={store.policyTerms}
                  placeholder="Enter your custom terms of service..."
                  onChange={(e) => setStore({ ...store, policyTerms: e.target.value })}
                  className="w-full p-3 border border-neutral-300 focus:outline-none focus:border-black text-xs font-sans leading-relaxed"
                />
              </div>

              {/* Privacy Policy */}
              <div className="p-5 border border-neutral-200 bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-black">
                    Privacy Policy
                  </h3>
                  <a
                    href="/policies/privacy-policy"
                    target="_blank"
                    className="text-[11px] text-neutral-400 hover:text-black flex items-center space-x-1"
                  >
                    <span>View Live</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-[11px] text-neutral-500">
                  Visible on <code>/policies/privacy-policy</code>.
                </p>
                <textarea
                  rows={4}
                  value={store.policyPrivacy}
                  placeholder="Enter your customer data and privacy policy..."
                  onChange={(e) => setStore({ ...store, policyPrivacy: e.target.value })}
                  className="w-full p-3 border border-neutral-300 focus:outline-none focus:border-black text-xs font-sans leading-relaxed"
                />
              </div>

              {/* Contact Information */}
              <div className="p-5 border border-neutral-200 bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-black">
                    Contact & Studio Information
                  </h3>
                  <a
                    href="/policies/contact-information"
                    target="_blank"
                    className="text-[11px] text-neutral-400 hover:text-black flex items-center space-x-1"
                  >
                    <span>View Live</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-[11px] text-neutral-500">
                  Visible on <code>/policies/contact-information</code> and contact pages.
                </p>
                <textarea
                  rows={4}
                  value={store.policyContact}
                  placeholder="Enter your customer support operating hours, physical address, and inquiry channels..."
                  onChange={(e) => setStore({ ...store, policyContact: e.target.value })}
                  className="w-full p-3 border border-neutral-300 focus:outline-none focus:border-black text-xs font-sans leading-relaxed"
                />
              </div>
            </div>

            {/* Save Policies Button */}
            <div className="pt-6 border-t border-neutral-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <p className="text-xs text-neutral-500">
                Persist custom legal policies across Refund, Shipping, Terms, and Privacy pages.
              </p>
              <button
                type="button"
                onClick={() => handleSaveStore()}
                disabled={isSaving}
                className="w-full sm:w-auto px-6 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 disabled:bg-neutral-400 transition-colors cursor-pointer rounded-xs shadow-xs"
              >
                {isSaving ? 'Saving...' : 'Save Store Policies'}
              </button>
            </div>
          </div>
        )}

        {/* TAB 8: MARKETING PIXELS & CONVERSION TRACKING */}
        {activeTab === 'pixels' && (
          <div className="space-y-6 max-w-3xl">
            <div className="pb-4 border-b border-neutral-200">
              <h2 className="text-base font-semibold tracking-tight text-neutral-900">
                Marketing Pixels &amp; Conversion Tracking
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                Paste your ad platform IDs below and save. Standard e-commerce conversion events fire automatically in PKR across every page of your storefront.
              </p>
            </div>

            {/* Live Pixel Connection Status Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  name: 'Meta Pixel',
                  sub: 'Facebook & Instagram',
                  active: /^\d{5,25}$/.test((store.metaPixelId || '').trim()),
                },
                {
                  name: 'TikTok Pixel',
                  sub: 'TikTok Ads Manager',
                  active: /^[A-Za-z0-9_-]{5,40}$/.test((store.tiktokPixelId || '').trim()),
                },
                {
                  name: 'Google Analytics 4',
                  sub: 'GA4 Measurement',
                  active: /^G-[A-Z0-9]{4,20}$/i.test((store.ga4MeasurementId || '').trim()),
                },
              ].map((pixel) => (
                <div
                  key={pixel.name}
                  className="p-4 bg-neutral-50 border border-neutral-200 flex items-center justify-between"
                >
                  <div>
                    <p className="text-xs font-semibold text-neutral-900">{pixel.name}</p>
                    <p className="text-[11px] text-neutral-500">{pixel.sub}</p>
                  </div>
                  <span className="inline-flex items-center space-x-1.5 text-[11px] font-medium text-neutral-700">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        pixel.active ? 'bg-emerald-600' : 'bg-neutral-300'
                      }`}
                    />
                    <span>{pixel.active ? 'Active' : 'Not set'}</span>
                  </span>
                </div>
              ))}
            </div>

            {/* Pixel ID Input Fields */}
            <div className="space-y-5 pt-2">
              <div>
                <label className="block text-xs font-medium text-neutral-800 mb-1.5">
                  Meta Pixel ID (Facebook &amp; Instagram Ads)
                </label>
                <input
                  type="text"
                  value={store.metaPixelId}
                  onChange={(e) => setStore({ ...store, metaPixelId: e.target.value })}
                  placeholder="e.g. 123456789012345"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className="w-full px-3 py-2.5 border border-neutral-300 focus:outline-none focus:border-black text-xs font-mono text-neutral-900 placeholder-neutral-400"
                />
                <p className="text-[11px] text-neutral-500 mt-1">
                  Find in Meta Events Manager → Data Sources → Dataset / Pixel ID (digits only). Leave blank to disable.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-800 mb-1.5">
                  TikTok Pixel ID (TikTok Ads Manager)
                </label>
                <input
                  type="text"
                  value={store.tiktokPixelId}
                  onChange={(e) => setStore({ ...store, tiktokPixelId: e.target.value })}
                  placeholder="e.g. C1234567890ABCDEF"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className="w-full px-3 py-2.5 border border-neutral-300 focus:outline-none focus:border-black text-xs font-mono text-neutral-900 placeholder-neutral-400"
                />
                <p className="text-[11px] text-neutral-500 mt-1">
                  Find in TikTok Ads Manager → Tools → Events → Web Events → Pixel ID. Leave blank to disable.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-800 mb-1.5">
                  Google Analytics 4 Measurement ID
                </label>
                <input
                  type="text"
                  value={store.ga4MeasurementId}
                  onChange={(e) => setStore({ ...store, ga4MeasurementId: e.target.value })}
                  placeholder="e.g. G-XXXXXXXXXX"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className="w-full px-3 py-2.5 border border-neutral-300 focus:outline-none focus:border-black text-xs font-mono text-neutral-900 placeholder-neutral-400"
                />
                <p className="text-[11px] text-neutral-500 mt-1">
                  Find in Google Analytics → Admin → Data Streams → Measurement ID (starts with G-). Leave blank to disable.
                </p>
              </div>
            </div>

            {/* Automatic Event Mapping Ledger */}
            <div className="border border-neutral-200 bg-white">
              <div className="px-4 py-3 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-900">
                  Automatic Conversion Events Fired
                </span>
                <span className="text-[11px] font-mono text-neutral-500">Currency: PKR</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-neutral-100 text-neutral-500 text-[11px]">
                      <th className="py-2.5 px-4 font-medium">Shopper Action</th>
                      <th className="py-2.5 px-4 font-medium">Meta</th>
                      <th className="py-2.5 px-4 font-medium">TikTok</th>
                      <th className="py-2.5 px-4 font-medium">GA4</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-neutral-700 font-mono text-[11px]">
                    <tr>
                      <td className="py-2.5 px-4 font-sans text-neutral-900">Visits any page</td>
                      <td className="py-2.5 px-4">PageView</td>
                      <td className="py-2.5 px-4">page()</td>
                      <td className="py-2.5 px-4">page_view</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-sans text-neutral-900">Opens blade product page</td>
                      <td className="py-2.5 px-4">ViewContent</td>
                      <td className="py-2.5 px-4">ViewContent</td>
                      <td className="py-2.5 px-4">view_item</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-sans text-neutral-900">Clicks Add to Cart / Quick Add</td>
                      <td className="py-2.5 px-4">AddToCart</td>
                      <td className="py-2.5 px-4">AddToCart</td>
                      <td className="py-2.5 px-4">add_to_cart</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-sans text-neutral-900">Enters checkout</td>
                      <td className="py-2.5 px-4">InitiateCheckout</td>
                      <td className="py-2.5 px-4">InitiateCheckout</td>
                      <td className="py-2.5 px-4">begin_checkout</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-sans text-neutral-900">Places confirmed order</td>
                      <td className="py-2.5 px-4 text-emerald-700 font-semibold">Purchase</td>
                      <td className="py-2.5 px-4 text-emerald-700 font-semibold">CompletePayment</td>
                      <td className="py-2.5 px-4 text-emerald-700 font-semibold">purchase</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <p className="text-xs text-neutral-500">
                Changes take effect immediately across the storefront without redeploying.
              </p>
              <button
                type="button"
                onClick={() => handleSaveStore()}
                disabled={isSaving}
                className="w-full sm:w-auto px-6 py-2.5 bg-black text-white text-xs font-semibold tracking-wide hover:bg-neutral-800 disabled:bg-neutral-400 transition-colors cursor-pointer"
              >
                {isSaving ? 'Saving...' : 'Save Tracking Pixels'}
              </button>
            </div>
          </div>
        )}

        {/* TAB 9: SECURITY & MASTER PASSWORD */}
        {activeTab === 'security' && (
          <div className="space-y-6 max-w-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-200">
              <div>
                <h2 className="text-sm font-black uppercase tracking-wider text-black flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-black" />
                  <span>Admin Security & Master Password</span>
                </h2>
                <p className="text-xs text-neutral-500 mt-1">
                  Change your Master Founder Passkey directly from the control panel. Your new password is encrypted with salted scrypt hashing and stored securely in Supabase.
                </p>
              </div>
            </div>

            {/* Security Status Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-neutral-50 border border-neutral-200 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block">
                  Password Status
                </span>
                {hasCustomPassword ? (
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Custom Encrypted Password Active</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-700">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span>Initial Default Passkey Active</span>
                  </div>
                )}
              </div>

              <div className="p-4 bg-neutral-50 border border-neutral-200 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block">
                  Private Admin URL
                </span>
                <div className="flex items-center space-x-1.5 text-xs font-mono font-bold text-neutral-900">
                  <Lock className="w-3.5 h-3.5 text-neutral-600 flex-shrink-0" />
                  <span>/adminusman</span>
                  <span className="text-[10px] font-sans font-normal text-neutral-500">
                    (/admin returns 404)
                  </span>
                </div>
              </div>
            </div>

            {/* Alerts */}
            {passwordError && (
              <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {/* Password Change Form */}
            <form onSubmit={handleChangePassword} className="space-y-5 pt-1">
              {/* Current / Past Password */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1.5">
                  Current (Past) Password *
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current active password..."
                    autoComplete="current-password"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    className="w-full pl-9 pr-10 py-2.5 border border-neutral-300 focus:outline-none focus:border-black text-xs font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-2.5 text-neutral-400 hover:text-black cursor-pointer"
                    aria-label="Toggle current password visibility"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1.5">
                  New Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter your new password (min 6 characters)..."
                    autoComplete="new-password"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    className="w-full pl-9 pr-10 py-2.5 border border-neutral-300 focus:outline-none focus:border-black text-xs font-mono"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-2.5 text-neutral-400 hover:text-black cursor-pointer"
                    aria-label="Toggle new password visibility"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-neutral-500 mt-1">
                  Passwords are case-sensitive. Use a mix of letters and numbers you can easily remember.
                </p>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1.5">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your new password to confirm..."
                    autoComplete="new-password"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    className="w-full pl-9 pr-10 py-2.5 border border-neutral-300 focus:outline-none focus:border-black text-xs font-mono"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-neutral-400 hover:text-black cursor-pointer"
                    aria-label="Toggle confirm password visibility"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && newPassword && (
                  <p
                    className={`text-[11px] font-semibold mt-1 ${
                      newPassword === confirmPassword ? 'text-emerald-700' : 'text-red-600'
                    }`}
                  >
                    {newPassword === confirmPassword
                      ? '✓ Passwords match'
                      : '✕ Passwords do not match'}
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-neutral-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <p className="text-[11px] text-neutral-500">
                  Once updated, the old password stops working immediately across all devices.
                </p>
                <button
                  type="submit"
                  disabled={
                    isUpdatingPassword ||
                    !currentPassword.trim() ||
                    !newPassword.trim() ||
                    !confirmPassword.trim()
                  }
                  className="w-full sm:w-auto px-6 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 disabled:bg-neutral-400 transition-colors cursor-pointer rounded-xs shadow-xs flex items-center justify-center space-x-2"
                >
                  {isUpdatingPassword ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <Shield className="w-3.5 h-3.5" />
                      <span>Update Master Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Accessible Custom Confirmation Dialog for Coupon Deletion */}
      <ConfirmDialog
        isOpen={Boolean(confirmDeleteDiscountId)}
        title="Delete Promotional Coupon"
        message="Are you sure you want to delete this promotional discount coupon? Customers will no longer be able to apply this code at checkout."
        confirmText="Delete Coupon"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleExecuteDeleteDiscount}
        onClose={() => setConfirmDeleteDiscountId(null)}
      />
    </div>
  );
}
