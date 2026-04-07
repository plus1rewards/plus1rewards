import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface MemberNotification {
  id: string;
  type: string;
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

interface MemberNotificationsProps {
  memberId: string;
}

export default function MemberNotifications({ memberId }: MemberNotificationsProps) {
  const [notifications, setNotifications] = useState<MemberNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'high'>('all');

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [memberId]);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_notifications')
        .select('*')
        .eq('member_id', memberId)
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
      await supabase
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
      await supabase
        .from('admin_notifications')
        .update({ read: true })
        .eq('member_id', memberId)
        .eq('read', false);

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
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
        return 'bg-red-100 text-red-700 border-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      default:
        return 'bg-blue-100 text-blue-700 border-blue-300';
    }
  };

  const getNotificationIcon = (type: string) => {
    if (type.includes('suspended')) return '🚨';
    if (type.includes('profile')) return '⚠️';
    if (type.includes('complete')) return '✅';
    return '💡';
  };

  const filteredNotifications = getFilteredNotifications();
  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1a558b]/20 border-t-[#1a558b] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with filters */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
          <p className="text-sm text-gray-600">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-sm font-bold text-[#1a558b] hover:text-[#1a558b]/80 transition-colors"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Filter buttons */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'all', label: 'All', icon: '📋' },
          { key: 'unread', label: 'Unread', icon: '🔔', count: unreadCount },
          { key: 'high', label: 'High Priority', icon: '🚨' }
        ].map(btn => (
          <button
            key={btn.key}
            onClick={() => setFilter(btn.key as any)}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${
              filter === btn.key
                ? 'bg-[#1a558b] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>{btn.icon}</span>
            {btn.label}
            {btn.count !== undefined && btn.count > 0 && (
              <span className="ml-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {btn.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notifications list */}
      {filteredNotifications.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
          <span className="text-4xl mb-4 block">📭</span>
          <h3 className="text-gray-900 font-bold text-lg mb-2">No notifications</h3>
          <p className="text-gray-600">
            {filter === 'unread' ? 'You have read all notifications' : 'You have no notifications'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map(notification => (
            <div
              key={notification.id}
              className={`bg-white border-2 rounded-xl p-4 transition-all cursor-pointer hover:shadow-md ${
                notification.read
                  ? 'border-gray-200 opacity-75'
                  : 'border-[#1a558b] bg-gradient-to-r from-blue-50 to-transparent'
              }`}
              onClick={() => !notification.read && markAsRead(notification.id)}
            >
              <div className="flex items-start gap-4">
                <div className="text-2xl flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${getPriorityColor(notification.priority)}`}>
                      {notification.priority.toUpperCase()}
                    </span>
                    {!notification.read && (
                      <span className="w-2 h-2 bg-[#1a558b] rounded-full"></span>
                    )}
                  </div>
                  <p className="text-gray-900 font-bold mb-1">{notification.message}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(notification.created_at).toLocaleDateString('en-ZA', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>

                  {/* Metadata display */}
                  {notification.metadata && (
                    <div className="mt-3 pt-3 border-t border-gray-200 space-y-1">
                      {notification.metadata.progress_percent !== undefined && (
                        <p className="text-sm text-gray-600">
                          Progress: <span className="font-bold">{notification.metadata.progress_percent.toFixed(0)}%</span>
                        </p>
                      )}
                      {notification.metadata.missing_fields && notification.metadata.missing_fields.length > 0 && (
                        <p className="text-sm text-gray-600">
                          Missing: <span className="font-bold">{notification.metadata.missing_fields.join(', ')}</span>
                        </p>
                      )}
                      {notification.metadata.action && (
                        <p className="text-sm text-red-600 font-bold">
                          Action: {notification.metadata.action}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                {!notification.read && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead(notification.id);
                    }}
                    className="text-[#1a558b] hover:text-[#1a558b]/80 flex-shrink-0 mt-1"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
