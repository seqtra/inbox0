'use client';

import React, { useState } from 'react';
import {
  useGetEmailsQuery,
  useSyncEmailsMutation,
} from '@/entities/email/api/emailApi';
import { EmailItem } from './EmailItem';

export function EmailList() {
  const [trelloListId, setTrelloListId] = useState('');
  const { data, isLoading, isError, error } = useGetEmailsQuery();
  const [syncEmails, { isLoading: isSyncing }] = useSyncEmailsMutation();

  const emails = data?.success && data?.data ? data.data : [];
  const hasEmails = emails.length > 0;

  return (
    <div className="space-y-6">
      {/* Trello List ID + Sync */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 flex-1">
            <label
              htmlFor="trello-list-id"
              className="mb-1 block text-sm font-medium text-navy"
            >
              Trello List ID
            </label>
            <input
              id="trello-list-id"
              type="text"
              value={trelloListId}
              onChange={(e) => setTrelloListId(e.target.value)}
              placeholder="Paste your Trello list ID (from list URL)"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-navy placeholder:text-gray-mid focus:border-coral-vivid focus:outline-none focus:ring-1 focus:ring-coral-vivid"
            />
          </div>
          <button
            type="button"
            onClick={() => syncEmails()}
            disabled={isSyncing}
            className="shrink-0 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-navy transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            {isSyncing ? 'Syncing…' : 'Sync emails'}
          </button>
        </div>
      </div>

      {/* Email list */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-navy">Emails</h2>
        {isLoading && (
          <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-gray-mid">
            Loading emails…
          </p>
        )}
        {isError && (
          <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error && 'status' in error
              ? `Could not load emails (${error.status}). You may need to connect Gmail or sign in again.`
              : 'Failed to load emails.'}
          </p>
        )}
        {!isLoading && !isError && !hasEmails && (
          <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-gray-mid">
            No emails yet. Click &quot;Sync emails&quot; to fetch from Gmail.
          </p>
        )}
        {!isLoading && !isError && hasEmails && (
          <ul className="space-y-3">
            {emails.map((email) => (
              <EmailItem
                key={email.id}
                email={email}
                trelloListId={trelloListId}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
