'use client';

import React from 'react';
import Link from 'next/link';

import { cn } from '@/shared/lib/utils';

/** Link item for a footer column */
export interface FooterLinkItem {
  label: string;
  href: string;
  /** If true, open in new tab and treat as external */
  external?: boolean;
}

/** Footer column (e.g. Product, Legal) */
export interface FooterColumn {
  title: string;
  links: FooterLinkItem[];
}

/** Social link (icon + href) */
export interface FooterSocialLink {
  href: string;
  ariaLabel: string;
  icon: React.ReactNode;
}

export interface FooterProps {
  className?: string;
  /** Brand/logo text */
  logoText?: string;
  /** Short description under the logo */
  description?: string;
  /** Columns of links */
  columns?: FooterColumn[];
  /** Social links (e.g. X/Twitter) */
  socialLinks?: FooterSocialLink[];
  /** Copyright line */
  copyright?: string;
}

const DEFAULT_COLUMNS: FooterColumn[] = [
  {
    title: 'Product',
    links: [
      { label: 'How it Works', href: '#how-it-works' },
      { label: 'Blog', href: '/blog' },
    ],
  },
];

function LogoIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden>
      <rect width="32" height="32" rx="8" fill="currentColor" />
      <path
        d="M8 12L16 18L24 12"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 18V8"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="16" cy="22" r="2" fill="white" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M11.9 8.8L19 0h-1.7l-6.2 7.2L6.3 0H0l7.5 10.9L0 20h1.7l6.5-7.5L13.4 20H20L11.9 8.8zm-2.3 2.6l-.8-1.1L2.3 1.3h2.6l5 7.2.8 1.1 6.4 9.2h-2.6l-5.3-7.6z" />
    </svg>
  );
}

const DEFAULT_SOCIAL: FooterSocialLink[] = [
  {
    href: '#',
    ariaLabel: 'X',
    icon: <XIcon />,
  },
];

export function Footer({
  className,
  logoText = 'inbox-0',
  description = 'AI-powered email filtering that delivers what matters to your WhatsApp.',
  columns = DEFAULT_COLUMNS,
  socialLinks = DEFAULT_SOCIAL,
  copyright = '© 2026 inbox-0. All rights reserved.',
}: FooterProps) {
  return (
    <footer
      className={cn(
        'bg-navy text-white pb-8 pt-16',
        className
      )}
    >
      <div className="container mx-auto max-w-[1280px] px-8">
        <div className="mb-16 grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-12 lg:gap-12">
          <div className="max-w-[300px] md:col-span-1">
            <Link
              href="/"
              className="mb-4 flex items-center gap-3 text-white no-underline"
            >
              <div className="text-white">
                <LogoIcon />
              </div>
              <span className="font-display text-xl font-bold tracking-tight">
                {logoText}
              </span>
            </Link>
            <p className="mb-6 text-[0.9375rem] leading-relaxed text-white/70">
              {description}
            </p>
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.ariaLabel}
                  href={social.href}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white no-underline transition-all hover:-translate-y-0.5 hover:bg-coral-vivid"
                  aria-label={social.ariaLabel}
                  {...(social.href.startsWith('http') && {
                    target: '_blank',
                    rel: 'noopener noreferrer',
                  })}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-x-12 gap-y-8">
          {columns.map((col) => (
            <div key={col.title} className="min-w-[120px]">
              <h4 className="mb-5 text-base font-semibold text-white">
                {col.title}
              </h4>
              <ul className="flex list-none flex-col gap-3 p-0 m-0">
                {col.links.map((link) => (
                  <li key={link.href}>
                    {link.external || link.href.startsWith('http') ? (
                      <a
                        href={link.href}
                        className="text-[0.9375rem] text-white/70 no-underline transition-colors hover:text-white"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {link.label}
                      </a>
                    ) : link.href.startsWith('#') ? (
                      <a
                        href={link.href}
                        className="text-[0.9375rem] text-white/70 no-underline transition-colors hover:text-white"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-[0.9375rem] text-white/70 no-underline transition-colors hover:text-white"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row sm:text-left">
          <p className="text-sm text-white/60 m-0">{copyright}</p>
        </div>
      </div>
    </footer>
  );
}
