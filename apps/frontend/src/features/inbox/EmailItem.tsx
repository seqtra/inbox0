'use client';

import React, { useState } from 'react';
import type { Email } from '@email-whatsapp-bridge/shared';
import { useAnalyzeEmailMutation } from '@/entities/email/api/emailApi';
import { useCreateTrelloCardMutation } from '@/entities/trello/api/trelloApi';

export interface EmailItemProps {
  email: Email;
  trelloListId: string;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export function EmailItem({ email, trelloListId }: EmailItemProps) {
  const [analyzeEmail, { isLoading: isAnalyzing }] = useAnalyzeEmailMutation();
  const [createCard, { isLoading: isCreating }] =
    useCreateTrelloCardMutation();
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const isLoading = isAnalyzing || isCreating;
  const disabled = !trelloListId.trim() || isLoading;

  const handleSendToTrello = async () => {
    if (!trelloListId.trim()) return;
    setStatus('sending');
    try {
      let description = email.snippet || email.body?.slice(0, 500) || '';
      try {
        const analysis = await analyzeEmail(email).unwrap();
        if (analysis?.success && analysis?.data?.summary) {
          description = [
            analysis.data.summary,
            analysis.data.priority && `Priority: ${analysis.data.priority}`,
            analysis.data.actionItems?.length
              ? `Actions: ${analysis.data.actionItems.join(', ')}`
              : '',
          ]
            .filter(Boolean)
            .join('\n\n');
        }
      } catch {
        // Use snippet/body if analyze fails
      }
      await createCard({
        listId: trelloListId.trim(),
        title: email.subject || '(No subject)',
        description,
      }).unwrap();
      setStatus('sent');
    } catch {
      setStatus('error');
    }
  };

  return (
    <li className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-navy" title={email.subject}>
            {email.subject || '(No subject)'}
          </p>
          <p className="truncate text-sm text-gray-mid" title={email.from}>
            {email.from}
          </p>
          <p className="mt-1 text-xs text-gray-mid">
            {formatDate(email.date)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2 pt-2 sm:pt-0">
          <button
            type="button"
            onClick={handleSendToTrello}
            disabled={disabled}
            className="inline-flex items-center gap-1.5 rounded-lg bg-whatsapp-green px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-whatsapp-green/90 disabled:opacity-50 disabled:pointer-events-none"
          >
            {isLoading ? (
              <>Sending…</>
            ) : status === 'sent' ? (
              <>Sent ✓</>
            ) : (
              <>Send to Trello</>
            )}
          </button>
          {status === 'error' && (
            <span className="text-xs text-red-600">Failed</span>
          )}
        </div>
      </div>
    </li>
  );
}
