// plus1-rewards/src/components/landing/Navbar.tsx
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePWAInstall } from '../../hooks/usePWAInstall'

const BLUE = '#1a558b'

const NAV_LINKS = [
  { href: '/#how-it-works', text: 'How it Works' },
  { href: '/#roles',        text: 'Partners' },
  { href: '/blog',          text: 'Blog' },
  { href: '/faq',           text: 'FAQ' },
  { href: '/find-partner',  text: 'Find a Store' },
]

const MOBILE_LINKS = [
  { href: '/#how-it-works', icon: 'info',         text: 'How it Works' },
  { href: '/#roles',        icon: 'storefront',   text: 'Partners' },
  { href: '/blog',          icon: 'edit_note',    text: 'Blog' },
  { href: '/faq',           icon: 'help',         text: 'FAQ' },
  { href: '/find-partner',  icon: 'location_on',  text: 'Find a Store' },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { canInstall, isInstalling, install } = usePWAInstall()

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 px-6 lg:px-20 py-3"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      }}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div className="max-w-[1800px] mx-auto flex items-center justify-between gap-6">

        {/* Logo */}
        <motion.a
          href="/"
          className="flex-shrink-0"
          whileHover={{ scale: 1.04 }}
          transition={{ duration: 0.2 }}
        >
          <img
            src="/logo.png"
            alt="+1 Rewards"
            className="w-auto object-contain"
            style={{ height: '52px' }}
            width="413"
            height="160"
          />
        </motion.a>

        {/* Desktop nav links */}
        <motion.div
          className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {NAV_LINKS.map((link, i) => (
            <motion.a
              key={link.text}
              href={link.href}
              className="relative hover:text-[#1a558b] transition-colors"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.25 + i * 0.07 }}
              whileHover={{ y: -1 }}
            >
              {link.text}
              <motion.span
                className="absolute -bottom-0.5 left-0 h-0.5 w-0 rounded-full"
                style={{ backgroundColor: BLUE }}
                whileHover={{ width: '100%' }}
                transition={{ duration: 0.25 }}
              />
            </motion.a>
          ))}
        </motion.div>

        {/* Desktop CTA */}
        <motion.div
          className="hidden md:flex items-center gap-2"
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {/* Install App — leftmost, subtle */}
          {canInstall && (
            <motion.button
              onClick={install}
              disabled={isInstalling}
              title={isInstalling ? 'Installing...' : 'Install App'}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition-all"
              style={{ borderColor: 'rgba(26,85,139,0.3)', color: BLUE }}
              whileHover={{ backgroundColor: 'rgba(26,85,139,0.07)' }}
              whileTap={{ scale: 0.95 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 16V4" /><path d="M8 12l4 4 4-4" /><path d="M4 20h16" />
              </svg>
              {isInstalling ? 'Installing...' : 'Install App'}
            </motion.button>
          )}

          {/* Sign In */}
          <motion.a
            href="/login"
            className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-[#1a558b] transition-colors rounded-lg hover:bg-gray-100"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            Sign In
          </motion.a>

          {/* Primary CTA */}
          <motion.button
            className="px-5 py-2 rounded-lg font-bold text-sm text-white shadow-sm"
            style={{ backgroundColor: BLUE }}
            onClick={() => window.location.href = '/register'}
            whileHover={{ scale: 1.04, boxShadow: '0 8px 20px rgba(26,85,139,0.3)' }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            Start Earning →
          </motion.button>
        </motion.div>

        {/* Mobile hamburger */}
        <motion.button
          className="md:hidden text-gray-700 p-1"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
          whileTap={{ scale: 0.9 }}
        >
          <motion.span
            className="material-symbols-outlined text-2xl"
            animate={{ rotate: menuOpen ? 90 : 0 }}
            transition={{ duration: 0.25 }}
          >
            {menuOpen ? 'close' : 'menu'}
          </motion.span>
        </motion.button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="overflow-hidden"
          >
            <div className="md:hidden mt-3 pb-5 border-t border-gray-100 pt-4 flex flex-col gap-1">
              {/* Nav links */}
              {MOBILE_LINKS.map((item, i) => (
                <motion.a
                  key={item.text}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-800 hover:bg-blue-50 rounded-xl transition-all"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.04 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="material-symbols-outlined text-lg" style={{ color: BLUE }}>{item.icon}</span>
                  {item.text}
                </motion.a>
              ))}

              {/* Buttons */}
              <div className="mt-3 px-4 flex flex-col gap-2.5">
                <a
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="text-center py-3 text-sm font-bold rounded-xl border-2 transition-all"
                  style={{ color: BLUE, borderColor: BLUE }}
                >
                  Sign In
                </a>

                {canInstall && (
                  <button
                    onClick={() => { install(); setMenuOpen(false) }}
                    disabled={isInstalling}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold border-2 transition-all"
                    style={{ borderColor: 'rgba(26,85,139,0.4)', color: BLUE }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 16V4" /><path d="M8 12l4 4 4-4" /><path d="M4 20h16" />
                    </svg>
                    {isInstalling ? 'Installing...' : 'Install App'}
                  </button>
                )}

                <button
                  className="py-3 rounded-xl font-bold text-sm text-white shadow-md"
                  style={{ backgroundColor: BLUE }}
                  onClick={() => { window.location.href = '/register'; setMenuOpen(false) }}
                >
                  Get Started →
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
