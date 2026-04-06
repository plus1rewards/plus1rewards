// plus1-rewards/src/pages/AgentSupport.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Notification, useNotification } from '../components/Notification';
import { supabase } from '../lib/supabase';

const BLUE = '#1a558b';

export function AgentSupport() {
  const navigate = useNavigate();
  const [agent, setAgent] = useState<any>(null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [requestType, setRequestType] = useState('general');
  const { notification, showSuccess, showError, hideNotification } = useNotification();

  useEffect(() => {
    const agentDataStr = sessionStorage.getItem('currentAgent') || localStorage.getItem('currentAgent');
    if (!agentDataStr) {
      navigate('/agent/login');
      return;
    }
    setAgent(JSON.parse(agentDataStr));
  }, [navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subject.trim() || !message.trim()) {
      showError('Missing Information', 'Please fill in all fields');
      return;
    }

    // In production, this would send to admin
    showSuccess('Message Sent', 'Your support request has been sent to the admin team. We will respond shortly.');
    
    // Clear form
    setSubject('');
    setMessage('');
    setRequestType('general');
  };

  const handleCallRequest = async () => {
    if (!agent) {
      showError('Error', 'Agent information not found');
      return;
    }

    try {
      // Save call request to disputes table
      const { error } = await supabase
        .from('disputes')
        .insert({
          dispute_type: 'call_request',
          description: `Agent requesting callback - Name: ${agent.name || agent.full_name || 'N/A'}, Mobile: ${agent.mobile_number || 'N/A'}, Email: ${agent.email || 'N/A'}`,
          status: 'open',
          member_id: null, // No member involved in agent call requests
          partner_id: null // No partner involved in agent call requests
        });

      if (error) {
        console.error('Error saving call request:', error);
        showError('Error', 'Failed to submit call request. Please try again.');
        return;
      }

      showSuccess('Call Requested', 'An admin will call you within 24 hours');
    } catch (error) {
      console.error('Error submitting call request:', error);
      showError('Error', 'Failed to submit call request. Please try again.');
    }
  };

  const showInfo = (title: string, message: string) => {
    // Using showSuccess with info styling
    showSuccess(title, message);
  };

  if (!agent) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f5f8fc]">
      {notification && (
        <Notification
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onClose={hideNotification}
        />
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: BLUE }}>
              <span className="material-symbols-outlined text-2xl">support_agent</span>
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900">Support & Contact</h1>
              <p className="text-sm text-gray-600">Get help from the admin team</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/agent/dashboard')}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-semibold"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Back
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={handleCallRequest}
            className="bg-white border border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-md transition-all text-left group"
          >
            <div className="size-12 rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform" style={{ backgroundColor: BLUE }}>
              <span className="material-symbols-outlined text-2xl">call</span>
            </div>
            <h3 className="font-bold text-gray-900 mb-1">Request Call</h3>
            <p className="text-sm text-gray-600">Admin will call you back</p>
          </button>

          <button
            onClick={() => window.open('mailto:plus1rewards@gmail.com', '_blank')}
            className="bg-white border border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-md transition-all text-left group"
          >
            <div className="size-12 rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform" style={{ backgroundColor: BLUE }}>
              <span className="material-symbols-outlined text-2xl">email</span>
            </div>
            <h3 className="font-bold text-gray-900 mb-1">Email Support</h3>
            <p className="text-sm text-gray-600">plus1rewards@gmail.com</p>
          </button>

          <button
            onClick={() => window.open('https://wa.me/0714329190', '_blank')}
            className="bg-white border border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-md transition-all text-left group"
          >
            <div className="size-12 rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform bg-green-600">
              <span className="material-symbols-outlined text-2xl">chat</span>
            </div>
            <h3 className="font-bold text-gray-900 mb-1">WhatsApp</h3>
            <p className="text-sm text-gray-600">Chat with us directly</p>
          </button>
        </div>

        {/* Contact Form */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="material-symbols-outlined" style={{ color: BLUE }}>mail</span>
              Send Message to Admin
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Request Type
              </label>
              <select
                value={requestType}
                onChange={(e) => setRequestType(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="general">General Support</option>
                <option value="partner">Partner Shop Issue</option>
                <option value="commission">Commission Question</option>
                <option value="technical">Technical Problem</option>
                <option value="account">Account Issue</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief description of your issue"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your issue or question in detail..."
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 text-white rounded-lg font-bold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2"
              style={{ backgroundColor: BLUE }}
            >
              <span className="material-symbols-outlined text-lg">send</span>
              Send Message
            </button>
          </form>
        </div>

        {/* Support Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-blue-600 text-2xl">info</span>
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Support Hours</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Monday - Friday: 8:00 AM - 5:00 PM</li>
                <li>• Saturday: 9:00 AM - 1:00 PM</li>
                <li>• Sunday: Closed</li>
                <li>• Response time: Within 24 hours</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Common Issues */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="material-symbols-outlined" style={{ color: BLUE }}>help</span>
              Common Issues
            </h3>
          </div>

          <div className="p-6 space-y-4">
            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <span className="font-semibold text-gray-900">How do I resend login details to a partner?</span>
                <span className="material-symbols-outlined text-gray-400 group-open:rotate-180 transition-transform">expand_more</span>
              </summary>
              <div className="p-4 text-sm text-gray-700">
                Go to "My Partner Shops", find the partner, and click "Resend Login Details" button.
              </div>
            </details>

            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <span className="font-semibold text-gray-900">When do I receive commission payouts?</span>
                <span className="material-symbols-outlined text-gray-400 group-open:rotate-180 transition-transform">expand_more</span>
              </summary>
              <div className="p-4 text-sm text-gray-700">
                Commissions are paid on the 5th of each month if you've reached the R500 minimum threshold.
              </div>
            </details>

            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <span className="font-semibold text-gray-900">How do I add a new partner shop?</span>
                <span className="material-symbols-outlined text-gray-400 group-open:rotate-180 transition-transform">expand_more</span>
              </summary>
              <div className="p-4 text-sm text-gray-700">
                Click "Add New Shop" from your dashboard. Fill in all required details and submit for admin approval.
              </div>
            </details>
          </div>
        </div>
      </main>
    </div>
  );
}
