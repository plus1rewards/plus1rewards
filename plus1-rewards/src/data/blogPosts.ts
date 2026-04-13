// plus1-rewards/src/data/blogPosts.ts
// ─────────────────────────────────────────────────────────────────────────────
// ADD YOUR BLOG POSTS HERE
// Each post needs: slug, title, excerpt, content, category, tags, author,
//                  publishedAt, readingTime
// Optional:        coverImage, featured
//
// EXAMPLE POST STRUCTURE:
// {
//   slug: 'cashback-medical-aid-south-africa',
//   title: 'Cashback Medical Aid South Africa: A New Way to Fund Your Cover',
//   excerpt: 'Discover how cashback rewards from everyday shopping can fund your medical cover in South Africa.',
//   content: `<p>Your full article HTML goes here...</p>`,
//   category: 'Healthcare',
//   tags: ['cashback', 'medical aid', 'South Africa', 'healthcare funding'],
//   author: 'Plus1 Rewards Team',
//   publishedAt: '2026-04-13',
//   readingTime: 5,
//   featured: true,
// }
// ─────────────────────────────────────────────────────────────────────────────

import type { BlogPost } from '../types/blog'

export const blogPosts: BlogPost[] = [
  // ← Paste your blog posts here
]

// Helper: get a post by slug
export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find(p => p.slug === slug)
}

// Helper: get posts by category
export function getPostsByCategory(category: string): BlogPost[] {
  return blogPosts.filter(p => p.category === category)
}

// Helper: get featured posts
export function getFeaturedPosts(): BlogPost[] {
  return blogPosts.filter(p => p.featured)
}

// Helper: get all unique categories
export function getAllCategories(): string[] {
  return [...new Set(blogPosts.map(p => p.category))]
}

// Helper: format date nicely
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
