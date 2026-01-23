'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// Use dev endpoints in development (no auth required)
const isDev = process.env.NODE_ENV !== 'production';
const ADMIN_PREFIX = isDev ? '/dev/admin' : '/admin';

// Types
interface BlogTopic {
  id: string;
  title: string;
  angle: string | null;
  sourceUrl: string | null;
  sourceHeadline: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'GENERATED';
  approvedBy: string | null;
  approvedAt: string | null;
  rejectedReason: string | null;
  createdAt: string;
  updatedAt: string;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  status: 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'ARCHIVED';
  seoTitle: string | null;
  seoDesc: string | null;
  publishedAt: string | null;
  createdAt: string;
}

type Tab = 'topics' | 'posts';
type TopicFilter = 'all' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'GENERATED';

export default function AdminBlogPage() {
  const [activeTab, setActiveTab] = useState<Tab>('topics');
  const [topics, setTopics] = useState<BlogTopic[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [topicFilter, setTopicFilter] = useState<TopicFilter>('PENDING');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [scoutLoading, setScoutLoading] = useState(false);
  const [generateLoading, setGenerateLoading] = useState<string | null>(null);

  // Fetch topics
  const fetchTopics = useCallback(async () => {
    try {
      const url = topicFilter === 'all' 
        ? `${API_URL}${ADMIN_PREFIX}/topics`
        : `${API_URL}${ADMIN_PREFIX}/topics?status=${topicFilter}`;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch topics');
      const data = await res.json();
      setTopics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch topics');
    }
  }, [topicFilter]);

  // Fetch posts (admin endpoint returns all posts including drafts)
  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}${ADMIN_PREFIX}/posts`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch posts');
      const data = await res.json();
      setPosts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch posts');
    }
  }, []);

  // Load data on mount and tab change
  useEffect(() => {
    setLoading(true);
    setError(null);
    
    const loadData = async () => {
      if (activeTab === 'topics') {
        await fetchTopics();
      } else {
        await fetchPosts();
      }
      setLoading(false);
    };
    
    loadData();
  }, [activeTab, fetchTopics, fetchPosts]);

  // Scout for new trends - searches real RSS feeds and analyzes with AI
  const handleScoutTrends = async () => {
    setScoutLoading(true);
    setError(null);
    
    try {
      // Real mode: Search RSS feeds for: Email Productivity, OpenAI, Remote Work, etc.
      const res = await fetch(`${API_URL}${ADMIN_PREFIX}/scout-trends`, {
        credentials: 'include',
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to scout trends');
      }
      
      const data = await res.json();
      
      if (data.message) {
        // No topics found
        alert(`🔍 Search complete!\n\n${data.message}\n\nSearched RSS feeds from:\n• TechCrunch\n• Lifehacker\n• Hacker News\n• O'Reilly Radar\n• Product Hunt\n\nKeywords: Email Productivity, OpenAI, ChatGPT, Remote Work, Business Automation`);
      } else {
        const message = `✅ Found ${data.created} new trending topics!\n\n${data.skipped > 0 ? `${data.skipped} duplicates skipped.\n\n` : ''}Searched RSS feeds from:\n• TechCrunch\n• Lifehacker\n• Hacker News\n• O'Reilly Radar\n• Product Hunt\n\nKeywords: Email Productivity, OpenAI, ChatGPT, Remote Work, Business Automation`;
        alert(message);
      }
      
      await fetchTopics();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scout trends');
    } finally {
      setScoutLoading(false);
    }
  };

  // Seed demo data
  const handleSeedDemo = async () => {
    setScoutLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`${API_URL}${ADMIN_PREFIX}/seed-demo`, {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to seed demo data');
      }
      
      const data = await res.json();
      const message = `✅ Created demo data!\n\n• ${data.topics.length} pending topics for review\n• ${data.posts?.length || 0} draft blog posts ready to publish`;
      alert(message);
      await fetchTopics();
      if (activeTab === 'posts') {
        await fetchPosts();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to seed demo data');
    } finally {
      setScoutLoading(false);
    }
  };

  // Approve/Reject topic
  const handleTopicAction = async (
    topicId: string, 
    action: 'APPROVED' | 'REJECTED',
    rejectedReason?: string
  ) => {
    setActionLoading(topicId);
    setError(null);
    
    try {
      const res = await fetch(`${API_URL}${ADMIN_PREFIX}/topics/${topicId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: action, rejectedReason }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Failed to ${action.toLowerCase()} topic`);
      }
      
      await fetchTopics();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  // Generate blog from topic
  const handleGenerateBlog = async (topicId: string) => {
    setGenerateLoading(topicId);
    setError(null);
    
    try {
      const res = await fetch(`${API_URL}${ADMIN_PREFIX}/generate-blog`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ topicId }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to generate blog');
      }
      
      const post = await res.json();
      alert(`Blog post created: "${post.title}"`);
      await fetchTopics();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setGenerateLoading(null);
    }
  };

  // Publish/Unpublish post
  const handlePublishToggle = async (postId: string, publish: boolean) => {
    setActionLoading(postId);
    setError(null);
    
    try {
      const res = await fetch(`${API_URL}${ADMIN_PREFIX}/posts/${postId}/publish`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ publish }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update post');
      }
      
      await fetchPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-blue-100 text-blue-800',
      REJECTED: 'bg-red-100 text-red-800',
      GENERATED: 'bg-green-100 text-green-800',
      DRAFT: 'bg-gray-100 text-gray-800',
      REVIEW: 'bg-purple-100 text-purple-800',
      PUBLISHED: 'bg-green-100 text-green-800',
      ARCHIVED: 'bg-gray-100 text-gray-600',
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status] || 'bg-gray-100'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Blog Admin</h1>
              <p className="text-sm text-gray-500">Manage topics and blog posts</p>
            </div>
            <Link 
              href="/blog" 
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              ← Back to Blog
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="text-sm text-red-600 underline mt-1"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('topics')}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              activeTab === 'topics'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Topics
          </button>
          <button
            onClick={() => setActiveTab('posts')}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              activeTab === 'posts'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Posts
          </button>
        </div>

        {/* Topics Tab */}
        {activeTab === 'topics' && (
          <div>
            {/* Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Filter:</label>
                <select
                  value={topicFilter}
                  onChange={(e) => setTopicFilter(e.target.value as TopicFilter)}
                  className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
                >
                  <option value="all">All</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="GENERATED">Generated</option>
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSeedDemo}
                  disabled={scoutLoading}
                  className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Create demo topics for presentation"
                >
                  {scoutLoading ? 'Loading...' : '🌱 Seed Demo Topics'}
                </button>
                <button
                  onClick={handleScoutTrends}
                  disabled={scoutLoading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Search RSS feeds (TechCrunch, Hacker News, etc.) and AI-analyze for relevant topics about Email Productivity, OpenAI, Remote Work"
                >
                  {scoutLoading ? '🔍 Searching RSS feeds...' : '🔍 Scout New Trends'}
                </button>
              </div>
            </div>

            {/* Topics List */}
            {loading ? (
              <div className="text-center py-12 text-gray-500">Loading topics...</div>
            ) : topics.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border">
                <p className="text-gray-500">No topics found</p>
                <button
                  onClick={handleScoutTrends}
                  disabled={scoutLoading}
                  className="mt-4 text-blue-600 hover:underline"
                >
                  Scout for new trends
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-lg border divide-y">
                {topics.map((topic) => (
                  <div key={topic.id} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <StatusBadge status={topic.status} />
                          <span className="text-xs text-gray-400">
                            {new Date(topic.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="font-medium text-gray-900 truncate">
                          {topic.title}
                        </h3>
                        {topic.angle && (
                          <p className="text-sm text-gray-600 mt-1">
                            <span className="font-medium">Angle:</span> {topic.angle}
                          </p>
                        )}
                        {topic.sourceHeadline && (
                          <p className="text-sm text-gray-500 mt-1">
                            <span className="font-medium">Source:</span>{' '}
                            {topic.sourceUrl ? (
                              <a 
                                href={topic.sourceUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                {topic.sourceHeadline}
                              </a>
                            ) : (
                              topic.sourceHeadline
                            )}
                          </p>
                        )}
                        {topic.rejectedReason && (
                          <p className="text-sm text-red-600 mt-1">
                            <span className="font-medium">Reason:</span> {topic.rejectedReason}
                          </p>
                        )}
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {topic.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleTopicAction(topic.id, 'APPROVED')}
                              disabled={actionLoading === topic.id}
                              className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                            >
                              {actionLoading === topic.id ? '...' : '✓ Approve'}
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt('Reason for rejection (optional):');
                                handleTopicAction(topic.id, 'REJECTED', reason || undefined);
                              }}
                              disabled={actionLoading === topic.id}
                              className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                            >
                              {actionLoading === topic.id ? '...' : '✗ Reject'}
                            </button>
                          </>
                        )}
                        {topic.status === 'APPROVED' && (
                          <button
                            onClick={() => handleGenerateBlog(topic.id)}
                            disabled={generateLoading === topic.id}
                            className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                          >
                            {generateLoading === topic.id ? 'Generating...' : '🤖 Generate Blog'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Posts Tab */}
        {activeTab === 'posts' && (
          <div>
            {loading ? (
              <div className="text-center py-12 text-gray-500">Loading posts...</div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border">
                <p className="text-gray-500">No posts yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Approve topics and generate blog posts to see them here
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-lg border divide-y">
                {posts.map((post) => (
                  <div key={post.id} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <StatusBadge status={post.status} />
                          {post.publishedAt && (
                            <span className="text-xs text-gray-400">
                              Published {new Date(post.publishedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <h3 className="font-medium text-gray-900">
                          <Link 
                            href={`/blog/${post.slug}`}
                            className="hover:text-blue-600"
                          >
                            {post.title}
                          </Link>
                        </h3>
                        {post.seoDesc && (
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                            {post.seoDesc}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          Slug: <code className="bg-gray-100 px-1 rounded">{post.slug}</code>
                        </p>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Link
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
                        >
                          Preview
                        </Link>
                        {post.status === 'PUBLISHED' ? (
                          <button
                            onClick={() => handlePublishToggle(post.id, false)}
                            disabled={actionLoading === post.id}
                            className="px-3 py-1.5 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
                          >
                            {actionLoading === post.id ? '...' : 'Unpublish'}
                          </button>
                        ) : (
                          <button
                            onClick={() => handlePublishToggle(post.id, true)}
                            disabled={actionLoading === post.id}
                            className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                          >
                            {actionLoading === post.id ? '...' : 'Publish'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
