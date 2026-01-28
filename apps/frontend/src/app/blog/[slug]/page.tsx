import { Metadata } from 'next';
import ReactMarkdown from 'react-markdown';
import { notFound } from 'next/navigation';

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

  // JSON-LD structured data for rich snippets
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.seoDesc || post.title,
    datePublished: post.publishedAt || post.createdAt,
    dateModified: post.updatedAt,
    author: {
      '@type': 'Organization',
      name: 'Inbox0',
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Inbox0',
      url: SITE_URL,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/blog/${post.slug}`,
    },
  };

  return (
    <>
      {/* JSON-LD for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <article className="max-w-3xl mx-auto py-12 px-4">
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
        
        <div className="prose lg:prose-xl prose-headings:font-semibold prose-a:text-blue-600">
          <ReactMarkdown>{post.content}</ReactMarkdown>
        </div>
      </article>
    </>
  );
}