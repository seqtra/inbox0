'use client';

import React from 'react';
import { motion } from 'framer-motion';
import posthog from 'posthog-js';

import { cn } from '@/shared/lib/utils';

/** Single feature bullet (e.g. "14-day free trial") */
export interface FinalCTAFeature {
  label: string;
}

export interface FinalCTAProps {
  className?: string;
  /** Badge text above the title */
  badgeText?: string;
  title?: string;
  description?: string;
  /** Primary CTA button label */
  ctaLabel?: string;
  /** Tally form id (data-tally-open) */
  tallyFormId?: string;
  /** Bullet points below the button */
  features?: FinalCTAFeature[];
}

const DEFAULT_FEATURES: FinalCTAFeature[] = [
  { label: '14-day free trial' },
  { label: 'Cancel anytime' },
  { label: '24/7 support' },
];

function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M7 10L9 12L13 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BadgeCheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="10" cy="10" r="8" fill="currentColor" opacity="0.2" />
      <path
        d="M7 10L9 12L13 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function FinalCTA({
  className,
  badgeText = 'No credit card required',
  title = 'Ready to achieve inbox-0?',
  description = "Join over 100s of professionals who've reclaimed their time and focus. Start your free trial today.",
  ctaLabel = 'Get Early Access',
  tallyFormId = 'VLzVvN',
  features = DEFAULT_FEATURES,
}: FinalCTAProps) {
  return (
    <section
      className={cn(
        'relative overflow-hidden bg-bg-warm py-[calc(6rem*1.5)]',
        'hero-gradient-bg',
        className
      )}
    >
      <div className="container mx-auto max-w-[1280px] px-8">
        <motion.div
          className="mx-auto flex max-w-[700px] flex-col items-center gap-8 rounded-2xl border-2 border-purple-light/20 bg-white/90 px-6 py-12 text-center shadow-landing-float backdrop-blur-[20px] md:px-8 md:py-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 rounded-landing-full bg-whatsapp-green px-6 py-3 text-[0.9375rem] font-semibold text-white">
            <BadgeCheckIcon />
            <span>{badgeText}</span>
          </div>

          <h2 className="font-display text-[clamp(2rem,4vw,3rem)] font-bold leading-tight text-navy">
            {title}
          </h2>

          <p className="max-w-[600px] text-xl text-gray-dark md:text-[1.25rem]">
            {description}
          </p>

          <div className="flex gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-landing-full border-2 border-transparent bg-navy px-8 py-3.5 font-body text-base font-semibold text-white shadow-landing-md transition-all duration-300 hover:-translate-y-0.5 hover:border-purple-light hover:bg-gray-dark hover:shadow-landing-lg"
              data-tally-open={tallyFormId}
              data-tally-emoji-text="👋"
              data-tally-emoji-animation="wave"
              onClick={() => posthog.capture('cta_get_early_access_click', { location: 'final_cta' })}
            >
              {ctaLabel}
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
                <path
                  d="M4 10H16M16 10L11 5M16 10L11 15"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-6 sm:gap-8">
            {features.map((f) => (
              <div
                key={f.label}
                className="flex items-center gap-2 text-[0.9375rem] font-medium text-gray-dark"
              >
                <span className="shrink-0 text-whatsapp-green">
                  <CheckIcon />
                </span>
                <span>{f.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
