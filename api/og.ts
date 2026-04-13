// api/og.ts — Vercel Serverless Function
// Social bots get OG meta HTML. Real browsers get the React SPA.

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { readFileSync } from 'fs'
import { join } from 'path'

const SUPABASE_URL = 'https://gcbmlxdxwakkubpldype.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const BOT_PATTERN = /facebookexternalhit|facebot|twitterbot|linkedinbot|whatsapp|telegrambot|slackbot|discordbot|googlebot|bingbot|applebot|pinterest|vkshare|w3c_validator|ia_archiver|rogerbot|embedly|quora|outbrain|flipboard|bitlybot|skypeuripreview|nuzzel|disqus|redditbot|qwantify|pinterestbot|yandexbot/i

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const slug = req.query.slug as string
  if (!slug) return res.redirect(302, '/')

  const ua = req.headers['user-agent'] || ''
  const isBot = BOT_PATTERN.test(ua)

  // Real browser — serve the React SPA index.html directly (no redirect loop)
  if (!isBot) {
    try {
      const indexPath = join(process.cwd(), 'plus1-rewards', 'dist', 'index.html')
      const html = readFileSync(indexPath, 'utf-8')
      res.setHeader('Content-Type', 'text/html')
      return res.status(200).send(html)
    } catch {
      return res.redirect(302, '/')
    }
  }

  // Bot — fetch post and return OG meta HTML
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/blog_posts?slug=eq.${encodeURIComponent(slug)}&published=eq.true&select=title,excerpt,cover_image_url,author,published_at,category&limit=1`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
      }
    )

    const posts = await response.json()
    const post = posts?.[0]

    if (!post) {
      return res.redirect(302, '/blog')
    }

    const base = 'https://plus1rewards.com'
    const pageUrl = `${base}/blog/${slug}`
    const image = post.cover_image_url || `${base}/thumbnail.png`
    const title = `${esc(post.title)} | Plus1 Rewards Blog`
    const description = esc(post.excerpt)

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <meta property="og:type" content="article" />
  <meta property="og:url" content="${pageUrl}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${esc(image)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="${esc(post.title)}" />
  <meta property="og:site_name" content="Plus1 Rewards" />
  <meta property="og:locale" content="en_ZA" />
  <meta property="article:author" content="${esc(post.author)}" />
  ${post.published_at ? `<meta property="article:published_time" content="${post.published_at}" />` : ''}
  <meta property="article:section" content="${esc(post.category)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${esc(image)}" />
  <link rel="canonical" href="${pageUrl}" />
</head>
<body><p><a href="${pageUrl}">${title}</a></p></body>
</html>`

    res.setHeader('Content-Type', 'text/html')
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600')
    return res.status(200).send(html)

  } catch {
    return res.redirect(302, `/blog/${slug}`)
  }
}

function esc(str: string = ''): string {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
