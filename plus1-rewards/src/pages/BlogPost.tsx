// plus1-rewards/src/pages/BlogPost.tsx
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Navbar from '../components/landing/Navbar'
import Footer from '../components/landing/Footer'
import SEO from '../components/SEO'
import { supabase } from '../lib/supabase'

const BLUE = '#1a558b'

interface Post {
  id: string; slug: string; title: string; excerpt: string; content: string
  category: string; tags: string[]; author: string; cover_image_url: string | null
  reading_time: number; published_at: string | null; created_at: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [post, setPost] = useState<Post | null>(null)
  const [related, setRelated] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) return
    supabase.from('blog_posts').select('*').eq('slug', slug).eq('published', true).single()
      .then(({ data }) => {
        setPost(data)
        setLoading(false)
        if (data) {
          supabase.from('blog_posts')
            .select('id,slug,title,category,published_at,created_at')
            .eq('published', true).eq('category', data.category).neq('slug', slug).limit(3)
            .then(({ data: rel }) => setRelated(rel || []))
        }
      })
  }, [slug])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <span className="material-symbols-outlined text-4xl text-gray-300">progress_activity</span>
    </div>
  )

  if (!post) return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-6 py-24">
        <div className="text-center">
          <p className="text-5xl mb-4">📄</p>
          <h1 className="text-2xl font-black text-gray-900 mb-2">Post not found</h1>
          <p className="text-gray-500 text-sm mb-6">This article doesn't exist or may have been moved.</p>
          <Link to="/blog" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white" style={{ backgroundColor: BLUE }}>
            ← Back to Blog
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SEO
        title={`${post.title} | Plus1 Rewards Blog`}
        description={post.excerpt}
        keywords={post.tags.join(', ')}
        image={post.cover_image_url || undefined}
        type="article"
        ogUrl={`https://gcbmlxdxwakkubpldype.supabase.co/functions/v1/og-meta?slug=${post.slug}`}
      />

      <Navbar />

      {/* Hero */}
      <div className="pt-24 pb-10 px-6 lg:px-20" style={{ backgroundColor: '#f5f8fc' }}>
        <div className="max-w-3xl mx-auto">
          <button onClick={() => navigate('/blog')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-6">
            <span className="material-symbols-outlined text-base">arrow_back</span>
            All articles
          </button>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full" style={{ backgroundColor: 'rgba(26,85,139,0.1)', color: BLUE }}>
                {post.category}
              </span>
              <span className="text-xs text-gray-400">{post.reading_time} min read</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight leading-tight mb-4">{post.title}</h1>
            <p className="text-gray-500 text-base leading-relaxed mb-6">{post.excerpt}</p>
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: BLUE }}>
                {post.author.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{post.author}</p>
                <p className="text-xs text-gray-400">{formatDate(post.published_at || post.created_at)}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Cover image */}
      {post.cover_image_url && (
        <div className="px-6 lg:px-20 mb-0">
          <div className="max-w-3xl mx-auto rounded-2xl overflow-hidden shadow-md">
            <img src={post.cover_image_url} alt={post.title} className="w-full h-64 md:h-80 object-cover" />
          </div>
        </div>
      )}

      {/* Article body */}
      <main className="flex-1 px-6 lg:px-20 py-12">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="prose prose-gray prose-lg max-w-none
              prose-headings:font-black prose-headings:text-gray-900
              prose-p:text-gray-600 prose-p:leading-relaxed
              prose-a:text-[#1a558b] prose-a:font-semibold prose-a:no-underline hover:prose-a:underline
              prose-strong:text-gray-900
              prose-ul:text-gray-600 prose-ol:text-gray-600
              prose-blockquote:border-l-[#1a558b] prose-blockquote:text-gray-500"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="mt-10 pt-8 border-t border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Tags</p>
              <div className="flex flex-wrap gap-2">
                {post.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: 'rgba(26,85,139,0.08)', color: BLUE }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="mt-12 p-8 rounded-2xl text-center" style={{ background: `linear-gradient(135deg, ${BLUE}, #0d3d6e)` }}>
            <h3 className="text-xl font-black text-white mb-2">Ready to start earning?</h3>
            <p className="text-white/70 text-sm mb-5">Join Plus1 Rewards and let your shopping fund your medical cover.</p>
            <Link to="/register" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm hover:opacity-90" style={{ backgroundColor: '#37d270', color: '#fff' }}>
              Get Started Free →
            </Link>
          </div>

          {/* Related posts */}
          {related.length > 0 && (
            <div className="mt-14">
              <h3 className="text-lg font-black text-gray-900 mb-6">Related Articles</h3>
              <div className="grid sm:grid-cols-3 gap-4">
                {related.map((p: any) => (
                  <Link key={p.slug} to={`/blog/${p.slug}`} className="group rounded-xl border border-gray-200 p-4 hover:border-[#1a558b]/30 hover:shadow-md transition-all">
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full mb-2 inline-block" style={{ backgroundColor: 'rgba(26,85,139,0.1)', color: BLUE }}>
                      {p.category}
                    </span>
                    <p className="font-bold text-gray-900 text-sm leading-snug group-hover:text-[#1a558b] transition-colors">{p.title}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatDate(p.published_at || p.created_at)}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
