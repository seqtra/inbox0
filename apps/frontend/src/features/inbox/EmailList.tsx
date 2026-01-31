'use client';

import React, { useState, useMemo } from 'react';
import {
  useGetEmailsQuery,
  useSyncEmailsMutation,
  useSummarizeInboxMutation,
} from '@/entities/email/api/emailApi';
import { EmailItem } from './EmailItem';
import type { InboxSummary } from '@email-whatsapp-bridge/shared';

type FilterType = 'all' | 'unread' | 'important' | 'attachments';

export function EmailList() {
  const [trelloListId, setTrelloListId] = useState('');
  const [inboxSummary, setInboxSummary] = useState<InboxSummary | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [expandedEmailId, setExpandedEmailId] = useState<string | null>(null);
  
  const { data, isLoading, isError } = useGetEmailsQuery();
  const [syncEmails, { isLoading: isSyncing }] = useSyncEmailsMutation();
  const [summarizeInbox, { isLoading: isSummarizing }] = useSummarizeInboxMutation();

  const emails = data?.success && data?.data ? data.data : [];
  
  // Filter and search emails
  const filteredEmails = useMemo(() => {
    let result = emails;
    
    // Apply filter
    switch (activeFilter) {
      case 'unread':
        result = result.filter((e) => !e.isRead);
        break;
      case 'important':
        result = result.filter((e) => e.labels.includes('IMPORTANT') || e.labels.includes('STARRED'));
        break;
      case 'attachments':
        result = result.filter((e) => e.hasAttachments);
        break;
    }
    
    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.subject.toLowerCase().includes(query) ||
          e.from.toLowerCase().includes(query) ||
          e.snippet.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [emails, activeFilter, searchQuery]);

  const hasEmails = emails.length > 0;
  const unreadCount = emails.filter((e) => !e.isRead).length;

  const handleSummarize = async () => {
    try {
      const result = await summarizeInbox().unwrap();
      if (result.success && result.data) {
        setInboxSummary(result.data);
      }
    } catch (err) {
      console.error('Failed to summarize inbox:', err);
    }
  };

  const filters: { key: FilterType; label: string; count?: number }[] = [
    { key: 'all', label: 'All', count: emails.length },
    { key: 'unread', label: 'Unread', count: unreadCount },
    { key: 'important', label: 'Important' },
    { key: 'attachments', label: 'With Files' },
  ];

  return (
    <div className="space-y-6">
      {/* Search & Actions Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-mid"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search emails..."
            className="w-full rounded-lg border border-gray-light bg-white py-2.5 pl-10 pr-4 text-sm text-navy placeholder:text-gray-mid focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => syncEmails()}
            disabled={isSyncing}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-light bg-white px-4 py-2.5 text-sm font-medium text-navy transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            <svg
              className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {isSyncing ? 'Syncing...' : 'Sync'}
          </button>
          
          <button
            type="button"
            onClick={handleSummarize}
            disabled={isSummarizing || !hasEmails}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:from-purple-700 hover:to-blue-700 disabled:opacity-40"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            {isSummarizing ? 'Summarizing...' : 'AI Summary'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {filters.map((filter) => (
          <button
            key={filter.key}
            type="button"
            onClick={() => setActiveFilter(filter.key)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activeFilter === filter.key
                ? 'bg-navy text-white'
                : 'bg-white text-gray-dark border border-gray-light hover:bg-gray-50'
            }`}
          >
            {filter.label}
            {filter.count !== undefined && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-xs ${
                  activeFilter === filter.key
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-light text-gray-mid'
                }`}
              >
                {filter.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Trello Integration */}
      <div className="flex items-center gap-3 rounded-lg bg-white p-4 border border-gray-light/50 shadow-sm">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
          <svg className="h-5 w-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm-9 14H7V7h3v10zm7-5h-3V7h3v5z" />
          </svg>
        </div>
        <div className="flex-1">
          <label htmlFor="trello-list-id" className="block text-sm font-medium text-navy">
            Trello List ID
          </label>
          <input
            id="trello-list-id"
            type="text"
            value={trelloListId}
            onChange={(e) => setTrelloListId(e.target.value)}
            placeholder="Enter your Trello list ID to send emails"
            className="mt-1 w-full rounded border-0 bg-transparent p-0 text-sm text-gray-dark placeholder:text-gray-mid focus:outline-none focus:ring-0"
          />
        </div>
        {trelloListId && (
          <span className="shrink-0 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
            Connected
          </span>
        )}
      </div>

      {/* Inbox Summary */}
      {inboxSummary && (
        <div className="rounded-xl bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-6 border border-purple-100 shadow-sm">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-purple-600 to-blue-600">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-navy">AI Inbox Summary</h3>
                <p className="text-xs text-gray-mid">
                  {inboxSummary.totalEmails} emails analyzed
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setInboxSummary(null)}
              className="rounded-lg p-1.5 text-gray-mid hover:bg-white/50 hover:text-navy"
              aria-label="Dismiss"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p className="mb-4 text-sm leading-relaxed text-gray-dark">{inboxSummary.summary}</p>

          <div className="grid gap-4 sm:grid-cols-2">
            {inboxSummary.urgentItems.length > 0 && (
              <div className="rounded-lg bg-red-50 p-4 border border-red-100">
                <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-red-700">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Urgent Items
                </p>
                <ul className="space-y-1.5">
                  {inboxSummary.urgentItems.slice(0, 3).map((item, idx) => (
                    <li key={idx} className="text-xs text-red-700">• {item}</li>
                  ))}
                </ul>
              </div>
            )}

            {inboxSummary.highlights.length > 0 && (
              <div className="rounded-lg bg-blue-50 p-4 border border-blue-100">
                <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-700">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  Key Highlights
                </p>
                <ul className="space-y-1.5">
                  {inboxSummary.highlights.slice(0, 3).map((item, idx) => (
                    <li key={idx} className="text-xs text-blue-700">• {item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {inboxSummary.topSenders.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-gray-mid">Top senders:</span>
              {inboxSummary.topSenders.slice(0, 5).map((sender, idx) => (
                <span
                  key={idx}
                  className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-gray-dark border border-gray-light"
                >
                  {sender}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Email List */}
      <div className="overflow-hidden rounded-xl border border-gray-light bg-white shadow-sm">
        {isLoading && (
          <div className="flex flex-col items-center justify-center px-6 py-16">
            <div className="relative mb-4">
              <div className="h-12 w-12 rounded-full border-4 border-gray-light"></div>
              <div className="absolute left-0 top-0 h-12 w-12 animate-spin rounded-full border-4 border-transparent border-t-navy"></div>
            </div>
            <p className="animate-pulse text-sm font-medium text-gray-mid">Loading your emails...</p>
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="mb-2 font-medium text-navy">Couldn&apos;t load emails</p>
            <p className="text-sm text-gray-mid">Please try signing in again</p>
          </div>
        )}

        {!isLoading && !isError && !hasEmails && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="mb-2 font-medium text-navy">No emails yet</p>
            <p className="mb-4 text-sm text-gray-mid">Click Sync to fetch your emails from Gmail</p>
            <button
              type="button"
              onClick={() => syncEmails()}
              disabled={isSyncing}
              className="inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-dark"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Sync Emails
            </button>
          </div>
        )}

        {!isLoading && !isError && hasEmails && filteredEmails.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="mb-2 font-medium text-navy">No matching emails</p>
            <p className="text-sm text-gray-mid">Try adjusting your search or filters</p>
          </div>
        )}

        {!isLoading && !isError && filteredEmails.length > 0 && (
          <div className="divide-y divide-gray-light/50">
            {filteredEmails.map((email) => (
              <EmailItem
                key={email.id}
                email={email}
                trelloListId={trelloListId}
                isExpanded={expandedEmailId === email.id}
                onToggleExpand={() => setExpandedEmailId(expandedEmailId === email.id ? null : email.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
