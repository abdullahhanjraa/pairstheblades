'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { trackStoreEvent } from '@/lib/analytics';

export interface CartItem {
  id: string; // unique cart line id (e.g. variantId)
  productId: string;
  variantId: string;
  title: string;
  variantTitle: string; // e.g. "Waist 32"
  price: number;
  compareAtPrice?: number | null;
  image: string;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('pairs_cart_items');
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load cart from localStorage', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem('pairs_cart_items', JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }, [items, isLoaded]);

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);

  const addItem = (itemToAdd: Omit<CartItem, 'id'>) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.variantId === itemToAdd.variantId);
      if (existing) {
        return prev.map((i) =>
          i.variantId === itemToAdd.variantId
            ? { ...i, quantity: i.quantity + itemToAdd.quantity }
            : i
        );
      }
      return [...prev, { ...itemToAdd, id: itemToAdd.variantId }];
    });
    trackStoreEvent('ADD_TO_CART', {
      productId: itemToAdd.productId,
      contentName: itemToAdd.title,
      value: itemToAdd.price * itemToAdd.quantity,
      numItems: itemToAdd.quantity,
    });
    setIsOpen(true);
  };

  const removeItem = (variantId: string) => {
    setItems((prev) => prev.filter((i) => i.variantId !== variantId));
  };

  const updateQuantity = (variantId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(variantId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.variantId === variantId ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const itemCount = items.reduce((acc, i) => acc + i.quantity, 0);
  const subtotal = items.reduce((acc, i) => acc + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        openCart,
        closeCart,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        itemCount,
        subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
