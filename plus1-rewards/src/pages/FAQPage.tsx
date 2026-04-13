// plus1-rewards/src/pages/FAQPage.tsx
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import LegalLayout from '../components/landing/LegalLayout'

const BLUE = '#1a558b'

interface FAQItem {
  q: string
  a: string
}

interface FAQCategory {
  title: string
  icon: string
  items: FAQItem[]
}

const categories: FAQCategory[] = [
  {
    title: 'Getting Started',
    icon: 'rocket_launch',
    items: [
      {
        q: 'What is Plus1 Rewards?',
        a: 'Plus1 Rewards is a healthcare funding platform that lets you earn real cashback — in South African Rands — every time you shop at a partner store. That cashback automatically funds your monthly medical cover plan through Day1Health.',
      },
      {
        q: 'How do I join?',
        a: 'Registration is free. Visit plus1rewards.com and click "Start Earning Medical Cover". You\'ll need your cell phone number, date of birth, and a 6-digit PIN. You must be 18 or older and a South African resident.',
      },
      {
        q: 'Is there a joining fee?',
        a: 'No. Joining Plus1 Rewards is completely free. You only need to start shopping at partner stores to begin funding your cover.',
      },
      {
        q: 'Do I need a smartphone?',
        a: 'No. The simplest way to earn cashback is to give your cell phone number at the partner store checkout. You can also use your QR code if you have a smartphone. Plus1 Rewards works even with limited data — it\'s built for real-life South African shopping.',
      },
    ],
  },
  {
    title: 'Earning Cashback',
    icon: 'payments',
    items: [
      {
        q: 'How do I earn cashback?',
        a: 'Shop at any registered Plus1 Rewards partner store. At checkout, give the cashier your cell phone number or scan your QR code. The cashback is automatically calculated and added to your cover plan — no app needed at the till.',
      },
      {
        q: 'How much cashback do I earn?',
        a: 'Each partner store sets their own cashback rate between 3% and 40% of your purchase amount. Of that total: 1% goes to the platform fee, 1% to your referring agent, and the rest goes directly to your cover plan.',
      },
      {
        q: 'Is cashback real money?',
        a: 'Yes. Cashback is credited in real South African Rands — not loyalty points or vouchers. It goes directly toward funding your medical cover plan.',
      },
      {
        q: 'Can I withdraw my cashback as cash?',
        a: 'No. Cashback can only be used to fund your medical cover plans. It cannot be withdrawn as cash or transferred to a bank account.',
      },
      {
        q: 'What happens to extra cashback once my plan is fully funded?',
        a: 'Any cashback earned after your plan reaches 100% is stored as overflow in your first plan. Overflow is used to fund your next 30-day cycle, upgrade plans, fund dependant plans, or sponsor someone else\'s cover.',
      },
    ],
  },
  {
    title: 'Medical Cover',
    icon: 'health_and_safety',
    items: [
      {
        q: 'What cover plans are available?',
        a: 'Three plans are available: Day to Day Single (R385/month), Hospital Value Single (R390/month), and Comprehensive Value Plus Single (R665/month). Each plan is underwritten by Day1Health (Pty) Ltd.',
      },
      {
        q: 'Is this the same as medical aid?',
        a: 'No. Plus1 Rewards cover plans are primary healthcare insurance products, not medical aid. They are governed by the Insurance Act and regulated by the FSCA — not the Medical Schemes Act. See our Insurance Disclosure page for a full comparison.',
      },
      {
        q: 'When does my cover become active?',
        a: 'Your cover plan activates once: (1) the monthly target amount is fully funded, and (2) your profile is complete with a valid email, SA ID number, and physical address. Day1Health then verifies your details before activating the plan.',
      },
      {
        q: 'What does "profile complete" mean?',
        a: 'Your profile is complete when you have added a valid email address (not the default @plus1rewards.local one), your SA ID number, and your address. These are required by Day1Health to activate your cover.',
      },
      {
        q: 'What happens if I don\'t reach my monthly target?',
        a: 'If your plan is not fully funded by the end of the 30-day cycle, it will be paused. You won\'t have active cover until the target is reached again. Keep shopping at partner stores to maintain your cover.',
      },
      {
        q: 'Can I cover my family?',
        a: 'Yes. You can add dependants to your account or sponsor a family member\'s cover plan. Sponsored plans are funded from your overflow balance. Note: sponsored members cannot earn cashback themselves — only the sponsor earns.',
      },
    ],
  },
  {
    title: 'Partner Stores',
    icon: 'storefront',
    items: [
      {
        q: 'How do I find partner stores near me?',
        a: 'Look for the Plus1 Rewards sign at participating stores, or use the "Find a Partner" feature in the app to search for stores in your area.',
      },
      {
        q: 'How do I become a partner store?',
        a: 'Visit plus1rewards.com and click "Become a Partner". You\'ll need your business details, contact information, and to set your cashback percentage (3–40%). Your application will be reviewed by our team.',
      },
      {
        q: 'How does billing work for partners?',
        a: 'Partners receive a monthly invoice for the total cashback issued to members during that month. Invoices are due by the date specified. Unpaid invoices may result in account suspension.',
      },
    ],
  },
  {
    title: 'Agents',
    icon: 'groups',
    items: [
      {
        q: 'What is an agent?',
        a: 'Agents recruit partner stores to join Plus1 Rewards. For every transaction processed at a store they recruited, agents earn 1% of the purchase amount as commission.',
      },
      {
        q: 'How do I become an agent?',
        a: 'Visit plus1rewards.com/agent/register. You\'ll need your SA ID, contact details, and to upload your ID document. Applications are reviewed and approved by our admin team.',
      },
      {
        q: 'When are commissions paid?',
        a: 'Agent commissions are paid on the 5th of each month for the previous month\'s transactions. A minimum threshold of R500 applies.',
      },
    ],
  },
  {
    title: 'Account & Security',
    icon: 'lock',
    items: [
      {
        q: 'What if I forget my PIN?',
        a: 'Contact Plus1 Rewards support with your registered cell phone number to reset your PIN. For security, PIN resets require identity verification.',
      },
      {
        q: 'Can I use Plus1 Rewards offline?',
        a: 'Yes. Plus1 Rewards is a Progressive Web App (PWA) with offline capabilities. Transactions made offline are queued and synced when your connection is restored.',
      },
      {
        q: 'How is my data protected?',
        a: 'All data is encrypted in transit and at rest. PINs are hashed and never stored in plain text. We comply with POPIA. See our Privacy Policy for full details.',
      },
      {
        q: 'Can I close my account?',
        a: 'Yes. Contact support@plus1rewards.co.za to request account closure. Any active cover plans will be handled in accordance with Day1Health\'s terms.',
      },
    ],
  },
]

function FAQAccordion({ items }: { items: FAQItem[] }) {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div
          key={i}
          className="border border-gray-200 rounded-xl overflow-hidden"
          style={{ borderColor: open === i ? 'rgba(26,85,139,0.3)' : undefined }}
        >
          <button
            className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
            onClick={() => setOpen(open === i ? null : i)}
          >
            <span className="font-semibold text-gray-900 text-sm pr-4">{item.q}</span>
            <motion.span
              className="material-symbols-outlined text-xl flex-shrink-0"
              style={{ color: BLUE }}
              animate={{ rotate: open === i ? 180 : 0 }}
              transition={{ duration: 0.25 }}
            >
              expand_more
            </motion.span>
          </button>
          <AnimatePresence>
            {open === i && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <p className="px-5 pb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
                  {item.a}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  )
}

export default function FAQPage() {
  return (
    <LegalLayout
      title="Frequently Asked Questions"
      subtitle="Everything you need to know about Plus1 Rewards."
    >
      <div className="space-y-12">
        {categories.map((cat) => (
          <section key={cat.title}>
            <div className="flex items-center gap-3 mb-5">
              <div
                className="size-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'rgba(26,85,139,0.1)' }}
              >
                <span className="material-symbols-outlined text-lg" style={{ color: BLUE }}>
                  {cat.icon}
                </span>
              </div>
              <h2 className="text-lg font-bold text-gray-900">{cat.title}</h2>
            </div>
            <FAQAccordion items={cat.items} />
          </section>
        ))}
      </div>

      {/* Still have questions */}
      <div className="mt-14 p-8 rounded-2xl text-center" style={{ backgroundColor: 'rgba(26,85,139,0.06)', border: '1px solid rgba(26,85,139,0.15)' }}>
        <span className="material-symbols-outlined text-4xl mb-3 block" style={{ color: BLUE }}>support_agent</span>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Still have questions?</h3>
        <p className="text-sm text-gray-600 mb-5">Our support team is here to help.</p>
        <a
          href="mailto:support@plus1rewards.co.za"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90"
          style={{ backgroundColor: BLUE }}
        >
          <span className="material-symbols-outlined text-base">mail</span>
          Contact Support
        </a>
      </div>
    </LegalLayout>
  )
}
