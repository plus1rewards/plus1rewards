// plus1-rewards/src/components/dashboard/pages/BlogAdminPage.tsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../DashboardLayout'
import { supabaseAdmin } from '../../../lib/supabase'

const BLUE = '#1a558b'

interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  category: string
  tags: string[]
  author: string
  cover_image_url: string | null
  reading_time: number
  featured: boolean
  published: boolean
  published_at: string | null
  created_at: string
  updated_at: string
}

// ─── Rich Text Editor ─────────────────────────────────────────────────────────

interface EditorProps {
  value: string
  onChange: (html: string) => void
}

function RichEditor({ value, onChange }: EditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')

  const exec = useCallback((cmd: string, val?: string) => {
    document.execCommand(cmd, false, val)
    editorRef.current?.focus()
    if (editorRef.current) onChange(editorRef.current.innerHTML)
  }, [onChange])

  const handleInput = () => {
    if (editorRef.current) onChange(editorRef.current.innerHTML)
  }

  // Sync external value only on mount
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value
    }
  }, []) // eslint-disable-line

  const colors = ['#1a568b', '#37d270', '#dc2626', '#f59e0b', '#7c3aed', '#0891b2', '#000000', '#374151', '#6b7280', '#ffffff']

  const ToolBtn = ({ cmd, icon, title, val }: { cmd?: string; icon: string; title: string; val?: string; onClick?: () => void }) => (
    <button
      type="button"
      title={title}
      onMouseDown={e => { e.preventDefault(); if (cmd) exec(cmd, val) }}
      className="p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-700"
    >
      <span className="material-symbols-outlined text-lg leading-none">{icon}</span>
    </button>
  )

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 bg-gray-50 border-b border-gray-200">
        {/* Text style */}
        <select
          className="text-xs border border-gray-200 rounded px-1.5 py-1 mr-1 bg-white"
          onChange={e => exec('formatBlock', e.target.value)}
          defaultValue=""
        >
          <option value="" disabled>Style</option>
          <option value="p">Paragraph</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="h4">Heading 4</option>
          <option value="blockquote">Quote</option>
        </select>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        <ToolBtn cmd="bold" icon="format_bold" title="Bold" />
        <ToolBtn cmd="italic" icon="format_italic" title="Italic" />
        <ToolBtn cmd="underline" icon="format_underlined" title="Underline" />
        <ToolBtn cmd="strikeThrough" icon="strikethrough_s" title="Strikethrough" />

        <div className="w-px h-5 bg-gray-300 mx-1" />

        <ToolBtn cmd="insertUnorderedList" icon="format_list_bulleted" title="Bullet list" />
        <ToolBtn cmd="insertOrderedList" icon="format_list_numbered" title="Numbered list" />

        <div className="w-px h-5 bg-gray-300 mx-1" />

        <ToolBtn cmd="justifyLeft" icon="format_align_left" title="Align left" />
        <ToolBtn cmd="justifyCenter" icon="format_align_center" title="Align center" />
        <ToolBtn cmd="justifyRight" icon="format_align_right" title="Align right" />

        <div className="w-px h-5 bg-gray-300 mx-1" />

        {/* Text color */}
        <div className="relative">
          <button
            type="button"
            title="Text color"
            onClick={() => setShowColorPicker(p => !p)}
            className="p-1.5 rounded hover:bg-gray-200 transition-colors"
          >
            <span className="material-symbols-outlined text-lg leading-none text-gray-700">format_color_text</span>
          </button>
          {showColorPicker && (
            <div className="absolute top-8 left-0 z-20 bg-white border border-gray-200 rounded-xl shadow-lg p-3 flex flex-wrap gap-2 w-40">
              {colors.map(c => (
                <button
                  key={c}
                  type="button"
                  title={c}
                  onMouseDown={e => { e.preventDefault(); exec('foreColor', c); setShowColorPicker(false) }}
                  className="size-6 rounded-full border border-gray-300 hover:scale-110 transition-transform"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Highlight */}
        <div className="relative">
          <button
            type="button"
            title="Highlight"
            onClick={() => exec('hiliteColor', '#fef08a')}
            className="p-1.5 rounded hover:bg-gray-200 transition-colors"
          >
            <span className="material-symbols-outlined text-lg leading-none text-gray-700">format_color_fill</span>
          </button>
        </div>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        {/* Link */}
        <div className="relative">
          <button
            type="button"
            title="Insert link"
            onClick={() => setShowLinkInput(p => !p)}
            className="p-1.5 rounded hover:bg-gray-200 transition-colors"
          >
            <span className="material-symbols-outlined text-lg leading-none text-gray-700">link</span>
          </button>
          {showLinkInput && (
            <div className="absolute top-8 left-0 z-20 bg-white border border-gray-200 rounded-xl shadow-lg p-3 flex gap-2 w-64">
              <input
                type="url"
                placeholder="https://..."
                value={linkUrl}
                onChange={e => setLinkUrl(e.target.value)}
                className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 outline-none"
              />
              <button
                type="button"
                onMouseDown={e => { e.preventDefault(); exec('createLink', linkUrl); setShowLinkInput(false); setLinkUrl('') }}
                className="px-2 py-1 text-xs font-bold text-white rounded"
                style={{ backgroundColor: BLUE }}
              >
                Add
              </button>
            </div>
          )}
        </div>

        <ToolBtn cmd="unlink" icon="link_off" title="Remove link" />
        <ToolBtn cmd="insertHorizontalRule" icon="horizontal_rule" title="Divider" />

        <div className="w-px h-5 bg-gray-300 mx-1" />

        <ToolBtn cmd="undo" icon="undo" title="Undo" />
        <ToolBtn cmd="redo" icon="redo" title="Redo" />
        <ToolBtn cmd="removeFormat" icon="format_clear" title="Clear formatting" />
      </div>

      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onClick={() => setShowColorPicker(false)}
        className="min-h-[320px] p-5 text-sm text-gray-800 outline-none focus:ring-0"
        style={{
          lineHeight: 1.8,
          fontFamily: 'Inter, sans-serif',
        }}
      />
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BlogAdminPage() {
  const navigate = useNavigate()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'list' | 'editor'>('list')
  const [editingPost, setEditingPost] = useState<Partial<BlogPost> | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchPosts = async () => {
    setLoading(true)
    const { data } = await supabaseAdmin
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false })
    setPosts(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchPosts() }, [])

  const newPost = () => {
    setEditingPost({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      category: 'Healthcare',
      tags: [],
      author: 'Plus1 Rewards Team',
      cover_image_url: null,
      reading_time: 3,
      featured: false,
      published: false,
    })
    setTagInput('')
    setView('editor')
  }

  const editPost = (post: BlogPost) => {
    setEditingPost({ ...post })
    setTagInput('')
    setView('editor')
  }

  const autoSlug = (title: string) =>
    title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()

  const handleTitleChange = (title: string) => {
    setEditingPost(p => ({
      ...p,
      title,
      slug: p?.id ? p.slug : autoSlug(title), // only auto-slug for new posts
    }))
  }

  const addTag = () => {
    const tag = tagInput.trim()
    if (!tag || editingPost?.tags?.includes(tag)) return
    setEditingPost(p => ({ ...p, tags: [...(p?.tags || []), tag] }))
    setTagInput('')
  }

  const removeTag = (tag: string) => {
    setEditingPost(p => ({ ...p, tags: (p?.tags || []).filter(t => t !== tag) }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImage(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `covers/${Date.now()}.${ext}`
      const { error } = await supabaseAdmin.storage.from('blog-images').upload(path, file, { upsert: true })
      if (error) throw error
      const { data: { publicUrl } } = supabaseAdmin.storage.from('blog-images').getPublicUrl(path)
      setEditingPost(p => ({ ...p, cover_image_url: publicUrl }))
    } catch (err: any) {
      alert(`Image upload failed: ${err?.message || 'Unknown error'}`)
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSave = async (publish?: boolean) => {
    if (!editingPost?.title || !editingPost?.slug || !editingPost?.content) {
      alert('Title, slug, and content are required.')
      return
    }
    setSaving(true)
    try {
      const payload = {
        ...editingPost,
        published: publish ?? editingPost.published,
        published_at: (publish ?? editingPost.published) ? new Date().toISOString() : editingPost.published_at,
      }
      if (editingPost.id) {
        const { error } = await supabaseAdmin.from('blog_posts').update(payload).eq('id', editingPost.id)
        if (error) throw error
      } else {
        const { error } = await supabaseAdmin.from('blog_posts').insert(payload)
        if (error) throw error
      }
      await fetchPosts()
      setView('list')
    } catch (err: any) {
      alert(`Save failed: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this post permanently?')) return
    await supabaseAdmin.from('blog_posts').delete().eq('id', id)
    fetchPosts()
  }

  const togglePublish = async (post: BlogPost) => {
    await supabaseAdmin.from('blog_posts').update({
      published: !post.published,
      published_at: !post.published ? new Date().toISOString() : null,
    }).eq('id', post.id)
    fetchPosts()
  }

  // ── List view ──
  if (view === 'list') return (
    <DashboardLayout>
      <main className="flex-1 overflow-y-auto bg-[#f5f8fc]">
        <header className="flex items-center justify-between gap-4 p-6 md:p-10 pb-6">
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Blog Posts</h2>
            <p className="text-gray-500 text-sm mt-1">Create and manage public blog articles</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="flex items-center gap-2 px-4 py-2.5 font-bold rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 text-sm"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              Back
            </button>
            <button
              onClick={newPost}
              className="flex items-center gap-2 px-5 py-2.5 font-bold rounded-lg text-white text-sm"
              style={{ backgroundColor: BLUE }}
            >
              <span className="material-symbols-outlined text-lg">add</span>
              New Post
            </button>
          </div>
        </header>

        <div className="px-6 md:px-10 pb-10">
          {loading ? (
            <div className="text-center py-20 text-gray-400">Loading...</div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20">
              <span className="material-symbols-outlined text-5xl text-gray-300 mb-4 block">edit_note</span>
              <p className="text-gray-500 font-medium">No posts yet. Create your first one.</p>
              <button onClick={newPost} className="mt-4 px-5 py-2.5 rounded-xl font-bold text-white text-sm" style={{ backgroundColor: BLUE }}>
                Create Post
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Title', 'Category', 'Status', 'Date', 'Actions'].map(h => (
                      <th key={h} className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {posts.map(post => (
                    <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {post.cover_image_url && (
                            <img src={post.cover_image_url} alt="" className="size-10 rounded-lg object-cover flex-shrink-0" />
                          )}
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{post.title}</p>
                            <p className="text-xs text-gray-400">/blog/{post.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: 'rgba(26,85,139,0.1)', color: BLUE }}>
                          {post.category}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <button onClick={() => togglePublish(post)} className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border transition-all ${
                          post.published
                            ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                            : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                        }`}>
                          {post.published ? '● Published' : '○ Draft'}
                        </button>
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-400">
                        {new Date(post.created_at).toLocaleDateString('en-ZA')}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => editPost(post)} className="p-1.5 rounded-lg bg-gray-100 hover:bg-blue-50 hover:text-blue-600 transition-colors" title="Edit">
                            <span className="material-symbols-outlined text-sm">edit</span>
                          </button>
                          <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-gray-100 hover:bg-green-50 hover:text-green-600 transition-colors" title="Preview">
                            <span className="material-symbols-outlined text-sm">open_in_new</span>
                          </a>
                          <button onClick={() => handleDelete(post.id)} className="p-1.5 rounded-lg bg-gray-100 hover:bg-red-50 hover:text-red-600 transition-colors" title="Delete">
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </DashboardLayout>
  )

  // ── Editor view ──
  return (
    <DashboardLayout>
      <main className="flex-1 overflow-y-auto bg-[#f5f8fc]">
        <header className="flex items-center justify-between gap-4 p-6 md:p-10 pb-6">
          <div>
            <h2 className="text-2xl font-black text-gray-900">{editingPost?.id ? 'Edit Post' : 'New Post'}</h2>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setView('list')} className="px-4 py-2.5 font-bold rounded-lg border border-gray-200 bg-white text-gray-700 text-sm">
              Cancel
            </button>
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="px-4 py-2.5 font-bold rounded-lg border-2 text-sm transition-all"
              style={{ borderColor: BLUE, color: BLUE }}
            >
              {saving ? 'Saving...' : 'Save Draft'}
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={saving}
              className="px-5 py-2.5 font-bold rounded-lg text-white text-sm"
              style={{ backgroundColor: BLUE }}
            >
              {saving ? 'Publishing...' : editingPost?.published ? 'Update & Publish' : 'Publish'}
            </button>
          </div>
        </header>

        <div className="px-6 md:px-10 pb-10 grid lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-5">
            {/* Title */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Title *</label>
              <input
                type="text"
                value={editingPost?.title || ''}
                onChange={e => handleTitleChange(e.target.value)}
                placeholder="Your blog post title..."
                className="w-full text-xl font-bold text-gray-900 outline-none placeholder:text-gray-300 border-none"
              />
            </div>

            {/* Excerpt */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Excerpt *</label>
              <textarea
                value={editingPost?.excerpt || ''}
                onChange={e => setEditingPost(p => ({ ...p, excerpt: e.target.value }))}
                placeholder="Short description shown on the blog listing page..."
                rows={2}
                className="w-full text-sm text-gray-700 outline-none resize-none placeholder:text-gray-300"
              />
            </div>

            {/* Rich text editor */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Content *</label>
              <RichEditor
                value={editingPost?.content || ''}
                onChange={content => setEditingPost(p => ({ ...p, content }))}
              />
            </div>
          </div>

          {/* Sidebar settings */}
          <div className="space-y-5">
            {/* Cover image */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Cover Image</label>
              {editingPost?.cover_image_url ? (
                <div className="relative">
                  <img src={editingPost.cover_image_url} alt="Cover" className="w-full h-36 object-cover rounded-lg" />
                  <button
                    onClick={() => setEditingPost(p => ({ ...p, cover_image_url: null }))}
                    className="absolute top-2 right-2 size-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="w-full h-28 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-blue-300 hover:bg-blue-50 transition-all text-gray-400 hover:text-blue-500"
                >
                  <span className="material-symbols-outlined text-2xl">{uploadingImage ? 'hourglass_empty' : 'add_photo_alternate'}</span>
                  <span className="text-xs font-medium">{uploadingImage ? 'Uploading...' : 'Upload cover image'}</span>
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </div>

            {/* Slug */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">URL Slug *</label>
              <div className="flex items-center gap-1 text-xs text-gray-400 mb-2">/blog/<span className="text-gray-600 font-medium">{editingPost?.slug || '...'}</span></div>
              <input
                type="text"
                value={editingPost?.slug || ''}
                onChange={e => setEditingPost(p => ({ ...p, slug: e.target.value }))}
                placeholder="my-post-slug"
                className="w-full text-sm text-gray-700 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400"
              />
            </div>

            {/* Category + Author + Reading time */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Category</label>
                <select
                  value={editingPost?.category || 'Healthcare'}
                  onChange={e => setEditingPost(p => ({ ...p, category: e.target.value }))}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400"
                >
                  {['Healthcare', 'Cashback', 'How-To', 'Partner Stories', 'News', 'Tips'].map(c => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Author</label>
                <input
                  type="text"
                  value={editingPost?.author || ''}
                  onChange={e => setEditingPost(p => ({ ...p, author: e.target.value }))}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Reading Time (min)</label>
                <input
                  type="number"
                  min={1}
                  value={editingPost?.reading_time || 3}
                  onChange={e => setEditingPost(p => ({ ...p, reading_time: parseInt(e.target.value) || 3 }))}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="featured"
                  checked={editingPost?.featured || false}
                  onChange={e => setEditingPost(p => ({ ...p, featured: e.target.checked }))}
                  className="rounded"
                />
                <label htmlFor="featured" className="text-sm font-medium text-gray-700">Featured post</label>
              </div>
            </div>

            {/* Tags */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Tags</label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="Add tag..."
                  className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400"
                />
                <button onClick={addTag} className="px-3 py-2 rounded-lg text-white text-sm font-bold" style={{ backgroundColor: BLUE }}>
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(editingPost?.tags || []).map(tag => (
                  <span key={tag} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: 'rgba(26,85,139,0.1)', color: BLUE }}>
                    {tag}
                    <button onClick={() => removeTag(tag)} className="hover:text-red-500 transition-colors">×</button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </DashboardLayout>
  )
}
