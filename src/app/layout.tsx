import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/lib/cart-context';
import { prisma } from '@/lib/db';

export async function generateMetadata(): Promise<Metadata> {
  let storeName = 'Pairs Blades';
  try {
    const store = await prisma.store.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { name: true },
    });
    if (store?.name?.trim()) {
      storeName = store.name.trim();
    }
  } catch {
    // Fallback to default brand title when DB is unreachable during static build
  }

  return {
    title: `${storeName} | Handcrafted Knives, Cutlery & Swords`,
    description:
      'Master craftsmanship. Unrivaled edge retention. Premium handcrafted Damascus knives, chef cutlery, and swords with nationwide cash on delivery.',
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var cleanNode = function(node) {
                    if (node && node.nodeType === 1) {
                      if (node.hasAttribute('bis_skin_checked')) node.removeAttribute('bis_skin_checked');
                      if (node.hasAttribute('bis_register')) node.removeAttribute('bis_register');
                    }
                  };
                  var observer = new MutationObserver(function(mutations) {
                    for (var i = 0; i < mutations.length; i++) {
                      var m = mutations[i];
                      if (m.type === 'attributes') {
                        var attr = m.attributeName;
                        if (attr === 'bis_skin_checked' || attr === 'bis_register' || (attr && attr.indexOf('__processed_') === 0)) {
                          m.target.removeAttribute(attr);
                        }
                      } else if (m.type === 'childList') {
                        for (var j = 0; j < m.addedNodes.length; j++) {
                          var n = m.addedNodes[j];
                          if (n.nodeType === 1) {
                            cleanNode(n);
                            if (n.querySelectorAll) {
                              var els = n.querySelectorAll('[bis_skin_checked],[bis_register]');
                              for (var k = 0; k < els.length; k++) cleanNode(els[k]);
                            }
                          }
                        }
                      }
                    }
                  });
                  observer.observe(document.documentElement, {
                    attributes: true,
                    subtree: true,
                    childList: true,
                    attributeFilter: ['bis_skin_checked', 'bis_register']
                  });
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className="min-h-screen bg-white text-black antialiased selection:bg-black selection:text-white"
      >
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
