'use client';

import React from 'react';
import { motion } from 'framer-motion';

import { cn } from '@/shared/lib/utils';

/** Bento card variant: stat (big number + label) or benefit (title + description) */
export type FeatureCardType = 'stat' | 'benefit';

/** Bento card color variant */
export type FeatureCardColor =
  | 'yellow'
  | 'green'
  | 'purple'
  | 'pink'
  | 'lavender'
  | 'peach'
  | 'white';

/** Bento card size in the grid */
export type FeatureCardSize = 'medium' | 'large';

/** Single stat card (value + label) */
export interface FeatureStatCard {
  type: 'stat';
  value: string;
  label: string;
  color: FeatureCardColor;
  size: FeatureCardSize;
}

/** Benefit card (title + description) */
export interface FeatureBenefitCard {
  type: 'benefit';
  title: string;
  description: string;
  color: FeatureCardColor;
  size: FeatureCardSize;
}

export type FeatureCard = FeatureStatCard | FeatureBenefitCard;

export interface FeaturesProps {
  className?: string;
  /** Section title */
  title?: string;
  /** Section subtitle */
  subtitle?: string;
  /** Bento grid cards */
  cards?: FeatureCard[];
}

const DEFAULT_CARDS: FeatureCard[] = [
  { type: 'stat', value: '5hrs', label: 'saved daily', color: 'yellow', size: 'medium' },
  { type: 'stat', value: '99%', label: 'accuracy rate', color: 'green', size: 'medium' },
  {
    type: 'benefit',
    title: 'AI-powered filtering learns your preferences',
    description:
      'Our smart AI understands what matters to you and gets better every day.',
    color: 'white',
    size: 'large',
  },
  {
    type: 'benefit',
    title: 'Instant WhatsApp notifications',
    description:
      'Get summaries on the platform you already use. No new apps needed.',
    color: 'purple',
    size: 'large',
  },
  { type: 'stat', value: '1k+', label: 'happy users', color: 'pink', size: 'medium' },
  { type: 'stat', value: '2min', label: 'setup time', color: 'lavender', size: 'medium' },
  {
    type: 'benefit',
    title: 'Never miss important emails again',
    description:
      'Priority detection ensures urgent messages always reach you first.',
    color: 'white',
    size: 'large',
  },
  {
    type: 'benefit',
    title: 'Bank-level security',
    description:
      'GDPR compliant with end-to-end encryption. Your data stays private.',
    color: 'peach',
    size: 'large',
  },
];

const BENTO_COLOR_CLASSES: Record<FeatureCardColor, string> = {
  yellow:
    'border-[rgba(255,239,153,0.4)] bg-gradient-to-br from-[#ffef99] to-[#fff8cc] hover:border-[#ffef99]',
  green:
    'border-[rgba(183,239,178,0.4)] bg-gradient-to-br from-[#b7efb2] to-[#d4f5d2] hover:border-[#b7efb2]',
  purple:
    'border-[rgba(204,177,247,0.4)] bg-gradient-to-br from-[#ccb1f7] to-[#e0d4fa] hover:border-[#ccb1f7]',
  pink:
    'border-[rgba(255,215,240,0.4)] bg-gradient-to-br from-[#ffd7f0] to-[#ffe8f7] hover:border-[#ffd7f0]',
  lavender:
    'border-[rgba(204,177,247,0.4)] bg-gradient-to-br from-[#ccb1f7] to-[#dcc9f5] hover:border-[#ccb1f7]',
  peach:
    'border-[rgba(255,215,240,0.4)] bg-gradient-to-br from-[#ffd7f0] to-[#ffe3f4] hover:border-[#ffd7f0]',
  white:
    'border-purple-light/20 bg-white shadow-landing-sm hover:border-purple-light',
};

function isStatCard(card: FeatureCard): card is FeatureStatCard {
  return card.type === 'stat';
}

export function Features({
  className,
  title = 'Everything you need to tame your inbox',
  subtitle = 'Real results from real users',
  cards = DEFAULT_CARDS,
}: FeaturesProps) {
  return (
    <section
      className={cn(
        'relative bg-bg-warm py-[calc(6rem*1.5)]',
        className
      )}
    >
      <div className="mx-auto max-w-[1440px] px-8">
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

        <div className="grid grid-cols-1 grid-rows-auto gap-4 sm:grid-cols-2 sm:gap-5 md:grid-cols-3 md:gap-5 lg:grid-cols-4 lg:auto-rows-[200px] lg:gap-6">
          {cards.map((card, index) => (
            <motion.div
              key={index}
              className={cn(
                'relative flex flex-col justify-center overflow-hidden rounded-2xl border-2 p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-landing-float',
                'before:pointer-events-none before:absolute before:-top-1/2 before:-right-1/2 before:h-[200px] before:w-[200px] before:rounded-full before:bg-[radial-gradient(circle,rgba(255,255,255,0.3)_0%,transparent_70%)] before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100',
                card.size === 'medium' && 'lg:col-span-1 lg:row-span-1',
                card.size === 'large' && 'lg:col-span-2 lg:row-span-1',
                BENTO_COLOR_CLASSES[card.color]
              )}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
            >
              {isStatCard(card) ? (
                <>
                  <div className="font-display text-[clamp(2rem,10vw,3rem)] font-extrabold leading-none tracking-tight text-navy sm:text-[clamp(2.5rem,8vw,4rem)] md:text-[clamp(3rem,6vw,5rem)]">
                    {card.value}
                  </div>
                  <div className="mt-2 font-body text-lg font-medium text-gray-dark md:text-[1.125rem]">
                    {card.label}
                  </div>
                </>
              ) : (
                <>
                  <h3 className="font-display text-xl font-bold leading-snug text-navy sm:text-2xl">
                    {card.title}
                  </h3>
                  <p className="mt-3 text-base leading-relaxed text-gray-dark">
                    {card.description}
                  </p>
                </>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
