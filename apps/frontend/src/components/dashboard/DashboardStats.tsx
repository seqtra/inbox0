'use client';

import React from 'react';
import { useSession } from 'next-auth/react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  color: 'navy' | 'coral' | 'green' | 'purple';
}

function StatCard({ label, value, icon, trend, color }: StatCardProps) {
  const colorClasses = {
    navy: 'bg-navy/10 text-navy',
    coral: 'bg-coral-vivid/10 text-coral-vivid',
    green: 'bg-whatsapp-green/10 text-whatsapp-green',
    purple: 'bg-purple-light/20 text-purple-light',
  };

  return (
    <div className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm border border-gray-light/50">
      <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${colorClasses[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-navy">{value}</p>
        <p className="text-xs text-gray-mid">{label}</p>
        {trend && (
          <p className={`text-xs ${trend.isPositive ? 'text-whatsapp-green' : 'text-coral-vivid'}`}>
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}% from last week
          </p>
        )}
      </div>
    </div>
  );
}

interface DashboardStatsProps {
  emailCount: number;
  unreadCount?: number;
  summariesGenerated?: number;
}

export function DashboardStats({ emailCount, unreadCount = 0, summariesGenerated = 0 }: DashboardStatsProps) {
  const { data: session } = useSession();
  const userName = session?.user?.name?.split(' ')[0] || 'there';
  const userImage = session?.user?.image;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center gap-4">
        {userImage ? (
          <img
            src={userImage}
            alt={session?.user?.name || 'User'}
            className="h-14 w-14 rounded-full border-2 border-white shadow-md"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-navy text-xl font-bold text-white shadow-md">
            {userName[0]?.toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-navy">
            {getGreeting()}, {userName}!
          </h1>
          <p className="text-sm text-gray-mid">
            Here&apos;s your inbox overview for today
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Emails"
          value={emailCount}
          color="navy"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
        />
        <StatCard
          label="Unread"
          value={unreadCount}
          color="coral"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          }
        />
        <StatCard
          label="Summaries"
          value={summariesGenerated}
          color="green"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
        <StatCard
          label="Sent to Trello"
          value={0}
          color="purple"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          }
        />
      </div>
    </div>
  );
}
