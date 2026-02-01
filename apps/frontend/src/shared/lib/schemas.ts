/**
 * Schema.org JSON-LD Generator Utilities
 *
 * This module provides type-safe functions to generate Schema.org structured data
 * for SEO purposes. All schemas follow the Schema.org specification.
 *
 * @see https://schema.org/
 * @see https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://inbox0.com';

// Type definitions for Schema.org JSON-LD
type SchemaContext = 'https://schema.org';

interface BaseSchema {
  '@context': SchemaContext;
  '@type': string;
}

interface OrganizationSchema extends BaseSchema {
  '@type': 'Organization';
  name: string;
  alternateName?: string;
  url: string;
  logo?: string;
  description?: string;
  email?: string;
  sameAs?: string[];
  contactPoint?: {
    '@type': 'ContactPoint';
    contactType: string;
    email?: string;
    availableLanguage?: string[];
  };
}

interface WebApplicationSchema extends BaseSchema {
  '@type': 'WebApplication';
  name: string;
  applicationCategory: string;
  operatingSystem: string;
  description: string;
  url: string;
  browserRequirements?: string;
  offers?: {
    '@type': 'Offer';
    price: string;
    priceCurrency: string;
    description: string;
    availability: string;
  };
  aggregateRating?: {
    '@type': 'AggregateRating';
    ratingValue: string;
    ratingCount: string;
    bestRating: string;
    worstRating: string;
  };
  featureList?: string[];
}

interface ReviewSchema extends BaseSchema {
  '@type': 'Review';
  itemReviewed: {
    '@type': 'WebApplication';
    name: string;
  };
  author: {
    '@type': 'Person';
    name: string;
  };
  reviewRating: {
    '@type': 'Rating';
    ratingValue: number;
    bestRating: number;
    worstRating: number;
  };
  reviewBody: string;
}

interface FAQPageSchema extends BaseSchema {
  '@type': 'FAQPage';
  mainEntity: Array<{
    '@type': 'Question';
    name: string;
    acceptedAnswer: {
      '@type': 'Answer';
      text: string;
    };
  }>;
}

interface BlogPostingSchema extends BaseSchema {
  '@type': 'BlogPosting';
  headline: string;
  description: string;
  datePublished: string;
  dateModified: string;
  author: {
    '@type': 'Organization';
    name: string;
    url: string;
  };
  publisher: {
    '@type': 'Organization';
    name: string;
    url: string;
    logo?: {
      '@type': 'ImageObject';
      url: string;
    };
  };
  mainEntityOfPage: {
    '@type': 'WebPage';
    '@id': string;
  };
  image?: {
    '@type': 'ImageObject';
    url: string;
  };
}

interface BreadcrumbListSchema extends BaseSchema {
  '@type': 'BreadcrumbList';
  itemListElement: Array<{
    '@type': 'ListItem';
    position: number;
    name: string;
    item: string;
  }>;
}

/**
 * Organization Schema
 * Used on all pages to establish brand identity
 *
 * @see https://schema.org/Organization
 */
export function generateOrganizationSchema(): OrganizationSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'inbox-0',
    alternateName: 'inbox0',
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description: 'AI-powered email filtering delivered to WhatsApp. Stop drowning in your inbox.',
    email: 'support@inbox0.com',
    sameAs: [
      'https://x.com/inbox0',
      // Add other social media links here as they become available
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Support',
      email: 'support@inbox0.com',
      availableLanguage: ['English'],
    },
  };
}

/**
 * WebApplication Schema
 * Used on landing page to describe the product
 *
 * @see https://schema.org/WebApplication
 */
export function generateWebApplicationSchema(): WebApplicationSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'inbox-0',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web Browser, iOS, Android',
    description: 'AI-powered email filtering that delivers important emails to WhatsApp. Stop drowning in your inbox with smart email summaries.',
    url: SITE_URL,
    browserRequirements: 'Requires JavaScript. Requires HTML5.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: '14-day free trial with no credit card required',
      availability: 'https://schema.org/InStock',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      ratingCount: '1000',
      bestRating: '5',
      worstRating: '1',
    },
    featureList: [
      'AI-powered email filtering',
      'WhatsApp notifications',
      'Smart email summaries',
      'Automatic learning from your preferences',
      '99% accuracy',
      '2-minute setup',
    ],
  };
}

/**
 * Review Schema Generator
 * Creates review schemas from testimonial data
 *
 * @see https://schema.org/Review
 */
export interface ReviewData {
  author: string;
  role?: string;
  company?: string;
  quote: string;
  rating?: number; // Default: 5
}

export function generateReviewSchema(review: ReviewData): ReviewSchema {
  const authorName = review.role && review.company
    ? `${review.author}, ${review.role} at ${review.company}`
    : review.role
      ? `${review.author}, ${review.role}`
      : review.company
        ? `${review.author} at ${review.company}`
        : review.author;

  return {
    '@context': 'https://schema.org',
    '@type': 'Review',
    itemReviewed: {
      '@type': 'WebApplication',
      name: 'inbox-0',
    },
    author: {
      '@type': 'Person',
      name: authorName,
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: review.rating || 5,
      bestRating: 5,
      worstRating: 1,
    },
    reviewBody: review.quote,
  };
}

/**
 * FAQ Page Schema Generator
 * Creates FAQPage schema from Q&A data
 *
 * @see https://schema.org/FAQPage
 */
export interface FAQItem {
  question: string;
  answer: string;
}

export function generateFAQPageSchema(faqs: FAQItem[]): FAQPageSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/**
 * Blog Posting Schema Generator
 * Creates BlogPosting schema for blog articles
 *
 * @see https://schema.org/BlogPosting
 */
export interface BlogPostData {
  title: string;
  description: string;
  slug: string;
  publishedAt: string;
  updatedAt: string;
  author?: string;
  imageUrl?: string;
}

export function generateBlogPostingSchema(post: BlogPostData): BlogPostingSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: {
      '@type': 'Organization',
      name: post.author || 'Inbox0 Team',
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Inbox0',
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/blog/${post.slug}`,
    },
    ...(post.imageUrl && {
      image: {
        '@type': 'ImageObject',
        url: post.imageUrl,
      },
    }),
  };
}

/**
 * Breadcrumb List Schema Generator
 * Creates breadcrumb navigation schema
 *
 * @see https://schema.org/BreadcrumbList
 */
export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function generateBreadcrumbSchema(items: BreadcrumbItem[]): BreadcrumbListSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Helper function to convert schema object to JSON-LD script props
 * Use this with Next.js Script component or script tag
 */
export function schemaToScriptProps(schema: BaseSchema) {
  return {
    type: 'application/ld+json',
    dangerouslySetInnerHTML: { __html: JSON.stringify(schema) },
  };
}

/**
 * Combine multiple schemas into an array for a single script tag
 * Useful when you need to include multiple schemas on one page
 */
export function combineSchemas(...schemas: BaseSchema[]) {
  return {
    type: 'application/ld+json',
    dangerouslySetInnerHTML: { __html: JSON.stringify(schemas) },
  };
}
