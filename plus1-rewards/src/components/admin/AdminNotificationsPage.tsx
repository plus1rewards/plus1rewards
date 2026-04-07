import { useEffect, useState } from 'react';
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
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'high'>('all');

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

  const deleteNotification = async (id: string) => {
    try {
      await supabaseAdmin
        .from('admin_notifications')
        .delete()
        .eq('id', id);

      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getFilteredNotifications = () => {
    if (filter === 'unread') return notifications.filter(n => !n.read);
    if (filter === 'high') return notifications.filter(n => n.priority === 'high');
    return notifications;
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
    if (type.includes('suspended')) return '🚫';
    if (type.includes('profile')) return '⚠️';
    if (type.includes('unsuspended')) return '✅';
    if (type.includes('dependant')) return '👨‍👩‍👧';
    return '💡';
  };

  const filteredNotifications = getFilteredNotifications();
  const unreadCount = notifications.filter(n => !n.read).length;
  const highPriorityCount = notifications.filter(n => n.priority === 'high').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f8fc] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 rounded-full animate-spin mx-auto mb-4" style={{ borderTopColor: BLUE }}></div>
          <p className="text-gray-600 font-semibold">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f8fc]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                <span className="material-symbols-outlined text-4xl" style={{ color: BLUE }}>notifications</span>
                Notifications Center
              </h1>
              <p className="text-sm text-gray-600 mt-2">
                <span className="font-bold text-red-600">{unreadCount}</span> unread • 
                <span className="font-bold text-orange-600 ml-2">{highPriorityCount}</span> high priority • 
                <span className="font-bold text-gray-700 ml-2">{notifications.length}</span> total
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-2 px-6 py-3 bg-white border-2 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-bold"
                style={{ borderColor: BLUE, color: BLUE }}
              >
                <span className="material-symbols-outlined">done_all</span>
                Mark All as Read
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-3 flex-wrap">
            {[
              { key: 'all', label: 'All Notifications', icon: 'inbox', count: notifications.length },
              { key: 'unread', label: 'Unread', icon: 'mail', count: unreadCount },
              { key: 'high', label: 'High Priority', icon: 'priority_high', count: highPriorityCount }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                  filter === tab.key
                    ? 'text-white shadow-lg'
                    : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
                style={filter === tab.key ? { backgroundColor: BLUE } : {}}
              >
                <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                {tab.label}
                <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                  filter === tab.key ? 'bg-white/30' : 'bg-gray-100'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
            <span className="material-symbols-outlined text-6xl text-gray-300 block mb-4">mail_outline</span>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No notifications</h3>
            <p className="text-gray-600">
              {filter === 'unread' ? 'All notifications have been read' : 'You have no notifications'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map(notification => {
              const colors = getPriorityColor(notification.priority);
              const icon = getNotificationIcon(notification.type);
              
              return (
                <div
                  key={notification.id}
                  className={`bg-white border-2 rounded-xl p-5 transition-all hover:shadow-lg ${colors.border} ${!notification.read ? 'ring-2 ring-offset-2' : ''}`}
                  style={!notification.read ? { '--tw-ring-color': BLUE } as React.CSSProperties : {}}
                >
                  <div className="flex gap-4">
                    {/* Left accent bar */}
                    <div className={`w-1 rounded-full flex-shrink-0 ${colors.dot}`}></div>

                    {/* Icon and content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{icon}</span>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${colors.badge}`}>
                                {notification.priority.toUpperCase()} PRIORITY
                              </span>
                              {!notification.read && (
                                <span className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                                  <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
                                  NEW
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500 font-medium whitespace-nowrap">
                          {new Date(notification.created_at).toLocaleDateString('en-ZA', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>

                      {/* Message */}
                      <p className="text-gray-900 font-semibold mb-3 leading-relaxed">
                        {notification.message}
                      </p>

                      {/* Member info */}
                      <div className="bg-gray-50 rounded-lg p-3 mb-3 border border-gray-200">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-gray-600 text-xs font-bold uppercase tracking-wide mb-1">Member</p>
                            <p className="text-gray-900 font-semibold">{notification.member_name}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 text-xs font-bold uppercase tracking-wide mb-1">Phone</p>
                            <p className="text-gray-900 font-semibold">{notification.member_phone}</p>
                          </div>
                        </div>
                      </div>

                      {/* Metadata */}
                      {notification.metadata && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                          <div className="space-y-1.5 text-sm">
                            {notification.metadata.progress_percent !== undefined && (
                              <div className="flex items-center justify-between">
                                <span className="text-blue-900 font-semibold">Progress</span>
                                <div className="flex items-center gap-2">
                                  <div className="w-24 h-2 bg-blue-200 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-blue-600 rounded-full transition-all"
                                      style={{ width: `${notification.metadata.progress_percent}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-blue-700 font-bold text-xs">{notification.metadata.progress_percent.toFixed(0)}%</span>
                                </div>
                              </div>
                            )}
                            {notification.metadata.missing_fields && notification.metadata.missing_fields.length > 0 && (
                              <p className="text-blue-900">
                                <span className="font-semibold">Missing Fields:</span> {notification.metadata.missing_fields.join(', ')}
                              </p>
                            )}
                            {notification.metadata.action && (
                              <p className="text-red-700 font-semibold">
                                <span className="material-symbols-outlined text-sm align-middle mr-1">info</span>
                                Action: {notification.metadata.action.replace(/_/g, ' ').toUpperCase()}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-shrink-0">
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
                          title="Mark as read"
                        >
                          <span className="material-symbols-outlined">done</span>
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete"
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
