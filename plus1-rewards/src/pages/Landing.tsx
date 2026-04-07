// plus1-rewards/src/pages/Landing.tsx
import { motion } from 'framer-motion'
import Navbar from '../components/landing/Navbar'
import Hero from '../components/landing/Hero'
import HowItWorks from '../components/landing/HowItWorks'
import CoverStatus from '../components/landing/CoverStatus'
import PartnerCarousel from '../components/landing/PartnerCarousel'
import Roles from '../components/landing/Roles'
import OfflineFeature from '../components/landing/OfflineFeature'
import FAQ from '../components/landing/FAQ'
import Footer from '../components/landing/Footer'

export default function Landing() {
  const pageVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.15
      }
    }
  }

  const sectionVariants = {
    initial: { opacity: 0, y: 60 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.8,
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
      <Navbar />
      <Hero />
      <motion.div variants={sectionVariants} initial="initial" whileInView="animate" viewport={{ once: true, margin: "-100px" }}>
        <HowItWorks />
      </motion.div>
      <motion.div variants={sectionVariants} initial="initial" whileInView="animate" viewport={{ once: true, margin: "-100px" }}>
        <CoverStatus />
      </motion.div>
      <motion.div variants={sectionVariants} initial="initial" whileInView="animate" viewport={{ once: true, margin: "-100px" }}>
        <PartnerCarousel />
      </motion.div>
      <motion.div variants={sectionVariants} initial="initial" whileInView="animate" viewport={{ once: true, margin: "-100px" }}>
        <Roles />
      </motion.div>
      <motion.div variants={sectionVariants} initial="initial" whileInView="animate" viewport={{ once: true, margin: "-100px" }}>
        <OfflineFeature />
      </motion.div>
      <motion.div variants={sectionVariants} initial="initial" whileInView="animate" viewport={{ once: true, margin: "-100px" }}>
        <FAQ />
      </motion.div>
      <motion.div variants={sectionVariants} initial="initial" whileInView="animate" viewport={{ once: true, margin: "-100px" }}>
        <Footer />
      </motion.div>
    </motion.div>
  )
}