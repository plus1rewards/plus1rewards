import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { getSession } from '../lib/session';

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

interface MemberTopUpChatProps {
  onClose?: () => void;
}

export default function MemberTopUpChat({ onClose }: MemberTopUpChatProps) {
  const [loading, setLoading] = useState(true);
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (conversation) {
      const interval = setInterval(() => loadMessages(conversation.id), 3000);
      return () => clearInterval(interval);
    }
  }, [conversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // Get member ID from session
      const session = getSession('member');
      let memberId = session?.member?.id;

      if (!memberId) {
        console.warn('No member session found');
        setLoading(false);
        return;
      }

      console.log('Member ID:', memberId);
      await loadOrCreateConversation(memberId);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrCreateConversation = async (memberId: string) => {
    try {
      console.log('Loading or creating conversation for member:', memberId);
      
      const { data: existingConversation, error: selectError } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('member_id', memberId)
        .in('status', ['open', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (selectError && selectError.code !== 'PGRST116') {
        console.error('Error fetching conversation:', selectError);
      }

      if (existingConversation) {
        console.log('Found existing conversation:', existingConversation.id);
        setConversation(existingConversation);
        await loadMessages(existingConversation.id);
      } else {
        console.log('Creating new conversation for member:', memberId);
        const { data: newConversation, error: insertError } = await supabase
          .from('chat_conversations')
          .insert([{
            member_id: memberId,
            subject: 'Top-Up Payment Assistance',
            status: 'open',
            priority: 'normal'
          }])
          .select()
          .single();

        if (insertError) {
          console.error('Error creating conversation:', insertError);
          return;
        }

        if (newConversation) {
          console.log('Created new conversation:', newConversation.id);
          setConversation(newConversation);
          await sendInitialMessage(newConversation.id, memberId);
        }
      }
    } catch (error) {
      console.error('Error in loadOrCreateConversation:', error);
    }
  };

  const sendInitialMessage = async (conversationId: string, memberId: string) => {
    try {
      await supabase
        .from('chat_messages')
        .insert([{
          conversation_id: conversationId,
          sender_type: 'member',
          sender_id: memberId,
          message: 'Hi, I need help with my top-up payment.',
          is_read: false
        }]);

      await loadMessages(conversationId);
    } catch (error) {
      console.error('Error sending initial message:', error);
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !conversation) {
      return;
    }

    setSending(true);
    try {
      const session = getSession('member');
      const senderId = session?.member?.id;

      if (!senderId) {
        alert('Unable to identify user');
        setSending(false);
        return;
      }

      const { error } = await supabase
        .from('chat_messages')
        .insert([{
          conversation_id: conversation.id,
          sender_type: 'member',
          sender_id: senderId,
          message: newMessage.trim(),
          is_read: false
        }]);

      if (error) {
        console.error('Error sending message:', error);
        alert('Failed to send message');
        return;
      }

      setNewMessage('');
      await loadMessages(conversation.id);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1a558b]/20 border-t-[#1a558b] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
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
              <p className="text-gray-500">No messages yet. Start the conversation below.</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender_type === 'member' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-4 py-3 rounded-lg ${
                  msg.sender_type === 'member'
                    ? 'bg-[#1a558b] text-white rounded-br-none'
                    : 'bg-white border border-gray-200 text-gray-900 rounded-bl-none'
                }`}
              >
                <p className="text-sm">{msg.message}</p>
                <p className={`text-xs mt-1 ${msg.sender_type === 'member' ? 'text-[#1a558b]/60' : 'text-gray-500'}`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      {conversation && (conversation.status === 'open' || conversation.status === 'in_progress') ? (
        <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-4 bg-white rounded-b-xl">
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
        <div className="border-t border-gray-200 p-4 bg-gray-50 text-center rounded-b-xl">
          <p className="text-sm text-gray-600">{conversation ? 'This conversation has been closed.' : 'Loading...'}</p>
        </div>
      )}
    </div>
  );
}
