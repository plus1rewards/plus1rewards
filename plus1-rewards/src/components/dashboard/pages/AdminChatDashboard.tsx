import { useEffect, useState, useRef } from 'react';
import { supabase } from '../../../lib/supabase';

interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_type: 'member' | 'admin';
  sender_id: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

interface ChatConversation {
  id: string;
  member_id: string;
  admin_id?: string;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

interface MemberInfo {
  id: string;
  full_name: string;
  email: string;
  cell_phone: string;
}

export default function AdminChatDashboard() {
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [memberInfo, setMemberInfo] = useState<MemberInfo | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
      loadMemberInfo(selectedConversation.member_id);
      const interval = setInterval(() => loadMessages(selectedConversation.id), 3000);
      return () => clearInterval(interval);
    }
  }, [selectedConversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      const { data: convos } = await supabase
        .from('chat_conversations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (convos) {
        setConversations(convos);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    setLoadingMessages(true);
    try {
      const { data: messagesData } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (messagesData) {
        setMessages(messagesData);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const loadMemberInfo = async (memberId: string) => {
    try {
      const { data: member } = await supabase
        .from('members')
        .select('id, full_name, email, cell_phone')
        .eq('id', memberId)
        .single();

      if (member) {
        setMemberInfo(member);
      }
    } catch (error) {
      console.error('Error loading member info:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !selectedConversation) {
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert([{
          conversation_id: selectedConversation.id,
          sender_type: 'admin',
          sender_id: 'admin',
          message: newMessage.trim(),
          is_read: false
        }]);

      if (error) {
        console.error('Error sending message:', error);
        alert('Failed to send message');
        return;
      }

      setNewMessage('');
      await loadMessages(selectedConversation.id);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const updateConversationStatus = async (conversationId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('chat_conversations')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      if (error) {
        console.error('Error updating status:', error);
        return;
      }

      if (selectedConversation?.id === conversationId) {
        setSelectedConversation({ ...selectedConversation, status: newStatus as any });
      }
      await loadConversations();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1a558b]/20 border-t-[#1a558b] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-80 border-r border-gray-200 bg-white overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Chat Conversations</h2>
          <p className="text-sm text-gray-500 mt-1">{conversations.length} conversations</p>
        </div>

        <div className="divide-y divide-gray-200">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <p>No conversations yet</p>
            </div>
          ) : (
            conversations.map((convo) => (
              <button
                key={convo.id}
                onClick={() => setSelectedConversation(convo)}
                className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                  selectedConversation?.id === convo.id ? 'bg-blue-50 border-l-4 border-[#1a558b]' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 text-sm">{convo.subject}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    convo.status === 'open' ? 'bg-green-100 text-green-800' :
                    convo.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    convo.status === 'resolved' ? 'bg-gray-100 text-gray-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {convo.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {new Date(convo.created_at).toLocaleDateString()} {new Date(convo.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{selectedConversation.subject}</h2>
                  {memberInfo && (
                    <div className="mt-2 text-sm text-gray-600">
                      <p><strong>Member:</strong> {memberInfo.full_name}</p>
                      <p><strong>Email:</strong> {memberInfo.email}</p>
                      <p><strong>Phone:</strong> {memberInfo.cell_phone}</p>
                    </div>
                  )}
                </div>
                <select
                  value={selectedConversation.status}
                  onChange={(e) => updateConversationStatus(selectedConversation.id, e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1a558b] focus:border-transparent"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {loadingMessages && messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-8 h-8 border-4 border-[#1a558b]/20 border-t-[#1a558b] rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-gray-600 text-sm">Loading messages...</p>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">chat_bubble_outline</span>
                    <p className="text-gray-500">No messages yet</p>
                  </div>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-md px-4 py-3 rounded-lg ${
                        msg.sender_type === 'admin'
                          ? 'bg-[#1a558b] text-white rounded-br-none'
                          : 'bg-white border border-gray-200 text-gray-900 rounded-bl-none'
                      }`}
                    >
                      <p className="text-sm">{msg.message}</p>
                      <p className={`text-xs mt-1 ${msg.sender_type === 'admin' ? 'text-[#1a558b]/60' : 'text-gray-500'}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {selectedConversation.status === 'open' || selectedConversation.status === 'in_progress' ? (
              <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-4 bg-white">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    disabled={sending}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a558b] focus:border-transparent text-sm disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={sending || !newMessage.trim()}
                    className="bg-[#1a558b] hover:bg-[#1a558b]/90 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">{sending ? 'hourglass_empty' : 'send'}</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="border-t border-gray-200 p-4 bg-gray-50 text-center">
                <p className="text-sm text-gray-600">This conversation is {selectedConversation.status}.</p>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">chat_bubble_outline</span>
              <p className="text-gray-500 text-lg">Select a conversation to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
