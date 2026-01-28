import { Metadata } from 'next';
import Link from 'next/link';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:3000';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://inbox0.com';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  seoTitle: string | null;
  seoDesc: string | null;
  publishedAt: string | null;
  createdAt: string;
}

// Fetch all published posts
async function getAllPosts(): Promise<BlogPost[]> {
  try {
    const res = await fetch(`${API_BASE}/api/blogs`, {
      next: { revalidate: 3600 } // ISR: Re-generate every hour
    });
    if (!res.ok) return [];
    return res.json();
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
          <div className="grid gap-8">
            {posts.map((post) => (
              <article 
                key={post.id}
                className="border-b border-gray-200 pb-8 last:border-0"
              >
                <Link 
                  href={`/blog/${post.slug}`}
                  className="group block"
                >
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
                  
                  <h2 className="text-2xl font-semibold mb-2 group-hover:text-blue-600 transition-colors">
                    {post.title}
                  </h2>
                  
                  {post.seoDesc && (
                    <p className="text-gray-600 line-clamp-2">
                      {post.seoDesc}
                    </p>
                  )}
                  
                  <span className="inline-block mt-3 text-blue-600 font-medium group-hover:underline">
                    Read more →
                  </span>
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
