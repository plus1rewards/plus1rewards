// plus1-rewards/src/pages/Landing.tsx
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
  return (
    <>
      <Navbar />
      <Hero />
      <HowItWorks />
      <CoverStatus />
      <PartnerCarousel />
      <Roles />
      <OfflineFeature />
      <FAQ />
      <Footer />
    </>
  )
}