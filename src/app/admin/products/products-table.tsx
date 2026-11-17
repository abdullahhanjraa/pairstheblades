'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { formatPKR } from '@/lib/formatters';
import {
  Package,
  Check,
  Save,
  Plus,
  Minus,
  Edit2,
  Trash2,
  X,
  ExternalLink,
  AlertCircle,
  Search,
  Images,
  Upload,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import Link from 'next/link';
import { AdminToastContainer, ToastMessage } from '@/components/admin/admin-toast';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { validateProductPhoto } from '@/lib/image-validator';

interface Variant {
  id: string;
  option1: string;
  price: number;
  compareAtPrice?: number | null;
  inventoryQuantity: number;
  sku?: string | null;
}

interface Product {
  id: string;
  title: string;
  handle: string;
  description: string;
  price: number;
  compareAtPrice?: number | null;
  featuredImage: string;
  images: string;
  status: string;
  variants: Variant[];
}

interface ProductsTableProps {
  initialProducts: Product[];
}

const PRESET_IMAGES = [
  'https://images.unsplash.com/photo-1593618998160-e34014e67546?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1595341888016-a392ef81b7de?q=80&w=1200&auto=format&fit=crop',
];

export function ProductsTable({ initialProducts }: ProductsTableProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [stockEdits, setStockEdits] = useState<Record<string, number>>({});
  const [savingVariantId, setSavingVariantId] = useState<string | null>(null);
  const [successVariantId, setSuccessVariantId] = useState<string | null>(null);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'DRAFT'>('ALL');

  // Modals & Toast state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [confirmDeleteProduct, setConfirmDeleteProduct] = useState<Product | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

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

  // Add Product Form state
  const [newProduct, setNewProduct] = useState({
    title: '',
    price: 6499,
    compareAtPrice: 7999,
    description: 'Handcrafted Damascus steel blade with full tang construction. Includes custom leather sheath.',
    featuredImage: PRESET_IMAGES[0],
    galleryImagesText: '',
    status: 'ACTIVE',
    initialStock: 20,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // File upload states & refs
  const [isUploadingFeatured, setIsUploadingFeatured] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [productUploadError, setProductUploadError] = useState<string | null>(null);

  // Visual Media Manager collapsible & drag states
  const [showAddManualCover, setShowAddManualCover] = useState(false);
  const [showEditManualCover, setShowEditManualCover] = useState(false);
  const [showAddManualGallery, setShowAddManualGallery] = useState(false);
  const [showEditManualGallery, setShowEditManualGallery] = useState(false);
  const [isDraggingAdd, setIsDraggingAdd] = useState(false);
  const [isDraggingEdit, setIsDraggingEdit] = useState(false);

  const addFeaturedFileRef = React.useRef<HTMLInputElement | null>(null);
  const addGalleryFileRef = React.useRef<HTMLInputElement | null>(null);
  const editFeaturedFileRef = React.useRef<HTMLInputElement | null>(null);
  const editGalleryFileRef = React.useRef<HTMLInputElement | null>(null);

  // Upload Primary Featured Photo
  const handleUploadFeatured = async (file: File, isEdit: boolean) => {
    setProductUploadError(null);
    setIsUploadingFeatured(true);
    try {
      const check = await validateProductPhoto(file);
      if (!check.valid) {
        setProductUploadError(check.error || 'Product photo dimensions unfit.');
        showToast(check.error || 'Photo dimensions unfit', 'error', 'Unfit Product Photo');
        setIsUploadingFeatured(false);
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'products');

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setProductUploadError(data.error || 'Upload failed');
        showToast(data.error || 'Upload failed', 'error');
        setIsUploadingFeatured(false);
        return;
      }

      if (isEdit) {
        setEditingProduct((prev: any) => ({ ...prev, featuredImage: data.url }));
      } else {
        setNewProduct((prev) => ({ ...prev, featuredImage: data.url }));
      }

      showToast(
        `Photo uploaded successfully (${check.width}×${check.height}px)`,
        'success',
        'Featured Image Updated'
      );
    } catch (err: any) {
      console.error(err);
      setProductUploadError(err.message || 'Upload error');
      showToast('Error uploading photo', 'error');
    } finally {
      setIsUploadingFeatured(false);
      if (addFeaturedFileRef.current) addFeaturedFileRef.current.value = '';
      if (editFeaturedFileRef.current) editFeaturedFileRef.current.value = '';
    }
  };

  // Upload Additional Gallery Photos (Batch)
  const handleUploadGallery = async (files: FileList | File[] | null, isEdit: boolean) => {
    if (!files || files.length === 0) return;
    setProductUploadError(null);
    setIsUploadingGallery(true);

    try {
      const validUrls: string[] = [];
      const errorList: string[] = [];
      const fileList = files instanceof FileList ? Array.from(files) : files;

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        if (!file) continue;
        const check = await validateProductPhoto(file);
        if (!check.valid) {
          errorList.push(`"${file.name}": ${check.error}`);
          continue;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'products');

        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (res.ok && data.success) {
          validUrls.push(data.url);
        } else {
          errorList.push(`"${file.name}": ${data.error || 'Upload failed'}`);
        }
      }

      if (validUrls.length > 0) {
        if (isEdit) {
          setEditingProduct((prev: any) => {
            const current = (prev.galleryImagesText || '').trim();
            const combined = current ? `${current}\n${validUrls.join('\n')}` : validUrls.join('\n');
            return { ...prev, galleryImagesText: combined };
          });
        } else {
          setNewProduct((prev) => {
            const current = prev.galleryImagesText.trim();
            const combined = current ? `${current}\n${validUrls.join('\n')}` : validUrls.join('\n');
            return { ...prev, galleryImagesText: combined };
          });
        }
        showToast(
          `Uploaded ${validUrls.length} gallery photo(s) to catalog`,
          'success',
          'Gallery Updated'
        );
      }

      if (errorList.length > 0) {
        setProductUploadError(errorList.join('\n'));
        showToast(
          `${errorList.length} photo(s) failed dimension validation.`,
          'warning',
          'Some Photos Rejected'
        );
      }
    } catch (err: any) {
      console.error(err);
      showToast('Error uploading gallery photos', 'error');
    } finally {
      setIsUploadingGallery(false);
      if (addGalleryFileRef.current) addGalleryFileRef.current.value = '';
      if (editGalleryFileRef.current) editGalleryFileRef.current.value = '';
    }
  };

  const handleRemoveGalleryImage = (indexToRemove: number, isEdit: boolean) => {
    if (isEdit) {
      setEditingProduct((prev: any) => {
        const lines = (prev.galleryImagesText || '').split('\n').filter((l: string) => l.trim().length > 0);
        const filtered = lines.filter((_: any, idx: number) => idx !== indexToRemove);
        return { ...prev, galleryImagesText: filtered.join('\n') };
      });
    } else {
      setNewProduct((prev) => {
        const lines = prev.galleryImagesText.split('\n').filter((l) => l.trim().length > 0);
        const filtered = lines.filter((_, idx) => idx !== indexToRemove);
        return { ...prev, galleryImagesText: filtered.join('\n') };
      });
    }
  };

  const filteredProducts = products.filter((p) => {
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchHandle = p.handle.toLowerCase().includes(q);
      return matchTitle || matchHandle;
    }
    return true;
  });

  // Handle inline variant stock edit
  const handleStockChange = (variantId: string, val: number) => {
    setStockEdits((prev) => ({ ...prev, [variantId]: val }));
  };

  const handleSaveStock = async (variantId: string) => {
    const newQty = stockEdits[variantId];
    if (newQty === undefined) return;

    setSavingVariantId(variantId);
    try {
      const res = await fetch(`/api/admin/variants/${variantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inventoryQuantity: newQty }),
      });
      const data = await res.json();
      if (data.success) {
        setProducts((prev) =>
          prev.map((p) => ({
            ...p,
            variants: p.variants.map((v) =>
              v.id === variantId ? { ...v, inventoryQuantity: newQty } : v
            ),
          }))
        );
        setStockEdits((prev) => {
          const next = { ...prev };
          delete next[variantId];
          return next;
        });
        setSuccessVariantId(variantId);
        setTimeout(() => setSuccessVariantId(null), 2500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingVariantId(null);
    }
  };

  // Create Product with Multiple Images
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.featuredImage || newProduct.featuredImage.trim() === '') {
      showToast('Please upload or select a cover photo for this product.', 'warning', 'Missing Cover Photo');
      return;
    }
    setIsSubmitting(true);

    try {
      // Parse additional gallery images
      const extraImages = newProduct.galleryImagesText
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 5);

      const allImages = Array.from(new Set([newProduct.featuredImage, ...extraImages]));

      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newProduct.title,
          price: newProduct.price,
          compareAtPrice: newProduct.compareAtPrice,
          description: newProduct.description,
          featuredImage: newProduct.featuredImage,
          images: allImages,
          status: newProduct.status,
          initialStock: newProduct.initialStock,
        }),
      });

      const data = await res.json();
      if (data.success && data.product) {
        setProducts([data.product, ...products]);
        setIsAddModalOpen(false);
        setNewProduct({
          title: '',
          price: 6499,
          compareAtPrice: 7999,
          description: 'Handcrafted Damascus steel blade with full tang construction. Includes custom leather sheath.',
          featuredImage: PRESET_IMAGES[0],
          galleryImagesText: '',
          status: 'ACTIVE',
          initialStock: 20,
        });
        showToast(
          `Product "${data.product.title}" published with inventory verified!`,
          'success',
          'Product Created'
        );
      } else {
        showToast(data.error || 'Failed to create product', 'error', 'Creation Error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error connecting to backend server', 'error', 'Network Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Product Modal with parsed images and current inventory
  const handleOpenEditProduct = (product: Product) => {
    let parsedImages: string[] = [];
    try {
      parsedImages = JSON.parse(product.images || '[]');
    } catch (e) {
      parsedImages = [];
    }

    const extraImages = parsedImages.filter((img) => img !== product.featuredImage);
    const totalStock = (product.variants || []).reduce(
      (sum, v) => sum + (v.inventoryQuantity || 0),
      0
    );

    setEditingProduct({
      ...product,
      totalStock,
      galleryImagesText: extraImages.join('\n'),
    });
  };

  // Update Product with Multiple Images and Stock
  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (!editingProduct.featuredImage || editingProduct.featuredImage.trim() === '') {
      showToast('Please upload or select a cover photo for this product.', 'warning', 'Missing Cover Photo');
      return;
    }
    setIsSubmitting(true);

    try {
      const extraImages = (editingProduct.galleryImagesText || '')
        .split(/[\n,]+/)
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 5);

      const allImages = Array.from(new Set([editingProduct.featuredImage, ...extraImages]));

      const res = await fetch(`/api/admin/products/${editingProduct.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingProduct.title,
          price: editingProduct.price,
          compareAtPrice: editingProduct.compareAtPrice,
          description: editingProduct.description,
          featuredImage: editingProduct.featuredImage,
          images: allImages,
          status: editingProduct.status,
          stock: editingProduct.totalStock,
        }),
      });

      const data = await res.json();
      if (data.success && data.product) {
        setProducts((prev) =>
          prev.map((p) => (p.id === editingProduct.id ? { ...p, ...data.product } : p))
        );
        setEditingProduct(null);
        showToast(`Product "${data.product.title}" updated successfully!`, 'success', 'Saved');
      } else {
        showToast(data.error || 'Failed to update product', 'error', 'Update Error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error updating product', 'error', 'Network Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Execute Delete Product (Invoked by ConfirmDialog)
  const handleExecuteDeleteProduct = async () => {
    if (!confirmDeleteProduct) return;
    const productId = confirmDeleteProduct.id;
    setDeletingProductId(productId);

    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setProducts((prev) => prev.filter((p) => p.id !== productId));
        showToast(
          `Product "${confirmDeleteProduct.title}" permanently removed from catalog.`,
          'info',
          'Product Deleted'
        );
        setConfirmDeleteProduct(null);
      } else {
        showToast(data.error || 'Failed to delete product', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error deleting product from database', 'error');
    } finally {
      setDeletingProductId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 border border-neutral-200 shadow-xs">
        {/* Status Filter Tabs */}
        <div className="flex items-center space-x-1.5">
          {(['ALL', 'ACTIVE', 'DRAFT'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                statusFilter === tab
                  ? 'bg-black text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {tab === 'ALL' ? 'All Catalog' : tab}
            </button>
          ))}
        </div>

        {/* Search & Add New Product Button */}
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-neutral-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-neutral-300 text-xs focus:outline-none focus:border-black"
            />
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors shadow-sm cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Products List Cards */}
      <div className="bg-white border border-neutral-200 divide-y divide-neutral-200 shadow-xs">
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-xs text-neutral-400 space-y-3">
            <Package className="w-10 h-10 mx-auto text-neutral-300 stroke-[1]" />
            <p>No products match your search or filter.</p>
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('ALL');
              }}
              className="px-4 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-black text-xs font-bold uppercase tracking-wider"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredProducts.map((product) => {
            const totalStock = product.variants.reduce(
              (sum: number, v: Variant) =>
                sum + (stockEdits[v.id] !== undefined ? stockEdits[v.id] : v.inventoryQuantity),
              0
            );

            let galleryCount = 1;
            try {
              const parsed = JSON.parse(product.images || '[]');
              galleryCount = Array.isArray(parsed) && parsed.length > 0 ? parsed.length : 1;
            } catch (e) {
              galleryCount = 1;
            }

            return (
              <div key={product.id} className="p-6 space-y-4 hover:bg-neutral-50/40 transition-colors">
                {/* Product Header Row */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="relative w-16 h-16 bg-neutral-50 flex-shrink-0 border border-neutral-200 overflow-hidden rounded-xs p-1">
                      <Image
                        src={product.featuredImage}
                        alt={product.title}
                        fill
                        className="object-contain"
                      />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h2 className="text-sm font-extrabold uppercase tracking-wider text-black font-sans">
                          {product.title}
                        </h2>
                        <span
                          className={`px-2 py-0.2 text-[10px] font-bold rounded ${
                            product.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-neutral-200 text-neutral-700'
                          }`}
                        >
                          {product.status}
                        </span>
                        {totalStock <= 10 && (
                          <span className="px-2 py-0.2 text-[10px] font-bold rounded bg-amber-100 text-amber-800">
                            Low Stock
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1 max-w-md">
                        {product.description}
                      </p>

                      <div className="flex items-center space-x-3 mt-1.5 text-xs">
                        <span className="font-bold text-black">{formatPKR(product.price)}</span>
                        {product.compareAtPrice && (
                          <span className="text-neutral-400 line-through">
                            {formatPKR(product.compareAtPrice)}
                          </span>
                        )}
                        <span className="text-neutral-400 text-[11px] flex items-center space-x-1">
                          <Images className="w-3 h-3" />
                          <span>{galleryCount} photos</span>
                        </span>
                        <Link
                          href={`/products/${product.handle}`}
                          target="_blank"
                          className="inline-flex items-center space-x-1 text-neutral-500 hover:text-black underline ml-2"
                        >
                          <span>View on Store</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Total Stock */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-neutral-400 uppercase tracking-wider">
                        Total Stock
                      </span>
                      <p className="text-base font-extrabold text-black font-mono">
                        {totalStock} units
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleOpenEditProduct(product)}
                        className="px-2.5 py-1.5 border border-neutral-300 text-xs font-semibold uppercase tracking-wider text-neutral-700 hover:border-black hover:text-black flex items-center space-x-1 cursor-pointer"
                        title="Edit Details"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => setConfirmDeleteProduct(product)}
                        disabled={deletingProductId === product.id}
                        className="p-1.5 text-neutral-400 hover:text-red-600 transition-colors cursor-pointer"
                        title="Delete Product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Inventory Stock Controller (Clean, Zero Waist Constraints) */}
                <div className="pt-2.5 border-t border-neutral-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                      Inventory Stock (Quick +/- Stepper or Direct Edit):
                    </span>

                    <div className="flex flex-wrap items-center gap-2">
                      {product.variants.map((v) => {
                        const currentVal =
                          stockEdits[v.id] !== undefined ? stockEdits[v.id] : v.inventoryQuantity;
                        const isDirty =
                          stockEdits[v.id] !== undefined && stockEdits[v.id] !== v.inventoryQuantity;
                        const isSaving = savingVariantId === v.id;
                        const isSuccess = successVariantId === v.id;
                        const displayLabel =
                          v.option1 && v.option1 !== 'Standard' && v.option1 !== 'Default'
                            ? v.option1.replace(/^Waist\s+/i, '')
                            : 'In Stock';

                        return (
                          <div
                            key={v.id}
                            className="p-2 border border-neutral-200 bg-neutral-50/70 flex items-center space-x-2 rounded-xs"
                          >
                            <span className="font-extrabold text-black text-xs min-w-[50px]">
                              {displayLabel}
                            </span>
                            <span className="text-[10px] text-neutral-400 font-mono">
                              ({v.inventoryQuantity} in DB)
                            </span>

                            <div className="flex items-center space-x-1">
                              <button
                                type="button"
                                onClick={() => handleStockChange(v.id, Math.max(0, currentVal - 1))}
                                className="w-6 h-6 flex items-center justify-center bg-white border border-neutral-300 hover:bg-neutral-100 text-neutral-700 text-xs font-bold rounded-xs cursor-pointer flex-shrink-0"
                                title="Decrease by 1"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <input
                                type="number"
                                min="0"
                                value={currentVal}
                                onChange={(e) =>
                                  handleStockChange(v.id, Math.max(0, parseInt(e.target.value, 10) || 0))
                                }
                                className="w-16 px-1 py-1 text-xs border border-neutral-300 bg-white font-bold text-center focus:outline-none focus:border-black font-mono min-w-0"
                              />
                              <button
                                type="button"
                                onClick={() => handleStockChange(v.id, currentVal + 1)}
                                className="w-6 h-6 flex items-center justify-center bg-white border border-neutral-300 hover:bg-neutral-100 text-neutral-700 text-xs font-bold rounded-xs cursor-pointer flex-shrink-0"
                                title="Increase by 1"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                              {isDirty && (
                                <button
                                  type="button"
                                  onClick={() => handleSaveStock(v.id)}
                                  disabled={isSaving}
                                  className="px-2 py-1 bg-black text-white hover:bg-neutral-800 transition-colors cursor-pointer rounded-xs flex-shrink-0 flex items-center space-x-1 text-[10px] font-bold tracking-wider uppercase shadow-xs"
                                  title="Save to Database"
                                >
                                  <Save className="w-3 h-3" />
                                  <span>{isSaving ? '...' : 'Save'}</span>
                                </button>
                              )}
                              {isSuccess && (
                                <div
                                  className="px-1.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xs flex items-center space-x-1 text-[10px] font-bold tracking-wider uppercase"
                                  title="Saved"
                                >
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span>Saved</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 1. Modal: Add New Product */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setIsAddModalOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-white p-6 sm:p-8 shadow-2xl z-10 max-h-[90vh] overflow-y-auto space-y-4 animate-in fade-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-black font-sans">
                Add New Product to Catalog
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-black cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                  Product Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Raw Indigo Wide Leg Bootcut"
                  value={newProduct.title}
                  onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })}
                  className="w-full p-2.5 border border-neutral-300 focus:outline-none focus:border-black font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                    Sale Price (PKR) *
                  </label>
                  <input
                    type="number"
                    required
                    value={newProduct.price}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full p-2.5 border border-neutral-300 focus:outline-none focus:border-black font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                    Compare-At Price (PKR)
                  </label>
                  <input
                    type="number"
                    value={newProduct.compareAtPrice}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        compareAtPrice: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full p-2.5 border border-neutral-300 focus:outline-none focus:border-black text-neutral-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={newProduct.description}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, description: e.target.value })
                  }
                  className="w-full p-2.5 border border-neutral-300 focus:outline-none focus:border-black"
                />
              </div>

              {/* Diagnostic Error Banner for Unfit Dimensions */}
              {productUploadError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-[11px] rounded-xs space-y-1">
                  <div className="flex items-center space-x-1.5 font-bold">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                    <span>Photo Dimension Rejection</span>
                  </div>
                  <pre className="whitespace-pre-wrap font-mono text-[10px] leading-tight text-red-700">
                    {productUploadError}
                  </pre>
                  <p className="text-[10px] text-neutral-500 pt-0.5">
                    Catalog standard: Recommended 1200×1600px (3:4 ratio) or 1200×1200px (1:1 square), min 400×400px, Max 10MB.
                  </p>
                </div>
              )}

              {/* Primary Cover Photo - Visual Shopify-Style Media Manager */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-black">
                    Primary Cover Photo *
                  </label>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    3:4 (1200×1600px) or 1:1 (1200×1200px)
                  </span>
                </div>

                <input
                  ref={addFeaturedFileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/avif"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUploadFeatured(f, false);
                  }}
                />

                {newProduct.featuredImage ? (
                  /* State A: Photo Selected/Uploaded -> Visual Card with Replace & Remove */
                  <div className="p-3 border border-neutral-300 bg-white rounded-xs space-y-3 shadow-2xs">
                    <div className="flex items-start space-x-3.5">
                      <div className="relative w-16 h-16 bg-neutral-50 border border-neutral-300 flex-shrink-0 overflow-hidden rounded-xs shadow-2xs p-1">
                        <img
                          src={newProduct.featuredImage}
                          alt="Cover preview"
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="%23999" stroke-width="1.5"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                          }}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider rounded-xs">
                            <Check className="w-2.5 h-2.5" />
                            <span>Active Cover Photo</span>
                          </span>
                        </div>

                        <p className="text-[11px] text-neutral-600 font-mono truncate mt-1" title={newProduct.featuredImage}>
                          {newProduct.featuredImage.split('/').pop() || newProduct.featuredImage}
                        </p>

                        <div className="flex items-center space-x-2 mt-2">
                          <button
                            type="button"
                            onClick={() => addFeaturedFileRef.current?.click()}
                            disabled={isUploadingFeatured}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 bg-black text-white text-[10px] font-bold uppercase tracking-wider hover:bg-neutral-800 disabled:bg-neutral-400 cursor-pointer rounded-xs"
                          >
                            {isUploadingFeatured ? (
                              <>
                                <RefreshCw className="w-3 h-3 animate-spin" />
                                <span>Uploading...</span>
                              </>
                            ) : (
                              <>
                                <RefreshCw className="w-3 h-3" />
                                <span>Replace Photo</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => setNewProduct({ ...newProduct, featuredImage: '' })}
                            className="inline-flex items-center space-x-1 px-2 py-1 border border-neutral-300 text-neutral-700 hover:text-red-600 hover:border-red-300 text-[10px] font-bold uppercase tracking-wider cursor-pointer rounded-xs"
                          >
                            <X className="w-3 h-3" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Secondary Collapsible: Manual URL / Presets */}
                    <div className="pt-2 border-t border-neutral-100">
                      <button
                        type="button"
                        onClick={() => setShowAddManualCover((prev) => !prev)}
                        className="inline-flex items-center space-x-1 text-[10px] font-bold uppercase tracking-wider text-neutral-500 hover:text-black cursor-pointer"
                      >
                        {showAddManualCover ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        <span>{showAddManualCover ? 'Hide Manual Link / Presets' : 'Edit Link Manually / Pick Preset'}</span>
                      </button>

                      {showAddManualCover && (
                        <div className="mt-2 space-y-2">
                          <input
                            type="text"
                            value={newProduct.featuredImage}
                            onChange={(e) =>
                              setNewProduct({ ...newProduct, featuredImage: e.target.value })
                            }
                            className="w-full p-2 border border-neutral-300 focus:outline-none focus:border-black font-mono text-[11px]"
                            placeholder="https://... or uploaded /uploads/products/..."
                          />
                          <div className="flex items-center space-x-1.5 text-[10px]">
                            <span className="text-neutral-400">Presets:</span>
                            {PRESET_IMAGES.map((img, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => setNewProduct({ ...newProduct, featuredImage: img })}
                                className="px-1.5 py-0.5 border border-neutral-200 hover:border-black cursor-pointer bg-neutral-50 text-[10px]"
                              >
                                Image {i + 1}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* State B: No Photo Selected -> Clickable & Drag-and-Drop Dropzone */
                  <div className="space-y-2">
                    <div
                      onClick={() => addFeaturedFileRef.current?.click()}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingAdd(true);
                      }}
                      onDragLeave={() => setIsDraggingAdd(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingAdd(false);
                        const f = e.dataTransfer.files?.[0];
                        if (f) handleUploadFeatured(f, false);
                      }}
                      className={`border-2 border-dashed p-6 rounded-xs flex flex-col items-center justify-center cursor-pointer transition-colors group ${
                        isDraggingAdd
                          ? 'border-black bg-neutral-100'
                          : 'border-neutral-300 hover:border-black bg-neutral-50 hover:bg-white'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-white border border-neutral-300 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                        {isUploadingFeatured ? (
                          <RefreshCw className="w-5 h-5 text-black animate-spin" />
                        ) : (
                          <Upload className="w-5 h-5 text-neutral-700 group-hover:text-black" />
                        )}
                      </div>
                      <p className="text-[12px] font-bold text-black uppercase tracking-wider text-center">
                        {isUploadingFeatured ? 'Verifying & Uploading Photo...' : 'Click to Upload Cover Photo from PC / Mobile'}
                      </p>
                      <p className="text-[10px] text-neutral-500 mt-1 text-center">
                        Or drag & drop photo here • PNG, JPG, WebP up to 10MB
                      </p>
                    </div>

                    {/* Secondary Collapsible: Manual URL / Presets */}
                    <div>
                      <button
                        type="button"
                        onClick={() => setShowAddManualCover((prev) => !prev)}
                        className="inline-flex items-center space-x-1 text-[10px] font-bold uppercase tracking-wider text-neutral-500 hover:text-black cursor-pointer"
                      >
                        {showAddManualCover ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        <span>{showAddManualCover ? 'Hide Manual Link / Presets' : '+ Or Paste Image URL / Choose Preset'}</span>
                      </button>

                      {showAddManualCover && (
                        <div className="mt-2 space-y-2 p-2.5 bg-neutral-50 border border-neutral-200 rounded-xs">
                          <input
                            type="text"
                            value={newProduct.featuredImage}
                            onChange={(e) =>
                              setNewProduct({ ...newProduct, featuredImage: e.target.value })
                            }
                            className="w-full p-2 border border-neutral-300 focus:outline-none focus:border-black font-mono text-[11px] bg-white"
                            placeholder="https://... or uploaded /uploads/products/..."
                          />
                          <div className="flex items-center space-x-1.5 text-[10px]">
                            <span className="text-neutral-400">Presets:</span>
                            {PRESET_IMAGES.map((img, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => setNewProduct({ ...newProduct, featuredImage: img })}
                                className="px-1.5 py-0.5 border border-neutral-200 hover:border-black cursor-pointer bg-white text-[10px]"
                              >
                                Image {i + 1}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Gallery Images Section */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-black">
                    Additional Gallery Images
                  </label>
                  <button
                    type="button"
                    onClick={() => addGalleryFileRef.current?.click()}
                    disabled={isUploadingGallery}
                    className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-black text-white text-[10px] font-bold uppercase tracking-wider hover:bg-neutral-800 disabled:bg-neutral-400 cursor-pointer rounded-xs"
                  >
                    {isUploadingGallery ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>Uploading Gallery...</span>
                      </>
                    ) : (
                      <>
                        <Images className="w-3 h-3" />
                        <span>+ Upload Gallery Photos</span>
                      </>
                    )}
                  </button>
                </div>

                <input
                  ref={addGalleryFileRef}
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/webp,image/avif"
                  className="hidden"
                  onChange={(e) => {
                    const fl = Array.from(e.target.files || []);
                    if (fl.length) handleUploadGallery(fl, false);
                  }}
                />

                {/* Visual Thumbnail Gallery Strip with Delete buttons */}
                {newProduct.galleryImagesText.split('\n').filter((u) => u.trim().length > 0).length > 0 ? (
                  <div className="p-2.5 bg-neutral-50 border border-neutral-200 rounded-xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-700">
                        Uploaded Photos ({newProduct.galleryImagesText.split('\n').filter((u) => u.trim().length > 0).length})
                      </span>
                      <span className="text-[10px] text-neutral-400">Click ✕ to remove any angle</span>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                      {newProduct.galleryImagesText.split('\n').filter((u) => u.trim().length > 0).map((url, idx) => (
                        <div key={idx} className="relative group w-14 h-14 bg-neutral-50 border border-neutral-300 overflow-hidden rounded-xs shadow-2xs p-0.5">
                          <img
                            src={url.trim()}
                            alt={`Gallery ${idx + 1}`}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="%23999" stroke-width="1.5"><rect width="18" height="18" x="3" y="3" rx="2"/></svg>';
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveGalleryImage(idx, false)}
                            className="absolute top-0 right-0 bg-red-600 text-white p-0.5 opacity-90 hover:opacity-100 transition-opacity cursor-pointer rounded-bl-xs"
                            title="Remove photo"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => addGalleryFileRef.current?.click()}
                    className="p-3 border border-dashed border-neutral-300 rounded-xs text-center cursor-pointer hover:border-black bg-neutral-50 hover:bg-white transition-colors"
                  >
                    <p className="text-[11px] text-neutral-600">
                      No additional gallery photos yet. <span className="font-bold text-black underline">Click to upload extra angles</span> (spine, handle, sheath).
                    </p>
                  </div>
                )}

                {/* Collapsible Manual Raw URL Editor */}
                <div className="mt-1.5">
                  <button
                    type="button"
                    onClick={() => setShowAddManualGallery((prev) => !prev)}
                    className="inline-flex items-center space-x-1 text-[10px] font-bold uppercase tracking-wider text-neutral-500 hover:text-black cursor-pointer"
                  >
                    {showAddManualGallery ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    <span>{showAddManualGallery ? 'Hide Raw URLs' : 'Advanced: View / Edit Raw URLs'}</span>
                  </button>

                  {showAddManualGallery && (
                    <div className="mt-1.5">
                      <textarea
                        rows={3}
                        placeholder="https://...&#10;/uploads/products/..."
                        value={newProduct.galleryImagesText}
                        onChange={(e) =>
                          setNewProduct({ ...newProduct, galleryImagesText: e.target.value })
                        }
                        className="w-full p-2.5 border border-neutral-300 focus:outline-none focus:border-black font-mono text-[11px] bg-white"
                      />
                      <p className="text-[10px] text-neutral-400 mt-0.5">One URL or path per line.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                    Total Available Stock *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newProduct.initialStock}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        initialStock: Math.max(0, parseInt(e.target.value, 10) || 0),
                      })
                    }
                    className="w-full p-2.5 border border-neutral-300 focus:outline-none focus:border-black font-bold font-mono"
                  />
                  <span className="text-[10px] text-neutral-400">Total units available in inventory</span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                    Catalog Status
                  </label>
                  <select
                    value={newProduct.status}
                    onChange={(e) => setNewProduct({ ...newProduct, status: e.target.value })}
                    className="w-full p-2.5 border border-neutral-300 focus:outline-none focus:border-black bg-white"
                  >
                    <option value="ACTIVE">ACTIVE (Visible on Store)</option>
                    <option value="DRAFT">DRAFT (Hidden)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-100 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 bg-neutral-100 text-neutral-700 font-semibold text-xs uppercase tracking-wider hover:bg-neutral-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-black text-white font-bold text-xs uppercase tracking-wider hover:bg-neutral-800 disabled:bg-neutral-400 cursor-pointer"
                >
                  {isSubmitting ? 'Creating...' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal: Edit Existing Product */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setEditingProduct(null)}
          />
          <div className="relative w-full max-w-lg bg-white p-6 sm:p-8 shadow-2xl z-10 max-h-[90vh] overflow-y-auto space-y-4 animate-in fade-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-black font-sans">
                Edit Product: {editingProduct.title}
              </h3>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-1 text-neutral-400 hover:text-black cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateProduct} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                  Product Title
                </label>
                <input
                  type="text"
                  required
                  value={editingProduct.title}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, title: e.target.value })
                  }
                  className="w-full p-2.5 border border-neutral-300 focus:outline-none focus:border-black font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                    Sale Price (PKR)
                  </label>
                  <input
                    type="number"
                    required
                    value={editingProduct.price}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        price: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full p-2.5 border border-neutral-300 focus:outline-none focus:border-black font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                    Compare-At Price (PKR)
                  </label>
                  <input
                    type="number"
                    value={editingProduct.compareAtPrice || ''}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        compareAtPrice: parseFloat(e.target.value) || null,
                      })
                    }
                    className="w-full p-2.5 border border-neutral-300 focus:outline-none focus:border-black text-neutral-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={editingProduct.description}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, description: e.target.value })
                  }
                  className="w-full p-2.5 border border-neutral-300 focus:outline-none focus:border-black"
                />
              </div>

              {/* Diagnostic Error Banner for Unfit Dimensions */}
              {productUploadError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-[11px] rounded-xs space-y-1">
                  <div className="flex items-center space-x-1.5 font-bold">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                    <span>Photo Dimension Rejection</span>
                  </div>
                  <pre className="whitespace-pre-wrap font-mono text-[10px] leading-tight text-red-700">
                    {productUploadError}
                  </pre>
                  <p className="text-[10px] text-neutral-500 pt-0.5">
                    Catalog standard: Recommended 1200×1600px (3:4 ratio) or 1200×1200px (1:1 square), min 400×400px, Max 10MB.
                  </p>
                </div>
              )}

              {/* Primary Cover Photo - Visual Shopify-Style Media Manager */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-black">
                    Primary Cover Photo *
                  </label>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    3:4 (1200×1600px) or 1:1 (1200×1200px)
                  </span>
                </div>

                <input
                  ref={editFeaturedFileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/avif"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUploadFeatured(f, true);
                  }}
                />

                {editingProduct.featuredImage ? (
                  /* State A: Photo Selected/Uploaded -> Visual Card with Replace & Remove */
                  <div className="p-3 border border-neutral-300 bg-white rounded-xs space-y-3 shadow-2xs">
                    <div className="flex items-start space-x-3.5">
                      <div className="relative w-16 h-16 bg-neutral-50 border border-neutral-300 flex-shrink-0 overflow-hidden rounded-xs shadow-2xs p-1">
                        <img
                          src={editingProduct.featuredImage}
                          alt="Cover preview"
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="%23999" stroke-width="1.5"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                          }}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider rounded-xs">
                            <Check className="w-2.5 h-2.5" />
                            <span>Active Cover Photo</span>
                          </span>
                        </div>

                        <p className="text-[11px] text-neutral-600 font-mono truncate mt-1" title={editingProduct.featuredImage}>
                          {editingProduct.featuredImage.split('/').pop() || editingProduct.featuredImage}
                        </p>

                        <div className="flex items-center space-x-2 mt-2">
                          <button
                            type="button"
                            onClick={() => editFeaturedFileRef.current?.click()}
                            disabled={isUploadingFeatured}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 bg-black text-white text-[10px] font-bold uppercase tracking-wider hover:bg-neutral-800 disabled:bg-neutral-400 cursor-pointer rounded-xs"
                          >
                            {isUploadingFeatured ? (
                              <>
                                <RefreshCw className="w-3 h-3 animate-spin" />
                                <span>Uploading...</span>
                              </>
                            ) : (
                              <>
                                <RefreshCw className="w-3 h-3" />
                                <span>Replace Photo</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => setEditingProduct({ ...editingProduct, featuredImage: '' })}
                            className="inline-flex items-center space-x-1 px-2 py-1 border border-neutral-300 text-neutral-700 hover:text-red-600 hover:border-red-300 text-[10px] font-bold uppercase tracking-wider cursor-pointer rounded-xs"
                          >
                            <X className="w-3 h-3" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Secondary Collapsible: Manual URL / Presets */}
                    <div className="pt-2 border-t border-neutral-100">
                      <button
                        type="button"
                        onClick={() => setShowEditManualCover((prev) => !prev)}
                        className="inline-flex items-center space-x-1 text-[10px] font-bold uppercase tracking-wider text-neutral-500 hover:text-black cursor-pointer"
                      >
                        {showEditManualCover ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        <span>{showEditManualCover ? 'Hide Manual Link / Presets' : 'Edit Link Manually / Pick Preset'}</span>
                      </button>

                      {showEditManualCover && (
                        <div className="mt-2 space-y-2">
                          <input
                            type="text"
                            value={editingProduct.featuredImage}
                            onChange={(e) =>
                              setEditingProduct({ ...editingProduct, featuredImage: e.target.value })
                            }
                            className="w-full p-2 border border-neutral-300 focus:outline-none focus:border-black font-mono text-[11px]"
                            placeholder="https://... or uploaded /uploads/products/..."
                          />
                          <div className="flex items-center space-x-1.5 text-[10px]">
                            <span className="text-neutral-400">Presets:</span>
                            {PRESET_IMAGES.map((img, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => setEditingProduct({ ...editingProduct, featuredImage: img })}
                                className="px-1.5 py-0.5 border border-neutral-200 hover:border-black cursor-pointer bg-neutral-50 text-[10px]"
                              >
                                Image {i + 1}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* State B: No Photo Selected -> Clickable & Drag-and-Drop Dropzone */
                  <div className="space-y-2">
                    <div
                      onClick={() => editFeaturedFileRef.current?.click()}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingEdit(true);
                      }}
                      onDragLeave={() => setIsDraggingEdit(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingEdit(false);
                        const f = e.dataTransfer.files?.[0];
                        if (f) handleUploadFeatured(f, true);
                      }}
                      className={`border-2 border-dashed p-6 rounded-xs flex flex-col items-center justify-center cursor-pointer transition-colors group ${
                        isDraggingEdit
                          ? 'border-black bg-neutral-100'
                          : 'border-neutral-300 hover:border-black bg-neutral-50 hover:bg-white'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-white border border-neutral-300 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                        {isUploadingFeatured ? (
                          <RefreshCw className="w-5 h-5 text-black animate-spin" />
                        ) : (
                          <Upload className="w-5 h-5 text-neutral-700 group-hover:text-black" />
                        )}
                      </div>
                      <p className="text-[12px] font-bold text-black uppercase tracking-wider text-center">
                        {isUploadingFeatured ? 'Verifying & Uploading Photo...' : 'Click to Upload Cover Photo from PC / Mobile'}
                      </p>
                      <p className="text-[10px] text-neutral-500 mt-1 text-center">
                        Or drag & drop photo here • PNG, JPG, WebP up to 10MB
                      </p>
                    </div>

                    {/* Secondary Collapsible: Manual URL / Presets */}
                    <div>
                      <button
                        type="button"
                        onClick={() => setShowEditManualCover((prev) => !prev)}
                        className="inline-flex items-center space-x-1 text-[10px] font-bold uppercase tracking-wider text-neutral-500 hover:text-black cursor-pointer"
                      >
                        {showEditManualCover ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        <span>{showEditManualCover ? 'Hide Manual Link / Presets' : '+ Or Paste Image URL / Choose Preset'}</span>
                      </button>

                      {showEditManualCover && (
                        <div className="mt-2 space-y-2 p-2.5 bg-neutral-50 border border-neutral-200 rounded-xs">
                          <input
                            type="text"
                            value={editingProduct.featuredImage}
                            onChange={(e) =>
                              setEditingProduct({ ...editingProduct, featuredImage: e.target.value })
                            }
                            className="w-full p-2 border border-neutral-300 focus:outline-none focus:border-black font-mono text-[11px] bg-white"
                            placeholder="https://... or uploaded /uploads/products/..."
                          />
                          <div className="flex items-center space-x-1.5 text-[10px]">
                            <span className="text-neutral-400">Presets:</span>
                            {PRESET_IMAGES.map((img, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => setEditingProduct({ ...editingProduct, featuredImage: img })}
                                className="px-1.5 py-0.5 border border-neutral-200 hover:border-black cursor-pointer bg-white text-[10px]"
                              >
                                Image {i + 1}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Gallery Images Section */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-black">
                    Additional Gallery Images
                  </label>
                  <button
                    type="button"
                    onClick={() => editGalleryFileRef.current?.click()}
                    disabled={isUploadingGallery}
                    className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-black text-white text-[10px] font-bold uppercase tracking-wider hover:bg-neutral-800 disabled:bg-neutral-400 cursor-pointer rounded-xs"
                  >
                    {isUploadingGallery ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>Uploading Gallery...</span>
                      </>
                    ) : (
                      <>
                        <Images className="w-3 h-3" />
                        <span>+ Upload Gallery Photos</span>
                      </>
                    )}
                  </button>
                </div>

                <input
                  ref={editGalleryFileRef}
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/webp,image/avif"
                  className="hidden"
                  onChange={(e) => {
                    const fl = Array.from(e.target.files || []);
                    if (fl.length) handleUploadGallery(fl, true);
                  }}
                />

                {/* Visual Thumbnail Gallery Strip with Delete buttons */}
                {(editingProduct.galleryImagesText || '')
                  .split('\n')
                  .filter((u: string) => u.trim().length > 0).length > 0 ? (
                  <div className="p-2.5 bg-neutral-50 border border-neutral-200 rounded-xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-700">
                        Uploaded Photos (
                        {
                          (editingProduct.galleryImagesText || '')
                            .split('\n')
                            .filter((u: string) => u.trim().length > 0).length
                        }
                        )
                      </span>
                      <span className="text-[10px] text-neutral-400">Click ✕ to remove any angle</span>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                      {(editingProduct.galleryImagesText || '')
                        .split('\n')
                        .filter((u: string) => u.trim().length > 0)
                        .map((url: string, idx: number) => (
                          <div
                            key={idx}
                            className="relative group w-14 h-14 bg-neutral-50 border border-neutral-300 overflow-hidden rounded-xs shadow-2xs p-0.5"
                          >
                            <img
                              src={url.trim()}
                              alt={`Gallery ${idx + 1}`}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="%23999" stroke-width="1.5"><rect width="18" height="18" x="3" y="3" rx="2"/></svg>';
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveGalleryImage(idx, true)}
                              className="absolute top-0 right-0 bg-red-600 text-white p-0.5 opacity-90 hover:opacity-100 transition-opacity cursor-pointer rounded-bl-xs"
                              title="Remove photo"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => editGalleryFileRef.current?.click()}
                    className="p-3 border border-dashed border-neutral-300 rounded-xs text-center cursor-pointer hover:border-black bg-neutral-50 hover:bg-white transition-colors"
                  >
                    <p className="text-[11px] text-neutral-600">
                      No additional gallery photos yet. <span className="font-bold text-black underline">Click to upload extra angles</span> (spine, handle, sheath).
                    </p>
                  </div>
                )}

                {/* Collapsible Manual Raw URL Editor */}
                <div className="mt-1.5">
                  <button
                    type="button"
                    onClick={() => setShowEditManualGallery((prev) => !prev)}
                    className="inline-flex items-center space-x-1 text-[10px] font-bold uppercase tracking-wider text-neutral-500 hover:text-black cursor-pointer"
                  >
                    {showEditManualGallery ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    <span>{showEditManualGallery ? 'Hide Raw URLs' : 'Advanced: View / Edit Raw URLs'}</span>
                  </button>

                  {showEditManualGallery && (
                    <div className="mt-1.5">
                      <textarea
                        rows={3}
                        placeholder="https://...&#10;/uploads/products/..."
                        value={editingProduct.galleryImagesText || ''}
                        onChange={(e) =>
                          setEditingProduct({ ...editingProduct, galleryImagesText: e.target.value })
                        }
                        className="w-full p-2.5 border border-neutral-300 focus:outline-none focus:border-black font-mono text-[11px] bg-white"
                      />
                      <p className="text-[10px] text-neutral-400 mt-0.5">One URL or path per line.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                    Total Available Stock *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editingProduct.totalStock ?? 0}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        totalStock: Math.max(0, parseInt(e.target.value, 10) || 0),
                      })
                    }
                    className="w-full p-2.5 border border-neutral-300 focus:outline-none focus:border-black font-bold font-mono"
                  />
                  <span className="text-[10px] text-neutral-400">Total units available in inventory</span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                    Catalog Status
                  </label>
                  <select
                    value={editingProduct.status}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, status: e.target.value })
                    }
                    className="w-full p-2.5 border border-neutral-300 focus:outline-none focus:border-black bg-white"
                  >
                    <option value="ACTIVE">ACTIVE (Visible on Store)</option>
                    <option value="DRAFT">DRAFT (Hidden)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-100 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 py-2.5 bg-neutral-100 text-neutral-700 font-semibold text-xs uppercase tracking-wider hover:bg-neutral-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-black text-white font-bold text-xs uppercase tracking-wider hover:bg-neutral-800 disabled:bg-neutral-400 cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : 'Update Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Accessible Custom Confirmation Dialog for Product Deletion */}
      <ConfirmDialog
        isOpen={Boolean(confirmDeleteProduct)}
        title="Delete Product"
        message={`Are you sure you want to permanently delete "${confirmDeleteProduct?.title}" from the catalog? This action cannot be undone.`}
        confirmText="Delete Product"
        cancelText="Cancel"
        variant="danger"
        isLoading={Boolean(deletingProductId)}
        onConfirm={handleExecuteDeleteProduct}
        onClose={() => setConfirmDeleteProduct(null)}
      />

      {/* Modern Non-Blocking Toast Notification Container */}
      <AdminToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
