// plus1-rewards/src/components/landing/CoverStatus.tsx
import { motion } from 'framer-motion'

export default function CoverStatus() {
  const cardVariants = {
    hidden: { opacity: 0, y: 50, rotateX: -15 },
    visible: { opacity: 1, y: 0, rotateX: 0 }
  }

  const pulseVariants = {
    initial: { scale: 1, opacity: 0.5 },
    animate: { 
      scale: 2, 
      opacity: 0
    }
  }

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <motion.h2 
            className="text-4xl md:text-5xl font-black text-gray-900 mb-4"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            Control Your Cover Status
          </motion.h2>
          <motion.p 
            className="text-xl text-gray-600 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            Shop where it counts. Protect your family's health.
          </motion.p>
        </motion.div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Active Status */}
          <motion.div 
            className="bg-white rounded-2xl p-8 shadow-xl border-2 border-green-200 relative overflow-hidden"
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0, ease: [0.25, 0.46, 0.45, 0.94] }}
            whileHover={{ 
              y: -10, 
              boxShadow: '0 25px 50px -12px rgba(34, 197, 94, 0.25)',
              borderColor: 'rgba(34, 197, 94, 0.5)',
              transition: { duration: 0.3 }
            }}
          >
            {/* Animated background glow */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-green-100/50 to-transparent"
              animate={{
                opacity: [0.3, 0.6, 0.3],
                scale: [1, 1.05, 1]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            
            <motion.div 
              className="flex items-center justify-center mb-6 relative z-10"
              animate={{
                y: [0, -10, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <div className="size-20 rounded-full bg-green-100 flex items-center justify-center relative">
                {/* Pulse rings */}
                <motion.div
                  className="absolute inset-0 rounded-full bg-green-500"
                  variants={pulseVariants}
                  initial="initial"
                  animate="animate"
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeOut"
                  }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full bg-green-500"
                  variants={pulseVariants}
                  initial="initial"
                  animate="animate"
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeOut",
                    delay: 0.5 
                  }}
                />
                <motion.div 
                  className="size-12 rounded-full bg-green-500 flex items-center justify-center relative z-10"
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 360]
                  }}
                  transition={{
                    scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                    rotate: { duration: 20, repeat: Infinity, ease: "linear" }
                  }}
                >
                  <span className="text-3xl">🟢</span>
                </motion.div>
              </div>
            </motion.div>
            <motion.h3 
              className="text-2xl font-black text-gray-900 text-center mb-3 relative z-10"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              viewport={{ once: true }}
            >
              Active
            </motion.h3>
            <motion.p 
              className="text-center text-gray-600 text-lg leading-relaxed relative z-10"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              viewport={{ once: true }}
            >
              Your cover is paid
            </motion.p>
            <motion.div 
              className="mt-6 pt-6 border-t border-gray-100 relative z-10"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              viewport={{ once: true }}
            >
              <p className="text-sm text-gray-500 text-center">
                Keep shopping where it counts to keep your cover active.
              </p>
            </motion.div>
          </motion.div>

          {/* Suspended Status */}
          <motion.div 
            className="bg-white rounded-2xl p-8 shadow-xl border-2 border-red-200 relative overflow-hidden"
            custom={1}
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            whileHover={{ 
              y: -10, 
              boxShadow: '0 25px 50px -12px rgba(239, 68, 68, 0.25)',
              borderColor: 'rgba(239, 68, 68, 0.5)',
              transition: { duration: 0.3 }
            }}
          >
            {/* Animated background glow */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-red-100/50 to-transparent"
              animate={{
                opacity: [0.3, 0.6, 0.3],
                scale: [1, 1.05, 1]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1.5
              }}
            />
            
            <motion.div 
              className="flex items-center justify-center mb-6 relative z-10"
              animate={{
                y: [0, -10, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5
              }}
            >
              <div className="size-20 rounded-full bg-red-100 flex items-center justify-center relative">
                <motion.div 
                  className="size-12 rounded-full bg-red-500 flex items-center justify-center relative z-10"
                  animate={{
                    scale: [1, 0.95, 1],
                    opacity: [1, 0.8, 1]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <span className="text-3xl">🔴</span>
                </motion.div>
              </div>
            </motion.div>
            <motion.h3 
              className="text-2xl font-black text-gray-900 text-center mb-3 relative z-10"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              viewport={{ once: true }}
            >
              Suspended
            </motion.h3>
            <motion.p 
              className="text-center text-gray-600 text-lg leading-relaxed relative z-10"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              viewport={{ once: true }}
            >
              Not there yet
            </motion.p>
            <motion.div 
              className="mt-6 pt-6 border-t border-gray-100 relative z-10"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              viewport={{ once: true }}
            >
              <p className="text-sm text-gray-500 text-center">
                Keep shopping where it counts to get your cover active again.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
