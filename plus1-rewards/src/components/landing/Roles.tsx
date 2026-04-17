// plus1-rewards/src/components/landing/Roles.tsx
import { useState } from 'react';
import { motion } from 'framer-motion';

const BLUE = '#1a558b'
const BLUE_LIGHT = 'rgba(26,85,139,0.08)'
const BLUE_BORDER = 'rgba(26,85,139,0.35)'
const BLUE_ICON_BG = 'rgba(26,85,139,0.12)'

export default function Roles() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const handleNavigation = (path: string) => {
    window.location.href = path;
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % roles.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + roles.length) % roles.length);
  };

  const roles = [
    {
      icon: 'group',
      title: 'Members',
      headline: 'Get rewarded with medical cover.',
      desc: 'Shop at +1 Rewards partners, earn cashback in rands, and let your everyday shopping help protect your family.',
      features: ['Free to join', 'Shop like normal', 'Cashback in rands', 'Your shopping helps pay for cover'],
      loginPath: '/login',
      registerPath: '/register',
      highlight: true,
      hasButtons: true,
      buttonType: 'login-register',
      loginText: 'Member Login',
      registerText: 'Join as a Member',
      logoColor: undefined as string | undefined,
      isLogo: false,
      buttonText: undefined as string | undefined,
    },
    {
      icon: 'storefront',
      title: 'Partners',
      headline: 'Grow your business by caring for your community.',
      desc: 'Join the +1 Rewards partner network and give people a real reason to support your shop again and again.',
      features: ['No setup costs', 'More repeat customers', 'Build customer loyalty', 'Help your community access cover'],
      loginPath: '/partner/login',
      registerPath: '/partner/register',
      highlight: false,
      hasButtons: true,
      buttonType: 'login-register',
      loginText: 'Partner Login',
      registerText: 'Join as a Partner',
      logoColor: undefined as string | undefined,
      isLogo: false,
      buttonText: undefined as string | undefined,
    },
  ]

  return (
    <section className="py-24 px-6 lg:px-20 overflow-hidden" style={{ backgroundColor: '#ffffff' }} id="roles">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <motion.div 
          className="flex flex-col md:flex-row justify-between items-end mb-14 gap-6"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="w-full mx-auto text-center">
            <motion.span
              className="inline-block px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4"
              style={{ backgroundColor: BLUE_ICON_BG, color: BLUE }}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05, rotate: [0, -3, 3, 0] }}
            >
              Join the Community
            </motion.span>
            <motion.h2 
              className="text-4xl lg:text-5xl font-black text-gray-900 mb-6 max-w-7xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              Built for families in need of medical cover.
              <br />
              <motion.span 
                style={{ color: BLUE }}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true }}
              >
                Powered by partners who care about their community.
              </motion.span>
            </motion.h2>
            <motion.p 
              className="text-lg text-gray-600 leading-relaxed max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              viewport={{ once: true }}
            >
              Join the +1 Rewards community as a member or partner and be part of a smarter way to help families get the cover they need.
            </motion.p>
          </div>
        </motion.div>

        {/* Cards - Desktop Grid */}
        <motion.div 
          className="hidden md:grid md:grid-cols-3 gap-6 max-w-6xl mx-auto"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          viewport={{ once: true }}
        >
          {roles.map((role, i) => (
            <motion.div
              key={i}
              className="border rounded-3xl p-8 flex flex-col transition-all duration-300 group relative overflow-hidden"
              style={{
                backgroundColor: role.highlight ? BLUE_LIGHT : (role.logoColor ? 'rgba(22, 163, 74, 0.08)' : '#fff'),
                borderColor: role.highlight ? BLUE_BORDER : (role.logoColor ? 'rgba(22, 163, 74, 0.35)' : '#e5e7eb'),
              }}
              initial={{ opacity: 0, y: 50, rotateX: -10 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              viewport={{ once: true }}
              whileHover={{ 
                y: -10, 
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
                borderColor: role.logoColor || BLUE,
                scale: 1.02
              }}
              onHoverStart={() => setHoveredCard(i)}
              onHoverEnd={() => setHoveredCard(null)}
            >
              {/* Animated background gradient */}
              <motion.div
                className="absolute inset-0 opacity-0"
                style={{
                  background: `radial-gradient(circle at 50% 0%, ${role.logoColor || BLUE}15, transparent 70%)`
                }}
                animate={{
                  opacity: hoveredCard === i ? 1 : 0
                }}
                transition={{ duration: 0.3 }}
              />
              
              <div className="relative z-10">
                {role.isLogo ? (
                  <motion.div 
                    className="mb-6"
                    initial={{ scale: 0.8, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay: i * 0.15 + 0.2 }}
                    viewport={{ once: true }}
                  >
                    <img 
                      src="/plus1-go logo.png" 
                      alt={role.title}
                      className="w-auto object-contain"
                      style={{ height: '64px' }}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    className="size-16 rounded-2xl flex items-center justify-center mb-6 transition-transform shadow-sm"
                    style={{ backgroundColor: BLUE_ICON_BG, color: BLUE }}
                    initial={{ scale: 0, rotate: -180 }}
                    whileInView={{ scale: 1, rotate: 0 }}
                    transition={{ 
                      duration: 0.6, 
                      delay: i * 0.15 + 0.2,
                      type: "spring",
                      stiffness: 200
                    }}
                    viewport={{ once: true }}
                    whileHover={{ 
                      scale: 1.15, 
                      rotate: 360,
                      transition: { duration: 0.5 }
                    }}
                  >
                    <span className="material-symbols-outlined text-4xl">{role.icon}</span>
                  </motion.div>
                )}
                <motion.h3 
                  className="text-sm font-bold uppercase tracking-widest mb-2" 
                  style={{color: role.logoColor || BLUE}}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.15 + 0.3 }}
                  viewport={{ once: true }}
                >
                  {role.title}
                </motion.h3>
                <motion.h4 
                  className="text-xl font-bold text-gray-900 mb-4"
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.15 + 0.4 }}
                  viewport={{ once: true }}
                >
                  {role.headline}
                </motion.h4>
                <motion.p 
                  className="text-gray-600 text-sm mb-6 flex-grow leading-relaxed"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: i * 0.15 + 0.5 }}
                  viewport={{ once: true }}
                >
                  {role.desc}
                </motion.p>
                
                {role.features.length > 0 && (
                  <motion.ul 
                    className="space-y-3 mb-8"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: i * 0.15 + 0.6 }}
                    viewport={{ once: true }}
                  >
                    {role.features.map((f, j) => (
                      <motion.li 
                        key={j} 
                        className="flex items-start gap-3 text-sm text-gray-700 font-medium"
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.15 + 0.7 + j * 0.05 }}
                        viewport={{ once: true }}
                      >
                        <motion.span 
                          className="material-symbols-outlined text-base mt-0.5" 
                          style={{ color: role.logoColor || BLUE }}
                          whileHover={{ scale: 1.3, rotate: 360 }}
                          transition={{ duration: 0.3 }}
                        >
                          check_circle
                        </motion.span>
                        <span>{f}</span>
                      </motion.li>
                    ))}
                  </motion.ul>
                )}
                
                {role.hasButtons && role.buttonType === 'login-register' && (
                  <motion.div 
                    className="flex gap-3 mt-auto pt-4 border-t border-gray-100"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.15 + 0.8 }}
                    viewport={{ once: true }}
                  >
                    <motion.button
                      onClick={() => handleNavigation(role.loginPath)}
                      className="flex-1 py-3 rounded-xl font-bold text-sm text-white transition-all shadow-md"
                      style={{ backgroundColor: role.logoColor || BLUE }}
                      whileHover={{ scale: 1.05, boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)' }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {role.loginText}
                    </motion.button>
                    <motion.button
                      onClick={() => handleNavigation(role.registerPath)}
                      className="flex-1 py-3 border-2 rounded-xl font-bold text-sm transition-all"
                      style={{ borderColor: role.logoColor || BLUE, color: role.logoColor || BLUE }}
                      whileHover={{ scale: 1.05, backgroundColor: `${role.logoColor || BLUE}10` }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {role.registerText}
                    </motion.button>
                  </motion.div>
                )}

                {role.hasButtons && role.buttonType === 'single-register' && (
                  <motion.div 
                    className="flex gap-3 mt-auto pt-4 border-t border-gray-100"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.15 + 0.8 }}
                    viewport={{ once: true }}
                  >
                    <motion.button
                      onClick={() => handleNavigation(role.registerPath)}
                      className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all shadow-md"
                      style={{ backgroundColor: BLUE }}
                      whileHover={{ scale: 1.05, boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)' }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {role.buttonText}
                    </motion.button>
                  </motion.div>
                )}

                {role.hasButtons && role.buttonType === 'agent' && (
                  <motion.div 
                    className="flex gap-3 mt-auto pt-4 border-t border-gray-100"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.15 + 0.8 }}
                    viewport={{ once: true }}
                  >
                    <motion.button
                      onClick={() => handleNavigation(role.registerPath)}
                      className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all shadow-md flex items-center justify-center gap-2"
                      style={{ backgroundColor: BLUE }}
                      whileHover={{ scale: 1.05, boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)' }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span>Become an Agent</span>
                      <motion.span 
                        className="material-symbols-outlined text-sm"
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      >
                        arrow_forward
                      </motion.span>
                    </motion.button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Cards - Mobile Carousel */}
        <div className="md:hidden relative max-w-md mx-auto">
          {/* Carousel Container */}
          <div className="overflow-hidden">
            <div 
              className="flex transition-transform duration-300 ease-in-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {roles.map((role, i) => (
                <div key={i} className="w-full flex-shrink-0 px-2">
                  <div
                    className="border rounded-3xl p-6 flex flex-col"
                    style={{
                      backgroundColor: role.highlight ? BLUE_LIGHT : (role.logoColor ? 'rgba(22, 163, 74, 0.08)' : '#fff'),
                      borderColor: role.highlight ? BLUE_BORDER : (role.logoColor ? 'rgba(22, 163, 74, 0.35)' : '#e5e7eb'),
                    }}
                  >
                    {role.isLogo ? (
                      <div className="mb-4">
                        <img 
                          src="/plus1-go logo.png" 
                          alt={role.title}
                          className="w-auto object-contain"
                          style={{ height: '56px' }}
                        />
                      </div>
                    ) : (
                      <div
                        className="size-14 rounded-2xl flex items-center justify-center mb-4 shadow-sm"
                        style={{ backgroundColor: BLUE_ICON_BG, color: BLUE }}
                      >
                        <span className="material-symbols-outlined text-3xl">{role.icon}</span>
                      </div>
                    )}
                    <h3 className="text-xs font-bold uppercase tracking-widest mb-2" style={{color: role.logoColor || BLUE}}>{role.title}</h3>
                    <h4 className="text-lg font-bold text-gray-900 mb-3">{role.headline}</h4>
                    <p className="text-gray-600 text-sm mb-4 leading-relaxed">{role.desc}</p>
                    
                    {role.features.length > 0 && (
                      <ul className="space-y-2 mb-6">
                        {role.features.map((f, j) => (
                          <li key={j} className="flex items-start gap-2 text-xs text-gray-700 font-medium">
                            <span className="material-symbols-outlined text-sm mt-0.5" style={{ color: role.logoColor || BLUE }}>check_circle</span>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    
                    {role.hasButtons && role.buttonType === 'login-register' && (
                      <div className="flex gap-2 mt-auto pt-3 border-t border-gray-100">
                        <button
                          onClick={() => handleNavigation(role.loginPath)}
                          className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white transition-all shadow-md"
                          style={{ backgroundColor: role.logoColor || BLUE }}
                        >
                          {role.loginText}
                        </button>
                        <button
                          onClick={() => handleNavigation(role.registerPath)}
                          className="flex-1 py-2.5 border-2 rounded-xl font-bold text-sm transition-all"
                          style={{ borderColor: role.logoColor || BLUE, color: role.logoColor || BLUE }}
                        >
                          {role.registerText}
                        </button>
                      </div>
                    )}

                    {role.hasButtons && role.buttonType === 'single-register' && (
                      <div className="flex gap-2 mt-auto pt-3 border-t border-gray-100">
                        <button
                          onClick={() => handleNavigation(role.registerPath)}
                          className="w-full py-2.5 rounded-xl font-bold text-sm text-white transition-all shadow-md"
                          style={{ backgroundColor: BLUE }}
                        >
                          {role.buttonText}
                        </button>
                      </div>
                    )}

                    {role.hasButtons && role.buttonType === 'agent' && (
                      <div className="flex gap-2 mt-auto pt-3 border-t border-gray-100">
                        <button
                          onClick={() => handleNavigation(role.registerPath)}
                          className="w-full py-2.5 rounded-xl font-bold text-sm text-white transition-all shadow-md flex items-center justify-center gap-2"
                          style={{ backgroundColor: BLUE }}
                        >
                          <span>Become an Agent</span>
                          <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center transition-all hover:scale-110"
            style={{ color: BLUE }}
            aria-label="Previous slide"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center transition-all hover:scale-110"
            style={{ color: BLUE }}
            aria-label="Next slide"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-6">
            {roles.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className="w-2 h-2 rounded-full transition-all"
                style={{
                  backgroundColor: currentSlide === i ? BLUE : '#d1d5db',
                  width: currentSlide === i ? '24px' : '8px',
                }}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Insurance Provider & Rewards Section */}
        <div className="mt-20 pt-20 border-t border-gray-100">
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Insurance Provider */}
            <div className="flex flex-col items-center text-center p-8 bg-gradient-to-br from-blue-50 to-white rounded-3xl border border-blue-100 hover:shadow-lg transition-all duration-300">
              <div className="mb-6 p-4 bg-white rounded-2xl shadow-sm">
                <img 
                  src="/day1health-logo.jpg" 
                  alt="Day1Health" 
                  className="w-auto object-contain mx-auto"
                  style={{ height: '70px' }}
                  width="77"
                  height="70"
                />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">Day1Health</h3>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-4">Insurance Partner</p>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed font-medium">
                FSP Licensed & Regulated by the FSCA
              </p>
              <p className="text-xs text-gray-500 leading-relaxed flex-grow">
                All medical cover policies are underwritten and managed by Day1Health (Pty) Ltd, an authorised financial services provider regulated by the FSCA.
              </p>
            </div>

            {/* Rewards Programme */}
            <div className="flex flex-col items-center text-center p-8 bg-gradient-to-br from-purple-50 to-white rounded-3xl border border-purple-100 hover:shadow-lg transition-all duration-300">
              <div className="mb-6 p-4 bg-white rounded-2xl shadow-sm">
                <img 
                  src="/logo.png" 
                  alt="Plus1 Rewards" 
                  className="w-auto object-contain mx-auto"
                  style={{ height: '70px' }}
                  width="482"
                  height="187"
                />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">Plus1 Rewards</h3>
              <p className="text-xs font-bold uppercase tracking-widest text-purple-600 mb-4">Cashback Programme</p>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed font-medium">
                Shop Local, Earn Medical Cover
              </p>
              <p className="text-xs text-gray-500 leading-relaxed flex-grow">
                A community cashback programme that turns your everyday shopping into medical cover. Shop at partner stores, earn rands, and help protect your family.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}