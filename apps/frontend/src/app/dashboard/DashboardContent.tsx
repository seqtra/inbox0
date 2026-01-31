'use client';

import React, { useState } from 'react';
import {
  DashboardNavigation,
  DashboardTabs,
  SummariesTab,
  CalendarTab,
  IntegrationsTab,
  PreferencesTab,
} from '@/components/dashboard';
import type { DashboardTab } from '@/components/dashboard';
import { EmailList } from '@/features/inbox/EmailList';

export function DashboardContent() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('summaries');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      <DashboardNavigation />

      {/* Tabs Navigation */}
      <div className="pt-16">
        <DashboardTabs activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      <main className="py-8">
        <div className="container mx-auto max-w-6xl px-4">
          {/* Summaries Tab - Default */}
          {activeTab === 'summaries' && <SummariesTab />}

          {/* Emails Tab */}
          {activeTab === 'emails' && <EmailList />}

          {/* Calendar Tab */}
          {activeTab === 'calendar' && <CalendarTab />}

          {/* Integrations Tab */}
          {activeTab === 'integrations' && <IntegrationsTab />}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && <PreferencesTab />}
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="border-t border-gray-light bg-white py-6">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2 text-sm text-gray-mid">
              <svg width="20" height="20" viewBox="0 0 32 32" fill="none" aria-hidden>
                <rect width="32" height="32" rx="8" fill="currentColor" className="text-navy" />
                <path
                  d="M8 12L16 18L24 12"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M16 18V8" stroke="white" strokeWidth="2" strokeLinecap="round" />
                <circle cx="16" cy="22" r="2" fill="white" />
              </svg>
              <span className="font-medium text-navy">inbox-0</span>
              <span>•</span>
              <span>Your AI email assistant</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-mid">
              <a href="/blog" className="hover:text-navy">Blog</a>
              <a href="#" className="hover:text-navy">Help</a>
              <a href="#" className="hover:text-navy">Privacy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
