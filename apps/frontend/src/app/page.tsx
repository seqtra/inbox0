'use client';

import React, { Suspense } from 'react';

import {
  Navigation,
  Hero,
  Features,
  HowItWorks,
  Testimonials,
  FAQ,
  FinalCTA,
  Footer,
  LANDING_FAQ_ITEMS,
} from '@/components/landing';
import { StructuredData } from '@/components/seo';
import {
  generateOrganizationSchema,
  generateWebApplicationSchema,
  generateFAQPageSchema,
} from '@/shared/lib/schemas';

function LandingContent() {
  // Generate schemas for SEO
  const organizationSchema = generateOrganizationSchema();
  const webAppSchema = generateWebApplicationSchema();
  const faqSchema = generateFAQPageSchema(LANDING_FAQ_ITEMS);

  return (
    <>
      {/* Schema.org structured data for SEO */}
      <StructuredData schemas={[organizationSchema, webAppSchema, faqSchema]} />

      <div className="min-h-screen overflow-x-hidden bg-bg-warm">
        <Navigation />
        <main>
          <Hero />
          <Features />
          <HowItWorks id="how-it-works" />
          <Testimonials />
          <FAQ id="faq" items={LANDING_FAQ_ITEMS} />
          <FinalCTA />
          <Footer />
        </main>
      </div>
    </>
  );
}

export default function LandingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          Loading...
        </div>
      }
    >
      <LandingContent />
    </Suspense>
  );
}
