import React from 'react';
import Link from 'next/link';

interface FooterProps {
  logoText?: string;
  enableSocialLinks?: boolean;
  enableInstagram?: boolean;
  enableTiktok?: boolean;
  enableYoutube?: boolean;
  enableWhatsApp?: boolean;
  whatsappNumber?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  youtubeUrl?: string;
  legalName?: string;
}

export function Footer({
  logoText = 'PAIRS',
  enableSocialLinks = true,
  enableInstagram = true,
  enableTiktok = true,
  enableYoutube = true,
  enableWhatsApp = true,
  whatsappNumber = '+923001234567',
  instagramUrl = '',
  tiktokUrl = '',
  youtubeUrl = '',
  legalName = 'Pairs Knife & Sword Co.',
}: FooterProps) {
  // Notice: 'Contact information' is removed from policies array as requested
  const policies = [
    { label: 'Privacy policy', href: '/policies/privacy-policy' },
    { label: 'Refund policy', href: '/policies/refund-policy' },
    { label: 'Shipping policy', href: '/policies/shipping-policy' },
    { label: 'Track order', href: '/track' },
    { label: 'Terms of service', href: '/policies/terms-of-service' },
  ];

  // Clean WhatsApp number
  let cleanWhatsApp = (whatsappNumber || '').replace(/[^0-9]/g, '');
  if (cleanWhatsApp.startsWith('0')) cleanWhatsApp = '92' + cleanWhatsApp.slice(1);
  const whatsappUrl = `https://wa.me/${cleanWhatsApp}`;

  return (
    <footer className="w-full bg-white border-t border-neutral-100 py-12 px-4 sm:px-6 lg:px-8 mt-20">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        {/* Brand & Policies */}
        <div className="space-y-4">
          <Link href="/" className="inline-block">
            <span className="font-extrabold text-xl tracking-[0.25em] uppercase text-black font-sans">
              {logoText}
            </span>
          </Link>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-neutral-500 font-light">
            {policies.map((p) => (
              <Link
                key={p.label}
                href={p.href}
                className="hover:text-black transition-colors"
              >
                {p.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Social Channel SVG Glyphs & Copyright */}
        <div className="flex flex-col md:items-end space-y-4">
          {enableSocialLinks && (
            <div className="flex items-center space-x-5 text-neutral-800">
              {/* Instagram SVG Icon */}
              {enableInstagram && Boolean(instagramUrl?.trim()) && (
                <a
                  href={instagramUrl.trim()}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${legalName} Instagram`}
                  title="Instagram"
                  className="p-1 text-neutral-700 hover:text-black transition-colors hover:scale-110 active:scale-95"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                  </svg>
                </a>
              )}

              {/* YouTube SVG Icon */}
              {enableYoutube && Boolean(youtubeUrl?.trim()) && (
                <a
                  href={youtubeUrl.trim()}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${legalName} YouTube`}
                  title="YouTube"
                  className="p-1 text-neutral-700 hover:text-black transition-colors hover:scale-110 active:scale-95"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="21"
                    height="21"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
                    <path d="m10 15 5-3-5-3z" fill="currentColor" />
                  </svg>
                </a>
              )}

              {/* TikTok SVG Icon */}
              {enableTiktok && Boolean(tiktokUrl?.trim()) && (
                <a
                  href={tiktokUrl.trim()}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${legalName} TikTok`}
                  title="TikTok"
                  className="p-1 text-neutral-700 hover:text-black transition-colors hover:scale-110 active:scale-95"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="19"
                    height="19"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.12V9.42a6.33 6.33 0 0 0-.86-.06 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 10.82 4.47 6.27 6.27 0 0 0 1.86-4.47V8.7a8.28 8.28 0 0 0 5.17 1.8V7.05a4.83 4.83 0 0 1-1.4-.36z" />
                  </svg>
                </a>
              )}

              {/* WhatsApp SVG Icon */}
              {enableWhatsApp && (
                <a
                  href={cleanWhatsApp ? whatsappUrl : 'https://wa.me/923001234567'}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${legalName} WhatsApp`}
                  title="WhatsApp"
                  className="p-1 text-neutral-700 hover:text-black transition-colors hover:scale-110 active:scale-95"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="19"
                    height="19"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2ZM12.04 20.16C10.56 20.16 9.11 19.76 7.85 19.01L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.8 7.37 7.5 3.67 12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.16 12.04 20.16ZM16.56 14.39C16.31 14.26 15.09 13.66 14.86 13.58C14.63 13.49 14.47 13.45 14.3 13.7C14.14 13.95 13.67 14.51 13.52 14.68C13.38 14.84 13.23 14.87 12.98 14.74C12.74 14.62 11.95 14.36 11.01 13.52C10.28 12.87 9.78 12.06 9.64 11.81C9.5 11.56 9.62 11.43 9.75 11.3C9.86 11.19 10 11.01 10.12 10.87C10.25 10.72 10.29 10.62 10.37 10.45C10.45 10.29 10.41 10.14 10.35 10.02C10.29 9.89 9.79 8.67 9.59 8.17C9.39 7.69 9.18 7.75 9.03 7.74C8.88 7.74 8.72 7.73 8.55 7.73C8.39 7.73 8.12 7.79 7.89 8.04C7.67 8.29 7.03 8.89 7.03 10.11C7.03 11.33 7.92 12.51 8.04 12.67C8.17 12.84 9.78 15.32 12.24 16.38C12.83 16.63 13.28 16.78 13.64 16.89C14.23 17.08 14.76 17.05 15.19 16.99C15.66 16.92 16.64 16.4 16.85 15.82C17.05 15.24 17.05 14.74 16.99 14.64C16.93 14.53 16.81 14.47 16.56 14.39Z" />
                  </svg>
                </a>
              )}
            </div>
          )}
          <div className="text-[11px] text-neutral-400">
            &copy; {new Date().getFullYear()}, {legalName}. Powered by Abdullah Hanjra.
          </div>
        </div>
      </div>
    </footer>
  );
}
