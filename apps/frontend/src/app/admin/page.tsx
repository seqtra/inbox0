import Link from 'next/link';

export default function AdminDashboard() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Blog CMS Card */}
        <Link
          href="/admin/blog"
          className="block p-6 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">📝</span>
            <h2 className="text-xl font-semibold text-gray-900">Blog CMS</h2>
          </div>
          <p className="text-gray-600 text-sm">
            Manage blog topics, generate AI content, and publish posts.
          </p>
          <div className="mt-4 text-blue-600 text-sm font-medium">
            Open Blog Admin →
          </div>
        </Link>

        {/* Placeholder cards for future admin features */}
        <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 border-dashed">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl opacity-50">📊</span>
            <h2 className="text-xl font-semibold text-gray-400">Analytics</h2>
          </div>
          <p className="text-gray-400 text-sm">
            Coming soon: View usage statistics and metrics.
          </p>
        </div>

        <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 border-dashed">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl opacity-50">👥</span>
            <h2 className="text-xl font-semibold text-gray-400">Users</h2>
          </div>
          <p className="text-gray-400 text-sm">
            Coming soon: Manage users and permissions.
          </p>
        </div>
      </div>
    </main>
  );
}
