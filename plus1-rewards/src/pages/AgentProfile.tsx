// plus1-rewards/src/pages/AgentProfile.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Notification, useNotification } from '../components/Notification';

const BLUE = '#1a558b';

export function AgentProfile() {
  const navigate = useNavigate();
  const [agent, setAgent] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [changingPin, setChangingPin] = useState(false);
  const [totalCommission, setTotalCommission] = useState(0);
  const [partnerCount, setPartnerCount] = useState(0);
  
  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [cellPhone, setCellPhone] = useState('');
  
  // PIN change states
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  
  const { notification, showSuccess, showError, hideNotification } = useNotification();

  useEffect(() => {
    loadAgentData();
  }, []);

  const loadAgentData = async () => {
    setLoading(true);
    try {
      const agentDataStr = sessionStorage.getItem('currentAgent') || localStorage.getItem('currentAgent');
      if (!agentDataStr) {
        navigate('/agent/login');
        return;
      }

      const agentData = JSON.parse(agentDataStr);
      setAgent(agentData);
      setUser(agentData); // Agent data is stored directly, no separate users table

      // Set form fields from agent data
      setFirstName(agentData.first_name || '');
      setLastName(agentData.last_name || '');
      setEmail(agentData.email || '');
      setCellPhone(agentData.cell_phone || '');

      // Load commission data from transactions table
      const { data: allTransactions, error: txError } = await supabase
        .from('transactions')
        .select('agent_amount')
        .eq('agent_id', agentData.id)
        .eq('status', 'completed');

      if (txError) {
        console.error('Error fetching transactions:', txError);
      }

      const total = (allTransactions || []).reduce((sum, t) => sum + (parseFloat(t.agent_amount) || 0), 0);
      setTotalCommission(total);

      // Load partner count
      const { data: partnerLinks } = await supabase
        .from('partner_agent_links')
        .select('id')
        .eq('agent_id', agentData.id)
        .eq('status', 'active');

      setPartnerCount(partnerLinks?.length || 0);
    } catch (error) {
      console.error('Error loading agent data:', error);
      showError('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !cellPhone.trim()) {
      showError('Missing Information', 'Please fill in all fields');
      return;
    }

    if (cellPhone.length !== 10) {
      showError('Invalid Phone', 'Phone number must be 10 digits');
      return;
    }

    try {
      const { error } = await supabase
        .from('agents')
        .update({
          first_name: firstName,
          last_name: lastName,
          email: email,
          cell_phone: cellPhone
        })
        .eq('id', agent.id);

      if (error) throw error;

      showSuccess('Profile Updated', 'Your profile has been updated successfully');
      setEditing(false);
      loadAgentData();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      showError('Update Failed', error.message || 'Failed to update profile');
    }
  };

  const handleChangePin = async () => {
    if (!currentPin || !newPin || !confirmPin) {
      showError('Missing Information', 'Please fill in all PIN fields');
      return;
    }

    if (newPin.length !== 6 || !/^\d+$/.test(newPin)) {
      showError('Invalid PIN', 'New PIN must be exactly 6 digits');
      return;
    }

    if (newPin !== confirmPin) {
      showError('PIN Mismatch', 'New PIN and confirmation do not match');
      return;
    }

    if (currentPin !== agent.pin_code) {
      showError('Wrong PIN', 'Current PIN is incorrect');
      return;
    }

    try {
      const { error } = await supabase
        .from('agents')
        .update({ pin_code: newPin })
        .eq('id', agent.id);

      if (error) throw error;

      showSuccess('PIN Changed', 'Your PIN has been changed successfully');
      setChangingPin(false);
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      loadAgentData();
    } catch (error: any) {
      console.error('Error changing PIN:', error);
      showError('Change Failed', error.message || 'Failed to change PIN');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f8fc] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 rounded-full animate-spin mx-auto mb-4" style={{ borderTopColor: BLUE }}></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
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
              <span className="material-symbols-outlined text-2xl">person</span>
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900">My Profile</h1>
              <p className="text-sm text-gray-600">Manage your account details</p>
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
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(26,85,139,0.1)' }}>
                <span className="material-symbols-outlined text-2xl" style={{ color: BLUE }}>payments</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Commission Earned</p>
                <p className="text-2xl font-bold text-gray-900">R{totalCommission.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(26,85,139,0.1)' }}>
                <span className="material-symbols-outlined text-2xl" style={{ color: BLUE }}>store</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Partner Shops</p>
                <p className="text-2xl font-bold text-gray-900">{partnerCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="material-symbols-outlined" style={{ color: BLUE }}>badge</span>
              Profile Information
            </h3>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-4 py-2 text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-all"
                style={{ backgroundColor: BLUE }}
              >
                <span className="material-symbols-outlined text-lg">edit</span>
                Edit
              </button>
            )}
          </div>

          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">First Name</label>
              {editing ? (
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              ) : (
                <p className="text-gray-900 font-semibold">{user?.first_name || '-'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Last Name</label>
              {editing ? (
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              ) : (
                <p className="text-gray-900 font-semibold">{user?.last_name || '-'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
              {editing ? (
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              ) : (
                <p className="text-gray-900 font-semibold">{user?.email || '-'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number</label>
              {editing ? (
                <input
                  type="tel"
                  value={cellPhone}
                  onChange={(e) => setCellPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="0123456789"
                  maxLength={10}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              ) : (
                <p className="text-gray-900 font-semibold">{user?.cell_phone || '-'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">ID Number</label>
              <p className="text-gray-900 font-semibold">{agent?.sa_id || '-'}</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Status</label>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase ${
                agent?.status === 'active'
                  ? 'bg-green-500/20 text-green-600 border border-green-500/30'
                  : agent?.status === 'pending'
                  ? 'bg-orange-500/20 text-orange-600 border border-orange-500/30'
                  : 'bg-red-500/20 text-red-600 border border-red-500/30'
              }`}>
                <span className={`size-2 rounded-full ${
                  agent?.status === 'active' ? 'bg-green-600' : agent?.status === 'pending' ? 'bg-orange-600' : 'bg-red-600'
                }`}></span>
                {agent?.status || 'unknown'}
              </span>
            </div>

            {editing && (
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSaveProfile}
                  className="flex-1 py-3 text-white rounded-lg font-bold text-sm hover:opacity-90 transition-all"
                  style={{ backgroundColor: BLUE }}
                >
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setFirstName(user?.first_name || '');
                    setLastName(user?.last_name || '');
                    setEmail(user?.email || '');
                    setCellPhone(user?.cell_phone || '');
                  }}
                  className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg font-bold text-sm hover:bg-gray-300 transition-all"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Change PIN Card */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="material-symbols-outlined" style={{ color: BLUE }}>lock</span>
              Security
            </h3>
            {!changingPin && (
              <button
                onClick={() => setChangingPin(true)}
                className="flex items-center gap-2 px-4 py-2 text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-all"
                style={{ backgroundColor: BLUE }}
              >
                <span className="material-symbols-outlined text-lg">key</span>
                Change PIN
              </button>
            )}
          </div>

          {changingPin ? (
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Current PIN</label>
                <input
                  type="password"
                  value={currentPin}
                  onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="••••••"
                  maxLength={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">New PIN (6 digits)</label>
                <input
                  type="password"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="••••••"
                  maxLength={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Confirm New PIN</label>
                <input
                  type="password"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="••••••"
                  maxLength={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleChangePin}
                  className="flex-1 py-3 text-white rounded-lg font-bold text-sm hover:opacity-90 transition-all"
                  style={{ backgroundColor: BLUE }}
                >
                  Change PIN
                </button>
                <button
                  onClick={() => {
                    setChangingPin(false);
                    setCurrentPin('');
                    setNewPin('');
                    setConfirmPin('');
                  }}
                  className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg font-bold text-sm hover:bg-gray-300 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6">
              <p className="text-sm text-gray-600">Your 6-digit PIN is used to log in to your account. Keep it secure and don't share it with anyone.</p>
            </div>
          )}
        </div>

        {/* Agreement Document */}
        {agent?.agreement_file && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="material-symbols-outlined" style={{ color: BLUE }}>description</span>
                Agreement Document
              </h3>
            </div>
            <div className="p-6">
              <a
                href={agent.agreement_file}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="material-symbols-outlined text-3xl text-red-600">picture_as_pdf</span>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Signed Agent Agreement</p>
                  <p className="text-sm text-gray-600">Click to view document</p>
                </div>
                <span className="material-symbols-outlined text-gray-400">open_in_new</span>
              </a>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
