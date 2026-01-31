import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import { authOptions } from '../api/auth/[...nextauth]/route';
import { DashboardContent } from './DashboardContent';

export const metadata = {
  title: 'Dashboard | inbox-0',
  description: 'Manage your emails with AI-powered insights and Trello integration',
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/api/auth/signin');
  }

  return <DashboardContent />;
}
