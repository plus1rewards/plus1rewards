// plus1-rewards/src/components/landing/Hero.tsx
import { motion } from 'framer-motion'
import { FeaturesSectionWithHoverEffects } from '../ui/feature-section-with-hover-effects'

const BLUE = '#1a558b'

export default function Hero() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  }

  const textVariants = {
    hidden: { opacity: 0, x: -15 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.4,
        delay: i * 0.05,
      },
    }),
  }

  return (
    <section
      className="relative flex flex-col justify-between overflow-hidden px-4 sm:px-6 lg:px-20 min-h-screen pt-16 md:pt-20"
      style={{ backgroundColor: '#f5f8fc' }}
    >
      {/* Right image panel - hidden on mobile, visible on larger screens */}
      <motion.div 
        className="hidden md:block absolute top-0 right-0 w-[52%] h-full z-0 overflow-hidden rounded-bl-[80px]"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
      >
        <img
          alt="Diverse South African community interaction"
          className="w-full h-full object-cover"
          src="/background hero section.png"
          width="1920"
          height="1080"
          fetchpriority="high"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#f5f8fc] via-[#f5f8fc]/20 to-transparent" />
      </motion.div>

      <div className="relative z-10 w-full max-w-[1800px] mx-auto flex-1 flex flex-col justify-center py-2 md:py-12">
        {/* Mobile hero title - visible only on mobile, above image */}
        <motion.h1 
          className="md:hidden text-3xl font-black text-gray-900 mb-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
        >
          Medi Cover for All.
        </motion.h1>

        {/* Mobile hero image - visible only on mobile */}
        <motion.div 
          className="md:hidden w-full mb-6 rounded-2xl overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <img
            alt="Diverse South African community interaction"
            className="w-full h-48 object-cover"
            src="/background hero section.png"
            width="800"
            height="600"
            fetchpriority="high"
            loading="eager"
          />
        </motion.div>

        <motion.div 
          className="flex flex-col gap-2 md:gap-8 max-w-full md:max-w-2xl"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Headline */}
          <motion.h1 
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-tight tracking-tight text-gray-900"
            variants={itemVariants}
          >
            <motion.span 
              className="hidden md:inline block"
              custom={0}
              variants={textVariants}
            >
              Medi Cover for All.
            </motion.span>
            <br />
            <motion.span 
              style={{ color: BLUE, fontSize: 'calc(1em - 2px)' }}
              custom={1}
              variants={textVariants}
            >
              Shop local.{' '}
            </motion.span>
            <motion.span 
              style={{ color: BLUE, fontSize: 'calc(1em - 2px)' }}
              custom={2}
              variants={textVariants}
            >
              Earn rands.{' '}
            </motion.span>
            <br />
            <motion.span 
              style={{ color: '#000000', fontSize: 'calc(1em - 2px)', whiteSpace: 'nowrap' }}
              custom={3}
              variants={textVariants}
            >
              Enjoy{' '}
            </motion.span>
            <motion.span 
              style={{ color: '#16a34a', fontSize: 'calc(1em - 2px)', whiteSpace: 'nowrap' }}
              custom={4}
              variants={textVariants}
            >
              FAMILY{' '}
            </motion.span>
            <motion.span 
              style={{ color: '#000000', fontSize: 'calc(1em - 2px)', whiteSpace: 'nowrap' }}
              custom={5}
              variants={textVariants}
            >
              medical cover
            </motion.span>
          </motion.h1>

          {/* Subtext */}
          <motion.p 
            className="text-sm sm:text-base md:text-lg text-gray-600 max-w-full md:max-w-lg leading-relaxed"
            variants={itemVariants}
          >
            Every time you shop at a +1 Rewards partner near you, you earn real cashback — in rands, not points. That cashback goes straight toward your Day1Health medical cover plan. No extra cost. No extra effort. Just shop where you already shop.
          </motion.p>

          {/* CTAs */}
          <motion.div 
            className="flex flex-col sm:flex-row gap-3 md:gap-4"
            variants={itemVariants}
          >
            <motion.button
              className="Explore-Button w-full sm:w-auto"
              onClick={() => window.location.href = '/register'}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <span className="IconContainer">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 156 78"
                  className="telescope"
                >
                  <path
                    fill="url(#paint0_linear_hero)"
                    d="M10.3968 78C10.6002 78 32 72.831 32 72.831C29.5031 68.7434 27.3945 63.5193 26.0258 57.947C24.6386 52.3381 24.0837 46.7841 24.3982 42L3.38683 47.0957C0.0205717 47.9206 -1.0152 55.4725 1.09333 63.9959C3.05409 72.0061 7.10469 78 10.3968 78Z"
                  ></path>
                  <path
                    fill="url(#paint1_linear_hero)"
                    d="M63.0824 25L34.8099 32.0351C33.7675 32.2957 32.8714 33.0215 32.1582 34.1382C31.6096 34.9943 31.1524 36.0738 30.8049 37.3393C30.5489 38.2513 30.366 39.2563 30.238 40.3544C29.6894 44.7839 30.0734 50.5348 31.5547 56.6207C33.0177 62.7067 35.2854 67.9925 37.7725 71.6587C38.3942 72.5707 39.016 73.371 39.6561 74.0596C40.5339 75.0274 41.43 75.7718 42.3078 76.2743C43.1307 76.7396 43.9536 77 44.74 77C45.0326 77 45.3252 76.9628 45.5995 76.8883L72.5919 70.1698L74 69.8164C69.867 64.1027 66.6484 56.1184 64.7282 48.1527C62.7532 39.9451 62.1497 31.8306 63.0094 25.3166C63.0458 25.2233 63.0643 25.1117 63.0824 25Z"
                  ></path>
                  <path
                    fill="url(#paint2_linear_hero)"
                    d="M155.865 50.9153L144.361 3.54791C143.844 1.43031 141.964 0 139.88 0C139.512 0 139.143 0.0371509 138.774 0.130028L75.0921 15.8448C74.3361 16.0306 73.654 16.4021 73.0271 16.9594C72.1239 17.7581 71.3493 18.9284 70.7411 20.3958C70.3537 21.3246 70.0403 22.3648 69.7823 23.4979C68.4731 29.2935 68.7683 37.7267 70.9621 46.7544C73.2115 55.9863 76.9358 63.7509 80.8447 68.2277C81.6375 69.1194 82.4303 69.8995 83.2229 70.5125C83.4259 70.6795 83.6654 70.8283 83.9051 70.9581C85.6752 71.9798 87.7955 72.2584 89.7865 71.7571L152.492 56.5065C154.962 55.912 156.474 53.4044 155.865 50.9153Z"
                  ></path>
                  <defs>
                    <linearGradient gradientUnits="userSpaceOnUse" y2="78" x2="16" y1="42" x1="16" id="paint0_linear_hero">
                      <stop stopColor="#bbf7d0"></stop>
                      <stop stopColor="#16a34a" offset="1"></stop>
                    </linearGradient>
                    <linearGradient gradientUnits="userSpaceOnUse" y2="77" x2="52" y1="25" x1="52" id="paint1_linear_hero">
                      <stop stopColor="#bbf7d0"></stop>
                      <stop stopColor="#16a34a" offset="1"></stop>
                    </linearGradient>
                    <linearGradient gradientUnits="userSpaceOnUse" y2="72" x2="112.5" y1="0" x1="112.5" id="paint2_linear_hero">
                      <stop stopColor="#bbf7d0"></stop>
                      <stop stopColor="#16a34a" offset="1"></stop>
                    </linearGradient>
                  </defs>
                </svg>

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 104 69"
                  className="tripod"
                >
                  <path
                    strokeLinecap="round"
                    strokeWidth="11"
                    stroke="url(#paint0_linear_tripod)"
                    d="M98.4336 63.3406L52 5.99991"
                  ></path>
                  <path
                    strokeLinecap="round"
                    strokeWidth="11"
                    stroke="url(#paint1_linear_tripod)"
                    d="M52.4336 6L6.00004 63.3407"
                  ></path>
                  <path
                    strokeLinecap="round"
                    strokeWidth="11"
                    stroke="url(#paint2_linear_tripod)"
                    d="M52 63L52 6"
                  ></path>
                  <defs>
                    <linearGradient gradientUnits="userSpaceOnUse" y2="40.5" x2="68" y1="32" x1="77.5" id="paint0_linear_tripod">
                      <stop stopColor="#bbf7d0"></stop>
                      <stop stopColor="#16a34a" offset="1"></stop>
                    </linearGradient>
                    <linearGradient gradientUnits="userSpaceOnUse" y2="40.5174" x2="36.4196" y1="32.9922" x1="26.1302" id="paint1_linear_tripod">
                      <stop stopColor="#bbf7d0"></stop>
                      <stop stopColor="#16a34a" offset="1"></stop>
                    </linearGradient>
                    <linearGradient gradientUnits="userSpaceOnUse" y2="34.8174" x2="42.7435" y1="34.0069" x1="55.4548" id="paint2_linear_tripod">
                      <stop stopColor="#bbf7d0"></stop>
                      <stop stopColor="#16a34a" offset="1"></stop>
                    </linearGradient>
                  </defs>
                </svg>
              </span>
              <span className="text">Start Earning Medical Cover</span>
            </motion.button>
            <motion.button
              className="Explore-Button w-full sm:w-auto"
              onClick={() => window.location.href = '/partner/register'}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <span className="IconContainer">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="#ffffff"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z"
                  />
                </svg>
              </span>
              <span className="text">Become A Partner</span>
            </motion.button>


          </motion.div>

          {/* Trust indicators */}
          <motion.div 
            className="flex flex-wrap items-center gap-3 md:gap-6 mt-1"
            variants={itemVariants}
          >
            {['Free To Join', 'Works Offline', 'FSP Licensed', 'Real Medical Cover'].map((item, i) => (
              <motion.div 
                key={item} 
                className="flex items-center gap-2 text-xs md:text-sm text-gray-500"
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.05, duration: 0.3 }}
              >
                <motion.span 
                  className="material-symbols-outlined text-sm md:text-base" 
                  style={{ color: BLUE }}
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ delay: 0.4 + i * 0.05, duration: 0.4, repeat: Infinity, repeatDelay: 3 }}
                >
                  check_circle
                </motion.span>
                {item}
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Value Bar as part of Hero */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <FeaturesSectionWithHoverEffects />
      </motion.div>
    </section>
  )
}
