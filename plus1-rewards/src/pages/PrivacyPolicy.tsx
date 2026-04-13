// plus1-rewards/src/pages/PrivacyPolicy.tsx
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

export default function PrivacyPolicy() {
  return (
    <LegalLayout
      title="Privacy Policy"
      subtitle="How Plus1 Rewards collects, uses, and protects your personal information."
      lastUpdated="April 13, 2026"
    >
      <Section title="1. Introduction">
        <p>
          Plus1 Rewards (Pty) Ltd ("we", "our", or "us") is committed to protecting your privacy and complying
          with the Protection of Personal Information Act 4 of 2013 (POPIA). This Privacy Policy explains how
          we collect, use, disclose, and safeguard your information when you use our platform.
        </p>
        <p>
          By registering and using Plus1 Rewards, you consent to the collection and use of your information
          as described in this policy.
        </p>
      </Section>

      <Section title="2. Information We Collect">
        <p className="font-semibold text-gray-700">Personal Information</p>
        <Ul items={[
          'Full name and date of birth',
          'South African mobile phone number (used as your login)',
          'South African ID number (required for cover plan activation)',
          'Email address',
          '6-digit PIN (stored as a one-way hash — never in plain text)',
          'Physical address (required for cover plan activation)',
        ]} />
        <p className="font-semibold text-gray-700 mt-4">Transaction Information</p>
        <Ul items={[
          'Purchase amounts and dates at partner stores',
          'Cashback amounts earned and allocated',
          'Cover plan funding history and status',
          'Top-up records',
        ]} />
        <p className="font-semibold text-gray-700 mt-4">Technical Information</p>
        <Ul items={[
          'Device type and browser information',
          'IP address and approximate location',
          'App usage data and session information',
        ]} />
      </Section>

      <Section title="3. How We Use Your Information">
        <Ul items={[
          'To create and manage your member, partner, or agent account',
          'To process cashback transactions and allocate rewards to your cover plan',
          'To manage your medical cover plan funding, status, and renewals',
          'To verify your identity and prevent fraud',
          'To communicate with you about your account, transactions, and cover status',
          'To share necessary information with Day1Health to activate and maintain your cover',
          'To generate invoices and statements for partner stores',
          'To calculate and pay agent commissions',
          'To comply with legal and regulatory obligations',
          'To improve our platform and user experience',
        ]} />
      </Section>

      <Section title="4. Information Sharing">
        <p>We do not sell your personal information. We may share it only in the following circumstances:</p>
        <p className="font-semibold text-gray-700 mt-3">Day1Health (Healthcare Provider)</p>
        <p>
          We share your name, ID number, date of birth, address, and cover plan details with Day1Health (Pty) Ltd
          to activate and administer your medical cover. Day1Health is an Authorised Financial Services Provider
          regulated by the FSCA.
        </p>
        <p className="font-semibold text-gray-700 mt-3">Partner Stores</p>
        <p>
          Partner stores receive only the minimum information needed to process a cashback transaction — your
          phone number or QR code. They do not receive your ID number, address, or cover plan details.
        </p>
        <p className="font-semibold text-gray-700 mt-3">Agents</p>
        <p>
          Your assigned agent may view your account status and transaction history to provide support.
          Agents cannot modify your account or access your PIN.
        </p>
        <p className="font-semibold text-gray-700 mt-3">Legal Requirements</p>
        <p>
          We may disclose your information when required by law, court order, or to protect the rights,
          property, or safety of Plus1 Rewards, our users, or the public.
        </p>
      </Section>

      <Section title="5. Data Security">
        <Ul items={[
          'All data is encrypted in transit (TLS/HTTPS) and at rest',
          'PINs are hashed using industry-standard algorithms and never stored in plain text',
          'Database access is controlled by Row Level Security (RLS) policies',
          'Admin access requires multi-factor authentication',
          'Regular security reviews and monitoring',
          'Access to personal data is restricted to authorised personnel only',
        ]} />
      </Section>

      <Section title="6. Your Rights Under POPIA">
        <p>As a data subject, you have the right to:</p>
        <Ul items={[
          'Access the personal information we hold about you',
          'Request correction of inaccurate or incomplete information',
          'Request deletion of your personal information (subject to legal retention requirements)',
          'Object to the processing of your personal information',
          'Withdraw consent at any time (this may affect your ability to use the Service)',
          'Lodge a complaint with the Information Regulator of South Africa',
        ]} />
        <p className="mt-3">
          To exercise any of these rights, contact our Information Officer at{' '}
          <a href="mailto:privacy@plus1rewards.co.za" className="text-[#1a558b] font-medium hover:underline">
            privacy@plus1rewards.co.za
          </a>.
        </p>
      </Section>

      <Section title="7. Data Retention">
        <p>
          We retain your personal information for as long as your account is active or as required to provide
          our services. After account closure, we retain certain records for a minimum of 5 years to comply
          with financial and regulatory obligations. Transaction records may be retained for up to 7 years.
        </p>
      </Section>

      <Section title="8. Cookies and Offline Storage">
        <p>
          Plus1 Rewards uses browser local storage and IndexedDB to enable offline functionality. This data
          is stored only on your device and is used to allow the app to function without an internet connection.
          No tracking cookies are used for advertising purposes.
        </p>
      </Section>

      <Section title="9. Children's Privacy">
        <p>
          Our Service is not intended for individuals under 18 years of age. We do not knowingly collect
          personal information from minors. If you believe a minor has registered, please contact us immediately.
        </p>
      </Section>

      <Section title="10. Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time. Material changes will be communicated via
          in-app notification or email. Your continued use of the Service after changes are posted constitutes
          acceptance of the updated policy.
        </p>
      </Section>

      <Section title="11. Contact Us">
        <div className="bg-[#f5f8fc] rounded-xl p-6 space-y-3">
          <div>
            <p className="font-semibold text-gray-800">Information Officer — Plus1 Rewards (Pty) Ltd</p>
            <p>Email: <a href="mailto:privacy@plus1rewards.co.za" className="text-[#1a558b] hover:underline">privacy@plus1rewards.co.za</a></p>
          </div>
          <div className="border-t border-gray-200 pt-3">
            <p className="font-semibold text-gray-800">Information Regulator of South Africa</p>
            <p>Website: <a href="https://www.inforegulator.org.za" target="_blank" rel="noopener noreferrer" className="text-[#1a558b] hover:underline">www.inforegulator.org.za</a></p>
            <p>Email: <a href="mailto:inforeg@justice.gov.za" className="text-[#1a558b] hover:underline">inforeg@justice.gov.za</a></p>
          </div>
        </div>
      </Section>
    </LegalLayout>
  )
}
