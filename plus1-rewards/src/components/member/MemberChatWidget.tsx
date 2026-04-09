// Modern, friendly chat widget for members to chat with admin
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { getSession } from '../../lib/session';
import ChatFeedbackModal from './ChatFeedbackModal';

interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_type: 'member' | 'admin';
  message: string;
  created_at: string;
  read: boolean;
}

interface ChatConversation {
  id: string;
  member_id: string;
  status: 'open' | 'closed';
  feedback_requested: boolean;
  feedback_requested_at?: string;
  created_at: string;
  updated_at: string;
}

interface MemberChatWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  memberName?: string;
}

export default function MemberChatWidget({ isOpen, onClose, memberName = 'there' }: MemberChatWidgetProps) {
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadOrCreateConversation();
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (conversation) {
      console.log('🔗 Setting up subscriptions for conversation:', conversation.id);
      loadMessages(conversation.id);
      
      // Subscribe to new messages and conversation updates
      const channel = supabase
        .channel(`chat:${conversation.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `conversation_id=eq.${conversation.id}`
          },
          (payload) => {
            console.log('💬 New message received:', payload.new);
            const newMsg = payload.new as ChatMessage;
            setMessages(prev => [...prev, newMsg]);
            scrollToBottom();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'chat_conversations',
            filter: `id=eq.${conversation.id}`
          },
          (payload) => {
            console.log('🔄 Conversation updated:', payload.new);
            const updatedConvo = payload.new as ChatConversation;
            setConversation(updatedConvo);
            
            // Check if feedback was requested
            if (updatedConvo.feedback_requested && updatedConvo.status === 'closed') {
              console.log('📢 Feedback requested! Status:', updatedConvo.status, 'Feedback requested:', updatedConvo.feedback_requested);
              checkAndShowFeedback(updatedConvo.id);
            }
          }
        )
        .subscribe((status) => {
          console.log('📡 Subscription status:', status);
        });

      return () => {
        console.log('🔌 Cleaning up subscriptions');
        supabase.removeChannel(channel);
      };
    }
  }, [conversation]);

  const checkAndShowFeedback = async (conversationId: string) => {
    console.log('🔍 Checking feedback for conversation:', conversationId);
    try {
      const session = getSession();
      if (!session?.member?.id) {
        console.log('❌ No session found');
        return;
      }

      console.log('👤 Member ID:', session.member.id);

      // Check if feedback already exists
      const { data: existingFeedback, error: feedbackError } = await supabase
        .from('chat_feedback')
        .select('id')
        .eq('conversation_id', conversationId)
        .eq('member_id', session.member.id)
        .maybeSingle();

      if (feedbackError) {
        console.error('❌ Error checking feedback:', feedbackError);
        return;
      }

      console.log('📊 Existing feedback:', existingFeedback);

      if (!existingFeedback) {
        console.log('✅ No feedback found - showing modal');
        setShowFeedbackModal(true);
      } else {
        console.log('⏭️ Feedback already exists - skipping modal');
      }
    } catch (error) {
      console.error('❌ Error checking feedback:', error);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadOrCreateConversation = async () => {
    if (isLoadingConversation) {
      console.log('⏸️ Already loading conversation, skipping...');
      return;
    }
    
    setIsLoadingConversation(true);
    setLoading(true);
    
    try {
      const session = getSession();
      if (!session?.member?.id) {
        console.log('❌ No session found');
        return;
      }

      const memberId = session.member.id;
      console.log('👤 Loading conversation for member:', memberId);

      // Try to find existing OPEN conversation
      const { data: openConvo, error: fetchError } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('member_id', memberId)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) {
        console.error('❌ Error fetching conversation:', fetchError);
        throw fetchError;
      }

      if (openConvo) {
        console.log('📝 Loaded existing open conversation:', openConvo);
        setConversation(openConvo);
      } else {
        console.log('➕ No open conversation found - creating new one...');
        // Create new conversation (don't load closed ones)
        const { data: newConvo, error } = await supabase
          .from('chat_conversations')
          .insert([{
            member_id: memberId,
            status: 'open',
            feedback_requested: false
          }])
          .select()
          .single();

        if (error) {
          console.error('❌ Error creating conversation:', error);
          throw error;
        }
        
        console.log('✅ Created new conversation:', newConvo);
        setConversation(newConvo);
      }
    } catch (error) {
      console.error('❌ Error loading conversation:', error);
    } finally {
      setLoading(false);
      setIsLoadingConversation(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (data) {
        setMessages(data);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !conversation || sending) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert([{
          conversation_id: conversation.id,
          sender_type: 'member',
          message: newMessage.trim()
        }]);

      if (error) throw error;

      // Update conversation timestamp
      await supabase
        .from('chat_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversation.id);

      setNewMessage('');
      inputRef.current?.focus();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[600px] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1a558b] via-[#2563eb] to-[#1a558b] p-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/30">
                  <span className="material-symbols-outlined text-3xl">support_agent</span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div>
                <h3 className="text-xl font-bold">Plus1 Support Team</h3>
                <p className="text-white/80 text-sm flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  Online • Usually replies instantly
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center transition-all hover:rotate-90 duration-300"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-gray-50 to-white">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-[#1a558b]/20 border-t-[#1a558b] rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500">Loading chat...</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-4xl text-[#1a558b]">waving_hand</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Hey {memberName}! 👋</h3>
              <p className="text-gray-600 max-w-sm mb-6">
                Welcome to Plus1 Support! We're here to help with anything you need. 
                Ask us about payments, cover plans, or anything else!
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {['Help with top-up', 'Cover plan question', 'Transaction issue'].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setNewMessage(suggestion)}
                    className="px-4 py-2 bg-white border-2 border-gray-200 hover:border-[#1a558b] hover:bg-[#1a558b]/5 rounded-full text-sm font-medium text-gray-700 hover:text-[#1a558b] transition-all"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, index) => {
                const isAdmin = msg.sender_type === 'admin';
                const showAvatar = index === 0 || messages[index - 1].sender_type !== msg.sender_type;
                
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${isAdmin ? 'justify-start' : 'justify-end'} animate-in slide-in-from-bottom-2 duration-300`}
                  >
                    {isAdmin && showAvatar && (
                      <div className="w-8 h-8 bg-gradient-to-br from-[#1a558b] to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                        <span className="material-symbols-outlined text-white text-sm">support_agent</span>
                      </div>
                    )}
                    {isAdmin && !showAvatar && <div className="w-8"></div>}
                    
                    <div className={`flex flex-col ${isAdmin ? 'items-start' : 'items-end'} max-w-[70%]`}>
                      <div
                        className={`px-4 py-3 rounded-2xl shadow-sm ${
                          isAdmin
                            ? 'bg-white border border-gray-200 text-gray-900 rounded-tl-sm'
                            : 'bg-gradient-to-r from-[#1a558b] to-blue-600 text-white rounded-tr-sm'
                        }`}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.message}</p>
                      </div>
                      <span className={`text-xs text-gray-500 mt-1 px-1 ${isAdmin ? 'text-left' : 'text-right'}`}>
                        {formatTime(msg.created_at)}
                      </span>
                    </div>
                    
                    {!isAdmin && showAvatar && (
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                        <span className="material-symbols-outlined text-white text-sm">person</span>
                      </div>
                    )}
                    {!isAdmin && !showAvatar && <div className="w-8"></div>}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-200">
          {conversation?.status === 'closed' ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-600 mb-2">This conversation has been closed</p>
              {conversation.feedback_requested && (
                <button
                  onClick={() => setShowFeedbackModal(true)}
                  className="text-sm text-[#1a558b] hover:underline font-medium"
                >
                  Leave feedback
                </button>
              )}
            </div>
          ) : (
            <>
              <form onSubmit={handleSendMessage} className="flex gap-3">
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    disabled={sending}
                    className="w-full px-4 py-3 pr-12 bg-gray-50 border-2 border-gray-200 rounded-full focus:outline-none focus:border-[#1a558b] focus:bg-white transition-all text-sm disabled:opacity-50"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
                  >
                    <span className="material-symbols-outlined text-gray-600 text-lg">mood</span>
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="w-12 h-12 bg-gradient-to-r from-[#1a558b] to-blue-600 hover:from-[#1a558b]/90 hover:to-blue-600/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full flex items-center justify-center transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                >
                  {sending ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <span className="material-symbols-outlined">send</span>
                  )}
                </button>
              </form>
              <p className="text-xs text-gray-500 text-center mt-2">
                We typically respond within a few minutes during business hours
              </p>
            </>
          )}
        </div>
      </div>

      {/* Feedback Modal */}
      {conversation && (
        <ChatFeedbackModal
          isOpen={showFeedbackModal}
          onClose={() => setShowFeedbackModal(false)}
          conversationId={conversation.id}
          memberId={conversation.member_id}
        />
      )}
    </div>
  );
}
