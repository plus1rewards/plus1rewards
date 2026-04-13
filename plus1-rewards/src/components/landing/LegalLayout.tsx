// Shared layout for all legal/info pages
import { useNavigate } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'

interface LegalLayoutProps {
  title: string
  subtitle?: string
  lastUpdated?: string
  children: React.ReactNode
}

export default function LegalLayout({ title, subtitle, lastUpdated, children }: LegalLayoutProps) {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      {/* Hero band */}
      <div className="pt-24 pb-12 px-6 lg:px-20" style={{ backgroundColor: '#f5f8fc' }}>
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-6"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Back
          </button>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">{title}</h1>
          {subtitle && <p className="mt-2 text-gray-500 text-base">{subtitle}</p>}
          {lastUpdated && <p className="mt-3 text-xs text-gray-400 font-medium">Last updated: {lastUpdated}</p>}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 px-6 lg:px-20 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="prose prose-gray max-w-none">
            {children}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
