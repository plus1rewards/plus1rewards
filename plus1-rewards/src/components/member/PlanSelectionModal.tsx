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
  const [expandedBenefits, setExpandedBenefits] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { notification, showSuccess, hideNotification } = useNotification();

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
        .select('id')
        .eq('member_id', memberId)
        .eq('creation_order', 1)
        .single();

      if (existingPlan) {
        // User already has a plan - don't allow changing
        setError('You already have a cover plan selected. Please contact support if you need to change your plan.');
        setLoading(false);
        return;
      } else {
        // Create new plan - this is the initial selection
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
            status: 'in_progress'
          });

        if (coverPlanError) {
          console.error('Error creating member cover plan:', coverPlanError);
          throw coverPlanError;
        }
        console.log('Member cover plan created successfully!');
        
        // Update legacy fields in members table
        const { error: memberUpdateError } = await supabase
          .from('members')
          .update({
            cover_plan_name: coverPlanData.plan_name,
            cover_plan_price: selectedPlan.price.toString(),
            cover_plan_variant: 'Single'
          })
          .eq('id', memberId);

        if (memberUpdateError) {
          console.error('Error updating member legacy fields:', memberUpdateError);
          throw memberUpdateError; // Throw error instead of silently failing
        }
        console.log('Member legacy fields updated successfully!');
      }

      console.log('Plan selection successful, showing notification');
      
      // Show success notification
      showSuccess(
        'Plan Selected Successfully!',
        `You've selected ${selectedPlan.name}. Start earning rewards to activate your cover!`,
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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-start sm:items-center justify-center z-50">
      <div className="bg-white w-full h-full sm:h-auto sm:max-h-[95vh] sm:rounded-3xl sm:max-w-5xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-br from-[#1a558b] to-[#2a6a9b] px-5 py-6 sm:px-8 sm:py-10 text-white relative overflow-hidden flex-shrink-0">
          <div className="absolute top-0 right-0 w-32 h-32 sm:w-48 sm:h-48 bg-white/10 rounded-full -mr-16 sm:-mr-24 -mt-16 sm:-mt-24"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 sm:w-40 sm:h-40 bg-white/10 rounded-full -ml-12 sm:-ml-20 -mb-12 sm:-mb-20"></div>
          
          <div className="relative z-10">
            <h1 className="text-2xl sm:text-4xl font-black mb-2 leading-tight">Welcome to<br className="sm:hidden" /> Plus1 Health</h1>
            <p className="text-sm sm:text-lg text-blue-100 leading-relaxed">Choose your perfect cover plan</p>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-5 sm:p-8">
            {error && (
              <div className="rounded-lg p-4 mb-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-start gap-3">
                <span className="text-xl flex-shrink-0">⚠️</span>
                <div className="min-w-0">
                  <p className="font-bold text-sm">Something went wrong</p>
                  <p className="text-xs mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* Info Banner */}
            <div className="rounded-xl p-4 mb-5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">💡</span>
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 mb-1 text-sm">How it works</p>
                  <p className="text-gray-700 text-xs leading-relaxed">
                    Shop at partner stores to earn rewards that automatically fund your plan. Once funded, your coverage activates!
                  </p>
                </div>
              </div>
            </div>

            {/* Mobile: Swipeable Plan Cards */}
            <div className="mb-5">
              <h2 className="text-lg font-black text-gray-900 mb-3">Select Your Plan</h2>
              
              <div className="space-y-3 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0">
                {PLANS.map((plan) => {
                  const isSelected = selectedPlan?.id === plan.id;
                  const isExpanded = expandedBenefits === plan.id;
                  
                  return (
                    <div
                      key={plan.id}
                      className={`rounded-2xl overflow-hidden border-2 transition-all ${
                        isSelected
                          ? 'border-[#1a558b] shadow-lg'
                          : 'border-gray-200 shadow-sm'
                      }`}
                    >
                      {/* Plan Header - Clickable */}
                      <div
                        onClick={() => setSelectedPlan(plan)}
                        className={`p-4 cursor-pointer ${
                          isSelected 
                            ? 'bg-gradient-to-br from-[#1a558b] to-[#2a6a9b]' 
                            : 'bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl">{plan.icon}</span>
                            <div>
                              <h3 className={`text-lg font-black ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                                {plan.name}
                              </h3>
                              <p className={`text-xs ${isSelected ? 'text-blue-100' : 'text-gray-600'}`}>
                                {plan.description}
                              </p>
                            </div>
                          </div>
                          {isSelected && (
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-400 flex items-center justify-center">
                              <span className="text-white text-sm font-bold">✓</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Price */}
                        <div className={`flex items-baseline gap-2 ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                          <span className="text-3xl font-black">R{plan.price}</span>
                          <span className="text-xs font-semibold opacity-80">/month</span>
                        </div>
                      </div>

                      {/* Benefits Toggle */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedBenefits(isExpanded ? null : plan.id);
                        }}
                        className={`w-full px-4 py-3 flex items-center justify-between transition-colors ${
                          isSelected ? 'bg-blue-50 hover:bg-blue-100' : 'bg-white hover:bg-gray-50'
                        } border-t border-gray-200`}
                      >
                        <span className={`text-sm font-bold ${isSelected ? 'text-[#1a558b]' : 'text-gray-700'}`}>
                          {plan.benefits.length} Benefits
                        </span>
                        <span className={`text-lg transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                          ▼
                        </span>
                      </button>

                      {/* Benefits List - Expandable */}
                      {isExpanded && (
                        <div className="px-4 py-3 bg-white border-t border-gray-100">
                          <ul className="space-y-2">
                            {plan.benefits.map((benefit, idx) => (
                              <li key={idx} className="flex gap-2 text-xs">
                                <span className="text-green-500 font-bold flex-shrink-0 mt-0.5">✓</span>
                                <span className="text-gray-700 leading-relaxed">{benefit}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Comparison Toggle */}
            <button
              onClick={() => setShowComparison(!showComparison)}
              className="w-full mb-5 px-4 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between border border-gray-200"
            >
              <span className="text-sm font-bold text-gray-700">Compare Plans</span>
              <span className={`text-lg transition-transform ${showComparison ? 'rotate-180' : ''}`}>▼</span>
            </button>

            {/* Comparison Table - Collapsible */}
            {showComparison && (
              <div className="mb-5 rounded-xl overflow-hidden border border-gray-200">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h3 className="font-bold text-gray-900 text-sm">Quick Comparison</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[400px]">
                    <thead>
                      <tr className="bg-gray-100 border-b border-gray-200">
                        <th className="px-3 py-2 text-left font-bold text-gray-900 text-xs">Feature</th>
                        {PLANS.map((plan) => (
                          <th key={plan.id} className="px-3 py-2 text-center font-bold text-gray-900 text-xs">
                            {plan.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      <tr className="border-b border-gray-100">
                        <td className="px-3 py-2 font-semibold text-gray-900 text-xs">Cost</td>
                        {PLANS.map((plan) => (
                          <td key={plan.id} className="px-3 py-2 text-center">
                            <span className="font-black text-sm">R{plan.price}</span>
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="px-3 py-2 font-semibold text-gray-900 text-xs">Doctor Visits</td>
                        <td className="px-3 py-2 text-center text-gray-700 text-xs">✓ 5/year</td>
                        <td className="px-3 py-2 text-center text-gray-700 text-xs">Emergency</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="px-3 py-2 font-semibold text-gray-900 text-xs">Hospital</td>
                        <td className="px-3 py-2 text-center text-gray-700 text-xs">Limited</td>
                        <td className="px-3 py-2 text-center text-gray-700 text-xs">✓ Full</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-semibold text-gray-900 text-xs">Dental</td>
                        <td className="px-3 py-2 text-center text-gray-700 text-xs">✓ 2 visits</td>
                        <td className="px-3 py-2 text-center text-gray-700 text-xs">—</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Fixed Bottom Action Button */}
        <div className="flex-shrink-0 p-5 bg-white border-t border-gray-200 sm:p-6">
          <button
            onClick={handleSelectPlan}
            disabled={loading || !selectedPlan}
            className={`w-full py-4 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 ${
              loading || !selectedPlan
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg active:scale-[0.98]'
            }`}
          >
            {loading ? (
              <>
                <span className="animate-spin">⏳</span>
                <span>Activating...</span>
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
