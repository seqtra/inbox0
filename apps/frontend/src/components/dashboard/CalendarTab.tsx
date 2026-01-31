'use client';

import React from 'react';

export function CalendarTab() {
  // Get current date info
  const now = new Date();
  const currentMonth = now.toLocaleString('default', { month: 'long', year: 'numeric' });
  const today = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getDay();

  // Generate calendar days
  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  // Sample events (placeholder data)
  const events = [
    { day: today, title: 'Team standup', time: '9:00 AM', color: 'bg-blue-500' },
    { day: today + 1, title: 'Client meeting', time: '2:00 PM', color: 'bg-purple-500' },
    { day: today + 2, title: 'Review emails', time: '10:00 AM', color: 'bg-green-500' },
    { day: today + 5, title: 'Project deadline', time: 'All day', color: 'bg-red-500' },
  ];

  const getEventsForDay = (day: number) => events.filter((e) => e.day === day);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-navy">Calendar</h2>
          <p className="text-sm text-gray-mid">View your schedule and email-related events</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-light bg-white px-4 py-2 text-sm font-medium text-navy hover:bg-gray-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Event
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-gray-dark"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            Sync Google Calendar
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar Grid */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-gray-light bg-white p-6 shadow-sm">
            {/* Month Header */}
            <div className="mb-6 flex items-center justify-between">
              <button type="button" className="rounded-lg p-2 hover:bg-gray-50">
                <svg className="h-5 w-5 text-gray-mid" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h3 className="text-lg font-semibold text-navy">{currentMonth}</h3>
              <button type="button" className="rounded-lg p-2 hover:bg-gray-50">
                <svg className="h-5 w-5 text-gray-mid" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Day Headers */}
            <div className="mb-2 grid grid-cols-7 gap-1 text-center">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="py-2 text-xs font-medium text-gray-mid">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, idx) => {
                const dayEvents = day ? getEventsForDay(day) : [];
                const isToday = day === today;
                
                return (
                  <div
                    key={idx}
                    className={`min-h-[80px] rounded-lg border p-1 ${
                      day
                        ? isToday
                          ? 'border-navy bg-navy/5'
                          : 'border-gray-light hover:bg-gray-50'
                        : 'border-transparent'
                    }`}
                  >
                    {day && (
                      <>
                        <span
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                            isToday
                              ? 'bg-navy text-white font-semibold'
                              : 'text-gray-dark'
                          }`}
                        >
                          {day}
                        </span>
                        <div className="mt-1 space-y-0.5">
                          {dayEvents.slice(0, 2).map((event, i) => (
                            <div
                              key={i}
                              className={`truncate rounded px-1 py-0.5 text-[10px] text-white ${event.color}`}
                            >
                              {event.title}
                            </div>
                          ))}
                          {dayEvents.length > 2 && (
                            <div className="text-[10px] text-gray-mid">
                              +{dayEvents.length - 2} more
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-light bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-semibold text-navy">Upcoming Events</h3>
            <div className="space-y-3">
              {events.map((event, idx) => (
                <div key={idx} className="flex items-start gap-3 rounded-lg border border-gray-light p-3">
                  <div className={`mt-1 h-2 w-2 rounded-full ${event.color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-navy text-sm">{event.title}</p>
                    <p className="text-xs text-gray-mid">
                      {event.day === today ? 'Today' : `In ${event.day - today} days`} • {event.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Coming Soon Notice */}
          <div className="rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 p-6 border border-blue-100">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h4 className="font-semibold text-navy">Calendar Sync Coming Soon</h4>
            <p className="mt-1 text-sm text-gray-mid">
              We&apos;re working on Google Calendar integration. Soon you&apos;ll be able to:
            </p>
            <ul className="mt-2 space-y-1 text-xs text-gray-mid">
              <li className="flex items-center gap-2">
                <svg className="h-3 w-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                View meetings from emails
              </li>
              <li className="flex items-center gap-2">
                <svg className="h-3 w-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Create events from action items
              </li>
              <li className="flex items-center gap-2">
                <svg className="h-3 w-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Get daily schedule summaries
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
