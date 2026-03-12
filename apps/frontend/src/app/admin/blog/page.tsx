'use client';

import { useCallback, useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content?: string;
  imageUrl?: string | null;
  status: 'DRAFT' | 'PUBLISHED';
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
  timestamp: string;
}

export default function AdminBlogPage() {
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<BlogPost[]>([]);
  const [published, setPublished] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [regeneratingIds, setRegeneratingIds] = useState<Set<string>>(() => new Set());

  const [generateMode, setGenerateMode] = useState<'auto' | 'topic' | 'custom'>('auto');
  const [topic, setTopic] = useState('');
  const [customContent, setCustomContent] = useState('');

  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editMarkdown, setEditMarkdown] = useState('');
  const [editPublished, setEditPublished] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [draftRes, pubRes] = await Promise.all([
        fetch(`${API_URL}/blogs?published=false`, { credentials: 'include' }),
        fetch(`${API_URL}/blogs?published=true`, { credentials: 'include' }),
      ]);

      const draftJson = (await draftRes.json()) as ApiResponse<BlogPost[]>;
      const pubJson = (await pubRes.json()) as ApiResponse<BlogPost[]>;

      if (!draftRes.ok || !draftJson.success) {
        throw new Error(draftJson.error?.message || 'Failed to load drafts');
      }
      if (!pubRes.ok || !pubJson.success) {
        throw new Error(pubJson.error?.message || 'Failed to load published posts');
      }

      setDrafts(draftJson.data ?? []);
      setPublished(pubJson.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openEdit = (post: BlogPost) => {
    setEditing(post);
    setEditTitle(post.title);
    setEditMarkdown(post.content ?? '');
    setEditPublished(post.status === 'PUBLISHED');
  };

  const closeEdit = () => {
    setEditing(null);
    setEditTitle('');
    setEditMarkdown('');
    setEditPublished(false);
  };

  const handleGenerateDraft = async () => {
    setGenerateLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/blogs/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          mode: generateMode,
          ...(generateMode === 'topic' ? { topic } : {}),
          ...(generateMode === 'custom' ? { customContent } : {}),
        }),
      });
      const json = (await res.json()) as ApiResponse<BlogPost>;
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Failed to generate draft');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setGenerateLoading(false);
    }
  };

  const handleRegenerate = async (postId: string) => {
    setRegeneratingIds((prev) => {
      const next = new Set(prev);
      next.add(postId);
      return next;
    });
    setError(null);
    try {
      const res = await fetch(`${API_URL}/blogs/${postId}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({}),
      });
      const json = (await res.json()) as ApiResponse<BlogPost>;
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Failed to regenerate');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Regenerate failed');
    } finally {
      setRegeneratingIds((prev) => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
    }
  };

  const handleSave = async () => {
    if (!editing) return;
    setActionLoading(editing.id);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/blogs/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: editTitle,
          contentMarkdown: editMarkdown,
          isPublished: editPublished,
        }),
      });
      const json = (await res.json()) as ApiResponse<BlogPost>;
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Failed to save');
      closeEdit();
      await load();
      setSaveMessage('Post saved successfully.');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setActionLoading(null);
    }
  };

  const StatusBadge = ({ status }: { status: BlogPost['status'] }) => {
    const styles =
      status === 'PUBLISHED'
        ? 'bg-green-100 text-green-800'
        : 'bg-gray-100 text-gray-800';
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles}`}>{status}</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Blog Admin</h1>
              <p className="text-sm text-gray-500">Generate, edit, and publish posts.</p>
            </div>
            <div className="flex items-center gap-2">
              <a href="/blog" className="text-sm text-blue-600 hover:text-blue-800">
                View public blog →
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {saveMessage && (
          <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800">
            {saveMessage}
          </div>
        )}

        {/* Draft a New Post */}
        <section className="mb-8 bg-white border rounded-lg">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-gray-900">Draft a New Post</h2>
            <p className="text-sm text-gray-500">Choose a mode and generate a new draft.</p>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="mode"
                  value="auto"
                  checked={generateMode === 'auto'}
                  onChange={() => setGenerateMode('auto')}
                />
                Auto-Generate (AI)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="mode"
                  value="topic"
                  checked={generateMode === 'topic'}
                  onChange={() => setGenerateMode('topic')}
                />
                Provide a Topic
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="mode"
                  value="custom"
                  checked={generateMode === 'custom'}
                  onChange={() => setGenerateMode('custom')}
                />
                Paste Own Content
              </label>
            </div>

            {generateMode === 'topic' && (
              <div>
                <label className="text-sm font-medium text-gray-700">Topic</label>
                <input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. How to hit Inbox Zero with AI in 30 minutes/day"
                  className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
              </div>
            )}

            {generateMode === 'custom' && (
              <div>
                <label className="text-sm font-medium text-gray-700">Raw draft</label>
                <textarea
                  value={customContent}
                  onChange={(e) => setCustomContent(e.target.value)}
                  rows={10}
                  placeholder="Paste your raw content here…"
                  className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={handleGenerateDraft}
                disabled={
                  generateLoading ||
                  (generateMode === 'topic' && topic.trim().length === 0) ||
                  (generateMode === 'custom' && customContent.trim().length === 0)
                }
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generateLoading
                  ? 'Working…'
                  : generateMode === 'custom'
                    ? '✨ Polish & Draft'
                    : '✨ Generate Post'}
              </button>
            </div>
          </div>
        </section>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
            <button onClick={() => setError(null)} className="text-sm text-red-600 underline mt-1">
              Dismiss
            </button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading…</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Drafts */}
            <section className="bg-white rounded-lg border">
              <div className="p-4 border-b flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Drafts</h2>
                <span className="text-xs text-gray-500">{drafts.length}</span>
              </div>
              <div className="divide-y">
                {drafts.length === 0 ? (
                  <div className="p-6 text-sm text-gray-500">No drafts yet.</div>
                ) : (
                  drafts.map((post) => (
                    <div key={post.id} className="p-4 flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <StatusBadge status={post.status} />
                          <span className="text-xs text-gray-400">
                            Updated {new Date(post.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                        {post.imageUrl ? (
                          <div className="mb-2 h-20 w-full max-w-xs overflow-hidden rounded-md bg-gray-100">
                            <img
                              src={post.imageUrl}
                              alt={post.title}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="mb-2 h-20 w-full max-w-xs rounded-md bg-gradient-to-r from-gray-100 to-gray-200" />
                        )}
                        <div className="font-medium text-gray-900 truncate">{post.title}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          /blog/{post.slug}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={async () => {
                            setActionLoading(post.id);
                            setError(null);
                            try {
                              const res = await fetch(`${API_URL}/blogs/${post.id}/publish`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                credentials: 'include',
                                body: JSON.stringify({ publish: true }),
                              });
                              const json = (await res.json()) as ApiResponse<BlogPost>;
                              if (!res.ok || !json.success) {
                                throw new Error(json.error?.message || 'Failed to publish');
                              }
                              await load();
                            } catch (err) {
                              setError(err instanceof Error ? err.message : 'Publish failed');
                            } finally {
                              setActionLoading(null);
                            }
                          }}
                          disabled={actionLoading === post.id}
                          className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                        >
                          {actionLoading === post.id ? '...' : 'Publish'}
                        </button>
                        <button
                          onClick={() => openEdit(post)}
                          className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleRegenerate(post.id)}
                          disabled={regeneratingIds.has(post.id)}
                          className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                        >
                          {regeneratingIds.has(post.id) ? 'Regenerating…' : 'Regenerate (AI)'}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Published */}
            <section className="bg-white rounded-lg border">
              <div className="p-4 border-b flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Published</h2>
                <span className="text-xs text-gray-500">{published.length}</span>
              </div>
              <div className="divide-y">
                {published.length === 0 ? (
                  <div className="p-6 text-sm text-gray-500">No published posts yet.</div>
                ) : (
                  published.map((post) => (
                    <div key={post.id} className="p-4 flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <StatusBadge status={post.status} />
                          <span className="text-xs text-gray-400">
                            Published {new Date(post.publishedAt ?? post.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {post.imageUrl ? (
                          <div className="mb-2 h-20 w-full max-w-xs overflow-hidden rounded-md bg-gray-100">
                            <img
                              src={post.imageUrl}
                              alt={post.title}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="mb-2 h-20 w-full max-w-xs rounded-md bg-gradient-to-r from-gray-100 to-gray-200" />
                        )}
                        <div className="font-medium text-gray-900 truncate">{post.title}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          /blog/{post.slug}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <a
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
                        >
                          Preview
                        </a>
                        <button
                          onClick={() => openEdit(post)}
                          className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleRegenerate(post.id)}
                          disabled={regeneratingIds.has(post.id)}
                          className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                          title="Rewrite and revert to draft"
                        >
                          {regeneratingIds.has(post.id) ? 'Regenerating…' : 'Regenerate (AI)'}
                        </button>
                        <button
                          onClick={async () => {
                            setActionLoading(post.id);
                            setError(null);
                            try {
                              const res = await fetch(`${API_URL}/blogs/${post.id}/publish`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                credentials: 'include',
                                body: JSON.stringify({ publish: false }),
                              });
                              const json = (await res.json()) as ApiResponse<BlogPost>;
                              if (!res.ok || !json.success) {
                                throw new Error(json.error?.message || 'Failed to unpublish');
                              }
                              await load();
                            } catch (err) {
                              setError(err instanceof Error ? err.message : 'Unpublish failed');
                            } finally {
                              setActionLoading(null);
                            }
                          }}
                          disabled={actionLoading === post.id}
                          className="px-3 py-1.5 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
                        >
                          {actionLoading === post.id ? '...' : 'Unpublish'}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}

        {/* Edit Modal */}
        {editing && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <div className="bg-white w-full max-w-3xl rounded-lg shadow-lg border">
              <div className="p-4 border-b flex items-center justify-between">
                <div className="font-semibold text-gray-900">Edit Post</div>
                <button onClick={closeEdit} className="text-gray-500 hover:text-gray-700">
                  ✕
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Title</label>
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Markdown</label>
                  <textarea
                    value={editMarkdown}
                    onChange={(e) => setEditMarkdown(e.target.value)}
                    rows={14}
                    className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={editPublished}
                      onChange={(e) => setEditPublished(e.target.checked)}
                    />
                    Published
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRegenerate(editing.id)}
                      disabled={regeneratingIds.has(editing.id)}
                      className="px-3 py-2 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                    >
                      {regeneratingIds.has(editing.id) ? 'Regenerating…' : 'Regenerate (AI)'}
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={actionLoading === editing.id}
                      className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {actionLoading === editing.id ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
