// plus1-rewards/src/pages/Blog.tsx
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import Navbar from '../components/landing/Navbar'
import Footer from '../components/landing/Footer'
import SEO from '../components/SEO'
import { supabase } from '../lib/supabase'

const BLUE = '#1a558b'

interface BlogPost {
  id: string; slug: string; title: string; excerpt: string; category: string
  tags: string[]; author: string; cover_image_url: string | null
  reading_time: number; featured: boolean; published_at: string | null; created_at: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('All')

  useEffect(() => {
    supabase.from('blog_posts').select('id,slug,title,excerpt,category,tags,author,cover_image_url,reading_time,featured,published_at,created_at')
      .eq('published', true).order('published_at', { ascending: false })
      .then(({ data }) => { setPosts(data || []); setLoading(false) })
  }, [])

  const categories = ['All', ...Array.from(new Set(posts.map(p => p.category)))]
  const filtered = activeCategory === 'All' ? posts : posts.filter(p => p.category === activeCategory)
  const isEmpty = !loading && posts.length === 0

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SEO
        title="Blog | Plus1 Rewards — Healthcare & Cashback Insights"
        description="Tips, guides, and insights on cashback medical cover, healthcare funding, and how to make your shopping work harder for your health in South Africa."
        keywords="cashback medical aid South Africa, how to pay medical aid with rewards, healthcare cashback app South Africa, medical cover tips, Plus1 Rewards blog"
      />

      <Navbar />

      {/* Hero band */}
      <div className="pt-24 pb-14 px-6 lg:px-20" style={{ backgroundColor: '#f5f8fc' }}>
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span
              className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4"
              style={{ backgroundColor: 'rgba(26,85,139,0.1)', color: BLUE }}
            >
              Blog
            </span>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-4">
              Healthcare & Cashback Insights
            </h1>
            <p className="text-gray-500 text-base max-w-xl leading-relaxed">
              Guides, tips, and news on making your everyday shopping fund your medical cover in South Africa.
            </p>
          </motion.div>
        </div>
      </div>

      <main className="flex-1 px-6 lg:px-20 py-12">
        <div className="max-w-5xl mx-auto">

          {/* Loading */}
          {loading && (
            <div className="text-center py-24 text-gray-400">
              <span className="material-symbols-outlined text-4xl block mb-3" style={{ animation: 'spin 1s linear infinite' }}>progress_activity</span>
              Loading articles...
            </div>
          )}

          {/* Category filter — only show when there are posts */}
          {!isEmpty && categories.length > 1 && (
            <div className="flex flex-wrap gap-2 mb-10">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className="px-4 py-1.5 rounded-full text-sm font-semibold transition-all"
                  style={{
                    backgroundColor: activeCategory === cat ? BLUE : 'rgba(26,85,139,0.08)',
                    color: activeCategory === cat ? '#fff' : BLUE,
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Empty state */}
          {isEmpty && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center py-24"
            >
              <div
                className="inline-flex items-center justify-center size-20 rounded-2xl mb-6"
                style={{ backgroundColor: 'rgba(26,85,139,0.08)' }}
              >
                <span className="material-symbols-outlined text-4xl" style={{ color: BLUE }}>
                  edit_note
                </span>
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-3">Articles coming soon</h2>
              <p className="text-gray-500 text-sm max-w-sm mx-auto leading-relaxed">
                We're working on helpful guides about cashback healthcare, medical cover tips, and more.
                Check back soon.
              </p>

              {/* Teaser topics */}
              <div className="mt-10 grid sm:grid-cols-3 gap-4 max-w-2xl mx-auto text-left">
                {[
                  {
                    icon: 'favorite',
                    title: 'Cashback Medical Aid South Africa',
                    desc: 'How everyday shopping can fund your medical cover.',
                  },
                  {
                    icon: 'payments',
                    title: 'How to Pay Medical Aid With Rewards',
                    desc: 'A step-by-step guide to funding cover through cashback.',
                  },
                  {
                    icon: 'phone_android',
                    title: 'Healthcare Cashback App South Africa',
                    desc: 'Why Plus1 Rewards is the smarter way to stay covered.',
                  },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.1 }}
                    className="rounded-xl border border-gray-200 p-5 bg-white"
                  >
                    <div
                      className="size-9 rounded-lg flex items-center justify-center mb-3"
                      style={{ backgroundColor: 'rgba(26,85,139,0.08)' }}
                    >
                      <span className="material-symbols-outlined text-lg" style={{ color: BLUE }}>
                        {item.icon}
                      </span>
                    </div>
                    <p className="font-bold text-gray-900 text-sm mb-1">{item.title}</p>
                    <p className="text-gray-500 text-xs leading-relaxed">{item.desc}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Post grid */}
          {!isEmpty && filtered.length === 0 && (
            <p className="text-gray-500 text-sm py-12 text-center">No posts in this category yet.</p>
          )}

          {!isEmpty && filtered.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((post, i) => (
                <motion.article
                  key={post.slug}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="group rounded-2xl border border-gray-200 overflow-hidden bg-white hover:shadow-lg transition-all hover:-translate-y-1"
                >
                  {/* Cover image */}
                  {post.cover_image_url ? (
                    <div className="h-44 overflow-hidden bg-gray-100">
                      <img
                        src={post.cover_image_url}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  ) : (
                    <div
                      className="h-44 flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${BLUE}, #0d3d6e)` }}
                    >
                      <span className="material-symbols-outlined text-5xl text-white/30">article</span>
                    </div>
                  )}

                  <div className="p-5">
                    {/* Category + read time */}
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: 'rgba(26,85,139,0.1)', color: BLUE }}
                      >
                        {post.category}
                      </span>
                      <span className="text-[10px] text-gray-400">{post.readingTime} min read</span>
                    </div>

                    <h2 className="font-bold text-gray-900 text-base leading-snug mb-2 group-hover:text-[#1a558b] transition-colors">
                      <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                    </h2>

                    <p className="text-gray-500 text-xs leading-relaxed mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>

                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-400">{formatDate(post.published_at || post.created_at)}</span>
                      <Link
                        to={`/blog/${post.slug}`}
                        className="text-xs font-bold transition-colors"
                        style={{ color: BLUE }}
                      >
                        Read more →
                      </Link>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
