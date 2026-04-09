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
  MessageSquarePlus,
  Square,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { supabase } from '../lib/supabase';
import { getSession } from '../lib/session';
import { useNavigate } from 'react-router-dom';

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
}

export default function MemberChat() {
  const navigate = useNavigate();
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
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
    loadOrCreateConversation();
  }, []);

  useEffect(() => {
    if (conversation) {
      loadMessages(conversation.id);
      
      // Set up real-time subscription
      const channel = supabase
        .channel(`member-chat:${conversation.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `conversation_id=eq.${conversation.id}`
          },
          (payload) => {
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
            const updatedConvo = payload.new as ChatConversation;
            setConversation(updatedConvo);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [conversation]);

  const loadOrCreateConversation = async () => {
    try {
      const session = getSession();
      if (!session?.member?.id) {
        navigate('/member/login');
        return;
      }

      const memberId = session.member.id;

      // Try to find existing OPEN conversation
      const { data: openConvo, error: fetchError } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('member_id', memberId)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (openConvo) {
        setConversation(openConvo);
      } else {
        // Create new conversation
        const { data: newConvo, error } = await supabase
          .from('chat_conversations')
          .insert([{
            member_id: memberId,
            status: 'open',
            feedback_requested: false
          }])
          .select()
          .single();

        if (error) throw error;
        setConversation(newConvo);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if ((!inputText.trim() && !selectedImage) || !conversation || sending) return;

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

      const { error } = await supabase
        .from('chat_messages')
        .insert([{
          conversation_id: conversation.id,
          sender_type: 'member',
          message: messageText,
          attachment_url: attachmentUrl,
          attachment_type: attachmentType,
          attachment_name: selectedImage?.name,
          read: false
        }]);

      if (error) {
        console.error('Error inserting message:', error);
        alert('Failed to send message. Please try again.');
        throw error;
      }

      await supabase
        .from('chat_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversation.id);

      setInputText('');
      setSelectedImage(null);
      setImagePreview(null);
      
      // Reload messages to ensure UI updates (real-time might have delay)
      await loadMessages(conversation.id);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `chat-attachments/${conversation?.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file, {
          contentType: file.type,
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
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
    if (!file || !conversation) return;

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

      const { error } = await supabase
        .from('chat_messages')
        .insert([{
          conversation_id: conversation.id,
          sender_type: 'member',
          message: `📎 Sent ${file.name}`,
          attachment_url: fileUrl,
          attachment_type: 'file',
          attachment_name: file.name,
          read: false
        }]);

      if (error) throw error;

      await supabase
        .from('chat_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversation.id);

      await loadMessages(conversation.id);
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

  const startRecording = async () => {
    if (!conversation) return;
    
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

          const { error } = await supabase
            .from('chat_messages')
            .insert([{
              conversation_id: conversation.id,
              sender_type: 'member',
              message: '🎤 Sent a voice note',
              attachment_url: fileUrl,
              attachment_type: 'voice',
              read: false
            }]);

          if (error) throw error;

          await supabase
            .from('chat_conversations')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', conversation.id);

          await loadMessages(conversation.id);
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

  if (loading) {
    return (
      <div className="flex h-screen w-full bg-white items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1a558b]/20 border-t-[#1a558b] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-white text-gray-900 font-sans overflow-hidden flex-col">
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
      
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-gray-200 bg-white/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/member/dashboard')}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-[#1a558b] flex items-center justify-center font-semibold text-white">
              A
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#00a63e] border-2 border-white rounded-full" />
          </div>
          <div>
            <h2 className="font-semibold text-sm text-gray-900">Plus1 Support Team</h2>
            <p className="text-xs text-gray-500">Online • Usually replies instantly</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-gray-400">
          <button className="hover:text-[#1a558b] transition-colors"><Phone className="w-5 h-5" /></button>
          <button className="hover:text-[#1a558b] transition-colors"><MoreVertical className="w-5 h-5" /></button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-4">
              <MessageSquarePlus className="w-10 h-10 text-[#1a558b]" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Hey there! 👋</h3>
            <p className="text-gray-600 max-w-sm mb-6">
              Welcome to Plus1 Support! We're here to help with anything you need. 
              Ask us about payments, cover plans, or anything else!
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {['Help with top-up', 'Cover plan question', 'Transaction issue'].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInputText(suggestion)}
                  className="px-4 py-2 bg-white border-2 border-gray-200 hover:border-[#1a558b] hover:bg-[#1a558b]/5 rounded-full text-sm font-medium text-gray-700 hover:text-[#1a558b] transition-all"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <Message 
              key={msg.id}
              msg={msg}
              playingAudio={playingAudio}
              toggleAudioPlayback={toggleAudioPlayback}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      {conversation?.status === 'open' ? (
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
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
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
          <p className="text-center text-sm text-gray-500">This conversation has been closed</p>
          {conversation?.feedback_requested && (
            <p className="text-center text-xs text-gray-400 mt-1">Please provide feedback about your experience</p>
          )}
        </div>
      )}

      {/* Scroll to bottom indicator */}
      <button 
        onClick={scrollToBottom}
        className="absolute bottom-24 right-8 w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-[#1a558b] transition-all shadow-lg"
      >
        <ChevronDown className="w-5 h-5" />
      </button>
    </div>
  );
}

function Message({ msg, playingAudio, toggleAudioPlayback }: any) {
  const isAdmin = msg.sender_type === 'admin';
  const senderName = isAdmin ? 'Plus1 Support' : 'You';
  const initial = isAdmin ? 'A' : 'Y';
  const time = new Date(msg.created_at).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`flex gap-4 group ${!isAdmin ? 'flex-row-reverse' : ''}`}>
      <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-semibold border ${isAdmin ? 'bg-[#1a558b] text-white border-[#1a558b]' : 'bg-gradient-to-br from-purple-500 to-pink-500 text-white border-purple-500'}`}>
        {initial}
      </div>
      <div className={`flex-1 space-y-1 ${!isAdmin ? 'text-right' : ''}`}>
        <div className={`flex items-center gap-2 ${!isAdmin ? 'justify-end' : ''}`}>
          <span className="text-sm font-semibold text-gray-700">{senderName}</span>
        </div>
        <div className={`text-sm leading-relaxed flex ${!isAdmin ? 'justify-end' : ''}`}>
          <div className={`${isAdmin ? 'bg-white border-gray-200' : 'bg-gradient-to-r from-[#1a558b] to-blue-600 text-white'} p-3 rounded-2xl ${isAdmin ? 'rounded-tl-none' : 'rounded-tr-none'} max-w-md border shadow-sm`}>
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
                    {isAdmin && <p className="text-sm font-medium text-gray-400">Left a voice note:</p>}
                    <div className={`${isAdmin ? 'bg-white/50 border-gray-200' : 'bg-white/10 border-white/20'} rounded-2xl ${isAdmin ? 'rounded-tl-none' : 'rounded-tr-none'} border p-3 flex items-center gap-4`}>
                      <button 
                        onClick={() => toggleAudioPlayback(msg.id, msg.attachment_url!)}
                        className={`w-12 h-12 rounded-full flex items-center justify-center hover:opacity-90 transition-colors shadow-md flex-shrink-0 ${isAdmin ? 'bg-[#1a558b]' : 'bg-white/20'}`}
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
                              className={`w-1 rounded-full transition-all ${isAdmin ? 'bg-[#1a558b]/40' : 'bg-white/40'} ${playingAudio === msg.id ? 'animate-wave' : ''}`}
                              style={{ 
                                height: `${baseHeight}px`,
                                animationDelay: `${i * 0.05}s`
                              }}
                            />
                          );
                        })}
                      </div>
                      <span className={`text-sm font-mono flex-shrink-0 ${isAdmin ? 'text-gray-500' : 'text-white/70'}`}>0:14</span>
                    </div>
                  </div>
                )}
                {msg.attachment_type === 'file' && (
                  <a 
                    href={msg.attachment_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`flex items-center gap-2 p-2 rounded-lg hover:opacity-80 transition-colors ${isAdmin ? 'bg-white/50' : 'bg-white/10'}`}
                  >
                    <FileText className={`w-5 h-5 ${isAdmin ? 'text-gray-600' : 'text-white'}`} />
                    <span className={`text-sm truncate ${isAdmin ? 'text-gray-700' : 'text-white'}`}>{msg.attachment_name || 'Download file'}</span>
                  </a>
                )}
                {msg.attachment_type !== 'voice' && msg.message && !msg.message.startsWith('📷') && !msg.message.startsWith('🎥') && !msg.message.startsWith('📎') && (
                  <p className={`text-sm ${isAdmin ? 'text-gray-800' : 'text-white'}`}>{msg.message}</p>
                )}
              </div>
            ) : (
              <p className={isAdmin ? 'text-gray-800' : 'text-white'}>{msg.message}</p>
            )}
          </div>
        </div>
        <span className={`text-[10px] text-gray-400 block pt-1 ${!isAdmin ? 'text-right' : ''}`}>{time}</span>
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
