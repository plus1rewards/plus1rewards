import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { getSession, clearSession } from '../lib/session';
import MemberLayout from '../components/member/MemberLayout';

interface PolicyPlan {
  id: string; name: string; family: string; variant: string;
  adults: number; children: number; monthly_target: number; is_active: boolean;
}
interface Member { id: string; name: string; phone: string; qr_code: string; active_policy: string | null }

const BLUE = '#1a558b';

const FALLBACK_PLANS = [
  { id: 'p1', name: 'Day-to-Day Single', family: 'Single', variant: 'Day-to-Day', adults: 1, children: 0, monthly_target: 385, is_active: true },
  { id: 'p2', name: 'Hospital Single', family: 'Single', variant: 'Hospital', adults: 1, children: 0, monthly_target: 390, is_active: true },
  { id: 'p3', name: 'Comprehensive - Value Plus Single', family: 'Single', variant: 'Comprehensive - Value Plus', adults: 1, children: 0, monthly_target: 665, is_active: true },
  { id: 'p4', name: 'Day-to-Day Family', family: 'Family', variant: 'Day-to-Day', adults: 2, children: 2, monthly_target: 720, is_active: true },
];

export function MemberPolicySelector() {
  const navigate = useNavigate();
  const [member, setMember] = useState<Member | null>(null);
  const [plans, setPlans] = useState<PolicyPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<PolicyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const session = getSession();
      if (!session) { navigate("/member/login"); return; }
      const { data: memberDetails } = await supabase.from("members").select("*").eq("id", session.user.id).single();
      if (memberDetails) setMember(memberDetails);
      const { data: plansData } = await supabase.from("policy_plans").select("*").eq("is_active", true).order("family");
      const usePlans = (plansData && plansData.length > 0) ? plansData : FALLBACK_PLANS;
      setPlans(usePlans);
      setSelectedPlan(usePlans[0]);
    } catch { setPlans(FALLBACK_PLANS); setSelectedPlan(FALLBACK_PLANS[0]); }
    finally { setLoading(false); }
  };

  const handleSetActivePolicy = async () => {
    if (!member || !selectedPlan) return;
    setSaving(true); setError(""); setSuccess("");
    try {
      // Update member's active_policy
      await supabase.from("members").update({ active_policy: selectedPlan.id }).eq("id", member.id);
      
      // Update wallets policies JSONB (legacy)
      await supabase.from("wallets").update({ 
        policies: { 
          name: selectedPlan.name, 
          current: 0, 
          target: selectedPlan.monthly_target, 
          status: "active" 
        } 
      }).eq("member_id", member.id);

      // Check if policy_holder already exists for this member
      const { data: existingHolder } = await supabase
        .from("policy_holders")
        .select("id")
        .eq("member_id", member.id)
        .single();

      if (existingHolder) {
        // Update existing policy holder
        await supabase
          .from("policy_holders")
          .update({
            policy_plan_id: selectedPlan.id,
            monthly_premium: selectedPlan.monthly_target,
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq("id", existingHolder.id);
      } else {
        // Create new policy holder record
        await supabase.from("policy_holders").insert({
          member_id: member.id,
          policy_plan_id: selectedPlan.id,
          policy_provider_id: '00000000-0000-0000-0000-000000000001', // Day1Health static ID
          policy_number: `POL-${member.phone}-${Date.now()}`,
          status: 'active',
          start_date: new Date().toISOString().split('T')[0],
          monthly_premium: selectedPlan.monthly_target,
          amount_funded: 0
        });
      }

      setSuccess(`✓ Policy set to ${selectedPlan.name}`);
      setTimeout(() => navigate("/member/dashboard"), 1500);
    } catch (err) { 
      console.error('Policy selection error:', err);
      setError(err instanceof Error ? err.message : "Failed to set policy"); 
    }
    finally { setSaving(false); }
  };

  const familyGroups = plans.reduce((acc, p) => { (acc[p.family] = acc[p.family] || []).push(p); return acc; }, {} as Record<string, PolicyPlan[]>);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f8fc' }}>
        <div className="text-center">
          <div className="w-10 h-10 border-4 rounded-full animate-spin mx-auto mb-4" style={{ borderColor: 'rgba(26, 85, 139, 0.2)', borderTopColor: BLUE }} />
          <p style={{ color: '#6b7280' }}>Loading plans...</p>
        </div>
      </div>
    );
  }

  return (
    <MemberLayout 
      member={member}
      isOnline={true}
      pendingTransactions={0}
      onSignOut={() => { clearSession(); navigate('/member/login'); }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#111827' }}>Choose Your Health Plan</h1>
          <p style={{ color: '#6b7280' }}>Day1 Health — powered by your rewards</p>
        </div>
        <button 
          onClick={() => navigate("/member/dashboard")} 
          className="font-bold px-4 py-2 rounded-xl transition-colors text-white hover:opacity-90"
          style={{ backgroundColor: BLUE }}
        >
          ← Back to Dashboard
        </button>
      </div>

      {error && (
        <div className="rounded-lg p-4 mb-6" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#dc2626' }}>
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg p-4 mb-6" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#059669' }}>
          {success}
        </div>
      )}

      {/* Info banner */}
      <div className="rounded-2xl p-6 mb-6" style={{ backgroundColor: 'rgba(26, 85, 139, 0.05)', border: '1px solid rgba(26, 85, 139, 0.2)' }}>
        <div className="flex gap-4 items-center">
          <div className="text-4xl">🏥</div>
          <div>
            <h2 className="text-lg font-bold mb-1" style={{ color: BLUE }}>Day1 Health Plans</h2>
            <p className="text-sm" style={{ color: '#6b7280' }}>Your rewards from partner shops automatically fund the plan you choose below. Once your monthly target is reached, your policy activates.</p>
          </div>
        </div>
      </div>

      {/* Plan groups */}
      {Object.entries(familyGroups).map(([family, familyPlans]) => (
        <div key={family} className="rounded-2xl p-6 mb-6" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}>
          <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: '#6b7280' }}>
            {family} Plans
          </h3>
          <div className="flex flex-col gap-3">
            {familyPlans.map(plan => {
              const isSelected = selectedPlan?.id === plan.id;
              const isActive = member?.active_policy === plan.id;
              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan)}
                  className="p-4 rounded-xl cursor-pointer transition-all flex justify-between items-center gap-4"
                  style={{
                    border: isSelected ? `2px solid ${BLUE}` : '1px solid #e5e7eb',
                    backgroundColor: isSelected ? 'rgba(26, 85, 139, 0.05)' : '#ffffff',
                  }}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold" style={{ color: '#111827' }}>{plan.name}</p>
                      {isActive && (
                        <span className="px-2 py-1 rounded-lg text-xs font-bold" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                          Your Plan
                        </span>
                      )}
                    </div>
                    <p className="text-sm" style={{ color: '#6b7280' }}>
                      {plan.adults} adult{plan.adults > 1 ? 's' : ''}{plan.children > 0 ? ` · ${plan.children} children` : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black" style={{ color: isSelected ? BLUE : '#374151' }}>
                      R{plan.monthly_target}
                    </p>
                    <p className="text-xs" style={{ color: '#9ca3af' }}>/ month target</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* CTA */}
      {selectedPlan && (
        <div className="rounded-2xl p-6" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
          <h3 className="text-sm font-semibold mb-2" style={{ color: '#6b7280' }}>Selected Plan</h3>
          <p className="text-xl font-black mb-1" style={{ color: '#059669' }}>{selectedPlan.name}</p>
          <p className="text-sm mb-4" style={{ color: '#059669' }}>Monthly reward target: <strong>R{selectedPlan.monthly_target}</strong></p>
          <button 
            onClick={handleSetActivePolicy} 
            disabled={saving} 
            className="w-full py-4 rounded-xl font-bold text-lg transition-colors disabled:opacity-50 text-white hover:opacity-90"
            style={{ backgroundColor: '#10b981' }}
          >
            {saving ? '⏳ Saving...' : `✓ Activate ${selectedPlan.name}`}
          </button>
        </div>
      )}
    </MemberLayout>
  );
}
