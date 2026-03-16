'use client';

import React, { useState, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { cn } from '@/shared/lib/utils';
import type { FAQItem } from '@/shared/lib/schemas';

export interface FAQProps {
  className?: string;
  /** Section id for anchor links */
  id?: string;
  title?: string;
  subtitle?: string;
  items?: FAQItem[];
}

/** Default FAQ content for landing – also used for FAQPage schema */
export const LANDING_FAQ_ITEMS: FAQItem[] = [
  {
    question: 'How does AI email filtering work?',
    answer:
      'inbox-0 connects to your Gmail via secure OAuth and uses AI to learn which emails matter to you. It analyzes senders, subject lines, and content to identify important messages (clients, deadlines, invoices) and sends short summaries only for those to your WhatsApp. The rest stay in your inbox for later.',
  },
  {
    question: 'Is inbox-0 secure?',
    answer:
      'Yes. We use Google OAuth so we never see or store your password. Email content is processed for summarization and not retained. We use industry-standard encryption and comply with best practices for handling email data.',
  },
  {
    question: 'How long does setup take?',
    answer:
      'Setup takes about 2 minutes: connect your Gmail account, link your WhatsApp number, and you’re done. You’ll start receiving summaries for important emails right away. The AI gets better over time as it learns your preferences.',
  },
  {
    question: 'Which email providers are supported?',
    answer:
      'Currently we support Gmail. Support for other providers may be added in the future. If you use Gmail for work or personal email, you can connect it and start filtering today.',
  },
  {
    question: 'Can I customize which emails go to WhatsApp?',
    answer:
      'Yes. The AI learns from your behavior and you can fine-tune preferences. You can prioritize certain senders, keywords, or categories so the most relevant emails are summarized and sent to WhatsApp first.',
  },
  {
    question: 'How much does it cost?',
    answer:
      'We offer a 14-day free trial with no credit card required. After that, pricing is simple and transparent—check our signup page for current plans. There are no hidden fees.',
  },
];

function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
      className={cn('shrink-0 transition-transform duration-200', open && 'rotate-180')}
    >
      <path
        d="M5 7.5L10 12.5L15 7.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function FAQ({
  className,
  id = 'faq',
  title = 'Frequently Asked Questions',
  subtitle = 'Everything you need to know about inbox-0',
  items = LANDING_FAQ_ITEMS,
}: FAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const headingId = useId();

  return (
    <section id={id} className={cn('bg-white py-[calc(6rem*1.5)]', className)}>
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

        <div className="mx-auto max-w-[720px]">
          {items.map((item, index) => {
            const isOpen = openIndex === index;
            const triggerId = `${headingId}-${index}`;
            const panelId = `${headingId}-${index}-panel`;

            return (
              <motion.div
                key={item.question}
                className="border-b border-gray-light last:border-b-0"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
              >
                <button
                  type="button"
                  id={triggerId}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  className="flex w-full items-center justify-between gap-4 py-6 text-left font-body text-lg font-semibold text-navy transition-colors hover:text-coral-vivid"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                >
                  {item.question}
                  <ChevronDown open={isOpen} />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={panelId}
                      role="region"
                      aria-labelledby={triggerId}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <p className="pb-6 text-[0.9375rem] leading-relaxed text-gray-dark">
                        {item.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
