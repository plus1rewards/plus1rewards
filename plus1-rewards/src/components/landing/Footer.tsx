// plus1-rewards/src/components/landing/Footer.tsx
const BLUE = '#1a558b'

export default function Footer() {
  return (
    <footer className="border-t py-16 px-6 lg:px-20" style={{ backgroundColor: '#fff', borderColor: '#e5e7eb' }}>
      <div className="max-w-[1800px] mx-auto">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="col-span-2">
            <div className="flex items-center gap-4 mb-5">
              <a href="/" className="cursor-pointer">
                <img 
                  src="/logo.png" 
                  alt="+1 Rewards" 
                  className="w-auto object-contain hover:opacity-80 transition-opacity"
                  style={{ height: '74px' }}
                  width="509"
                  height="197"
                />
              </a>
            </div>
            <p className="text-gray-500 max-w-sm mb-6 text-sm leading-relaxed">
              Medi Cover for All. Because your shopping should work as hard as you do.
            </p>
            <div className="flex gap-3">
              <a
                className="size-10 rounded-full border flex items-center justify-center text-gray-500 transition-all hover:border-blue-700"
                style={{ borderColor: '#e5e7eb' }}
                href="#"
                aria-label="Social"
                onMouseEnter={e => (e.currentTarget.style.color = BLUE)}
                onMouseLeave={e => (e.currentTarget.style.color = '')}
              >
                <span className="material-symbols-outlined text-lg">social_leaderboard</span>
              </a>
              <a
                className="size-10 rounded-full border flex items-center justify-center text-gray-500 transition-all hover:border-blue-700"
                style={{ borderColor: '#e5e7eb' }}
                href="#"
                aria-label="Share"
                onMouseEnter={e => (e.currentTarget.style.color = BLUE)}
                onMouseLeave={e => (e.currentTarget.style.color = '')}
              >
                <span className="material-symbols-outlined text-lg">share</span>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-gray-900 font-bold mb-5">Quick Links</h4>
            <ul className="space-y-3 text-sm text-gray-500">
              <li><a className="hover:text-blue-800 transition-colors" href="#how-it-works">How it Works</a></li>
              <li><a className="hover:text-blue-800 transition-colors" href="#roles">Partner Stores</a></li>
              <li><a className="hover:text-blue-800 transition-colors" href="/agent/register">Become an Agent</a></li>
              <li><a className="hover:text-blue-800 transition-colors" href="#faq">Day1Health Details</a></li>
              <li><a className="hover:text-blue-800 transition-colors" href="#">Contact Us</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-gray-900 font-bold mb-5">Legal</h4>
            <ul className="space-y-3 text-sm text-gray-500">
              <li><a className="hover:text-blue-800 transition-colors" href="/legal/popia">Privacy Policy</a></li>
              <li><a className="hover:text-blue-800 transition-colors" href="/legal/member-terms">Terms of Service</a></li>
              <li><a className="hover:text-blue-800 transition-colors" href="#">Insurance Disclosure</a></li>
              <li><a className="hover:text-blue-800 transition-colors" href="#faq">FAQ</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t pt-8 flex flex-col md:flex-row items-center justify-between gap-6" style={{ borderColor: '#e5e7eb' }}>
          <p className="text-xs text-gray-400 text-center md:text-left select-text">&copy; {new Date().getFullYear()} +1 Rewards (Pty) Ltd. All rights reserved. &middot; Healthcare policies underwritten by Day1Health (Pty) Ltd — Authorised Financial Services Provider, FSP Licensed, Regulated by the FSCA. &middot; +1 Rewards is not a medical aid scheme.</p>
          <a 
            href="/agent/login"
            className="text-xs text-blue-600 hover:text-blue-800 transition-colors font-semibold whitespace-nowrap"
          >
            Agent Login →
          </a>
        </div>
      </div>
    </footer>
  )
}