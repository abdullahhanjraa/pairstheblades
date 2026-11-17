import React from 'react';
import { prisma } from '@/lib/db';
import { ProductsTable } from './products-table';

export const dynamic = 'force-dynamic';

export default async function AdminProductsPage() {
  let products: any[] = [];

  try {
    products = await prisma.product.findMany({
      include: { variants: true },
      orderBy: { createdAt: 'desc' },
    });
  } catch (err) {
    console.error('Error fetching admin products:', err);
  }

  return (
    <div className="space-y-6 text-left">
      <div>
        <h1 className="text-2xl font-black uppercase tracking-wider text-black font-sans">
          Products & Inventory Stock
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          Monitor inventory levels, adjust unit stock counts, and manage handcrafted blades & cutlery catalog.
        </p>
      </div>

      <ProductsTable initialProducts={products} />
    </div>
  );
}
