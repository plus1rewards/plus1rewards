// plus1-rewards/src/components/landing/HowItWorks.tsx
import { motion } from 'framer-motion'
import { IconBuildingStore, IconScan, IconShieldCheck } from "@tabler/icons-react";

export default function HowItWorks() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
    },
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 50, rotateX: -10 },
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
    },
  }

  const iconVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: {
      scale: 1,
      rotate: 0,
    },
  }

  const steps = [
    {
      icon: <IconBuildingStore stroke={1.5} className="w-8 h-8 text-[#1a558b]" />,
      number: '01',
      title: 'Shop at partner stores',
      desc: 'Shop at +1 Rewards partner stores near you, from grocery stores and pharmacies to spaza shops and takeaways.',
    },
    {
      icon: <IconScan stroke={1.5} className="w-8 h-8 text-[#1a558b]" />,
      number: '02',
      title: 'Earn cashback on every purchase',
      desc: 'Use your cell phone number or scan your +1 Rewards code at checkout to earn cashback in rands.',
    },
    {
      icon: <IconShieldCheck stroke={1.5} className="w-8 h-8 text-white" />,
      number: '03',
      title: 'Your cover gets paid',
      desc: 'Your cashback adds up and goes toward your Day1Health medical cover until your monthly cover is paid.',
      highlight: true
    },
  ]

  return (
    <section className="py-24 px-6 lg:px-20 bg-white" id="how-it-works">
      <div className="max-w-[1800px] mx-auto">
        <motion.div 
          className="text-center max-w-2xl mx-auto mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <motion.span 
            className="inline-block px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-4 bg-[#1a558b]/10 text-[#1a558b]"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            Simple Process
          </motion.span>
          <motion.h2 
            className="text-4xl lg:text-5xl font-black text-gray-900 mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            Earn Medical Cover in 3 Simple Steps
          </motion.h2>
          <motion.p 
            className="text-lg text-gray-600 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            viewport={{ once: true }}
          >
            Shop local. Earn rands. Medical cover gets paid.
          </motion.p>
        </motion.div>

        <motion.div 
          className="grid md:grid-cols-3 gap-8 relative"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ staggerChildren: 0.2, delayChildren: 0.1 }}
        >
          {/* Connector line */}
          <motion.div 
            className="hidden md:block absolute top-[44px] left-[15%] right-[15%] h-[2px] bg-gray-100 z-0"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            viewport={{ once: true }}
            style={{ originX: 0 }}
          />

          {steps.map((step, i) => (
            <motion.div 
              key={i} 
              className="relative"
              variants={cardVariants}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <motion.div 
                className={`relative z-10 flex flex-col items-center text-center p-8 rounded-3xl transition-all duration-300 hover:-translate-y-2 ${step.highlight ? 'bg-[#1a558b] shadow-xl shadow-blue-900/20' : 'bg-gray-50 border border-gray-100'}`}
                whileHover={{ y: -8 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <motion.div 
                  className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-sm ${step.highlight ? 'bg-white/20 backdrop-blur-sm' : 'bg-white'}`}
                  variants={iconVariants}
                  transition={{ duration: 0.8, ease: "easeOut", type: "spring", stiffness: 100 }}
                >
                  {step.icon}
                </motion.div>
                <motion.div 
                  className={`text-sm font-black tracking-widest mb-3 ${step.highlight ? 'text-blue-200' : 'text-[#1a558b]'}`}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: 0.4 + i * 0.2 }}
                  viewport={{ once: true }}
                >
                  STEP {step.number}
                </motion.div>
                <motion.h3 
                  className={`text-2xl font-bold mb-4 ${step.highlight ? 'text-white' : 'text-gray-900'}`}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: 0.5 + i * 0.2 }}
                  viewport={{ once: true }}
                >
                  {step.title}
                </motion.h3>
                <motion.p 
                  className={`leading-relaxed ${step.highlight ? 'text-blue-100' : 'text-gray-600'}`}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: 0.6 + i * 0.2 }}
                  viewport={{ once: true }}
                >
                  {step.desc}
                </motion.p>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>

        {/* The maths made simple */}
        <motion.div 
          className="mt-16 max-w-4xl mx-auto rounded-3xl overflow-hidden shadow-lg border border-gray-100 flex flex-col md:flex-row"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <motion.div 
            className="bg-[#16a34a] p-8 md:w-1/3 flex flex-col justify-center items-center text-center text-white"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <span className="text-sm font-bold uppercase tracking-widest mb-2 opacity-90">The Maths Made Simple</span>
            <div className="text-4xl font-black">Proof in numbers</div>
          </motion.div>
          <motion.div 
            className="bg-white p-8 md:w-2/3 flex items-center"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <p className="text-gray-700 text-xl leading-relaxed font-medium">
              A tank of fuel, braai supplies, school snacks, a dentist visit, a takeaway, ice cream for the kids = your medical cover.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}