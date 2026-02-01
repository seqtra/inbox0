'use client';

import React from 'react';
import { motion } from 'framer-motion';

import { cn } from '@/shared/lib/utils';
import { StructuredData } from '@/components/seo';
import { generateReviewSchema } from '@/shared/lib/schemas';

/** Single testimonial card data */
export interface TestimonialCard {
  quote: string;
  author: string;
  /** Optional job title */
  role?: string;
  /** Optional company name */
  company?: string;
  /** Avatar initials (e.g. "GD") - shown in a circle when no image */
  avatar: string;
  /** Optional image URL - if provided, use next/image for the avatar */
  imageUrl?: string;
}

export interface TestimonialsProps {
  className?: string;
  title?: string;
  subtitle?: string;
  items?: TestimonialCard[];
  /** Social proof line (e.g. "4.9/5 from 1,000+ reviews") */
  socialProofText?: string;
}

const DEFAULT_TESTIMONIALS: TestimonialCard[] = [
  {
    quote:
      "inbox-0 has completely changed how I manage my email. I used to spend 2 hours a day in my inbox, now it's just 15 minutes.",
    author: 'Gabriel Dantas',
    role: 'Lead Software Engineer',
    company: '',
    avatar: 'GD',
  },
  {
    quote:
      "The AI is surprisingly accurate. It knows which clients are important and never lets me miss a deadline. It's like having a personal assistant.",
    author: 'Thomas Baker',
    role: '',
    company: 'Hospitality Business',
    avatar: 'TB',
  },
  {
    quote:
      "I love getting the WhatsApp summaries. I can triage my emails during my commute without even opening my laptop. Game changer.",
    author: 'Thomas Kousholt',
    role: 'Serial Entrepreneur',
    company: '',
    avatar: 'TK',
  },
];

function QuoteIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden>
      <path
        d="M10 18C10 15.7909 11.7909 14 14 14V10C9.58172 10 6 13.5817 6 18V22H14V18H10Z"
        fill="currentColor"
        opacity="0.2"
      />
      <path
        d="M24 18C24 15.7909 25.7909 14 28 14V10C23.5817 10 20 13.5817 20 18V22H28V18H24Z"
        fill="currentColor"
        opacity="0.2"
      />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
        fill="#FFB800"
      />
    </svg>
  );
}

/** Format "role, company" with empty parts omitted */
function formatRoleCompany(role?: string, company?: string): string {
  const parts = [role, company].filter(Boolean);
  return parts.join(', ');
}

export function Testimonials({
  className,
  title = 'Loved by busy professionals',
  subtitle = "Join thousands of users who've achieved inbox-0",
  items = DEFAULT_TESTIMONIALS,
  socialProofText = '4.9/5 from 1,000+ reviews',
}: TestimonialsProps) {
  // Generate review schemas for each testimonial
  const reviewSchemas = items.map((item) =>
    generateReviewSchema({
      author: item.author,
      role: item.role,
      company: item.company,
      quote: item.quote,
      rating: 5, // All testimonials are 5-star reviews
    })
  );

  return (
    <>
      {/* Schema.org Review structured data */}
      <StructuredData schemas={reviewSchemas} />

      <section className={cn('bg-white py-[calc(6rem*1.5)]', className)}>
      <div className="container mx-auto max-w-[1280px] px-8">
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

        <div className="mb-12 grid grid-cols-1 gap-6 md:mx-auto md:max-w-[600px] lg:max-w-none lg:grid-cols-3 lg:gap-8">
          {items.map((item, index) => (
            <motion.article
              key={item.author}
              className="flex flex-col gap-6 rounded-landing-lg border-2 border-gray-light bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-coral-light hover:shadow-landing-float md:p-8"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
            >
              <div className="text-coral-light" aria-hidden>
                <QuoteIcon />
              </div>
              <blockquote className="flex-1 text-lg leading-relaxed text-navy md:text-[1.125rem]">
                &ldquo;{item.quote}&rdquo;
              </blockquote>
              <div className="flex items-center gap-4">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-coral-vivid to-purple-light text-sm font-semibold text-white"
                  aria-hidden
                >
                  {item.avatar}
                </div>
                <div className="flex flex-col gap-1">
                  <cite className="not-italic font-semibold text-navy">
                    {item.author}
                  </cite>
                  {(item.role || item.company) && (
                    <div className="text-sm text-gray-mid">
                      {formatRoleCompany(item.role, item.company)}
                    </div>
                  )}
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        <motion.div
          className="flex items-center justify-center rounded-landing-lg bg-gradient-to-br from-coral-light/10 to-purple-light/10 px-8 py-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <div className="flex flex-wrap items-center justify-center gap-3">
            <StarIcon />
            <StarIcon />
            <StarIcon />
            <StarIcon />
            <StarIcon />
            <span className="font-semibold text-navy md:text-lg">
              {socialProofText}
            </span>
          </div>
        </motion.div>
      </div>
      </section>
    </>
  );
}
