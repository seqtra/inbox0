import { MetadataRoute } from 'next';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:3000';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://inbox0.com';

interface BlogPost {
  id: string;
  slug: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt?: string;
}

async function getAllPublishedPosts(): Promise<BlogPost[]> {
  try {
    const res = await fetch(`${API_BASE}/api/blogs`, {
      next: { revalidate: 3600 } // Revalidate every hour
    });
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    console.error('Failed to fetch posts for sitemap:', error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fetch all published blog posts
  const posts = await getAllPublishedPosts();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/dashboard`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
  ];

  // Dynamic blog post pages
  const blogPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: post.updatedAt
      ? new Date(post.updatedAt)
      : post.publishedAt
        ? new Date(post.publishedAt)
        : new Date(post.createdAt),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...blogPages];
}
