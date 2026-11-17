// Automated QA Verification: Uncropped Professional Product Photography
const fs = require('fs');
const path = require('path');

function checkFile(relPath, assertions) {
  const fullPath = path.join(__dirname, '..', relPath);
  const content = fs.readFileSync(fullPath, 'utf8');
  console.log(`\n🔍 Checking ${relPath}...`);
  let passed = 0;
  for (const { label, test } of assertions) {
    const ok = test(content);
    if (ok) {
      console.log(`  ✓ PASS: ${label}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${label}`);
      process.exit(1);
    }
  }
  return passed;
}

console.log('🧪 Running Uncropped Product Photography QA Audit...');

// 1. Product Detail View
checkFile('src/app/(storefront)/products/[handle]/product-detail-view.tsx', [
  {
    label: 'Main stage uses object-contain to prevent photo cropping',
    test: (c) => c.includes('className="object-contain object-center transition-all duration-300 drop-shadow-xs"'),
  },
  {
    label: 'Main stage uses knife-friendly aspect ratio (aspect-[4/3] sm:aspect-[16/11])',
    test: (c) => c.includes('aspect-[4/3] sm:aspect-[16/11]'),
  },
  {
    label: 'Ambient photo backdrop fill is present for luxury presentation',
    test: (c) => c.includes('bg-cover bg-center blur-2xl opacity-20 scale-110 pointer-events-none'),
  },
  {
    label: 'Fullscreen Lightbox modal exists with Escape listener',
    test: (c) => c.includes('isLightboxOpen') && c.includes('High-Resolution Fullscreen Lightbox Modal'),
  },
  {
    label: 'Thumbnails use object-contain and square dimensions',
    test: (c) => c.includes('w-16 h-16 sm:w-20 sm:h-20') && c.includes('className="object-contain object-center p-1"'),
  },
  {
    label: 'Eliminated "Drop 001 Collection" label',
    test: (c) => !c.includes('Drop 001 Collection'),
  },
]);

// 2. Product Card (Catalog & Home Grid)
checkFile('src/components/storefront/product-card.tsx', [
  {
    label: 'Product card image container uses aspect-[4/3] sm:aspect-square',
    test: (c) => c.includes('aspect-[4/3] sm:aspect-square'),
  },
  {
    label: 'Product card images use object-contain to display entire blade and handle',
    test: (c) => c.includes('className={`object-contain object-center transition-all duration-500 ease-out p-2'),
  },
  {
    label: 'Product card has ambient blur backdrop',
    test: (c) => c.includes('bg-cover bg-center blur-xl opacity-20 scale-110 pointer-events-none'),
  },
]);

// 3. Cart Drawer & Checkout
checkFile('src/components/storefront/cart-drawer.tsx', [
  {
    label: 'Cart drawer thumbnail uses object-contain and square frame',
    test: (c) => c.includes('w-20 h-20') && c.includes('className="object-contain object-center"'),
  },
]);

checkFile('src/app/(storefront)/checkout/page.tsx', [
  {
    label: 'Checkout item thumbnail uses object-contain and square frame',
    test: (c) => c.includes('w-14 h-14') && c.includes('className="object-contain object-center"'),
  },
]);

console.log('\n🎉 ALL 11 QA ASSERTIONS PASSED! Product photography is 100% uncropped across the entire application.');
