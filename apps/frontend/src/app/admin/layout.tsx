import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Admin | Inbox0',
  description: 'Admin dashboard for Inbox0',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Navigation */}
      <nav className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-6">
              <Link href="/admin" className="font-semibold text-lg">
                Inbox0 Admin
              </Link>
              <div className="flex items-center gap-4">
                <Link 
                  href="/admin/blog" 
                  className="text-sm text-gray-300 hover:text-white transition-colors"
                >
                  Blog CMS
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link 
                href="/" 
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Exit Admin →
              </Link>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Main Content */}
      {children}
    </div>
  );
}
