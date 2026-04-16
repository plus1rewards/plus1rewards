import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getSession, clearSession } from '../lib/session';
import MemberLayout from '../components/member/MemberLayout';

interface Member {
  id: string;
  name: string;
  phone: string;
  email?: string;
  qr_code: string;
  cover_plan_id?: string;
}

interface LinkedPerson {
  id: string;
  full_name: string;
  id_number: string;
  dependant_type: string;
  created_at: string;
}

export default function MemberLinkedPeople() {
  const navigate = useNavigate();
  const [member, setMember] = useState<Member | null>(null);
  const [linkedPeople, setLinkedPeople] = useState<LinkedPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    idNumber: '',
    relationship: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const session = getSession();
      if (!session || !session.member) {
        navigate('/member/login');
        return;
      }

      const memberData = session.member;

      // Get member's cover plan (get the first active or in_progress one)
      const { data: coverPlanData, error: coverPlanError } = await supabase
        .from('member_cover_plans')
        .select('id')
        .eq('member_id', memberData.id)
        .in('status', ['active', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (coverPlanError) {
        console.error('Error loading cover plan:', coverPlanError);
      }

      setMember({
        id: memberData.id,
        name: memberData.name || `${memberData.first_name} ${memberData.last_name}`.trim(),
        phone: memberData.phone || memberData.cell_phone,
        email: memberData.email,
        qr_code: memberData.qr_code,
        cover_plan_id: coverPlanData?.id
      });

      // Load dependants using member.id
      const { data: linkedData } = await supabase
        .from('dependants')
        .select('*')
        .eq('linked_to_main_member_id', memberData.id)
        .order('created_at', { ascending: false });

      if (linkedData) setLinkedPeople(linkedData as LinkedPerson[]);
    } catch (error) {
      console.error('Error loading dependants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    clearSession();
    navigate('/member/login');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!member || !member.cover_plan_id) {
      alert('Error: No active cover plan found. Please activate a cover plan first.');
      return;
    }

    try {
      const { error } = await supabase
        .from('dependants')
        .insert({
          linked_to_main_member_id: member.id,
          member_cover_plan_id: member.cover_plan_id,
          first_name: formData.fullName.split(' ')[0],
          last_name: formData.fullName.split(' ').slice(1).join(' ') || '',
          id_number: formData.idNumber,
          linked_type: formData.relationship,
          status: 'pending'
        });

      if (error) throw error;

      alert('Dependant request submitted! Admin will contact you for telephonic approval.');
      setShowAddForm(false);
      setFormData({ fullName: '', idNumber: '', relationship: '', notes: '' });
      loadData();
    } catch (error: any) {
      alert('Error submitting request: ' + error.message);
    }
  };

  if (loading) {
    return (
      <MemberLayout
        member={member}
        isOnline={navigator.onLine}
        pendingTransactions={0}
        onSignOut={handleSignOut}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#1a558b]/20 border-t-[#1a558b] rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </MemberLayout>
    );
  }

  return (
    <MemberLayout
      member={member}
      isOnline={navigator.onLine}
      pendingTransactions={0}
      onSignOut={handleSignOut}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">dependants</h1>
          <p className="text-gray-600">Manage dependants and linked cover requests</p>
        </div>
        <button
          onClick={() => navigate('/member/dashboard')}
          className="bg-[#1a558b] hover:bg-[#1a558b]/90 text-white font-bold px-4 py-2 rounded-xl transition-colors"
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* Add Button */}
      <div className="mb-6">
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-xl transition-colors inline-flex items-center gap-2"
        >
          <span className="material-symbols-outlined">group_add</span>
          Add Dependant
        </button>
      </div>

      {/* dependants List */}
      {linkedPeople.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
          <span className="material-symbols-outlined text-gray-400 text-6xl mb-4 block">group</span>
          <h3 className="text-gray-900 font-bold text-lg mb-2">No dependants Yet</h3>
          <p className="text-gray-600 mb-6">Add dependants or family members to your cover plan</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-xl transition-colors"
          >
            Add Dependant
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {linkedPeople.map((person) => (
            <div key={person.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#1a558b]/10 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#1a558b] text-xl">person</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{`${person.first_name} ${person.last_name}`.trim()}</h3>
                    <p className="text-sm text-gray-600">Relationship: {person.dependant_type}</p>
                    <p className="text-sm text-gray-600">ID: {person.id_number}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Add Dependant</h3>
            <p className="text-sm text-gray-600 mb-6">
              Note: Admin will contact you for telephonic approval before finalizing this request.
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a558b]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">ID Number</label>
                <input
                  type="text"
                  value={formData.idNumber}
                  onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a558b]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Relationship</label>
                <select
                  value={formData.relationship}
                  onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a558b]"
                  required
                >
                  <option value="">Select relationship</option>
                  <option value="spouse">Spouse</option>
                  <option value="child">Child</option>
                  <option value="parent">Parent</option>
                  <option value="sibling">Sibling</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Notes (Optional)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a558b]"
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 px-4 py-3 rounded-xl font-bold border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 rounded-xl font-bold bg-green-600 hover:bg-green-700 text-white transition-colors"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MemberLayout>
  );
}
