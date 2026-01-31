'use client';

import React, { useState } from 'react';
import type { Email, EmailSummary } from '@email-whatsapp-bridge/shared';
import { useAnalyzeEmailMutation } from '@/entities/email/api/emailApi';
import { useCreateTrelloCardMutation } from '@/entities/trello/api/trelloApi';

export interface EmailItemProps {
  email: Email;
  trelloListId: string;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

function formatRelativeTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

function getSenderName(from: string): string {
  const match = from.match(/^([^<]+)/);
  if (match) {
    const name = match[1].trim().replace(/"/g, '');
    if (name && !name.includes('@')) return name;
  }
  return from.split('@')[0].split('<').pop() || from;
}

function getSenderEmail(from: string): string {
  const match = from.match(/<([^>]+)>/);
  return match ? match[1] : from;
}

function getInitials(name: string): string {
  if (!name || !name.trim()) return '';
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .join('')
    .toUpperCase()
    .slice(0, 2);
  return initials || '';
}

// Generate a consistent color based on sender
function getAvatarColor(email: string): string {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-teal-500',
    'bg-indigo-500',
    'bg-rose-500',
  ];
  const hash = email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

function PriorityBadge({ priority }: { priority?: EmailSummary['priority'] }) {
  if (!priority) return null;
  
  const styles = {
    urgent: 'bg-red-100 text-red-700 border-red-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    low: 'bg-gray-100 text-gray-600 border-gray-200',
  };

  const labels = {
    urgent: 'Urgent',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${styles[priority]}`}>
      {labels[priority]}
    </span>
  );
}

function CategoryBadge({ labels }: { labels: string[] }) {
  // Map Gmail labels to display categories
  const categoryMap: Record<string, { label: string; color: string }> = {
    'CATEGORY_PROMOTIONS': { label: 'Promo', color: 'bg-purple-100 text-purple-700' },
    'CATEGORY_SOCIAL': { label: 'Social', color: 'bg-blue-100 text-blue-700' },
    'CATEGORY_UPDATES': { label: 'Update', color: 'bg-green-100 text-green-700' },
    'CATEGORY_FORUMS': { label: 'Forum', color: 'bg-orange-100 text-orange-700' },
    'IMPORTANT': { label: 'Important', color: 'bg-red-100 text-red-700' },
    'STARRED': { label: '★', color: 'bg-yellow-100 text-yellow-700' },
  };

  const displayLabels = labels
    .filter((l) => categoryMap[l])
    .slice(0, 2);

  if (displayLabels.length === 0) return null;

  return (
    <div className="flex gap-1">
      {displayLabels.map((label) => (
        <span
          key={label}
          className={`inline-flex items-center rounded px-1 py-0.5 text-[10px] font-medium ${categoryMap[label].color}`}
        >
          {categoryMap[label].label}
        </span>
      ))}
    </div>
  );
}

export function EmailItem({ email, trelloListId, isExpanded, onToggleExpand }: EmailItemProps) {
  const [analyzeEmail, { isLoading: isAnalyzing }] = useAnalyzeEmailMutation();
  const [createCard, { isLoading: isCreating }] = useCreateTrelloCardMutation();
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [analysis, setAnalysis] = useState<EmailSummary | null>(null);

  const isLoading = isAnalyzing || isCreating;
  const disabled = !trelloListId.trim() || isLoading;
  const senderName = getSenderName(email.from);
  const senderEmail = getSenderEmail(email.from);

  const handleAnalyze = async () => {
    try {
      const result = await analyzeEmail(email).unwrap();
      if (result?.success && result?.data) {
        setAnalysis(result.data);
      }
    } catch (err) {
      console.error('Failed to analyze:', err);
    }
  };

  const handleSendToTrello = async () => {
    if (!trelloListId.trim()) return;
    setStatus('sending');
    try {
      let description = email.snippet || email.body?.slice(0, 500) || '';
      
      if (analysis) {
        description = [
          analysis.summary,
          analysis.priority && `Priority: ${analysis.priority}`,
          analysis.actionItems?.length
            ? `Actions:\n${analysis.actionItems.map(a => `• ${a}`).join('\n')}`
            : '',
        ]
          .filter(Boolean)
          .join('\n\n');
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
    <div 
      className={`group transition-colors ${
        !email.isRead ? 'bg-blue-50/50' : 'bg-white'
      } ${isExpanded ? 'bg-gray-50' : 'hover:bg-gray-50/80'}`}
    >
      {/* Main Row */}
      <div 
        className="flex items-center gap-3 px-4 py-3 cursor-pointer"
        onClick={onToggleExpand}
      >
        {/* Avatar */}
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${getAvatarColor(senderEmail)}`}>
          {getInitials(senderName) || (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`truncate text-sm ${!email.isRead ? 'font-semibold text-navy' : 'font-medium text-gray-dark'}`}>
              {senderName}
            </span>
            <CategoryBadge labels={email.labels} />
            {analysis && <PriorityBadge priority={analysis.priority} />}
          </div>
          <p className={`truncate text-sm ${!email.isRead ? 'font-medium text-gray-dark' : 'text-gray-mid'}`}>
            {email.subject || '(No subject)'}
          </p>
          <p className="truncate text-xs text-gray-mid">
            {email.snippet}
          </p>
        </div>

        {/* Time & Actions */}
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="text-xs text-gray-mid">
            {formatRelativeTime(email.date)}
          </span>
          {email.hasAttachments && (
            <svg className="h-4 w-4 text-gray-mid" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          )}
        </div>

        {/* Chevron */}
        <svg 
          className={`h-4 w-4 text-gray-mid transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor" 
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-light/50 bg-gray-50 px-4 py-4">
          {/* Email Preview */}
          <div className="mb-4 rounded-lg bg-white p-4 text-sm text-gray-dark border border-gray-light/50">
            <div className="mb-2 text-xs text-gray-mid">
              From: {email.from}
            </div>
            <div className="whitespace-pre-wrap line-clamp-6">
              {email.body || email.snippet}
            </div>
          </div>

          {/* AI Analysis */}
          {analysis && (
            <div className="mb-4 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 p-4 border border-purple-100">
              <div className="mb-2 flex items-center gap-2">
                <svg className="h-4 w-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span className="text-sm font-medium text-purple-700">AI Analysis</span>
                <PriorityBadge priority={analysis.priority} />
              </div>
              <p className="text-sm text-gray-dark">{analysis.summary}</p>
              {analysis.actionItems.length > 0 && (
                <div className="mt-3">
                  <p className="mb-1 text-xs font-medium text-purple-700">Action Items:</p>
                  <ul className="space-y-1">
                    {analysis.actionItems.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-gray-dark">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-400" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="inline-flex items-center gap-1.5 rounded-lg bg-purple-100 px-3 py-2 text-xs font-medium text-purple-700 transition-colors hover:bg-purple-200 disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Analyzing...
                </>
              ) : (
                <>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  {analysis ? 'Re-analyze' : 'Analyze with AI'}
                </>
              )}
            </button>
            
            <button
              type="button"
              onClick={handleSendToTrello}
              disabled={disabled}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                status === 'sent'
                  ? 'bg-green-100 text-green-700'
                  : status === 'error'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-navy text-white hover:bg-gray-dark disabled:opacity-40'
              }`}
            >
              {isCreating ? (
                <>
                  <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Sending...
                </>
              ) : status === 'sent' ? (
                <>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Sent to Trello
                </>
              ) : status === 'error' ? (
                <>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Failed - Retry
                </>
              ) : (
                <>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Send to Trello
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
