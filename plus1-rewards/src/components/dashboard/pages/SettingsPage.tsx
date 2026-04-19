// plus1-rewards/src/components/dashboard/pages/SettingsPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../DashboardLayout';
import { supabaseAdmin } from '../../../lib/supabase';

export default function SettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    // Cashback rule display
    minCashbackPercent: 3,
    maxCashbackPercent: 40,
    systemPercent: 1,
    agentPercent: 1,
    
    // Invoice timing settings
    invoiceGenerationDay: 28,
    invoiceDueDays: 7,
    gracePeriodDays: 3,
    
    // Status label settings
    activeCoverPlanLabel: 'Active',
    suspendedCoverPlanLabel: 'Suspended',
    pendingApprovalLabel: 'Pending Approval',
    
    // Export settings
    exportFormat: 'CSV',
    includeLinkedPeople: true,
    includeSuspendedPlans: false,
    
    // System notices
    maintenanceMode: false,
    maintenanceMessage: '',
    
    // Support contact details
    supportEmail: 'support@plus1rewards.co.za',
    supportPhone: '+27 XX XXX XXXX',
    adminChatEnabled: true
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // In production, load settings from database
    // For now, using default values
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      // In production, save to database
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleLogout = () => navigate('/');

  return (
    <DashboardLayout>
      <main className="flex-1 overflow-y-auto bg-[#f5f8fc] relative">
        {/* COMING SOON OVERLAY */}
        <div className="absolute inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)' }}>
          <div className="text-center px-6 max-w-2xl">
            <div className="mb-6">
              <span className="material-symbols-outlined text-[#1a558b] mb-4" style={{ fontSize: '120px' }}>
                construction
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-white mb-4 tracking-tight">
              COMING SOON
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-6 font-semibold">
              Settings Management
            </p>
            <div className="bg-white/10 border border-white/20 rounded-xl p-6 backdrop-blur-sm">
              <p className="text-base text-gray-200 leading-relaxed mb-4">
                The Settings page is currently under development. This feature will allow you to configure system-wide settings including:
              </p>
              <ul className="text-sm text-gray-300 space-y-2 text-left max-w-md mx-auto">
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[#1a558b] text-lg mt-0.5">check_circle</span>
                  <span>Cashback percentage rules and limits</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[#1a558b] text-lg mt-0.5">check_circle</span>
                  <span>Invoice generation and payment timing</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[#1a558b] text-lg mt-0.5">check_circle</span>
                  <span>System status labels and notifications</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[#1a558b] text-lg mt-0.5">check_circle</span>
                  <span>Export preferences and data formats</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[#1a558b] text-lg mt-0.5">check_circle</span>
                  <span>Support contact information</span>
                </li>
              </ul>
              <div className="mt-6 pt-6 border-t border-white/20">
                <p className="text-xs text-gray-400 italic">
                  Note: Settings are currently not persisted to the database. This feature requires implementation of the system_settings table and proper save/load functionality.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="mt-8 px-8 py-4 bg-[#1a558b] hover:opacity-90 text-white rounded-xl font-bold transition-all flex items-center gap-2 mx-auto text-lg"
            >
              <span className="material-symbols-outlined">arrow_back</span>
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Desktop Header */}
        <header className="hidden md:flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 md:p-10 pb-6">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Settings / Configuration</h1>
            <p className="text-gray-600 mt-1">System-wide settings and configuration</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-5 py-2.5 font-bold rounded-lg border border-[#1a558b] bg-white text-[#1a558b] hover:bg-[#1a558b] hover:text-white transition-all text-sm"
            >
              <span className="material-symbols-outlined text-lg">refresh</span>
              Refresh
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#1a558b] text-white rounded-lg hover:opacity-90 transition-all text-sm"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
              Logout
            </button>
          </div>
        </header>

        {/* Mobile Header - 2 rows */}
        <header className="md:hidden px-4 py-4 space-y-3">
          {/* Row 1: Title */}
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#1a558b]">settings</span>
            <h1 className="text-xl font-black text-gray-900">Settings</h1>
          </div>

          {/* Row 2: Two equal-width buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 font-bold rounded-lg border border-[#1a558b] bg-white text-[#1a558b] text-sm"
            >
              <span className="material-symbols-outlined text-lg">refresh</span>
              Refresh
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1a558b] text-white rounded-lg text-sm"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
              Logout
            </button>
          </div>
        </header>

        <div className="px-4 md:px-10 pb-6 md:pb-10">
          {/* Warning Banner */}
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <span className="material-symbols-outlined text-red-600">warning</span>
            <div>
              <h4 className="text-sm font-bold text-red-900 mb-1">Senior Admin Access Only</h4>
              <p className="text-xs text-red-800">
                These settings affect the entire platform. Only senior administrators should modify these values.
                Changes take effect immediately and may impact all users.
              </p>
            </div>
          </div>

          {/* Cashback Rule Display */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-lg">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#1a558b]">percent</span>
              Cashback Rule Display
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">Minimum Cashback Percentage</label>
                <input
                  type="number"
                  value={settings.minCashbackPercent}
                  onChange={(e) => setSettings({...settings, minCashbackPercent: parseInt(e.target.value)})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-sm text-gray-900 focus:ring-2 focus:ring-[#1a558b] outline-none"
                  min="1"
                  max="100"
                />
                <p className="text-xs text-gray-500 mt-1">Partners must offer at least this percentage</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">Maximum Cashback Percentage</label>
                <input
                  type="number"
                  value={settings.maxCashbackPercent}
                  onChange={(e) => setSettings({...settings, maxCashbackPercent: parseInt(e.target.value)})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-sm text-gray-900 focus:ring-2 focus:ring-[#1a558b] outline-none"
                  min="1"
                  max="100"
                />
                <p className="text-xs text-gray-500 mt-1">Partners cannot exceed this percentage</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">System Percentage</label>
                <input
                  type="number"
                  value={settings.systemPercent}
                  onChange={(e) => setSettings({...settings, systemPercent: parseInt(e.target.value)})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-sm text-gray-900 focus:ring-2 focus:ring-[#1a558b] outline-none"
                  min="0"
                  max="10"
                />
                <p className="text-xs text-gray-500 mt-1">Platform fee from each transaction</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">Agent Percentage</label>
                <input
                  type="number"
                  value={settings.agentPercent}
                  onChange={(e) => setSettings({...settings, agentPercent: parseInt(e.target.value)})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-sm text-gray-900 focus:ring-2 focus:ring-[#1a558b] outline-none"
                  min="0"
                  max="10"
                />
                <p className="text-xs text-gray-500 mt-1">Agent commission from each transaction</p>
              </div>
            </div>
          </div>

          {/* Invoice Timing Settings */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-lg">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#1a558b]">schedule</span>
              Invoice Timing Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">Invoice Generation Day</label>
                <input
                  type="number"
                  value={settings.invoiceGenerationDay}
                  onChange={(e) => setSettings({...settings, invoiceGenerationDay: parseInt(e.target.value)})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-sm text-gray-900 focus:ring-2 focus:ring-[#1a558b] outline-none"
                  min="1"
                  max="31"
                />
                <p className="text-xs text-gray-500 mt-1">Day of month to generate invoices</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">Invoice Due Days</label>
                <input
                  type="number"
                  value={settings.invoiceDueDays}
                  onChange={(e) => setSettings({...settings, invoiceDueDays: parseInt(e.target.value)})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-sm text-gray-900 focus:ring-2 focus:ring-[#1a558b] outline-none"
                  min="1"
                  max="30"
                />
                <p className="text-xs text-gray-500 mt-1">Days after generation until due</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">Grace Period Days</label>
                <input
                  type="number"
                  value={settings.gracePeriodDays}
                  onChange={(e) => setSettings({...settings, gracePeriodDays: parseInt(e.target.value)})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-sm text-gray-900 focus:ring-2 focus:ring-[#1a558b] outline-none"
                  min="0"
                  max="14"
                />
                <p className="text-xs text-gray-500 mt-1">Days after due date before suspension</p>
              </div>
            </div>
          </div>

          {/* Status Label Settings */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-lg">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#1a558b]">label</span>
              Status Label Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">Active Cover Plan Label</label>
                <input
                  type="text"
                  value={settings.activeCoverPlanLabel}
                  onChange={(e) => setSettings({...settings, activeCoverPlanLabel: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-sm text-gray-900 focus:ring-2 focus:ring-[#1a558b] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">Suspended Cover Plan Label</label>
                <input
                  type="text"
                  value={settings.suspendedCoverPlanLabel}
                  onChange={(e) => setSettings({...settings, suspendedCoverPlanLabel: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-sm text-gray-900 focus:ring-2 focus:ring-[#1a558b] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">Pending Approval Label</label>
                <input
                  type="text"
                  value={settings.pendingApprovalLabel}
                  onChange={(e) => setSettings({...settings, pendingApprovalLabel: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-sm text-gray-900 focus:ring-2 focus:ring-[#1a558b] outline-none"
                />
              </div>
            </div>
          </div>

          {/* Export Settings */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-lg">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#1a558b]">upload_file</span>
              Export Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">Export Format</label>
                <select
                  value={settings.exportFormat}
                  onChange={(e) => setSettings({...settings, exportFormat: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-sm text-gray-900 focus:ring-2 focus:ring-[#1a558b] outline-none"
                >
                  <option value="CSV">CSV</option>
                  <option value="Excel">Excel</option>
                  <option value="JSON">JSON</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">Include dependants</label>
                <div className="flex items-center gap-3 mt-2">
                  <input
                    type="checkbox"
                    checked={settings.includeLinkedPeople}
                    onChange={(e) => setSettings({...settings, includeLinkedPeople: e.target.checked})}
                    className="size-5 text-[#1a558b] focus:ring-[#1a558b] rounded"
                  />
                  <span className="text-sm text-gray-700">Include in exports</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">Include Suspended Plans</label>
                <div className="flex items-center gap-3 mt-2">
                  <input
                    type="checkbox"
                    checked={settings.includeSuspendedPlans}
                    onChange={(e) => setSettings({...settings, includeSuspendedPlans: e.target.checked})}
                    className="size-5 text-[#1a558b] focus:ring-[#1a558b] rounded"
                  />
                  <span className="text-sm text-gray-700">Include in exports</span>
                </div>
              </div>
            </div>
          </div>

          {/* System Notices */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-lg">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#1a558b]">notifications</span>
              System Notices
            </h3>
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settings.maintenanceMode}
                    onChange={(e) => setSettings({...settings, maintenanceMode: e.target.checked})}
                    className="size-5 text-[#1a558b] focus:ring-[#1a558b] rounded"
                  />
                  <span className="text-sm font-bold text-gray-700">Enable Maintenance Mode</span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-8">Prevents all users except admins from accessing the system</p>
              </div>
              {settings.maintenanceMode && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">Maintenance Message</label>
                  <textarea
                    value={settings.maintenanceMessage}
                    onChange={(e) => setSettings({...settings, maintenanceMessage: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-sm text-gray-900 focus:ring-2 focus:ring-[#1a558b] outline-none"
                    rows={3}
                    placeholder="System is under maintenance. Please check back later."
                  />
                </div>
              )}
            </div>
          </div>

          {/* Support Contact Details */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-lg">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#1a558b]">support_agent</span>
              Support Contact Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">Support Email</label>
                <input
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) => setSettings({...settings, supportEmail: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-sm text-gray-900 focus:ring-2 focus:ring-[#1a558b] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">Support Phone</label>
                <input
                  type="tel"
                  value={settings.supportPhone}
                  onChange={(e) => setSettings({...settings, supportPhone: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-sm text-gray-900 focus:ring-2 focus:ring-[#1a558b] outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settings.adminChatEnabled}
                    onChange={(e) => setSettings({...settings, adminChatEnabled: e.target.checked})}
                    className="size-5 text-[#1a558b] focus:ring-[#1a558b] rounded"
                  />
                  <span className="text-sm font-bold text-gray-700">Enable Admin Chat</span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-8">Allow members and partners to contact admin directly</p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-[#1a558b] hover:opacity-90 text-white rounded-lg font-bold transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <span className="material-symbols-outlined animate-spin">sync</span>
                  Saving...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">save</span>
                  Save All Settings
                </>
              )}
            </button>
          </div>

          {/* Footer */}
          <div className="mt-12 text-center">
            <p className="text-[10px] text-gray-600 font-bold tracking-[0.2em] uppercase">
              © 2026 +1 Rewards Platform Management • Secured Admin Access
            </p>
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}
