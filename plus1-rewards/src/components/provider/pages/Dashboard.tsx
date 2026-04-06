// src/components/provider/pages/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProviderDashboard } from '../../../hooks/useProviderDashboard';
import PolicyStatsCard from '../components/PolicyStatsCard';
import PlanBreakdown from '../components/PlanBreakdown';
import FinancialSummary from '../components/FinancialSummary';
import ShopContribution from '../components/ShopContribution';
import MonthlyBatchReporting from '../components/MonthlyBatchReporting';
import ProviderFooter from '../components/ProviderFooter';

export default function Dashboard() {
  const navigate = useNavigate();
  const [providerId, setProviderId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedPlanFamily, setSelectedPlanFamily] = useState<string>('All Plans');
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showPlanDropdown, setShowPlanDropdown] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [uniquePlans, setUniquePlans] = useState<string[]>([]);

  const { stats, planBreakdown, policies, loading, error, exportCSV } = useProviderDashboard(providerId);

  // Generate last 12 months
  const getMonthOptions = () => {
    const months = [];
    for (let i = 0; i < 12; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      months.push(date.toLocaleString('default', { month: 'long', year: 'numeric' }));
    }
    return months;
  };

  const monthOptions = getMonthOptions();

  useEffect(() => {
    // Get provider from sessionStorage or localStorage
    const providerData = sessionStorage.getItem('currentProvider') || localStorage.getItem('currentProvider');
    if (!providerData) {
      navigate('/provider/login');
      return;
    }
    const parsed = JSON.parse(providerData);
    setProviderId(parsed.id);

    // Set current month
    const now = new Date();
    const monthName = now.toLocaleString('default', { month: 'long', year: 'numeric' });
    setSelectedMonth(monthName);
  }, [navigate]);

  // Extract unique plan names from policies
  useEffect(() => {
    if (policies && policies.length > 0) {
      const plans = Array.from(new Set(policies.map(p => p.plan_name || 'Unknown')));
      setUniquePlans(plans);
    }
  }, [policies]);

  // Filter data based on selected month and plan
  const getFilteredStats = () => {
    if (!policies || policies.length === 0) return stats;

    let filtered = policies;

    // Filter by month
    if (selectedMonth) {
      const [monthName, year] = selectedMonth.split(' ');
      filtered = filtered.filter(p => {
        const policyDate = new Date(p.created_at);
        return policyDate.toLocaleString('default', { month: 'long', year: 'numeric' }) === selectedMonth;
      });
    }

    // Filter by plan
    if (selectedPlanFamily !== 'All Plans') {
      filtered = filtered.filter(p => p.plan_name === selectedPlanFamily);
    }

    // Calculate filtered stats
    const activatedPolicies = filtered.filter(p => p.status === 'active');
    const inProgressPolicies = filtered.filter(p => p.status === 'pending');
    const totalPoliciesFunded = activatedPolicies.length;
    const totalValue = activatedPolicies.reduce((sum, p) => sum + (p.monthly_premium || 0), 0);
    const netPayout = totalValue * 0.9;
    const pendingValue = inProgressPolicies.reduce((sum, p) => sum + (p.monthly_premium || 0), 0);
    const activationRate = filtered.length > 0 ? Math.round((totalPoliciesFunded / filtered.length) * 100) : 0;

    return {
      totalPoliciesFunded,
      totalValue,
      netPayout,
      pendingReconciliation: pendingValue,
      activationRate,
      activatedCount: totalPoliciesFunded,
      inProgressCount: inProgressPolicies.length
    };
  };

  // Filter plan breakdown
  const getFilteredPlanBreakdown = () => {
    if (!planBreakdown || planBreakdown.length === 0) return [];

    let filtered = planBreakdown;

    if (selectedPlanFamily !== 'All Plans') {
      filtered = filtered.filter(p => p.planType === selectedPlanFamily);
    }

    return filtered;
  };

  const filteredStats = getFilteredStats();
  const filteredPlanBreakdown = getFilteredPlanBreakdown();

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      await exportCSV();
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 md:px-10 py-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading dashboard...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 md:px-10 py-8">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-300">Error: {error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 max-w-7xl mx-auto w-full px-6 md:px-10 py-8 space-y-8">
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <h1 className="text-white text-4xl font-black leading-tight tracking-tight">DAY1 HEALTH PARTNER PORTAL</h1>
          <p className="text-primary/70 text-lg font-medium">Transparency into policy activations and financial reconciliation.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {/* Month Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowMonthDropdown(!showMonthDropdown)}
              className="flex h-10 items-center justify-center gap-x-2 rounded-lg bg-primary/10 border border-primary/20 px-4 text-white hover:bg-primary/20 transition-colors"
            >
              <span className="text-sm font-medium">Month: {selectedMonth}</span>
              <span className="material-symbols-outlined text-primary text-lg">expand_more</span>
            </button>
            {showMonthDropdown && (
              <div className="absolute top-full mt-2 right-0 bg-background-dark border border-primary/20 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                {monthOptions.map((month, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedMonth(month);
                      setShowMonthDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm font-medium transition-colors ${
                      selectedMonth === month
                        ? 'bg-primary/20 text-primary'
                        : 'text-slate-300 hover:bg-primary/10 hover:text-white'
                    }`}
                  >
                    {month}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Plan Family Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowPlanDropdown(!showPlanDropdown)}
              className="flex h-10 items-center justify-center gap-x-2 rounded-lg bg-primary/10 border border-primary/20 px-4 text-white hover:bg-primary/20 transition-colors"
            >
              <span className="text-sm font-medium">{selectedPlanFamily}</span>
              <span className="material-symbols-outlined text-primary text-lg">filter_alt</span>
            </button>
            {showPlanDropdown && (
              <div className="absolute top-full mt-2 right-0 bg-background-dark border border-primary/20 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                <button
                  onClick={() => {
                    setSelectedPlanFamily('All Plans');
                    setShowPlanDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm font-medium transition-colors ${
                    selectedPlanFamily === 'All Plans'
                      ? 'bg-primary/20 text-primary'
                      : 'text-slate-300 hover:bg-primary/10 hover:text-white'
                  }`}
                >
                  All Plans
                </button>
                {uniquePlans.map((plan, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedPlanFamily(plan);
                      setShowPlanDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm font-medium transition-colors ${
                      selectedPlanFamily === plan
                        ? 'bg-primary/20 text-primary'
                        : 'text-slate-300 hover:bg-primary/10 hover:text-white'
                    }`}
                  >
                    {plan}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <PolicyStatsCard
          label="Total Policies Funded"
          value={filteredStats.totalPoliciesFunded.toString()}
          icon="verified_user"
          trend={`+${Math.round(filteredStats.activationRate / 10)}% from last month`}
          trendIcon="trending_up"
        />
        <PolicyStatsCard
          label="Total Value (90% Payout)"
          value={`R${filteredStats.netPayout.toFixed(0)}`}
          icon="payments"
          subtitle="Net value after admin fees"
        />
        <PolicyStatsCard
          label="Pending Reconciliation"
          value={`R${filteredStats.pendingReconciliation.toFixed(0)}`}
          icon="hourglass_empty"
          trend={`${filteredStats.inProgressCount} policies in review`}
          trendIcon="info"
          trendColor="text-orange-400"
        />
        <PolicyStatsCard
          label="Activation Rate"
          value={`${filteredStats.activationRate}%`}
          icon="analytics"
          isPrimary={true}
          progressValue={filteredStats.activationRate}
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <PlanBreakdown plans={filteredPlanBreakdown} />
        <section className="space-y-6">
          <FinancialSummary
            expectedRevenue={`R${filteredStats.totalValue.toFixed(0)}`}
            paidToDate={`R${filteredStats.netPayout.toFixed(0)}`}
            reconciliationPercent={96}
          />
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <MonthlyBatchReporting onExport={handleExportCSV} isExporting={exporting} currentMonth={selectedMonth} />
        <ShopContribution />
      </div>

      <ProviderFooter />
    </main>
  );
}
