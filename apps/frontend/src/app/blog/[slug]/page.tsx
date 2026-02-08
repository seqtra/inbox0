import { Metadata } from 'next';
import ReactMarkdown from 'react-markdown';
import { notFound } from 'next/navigation';
import Link from 'next/link';

import { StructuredData } from '@/components/seo';
import {
  generateBlogPostingSchema,
  generateBreadcrumbSchema,
  generateOrganizationSchema,
} from '@/shared/lib/schemas';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:3000';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://inbox0.com';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  seoTitle: string | null;
  seoDesc: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Fetch single post
async function getPost(slug: string): Promise<BlogPost | null> {
  try {
    const res = await fetch(`${API_BASE}/api/blogs/${slug}`, {
      next: { revalidate: 3600 } // ISR: Re-generate page every hour
    });
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error('Failed to fetch post:', error);
    return null;
  }
}

// Fetch all posts for static generation
async function getAllPosts(): Promise<BlogPost[]> {
  try {
    const res = await fetch(`${API_BASE}/api/blogs`, {
      next: { revalidate: 3600 }
    });
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    console.error('Failed to fetch posts:', error);
    return [];
  }
}

// Pre-render all blog post pages at build time
export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

// Dynamic SEO metadata with full OpenGraph support
export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return {
      title: 'Post Not Found | Inbox0 Blog',
    };
  }

  const title = post.seoTitle || post.title;
  const description = post.seoDesc || `Read ${post.title} on the Inbox0 blog.`;
  const url = `${SITE_URL}/blog/${post.slug}`;
  const publishedTime = post.publishedAt || post.createdAt;

  return {
    title: `${title} | Inbox0 Blog`,
    description,

    // Canonical URL
    alternates: {
      canonical: url,
    },

    // OpenGraph for social sharing
    openGraph: {
      title,
      description,
      url,
      siteName: 'Inbox0',
      type: 'article',
      publishedTime,
      modifiedTime: post.updatedAt,
      authors: ['Inbox0 Team'],
    },

    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },

    // Search engine directives
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

// The Blog Post UI
export default async function BlogPostPage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) return notFound();

  // Generate comprehensive schemas for SEO
  const blogPostingSchema = generateBlogPostingSchema({
    title: post.title,
    description: post.seoDesc || post.title,
    slug: post.slug,
    publishedAt: post.publishedAt || post.createdAt,
    updatedAt: post.updatedAt,
  });

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Blog', url: `${SITE_URL}/blog` },
    { name: post.title, url: `${SITE_URL}/blog/${post.slug}` },
  ]);

  const organizationSchema = generateOrganizationSchema();

  return (
    <>
      {/* Schema.org structured data for SEO */}
      <StructuredData
        schemas={[blogPostingSchema, breadcrumbSchema, organizationSchema]}
      />

      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Breadcrumb Navigation */}
        <nav className="mb-8" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-sm text-gray-600">
            <li>
              <Link href="/" className="hover:text-blue-600 transition-colors">
                Home
              </Link>
            </li>
            <li className="flex items-center">
              <span className="mx-2">/</span>
              <Link href="/blog" className="hover:text-blue-600 transition-colors">
                Blog
              </Link>
            </li>
            <li className="flex items-center">
              <span className="mx-2">/</span>
              <span className="text-gray-900 font-medium" aria-current="page">
                {post.title}
              </span>
            </li>
          </ol>
        </nav>

        <article className="max-w-3xl mx-auto">
          {/* Published date */}
          {post.publishedAt && (
            <time
              dateTime={post.publishedAt}
              className="text-sm text-gray-500 mb-2 block"
            >
              {new Date(post.publishedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </time>
          )}

          <h1 className="text-4xl font-bold mb-6">{post.title}</h1>

          <div className="prose lg:prose-xl prose-headings:font-semibold prose-a:text-blue-600 prose-img:rounded-lg">
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </div>

          {/* Back to Blog Link */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <Link
              href="/blog"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Blog
            </Link>
          </div>
        </article>
      </div>
    </>
  );
}
