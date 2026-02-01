'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import posthog from 'posthog-js';

import { cn } from '@/shared/lib/utils';

/** Single nav link (internal or anchor) */
export interface NavLinkItem {
  label: string;
  href: string;
  /** If true, use <a> for same-page anchor; otherwise use Next.js Link */
  isAnchor?: boolean;
}

export interface NavigationProps {
  className?: string;
  /** Logo text */
  logoText?: string;
  /** Center nav links */
  links?: NavLinkItem[];
  /** Tally form id for "Get Early Access" button (data-tally-open) */
  tallyFormId?: string;
  /** Login/sign-in URL (e.g. NextAuth signin) */
  loginHref?: string;
  /** Login button label */
  loginLabel?: string;
  /** CTA button label */
  ctaLabel?: string;
  /** Show Log in / Dashboard button (hidden by default until auth is ready) */
  showLoginButton?: boolean;
}

const DEFAULT_LINKS: NavLinkItem[] = [
  { label: 'Product', href: '/', isAnchor: false },
  { label: 'How it Works', href: '#how-it-works', isAnchor: true },
  { label: 'Blog', href: '/blog', isAnchor: false },
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

export function Navigation({
  className,
  logoText = 'inbox-0',
  links = DEFAULT_LINKS,
  tallyFormId = 'VLzVvN',
  loginHref = '/api/auth/signin',
  loginLabel = 'Log in',
  ctaLabel = 'Get Early Access',
  showLoginButton = false,
}: NavigationProps) {
  const { data: session, status } = useSession();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isAuthenticated = status === 'authenticated' && !!session;
  const authHref = isAuthenticated ? '/dashboard' : loginHref;
  const authLabel = isAuthenticated ? 'Dashboard' : loginLabel;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(typeof window !== 'undefined' && window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route/link is used (e.g. hash or path change)
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <nav
      className={cn(
        'fixed left-0 right-0 top-0 z-[1000] py-6 transition-all duration-300',
        isScrolled && 'rounded-b-lg bg-white/95 py-4 shadow-landing-sm backdrop-blur-[20px]',
        className
      )}
    >
      <div className="container mx-auto max-w-[1280px] px-8">
        <div className="flex items-center justify-between gap-8">
          <Link
            href="/"
            className="flex items-center gap-3 text-navy no-underline transition-opacity hover:opacity-80"
            onClick={closeMobileMenu}
          >
            <div className="flex items-center justify-center text-navy">
              <LogoIcon />
            </div>
            <span className="font-display text-2xl font-bold tracking-tight">
              {logoText}
            </span>
          </Link>

          <div
            className={cn(
              'absolute left-0 right-0 top-full flex flex-col gap-6 rounded-b-lg bg-white/98 px-8 py-8 shadow-landing-lg backdrop-blur-[20px] transition-all duration-300 md:static md:flex-1 md:translate-y-0 md:flex-row md:items-center md:justify-center md:gap-8 md:bg-transparent md:p-0 md:opacity-100 md:shadow-none',
              isMobileMenuOpen
                ? 'translate-y-0 opacity-100 pointer-events-auto'
                : 'translate-y-[-20px] opacity-0 pointer-events-none md:pointer-events-auto'
            )}
          >
            {links.map((link) =>
              link.isAnchor ? (
                <a
                  key={link.href}
                  href={link.href}
                  className="font-body text-[0.9375rem] font-medium text-gray-dark no-underline transition-colors hover:text-navy relative after:absolute after:bottom-[-4px] after:left-0 after:h-0.5 after:w-0 after:bg-coral-vivid after:transition-[width] after:duration-300 hover:after:w-full"
                  onClick={closeMobileMenu}
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className="font-body text-[0.9375rem] font-medium text-gray-dark no-underline transition-colors hover:text-navy relative after:absolute after:bottom-[-4px] after:left-0 after:h-0.5 after:w-0 after:bg-coral-vivid after:transition-[width] after:duration-300 hover:after:w-full"
                  onClick={closeMobileMenu}
                >
                  {link.label}
                </Link>
              )
            )}
            {showLoginButton && (
              <Link
                href={authHref}
                className="font-body text-[0.9375rem] font-medium text-gray-dark no-underline transition-colors hover:text-navy md:hidden"
                onClick={closeMobileMenu}
              >
                {authLabel}
              </Link>
            )}
          </div>

          <div className="flex items-center gap-3">
            {showLoginButton && (
              <Link
                href={authHref}
                className="hidden font-body text-[0.9375rem] font-medium text-gray-dark no-underline transition-colors hover:text-navy sm:inline-block"
              >
                {authLabel}
              </Link>
            )}
            <button
              type="button"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-landing-full border-2 border-transparent bg-navy px-6 py-3 font-body text-base font-semibold text-white shadow-landing-md transition-all duration-300 hover:-translate-y-0.5 hover:border-purple-light hover:bg-gray-dark hover:shadow-landing-lg"
              data-tally-open={tallyFormId}
              data-tally-emoji-text="👋"
              data-tally-emoji-animation="wave"
              onClick={() => posthog.capture('cta_get_early_access_click', { location: 'navigation' })}
            >
              {ctaLabel}
            </button>
          </div>

          <button
            type="button"
            className="flex flex-col gap-1.5 border-none bg-transparent p-2 cursor-pointer md:hidden"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
          >
            <span
              className={cn(
                'h-0.5 w-6 rounded-sm bg-navy transition-all',
                isMobileMenuOpen && 'translate-y-2 rotate-45'
              )}
            />
            <span
              className={cn(
                'h-0.5 w-6 rounded-sm bg-navy transition-all',
                isMobileMenuOpen && 'opacity-0'
              )}
            />
            <span
              className={cn(
                'h-0.5 w-6 rounded-sm bg-navy transition-all',
                isMobileMenuOpen && '-translate-y-2 -rotate-45'
              )}
            />
          </button>
        </div>
      </div>
    </nav>
  );
}
