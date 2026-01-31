'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  useGetEmailsQuery,
  useSummarizeInboxMutation,
} from '@/entities/email/api/emailApi';
import type { InboxSummary } from '@email-whatsapp-bridge/shared';

export function SummariesTab() {
  const { data: session } = useSession();
  const { data: emailsData, isLoading: isLoadingEmails } = useGetEmailsQuery();
  const [summarizeInbox, { isLoading: isSummarizing }] = useSummarizeInboxMutation();
  const [currentSummary, setCurrentSummary] = useState<InboxSummary | null>(null);
  const [lastSummaryTime, setLastSummaryTime] = useState<Date | null>(null);

  const emails = emailsData?.success && emailsData?.data ? emailsData.data : [];
  const unreadCount = emails.filter((e) => !e.isRead).length;
  const userName = session?.user?.name?.split(' ')[0] || 'there';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const handleGenerateSummary = async () => {
    try {
      const result = await summarizeInbox().unwrap();
      if (result.success && result.data) {
        setCurrentSummary(result.data);
        setLastSummaryTime(new Date());
      }
    } catch (err) {
      console.error('Failed to generate summary:', err);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy via-gray-dark to-purple-900 p-8 text-white">
        <div className="absolute right-0 top-0 h-64 w-64 translate-x-1/3 -translate-y-1/3 rounded-full bg-white/5" />
        <div className="absolute bottom-0 left-0 h-48 w-48 -translate-x-1/3 translate-y-1/3 rounded-full bg-white/5" />
        
        <div className="relative">
          <p className="text-purple-200">{getGreeting()}, {userName}</p>
          <h1 className="mt-1 text-3xl font-bold">Your Inbox at a Glance</h1>
          <p className="mt-2 text-gray-300">
            Get AI-powered insights from your emails without the noise
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={handleGenerateSummary}
              disabled={isSummarizing || emails.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-navy shadow-lg transition-all hover:bg-gray-100 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSummarizing ? (
                <>
                  <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Analyzing emails...
                </>
              ) : (
                <>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Generate Summary
                </>
              )}
            </button>

            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                <div>
                  <p className="font-semibold">{emails.length}</p>
                  <p className="text-xs text-gray-300">Emails</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-coral-vivid/20">
                  <svg className="h-4 w-4 text-coral-vivid" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </span>
                <div>
                  <p className="font-semibold">{unreadCount}</p>
                  <p className="text-xs text-gray-300">Unread</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoadingEmails && (
        <div className="flex flex-col items-center justify-center py-16">
          <svg className="mb-4 h-8 w-8 animate-spin text-navy" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-sm text-gray-mid">Loading your inbox...</p>
        </div>
      )}

      {/* No Emails State */}
      {!isLoadingEmails && emails.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-gray-light bg-white p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-navy">No emails synced yet</h3>
          <p className="mt-2 text-sm text-gray-mid">
            Sync your Gmail to start getting AI-powered summaries
          </p>
          <p className="mt-4 text-xs text-gray-mid">
            Go to the <span className="font-medium text-navy">Emails</span> tab to sync your inbox
          </p>
        </div>
      )}

      {/* Current Summary */}
      {currentSummary && (
        <div className="rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50 via-white to-blue-50 p-6 shadow-sm">
          <div className="mb-6 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 shadow-lg">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-navy">Today&apos;s Summary</h2>
                <p className="text-xs text-gray-mid">
                  {currentSummary.totalEmails} emails analyzed
                  {lastSummaryTime && ` • Generated at ${formatTime(lastSummaryTime)}`}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleGenerateSummary}
              disabled={isSummarizing}
              className="rounded-lg p-2 text-gray-mid transition-colors hover:bg-white hover:text-navy"
              title="Refresh summary"
            >
              <svg className={`h-5 w-5 ${isSummarizing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          {/* Main Summary */}
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-base leading-relaxed text-gray-dark">{currentSummary.summary}</p>
          </div>

          {/* Urgent & Highlights Grid */}
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {/* Urgent Items */}
            {currentSummary.urgentItems.length > 0 && (
              <div className="rounded-xl bg-red-50 p-5 border border-red-100">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">
                    <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-red-800">Needs Attention</h3>
                </div>
                <ul className="space-y-2">
                  {currentSummary.urgentItems.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-red-700">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Highlights */}
            {currentSummary.highlights.length > 0 && (
              <div className="rounded-xl bg-blue-50 p-5 border border-blue-100">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                    <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-blue-800">Highlights</h3>
                </div>
                <ul className="space-y-2">
                  {currentSummary.highlights.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-blue-700">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Category Breakdown & Top Senders */}
          <div className="mt-6 flex flex-wrap items-center gap-6">
            {/* Category Counts */}
            {currentSummary.categoryCounts && Object.keys(currentSummary.categoryCounts).length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-gray-mid">Categories:</span>
                {Object.entries(currentSummary.categoryCounts).map(([category, count]) => (
                  <span
                    key={category}
                    className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700 shadow-sm border border-gray-100"
                  >
                    {category}: {count}
                  </span>
                ))}
              </div>
            )}

            {/* Top Senders */}
            {currentSummary.topSenders.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-gray-mid">Top senders:</span>
                {currentSummary.topSenders.slice(0, 4).map((sender, idx) => (
                  <span
                    key={idx}
                    className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700 shadow-sm border border-gray-100"
                  >
                    {sender}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Share Actions */}
          <div className="mt-6 flex items-center gap-3 border-t border-purple-100 pt-6">
            <span className="text-xs text-gray-mid">Share summary:</span>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#25D366]/10 px-3 py-1.5 text-xs font-medium text-[#25D366] transition-colors hover:bg-[#25D366]/20"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0088cc]/10 px-3 py-1.5 text-xs font-medium text-[#0088cc] transition-colors hover:bg-[#0088cc]/20"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
              Telegram
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy
            </button>
          </div>
        </div>
      )}

      {/* No Summary Yet - Prompt */}
      {!currentSummary && !isLoadingEmails && emails.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Quick Stats */}
          <div className="rounded-2xl border border-gray-light bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-semibold text-navy">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-mid">Total emails</span>
                <span className="font-semibold text-navy">{emails.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-mid">Unread</span>
                <span className="font-semibold text-coral-vivid">{unreadCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-mid">With attachments</span>
                <span className="font-semibold text-navy">
                  {emails.filter((e) => e.hasAttachments).length}
                </span>
              </div>
            </div>
          </div>

          {/* Get Started */}
          <div className="rounded-2xl border-2 border-dashed border-purple-200 bg-purple-50/50 p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
              <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="font-semibold text-navy">Ready to summarize</h3>
            <p className="mt-1 text-sm text-gray-mid">
              Click &quot;Generate Summary&quot; above to get AI-powered insights from your {emails.length} emails
            </p>
            <ul className="mt-4 space-y-2 text-xs text-gray-mid">
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Identify urgent items
              </li>
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Extract key highlights
              </li>
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Categorize by topic
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Tips Section */}
      <div className="rounded-2xl bg-gradient-to-r from-gray-50 to-blue-50/50 p-6 border border-gray-100">
        <h3 className="mb-4 font-semibold text-navy">Tips for better summaries</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
              <span className="text-sm font-bold text-navy">1</span>
            </div>
            <div>
              <p className="text-sm font-medium text-navy">Sync regularly</p>
              <p className="text-xs text-gray-mid">Keep your inbox up to date for accurate summaries</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
              <span className="text-sm font-bold text-navy">2</span>
            </div>
            <div>
              <p className="text-sm font-medium text-navy">Set preferences</p>
              <p className="text-xs text-gray-mid">Mark important senders to prioritize their emails</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
              <span className="text-sm font-bold text-navy">3</span>
            </div>
            <div>
              <p className="text-sm font-medium text-navy">Connect integrations</p>
              <p className="text-xs text-gray-mid">Get summaries delivered to WhatsApp or Telegram</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
