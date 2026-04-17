// plus1-rewards/src/pages/TermsOfService.tsx
import LegalLayout from '../components/landing/LegalLayout'

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-10">
    <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">{title}</h2>
    <div className="space-y-3 text-gray-600 text-sm leading-relaxed">{children}</div>
  </section>
)

const Ul = ({ items }: { items: string[] }) => (
  <ul className="space-y-2 pl-4">
    {items.map((item, i) => (
      <li key={i} className="flex items-start gap-2">
        <span className="mt-1 size-1.5 rounded-full bg-[#1a558b] flex-shrink-0" />
        <span>{item}</span>
      </li>
    ))}
  </ul>
)

export default function TermsOfService() {
  return (
    <LegalLayout
      title="Terms of Service"
      subtitle="Please read these terms carefully before using Plus1 Rewards."
      lastUpdated="April 13, 2026"
    >
      <Section title="1. Acceptance of Terms">
        <p>
          By registering for and using Plus1 Rewards ("the Service"), you agree to be bound by these Terms of
          Service and our Privacy Policy. If you do not agree to these terms, please do not use the Service.
        </p>
        <p>
          These terms apply to all users of the platform including Members, Partners, Agents, and Policy Providers.
        </p>
      </Section>

      <Section title="2. Service Description">
        <p>
          Plus1 Rewards is a cashback-to-healthcare funding platform that enables members to earn real rand-value
          cashback on purchases at registered partner stores. This cashback is automatically allocated toward
          monthly medical cover plans provided by Day1Health (Pty) Ltd, an Authorised Financial Services Provider.
        </p>
        <p>
          Plus1 Rewards is not a medical aid scheme. Cover plans are healthcare products underwritten by Day1Health
          and are subject to Day1Health's own terms and conditions.
        </p>
      </Section>

      <Section title="3. Eligibility">
        <Ul items={[
          'You must be at least 18 years old to register',
          'You must be a South African resident with a valid SA ID number',
          'You must provide a valid South African mobile number',
          'Only one account is permitted per mobile number',
          'You must provide accurate and complete registration information',
        ]} />
      </Section>

      <Section title="4. Member Accounts">
        <p>
          Members register using their cell phone number and a 6-digit PIN. You are responsible for keeping
          your PIN confidential. Do not share your PIN with anyone, including Plus1 Rewards staff.
        </p>
        <p>
          Your account becomes active upon registration. A cover plan is not automatically assigned — you must
          select a plan after registration.
        </p>
        <p>
          Your cover plan will remain in <strong>In Progress</strong> status until the monthly target amount is
          fully funded. Once funded, your plan moves to <strong>Pending</strong> (awaiting Day1Health verification)
          and then to <strong>Active</strong> once verified.
        </p>
      </Section>

      <Section title="5. Cashback and Rewards">
        <Ul items={[
          'Cashback rates range from 3% to 40% of the purchase amount, set by each partner store',
          'Of the total cashback: 1% goes to the platform fee, 1% to the referring agent, and the remainder to the member',
          'Cashback is allocated in real South African Rands — not loyalty points',
          'Cashback is automatically applied to your active cover plan in creation order',
          'Excess cashback (overflow) is stored and used for future plan renewals, upgrades, or sponsorships',
          'Cashback cannot be withdrawn as cash',
          'Cashback is non-transferable between unrelated member accounts',
        ]} />
      </Section>

      <Section title="6. Cover Plans">
        <Ul items={[
          'Cover plans are funded through cashback rewards and optional manual top-ups',
          'Plans activate on a 30-day cycle once the monthly target is fully funded and your profile is complete',
          'A complete profile requires: valid email address, SA ID number, and physical address',
          'Plans are paused if the monthly target is not met or if your profile is incomplete',
          'Multiple plans are funded in the order they were created',
          'Sponsored plans are funded from the sponsor\'s overflow balance',
          'Plus1 Rewards does not guarantee continuous cover — funding depends on your cashback activity',
        ]} />
      </Section>

      <Section title="7. Partner Obligations">
        <p>Partners who register on the platform agree to:</p>
        <Ul items={[
          'Honour the cashback percentage set during registration for all qualifying transactions',
          'Pay monthly invoices by the due date',
          'Not process fraudulent or fictitious transactions',
          'Display Plus1 Rewards branding at their store as required',
          'Maintain accurate business and contact information',
        ]} />
        <p className="mt-3">
          Partners who fail to pay invoices may be suspended. Suspended partners cannot process cashback
          transactions until outstanding amounts are settled.
        </p>
      </Section>

      <Section title="8. Agent Obligations">
        <p>Agents who register on the platform agree to:</p>
        <Ul items={[
          'Accurately represent Plus1 Rewards to prospective partners and members',
          'Not make false or misleading claims about the Service or cover plans',
          'Comply with all applicable financial services regulations',
          'Maintain accurate personal and banking information for commission payments',
        ]} />
        <p className="mt-3">
          Agent commissions of 1% are calculated on the purchase amount of each transaction at recruited
          partner stores. Commissions are paid monthly on the 5th, subject to a minimum threshold of R500.
        </p>
      </Section>

      <Section title="9. Prohibited Activities">
        <Ul items={[
          'Fraudulent transactions, false claims, or manipulation of the rewards system',
          'Sharing, selling, or transferring your account credentials',
          'Creating multiple accounts for the same person',
          'Using the Service for any illegal purpose',
          'Attempting to reverse-engineer or interfere with the platform',
          'Providing false identity or business information',
        ]} />
      </Section>

      <Section title="10. Account Suspension and Termination">
        <p>
          We reserve the right to suspend or terminate any account at any time for violation of these terms,
          fraudulent activity, non-payment (for partners), or any other reason necessary to protect the
          integrity of the Service. We will endeavour to notify you before suspension where possible.
        </p>
        <p>
          You may close your account at any time by contacting support. Any funded cover plan amounts will
          be handled in accordance with Day1Health's terms.
        </p>
      </Section>

      <Section title="11. Limitation of Liability">
        <p>
          Plus1 Rewards acts as a technology platform connecting members, partners, agents, and healthcare
          providers. We are not responsible for:
        </p>
        <Ul items={[
          'The quality of goods or services purchased from partner stores',
          'Healthcare services, claims, or decisions made by Day1Health',
          'Loss of cashback due to partner non-payment or suspension',
          'Interruptions to the Service due to technical issues or maintenance',
          'Any indirect, incidental, or consequential damages',
        ]} />
        <p className="mt-3">
          Our total liability to you for any claim shall not exceed the total cashback amount credited to
          your account in the 3 months preceding the claim.
        </p>
      </Section>

      <Section title="12. Governing Law">
        <p>
          These Terms of Service are governed by the laws of the Republic of South Africa. Any disputes
          shall be subject to the jurisdiction of the South African courts.
        </p>
      </Section>

      <Section title="13. Changes to Terms">
        <p>
          We reserve the right to modify these Terms of Service at any time. Material changes will be
          communicated via in-app notification or email with at least 14 days' notice. Your continued use
          of the Service after the effective date constitutes acceptance of the updated terms.
        </p>
      </Section>

      <Section title="14. Contact">
        <div className="bg-[#f5f8fc] rounded-xl p-6">
          <p className="font-semibold text-gray-800">Plus1 Rewards (Pty) Ltd</p>
          <p>Email: <a href="mailto:plus1rewards@gmail.com" className="text-[#1a558b] hover:underline">plus1rewards@gmail.com</a></p>
          <p>Website: <a href="https://plus1rewards.com" className="text-[#1a558b] hover:underline">plus1rewards.com</a></p>
        </div>
      </Section>
    </LegalLayout>
  )
}
