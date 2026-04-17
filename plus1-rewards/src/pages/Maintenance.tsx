// plus1-rewards/src/pages/Maintenance.tsx
import { motion } from 'framer-motion'

const BLUE = '#1a568b'
const GREEN = '#37d270'

export default function Maintenance() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'linear-gradient(135deg, #072e61 0%, #004880 60%, #0a3d6b 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter', sans-serif",
        overflow: 'hidden',
        padding: '24px',
      }}
    >
      {/* Animated background blobs */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', top: '-20%', left: '-10%',
            width: '60vw', height: '60vw', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(55,210,112,0.3), transparent 70%)',
          }}
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          style={{
            position: 'absolute', bottom: '-20%', right: '-10%',
            width: '70vw', height: '70vw', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(26,86,139,0.5), transparent 70%)',
          }}
        />
      </div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{
          position: 'relative',
          zIndex: 10,
          background: 'rgba(255,255,255,0.06)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 24,
          padding: '48px 40px',
          maxWidth: 520,
          width: '100%',
          textAlign: 'center',
        }}
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{ marginBottom: 32 }}
        >
          <img
            src="/logo.png"
            alt="+1 Rewards"
            style={{ height: 56, width: 'auto', filter: 'brightness(0) invert(1)', opacity: 0.95, margin: '0 auto' }}
          />
        </motion.div>

        {/* Animated gear icon */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
          style={{
            width: 72, height: 72, margin: '0 auto 28px',
            background: `linear-gradient(135deg, ${GREEN}, ${BLUE})`,
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 40px rgba(55,210,112,0.3)`,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 36, color: '#fff' }}>settings</span>
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          style={{ color: '#fff', fontSize: 28, fontWeight: 900, margin: '0 0 12px', letterSpacing: '-0.5px' }}
        >
          We'll be right back
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          style={{ color: 'rgba(255,255,255,0.65)', fontSize: 15, lineHeight: 1.7, margin: '0 0 32px' }}
        >
          Plus1 Rewards is currently undergoing scheduled maintenance.
          We're working hard to improve your experience and will be back shortly.
        </motion.p>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '0 0 28px' }} />

        {/* Status dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 28 }}
        >
          {[0, 0.2, 0.4].map((delay, i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: 1.4, repeat: Infinity, delay }}
              style={{ width: 10, height: 10, borderRadius: '50%', background: GREEN }}
            />
          ))}
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginLeft: 8 }}>
            System update in progress
          </span>
        </motion.div>

        {/* Contact line */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: 0 }}
        >
          Questions?{' '}
          <a
            href="mailto:plus1rewards@gmail.com"
            style={{ color: 'rgba(55,210,112,0.8)', textDecoration: 'none', fontWeight: 600 }}
          >
            plus1rewards@gmail.com
          </a>
        </motion.p>
      </motion.div>

      {/* Bottom copyright */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        style={{
          position: 'relative', zIndex: 10,
          color: 'rgba(255,255,255,0.25)', fontSize: 11,
          marginTop: 32, textAlign: 'center',
        }}
      >
        © {new Date().getFullYear()} Plus1 Rewards (Pty) Ltd · All rights reserved
      </motion.p>
    </div>
  )
}
