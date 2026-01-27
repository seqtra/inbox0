'use client';

import React, { Suspense } from 'react';

import {
  Navigation,
  Hero,
  Features,
  HowItWorks,
  Testimonials,
  FinalCTA,
  Footer,
} from '@/components/landing';

function LandingContent() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-bg-warm">
      <Navigation />
      <main>
        <Hero />
        <Features />
        <HowItWorks id="how-it-works" />
        <Testimonials />
        <FinalCTA />
        <Footer />
      </main>
    </div>
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
