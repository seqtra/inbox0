import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

import { authOptions } from '../api/auth/[...nextauth]/route';
import { EmailList } from '@/features/inbox/EmailList';

export const metadata = {
  title: 'My Inbox | inbox-0',
  description: 'View your emails and send summaries to Trello',
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/api/auth/signin');
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Dashboard header – distinct from admin (no dark nav bar) */}
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="font-display text-2xl font-bold text-navy sm:text-3xl">
              My Inbox
            </h1>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-mid">
                {session.user.email ?? session.user.name ?? 'Signed in'}
              </span>
              <Link
                href="/"
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-navy transition-colors hover:bg-slate-50"
              >
                Home
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <EmailList />
      </main>
    </div>
  );
}
