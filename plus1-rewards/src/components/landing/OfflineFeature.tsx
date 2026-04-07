// plus1-rewards/src/components/landing/OfflineFeature.tsx
import { motion } from 'framer-motion'

const BLUE = '#1a558b'
const BLUE_LIGHT = 'rgba(26,85,139,0.10)'

export default function OfflineFeature() {
  return (
    <section className="py-24 px-6 lg:px-20 relative overflow-hidden" style={{ backgroundColor: '#ffffff' }} id="features">
      <div className="max-w-[1800px] mx-auto grid md:grid-cols-2 gap-16 items-center">

        {/* Image */}
        <motion.div 
          className="relative order-2 md:order-1"
          initial={{ opacity: 0, x: -50, rotateY: -15 }}
          whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          viewport={{ once: true }}
        >
          <motion.div
            className="absolute -inset-6 rounded-3xl blur-[60px] opacity-15"
            style={{ backgroundColor: BLUE }}
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.15, 0.25, 0.15]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.img
            alt="Customer scanning QR code in a local shop"
            className="rounded-3xl shadow-xl relative z-10 border w-full object-cover"
            style={{ borderColor: '#e5e7eb' }}
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBrChp-rJw6gwciGLXkYyh6v8Sf0Pbu42DOiuN12h8xMQtitpDrR2WE68lVzoAwCjuvqsUf4ghwaRh3yCAFlJLn-9H5MM-I-mXllz59_xWXA74wV3UpnoT0mK-ST-F-4o0mVUcmvx6tV1aY8BwMfKw_DwOd9Fn5xJ0kzM99Q4pYZQ2zDzYXGNHL2xoDZJdZsw72j8f5S96nZUYAmgFB0AfrKpN5QkacJcNvO_LUiptUqTLUttbTqYi9E8WQ7_vYHdiWWE1FqwmMjtcB"
            whileHover={{ scale: 1.02, rotate: [0, -1, 1, 0] }}
            transition={{ duration: 0.3 }}
          />
          <motion.div
            className="absolute -bottom-5 -right-5 text-white p-5 rounded-2xl shadow-xl z-20 max-w-[180px]"
            style={{ backgroundColor: BLUE }}
            initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.6, delay: 0.4, type: "spring", stiffness: 200 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.1, rotate: 5 }}
            animate={{
              y: [0, -10, 0]
            }}
            transition={{
              y: { duration: 3, repeat: Infinity, ease: "easeInOut" }
            }}
          >
            <motion.span 
              className="material-symbols-outlined text-white text-3xl mb-1"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              offline_pin
            </motion.span>
            <p className="font-black text-sm leading-tight text-white">Works 100% Offline</p>
          </motion.div>
        </motion.div>

        {/* Text */}
        <motion.div 
          className="space-y-7 order-1 md:order-2"
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          viewport={{ once: true }}
        >
          <motion.span
            className="inline-block px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest"
            style={{ backgroundColor: BLUE_LIGHT, color: BLUE }}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.05, rotate: [0, -3, 3, 0] }}
          >
            Built for Africa
          </motion.span>
          <motion.h2 
            className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            No data?<br />No problem.
          </motion.h2>
          <motion.p 
            className="text-lg text-gray-500 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
          >
            +1 Rewards is made for real South African conditions. Even when data is finished or signal is weak, you can still open the app, access your code, and use it at checkout. When your phone reconnects, your information updates in the background.
          </motion.p>
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            viewport={{ once: true }}
          >
            {[
              {
                title: 'Works without data',
                desc: 'Access your code and use it at checkout',
              },
              {
                title: 'Updates when signal returns',
                desc: 'Your information comes through when you reconnect',
              },
              {
                title: 'Built for real life',
                desc: 'Made for everyday South African shopping',
              },
            ].map((item, i) => (
              <motion.div 
                key={i} 
                className="flex gap-4 items-start"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.6 + i * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ x: 10 }}
              >
                <motion.div
                  className="size-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: BLUE_LIGHT }}
                  whileHover={{ scale: 1.2, rotate: 360 }}
                  transition={{ duration: 0.3 }}
                >
                  <span className="material-symbols-outlined text-sm" style={{ color: BLUE }}>check</span>
                </motion.div>
                <div>
                  <p className="text-gray-900 font-bold">{item.title}</p>
                  <p className="text-gray-600 text-sm mt-0.5">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}