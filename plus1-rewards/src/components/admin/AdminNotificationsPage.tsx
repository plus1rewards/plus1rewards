import { useEffect, useState } from 'react';
import { supabaseAdmin } from '../../lib/supabase';

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

interface CategoryGroup {
  title: string;
  icon: string;
  color: string;
  notifications: AdminNotification[];
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

  const categorizeNotifications = (notifs: AdminNotification[]): CategoryGroup[] => {
    const categories: Record<string, CategoryGroup> = {
      suspended: {
        title: 'Policy Suspensions',
        icon: '🚫',
        color: '#dc2626',
        notifications: []
      },
      profile: {
        title: 'Profile Alerts',
        icon: '⚠️',
        color: '#f59e0b',
        notifications: []
      },
      unsuspended: {
        title: 'Policy Reactivations',
        icon: '✅',
        color: '#10b981',
        notifications: []
      },
      dependant: {
        title: 'Dependant Requests',
        icon: '👨‍👩‍👧',
        color: '#3b82f6',
        notifications: []
      },
      other: {
        title: 'Other Notifications',
        icon: '💡',
        color: '#6366f1',
        notifications: []
      }
    };

    notifs.forEach(notif => {
      if (notif.type.includes('suspended')) {
        categories.suspended.notifications.push(notif);
      } else if (notif.type.includes('profile')) {
        categories.profile.notifications.push(notif);
      } else if (notif.type.includes('unsuspended')) {
        categories.unsuspended.notifications.push(notif);
      } else if (notif.type.includes('dependant')) {
        categories.dependant.notifications.push(notif);
      } else {
        categories.other.notifications.push(notif);
      }
    });

    return Object.values(categories).filter(cat => cat.notifications.length > 0);
  };

  const getFilteredNotifications = () => {
    if (filter === 'unread') return notifications.filter(n => !n.read);
    if (filter === 'high') return notifications.filter(n => n.priority === 'high');
    return notifications;
  };

  const getPriorityBadge = (priority: string) => {
    const styles: Record<string, { bg: string; text: string; border: string }> = {
      high: { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' },
      medium: { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
      low: { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' }
    };
    return styles[priority] || styles.low;
  };

  const filteredNotifications = getFilteredNotifications();
  const categories = categorizeNotifications(filteredNotifications);
  const unreadCount = notifications.filter(n => !n.read).length;
  const highPriorityCount = notifications.filter(n => n.priority === 'high').length;

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
        <div style={{ width: '50px', height: '50px', borderRadius: '50%', border: '4px solid #e5e7eb', borderTopColor: 'var(--blue)', margin: '0 auto 1rem', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--gray-text)', fontSize: '1rem', fontWeight: 600 }}>Loading notifications...</p>
      </div>
    );
  }

  return (
    <div style={{ background: '#f5f8fc', borderRadius: '12px', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '2rem', background: '#fff', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: '#111827' }}>🔔 Notifications Center</h1>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.95rem', color: '#6b7280' }}>
              {unreadCount} unread • {highPriorityCount} high priority • {notifications.length} total
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              style={{
                background: 'var(--blue)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '0.75rem 1.5rem',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
              onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
            >
              ✓ Mark All as Read
            </button>
          )}
        </div>

        {/* Filter buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {[
            { key: 'all', label: 'All', icon: '📋', count: notifications.length },
            { key: 'unread', label: 'Unread', icon: '🔔', count: unreadCount },
            { key: 'high', label: 'High Priority', icon: '🚨', count: highPriorityCount }
          ].map(btn => (
            <button
              key={btn.key}
              onClick={() => setFilter(btn.key as any)}
              style={{
                background: filter === btn.key ? 'var(--blue)' : '#f3f4f6',
                color: filter === btn.key ? '#fff' : '#374151',
                border: 'none',
                borderRadius: '8px',
                padding: '0.6rem 1.2rem',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s'
              }}
            >
              <span>{btn.icon}</span>
              {btn.label}
              <span style={{
                background: filter === btn.key ? 'rgba(255,255,255,0.3)' : '#e5e7eb',
                color: filter === btn.key ? '#fff' : '#374151',
                borderRadius: '12px',
                padding: '0.2rem 0.6rem',
                fontSize: '0.8rem',
                fontWeight: 700
              }}>
                {btn.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '2rem' }}>
        {filteredNotifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#fff', borderRadius: '12px' }}>
            <p style={{ fontSize: '3rem', margin: '0 0 1rem 0' }}>📭</p>
            <p style={{ color: '#374151', fontWeight: 700, fontSize: '1.1rem', margin: '0 0 0.5rem 0' }}>No notifications</p>
            <p style={{ color: '#6b7280', fontSize: '0.95rem', margin: 0 }}>
              {filter === 'unread' ? 'All notifications have been read' : 'You have no notifications'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {categories.map((category, catIndex) => (
              <div key={catIndex}>
                {/* Category Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: `2px solid ${category.color}40` }}>
                  <span style={{ fontSize: '1.5rem' }}>{category.icon}</span>
                  <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#111827' }}>
                    {category.title}
                  </h2>
                  <span style={{
                    marginLeft: 'auto',
                    background: category.color + '20',
                    color: category.color,
                    padding: '0.3rem 0.8rem',
                    borderRadius: '20px',
                    fontSize: '0.85rem',
                    fontWeight: 700
                  }}>
                    {category.notifications.length}
                  </span>
                </div>

                {/* Notifications in category */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {category.notifications.map(notification => {
                    const priorityStyle = getPriorityBadge(notification.priority);
                    return (
                      <div
                        key={notification.id}
                        style={{
                          background: '#fff',
                          border: `2px solid ${priorityStyle.border}`,
                          borderRadius: '10px',
                          padding: '1.25rem',
                          display: 'flex',
                          gap: '1rem',
                          alignItems: 'flex-start',
                          transition: 'all 0.2s',
                          opacity: notification.read ? 0.7 : 1
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)')}
                        onMouseOut={(e) => (e.currentTarget.style.boxShadow = 'none')}
                      >
                        {/* Left indicator */}
                        <div style={{
                          width: '4px',
                          height: '100%',
                          background: category.color,
                          borderRadius: '2px',
                          flexShrink: 0,
                          minHeight: '80px'
                        }} />

                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                            <span style={{
                              background: priorityStyle.bg,
                              color: priorityStyle.text,
                              padding: '0.35rem 0.85rem',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              border: `1px solid ${priorityStyle.border}`
                            }}>
                              {notification.priority} Priority
                            </span>
                            {!notification.read && (
                              <span style={{
                                width: '10px',
                                height: '10px',
                                background: 'var(--blue)',
                                borderRadius: '50%',
                                animation: 'pulse 2s infinite'
                              }} />
                            )}
                            <span style={{
                              marginLeft: 'auto',
                              fontSize: '0.8rem',
                              color: '#9ca3af',
                              fontWeight: 500
                            }}>
                              {new Date(notification.created_at).toLocaleDateString('en-ZA', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>

                          <p style={{ margin: '0 0 0.75rem 0', fontWeight: 700, color: '#111827', fontSize: '1rem', lineHeight: '1.4' }}>
                            {notification.message}
                          </p>

                          <div style={{ background: '#f9fafb', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '0.75rem' }}>
                            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#6b7280' }}>
                              <strong style={{ color: '#374151' }}>Member:</strong> {notification.member_name}
                            </p>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280' }}>
                              <strong style={{ color: '#374151' }}>Phone:</strong> {notification.member_phone}
                            </p>
                          </div>

                          {/* Metadata */}
                          {notification.metadata && (
                            <div style={{ background: '#f0f9ff', padding: '0.75rem 1rem', borderRadius: '8px', borderLeft: `3px solid var(--blue)` }}>
                              {notification.metadata.progress_percent !== undefined && (
                                <p style={{ margin: '0 0 0.4rem 0', fontSize: '0.85rem', color: '#1e40af' }}>
                                  <strong>Progress:</strong> {notification.metadata.progress_percent.toFixed(0)}%
                                </p>
                              )}
                              {notification.metadata.missing_fields && notification.metadata.missing_fields.length > 0 && (
                                <p style={{ margin: '0 0 0.4rem 0', fontSize: '0.85rem', color: '#1e40af' }}>
                                  <strong>Missing Fields:</strong> {notification.metadata.missing_fields.join(', ')}
                                </p>
                              )}
                              {notification.metadata.action && (
                                <p style={{ margin: 0, fontSize: '0.85rem', color: '#dc2626', fontWeight: 700 }}>
                                  <strong>Action Taken:</strong> {notification.metadata.action.replace(/_/g, ' ').toUpperCase()}
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, flexDirection: 'column' }}>
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              style={{
                                background: 'transparent',
                                border: '1px solid #d1d5db',
                                color: '#374151',
                                borderRadius: '6px',
                                padding: '0.5rem 0.75rem',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                whiteSpace: 'nowrap'
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.background = '#f3f4f6';
                                e.currentTarget.style.borderColor = '#9ca3af';
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.borderColor = '#d1d5db';
                              }}
                            >
                              ✓ Read
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            style={{
                              background: 'transparent',
                              border: '1px solid #fecaca',
                              color: '#dc2626',
                              borderRadius: '6px',
                              padding: '0.5rem 0.75rem',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              whiteSpace: 'nowrap'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.background = '#fee2e2';
                              e.currentTarget.style.borderColor = '#f87171';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.borderColor = '#fecaca';
                            }}
                          >
                              ✕ Delete
                            </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
