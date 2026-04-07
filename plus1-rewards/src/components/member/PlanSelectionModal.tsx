import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Notification, useNotification } from '../Notification';

interface Plan {
  id: string;
  name: string;
  price: number;
  type: 'day-to-day' | 'hospital';
  benefits: string[];
  icon: string;
  description: string;
}

interface PlanSelectionModalProps {
  memberId: string;
  onPlanSelected: () => void;
}

const PLANS: Plan[] = [
  {
    id: 'day-to-day-single',
    name: 'Day-to-Day',
    price: 385,
    type: 'day-to-day',
    icon: '🏥',
    description: 'Daily healthcare & wellness coverage',
    benefits: [
      'Private Managed Doctor Visits - 5 visits per annum',
      'Pathology - Basic diagnostic blood tests',
      'Specialist Benefit - Up to R1,000 per family per annum',
      'Basic Dentistry - 2 visits per annum',
      'Acute Medication - According to 1Doctor formulary',
      'Optometry - One eye test & glasses every 24 months',
      'Chronic Medication - Pre-existing conditions covered',
      'Out-of-Area Visits - 3 visits per family per annum',
      'Radiology - Basic diagnostic x-rays',
      'Family Funeral Benefit - Up to R10,000'
    ]
  },
  {
    id: 'hospital-single',
    name: 'Hospital Plus',
    price: 390,
    type: 'hospital',
    icon: '🚑',
    description: 'Hospital & emergency coverage',
    benefits: [
      'In-Hospital Illness - Up to R10,000 per day (max 21 days)',
      'First Day in Hospital - Up to R10,000',
      'Second Day in Hospital - Up to R10,000',
      'Third Day in Hospital - Up to R10,000',
      'Subsequent Days - R1,500 per day',
      'Maximum Benefit - Up to R57,000 for 21-day period',
      'Accident/Trauma Benefit - Up to R150,000 per incident',
      '24-Hour Emergency Services - Ambulance & pre-authorisation',
      'Maternity Benefit - Up to R20,000 for hospital birth',
      'Family Funeral Benefit - Up to R20,000'
    ]
  }
];

export default function PlanSelectionModal({
  memberId,
  onPlanSelected
}: PlanSelectionModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(PLANS[0]);
  const [expandedBenefits, setExpandedBenefits] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [planChangesCount, setPlanChangesCount] = useState(0);
  const [canChangePlan, setCanChangePlan] = useState(true);
  const { notification, showSuccess, hideNotification } = useNotification();

  // Load plan changes count on mount
  const loadPlanChangesCount = async () => {
    try {
      const { data: existingPlan } = await supabase
        .from('member_cover_plans')
        .select('plan_changes_count')
        .eq('member_id', memberId)
        .eq('creation_order', 1)
        .single();

      if (existingPlan) {
        setPlanChangesCount(existingPlan.plan_changes_count || 0);
        setCanChangePlan((existingPlan.plan_changes_count || 0) < 1);
      }
    } catch (err) {
      console.error('Error loading plan changes count:', err);
    }
  };

  // Load on component mount
  React.useEffect(() => {
    loadPlanChangesCount();
  }, [memberId]);

  const handleSelectPlan = async () => {
    if (!selectedPlan) return;

    setLoading(true);
    setError('');

    try {
      console.log('Starting plan selection for:', selectedPlan.id);

      // First, get the actual cover_plan UUID from the database
      const { data: coverPlanData, error: coverPlanLookupError } = await supabase
        .from('cover_plans')
        .select('id')
        .eq('monthly_target_amount', selectedPlan.price)
        .eq('status', 'active')
        .limit(1)
        .single();

      if (coverPlanLookupError || !coverPlanData) {
        console.error('Error finding cover plan:', coverPlanLookupError);
        throw new Error(`Could not find cover plan for R${selectedPlan.price}`);
      }

      console.log('Found cover plan UUID:', coverPlanData.id);

      // Check if member already has a cover plan
      const { data: existingPlan } = await supabase
        .from('member_cover_plans')
        .select('id, plan_changes_count')
        .eq('member_id', memberId)
        .eq('creation_order', 1)
        .single();

      // Check if user has already changed their plan once
      if (existingPlan && existingPlan.plan_changes_count >= 1) {
        setError('You can only change your plan once. Please contact support if you need further assistance.');
        setLoading(false);
        return;
      }

      if (existingPlan) {
        // Get current plan data to preserve funded_amount and overflow_balance
        const { data: currentPlanData } = await supabase
          .from('member_cover_plans')
          .select('funded_amount, overflow_balance')
          .eq('id', existingPlan.id)
          .single();

        // Update existing plan while preserving user's earned money
        console.log('Updating existing member cover plan');
        const { error: updateError } = await supabase
          .from('member_cover_plans')
          .update({
            cover_plan_id: coverPlanData.id,
            target_amount: selectedPlan.price,
            funded_amount: currentPlanData?.funded_amount || 0,
            overflow_balance: currentPlanData?.overflow_balance || 0,
            status: 'in_progress',
            plan_changes_count: (existingPlan.plan_changes_count || 0) + 1
          })
          .eq('id', existingPlan.id);

        if (updateError) {
          console.error('Error updating member cover plan:', updateError);
          throw updateError;
        }
        console.log('Member cover plan updated successfully!');
      } else {
        // Create new plan
        console.log('Creating new member cover plan');
        const { error: coverPlanError } = await supabase
          .from('member_cover_plans')
          .insert({
            member_id: memberId,
            cover_plan_id: coverPlanData.id,
            creation_order: 1,
            target_amount: selectedPlan.price,
            funded_amount: 0,
            overflow_balance: 0,
            status: 'in_progress',
            plan_changes_count: 1
          });

        if (coverPlanError) {
          console.error('Error creating member cover plan:', coverPlanError);
          throw coverPlanError;
        }
        console.log('Member cover plan created successfully!');
      }

      console.log('Plan selection successful, showing notification');
      
      // Update local state to disable button
      setCanChangePlan(false);
      setPlanChangesCount(1);
      
      // Show success notification
      showSuccess(
        'Plan Changed Successfully!',
        `You've switched to ${selectedPlan.name}. Your earned rewards have been preserved!`,
        5000
      );

      setLoading(false);
      
      // Close modal after notification is shown (5 seconds)
      setTimeout(() => {
        onPlanSelected();
      }, 5000);
    } catch (err) {
      console.error('Error selecting plan:', err);
      setError(err instanceof Error ? err.message : 'Failed to select plan');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[95vh] overflow-hidden shadow-2xl">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-[#1a558b] via-[#2a6a9b] to-[#1a558b] px-8 py-12 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16"></div>
          
          <div className="relative z-10">
            <h1 className="text-4xl font-black mb-2">Welcome to Plus1 Health</h1>
            <p className="text-lg text-blue-100">Read and compare the 2 default plans then choose your perfect cover.</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[calc(95vh-200px)]">
          {error && (
            <div className="rounded-xl p-4 mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-bold">Something went wrong</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Info Banner */}
          <div className="rounded-2xl p-6 mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
            <div className="flex items-start gap-4">
              <span className="text-4xl">💡</span>
              <div>
                <p className="font-bold text-gray-900 mb-1">How it works</p>
                <p className="text-gray-700 text-sm">
                  Your rewards from partner shops automatically fund your chosen plan. Once your monthly target is reached, your policy activates and you can start using your benefits.
                </p>
              </div>
            </div>
          </div>

          {/* Plans Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {PLANS.map((plan) => {
              const isSelected = selectedPlan?.id === plan.id;
              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan)}
                  className={`rounded-2xl cursor-pointer transition-all duration-300 overflow-hidden border-2 ${
                    isSelected
                      ? 'border-[#1a558b] shadow-2xl scale-105'
                      : 'border-gray-200 shadow-lg hover:shadow-xl hover:border-[#1a558b]/50'
                  }`}
                >
                  {/* Plan Card Header */}
                  <div className={`p-6 ${isSelected ? 'bg-gradient-to-r from-[#1a558b] to-[#2a6a9b]' : 'bg-gradient-to-r from-gray-50 to-gray-100'}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="text-5xl mb-3">{plan.icon}</div>
                        <h3 className={`text-2xl font-black ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                          {plan.name}
                        </h3>
                        <p className={`text-sm mt-2 ${isSelected ? 'text-blue-100' : 'text-gray-600'}`}>
                          {plan.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Price Section */}
                  <div className={`px-6 py-4 border-t-2 ${isSelected ? 'border-blue-200 bg-blue-50' : 'border-gray-100 bg-white'}`}>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-4xl font-black ${isSelected ? 'text-[#1a558b]' : 'text-gray-900'}`}>
                        R{plan.price}
                      </span>
                      <span className={`text-sm font-semibold ${isSelected ? 'text-[#1a558b]' : 'text-gray-600'}`}>
                        /month target
                      </span>
                    </div>
                  </div>

                  {/* Benefits Toggle */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedBenefits(!expandedBenefits);
                    }}
                    className={`px-6 py-3 cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-100 hover:bg-blue-200' : 'bg-gray-50 hover:bg-gray-100'
                    } flex items-center justify-between`}
                  >
                    <span className={`font-bold text-sm ${isSelected ? 'text-[#1a558b]' : 'text-gray-700'}`}>
                      ✓ {plan.benefits.length} Key Benefits
                    </span>
                    <span className={`text-xl transition-transform ${expandedBenefits ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </div>

                  {/* Benefits List */}
                  {expandedBenefits && (
                    <div className="px-6 py-4 bg-white border-t border-gray-100">
                      <ul className="space-y-2">
                        {plan.benefits.map((benefit, idx) => (
                          <li key={idx} className="flex gap-3 text-sm">
                            <span className="text-green-500 font-bold flex-shrink-0 mt-0.5">✓</span>
                            <span className="text-gray-700">{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Selection Indicator */}
                  {isSelected && (
                    <div className="px-6 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border-t-2 border-green-200 flex items-center justify-center gap-2">
                      <span className="text-2xl">✓</span>
                      <span className="font-bold text-green-700">Selected</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Comparison Table */}
          <div className="mb-8 rounded-2xl overflow-hidden border-2 border-gray-200">
            <div className="bg-gray-50 px-6 py-4 border-b-2 border-gray-200">
              <h3 className="font-black text-gray-900">Quick Comparison</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100 border-b-2 border-gray-200">
                    <th className="px-6 py-3 text-left font-bold text-gray-900">Feature</th>
                    {PLANS.map((plan) => (
                      <th key={plan.id} className="px-6 py-3 text-center font-bold text-gray-900">
                        {plan.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-3 font-semibold text-gray-900">Monthly Cost</td>
                    {PLANS.map((plan) => (
                      <td key={plan.id} className="px-6 py-3 text-center text-gray-700">
                        <span className="font-black text-lg">R{plan.price}</span>
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-3 font-semibold text-gray-900">Doctor Visits</td>
                    <td className="px-6 py-3 text-center text-gray-700">✓ 5/year</td>
                    <td className="px-6 py-3 text-center text-gray-700">Emergency only</td>
                  </tr>
                  <tr className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-3 font-semibold text-gray-900">Hospital Cover</td>
                    <td className="px-6 py-3 text-center text-gray-700">Limited</td>
                    <td className="px-6 py-3 text-center text-gray-700">✓ Full coverage</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-semibold text-gray-900">Dental</td>
                    <td className="px-6 py-3 text-center text-gray-700">✓ 2 visits</td>
                    <td className="px-6 py-3 text-center text-gray-700">Not included</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex gap-4">
            <button
              onClick={handleSelectPlan}
              disabled={loading || !selectedPlan}
              className={`flex-1 py-4 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                loading || !selectedPlan
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg hover:scale-105 active:scale-95'
              }`}
            >
              {loading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Activating...
                </>
              ) : (
                <>
                  <span>✓</span>
                  <span>Activate {selectedPlan?.name}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <Notification
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onClose={hideNotification}
        />
      )}
    </div>
  );
}
