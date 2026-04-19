import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabaseAdmin } from '../../lib/supabase';

const BLUE = '#1a558b';

interface AdminNotification {
  id: string;
  type: string;
  member_id: string;
  member_name: string;
  member_phone: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  read: boolean;
  created_at: string;
  metadata?: {
    progress_percent?: number;
    missing_fields?: string[];
    cover_plan_id?: string;
    action?: string;
  };
}

export default function AdminNotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'high'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabaseAdmin
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await supabaseAdmin
        .from('admin_notifications')
        .update({ read: true })
        .eq('id', id);

      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await supabaseAdmin
        .from('admin_notifications')
        .update({ read: true })
        .eq('read', false);

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const markSelectedAsRead = async () => {
    if (selectedIds.size === 0) return;
    
    try {
      await supabaseAdmin
        .from('admin_notifications')
        .update({ read: true })
        .in('id', Array.from(selectedIds));

      setNotifications(prev =>
        prev.map(n => selectedIds.has(n.id) ? { ...n, read: true } : n)
      );
      setSelectedIds(new Set());
    } catch (error) {
      console.error('Error marking selected as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notification?')) return;
    
    try {
      await supabaseAdmin
        .from('admin_notifications')
        .delete()
        .eq('id', id);

      setNotifications(prev => prev.filter(n => n.id !== id));
      selectedIds.delete(id);
      setSelectedIds(new Set(selectedIds));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const deleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} notification(s)?`)) return;
    
    try {
      await supabaseAdmin
        .from('admin_notifications')
        .delete()
        .in('id', Array.from(selectedIds));

      setNotifications(prev => prev.filter(n => !selectedIds.has(n.id)));
      setSelectedIds(new Set());
    } catch (error) {
      console.error('Error deleting selected notifications:', error);
    }
  };

  const toggleSelectAll = () => {
    const filtered = getFilteredNotifications();
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(n => n.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const getFilteredNotifications = () => {
    let filtered = notifications;

    // Search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(n =>
        n.member_name?.toLowerCase().includes(search) ||
        n.member_phone?.includes(search) ||
        n.message?.toLowerCase().includes(search) ||
        n.type?.toLowerCase().includes(search)
      );
    }

    // Read/Priority filter
    if (filter === 'unread') filtered = filtered.filter(n => !n.read);
    if (filter === 'high') filtered = filtered.filter(n => n.priority === 'high');

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(n => n.type === typeFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      filtered = filtered.filter(n => {
        const created = new Date(n.created_at);
        if (dateFilter === 'today') return created >= today;
        if (dateFilter === 'week') return created >= weekAgo;
        if (dateFilter === 'month') return created >= monthAgo;
        return true;
      });
    }

    return filtered;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return { bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-700', dot: 'bg-red-500' };
      case 'medium':
        return { bg: 'bg-yellow-50', border: 'border-yellow-200', badge: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' };
      default:
        return { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' };
    }
  };

  const getNotificationIcon = (type: string) => {
    if (type.includes('suspended')) return 'block';
    if (type.includes('profile')) return 'warning';
    if (type.includes('unsuspended')) return 'check_circle';
    if (type.includes('dependant')) return 'group';
    return 'notifications';
  };

  const getUniqueTypes = () => {
    const types = new Set(notifications.map(n => n.type));
    return Array.from(types).sort();
  };

  const filteredNotifications = getFilteredNotifications();
  const unreadCount = notifications.filter(n => !n.read).length;
  const highPriorityCount = notifications.filter(n => n.priority === 'high').length;
  const uniqueTypes = getUniqueTypes();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f8fc] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 rounded-full animate-spin mx-auto mb-4" style={{ borderTopColor: BLUE, borderRadius: '50%' }}></div>
          <p className="text-gray-600 font-semibold">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f8fc]">
      {/* Desktop Header */}
      <header className="hidden md:flex md:flex-col md:gap-6 p-6 md:p-10 pb-6">
        <div className="flex items-center justify-between gap-6">
          <div className="flex-1 max-w-2xl">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-4">Notifications Center</h2>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xl">search</span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg py-2.5 pl-10 pr-4 text-sm text-gray-900 focus:ring-2 focus:ring-[#1a558b] focus:border-[#1a558b] outline-none transition-all placeholder:text-gray-400"
                placeholder="Search by member name, phone, message, or type..."
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchNotifications()}
              className="flex items-center gap-2 px-5 py-2.5 font-bold rounded-lg border border-[#1a558b] bg-white text-[#1a558b] hover:bg-[#1a558b] hover:text-white transition-all text-sm"
            >
              <span className="material-symbols-outlined text-lg">refresh</span>
              Refresh
            </button>

            <button
              onClick={() => navigate('/admin/dashboard')}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#1a558b] text-white rounded-lg hover:opacity-90 transition-all text-sm"
            >
              <span className="material-symbols-outlined text-lg">dashboard</span>
              Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Header - 2 Rows */}
      <header className="md:hidden p-4 space-y-3">
        {/* Row 1: Title + Count */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              <span className="material-symbols-outlined text-[#1a558b]">notifications</span>
              Notifications
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold" style={{ borderRadius: '5px' }}>
                  {unreadCount}
                </span>
              )}
            </h1>
            <p className="text-sm text-gray-600 mt-0.5">{filteredNotifications.length} total</p>
          </div>
        </div>
        
        {/* Row 2: Search */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-base">search</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-lg py-2 pl-9 pr-3 text-sm text-gray-900 focus:ring-2 focus:ring-[#1a558b] focus:border-[#1a558b] outline-none transition-all placeholder:text-gray-400"
            placeholder="Search notifications..."
          />
        </div>

        {/* Row 3: Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 font-bold rounded-lg transition-all text-xs flex-1 ${
              showFilters 
                ? 'bg-[#1a558b] text-white' 
                : 'border border-[#1a558b] bg-white text-[#1a558b] hover:bg-[#1a558b] hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-base">filter_list</span>
            <span>Filters</span>
          </button>
          <button
            onClick={() => fetchNotifications()}
            className="flex items-center justify-center gap-1.5 px-3 py-2 font-bold rounded-lg border border-[#1a558b] bg-white text-[#1a558b] hover:bg-[#1a558b] hover:text-white transition-all text-xs flex-1"
          >
            <span className="material-symbols-outlined text-base">refresh</span>
            <span>Refresh</span>
          </button>
        </div>
      </header>

      <div className="px-4 md:px-6 lg:px-10 pb-6 md:pb-10">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
          <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-1 md:mb-2">
              <span className="material-symbols-outlined text-[#1a558b] text-2xl md:text-3xl">inbox</span>
              <span className="text-2xl md:text-3xl font-black text-gray-900">{notifications.length}</span>
            </div>
            <p className="text-xs md:text-sm font-bold text-gray-600">Total</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-1 md:mb-2">
              <span className="material-symbols-outlined text-red-600 text-2xl md:text-3xl">mail</span>
              <span className="text-2xl md:text-3xl font-black text-red-600">{unreadCount}</span>
            </div>
            <p className="text-xs md:text-sm font-bold text-gray-600">Unread</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-1 md:mb-2">
              <span className="material-symbols-outlined text-orange-600 text-2xl md:text-3xl">priority_high</span>
              <span className="text-2xl md:text-3xl font-black text-orange-600">{highPriorityCount}</span>
            </div>
            <p className="text-xs md:text-sm font-bold text-gray-600">High Priority</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-1 md:mb-2">
              <span className="material-symbols-outlined text-green-600 text-2xl md:text-3xl">check_circle</span>
              <span className="text-2xl md:text-3xl font-black text-green-600">{filteredNotifications.length}</span>
            </div>
            <p className="text-xs md:text-sm font-bold text-gray-600">Filtered</p>
          </div>
        </div>

        {/* Filters and Actions Bar */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm mb-4 md:mb-6">
          <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
            <h3 className="text-base md:text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#1a558b]">filter_list</span>
              <span className="hidden sm:inline">Filters & Actions</span>
              <span className="sm:hidden">Filters</span>
            </h3>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-xs flex items-center gap-1 font-medium text-[#1a558b] hover:underline"
            >
              <span className="material-symbols-outlined text-sm">{showFilters ? 'expand_less' : 'expand_more'}</span>
              {showFilters ? 'Hide' : 'Show'}
            </button>
          </div>

          {showFilters && (
            <div className="p-4 md:p-6 space-y-4">
              {/* Filter Tabs */}
              <div className="flex gap-2 md:gap-3 flex-wrap">
                {[
                  { key: 'all', label: 'All', icon: 'inbox', count: notifications.length },
                  { key: 'unread', label: 'Unread', icon: 'mail', count: unreadCount },
                  { key: 'high', label: 'High Priority', icon: 'priority_high', count: highPriorityCount }
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key as any)}
                    className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-lg font-semibold text-xs md:text-sm transition-all ${
                      filter === tab.key
                        ? 'bg-[#1a558b] text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base md:text-lg">{tab.icon}</span>
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className={`px-1.5 md:px-2 py-0.5 rounded-full text-[10px] md:text-xs font-bold ${
                      filter === tab.key ? 'bg-white/30' : 'bg-white'
                    }`} style={{ borderRadius: '9px' }}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Advanced Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">Type</label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-xs md:text-sm text-gray-900 focus:ring-1 focus:ring-[#1a558b] outline-none"
                  >
                    <option value="all">All Types</option>
                    {uniqueTypes.map(type => (
                      <option key={type} value={type}>{type.replace(/_/g, ' ').toUpperCase()}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">Date Range</label>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value as any)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-xs md:text-sm text-gray-900 focus:ring-1 focus:ring-[#1a558b] outline-none"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last 30 Days</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setFilter('all');
                      setTypeFilter('all');
                      setDateFilter('all');
                    }}
                    className="text-xs font-bold text-[#1a558b] hover:underline uppercase tracking-widest"
                  >
                    Reset All
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Bulk Actions */}
          {selectedIds.size > 0 && (
            <div className="px-4 md:px-6 py-3 md:py-4 bg-blue-50 border-t border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <p className="text-xs md:text-sm font-bold text-blue-900">
                {selectedIds.size} selected
              </p>
              <div className="flex items-center gap-2 md:gap-3 w-full sm:w-auto">
                <button
                  onClick={markSelectedAsRead}
                  className="flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-all text-xs md:text-sm font-bold flex-1 sm:flex-initial justify-center"
                >
                  <span className="material-symbols-outlined text-base md:text-lg">done_all</span>
                  <span className="hidden sm:inline">Mark as Read</span>
                  <span className="sm:hidden">Read</span>
                </button>
                <button
                  onClick={deleteSelected}
                  className="flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all text-xs md:text-sm font-bold flex-1 sm:flex-initial justify-center"
                >
                  <span className="material-symbols-outlined text-base md:text-lg">delete</span>
                  <span className="hidden sm:inline">Delete</span>
                  <span className="sm:hidden">Delete</span>
                </button>
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-xs md:text-sm font-bold"
                >
                  <span className="material-symbols-outlined text-base md:text-lg">close</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        {unreadCount > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3 md:p-4 mb-4 md:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 md:gap-3">
              <span className="material-symbols-outlined text-blue-600 text-xl md:text-2xl">info</span>
              <p className="text-xs md:text-sm font-bold text-blue-900">
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-xs md:text-sm font-bold w-full sm:w-auto justify-center"
            >
              <span className="material-symbols-outlined text-base md:text-lg">done_all</span>
              Mark All as Read
            </button>
          </div>
        )}

        {/* Notifications List */}
        {filteredNotifications.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 md:p-12 text-center shadow-sm">
            <span className="material-symbols-outlined text-4xl md:text-6xl text-gray-300 block mb-3 md:mb-4">mail_outline</span>
            <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">No notifications found</h3>
            <p className="text-sm md:text-base text-gray-600">
              {searchTerm || filter !== 'all' || typeFilter !== 'all' || dateFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'You have no notifications'}
            </p>
          </div>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {/* Select All */}
            <div className="bg-white border border-gray-200 rounded-lg p-3 md:p-4 flex items-center justify-between">
              <label className="flex items-center gap-2 md:gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedIds.size === filteredNotifications.length && filteredNotifications.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 md:w-5 md:h-5 text-[#1a558b] border-gray-300 rounded focus:ring-[#1a558b] cursor-pointer"
                />
                <span className="text-xs md:text-sm font-bold text-gray-700">
                  Select All ({filteredNotifications.length})
                </span>
              </label>
            </div>

            {filteredNotifications.map(notification => {
              const colors = getPriorityColor(notification.priority);
              const icon = getNotificationIcon(notification.type);
              const isSelected = selectedIds.has(notification.id);
              
              return (
                <div
                  key={notification.id}
                  className={`bg-white border-2 rounded-xl p-3 md:p-5 transition-all hover:shadow-md ${colors.border} ${!notification.read ? 'ring-2 ring-offset-2 ring-[#1a558b]' : ''} ${isSelected ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex gap-2 md:gap-4">
                    {/* Checkbox */}
                    <div className="flex items-start pt-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(notification.id)}
                        className="w-4 h-4 md:w-5 md:h-5 text-[#1a558b] border-gray-300 rounded focus:ring-[#1a558b] cursor-pointer"
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 md:gap-4 mb-2 md:mb-3">
                        <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                          <span className="material-symbols-outlined text-xl md:text-2xl text-gray-600">{icon}</span>
                          <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
                            <span className={`px-2 md:px-3 py-0.5 md:py-1 rounded-lg text-[10px] md:text-xs font-bold ${colors.badge}`} style={{ borderRadius: '9px' }}>
                              {notification.priority.toUpperCase()}
                            </span>
                            {!notification.read && (
                              <span className="flex items-center gap-1 md:gap-1.5 px-2 md:px-2.5 py-0.5 md:py-1 bg-blue-100 text-blue-700 rounded-lg text-[10px] md:text-xs font-bold" style={{ borderRadius: '9px' }}>
                                <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-blue-600 animate-pulse" style={{ borderRadius: '50%' }}></span>
                                NEW
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-[10px] md:text-xs text-gray-500 font-medium whitespace-nowrap">
                          {new Date(notification.created_at).toLocaleDateString('en-ZA', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>

                      <p className="text-xs md:text-sm text-gray-900 font-semibold mb-2 md:mb-3 leading-relaxed">
                        {notification.message}
                      </p>

                      {/* Member info */}
                      <div className="bg-gray-50 rounded-lg p-2 md:p-3 mb-2 md:mb-3 border border-gray-200">
                        <div className="grid grid-cols-2 gap-2 md:gap-3 text-xs md:text-sm">
                          <div>
                            <p className="text-gray-600 text-[10px] md:text-xs font-bold uppercase tracking-wide mb-0.5 md:mb-1">Member</p>
                            <p className="text-gray-900 font-semibold truncate">{notification.member_name}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 text-[10px] md:text-xs font-bold uppercase tracking-wide mb-0.5 md:mb-1">Phone</p>
                            <p className="text-gray-900 font-semibold">{notification.member_phone}</p>
                          </div>
                        </div>
                      </div>

                      {/* Metadata */}
                      {notification.metadata && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 md:p-3">
                          <div className="space-y-1 md:space-y-1.5 text-xs md:text-sm">
                            {notification.metadata.progress_percent !== undefined && (
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-blue-900 font-semibold text-xs md:text-sm">Progress</span>
                                <div className="flex items-center gap-1.5 md:gap-2">
                                  <div className="w-16 md:w-24 h-1.5 md:h-2 bg-blue-200 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-blue-600 rounded-full transition-all"
                                      style={{ width: `${notification.metadata.progress_percent}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-blue-700 font-bold text-[10px] md:text-xs">{notification.metadata.progress_percent.toFixed(0)}%</span>
                                </div>
                              </div>
                            )}
                            {notification.metadata.missing_fields && notification.metadata.missing_fields.length > 0 && (
                              <p className="text-blue-900 text-xs md:text-sm">
                                <span className="font-semibold">Missing:</span> {notification.metadata.missing_fields.join(', ')}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col md:flex-row gap-1 md:gap-2 flex-shrink-0">
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="p-1.5 md:p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                          title="Mark as read"
                        >
                          <span className="material-symbols-outlined text-base md:text-xl">done</span>
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="p-1.5 md:p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete"
                      >
                        <span className="material-symbols-outlined text-base md:text-xl">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-[10px] text-gray-600 font-bold tracking-[0.2em] uppercase">
            © 2026 +1 Rewards Platform Management • Secured Admin Access
          </p>
        </div>
      </div>
    </div>
  );
}
