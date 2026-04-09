/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  Search, 
  Phone, 
  MoreVertical, 
  Paperclip, 
  Image as ImageIcon, 
  Smile, 
  Send, 
  Mic, 
  Play, 
  Pause,
  ChevronDown, 
  X,
  FileText,
  XCircle,
  Trash2,
  MessageSquarePlus,
  Square
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { supabaseAdmin } from '../../../lib/supabase';

interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_type: 'member' | 'admin';
  message: string;
  created_at: string;
  read: boolean;
  attachment_url?: string;
  attachment_type?: 'file' | 'image' | 'video' | 'voice';
  attachment_name?: string;
}

interface ChatConversation {
  id: string;
  member_id: string;
  status: 'open' | 'closed';
  feedback_requested: boolean;
  feedback_requested_at?: string;
  created_at: string;
  updated_at: string;
  member?: {
    id: string;
    name: string;
    phone: string;
  };
  unread_count?: number;
  last_message?: string;
  last_message_time?: string;
  last_message_thumbnail?: string | null;
}

export default function App() {
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadConversations();
    
    // Set up real-time subscription
    const channel = supabaseAdmin
      .channel('admin-chat')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_conversations'
        },
        () => {
          loadConversations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages'
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          if (selectedConversation && newMsg.conversation_id === selectedConversation.id) {
            setMessages(prev => [...prev, newMsg]);
            scrollToBottom();
          }
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabaseAdmin.removeChannel(channel);
    };
  }, [selectedConversation]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  const loadConversations = async () => {
    try {
      const { data: convos, error } = await supabaseAdmin
        .from('chat_conversations')
        .select(`
          *,
          member:members!chat_conversations_member_id_fkey (
            id,
            first_name,
            last_name,
            cell_phone
          )
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const conversationsWithDetails = await Promise.all(
        (convos || []).map(async (convo) => {
          const { data: lastMsg } = await supabaseAdmin
            .from('chat_messages')
            .select('message, created_at, sender_type, attachment_url, attachment_type')
            .eq('conversation_id', convo.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          const { count: unreadCount } = await supabaseAdmin
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', convo.id)
            .eq('sender_type', 'member')
            .eq('read', false);

          return {
            ...convo,
            member: convo.member ? {
              id: convo.member.id,
              name: `${convo.member.first_name || ''} ${convo.member.last_name || ''}`.trim() || 'Unknown Member',
              phone: convo.member.cell_phone || 'No phone'
            } : undefined,
            last_message: lastMsg?.message || 'No messages yet',
            last_message_time: lastMsg?.created_at,
            last_message_thumbnail: lastMsg?.attachment_type === 'image' ? lastMsg.attachment_url : null,
            unread_count: unreadCount || 0
          };
        })
      );

      setConversations(conversationsWithDetails);
      
      if (!selectedConversation && conversationsWithDetails.length > 0) {
        setSelectedConversation(conversationsWithDetails[0]);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);

      // Mark messages as read
      await supabaseAdmin
        .from('chat_messages')
        .update({ read: true })
        .eq('conversation_id', conversationId)
        .eq('sender_type', 'member')
        .eq('read', false);

      loadConversations();
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if ((!inputText.trim() && !selectedImage) || !selectedConversation || sending) return;

    setSending(true);
    try {
      let attachmentUrl = null;
      let attachmentType = null;

      if (selectedImage) {
        attachmentUrl = await uploadFile(selectedImage);
        if (!attachmentUrl) throw new Error('Failed to upload image');
        attachmentType = selectedImage.type.startsWith('video/') ? 'video' : 'image';
      }

      const messageText = inputText.trim() || (attachmentType === 'image' ? '📷 Image' : '🎥 Video');

      const { error } = await supabaseAdmin
        .from('chat_messages')
        .insert([{
          conversation_id: selectedConversation.id,
          sender_type: 'admin',
          message: messageText,
          attachment_url: attachmentUrl,
          attachment_type: attachmentType,
          attachment_name: selectedImage?.name,
          read: true
        }]);

      if (error) throw error;

      await supabaseAdmin
        .from('chat_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', selectedConversation.id);

      setInputText('');
      setSelectedImage(null);
      setImagePreview(null);
      await loadMessages(selectedConversation.id);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `chat-attachments/${selectedConversation?.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabaseAdmin.storage
        .from('documents')
        .upload(fileName, file, {
          contentType: file.type,
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('documents')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedConversation) return;

    const type = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'file';
    
    if (type === 'image' || type === 'video') {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setIsAttachmentMenuOpen(false);
      if (e.target) e.target.value = '';
      return;
    }

    // For files, upload immediately
    setUploadingFile(true);
    setIsAttachmentMenuOpen(false);

    try {
      const fileUrl = await uploadFile(file);
      if (!fileUrl) throw new Error('Failed to upload file');

      const { error } = await supabaseAdmin
        .from('chat_messages')
        .insert([{
          conversation_id: selectedConversation.id,
          sender_type: 'admin',
          message: `📎 Sent ${file.name}`,
          attachment_url: fileUrl,
          attachment_type: 'file',
          attachment_name: file.name,
          read: true
        }]);

      if (error) throw error;

      await supabaseAdmin
        .from('chat_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', selectedConversation.id);

      await loadMessages(selectedConversation.id);
    } catch (error) {
      console.error('Error sending file:', error);
      alert('Failed to send file. Please try again.');
    } finally {
      setUploadingFile(false);
      if (e.target) e.target.value = '';
    }
  };

  const cancelImagePreview = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const toggleAudioPlayback = (messageId: string, audioUrl: string) => {
    const audio = audioRefs.current[messageId];
    
    if (!audio) {
      const newAudio = new Audio(audioUrl);
      audioRefs.current[messageId] = newAudio;
      
      newAudio.onended = () => {
        setPlayingAudio(null);
      };
      
      newAudio.play();
      setPlayingAudio(messageId);
    } else {
      if (playingAudio === messageId) {
        audio.pause();
        audio.currentTime = 0;
        setPlayingAudio(null);
      } else {
        audio.play();
        setPlayingAudio(messageId);
      }
    }
  };

  const handleCloseConversation = async () => {
    if (!selectedConversation) return;

    try {
      await supabaseAdmin
        .from('chat_conversations')
        .update({ 
          status: 'closed',
          feedback_requested: false
        })
        .eq('id', selectedConversation.id);

      await loadConversations();
    } catch (error) {
      console.error('Error closing conversation:', error);
    }
  };

  const handleRequestFeedback = async () => {
    if (!selectedConversation) return;

    try {
      await supabaseAdmin
        .from('chat_conversations')
        .update({ 
          status: 'closed',
          feedback_requested: true,
          feedback_requested_at: new Date().toISOString()
        })
        .eq('id', selectedConversation.id);

      await loadConversations();
      alert('Feedback request sent! The conversation has been closed.');
    } catch (error) {
      console.error('Error requesting feedback:', error);
    }
  };

  const handleDeleteConversation = async () => {
    if (!selectedConversation || !confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) return;

    try {
      // Delete messages first
      await supabaseAdmin
        .from('chat_messages')
        .delete()
        .eq('conversation_id', selectedConversation.id);

      // Delete conversation
      await supabaseAdmin
        .from('chat_conversations')
        .delete()
        .eq('id', selectedConversation.id);

      setSelectedConversation(null);
      setMessages([]);
      await loadConversations();
    } catch (error) {
      console.error('Error deleting conversation:', error);
      alert('Failed to delete conversation. Please try again.');
    }
  };

  const startRecording = async () => {
    if (!selectedConversation) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `voice-note-${Date.now()}.webm`, { type: 'audio/webm' });
        
        setUploadingFile(true);
        try {
          const fileUrl = await uploadFile(audioFile);
          if (!fileUrl) throw new Error('Failed to upload voice note');

          const { error } = await supabaseAdmin
            .from('chat_messages')
            .insert([{
              conversation_id: selectedConversation.id,
              sender_type: 'admin',
              message: '🎤 Sent a voice note',
              attachment_url: fileUrl,
              attachment_type: 'voice',
              read: true
            }]);

          if (error) throw error;

          await supabaseAdmin
            .from('chat_conversations')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', selectedConversation.id);

          await loadMessages(selectedConversation.id);
        } catch (error) {
          console.error('Error sending voice note:', error);
          alert('Failed to send voice note. Please try again.');
        } finally {
          setUploadingFile(false);
        }
        
        setRecordingTime(0);
      };

      mediaRecorder.start();
      setIsRecording(true);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert('Failed to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimeAgo = (dateString?: string) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d`;
    
    return date.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' });
  };

  const filteredConversations = conversations.filter(convo => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      convo.member?.name?.toLowerCase().includes(query) ||
      convo.member?.phone?.toLowerCase().includes(query) ||
      convo.last_message?.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="flex h-screen w-full bg-white items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1a558b]/20 border-t-[#1a558b] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-white text-gray-900 font-sans overflow-hidden">
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="*/*" 
        onChange={handleFileUpload}
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={handleFileUpload}
      />
      
      {/* Sidebar */}
      <aside className="w-80 flex flex-col border-r border-gray-200 bg-gray-50">
        <div className="p-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#1a558b] transition-colors" />
            <input 
              type="text" 
              placeholder="Search conversations" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-1 focus:ring-[#1a558b]/20 focus:border-[#1a558b] transition-all outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 px-2">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <MessageSquarePlus className="w-12 h-12 text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">No conversations yet</p>
            </div>
          ) : (
            filteredConversations.map((convo) => (
              <ChatItem 
                key={convo.id}
                name={convo.member?.name || 'Unknown Member'} 
                message={convo.last_message || 'No messages'} 
                time={formatTimeAgo(convo.last_message_time)} 
                unread={convo.unread_count} 
                active={selectedConversation?.id === convo.id}
                status={convo.status === 'open' ? 'online' : undefined}
                initial={convo.member?.name?.charAt(0).toUpperCase() || 'M'}
                thumbnail={convo.last_message_thumbnail}
                onClick={() => setSelectedConversation(convo)}
              />
            ))
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      {selectedConversation ? (
        <main className="flex-1 flex flex-col relative bg-white">
          {/* Header */}
          <header className="h-16 flex items-center justify-between px-6 border-b border-gray-200 bg-white/80 backdrop-blur-md z-10">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-[#1a558b] flex items-center justify-center font-semibold text-white">
                  {selectedConversation.member?.name?.charAt(0).toUpperCase() || 'M'}
                </div>
                {selectedConversation.status === 'open' && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#00a63e] border-2 border-white rounded-full" />
                )}
              </div>
              <div>
                <h2 className="font-semibold text-sm text-gray-900">{selectedConversation.member?.name || 'Unknown Member'}</h2>
                <p className="text-xs text-gray-500">{selectedConversation.member?.phone || 'No phone'}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-gray-400">
              <button className="hover:text-[#1a558b] transition-colors"><Phone className="w-5 h-5" /></button>
              <button className="hover:text-[#1a558b] transition-colors"><Search className="w-5 h-5" /></button>
              <button className="hover:text-[#1a558b] transition-colors"><MoreVertical className="w-5 h-5" /></button>
            </div>
          </header>

          {/* Action Bar */}
          <div className="flex items-center gap-2 px-6 py-2 border-b border-gray-100 bg-gray-50/50">
            {selectedConversation.status === 'open' ? (
              <>
                <button 
                  onClick={handleCloseConversation}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors group"
                >
                  <XCircle className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#1a558b]" /> Close Conversation
                </button>
                <button 
                  onClick={handleDeleteConversation}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors group"
                >
                  <Trash2 className="w-3.5 h-3.5 text-gray-400 group-hover:text-red-500" /> Delete
                </button>
                <div className="flex-1" />
                <button 
                  onClick={handleRequestFeedback}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium text-white bg-[#00a63e] hover:bg-[#00a63e]/90 transition-colors shadow-sm"
                >
                  <MessageSquarePlus className="w-3.5 h-3.5" /> Request Feedback
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 px-3 py-1.5 bg-gray-100 rounded-lg">Conversation Closed</span>
                <button 
                  onClick={handleDeleteConversation}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors group"
                >
                  <Trash2 className="w-3.5 h-3.5 text-gray-400 group-hover:text-red-500" /> Delete
                </button>
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageSquarePlus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No messages in this conversation</p>
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <Message 
                  key={msg.id}
                  msg={msg}
                  selectedConversation={selectedConversation}
                  playingAudio={playingAudio}
                  toggleAudioPlayback={toggleAudioPlayback}
                />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          {selectedConversation.status === 'open' ? (
            <div className="p-4 bg-white border-t border-gray-100">
              {/* Image Preview */}
              {imagePreview && (
                <div className="mb-3 relative inline-block">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="max-h-32 rounded-lg border-2 border-gray-200"
                  />
                  <button
                    onClick={cancelImagePreview}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="max-w-4xl mx-auto relative flex items-center gap-3">
                <button 
                  onClick={() => setIsAttachmentMenuOpen(!isAttachmentMenuOpen)}
                  disabled={uploadingFile}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isAttachmentMenuOpen ? 'bg-[#1a558b]/10 text-[#1a558b] rotate-45' : 'bg-gray-100 text-gray-500 hover:text-[#1a558b]'} disabled:opacity-50`}
                >
                  {isAttachmentMenuOpen ? <X className="w-5 h-5" /> : <Paperclip className="w-5 h-5" />}
                </button>

                <div className="flex-1 relative">
                  {isRecording ? (
                    <div className="w-full bg-red-50 text-red-600 rounded-2xl py-3 px-4 flex items-center justify-between animate-pulse">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-600 rounded-full animate-ping" />
                        <span className="text-sm font-medium">Recording... {formatTime(recordingTime)}</span>
                      </div>
                      <button onClick={stopRecording} className="text-red-600 hover:text-red-700">
                        <Square className="w-5 h-5 fill-red-600" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <input 
                        type="text" 
                        placeholder={uploadingFile ? "Uploading..." : imagePreview ? "Add a caption (optional)" : "Message"} 
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        disabled={sending || uploadingFile}
                        className="w-full bg-gray-100 border-none rounded-2xl py-3 px-4 pr-24 text-sm focus:ring-1 focus:ring-[#1a558b]/20 outline-none text-gray-900 disabled:opacity-50"
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <button type="button" className="p-2 text-gray-400 hover:text-[#1a558b] transition-colors"><Smile className="w-5 h-5" /></button>
                        <button 
                          type="button"
                          onClick={startRecording}
                          disabled={uploadingFile || !!imagePreview}
                          className={`p-2 transition-colors ${isRecording ? 'text-red-500 animate-pulse' : 'text-gray-400 hover:text-[#1a558b]'} disabled:opacity-50`}
                        >
                          <Mic className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={handleSendMessage}
                          disabled={(!inputText.trim() && !selectedImage) || sending || uploadingFile}
                          className="p-2 bg-[#1a558b] text-white rounded-xl hover:bg-[#1a558b]/90 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {sending || uploadingFile ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Attachment Menu */}
                <AnimatePresence>
                  {isAttachmentMenuOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute bottom-16 left-0 w-48 bg-white border border-gray-200 rounded-2xl p-2 shadow-xl z-20"
                    >
                      <AttachmentOption 
                        icon={<FileText className="w-4 h-4" />} 
                        label="Attach file" 
                        onClick={() => fileInputRef.current?.click()}
                      />
                      <AttachmentOption 
                        icon={<ImageIcon className="w-4 h-4" />} 
                        label="Photo or video" 
                        onClick={() => imageInputRef.current?.click()}
                      />
                      <AttachmentOption 
                        icon={<Smile className="w-4 h-4" />} 
                        label="Emoji"
                        onClick={() => setIsAttachmentMenuOpen(false)}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 border-t border-gray-100">
              <p className="text-center text-sm text-gray-500">This conversation is closed</p>
            </div>
          )}

          {/* Scroll to bottom indicator */}
          <button 
            onClick={scrollToBottom}
            className="absolute bottom-24 right-8 w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-[#1a558b] transition-all shadow-lg"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </main>
      ) : (
        <main className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <MessageSquarePlus className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No conversation selected</h3>
            <p className="text-gray-500">Select a conversation from the sidebar to start chatting</p>
          </div>
        </main>
      )}
    </div>
  );
}

function ChatItem({ name, message, time, unread, active, status, initial, thumbnail, onClick }: any) {
  return (
    <div 
      onClick={onClick}
      className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all ${active ? 'bg-[#1a558b]/10 text-[#1a558b]' : 'hover:bg-gray-200/50 text-gray-600'}`}
    >
      <div className="relative flex-shrink-0">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${active ? 'bg-[#1a558b] text-white' : 'bg-gray-200 text-gray-500'}`}>
          {initial}
        </div>
        {status === 'online' && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#00a63e] border-2 border-gray-50 rounded-full" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <h3 className={`font-semibold text-sm truncate ${active ? 'text-[#1a558b]' : 'text-gray-900'}`}>{name}</h3>
          <span className="text-[10px] text-gray-400">{time}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          {thumbnail ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <img src={thumbnail} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
              <p className={`text-xs truncate ${active ? 'text-[#1a558b]/70' : 'text-gray-500'}`}>{message}</p>
            </div>
          ) : (
            <p className={`text-xs truncate ${active ? 'text-[#1a558b]/70' : 'text-gray-500'}`}>{message}</p>
          )}
          {unread && unread > 0 && (
            <span className="bg-[#00a63e] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center flex-shrink-0">
              {unread}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function Message({ msg, selectedConversation, playingAudio, toggleAudioPlayback }: any) {
  const isAdmin = msg.sender_type === 'admin';
  const senderName = isAdmin ? 'Admin' : selectedConversation.member?.name || 'Member';
  const initial = isAdmin ? 'A' : selectedConversation.member?.name?.charAt(0).toUpperCase() || 'M';
  const time = new Date(msg.created_at).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex gap-4 group">
      <div className="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0 flex items-center justify-center text-xs font-semibold text-gray-400 border border-gray-200">
        {initial}
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-700">{senderName}</span>
        </div>
        <div className="text-sm leading-relaxed">
          <div className={`${isAdmin ? 'bg-blue-50 border-blue-200' : 'bg-gray-100'} p-3 rounded-2xl rounded-tl-none max-w-md border`}>
            {msg.attachment_url ? (
              <div className="space-y-2">
                {msg.attachment_type === 'image' && (
                  <img 
                    src={msg.attachment_url} 
                    alt="Attachment" 
                    className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => window.open(msg.attachment_url, '_blank')}
                  />
                )}
                {msg.attachment_type === 'video' && (
                  <video 
                    src={msg.attachment_url} 
                    controls 
                    className="rounded-lg max-w-full h-auto"
                  />
                )}
                {msg.attachment_type === 'voice' && (
                  <div className="space-y-2 max-w-md">
                    <p className="text-sm font-medium text-gray-400">Left a voice note:</p>
                    <div className="bg-white/50 rounded-2xl rounded-tl-none border border-gray-200 p-3 flex items-center gap-4">
                      <button 
                        onClick={() => toggleAudioPlayback(msg.id, msg.attachment_url!)}
                        className="w-12 h-12 rounded-full bg-[#1a558b] flex items-center justify-center hover:bg-[#1a558b]/90 transition-colors shadow-md flex-shrink-0"
                      >
                        {playingAudio === msg.id ? (
                          <Pause className="w-5 h-5 text-white" />
                        ) : (
                          <Play className="w-5 h-5 text-white ml-0.5" />
                        )}
                      </button>
                      <div className="flex-1 flex items-center gap-1">
                        {[...Array(24)].map((_, i) => {
                          const baseHeight = 8 + Math.sin(i * 0.5) * 12;
                          return (
                            <div 
                              key={i} 
                              className={`w-1 bg-[#1a558b]/40 rounded-full transition-all ${playingAudio === msg.id ? 'animate-wave' : ''}`}
                              style={{ 
                                height: `${baseHeight}px`,
                                animationDelay: `${i * 0.05}s`
                              }}
                            />
                          );
                        })}
                      </div>
                      <span className="text-sm text-gray-500 font-mono flex-shrink-0">0:14</span>
                    </div>
                  </div>
                )}
                {msg.attachment_type === 'file' && (
                  <a 
                    href={msg.attachment_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-white/50 p-2 rounded-lg hover:bg-white/80 transition-colors"
                  >
                    <FileText className="w-5 h-5 text-gray-600" />
                    <span className="text-sm text-gray-700 truncate">{msg.attachment_name || 'Download file'}</span>
                  </a>
                )}
                {msg.attachment_type !== 'voice' && msg.message && !msg.message.startsWith('📷') && !msg.message.startsWith('🎥') && !msg.message.startsWith('📎') && (
                  <p className="text-gray-800 text-sm">{msg.message}</p>
                )}
              </div>
            ) : (
              <p className="text-gray-800">{msg.message}</p>
            )}
          </div>
        </div>
        <span className="text-[10px] text-gray-400 block pt-1">{time}</span>
      </div>
    </div>
  );
}

function AttachmentOption({ icon, label, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm text-gray-500 hover:text-[#1a558b]"
    >
      <span className="text-gray-400 group-hover:text-[#1a558b]">{icon}</span>
      {label}
    </button>
  );
}
