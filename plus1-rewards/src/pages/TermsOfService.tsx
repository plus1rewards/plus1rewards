import { useNavigate } from 'react-router-dom';

export default function TermsOfService() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Back
        </button>

        <div className="bg-white rounded-2xl shadow-sm p-8">
          <h1 className="text-3xl font-black text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-sm text-gray-500 mb-8">Last updated: March 22, 2026</p>

          <div className="space-y-6 text-gray-700">
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">1. Acceptance of Terms</h2>
              <p>
                By registering for and using Plus1 Rewards ("the Service"), you agree to be bound by these Terms of Service. 
                If you do not agree to these terms, please do not use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">2. Service Description</h2>
              <p>
                Plus1 Rewards is a cashback-to-healthcare platform that allows members to earn rewards on purchases at 
                partner stores. These rewards are automatically allocated toward medical cover plans provided by approved 
                healthcare providers.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">3. Membership Eligibility</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>You must be at least 18 years old to register</li>
                <li>You must provide accurate and complete registration information</li>
                <li>You must have a valid South African mobile number</li>
                <li>One account per mobile number</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">4. Cashback and Rewards</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Cashback rates range from 3% to 40% depending on the partner store</li>
                <li>Cashback is split: 1% to system, 1% to agent, remainder to member</li>
                <li>Rewards are automatically allocated to your active cover plan</li>
                <li>Rewards cannot be withdrawn as cash</li>
                <li>Rewards are non-transferable between members</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">5. Cover Plans</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Cover plans are funded through cashback rewards and optional top-ups</li>
                <li>Plans become Active when the monthly target amount is reached</li>
                <li>Plans must maintain the target amount every 30 days to remain Active</li>
                <li>Plans become Paused if funding falls below the target amount</li>
                <li>Multiple cover plans are funded in creation order</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">6. Account Security</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>You are responsible for maintaining the confidentiality of your PIN</li>
                <li>You must notify us immediately of any unauthorized use of your account</li>
                <li>We are not liable for losses resulting from unauthorized account access</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">7. Prohibited Activities</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Fraudulent transactions or false claims</li>
                <li>Sharing or selling your account credentials</li>
                <li>Attempting to manipulate or abuse the rewards system</li>
                <li>Using the Service for any illegal purpose</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">8. Account Suspension and Termination</h2>
              <p>
                We reserve the right to suspend or terminate your account at any time for violation of these terms, 
                fraudulent activity, or any other reason we deem necessary to protect the integrity of the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">9. Limitation of Liability</h2>
              <p>
                Plus1 Rewards acts as a platform connecting members, partners, and healthcare providers. We are not 
                responsible for the quality of goods purchased from partners or the healthcare services provided by 
                medical providers.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">10. Changes to Terms</h2>
              <p>
                We reserve the right to modify these Terms of Service at any time. Changes will be effective immediately 
                upon posting. Your continued use of the Service constitutes acceptance of the modified terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">11. Contact Information</h2>
              <p>
                For questions about these Terms of Service, please contact us at:
                <br />
                Email: support@plus1rewards.co.za
                <br />
                Phone: 0800 PLUS1 (75871)
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
