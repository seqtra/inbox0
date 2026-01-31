'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';

type SummaryFrequency = 'realtime' | 'hourly' | 'daily' | 'weekly';
type Priority = 'low' | 'medium' | 'high' | 'urgent';

interface Preferences {
  summaryFrequency: SummaryFrequency;
  summaryTime: string;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  importantSenders: string[];
  importantKeywords: string[];
  priorityThreshold: Priority;
  notifyOnUrgent: boolean;
  notifyOnHighPriority: boolean;
  digestIncludeCount: number;
  timezone: string;
}

const defaultPreferences: Preferences = {
  summaryFrequency: 'daily',
  summaryTime: '09:00',
  quietHoursEnabled: true,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
  importantSenders: [],
  importantKeywords: [],
  priorityThreshold: 'medium',
  notifyOnUrgent: true,
  notifyOnHighPriority: false,
  digestIncludeCount: 20,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
};

export function PreferencesTab() {
  const { data: session } = useSession();
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);
  const [newSender, setNewSender] = useState('');
  const [newKeyword, setNewKeyword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const addSender = () => {
    if (newSender.trim() && !preferences.importantSenders.includes(newSender.trim())) {
      setPreferences({
        ...preferences,
        importantSenders: [...preferences.importantSenders, newSender.trim()],
      });
      setNewSender('');
    }
  };

  const removeSender = (sender: string) => {
    setPreferences({
      ...preferences,
      importantSenders: preferences.importantSenders.filter((s) => s !== sender),
    });
  };

  const addKeyword = () => {
    if (newKeyword.trim() && !preferences.importantKeywords.includes(newKeyword.trim())) {
      setPreferences({
        ...preferences,
        importantKeywords: [...preferences.importantKeywords, newKeyword.trim()],
      });
      setNewKeyword('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setPreferences({
      ...preferences,
      importantKeywords: preferences.importantKeywords.filter((k) => k !== keyword),
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-navy">Preferences</h2>
          <p className="text-sm text-gray-mid">
            Customize how inbox-0 works for you
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-gray-dark disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Saving...
            </>
          ) : saveSuccess ? (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Saved!
            </>
          ) : (
            'Save Changes'
          )}
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Summary Settings */}
        <div className="rounded-xl border border-gray-light bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
              <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-navy">Summary Settings</h3>
              <p className="text-xs text-gray-mid">Configure how often you receive summaries</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-navy mb-2">
                Summary Frequency
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['realtime', 'hourly', 'daily', 'weekly'] as SummaryFrequency[]).map((freq) => (
                  <button
                    key={freq}
                    type="button"
                    onClick={() => setPreferences({ ...preferences, summaryFrequency: freq })}
                    className={`rounded-lg border px-4 py-2.5 text-sm font-medium capitalize transition-colors ${
                      preferences.summaryFrequency === freq
                        ? 'border-navy bg-navy text-white'
                        : 'border-gray-light bg-white text-gray-dark hover:border-gray-mid'
                    }`}
                  >
                    {freq}
                  </button>
                ))}
              </div>
            </div>

            {preferences.summaryFrequency === 'daily' && (
              <div>
                <label className="block text-sm font-medium text-navy mb-2">
                  Daily Summary Time
                </label>
                <input
                  type="time"
                  value={preferences.summaryTime}
                  onChange={(e) => setPreferences({ ...preferences, summaryTime: e.target.value })}
                  className="w-full rounded-lg border border-gray-light px-4 py-2.5 text-sm text-navy focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-navy mb-2">
                Emails to Include
              </label>
              <input
                type="range"
                min="5"
                max="50"
                step="5"
                value={preferences.digestIncludeCount}
                onChange={(e) => setPreferences({ ...preferences, digestIncludeCount: parseInt(e.target.value) })}
                className="w-full accent-navy"
              />
              <div className="mt-1 flex justify-between text-xs text-gray-mid">
                <span>5 emails</span>
                <span className="font-medium text-navy">{preferences.digestIncludeCount} emails</span>
                <span>50 emails</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="rounded-xl border border-gray-light bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-navy">Notifications</h3>
              <p className="text-xs text-gray-mid">Control when and how you get notified</p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-navy">Urgent emails</p>
                <p className="text-xs text-gray-mid">Get notified immediately for urgent items</p>
              </div>
              <button
                type="button"
                onClick={() => setPreferences({ ...preferences, notifyOnUrgent: !preferences.notifyOnUrgent })}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  preferences.notifyOnUrgent ? 'bg-navy' : 'bg-gray-light'
                }`}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                    preferences.notifyOnUrgent ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </label>

            <label className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-navy">High priority</p>
                <p className="text-xs text-gray-mid">Notify for high priority emails</p>
              </div>
              <button
                type="button"
                onClick={() => setPreferences({ ...preferences, notifyOnHighPriority: !preferences.notifyOnHighPriority })}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  preferences.notifyOnHighPriority ? 'bg-navy' : 'bg-gray-light'
                }`}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                    preferences.notifyOnHighPriority ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </label>

            <div className="border-t border-gray-light pt-4">
              <label className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-navy">Quiet hours</p>
                  <p className="text-xs text-gray-mid">Pause notifications during these hours</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPreferences({ ...preferences, quietHoursEnabled: !preferences.quietHoursEnabled })}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    preferences.quietHoursEnabled ? 'bg-navy' : 'bg-gray-light'
                  }`}
                >
                  <span
                    className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                      preferences.quietHoursEnabled ? 'left-6' : 'left-1'
                    }`}
                  />
                </button>
              </label>

              {preferences.quietHoursEnabled && (
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="time"
                    value={preferences.quietHoursStart}
                    onChange={(e) => setPreferences({ ...preferences, quietHoursStart: e.target.value })}
                    className="flex-1 rounded-lg border border-gray-light px-3 py-2 text-sm text-navy focus:border-navy focus:outline-none"
                  />
                  <span className="text-sm text-gray-mid">to</span>
                  <input
                    type="time"
                    value={preferences.quietHoursEnd}
                    onChange={(e) => setPreferences({ ...preferences, quietHoursEnd: e.target.value })}
                    className="flex-1 rounded-lg border border-gray-light px-3 py-2 text-sm text-navy focus:border-navy focus:outline-none"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Important Senders */}
        <div className="rounded-xl border border-gray-light bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-navy">Important Senders</h3>
              <p className="text-xs text-gray-mid">Emails from these senders are always prioritized</p>
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="email"
              value={newSender}
              onChange={(e) => setNewSender(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addSender()}
              placeholder="Enter email address"
              className="flex-1 rounded-lg border border-gray-light px-4 py-2.5 text-sm text-navy placeholder:text-gray-mid focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
            />
            <button
              type="button"
              onClick={addSender}
              className="rounded-lg bg-navy px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-dark"
            >
              Add
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {preferences.importantSenders.length === 0 ? (
              <p className="text-sm text-gray-mid">No important senders added yet</p>
            ) : (
              preferences.importantSenders.map((sender) => (
                <span
                  key={sender}
                  className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-sm text-green-700"
                >
                  {sender}
                  <button
                    type="button"
                    onClick={() => removeSender(sender)}
                    className="rounded-full p-0.5 hover:bg-green-100"
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))
            )}
          </div>
        </div>

        {/* Important Keywords */}
        <div className="rounded-xl border border-gray-light bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
              <svg className="h-5 w-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-navy">Important Keywords</h3>
              <p className="text-xs text-gray-mid">Emails containing these words are flagged as important</p>
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
              placeholder="Enter keyword"
              className="flex-1 rounded-lg border border-gray-light px-4 py-2.5 text-sm text-navy placeholder:text-gray-mid focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
            />
            <button
              type="button"
              onClick={addKeyword}
              className="rounded-lg bg-navy px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-dark"
            >
              Add
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {preferences.importantKeywords.length === 0 ? (
              <p className="text-sm text-gray-mid">No important keywords added yet</p>
            ) : (
              preferences.importantKeywords.map((keyword) => (
                <span
                  key={keyword}
                  className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1.5 text-sm text-orange-700"
                >
                  {keyword}
                  <button
                    type="button"
                    onClick={() => removeKeyword(keyword)}
                    className="rounded-full p-0.5 hover:bg-orange-100"
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Account Info */}
      <div className="rounded-xl border border-gray-light bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
            <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-navy">Account</h3>
            <p className="text-xs text-gray-mid">Your account information</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {session?.user?.image ? (
            <img
              src={session.user.image}
              alt={session.user.name || 'User'}
              className="h-16 w-16 rounded-full"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-navy text-xl font-bold text-white">
              {session?.user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
          <div>
            <p className="font-semibold text-navy">{session?.user?.name || 'User'}</p>
            <p className="text-sm text-gray-mid">{session?.user?.email}</p>
            <p className="mt-1 text-xs text-gray-mid">
              Timezone: {preferences.timezone}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
