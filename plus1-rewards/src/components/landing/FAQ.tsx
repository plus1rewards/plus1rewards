// plus1-rewards/src/components/landing/FAQ.tsx
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const BLUE = '#1a558b'
const BLUE_LIGHT = 'rgba(26,85,139,0.10)'
const BLUE_BORDER = 'rgba(26,85,139,0.35)'

const faqs = [
  {
    q: 'How do I start earning?',
    a: 'Join +1 Rewards and shop at any participating partner store. At checkout, give your cell phone number to earn cashback. You can also scan your QR code. Your cashback then goes toward your medical cover.',
  },
  {
    q: 'Is the medical cover comprehensive?',
    a: 'You get access to real medical cover, with your benefits clearly shown upfront so you can understand exactly what cover you have.',
  },
  {
    q: "What happens if I don't reach my target this month?",
    a: "If you do not reach your monthly target, your cover status may change. Keep shopping at +1 Rewards partners to help keep your cover active.",
  },
  {
    q: 'Is this the same as medical aid?',
    a: 'No. +1 Rewards is different from medical aid. It helps turn your everyday shopping into cashback that goes toward your medical cover.',
  },
  {
    q: 'Do I need a smartphone or internet to use +1 Rewards?',
    a: 'No. The quickest way is to give your cell phone number at checkout. You can also scan your QR code. +1 Rewards is built for real-life shopping, even when data is tight.',
  },
  {
    q: 'Which stores near me are +1 Rewards partners?',
    a: 'Look for the +1 Rewards sign at participating stores near you, or check the platform to find partner stores in your area.',
  },
]

export default function FAQ() {
  const [showFAQs, setShowFAQs] = useState(false)
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section className="py-24 px-6 lg:px-20 overflow-hidden" style={{ backgroundColor: '#f5f8fc' }} id="faq">
      <div className="max-w-3xl mx-auto">
        <motion.div 
          className="text-center mb-14"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <motion.span
            className="inline-block px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4"
            style={{ backgroundColor: BLUE_LIGHT, color: BLUE }}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.05, rotate: [0, -3, 3, 0] }}
          >
            FAQ
          </motion.span>
          <motion.h2 
            className="text-3xl font-bold text-gray-900"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            Frequently Asked Questions
          </motion.h2>
        </motion.div>

        {/* Show/Hide FAQs Button */}
        <motion.div 
          className="flex justify-center mb-8"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <motion.button
            onClick={() => setShowFAQs(!showFAQs)}
            className="px-6 py-3 rounded-lg font-bold text-base transition-all"
            style={{
              backgroundColor: showFAQs ? BLUE : BLUE_LIGHT,
              color: showFAQs ? '#fff' : BLUE,
              border: `2px solid ${BLUE}`
            }}
            whileHover={{ scale: 1.05, boxShadow: '0 10px 25px rgba(26, 85, 139, 0.2)' }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <motion.span
              animate={{ rotate: showFAQs ? 180 : 0 }}
              transition={{ duration: 0.3 }}
              style={{ display: 'inline-block' }}
            >
              {showFAQs ? '▲' : '▼'}
            </motion.span>
            {' '}
            {showFAQs ? 'Hide FAQs' : 'Show FAQs'}
          </motion.button>
        </motion.div>

        {/* FAQs List - Hidden by default */}
        <AnimatePresence>
          {showFAQs && (
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              {faqs.map((faq, i) => (
                <motion.div
                  key={i}
                  className="border rounded-xl overflow-hidden transition-all"
                  style={{ borderColor: open === i ? BLUE_BORDER : '#e5e7eb', backgroundColor: '#fff' }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  whileHover={{ 
                    borderColor: BLUE_BORDER,
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)'
                  }}
                >
                  <motion.button
                    className="w-full flex items-center justify-between px-6 py-5 text-left"
                    onClick={() => setOpen(open === i ? null : i)}
                    whileHover={{ backgroundColor: 'rgba(26, 85, 139, 0.02)' }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <span className="font-bold text-gray-900 text-base pr-4">{faq.q}</span>
                    <motion.span
                      className="material-symbols-outlined text-xl flex-shrink-0"
                      style={{ color: BLUE }}
                      animate={{ rotate: open === i ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      expand_more
                    </motion.span>
                  </motion.button>
                  <AnimatePresence>
                    {open === i && (
                      <motion.div 
                        className="px-6 pb-5 text-gray-500 leading-relaxed border-t" 
                        style={{ borderColor: '#f0f0f0' }}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <motion.p 
                          className="pt-3"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.1 }}
                        >
                          {faq.a}
                        </motion.p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}