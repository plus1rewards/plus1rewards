// plus1-rewards/src/types/blog.ts

export interface BlogPost {
  slug: string           // URL: /blog/cashback-medical-aid-south-africa
  title: string          // Page <title> and H1
  excerpt: string        // Short description shown on listing page + meta description
  content: string        // Full HTML or markdown content (use HTML string for now)
  category: string       // e.g. "Healthcare", "Cashback", "How-To"
  tags: string[]         // e.g. ["medical aid", "cashback", "South Africa"]
  author: string         // e.g. "Plus1 Rewards Team"
  publishedAt: string    // ISO date string e.g. "2026-04-13"
  readingTime: number    // minutes
  coverImage?: string    // optional image path e.g. "/blog/cover-cashback.jpg"
  featured?: boolean     // show prominently on listing page
}
