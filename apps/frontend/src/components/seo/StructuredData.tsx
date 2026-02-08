/**
 * StructuredData Component
 *
 * A reusable component for injecting Schema.org JSON-LD structured data
 * into the page head for SEO purposes.
 *
 * Usage:
 * ```tsx
 * <StructuredData schema={generateOrganizationSchema()} />
 * ```
 *
 * For multiple schemas:
 * ```tsx
 * <StructuredData
 *   schemas={[
 *     generateOrganizationSchema(),
 *     generateWebApplicationSchema()
 *   ]}
 * />
 * ```
 */

import React from 'react';

interface BaseSchema {
  '@context': string;
  '@type': string;
  [key: string]: any;
}

interface StructuredDataProps {
  /** Single schema object */
  schema?: BaseSchema;
  /** Multiple schema objects */
  schemas?: BaseSchema[];
}

export function StructuredData({ schema, schemas }: StructuredDataProps) {
  // Determine which data to render
  const data = schemas ? schemas : schema ? [schema] : [];

  if (data.length === 0) {
    return null;
  }

  // If single schema, render as object; if multiple, render as array
  const jsonLd = data.length === 1 ? data[0] : data;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
