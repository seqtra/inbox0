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

const DEFAULT_SYSTEM_PROMPT =
  "You are an elite B2B SaaS copywriter and productivity expert for 'inbox0', a modern app designed to help professionals conquer email overload and achieve Inbox Zero. Your tone is sharp, modern, highly actionable, and tech-savvy. Use formatting like H2s, bullet points, and code-like precision.";

export default function AdminBlogPage() {
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<BlogPost[]>([]);
  const [published, setPublished] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [regeneratingIds, setRegeneratingIds] = useState<Set<string>>(() => new Set());
  const [imageLoadingIds, setImageLoadingIds] = useState<Set<string>>(() => new Set());

  const [generateMode, setGenerateMode] = useState<'auto' | 'topic' | 'custom'>('auto');
  const [topic, setTopic] = useState('');
  const [customContent, setCustomContent] = useState('');
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);

  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editMarkdown, setEditMarkdown] = useState('');
  const [editPublished, setEditPublished] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const primaryButtonClasses =
    'inline-flex items-center justify-center rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 disabled:opacity-60 disabled:cursor-not-allowed';
  const subtleButtonClasses =
    'inline-flex items-center justify-center rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 disabled:opacity-60 disabled:cursor-not-allowed';
  const ghostButtonClasses =
    'inline-flex items-center justify-center rounded-full border border-transparent bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:border-zinc-200 hover:bg-zinc-50 disabled:opacity-60 disabled:cursor-not-allowed';

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
          systemPromptOverride: systemPrompt,
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

  const handleRegenerateImage = async (postId: string) => {
    setImageLoadingIds((prev) => {
      const next = new Set(prev);
      next.add(postId);
      return next;
    });
    setError(null);
    try {
      const res = await fetch(`${API_URL}/blogs/${postId}/image/regenerate`, {
        method: 'POST',
        credentials: 'include',
      });
      const json = (await res.json()) as ApiResponse<BlogPost>;
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Failed to regenerate image');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image regenerate failed');
    } finally {
      setImageLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
    }
  };

  const handleUploadImage = async (postId: string, file: File) => {
    setImageLoadingIds((prev) => {
      const next = new Set(prev);
      next.add(postId);
      return next;
    });
    setError(null);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') resolve(reader.result);
          else reject(new Error('Failed to read file'));
        };
        reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });

      const res = await fetch(`${API_URL}/blogs/${postId}/image/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ dataUrl }),
      });
      const json = (await res.json()) as ApiResponse<BlogPost>;
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Failed to upload image');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image upload failed');
    } finally {
      setImageLoadingIds((prev) => {
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
    const isPublished = status === 'PUBLISHED';
    const styles = isPublished
      ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
      : 'bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200';
    const dotColor = isPublished ? 'bg-emerald-500' : 'bg-zinc-400';

    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${styles}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b bg-white/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900">
                Blog Admin
              </h1>
              <p className="mt-1 text-sm text-zinc-500">
                Generate, refine, and publish AI-assisted content for your inbox0 audience.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="/blog"
                className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50"
              >
                View public blog
                <span className="ml-1 text-zinc-400">↗</span>
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
        {saveMessage && (
          <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800">
            {saveMessage}
          </div>
        )}

        {/* Draft a New Post */}
        <section className="mb-8 rounded-2xl border border-zinc-200 bg-white/90 shadow-sm">
          <div className="border-b border-zinc-100 px-6 py-4">
            <h2 className="text-sm font-semibold tracking-tight text-zinc-900">
              Draft a new post
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              Shape the AI, pick a mode, and let it draft for you.
            </p>
          </div>
          <div className="space-y-5 px-6 py-5">
            <div>
              <label className="text-xs font-medium text-zinc-700">
                AI Instructions (System Prompt)
              </label>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-mono text-zinc-800 shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="inline-flex rounded-full bg-zinc-100 p-1 text-xs font-medium text-zinc-600">
              {(['auto', 'topic', 'custom'] as const).map((mode) => {
                const isActive = generateMode === mode;
                const label =
                  mode === 'auto'
                    ? 'Auto-generate'
                    : mode === 'topic'
                      ? 'Provide topic'
                      : 'Polish my draft';
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setGenerateMode(mode)}
                    className={`inline-flex items-center rounded-full px-3 py-1.5 transition-colors ${
                      isActive
                        ? 'bg-white text-zinc-900 shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-800'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {generateMode === 'topic' && (
              <div>
                <label className="text-xs font-medium text-zinc-700">Topic</label>
                <input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. How to hit Inbox Zero with AI in 30 minutes/day"
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            )}

            {generateMode === 'custom' && (
              <div>
                <label className="text-xs font-medium text-zinc-700">Raw draft</label>
                <textarea
                  value={customContent}
                  onChange={(e) => setCustomContent(e.target.value)}
                  rows={8}
                  placeholder="Paste your raw content here…"
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-mono text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
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
                className={primaryButtonClasses}
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
          <div className="mb-6 rounded-xl border border-red-200/60 bg-red-50/80 px-4 py-3 text-sm text-red-800 shadow-sm">
            <p>{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-1 text-xs font-medium text-red-700 underline underline-offset-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-sm text-zinc-500">Loading…</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Drafts */}
            <section className="rounded-2xl border border-zinc-200 bg-white/90 shadow-sm">
              <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
                <h2 className="text-sm font-semibold tracking-tight text-zinc-900">Drafts</h2>
                <span className="text-xs text-zinc-500">{drafts.length}</span>
              </div>
              <div className="divide-y divide-zinc-100">
                {drafts.length === 0 ? (
                  <div className="p-6 text-sm text-gray-500">No drafts yet.</div>
                ) : (
                  drafts.map((post) => (
                    <div key={post.id} className="flex items-start justify-between gap-4 px-5 py-4">
                      <div className="min-w-0">
                        <div className="mb-2 flex items-center gap-2">
                          <StatusBadge status={post.status} />
                          <span className="text-[11px] text-zinc-500">
                            Updated {new Date(post.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                        {post.imageUrl ? (
                          <div className="mb-2 h-20 w-full max-w-xs overflow-hidden rounded-lg bg-zinc-100">
                            <img
                              src={post.imageUrl}
                              alt={post.title}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="mb-2 h-20 w-full max-w-xs rounded-lg bg-gradient-to-r from-zinc-100 to-zinc-200" />
                        )}
                        <div className="mb-2 flex items-center gap-2">
                          <button
                            onClick={() => handleRegenerateImage(post.id)}
                            disabled={imageLoadingIds.has(post.id)}
                            className="inline-flex items-center rounded-full border border-dashed border-zinc-300 px-2.5 py-1 text-[11px] font-medium text-zinc-600 transition-colors hover:border-zinc-400 disabled:opacity-60"
                          >
                            {imageLoadingIds.has(post.id) ? 'Updating image…' : 'Re-generate image'}
                          </button>
                          <label className="inline-flex cursor-pointer items-center rounded-full border border-dashed border-zinc-300 px-2.5 py-1 text-[11px] font-medium text-zinc-600 transition-colors hover:border-zinc-400">
                            {imageLoadingIds.has(post.id) ? 'Uploading…' : 'Upload image'}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  void handleUploadImage(post.id, file);
                                  e.target.value = '';
                                }
                              }}
                            />
                          </label>
                        </div>
                        <div className="truncate text-sm font-medium text-zinc-900">
                          {post.title}
                        </div>
                        <div className="mt-1 text-[11px] text-zinc-500">
                          /blog/{post.slug}
                        </div>
                      </div>
                      <div className="flex flex-shrink-0 flex-wrap items-center justify-end gap-2">
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
                          className={primaryButtonClasses}
                        >
                          {actionLoading === post.id ? '...' : 'Publish'}
                        </button>
                        <button
                          onClick={() => openEdit(post)}
                          className={ghostButtonClasses}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleRegenerate(post.id)}
                          disabled={regeneratingIds.has(post.id)}
                          className={ghostButtonClasses}
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
            <section className="rounded-2xl border border-zinc-200 bg-white/90 shadow-sm">
              <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
                <h2 className="text-sm font-semibold tracking-tight text-zinc-900">Published</h2>
                <span className="text-xs text-zinc-500">{published.length}</span>
              </div>
              <div className="divide-y divide-zinc-100">
                {published.length === 0 ? (
                  <div className="p-6 text-sm text-gray-500">No published posts yet.</div>
                ) : (
                  published.map((post) => (
                    <div key={post.id} className="flex items-start justify-between gap-4 px-5 py-4">
                      <div className="min-w-0">
                        <div className="mb-2 flex items-center gap-2">
                          <StatusBadge status={post.status} />
                          <span className="text-[11px] text-zinc-500">
                            Published{' '}
                            {new Date(post.publishedAt ?? post.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {post.imageUrl ? (
                          <div className="mb-2 h-20 w-full max-w-xs overflow-hidden rounded-lg bg-zinc-100">
                            <img
                              src={post.imageUrl}
                              alt={post.title}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="mb-2 h-20 w-full max-w-xs rounded-lg bg-gradient-to-r from-zinc-100 to-zinc-200" />
                        )}
                        <div className="mb-2 flex items-center gap-2">
                          <button
                            onClick={() => handleRegenerateImage(post.id)}
                            disabled={imageLoadingIds.has(post.id)}
                            className="inline-flex items-center rounded-full border border-dashed border-zinc-300 px-2.5 py-1 text-[11px] font-medium text-zinc-600 transition-colors hover:border-zinc-400 disabled:opacity-60"
                          >
                            {imageLoadingIds.has(post.id) ? 'Updating image…' : 'Re-generate image'}
                          </button>
                          <label className="inline-flex cursor-pointer items-center rounded-full border border-dashed border-zinc-300 px-2.5 py-1 text-[11px] font-medium text-zinc-600 transition-colors hover:border-zinc-400">
                            {imageLoadingIds.has(post.id) ? 'Uploading…' : 'Upload image'}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  void handleUploadImage(post.id, file);
                                  e.target.value = '';
                                }
                              }}
                            />
                          </label>
                        </div>
                        <div className="truncate text-sm font-medium text-zinc-900">
                          {post.title}
                        </div>
                        <div className="mt-1 text-[11px] text-zinc-500">
                          /blog/{post.slug}
                        </div>
                      </div>
                      <div className="flex flex-shrink-0 flex-wrap items-center justify-end gap-2">
                        <a
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className={ghostButtonClasses}
                        >
                          Preview
                        </a>
                        <button
                          onClick={() => openEdit(post)}
                          className={ghostButtonClasses}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleRegenerate(post.id)}
                          disabled={regeneratingIds.has(post.id)}
                          className={ghostButtonClasses}
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
                          className={subtleButtonClasses}
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-3xl rounded-2xl border border-zinc-200 bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3.5">
                <div className="text-sm font-semibold tracking-tight text-zinc-900">
                  Edit post
                </div>
                <button
                  onClick={closeEdit}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4 px-5 py-4">
                <div>
                  <label className="text-xs font-medium text-zinc-700">Title</label>
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-700">Markdown</label>
                  <textarea
                    value={editMarkdown}
                    onChange={(e) => setEditMarkdown(e.target.value)}
                    rows={14}
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-mono text-zinc-900 shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs text-zinc-700">
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
                      className={ghostButtonClasses}
                    >
                      {regeneratingIds.has(editing.id) ? 'Regenerating…' : 'Regenerate (AI)'}
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={actionLoading === editing.id}
                      className={primaryButtonClasses}
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
