'use client';

import React, { useId } from 'react';
import { motion } from 'framer-motion';

import { cn } from '@/shared/lib/utils';

/** Stat item for the hero stats row */
export interface HeroStat {
  value: string;
  label: string;
}

export interface HeroProps {
  /** Optional className for the section wrapper */
  className?: string;
  /** Badge text above the title */
  badgeText?: string;
  /** Title line 1 */
  titleLine1?: string;
  /** Title line 2 */
  titleLine2?: string;
  /** Title highlight (e.g. "WhatsApp") - gets gradient styling */
  titleHighlight?: string;
  /** Hero description paragraph */
  description?: string;
  /** CTA button label */
  ctaLabel?: string;
  /** CTA Tally form id (data-tally-open) - optional */
  tallyFormId?: string;
  /** Stats displayed below CTA */
  stats?: HeroStat[];
  /** Whether to show the visual (floating cards) - default true */
  showVisual?: boolean;
}

const DEFAULT_STATS: HeroStat[] = [
  { value: '1k+', label: 'Users' },
  { value: '500k+', label: 'Emails Filtered' },
  { value: '5hrs', label: 'Saved Daily' },
];

export function Hero({
  className,
  badgeText = 'AI-Powered Email Intelligence',
  titleLine1 = 'Important emails,',
  titleLine2 = 'delivered to your',
  titleHighlight = 'WhatsApp',
  description = 'Stop drowning in your inbox. inbox-0 uses AI to learn what matters to you and delivers smart email summaries right to WhatsApp. Get to zero, stay focused.',
  ctaLabel = 'Get Early Access',
  tallyFormId = 'VLzVvN',
  stats = DEFAULT_STATS,
  showVisual = true,
}: HeroProps) {
  const id = useId();
  const lineGradient1 = `lineGradient1-${id}`;
  const lineGradient2 = `lineGradient2-${id}`;
  const aiGradient = `aiGradient-${id}`;

  return (
    <section
      className={cn(
        'flex min-h-screen items-center overflow-hidden pt-[100px] relative',
        'hero-gradient-bg',
        className
      )}
    >
      <div className="container mx-auto max-w-[1280px] px-8">
        <div className="relative z-10 grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
          {/* Text block */}
          <motion.div
            className="max-w-[600px] lg:max-w-[600px]"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-landing-full bg-navy px-4 py-2 text-sm font-semibold text-white shadow-landing-sm">
              <span
                className="h-2 w-2 rounded-full bg-whatsapp-green animate-pulse-badge"
                aria-hidden
              />
              {badgeText}
            </div>

            <h1 className="font-display mt-6 text-[clamp(2.5rem,5vw,4.5rem)] font-extrabold leading-[1.1] tracking-tight text-navy">
              {titleLine1}
              <br />
              {titleLine2}
              <br />
              <span className="bg-gradient-text-hero bg-clip-text text-transparent">
                {titleHighlight}
              </span>
            </h1>

            <p className="mt-4 mb-8 text-xl leading-relaxed text-gray-dark">
              {description}
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-landing-full border-2 border-transparent bg-navy px-8 py-3.5 font-body text-base font-semibold text-white shadow-landing-md transition-all duration-300 hover:-translate-y-0.5 hover:border-purple-light hover:bg-gray-dark hover:shadow-landing-lg"
                data-tally-open={tallyFormId}
                data-tally-emoji-text="👋"
                data-tally-emoji-animation="wave"
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

            <div className="mt-12 flex items-center gap-8 rounded-landing-lg border-2 border-purple-light/20 bg-white/80 px-8 py-6 shadow-landing-sm backdrop-blur-[20px] max-md:flex-col max-md:items-start max-md:gap-6">
              {stats.map((stat, index) => (
                <React.Fragment key={stat.label}>
                  <div className="flex flex-col gap-1">
                    <div className="font-display text-[1.75rem] font-bold leading-none text-navy">
                      {stat.value}
                    </div>
                    <div className="text-sm font-medium text-gray-mid">
                      {stat.label}
                    </div>
                  </div>
                  {index < stats.length - 1 && (
                    <div
                      className="h-10 w-px bg-gray-light max-md:hidden"
                      aria-hidden
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </motion.div>

          {/* Visual: floating cards */}
          {showVisual && (
            <motion.div
              className="relative h-[350px] sm:h-[400px] md:h-[500px] lg:h-[600px]"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <div className="relative h-full w-full">
                {/* Email card */}
                <motion.div
                  className="absolute left-5 top-[50px] z-[2] md:left-5 lg:left-5"
                  animate={{ y: [0, -20, 0] }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <div className="flex min-w-[160px] items-center gap-4 rounded-landing-lg border-2 border-purple-light/15 bg-white p-4 shadow-landing-float transition-transform duration-300 hover:scale-105 md:min-w-[200px] md:p-5">
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden>
                      <rect width="32" height="32" rx="8" fill="#FF6B58" />
                      <path
                        d="M8 12L16 17L24 12"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <rect
                        x="8"
                        y="10"
                        width="16"
                        height="12"
                        rx="2"
                        stroke="white"
                        strokeWidth="2"
                        fill="none"
                      />
                    </svg>
                    <div className="flex flex-col gap-1">
                      <div className="text-[0.9375rem] font-semibold text-navy">
                        Incoming Email
                      </div>
                      <div className="text-[0.8125rem] text-gray-mid">
                        1250 unread
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* AI card */}
                <motion.div
                  className="absolute left-1/2 top-1/2 z-[2] flex -translate-x-1/2 -translate-y-1/2 md:top-[45%]"
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <div className="flex min-w-[180px] flex-col items-center rounded-landing-lg border-2 border-purple-light/30 bg-gradient-to-br from-purple-light/15 to-green-light/15 p-6 shadow-landing-float backdrop-blur-[20px] transition-transform duration-300 hover:scale-105">
                    <div className="mb-3">
                      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden>
                        <circle
                          cx="20"
                          cy="20"
                          r="18"
                          fill={`url(#${aiGradient})`}
                          opacity="0.2"
                        />
                        <circle
                          cx="20"
                          cy="20"
                          r="12"
                          fill={`url(#${aiGradient})`}
                        />
                        <path
                          d="M20 14V26M14 20H26"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <defs>
                          <linearGradient
                            id={aiGradient}
                            x1="0"
                            y1="0"
                            x2="40"
                            y2="40"
                          >
                            <stop stopColor="#C4B5FD" />
                            <stop offset="1" stopColor="#FF6B58" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                    <div className="mb-3 text-[0.9375rem] font-semibold text-navy">
                      AI Filtering
                    </div>
                    <div className="h-1 w-full overflow-hidden rounded-full bg-purple-light/20">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-purple-light to-green-light"
                        animate={{ width: ['0%', '100%'] }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                      />
                    </div>
                  </div>
                </motion.div>

                {/* WhatsApp card */}
                <motion.div
                  className="absolute bottom-10 right-5 z-[2] md:bottom-[40px] md:right-2.5 lg:bottom-20 lg:right-5"
                  animate={{ y: [0, -15, 0] }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: 0.5,
                  }}
                >
                  <div className="flex min-w-[220px] flex-col gap-3 rounded-landing-lg border-2 border-purple-light/15 bg-white p-4 shadow-landing-float transition-transform duration-300 hover:scale-105 md:min-w-[280px] md:p-5">
                    <div className="flex items-center gap-2 text-[0.9375rem] font-semibold text-navy">
                      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
                        <rect width="28" height="28" rx="6" fill="#25D366" />
                        <path
                          d="M14 6C9.58 6 6 9.58 6 14C6 15.34 6.36 16.6 7 17.68L6.2 20.8L9.42 20.02C10.46 20.6 11.68 21 14 21C18.42 21 22 17.42 22 14C22 9.58 18.42 6 14 6Z"
                          fill="white"
                        />
                        <path
                          d="M11 12.5C11 12.22 11.22 12 11.5 12H12.5C12.78 12 13 12.22 13 12.5V15.5C13 15.78 12.78 16 12.5 16H11.5C11.22 16 11 15.78 11 15.5V12.5ZM15 12.5C15 12.22 15.22 12 15.5 12H16.5C16.78 12 17 12.22 17 12.5V15.5C17 15.78 16.78 16 16.5 16H15.5C15.22 16 15 15.78 15 15.5V12.5Z"
                          fill="#25D366"
                        />
                      </svg>
                      <span>inbox-0</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="inline-flex self-start rounded-lg bg-whatsapp-green px-3 py-1.5 text-[0.8125rem] font-semibold text-white">
                        3 important emails
                      </div>
                      <div className="text-sm leading-relaxed text-gray-dark">
                        • Client Tallo LLC meeting confirmed
                        <br />
                        • Invoice #2008 for consulting services payment due
                        <br />
                        • Loan project deadline update to January 31, 2026
                      </div>
                    </div>
                    <div className="text-right text-xs text-gray-mid">
                      Just now
                    </div>
                  </div>
                </motion.div>

                {/* Connection lines SVG */}
                <svg
                  className="pointer-events-none absolute inset-0 z-[1] h-full w-full"
                  viewBox="0 0 400 300"
                  fill="none"
                  aria-hidden
                >
                  <motion.path
                    d="M100 80 Q200 80 250 150"
                    stroke={`url(#${lineGradient1})`}
                    strokeWidth="2"
                    strokeDasharray="5,5"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                  <motion.path
                    d="M250 150 Q300 150 320 220"
                    stroke={`url(#${lineGradient2})`}
                    strokeWidth="2"
                    strokeDasharray="5,5"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: 0.5,
                    }}
                  />
                  <defs>
                    <linearGradient id={lineGradient1}>
                      <stop stopColor="#FF6B58" stopOpacity="0.5" />
                      <stop offset="1" stopColor="#C4B5FD" stopOpacity="0.5" />
                    </linearGradient>
                    <linearGradient id={lineGradient2}>
                      <stop stopColor="#C4B5FD" stopOpacity="0.5" />
                      <stop offset="1" stopColor="#25D366" stopOpacity="0.5" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
