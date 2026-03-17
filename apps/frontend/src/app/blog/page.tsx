import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:3000';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://inbox0.com';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  imageUrl: string | null;
  seoTitle: string | null;
  seoDesc: string | null;
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

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
  timestamp?: string;
}

// Fetch all published posts
async function getAllPosts(): Promise<BlogPost[]> {
  try {
    const res = await fetch(`${API_BASE}/api/blogs`, {
      next: { revalidate: 3600 } // ISR: Re-generate every hour
    });
    if (!res.ok) return [];
    const json = (await res.json()) as ApiResponse<BlogPost[]>;
    if (!json.success) return [];
    return json.data ?? [];
  } catch (error) {
    console.error('Failed to fetch posts:', error);
    return [];
  }
}

// Static metadata for blog index
export const metadata: Metadata = {
  title: 'Blog | Inbox0 - AI Email Management Tips & Insights',
  description: 'Discover productivity tips, email management strategies, and AI automation insights from the Inbox0 team. Master your inbox today.',
  
  alternates: {
    canonical: `${SITE_URL}/blog`,
  },
  
  openGraph: {
    title: 'Inbox0 Blog - Email Productivity & AI Insights',
    description: 'Discover productivity tips, email management strategies, and AI automation insights from the Inbox0 team.',
    url: `${SITE_URL}/blog`,
    siteName: 'Inbox0',
    type: 'website',
  },
  
  twitter: {
    card: 'summary_large_image',
    title: 'Inbox0 Blog - Email Productivity & AI Insights',
    description: 'Discover productivity tips, email management strategies, and AI automation insights.',
  },
  
  robots: {
    index: true,
    follow: true,
  },
};

export default async function BlogIndexPage() {
  const posts = await getAllPosts();

  // JSON-LD for blog listing
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Inbox0 Blog',
    description: 'Email productivity tips and AI automation insights',
    url: `${SITE_URL}/blog`,
    publisher: {
      '@type': 'Organization',
      name: 'Inbox0',
      url: SITE_URL,
    },
    blogPost: posts.map(post => ({
      '@type': 'BlogPosting',
      headline: post.title,
      url: `${SITE_URL}/blog/${post.slug}`,
      datePublished: post.publishedAt || post.createdAt,
    })),
  };

  return (
    <>
      {/* JSON-LD for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <div className="max-w-4xl mx-auto py-12 px-4">
        <header className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Inbox0 Blog</h1>
          <p className="text-xl text-gray-600">
            Tips, insights, and strategies for mastering your inbox with AI.
          </p>
        </header>

        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No posts published yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {posts.map((post) => (
              <article 
                key={post.id}
                className="group rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <Link 
                  href={`/blog/${post.slug}`}
                  className="block"
                >
                  <div className="relative aspect-[16/9] bg-gray-100">
                    {post.imageUrl ? (
                      <Image
                        src={post.imageUrl}
                        alt={post.title}
                        fill
                        className="object-cover"
                        sizes="(min-width: 1024px) 600px, (min-width: 640px) 50vw, 100vw"
                        priority={false}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200" />
                    )}
                  </div>

                  <div className="p-5">
                    <time
                      dateTime={post.publishedAt || post.createdAt}
                      className="text-xs text-gray-500"
                    >
                      {new Date(post.publishedAt || post.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </time>

                    <h2 className="mt-2 text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {post.title}
                    </h2>

                    {post.seoDesc && (
                      <p className="mt-2 text-sm text-gray-600 line-clamp-3">
                        {post.seoDesc}
                      </p>
                    )}

                    <div className="mt-4 text-sm text-blue-600 font-medium group-hover:underline">
                      Read more →
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
