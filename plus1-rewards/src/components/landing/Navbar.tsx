// plus1-rewards/src/components/landing/Navbar.tsx
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const BLUE = '#1a558b'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <motion.nav 
      className="fixed top-0 left-0 right-0 z-50 px-6 lg:px-20 py-3" 
      style={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
      }}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div className="max-w-[1800px] mx-auto flex items-center justify-between">
        {/* Logo */}
        <motion.div 
          className="flex items-center gap-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <a href="/" className="cursor-pointer">
            <motion.img 
              src="/logo.png" 
              alt="+1 Rewards" 
              className="w-auto object-contain"
              style={{ height: '60px' }}
              whileHover={{ scale: 1.05, rotate: [0, -5, 5, 0] }}
              transition={{ duration: 0.3 }}
            />
          </a>
        </motion.div>

        {/* Desktop Nav */}
        <motion.div 
          className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-700"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {['How it Works', 'Roles', 'Offline Tech', 'FAQ'].map((item, i) => (
            <motion.a 
              key={item}
              className="hover:text-blue-700 transition-colors relative"
              href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 + i * 0.1 }}
              whileHover={{ y: -2 }}
            >
              {item}
              <motion.span
                className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-700"
                whileHover={{ width: '100%' }}
                transition={{ duration: 0.3 }}
              />
            </motion.a>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div 
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <motion.a 
            href="/login" 
            className="hidden md:inline text-sm font-semibold text-gray-800 hover:text-blue-800 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Sign In
          </motion.a>
          <motion.button
            className="hidden md:block px-5 py-2 rounded-lg font-bold text-sm transition-all shadow-sm text-white"
            style={{ backgroundColor: BLUE }}
            onClick={() => window.location.href = '/register'}
            whileHover={{ scale: 1.05, boxShadow: '0 10px 25px rgba(26, 85, 139, 0.3)' }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            Start Earning Medical Cover &rarr;
          </motion.button>
          {/* Mobile hamburger */}
          <motion.button
            className="md:hidden text-gray-800"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
            whileTap={{ scale: 0.9, rotate: 90 }}
            transition={{ duration: 0.2 }}
          >
            <motion.span 
              className="material-symbols-outlined"
              animate={{ rotate: menuOpen ? 90 : 0 }}
              transition={{ duration: 0.3 }}
            >
              {menuOpen ? 'close' : 'menu'}
            </motion.span>
          </motion.button>
        </motion.div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
      {menuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0, y: -20 }}
          animate={{ opacity: 1, height: 'auto', y: 0 }}
          exit={{ opacity: 0, height: 0, y: -20 }}
          transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="md:hidden mt-4 pb-6 border-t border-gray-200 flex flex-col gap-1 pt-6" style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderRadius: '0 0 16px 16px',
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)'
          }}>
            <motion.div 
              className="flex items-center justify-center gap-3 mb-4"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <a href="/" className="cursor-pointer">
                <img 
                  src="/logo.png" 
                  alt="+1 Rewards" 
                  className="w-auto object-contain hover:opacity-80 transition-opacity"
                  style={{ height: '50px' }}
                />
              </a>
            </motion.div>
            {[
              { href: '#how-it-works', icon: 'info', text: 'How it Works' },
              { href: '#roles', icon: 'groups', text: 'Roles' },
              { href: '#features', icon: 'wifi_off', text: 'Offline Tech' },
              { href: '#faq', icon: 'help', text: 'FAQ' }
            ].map((item, i) => (
              <motion.a 
                key={item.text}
                href={item.href} 
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-base font-semibold text-gray-800 hover:bg-blue-50 rounded-lg transition-all"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 + i * 0.05 }}
                whileHover={{ x: 5, backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.span 
                  className="material-symbols-outlined text-xl" 
                  style={{ color: BLUE }}
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  {item.icon}
                </motion.span>
                <span>{item.text}</span>
              </motion.a>
            ))}
            <motion.div 
              className="mt-2 px-4 flex flex-col gap-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <motion.a 
                href="/login" 
                className="text-center py-3 text-base font-semibold rounded-lg transition-all border-2"
                style={{ color: BLUE, borderColor: BLUE }}
                onClick={() => setMenuOpen(false)}
                whileHover={{ scale: 1.02, backgroundColor: 'rgba(26, 85, 139, 0.05)' }}
                whileTap={{ scale: 0.98 }}
              >
                Sign In
              </motion.a>
              <motion.button
                className="py-3 rounded-lg font-bold text-base transition-all shadow-md text-white"
                style={{ backgroundColor: BLUE }}
                onClick={() => window.location.href = '/register'}
                whileHover={{ scale: 1.02, boxShadow: '0 10px 25px rgba(26, 85, 139, 0.3)' }}
                whileTap={{ scale: 0.98 }}
              >
                Get Started →
              </motion.button>
            </motion.div>
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </motion.nav>
  )
}