// plus1-rewards/src/pages/Landing.tsx
import { motion } from 'framer-motion'
import Navbar from '../components/landing/Navbar'
import Hero from '../components/landing/Hero'
import { lazy, Suspense } from 'react'
import SEO from '../components/SEO'

// Lazy load below-the-fold components
const HowItWorks = lazy(() => import('../components/landing/HowItWorks'))
const CoverStatus = lazy(() => import('../components/landing/CoverStatus'))
const PartnerCarousel = lazy(() => import('../components/landing/PartnerCarousel'))
const Roles = lazy(() => import('../components/landing/Roles'))
const OfflineFeature = lazy(() => import('../components/landing/OfflineFeature'))
const FAQ = lazy(() => import('../components/landing/FAQ'))
const Footer = lazy(() => import('../components/landing/Footer'))

export default function Landing() {
  const pageVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: {
        duration: 0.3,
        staggerChildren: 0.1
      }
    }
  }

  const sectionVariants = {
    initial: { opacity: 0, y: 30 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
    >
      <SEO
        title="Plus1 Rewards | Earn Cashback Toward Medical Cover"
        description="Shop at partner stores and earn real cashback that funds your medical cover. Plus1 Rewards makes healthcare accessible for everyone in South Africa."
        keywords="medical cover South Africa, cashback rewards, healthcare funding, Day1Health, affordable medical insurance, shop and earn, partner stores SA, medical cover cashback"
        canonical="https://plus1rewards.com/"
        robots="index, follow"
      />
      <Navbar />
      <Hero />
      <Suspense fallback={<div className="h-20" />}>
        <motion.div variants={sectionVariants} initial="initial" whileInView="animate" viewport={{ once: true, margin: "-50px" }}>
          <HowItWorks />
        </motion.div>
        <motion.div variants={sectionVariants} initial="initial" whileInView="animate" viewport={{ once: true, margin: "-50px" }}>
          <CoverStatus />
        </motion.div>
        <motion.div variants={sectionVariants} initial="initial" whileInView="animate" viewport={{ once: true, margin: "-50px" }}>
          <PartnerCarousel />
        </motion.div>
        <motion.div variants={sectionVariants} initial="initial" whileInView="animate" viewport={{ once: true, margin: "-50px" }}>
          <Roles />
        </motion.div>
        <motion.div variants={sectionVariants} initial="initial" whileInView="animate" viewport={{ once: true, margin: "-50px" }}>
          <OfflineFeature />
        </motion.div>
        <motion.div variants={sectionVariants} initial="initial" whileInView="animate" viewport={{ once: true, margin: "-50px" }}>
          <FAQ />
        </motion.div>
        <motion.div variants={sectionVariants} initial="initial" whileInView="animate" viewport={{ once: true, margin: "-50px" }}>
          <Footer />
        </motion.div>
      </Suspense>
    </motion.div>
  )
}