import Link from 'next/link';

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b bg-white/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900">
                Admin Dashboard
              </h1>
              <p className="mt-1 text-sm text-zinc-500">
                Configure AI content, manage your blog, and explore upcoming tools.
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Blog CMS Card */}
        <Link
          href="/admin/blog"
          className="group block h-full rounded-2xl border border-zinc-200 bg-white/90 p-6 shadow-sm ring-1 ring-transparent transition hover:border-zinc-300 hover:shadow-md hover:ring-zinc-100"
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-sm text-white shadow-sm">
              📝
            </span>
            <div>
              <h2 className="text-base font-semibold tracking-tight text-zinc-900">
                Blog CMS
              </h2>
              <p className="mt-0.5 text-xs text-zinc-500">
                AI-powered drafting, editing, and publishing.
              </p>
            </div>
          </div>

          <p className="text-sm text-zinc-600">
            Manage blog topics, generate AI content, and publish posts.
          </p>
          <div className="mt-4 inline-flex items-center text-sm font-medium text-zinc-900 group-hover:text-zinc-700">
            Open Blog Admin
            <span className="ml-1 transition-transform group-hover:translate-x-0.5">→</span>
          </div>
        </Link>

        {/* Placeholder cards for future admin features */}
        <div className="h-full rounded-2xl border border-dashed border-zinc-200 bg-white/60 p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-sm text-zinc-500">
              📊
            </span>
            <div>
              <h2 className="text-base font-semibold tracking-tight text-zinc-400">
                Analytics
              </h2>
              <p className="mt-0.5 text-xs text-zinc-400">
                Insights into engagement and performance.
              </p>
            </div>
          </div>

          <p className="text-sm text-zinc-400">
            Coming soon: View usage statistics and metrics.
          </p>
        </div>

        <div className="h-full rounded-2xl border border-dashed border-zinc-200 bg-white/60 p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-sm text-zinc-500">
              👥
            </span>
            <div>
              <h2 className="text-base font-semibold tracking-tight text-zinc-400">
                Users
              </h2>
              <p className="mt-0.5 text-xs text-zinc-400">
                Manage access and roles across your workspace.
              </p>
            </div>
          </div>

          <p className="text-sm text-zinc-400">
            Coming soon: Manage users and permissions.
          </p>
        </div>
        </div>
      </main>
    </div>
  );
}
