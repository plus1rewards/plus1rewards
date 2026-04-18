// plus1-rewards/src/pages/Landing.tsx
import { motion } from 'framer-motion'
import Navbar from '../components/landing/Navbar'
import Hero from '../components/landing/Hero'
import PWAInstallBanner from '../components/landing/PWAInstallBanner'
import { lazy, Suspense } from 'react'
import SEO from '../components/SEO'
import { OrganizationSchema, WebSiteSchema, ServiceSchema, FAQSchema } from '../components/StructuredData'

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
    animate: { opacity: 1 }
  }

  const sectionVariants = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 }
  }

  // FAQ data for structured data
  const faqData = [
    {
      question: 'How do I start earning?',
      answer: 'Join Plus1 Rewards and shop at any participating partner store. At checkout, give your cell phone number to earn cashback. You can also scan your QR code. Your cashback then goes toward your medical cover.'
    },
    {
      question: 'Is the medical cover comprehensive?',
      answer: 'You get access to real medical cover, with your benefits clearly shown upfront so you can understand exactly what cover you have.'
    },
    {
      question: "What happens if I don't reach my target this month?",
      answer: "If you do not reach your monthly target, your cover status may change. Keep shopping at Plus1 Rewards partners to help keep your cover active."
    },
    {
      question: 'Is this the same as medical aid?',
      answer: 'No. Plus1 Rewards is different from medical aid. It helps turn your everyday shopping into cashback that goes toward your medical cover.'
    },
    {
      question: 'Do I need a smartphone or internet to use Plus1 Rewards?',
      answer: 'No. The quickest way is to give your cell phone number at checkout. You can also scan your QR code. Plus1 Rewards is built for real-life shopping, even when data is tight.'
    },
    {
      question: 'Which stores near me are Plus1 Rewards partners?',
      answer: 'Look for the Plus1 Rewards sign at participating stores near you, or check the platform to find partner stores in your area.'
    }
  ]

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      transition={{ duration: 0.3, staggerChildren: 0.1 }}
    >
      <SEO
        title="Plus1 Rewards | Earn Cashback Toward Medical Cover in South Africa"
        description="Shop at partner stores and earn real cashback that funds your medical cover. Plus1 Rewards makes healthcare accessible for everyone in South Africa. Choose from Day to Day, Hospital, or Comprehensive cover plans starting at R390/month."
        keywords="medical cover South Africa, cashback rewards, healthcare funding, Day1Health, affordable medical insurance, shop and earn, partner stores SA, medical cover cashback, medical aid alternative, health insurance SA, cashback medical cover, affordable healthcare South Africa"
      />
      <OrganizationSchema />
      <WebSiteSchema />
      <ServiceSchema />
      <FAQSchema faqs={faqData} />
      <Navbar />
      <Hero />
      <PWAInstallBanner />
      <Suspense fallback={<div className="h-20" />}>
        <motion.div variants={sectionVariants} initial="initial" whileInView="animate" viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}>
          <HowItWorks />
        </motion.div>
        <motion.div variants={sectionVariants} initial="initial" whileInView="animate" viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}>
          <CoverStatus />
        </motion.div>
        <motion.div variants={sectionVariants} initial="initial" whileInView="animate" viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}>
          <PartnerCarousel />
        </motion.div>
        <motion.div variants={sectionVariants} initial="initial" whileInView="animate" viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}>
          <Roles />
        </motion.div>
        <motion.div variants={sectionVariants} initial="initial" whileInView="animate" viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}>
          <OfflineFeature />
        </motion.div>
        <motion.div variants={sectionVariants} initial="initial" whileInView="animate" viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}>
          <FAQ />
        </motion.div>
        <motion.div variants={sectionVariants} initial="initial" whileInView="animate" viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}>
          <Footer />
        </motion.div>
      </Suspense>
    </motion.div>
  )
}