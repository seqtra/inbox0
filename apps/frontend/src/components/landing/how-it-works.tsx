'use client';

import React, { useId } from 'react';
import { motion } from 'framer-motion';

import { cn } from '@/shared/lib/utils';

/** Single step in the how-it-works section */
export interface HowItWorksStep {
  number: string;
  title: string;
  description: string;
  /** Inline SVG or icon element (e.g. from a component). Use useId() for gradient IDs inside. */
  icon: React.ReactNode;
}

export interface HowItWorksProps {
  className?: string;
  /** Section id for anchor links */
  id?: string;
  title?: string;
  subtitle?: string;
  steps?: HowItWorksStep[];
}

/** Step 1 icon (email) - requires gradient id */
function Step1Icon({ gradientId }: { gradientId: string }) {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden>
      <rect
        width="48"
        height="48"
        rx="12"
        fill={`url(#${gradientId})`}
        opacity="0.1"
      />
      <path
        d="M14 18L24 25L34 18"
        stroke={`url(#${gradientId})`}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="14"
        y="16"
        width="20"
        height="16"
        rx="2"
        stroke={`url(#${gradientId})`}
        strokeWidth="2.5"
        fill="none"
      />
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="48" y2="48">
          <stop stopColor="#FF6B58" />
          <stop offset="1" stopColor="#FFB4A9" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** Step 2 icon (preferences/settings) - requires gradient id */
function Step2Icon({ gradientId }: { gradientId: string }) {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden>
      <rect
        width="48"
        height="48"
        rx="12"
        fill={`url(#${gradientId})`}
        opacity="0.1"
      />
      <circle
        cx="24"
        cy="24"
        r="10"
        stroke={`url(#${gradientId})`}
        strokeWidth="2.5"
      />
      <circle cx="24" cy="24" r="3" fill={`url(#${gradientId})`} />
      <path
        d="M24 14V18M24 30V34M34 24H30M18 24H14"
        stroke={`url(#${gradientId})`}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="48" y2="48">
          <stop stopColor="#C4B5FD" />
          <stop offset="1" stopColor="#E5D4FF" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** Step 3 icon (WhatsApp summary) - no gradient */
function Step3Icon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden>
      <rect
        width="48"
        height="48"
        rx="12"
        fill="#25D366"
        opacity="0.1"
      />
      <rect
        x="12"
        y="10"
        width="24"
        height="28"
        rx="3"
        stroke="#25D366"
        strokeWidth="2.5"
      />
      <path
        d="M18 20H30M18 24H30M18 28H26"
        stroke="#25D366"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="32" cy="14" r="4" fill="#25D366" />
    </svg>
  );
}

const DEFAULT_STEPS: (idPrefix: string) => HowItWorksStep[] = (idPrefix) => [
  {
    number: '01',
    title: 'Connect Your Email',
    description:
      'Securely link your email account in seconds. We support Gmail, Outlook, and all major providers.',
    icon: <Step1Icon gradientId={`${idPrefix}-gradient1`} />,
  },
  {
    number: '02',
    title: 'Define Your Preferences',
    description:
      'Tell us what matters to you. Important clients? Specific keywords? Our AI learns your priorities.',
    icon: <Step2Icon gradientId={`${idPrefix}-gradient2`} />,
  },
  {
    number: '03',
    title: 'Receive Smart Summaries',
    description:
      'Get instant WhatsApp notifications with AI-generated summaries of your important emails. Tap to read the full email.',
    icon: <Step3Icon />,
  },
];

export function HowItWorks({
  className,
  id = 'how-it-works',
  title = 'How it works',
  subtitle = 'Three simple steps to achieve inbox-0 and never miss what matters',
  steps,
}: HowItWorksProps) {
  const uid = useId();
  const idPrefix = `how-it-works-${uid.replace(/:/g, '')}`;
  const stepList = steps ?? DEFAULT_STEPS(idPrefix);

  return (
    <section
      id={id}
      className={cn('relative bg-white py-[calc(6rem*1.5)]', className)}
    >
      <div className="container relative mx-auto max-w-[1280px] px-8">
        <motion.div
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-display text-[clamp(2rem,4vw,3.5rem)] font-bold tracking-tight text-navy">
            {title}
          </h2>
          <p className="mx-auto mt-4 max-w-prose text-xl text-gray-dark">
            {subtitle}
          </p>
        </motion.div>

        <div className="relative z-[2] grid grid-cols-1 gap-8 md:max-w-[500px] md:mx-auto lg:max-w-none lg:grid-cols-3 lg:gap-12">
          {stepList.map((step, index) => (
            <motion.div
              key={step.number}
              className="flex flex-col items-center rounded-2xl border-2 border-gray-light bg-white px-6 py-10 text-center transition-all duration-300 hover:-translate-y-2 hover:border-coral-vivid hover:shadow-landing-float sm:px-8 sm:py-10"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
            >
              <div className="font-display absolute -top-4 left-1/2 -translate-x-1/2 bg-white px-4 text-2xl font-extrabold text-coral-light">
                {step.number}
              </div>
              <div className="my-6">{step.icon}</div>
              <h3 className="font-display text-xl font-bold text-navy sm:text-2xl md:mb-4">
                {step.title}
              </h3>
              <p className="text-base leading-relaxed text-gray-dark sm:text-[1rem]">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="absolute left-1/2 top-[180px] z-[1] hidden h-0.5 w-[60%] -translate-x-1/2 origin-left bg-gradient-to-r from-coral-vivid via-purple-light to-whatsapp-green opacity-30 lg:block"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.5 }}
        />
      </div>
    </section>
  );
}
