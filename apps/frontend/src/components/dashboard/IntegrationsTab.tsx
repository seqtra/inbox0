'use client';

import React, { useState } from 'react';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  connected: boolean;
  comingSoon?: boolean;
}

const integrations: Integration[] = [
  {
    id: 'gmail',
    name: 'Gmail',
    description: 'Your primary email source. Sync and analyze emails.',
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6">
        <path fill="#EA4335" d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/>
      </svg>
    ),
    color: 'bg-red-50 border-red-200',
    connected: true,
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    description: 'Receive email summaries and alerts via WhatsApp.',
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 text-[#25D366]" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    ),
    color: 'bg-green-50 border-green-200',
    connected: false,
  },
  {
    id: 'telegram',
    name: 'Telegram',
    description: 'Get instant notifications and summaries on Telegram.',
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 text-[#0088cc]" fill="currentColor">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
      </svg>
    ),
    color: 'bg-blue-50 border-blue-200',
    connected: false,
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Share email summaries to Slack channels.',
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6">
        <path fill="#E01E5A" d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z"/>
        <path fill="#36C5F0" d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z"/>
        <path fill="#2EB67D" d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312z"/>
        <path fill="#ECB22E" d="M15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
      </svg>
    ),
    color: 'bg-purple-50 border-purple-200',
    connected: false,
    comingSoon: true,
  },
  {
    id: 'trello',
    name: 'Trello',
    description: 'Create Trello cards from emails and action items.',
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 text-[#0079BF]" fill="currentColor">
        <path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm-9 14H7V7h3v10zm7-5h-3V7h3v5z"/>
      </svg>
    ),
    color: 'bg-sky-50 border-sky-200',
    connected: false,
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Save email summaries and tasks to Notion.',
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
        <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.98-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952l1.448.327s0 .84-1.168.84l-3.22.186c-.094-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.14c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z"/>
      </svg>
    ),
    color: 'bg-gray-50 border-gray-200',
    connected: false,
    comingSoon: true,
  },
];

export function IntegrationsTab() {
  const [connectingId, setConnectingId] = useState<string | null>(null);

  const handleConnect = async (integrationId: string) => {
    setConnectingId(integrationId);
    // Simulate connection
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setConnectingId(null);
    // In real app, would redirect to OAuth or show config modal
  };

  const connectedCount = integrations.filter((i) => i.connected).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-navy">Integrations</h2>
        <p className="text-sm text-gray-mid">
          Connect your favorite apps to enhance your email workflow
        </p>
      </div>

      {/* Stats */}
      <div className="flex gap-4">
        <div className="rounded-xl bg-green-50 px-4 py-3 border border-green-100">
          <p className="text-2xl font-bold text-green-700">{connectedCount}</p>
          <p className="text-xs text-green-600">Connected</p>
        </div>
        <div className="rounded-xl bg-gray-50 px-4 py-3 border border-gray-100">
          <p className="text-2xl font-bold text-gray-700">{integrations.length - connectedCount}</p>
          <p className="text-xs text-gray-600">Available</p>
        </div>
      </div>

      {/* Connected Integrations */}
      {connectedCount > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-navy">Connected</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {integrations
              .filter((i) => i.connected)
              .map((integration) => (
                <div
                  key={integration.id}
                  className={`rounded-xl border-2 p-4 ${integration.color}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white shadow-sm">
                        {integration.icon}
                      </div>
                      <div>
                        <h4 className="font-semibold text-navy">{integration.name}</h4>
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                          Connected
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="rounded-lg p-1.5 text-gray-mid hover:bg-white/50 hover:text-red-600"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                  </div>
                  <p className="mt-3 text-xs text-gray-mid">{integration.description}</p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Available Integrations */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-navy">Available Integrations</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {integrations
            .filter((i) => !i.connected)
            .map((integration) => (
              <div
                key={integration.id}
                className="rounded-xl border border-gray-light bg-white p-4 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${integration.color}`}>
                    {integration.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-navy">{integration.name}</h4>
                      {integration.comingSoon && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                          Coming Soon
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-gray-mid">{integration.description}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleConnect(integration.id)}
                  disabled={integration.comingSoon || connectingId === integration.id}
                  className="mt-4 w-full rounded-lg border border-gray-light bg-white py-2 text-sm font-medium text-navy transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {connectingId === integration.id ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Connecting...
                    </span>
                  ) : integration.comingSoon ? (
                    'Notify Me'
                  ) : (
                    'Connect'
                  )}
                </button>
              </div>
            ))}
        </div>
      </div>

      {/* Request Integration */}
      <div className="rounded-xl bg-gradient-to-r from-purple-50 to-blue-50 p-6 border border-purple-100">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
            <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-navy">Request an Integration</h4>
            <p className="mt-1 text-sm text-gray-mid">
              Don&apos;t see an app you need? Let us know and we&apos;ll consider adding it.
            </p>
            <button
              type="button"
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Request Integration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
