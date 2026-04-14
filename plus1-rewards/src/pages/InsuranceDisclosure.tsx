// plus1-rewards/src/pages/InsuranceDisclosure.tsx
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

const InfoBox = ({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) => (
  <div className="flex gap-4 p-5 rounded-xl border border-gray-200 bg-[#f5f8fc]">
    <span className="material-symbols-outlined text-[#1a558b] text-2xl flex-shrink-0 mt-0.5">{icon}</span>
    <div>
      <p className="font-semibold text-gray-800 mb-1">{title}</p>
      <div className="text-sm text-gray-600 leading-relaxed">{children}</div>
    </div>
  </div>
)

export default function InsuranceDisclosure() {
  return (
    <LegalLayout
      title="Insurance Disclosure"
      subtitle="Important information about the nature of cover provided through Plus1 Rewards."
      lastUpdated="April 13, 2026"
    >
      {/* Important notice banner */}
      <div className="mb-10 p-5 rounded-xl border-2 border-amber-300 bg-amber-50">
        <div className="flex gap-3">
          <span className="material-symbols-outlined text-amber-600 text-2xl flex-shrink-0">warning</span>
          <div>
            <p className="font-bold text-amber-900 mb-1">Important Notice</p>
            <p className="text-sm text-amber-800 leading-relaxed">
              Plus1 Rewards is <strong>not a medical aid scheme</strong> and is not registered as one under
              the Medical Schemes Act 131 of 1998. The cover plans available through Plus1 Rewards are
              healthcare insurance products underwritten by Day1Health (Pty) Ltd.
            </p>
          </div>
        </div>
      </div>

      <Section title="1. About the Cover Provider">
        <div className="grid sm:grid-cols-2 gap-4">
          <InfoBox icon="verified" title="Day1Health (Pty) Ltd">
            <p>The healthcare cover plans available through Plus1 Rewards are underwritten and administered by Day1Health (Pty) Ltd.</p>
          </InfoBox>
          <InfoBox icon="gavel" title="FSP Licensed">
            <p>Day1Health is an Authorised Financial Services Provider (FSP) regulated by the Financial Sector Conduct Authority (FSCA) of South Africa.</p>
          </InfoBox>
        </div>
      </Section>

      <Section title="2. Nature of Cover">
        <p>
          The cover plans offered through Plus1 Rewards are <strong>primary healthcare insurance products</strong>,
          not medical aid. This is an important distinction:
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-[#1a558b] text-white">
                <th className="text-left px-4 py-3 rounded-tl-lg font-semibold">Feature</th>
                <th className="text-left px-4 py-3 font-semibold">Plus1 Cover Plans</th>
                <th className="text-left px-4 py-3 rounded-tr-lg font-semibold">Medical Aid</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Regulated by', 'FSCA (Insurance Act)', 'Council for Medical Schemes'],
                ['Governed by', 'Insurance Act 18 of 2017', 'Medical Schemes Act 131 of 1998'],
                ['Funding model', 'Cashback rewards + top-ups', 'Monthly premiums'],
                ['Cover type', 'Primary healthcare insurance', 'Comprehensive medical aid'],
                ['Waiting periods', 'May apply — see plan terms', 'Regulated waiting periods apply'],
                ['PMB coverage', 'Not applicable', 'Prescribed Minimum Benefits required'],
              ].map(([feature, plus1, medaid], i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3 font-medium text-gray-700 border-b border-gray-100">{feature}</td>
                  <td className="px-4 py-3 text-gray-600 border-b border-gray-100">{plus1}</td>
                  <td className="px-4 py-3 text-gray-600 border-b border-gray-100">{medaid}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="3. Available Cover Plans">
        <p>The following cover plans are available through Plus1 Rewards, subject to availability and eligibility:</p>
        <div className="mt-4 grid sm:grid-cols-3 gap-4">
          {[
            {
              name: 'Day to Day',
              price: 'R385/month',
              desc: 'Covers day-to-day primary healthcare needs including GP visits, basic medication, and preventative care.',
              color: '#37d270',
            },
            {
              name: 'Hospital Value',
              price: 'R390/month',
              desc: 'Covers in-hospital treatment and procedures. Ideal for members who want protection against unexpected hospitalisation.',
              color: '#1a558b',
            },
            {
              name: 'Comprehensive Value Plus',
              price: 'R665/month',
              desc: 'Combines day-to-day and hospital cover for comprehensive primary healthcare protection.',
              color: '#7c3aed',
            },
          ].map((plan) => (
            <div key={plan.name} className="rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3" style={{ backgroundColor: plan.color }}>
                <p className="font-bold text-white text-sm">{plan.name}</p>
                <p className="text-white/80 text-xs font-medium">{plan.price}</p>
              </div>
              <div className="px-4 py-3 bg-white">
                <p className="text-xs text-gray-600 leading-relaxed">{plan.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-gray-500">
          * Plan benefits, exclusions, and waiting periods are detailed in the Day1Health policy schedule
          provided upon plan activation. Plus1 Rewards does not determine or administer plan benefits.
        </p>
      </Section>

      <Section title="4. How Cover is Funded">
        <p>
          Unlike traditional insurance where you pay a fixed monthly premium, Plus1 Rewards cover plans are
          funded through cashback earned at partner stores:
        </p>
        <Ul items={[
          'Every purchase at a partner store earns cashback (3–40% of the purchase amount)',
          'The cashback is automatically allocated to your cover plan',
          'Once your plan reaches 100% of the monthly target, it becomes eligible for activation',
          'Your profile must be complete (valid email, SA ID, address) before a plan can activate',
          'Plans renew every 30 days — you must continue earning cashback to maintain active cover',
          'You can supplement cashback with manual top-ups via EFT or Instant EFT',
        ]} />
      </Section>

      <Section title="5. Cover Limitations and Exclusions">
        <p>
          The following general limitations apply. Refer to your Day1Health policy schedule for the full
          list of exclusions specific to your plan:
        </p>
        <Ul items={[
          'Cover is only active during funded 30-day cycles — lapsed cover means no benefits',
          'Pre-existing conditions may be subject to waiting periods',
          'Cosmetic procedures are generally excluded',
          'Experimental or unproven treatments are excluded',
          'Cover is for the named insured only (dependants require separate plans)',
          'Benefits are subject to the limits specified in your plan schedule',
          'Claims must be submitted in accordance with Day1Health\'s claims procedure',
        ]} />
      </Section>

      <Section title="6. Claims Process">
        <p>
          All claims are handled directly by Day1Health. Plus1 Rewards does not process, approve, or deny
          insurance claims. To submit a claim:
        </p>
        <Ul items={[
          'Contact Day1Health directly using the contact details on your policy schedule',
          'Provide your policy number (available in your Plus1 Rewards member dashboard)',
          'Submit required documentation as specified by Day1Health',
          'Claims are assessed and paid by Day1Health in accordance with your policy terms',
        ]} />
      </Section>

      <Section title="7. Complaints and Disputes">
        <p>
          For complaints about the Plus1 Rewards platform (cashback, transactions, account issues), contact:
        </p>
        <div className="bg-[#f5f8fc] rounded-xl p-5 mb-4">
          <p className="font-semibold text-gray-800">Plus1 Rewards Support</p>
          <p>Email: <a href="mailto:support@plus1rewards.co.za" className="text-[#1a558b] hover:underline">support@plus1rewards.co.za</a></p>
        </div>
        <p>For complaints about your cover plan or claims, contact Day1Health directly.</p>
        <p className="mt-3">
          If your complaint is not resolved, you may escalate to the relevant regulatory body:
        </p>
        <Ul items={[
          'FSCA (Financial Sector Conduct Authority): www.fsca.co.za',
          'Ombudsman for Short-Term Insurance: www.osti.co.za',
          'Financial Services Tribunal: www.fstribunal.co.za',
        ]} />
      </Section>

      <Section title="8. Regulatory Information">
        <div className="grid sm:grid-cols-2 gap-4">
          <InfoBox icon="account_balance" title="FSCA Regulation">
            <p>Day1Health (Pty) Ltd is authorised and regulated by the Financial Sector Conduct Authority (FSCA) as a Financial Services Provider.</p>
          </InfoBox>
          <InfoBox icon="shield" title="Insurance Act">
            <p>Cover plans are governed by the Insurance Act 18 of 2017 and the applicable subordinate legislation.</p>
          </InfoBox>
          <InfoBox icon="policy" title="POPIA">
            <p>Personal information is processed in accordance with the Protection of Personal Information Act 4 of 2013 (POPIA).</p>
          </InfoBox>
          <InfoBox icon="balance" title="Consumer Protection">
            <p>Your rights as a consumer are protected under the Consumer Protection Act 68 of 2008 and applicable financial sector laws.</p>
          </InfoBox>
        </div>
      </Section>
    </LegalLayout>
  )
}
