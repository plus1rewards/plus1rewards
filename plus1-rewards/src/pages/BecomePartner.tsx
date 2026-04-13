// plus1-rewards/src/pages/BecomePartner.tsx
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/landing/Navbar'
import Footer from '../components/landing/Footer'
import SEO from '../components/SEO'
import { AnimatedCard, CardBody, CardTitle, CardDescription, CardVisual, Visual1 } from '../components/ui/animated-card'

const BLUE = '#1a568b'
const GREEN = '#37d270'

const advantages = [
  {
    number: '01',
    title: 'Zero Customer Acquisition Cost',
    icon: 'savings',
    color: 'bg-blue-50 border-blue-200 text-blue-700',
    impact: '+R200–400K/year',
    impactType: 'Cost Savings',
    summary: 'Members actively come looking for you through the Plus1 app — no advertising spend required.',
    before: 'R100–500 per customer on ads, promotions, direct mail. R50,000–500,000/month marketing budget.',
    after: 'Members discover you via the app. Geographic matching shows nearby partners. Your acquisition cost: R0.',
    highlight: 'A store with R5M annual revenue typically spends R200,000–400,000/year on marketing. With Plus1, that\'s profit you keep.',
  },
  {
    number: '02',
    title: '3–4x Increase in Foot Traffic',
    icon: 'groups',
    color: 'bg-green-50 border-green-200 text-green-700',
    impact: '+R1–1.5M/month',
    impactType: 'Revenue',
    summary: 'Plus1 members visit 2–4 times per month — not 3–5 times per year like regular customers.',
    before: 'Average customer visits 3–5 times/year. Sporadic shopping. High cost to drive traffic.',
    after: 'Members visit 24–48x/year. High intent — they came specifically to earn cashback toward their medical cover.',
    highlight: 'A 50-employee store goes from 1,000 to 3,000–4,000 customers/month. You don\'t change your store — just prepare for the traffic.',
  },
  {
    number: '03',
    title: '10–100x Higher Customer Lifetime Value',
    icon: 'trending_up',
    color: 'bg-purple-50 border-purple-200 text-purple-700',
    impact: '+R3–10M lifetime',
    impactType: 'Revenue',
    summary: 'One Plus1 member is worth 10–20x a regular customer over their lifetime.',
    before: 'Regular customer: 1–2 year lifetime, 3–5 visits/year, R500/visit = R1,500–5,000 total spend.',
    after: 'Plus1 member: 3–5 year lifetime, 2–4 visits/month, R1,000–1,500/visit = R36,000–90,000 total spend.',
    highlight: 'Instead of acquiring 100 regular customers, you\'re acquiring 5–10 Plus1 members who spend like 100 customers.',
  },
  {
    number: '04',
    title: 'Dramatically Lower Customer Churn',
    icon: 'loyalty',
    color: 'bg-teal-50 border-teal-200 text-teal-700',
    impact: '+R500K–1M',
    impactType: 'Retention',
    summary: 'Members have skin in the game — they\'ve earned cashback and won\'t walk away from their medical cover goal.',
    before: 'Retention: 40–50%. By month 2, half your customers are gone. Constantly replacing lost customers.',
    after: 'Retention: 80–90%. Switching cost is high — financially and psychologically. Medical cover goal creates commitment.',
    highlight: 'Without Plus1: 1,000 → 500 → 250 customers. With Plus1: 1,000 → 900 → 810. Compounding growth without extra acquisition.',
  },
  {
    number: '05',
    title: 'Increased Average Transaction Size',
    icon: 'shopping_cart',
    color: 'bg-orange-50 border-orange-200 text-orange-700',
    impact: '+R500K–1M/month',
    impactType: 'Revenue',
    summary: 'Goal-driven customers buy more, browse more, and buy higher margins.',
    before: 'Regular customer: "I need groceries" → R500 purchase. Passive buying behaviour.',
    after: 'Plus1 member: "I need to earn R100 more toward my medical cover" → R1,200 purchase. Goal-driven.',
    highlight: 'Same store, same customers: 1,000 transactions at R500 = R500K/month. With Plus1: same transactions at R1,000–1,500 = R1–1.5M/month.',
  },
  {
    number: '06',
    title: 'Better Inventory Turnover & Cash Flow',
    icon: 'inventory',
    color: 'bg-cyan-50 border-cyan-200 text-cyan-700',
    impact: '+R200–400K',
    impactType: 'Working Capital',
    summary: 'Products move faster, less dead stock, faster cash conversion cycle.',
    before: 'Slow turnover. Dead stock. Markdowns. Working capital tied up in inventory.',
    after: 'Consistent high-intent traffic. Products move off shelves faster. Less spoilage. Better cash flow.',
    highlight: 'A R5M store with 30% faster turnover frees up R400,000+ in working capital to reinvest.',
  },
  {
    number: '07',
    title: 'Network Effect & Competitive Advantage',
    icon: 'hub',
    color: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    impact: '+R500K–5M',
    impactType: 'Strategic (Early Mover)',
    summary: 'First movers in each area get 12+ months of monopoly advantage before competitors join.',
    before: 'No switching barrier. Customers can shop anywhere. No loyalty mechanism.',
    after: 'Month 1: First partner gets 500 members. Month 12: 10,000+ members. Non-partners losing customers to Plus1 network.',
    highlight: 'Early joiners get 12 months of monopoly advantage worth R1–5M in additional profit in the first 18 months.',
  },
  {
    number: '08',
    title: 'Passive Brand Marketing & Word-of-Mouth',
    icon: 'campaign',
    color: 'bg-pink-50 border-pink-200 text-pink-700',
    impact: '+R200–400K/year',
    impactType: 'Marketing Value',
    summary: 'Your store is promoted through the Plus1 app, member referrals, agent networks — all at zero cost.',
    before: 'R200,000–400,000/year marketing budget. Uncertain ROI. Constant effort required.',
    after: 'App geo-discovery. Member referrals. Sponsorship network. Agent recommendations. Plus1 brand credibility.',
    highlight: 'A mid-sized store budgets R200,000–400,000/year for marketing. Plus1 gives you channels that would cost that much to replicate — for free.',
  },
  {
    number: '09',
    title: 'Data Insights & Customer Intelligence',
    icon: 'analytics',
    color: 'bg-amber-50 border-amber-200 text-amber-700',
    impact: '+R200–500K',
    impactType: 'Optimisation',
    summary: 'Visibility into when customers visit, what they buy, spending patterns, and seasonal trends.',
    before: 'No data. Guessing what to stock. No insight into customer behaviour. Large chains spend millions on analytics.',
    after: 'Real purchase data. Buying patterns. High-value customer identification. Optimise layout and merchandising.',
    highlight: 'On a R5M store, 5% efficiency improvement from data = R250,000 additional profit.',
  },
  {
    number: '10',
    title: 'Future Revenue Opportunities',
    icon: 'rocket_launch',
    color: 'bg-rose-50 border-rose-200 text-rose-700',
    impact: '+R100K–5M+',
    impactType: 'Long-term',
    summary: 'Being an early Plus1 partner opens doors to new revenue streams as the ecosystem expands.',
    before: 'Single revenue stream. No ecosystem play. No first-mover advantage.',
    after: 'Sponsored products. Premium membership tiers. Data licensing. Financial services integration. International expansion.',
    highlight: 'If Plus1 becomes dominant like Momentum/Discovery, early partners could unlock R1–10M+ in additional revenue over 5 years.',
  },
]

const summaryTable = [
  { num: 1, title: 'Zero Customer Acquisition Cost', impact: '+R200–400K', type: 'Cost Savings' },
  { num: 2, title: '3–4x Foot Traffic',              impact: '+R1–1.5M',  type: 'Revenue' },
  { num: 3, title: '10–100x Higher Customer LTV',    impact: '+R3–10M',   type: 'Revenue (lifetime)' },
  { num: 4, title: 'Lower Customer Churn',           impact: '+R500K–1M', type: 'Retention' },
  { num: 5, title: 'Larger Transaction Size',        impact: '+R500K–1M', type: 'Revenue' },
  { num: 6, title: 'Better Cash Flow',               impact: '+R200–400K',type: 'Working Capital' },
  { num: 7, title: 'Network Effect Advantage',       impact: '+R500K–5M', type: 'Strategic' },
  { num: 8, title: 'Passive Brand Marketing',        impact: '+R200–400K',type: 'Marketing' },
  { num: 9, title: 'Customer Intelligence Data',     impact: '+R200–500K',type: 'Optimisation' },
  { num: 10,title: 'Future Revenue Opportunities',   impact: '+R100K–5M+',type: 'Long-term' },
]

const objections = [
  { q: '"It will cost me too much"', a: 'You\'re spending R200–400K on customer acquisition now. This replaces that cost and brings 3–4x more customers. Your net is +3–4x profit.' },
  { q: '"My margins are too thin"', a: 'Then you need higher volume to survive. Plus1 gives you exactly that — 3–4x more transactions. Even at thin margins, 3–4x volume = 3–4x profit.' },
  { q: '"Customers won\'t come"', a: 'They will because we show them where you are. Members are actively seeking Plus1 partners. You\'re not hoping they come — you\'re receiving customers looking for you.' },
  { q: '"I don\'t need help with customers"', a: 'Even successful stores benefit. You get 3–4x the traffic, higher basket size, lower churn, better data, and zero acquisition cost. That\'s not desperation — that\'s optimisation.' },
  { q: '"I\'ll join when more partners join"', a: 'That\'s the opposite of the network effect. First movers get 12+ months of advantage before the network saturates. You want to be early.' },
]

export default function BecomePartner() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SEO
        title="Become a Partner | Plus1 Rewards — 10 Reasons to Join"
        description="Discover the 10 core advantages of becoming a Plus1 Rewards partner. Zero acquisition cost, 3–4x foot traffic, and up to R10M in combined annual impact."
        keywords="become a partner Plus1 Rewards, retail partner benefits, cashback partner South Africa, increase foot traffic, customer loyalty programme"
      />

      <Navbar />

      {/* ── HERO ── */}
      <div className="relative min-h-screen flex flex-col justify-center overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #060d1a 0%, #0a1628 40%, #0d2040 100%)' }}>

        {/* Animated grid */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: 'linear-gradient(rgba(26,86,139,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(26,86,139,0.12) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

        {/* Green glow top-right */}
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(55,210,112,0.18), transparent 65%)', transform: 'translate(20%, -20%)' }}
        />
        {/* Blue glow bottom-left */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.35, 0.2] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(26,86,139,0.4), transparent 65%)', transform: 'translate(-20%, 20%)' }}
        />

        {/* Floating particles */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: Math.random() * 4 + 2,
              height: Math.random() * 4 + 2,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              backgroundColor: i % 2 === 0 ? 'rgba(55,210,112,0.6)' : 'rgba(255,255,255,0.3)',
            }}
            animate={{ y: [0, -30, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 3 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 5, ease: 'easeInOut' }}
          />
        ))}

        <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-20 pt-32 pb-20">

          {/* Back link */}
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white/80 transition-colors mb-12">
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Back to Home
          </Link>

          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3 mb-8"
          >
            <motion.span
              animate={{ scaleX: [0, 1] }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="block h-px w-10 origin-left"
              style={{ backgroundColor: GREEN }}
            />
            <span className="text-xs font-bold uppercase tracking-[0.25em]" style={{ color: GREEN }}>
              For Business Owners & Retailers
            </span>
          </motion.div>

          {/* Main headline */}
          <div className="mb-8 overflow-hidden">
            <motion.p
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="text-white/50 text-lg md:text-xl font-medium mb-2"
            >
              You're making R200K a year.
            </motion.p>
            <motion.h1
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.0] text-white"
            >
              When you could be<br />
              making{' '}
              <span className="relative inline-block">
                <span style={{ color: GREEN }}>R600K.</span>
                <motion.span
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.6, delay: 1.2, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute -bottom-1 left-0 right-0 h-1 origin-left rounded-full"
                  style={{ backgroundColor: GREEN, opacity: 0.5 }}
                />
              </span>
            </motion.h1>
            <motion.p
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="text-white/40 text-2xl md:text-3xl font-black mt-2"
            >
              You just haven't realized it yet.
            </motion.p>
          </div>

          {/* Body copy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="max-w-2xl mb-10 space-y-4"
          >
            <p className="text-white/60 text-base leading-relaxed">
              Here's the hard truth: You think your current business model is solid. You think your margins are fine. You think your customers are loyal.
            </p>
            <p className="text-white/80 text-base leading-relaxed font-medium">
              But you're comparing yourself to your past — not to what's actually possible right now.
            </p>

            {/* Bullet list */}
            <div className="space-y-2 pt-2">
              {[
                'Brings customers to you automatically (R0 cost)',
                'Makes them visit 2–4× a month instead of 3–5× a year',
                'Makes them spend R1,000–1,500 instead of R500 per visit',
                'Keeps them coming back 80% of the time instead of 50%',
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.9 + i * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <span className="mt-1 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(55,210,112,0.2)', border: '1px solid rgba(55,210,112,0.4)' }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: GREEN }} />
                  </span>
                  <span className="text-white/70 text-sm leading-relaxed">{item}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* The choice */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.4 }}
            className="mb-10 p-5 rounded-2xl border"
            style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-3 rounded-xl" style={{ backgroundColor: 'rgba(55,210,112,0.08)', border: '1px solid rgba(55,210,112,0.2)' }}>
                <span className="text-xl mt-0.5">⚡</span>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: GREEN }}>Smart money joins now</p>
                  <p className="text-white/60 text-xs leading-relaxed">12-month head start. Monopoly advantage. Compounding growth.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <span className="text-xl mt-0.5">🐢</span>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest mb-1 text-white/40">Late money joins later</p>
                  <p className="text-white/40 text-xs leading-relaxed">Plays catch-up forever. Saturated market. Competitor advantage.</p>
                </div>
              </div>
            </div>
            <p className="text-center text-white/50 text-sm font-bold mt-4">Which one are you?</p>
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.6 }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <a
              href="#advantages"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-black text-sm text-white transition-all shadow-2xl relative overflow-hidden"
              style={{ backgroundColor: GREEN }}
            >
              <motion.span
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 pointer-events-none"
              />
              <span className="material-symbols-outlined text-base">calculate</span>
              Show Me The Math
            </a>
            <Link
              to="/partner/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-black text-sm text-white border-2 transition-all hover:bg-white/10"
              style={{ borderColor: BLUE, backgroundColor: 'rgba(26,86,139,0.3)' }}
            >
              <span className="material-symbols-outlined text-base">phone_in_talk</span>
              Register Now
            </Link>
          </motion.div>

          {/* Scroll hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.2 }}
            className="mt-16 flex flex-col items-start gap-2"
          >
            <span className="text-white/30 text-xs uppercase tracking-widest">Scroll to see all 10 advantages</span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <span className="material-symbols-outlined text-white/30 text-xl">keyboard_arrow_down</span>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Total impact banner */}
      <div className="px-6 lg:px-20 py-8" style={{ backgroundColor: '#f5f8fc' }}>
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Year 1 Combined Impact', value: 'R3.5–10M', icon: 'payments' },
              { label: 'Foot Traffic Increase', value: '3–4x', icon: 'groups' },
              { label: 'Customer Lifetime Value', value: '10–100x', icon: 'trending_up' },
              { label: 'Customer Retention', value: '80–90%', icon: 'loyalty' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm"
              >
                <span className="material-symbols-outlined text-2xl mb-1 block" style={{ color: BLUE }}>{stat.icon}</span>
                <p className="text-xl md:text-2xl font-black text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* 10 Advantages */}
      <main id="advantages" className="flex-1 px-6 lg:px-20 py-12">
        <div className="max-w-5xl mx-auto space-y-8">

          {advantages.map((adv, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.03 }}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
            >
              {/* Card header */}
              <div className="px-5 md:px-8 py-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: 'rgba(26,85,139,0.08)' }}>
                    <span className="material-symbols-outlined text-xl" style={{ color: BLUE }}>{adv.icon}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Advantage {adv.number}</span>
                    <h2 className="text-base md:text-lg font-black text-gray-900 leading-tight">{adv.title}</h2>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-sm font-black text-gray-900">{adv.impact}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${adv.color}`}>{adv.impactType}</span>
                </div>
              </div>

              <div className="px-5 md:px-8 py-5 space-y-4">
                <p className="text-gray-600 text-sm leading-relaxed">{adv.summary}</p>

                {/* Before / After */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                    <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-1.5">Without Plus1</p>
                    <p className="text-xs text-red-800 leading-relaxed">{adv.before}</p>
                  </div>
                  <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                    <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest mb-1.5">With Plus1</p>
                    <p className="text-xs text-green-800 leading-relaxed">{adv.after}</p>
                  </div>
                </div>

                {/* Highlight */}
                <div className="flex items-start gap-2.5 p-3 rounded-xl"
                  style={{ backgroundColor: 'rgba(26,85,139,0.06)', border: '1px solid rgba(26,85,139,0.12)' }}>
                  <span className="material-symbols-outlined text-base flex-shrink-0 mt-0.5" style={{ color: BLUE }}>lightbulb</span>
                  <p className="text-xs text-gray-700 leading-relaxed">{adv.highlight}</p>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Summary table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 md:px-8 py-5 border-b border-gray-100">
              <h2 className="text-lg font-black text-gray-900">The Full Picture: Total Partner Value</h2>
              <p className="text-sm text-gray-500 mt-0.5">Summary of all 10 advantages and their annual impact</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 md:px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-500">#</th>
                    <th className="px-4 md:px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-500">Advantage</th>
                    <th className="px-4 md:px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-500">Annual Impact</th>
                    <th className="px-4 md:px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-500 hidden sm:table-cell">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {summaryTable.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 md:px-6 py-3 text-xs font-bold text-gray-400">{row.num}</td>
                      <td className="px-4 md:px-6 py-3 text-xs font-semibold text-gray-800">{row.title}</td>
                      <td className="px-4 md:px-6 py-3 text-xs font-black" style={{ color: BLUE }}>{row.impact}</td>
                      <td className="px-4 md:px-6 py-3 text-xs text-gray-500 hidden sm:table-cell">{row.type}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-900">
                    <td colSpan={2} className="px-4 md:px-6 py-4 text-sm font-black text-white">TOTAL YEAR 1 IMPACT</td>
                    <td className="px-4 md:px-6 py-4 text-sm font-black text-green-400">+R3.5–10M</td>
                    <td className="px-4 md:px-6 py-4 text-xs text-gray-400 hidden sm:table-cell">Combined</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Objections */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 md:px-8 py-5 border-b border-gray-100">
              <h2 className="text-lg font-black text-gray-900">Common Questions Answered</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {objections.map((obj, i) => (
                <div key={i} className="px-5 md:px-8 py-5">
                  <p className="text-sm font-bold text-gray-900 mb-1.5">{obj.q}</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{obj.a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Elevator pitch */}
          <div className="rounded-2xl overflow-hidden" style={{ background: `linear-gradient(135deg, ${BLUE}, #0d3d6e)` }}>
            <div className="px-5 md:px-8 py-8">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-white text-xl">record_voice_over</span>
                <h2 className="text-base font-black text-white">The 30-Second Pitch</h2>
              </div>
              <blockquote className="text-white/90 text-sm md:text-base leading-relaxed italic border-l-2 border-white/30 pl-4">
                "Plus1 brings you 3–4x more customers who visit 10x more often, spend 2x more per visit, and stay 5x longer. We absorb all complexity. You just provide cashback. The result: 3–4x more profit with zero acquisition cost."
              </blockquote>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center py-8">
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-3">
              The question isn't "Should I join?"
            </h2>
            <p className="text-gray-500 text-base mb-6 max-w-xl mx-auto">
              It's "How long can I afford NOT to join while my competitors are getting these benefits?"
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/partner/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 shadow-lg"
                style={{ backgroundColor: BLUE }}
              >
                <span className="material-symbols-outlined text-base">storefront</span>
                Register as a Partner
              </Link>
              <Link
                to="/find-partner"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-sm border-2 transition-all hover:bg-gray-50"
                style={{ borderColor: BLUE, color: BLUE }}
              >
                Find Partner Stores
              </Link>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  )
}
