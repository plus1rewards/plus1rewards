import { useNavigate } from 'react-router-dom';
import MemberLayout from '../components/member/MemberLayout';
import { getSession, clearSession } from '../lib/session';

const PLANS = [
  {
    id: 'day-to-day',
    name: 'Day to Day Single',
    price: 385,
    color: '#37d270',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-300',
    badgeColor: 'bg-green-100 text-green-700',
    icon: 'local_hospital',
    tag: 'Entry Level',
    description: 'Everyday healthcare cover for routine medical needs.',
    benefits: [
      { icon: 'medication', text: 'GP Visits - Unlimited visits per year' },
      { icon: 'science', text: 'Basic Pathology & Radiology' },
      { icon: 'vaccines', text: 'Acute Medication - According to formulary' },
      { icon: 'healing', text: 'Minor Procedures at GP level' },
      { icon: 'emergency', text: '24 Hour Emergency Ambulance' },
      { icon: 'family_restroom', text: 'Family Funeral Benefit - Up to R10,000' },
    ],
  },
  {
    id: 'hospital',
    name: 'Hospital - Value - Single',
    price: 390,
    color: '#1a568b',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
    badgeColor: 'bg-blue-100 text-blue-700',
    icon: 'local_hospital',
    tag: 'Popular',
    description: 'Hospital cover for when you need in-patient care.',
    benefits: [
      { icon: 'bed', text: 'Private Hospital Benefits - Up to R57,000 for 21 days' },
      { icon: 'personal_injury', text: 'Accident/Trauma Benefit - Up to R150,000 per member' },
      { icon: 'emergency', text: '24 Hour Emergency Ambulance - Immediate cover' },
      { icon: 'vaccines', text: 'Acute Medication - According to formulary' },
      { icon: 'child_care', text: 'Maternity Benefit - Up to R20,000 (12 month waiting period)' },
      { icon: 'family_restroom', text: 'Family Funeral Benefit - Up to R20,000 principal member' },
    ],
  },
  {
    id: 'comprehensive',
    name: 'Comprehensive - Value Plus - Single',
    price: 665,
    color: '#7c3aed',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-300',
    badgeColor: 'bg-purple-100 text-purple-700',
    icon: 'verified',
    tag: 'Full Cover',
    description: 'Complete healthcare cover — the best of everything.',
    benefits: [
      { icon: 'stethoscope', text: 'Private Managed Doctor Visits - 5 visits per annum' },
      { icon: 'medication', text: 'Acute/Chronic Medication - According to Day1 Health formulary' },
      { icon: 'visibility', text: 'Dentistry / Optometry - Basic treatment & eye tests' },
      { icon: 'bed', text: 'Private Hospital Benefits - Up to R57,000 for 21 days' },
      { icon: 'personal_injury', text: 'Accident/Trauma Benefit - Up to R150,000 per member' },
      { icon: 'emergency', text: '24 Hour Emergency Ambulance - Immediate cover' },
      { icon: 'child_care', text: 'Maternity Benefit - Up to R20,000 (12 month waiting period)' },
      { icon: 'family_restroom', text: 'Family Funeral Benefit - Up to R20,000 principal member' },
    ],
  },
];

export default function MemberViewPlans() {
  const navigate = useNavigate();
  const session = getSession();
  const member = session?.member
    ? { id: session.member.id, name: `${session.member.first_name} ${session.member.last_name}`, phone: session.member.cell_phone, email: session.member.email, qr_code: session.member.qr_code }
    : null;

  const handleSignOut = () => { clearSession(); navigate('/member/login'); };

  return (
    <MemberLayout member={member} isOnline={navigator.onLine} pendingTransactions={0} onSignOut={handleSignOut}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Day1Health Plans</h1>
          <p className="text-gray-500 text-sm mt-1">All available medical cover plans</p>
        </div>
        <button
          onClick={() => navigate('/member/dashboard')}
          className="flex items-center gap-2 bg-[#1a568b] text-white font-bold px-4 py-2 rounded-xl text-sm hover:bg-[#1a568b]/90 transition-colors"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Back
        </button>
      </div>

      {/* Brochure Download */}
      <a
        href="/Comprehensive Value Plus Plan.pdf"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 bg-[#1a568b] text-white rounded-xl px-5 py-4 mb-6 hover:bg-[#1a568b]/90 transition-colors"
      >
        <span className="material-symbols-outlined text-2xl">description</span>
        <div>
          <p className="font-bold text-sm">View Full Brochure</p>
          <p className="text-xs text-blue-200">Comprehensive Value Plus Plan PDF</p>
        </div>
        <span className="material-symbols-outlined ml-auto">open_in_new</span>
      </a>

      {/* Plans */}
      <div className="space-y-5">
        {PLANS.map((plan) => (
          <div key={plan.id} className={`bg-white border-2 ${plan.borderColor} rounded-2xl overflow-hidden shadow-sm`}>
            {/* Plan Header */}
            <div className={`${plan.bgColor} px-5 py-4 flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: plan.color }}>
                  <span className="material-symbols-outlined text-white text-xl">{plan.icon}</span>
                </div>
                <div>
                  <h2 className="font-bold text-gray-900 text-base">{plan.name}</h2>
                  <p className="text-gray-500 text-xs">{plan.description}</p>
                </div>
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${plan.badgeColor}`}>{plan.tag}</span>
            </div>

            {/* Price */}
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <span className="text-gray-500 text-sm">Monthly Target</span>
              <span className="font-bold text-xl" style={{ color: plan.color }}>R{plan.price.toFixed(2)}</span>
            </div>

            {/* Benefits */}
            <div className="px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">What's Included</p>
              <ul className="space-y-2">
                {plan.benefits.map((benefit, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-base mt-0.5" style={{ color: plan.color }}>{benefit.icon}</span>
                    <span className="text-sm text-gray-700">{benefit.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <p className="text-center text-xs text-gray-400 mt-6 pb-4">
        Plans are funded through your cashback earnings at partner stores. Contact support to change your plan.
      </p>
    </MemberLayout>
  );
}
