import {
  Paperclip, Image as ImageIcon, Smile, Send, Mic, Play, Pause,
  ChevronDown, X, FileText, MessageSquarePlus, Square, ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { supabase } from '../lib/supabase';
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
  member_id?: string;
  partner_id?: string;
  status: 'open' | 'closed';
  feedback_requested: boolean;
  created_at: string;
  updated_at: string;
}

export default function PartnerChat({ onClose }: { onClose?: () => void } = {}) {
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

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => { scrollToBottom(); }, [messages]);
  useEffect(() => { loadOrCreateConversation(); }, []);

  useEffect(() => {
    if (!conversation) return;
    loadMessages(conversation.id);
    const channel = supabase
      .channel(`partner-chat:${conversation.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `conversation_id=eq.${conversation.id}` },
        (payload) => { setMessages(prev => [...prev, payload.new as ChatMessage]); scrollToBottom(); })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_conversations', filter: `id=eq.${conversation.id}` },
        (payload) => { setConversation(payload.new as ChatConversation); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [conversation]);

  const getPartnerId = (): string | null => {
    const raw = localStorage.getItem('partnerSession') || sessionStorage.getItem('partnerSession');
    if (!raw) return null;
    try { 
      const session = JSON.parse(raw);
      return session.partner?.id || session.user?.id || null; 
    } catch { 
      return null; 
    }
  };

  const loadOrCreateConversation = async () => {
    try {
      const partnerId = getPartnerId();
      if (!partnerId) { onClose ? onClose() : navigate('/partner/login'); return; }

      // First, try to find an open conversation for this partner
      const { data: openConvo } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('partner_id', partnerId)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (openConvo) {
        setConversation(openConvo);
      } else {
        // No open conversation found, create a new one
        const { data: newConvo, error } = await supabase
          .from('chat_conversations')
          .insert([{ 
            partner_id: partnerId,  // Use partner_id instead of member_id
            status: 'open', 
            feedback_requested: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()
          .single();
        if (error) {
          console.error('Error creating conversation:', error);
          throw error;
        }
        setConversation(newConvo);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    const { data } = await supabase.from('chat_messages').select('*').eq('conversation_id', conversationId).order('created_at', { ascending: true });
    setMessages(data || []);
  };

  const handleSendMessage = async () => {
    if ((!inputText.trim() && !selectedImage) || !conversation || sending) return;
    setSending(true);
    try {
      let attachmentUrl = null, attachmentType = null;
      if (selectedImage) {
        attachmentUrl = await uploadFile(selectedImage);
        if (!attachmentUrl) throw new Error('Upload failed');
        attachmentType = selectedImage.type.startsWith('video/') ? 'video' : 'image';
      }
      const messageText = inputText.trim() || (attachmentType === 'image' ? '📷 Image' : '🎥 Video');
      const { error } = await supabase.from('chat_messages').insert([{
        conversation_id: conversation.id, sender_type: 'member',
        message: messageText, attachment_url: attachmentUrl,
        attachment_type: attachmentType, attachment_name: selectedImage?.name, read: false
      }]);
      if (error) throw error;
      await supabase.from('chat_conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversation.id);
      setInputText(''); setSelectedImage(null); setImagePreview(null);
      await loadMessages(conversation.id);
    } catch (error) { console.error('Error sending message:', error); }
    finally { setSending(false); }
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      const fileName = `chat-attachments/${conversation?.id}/${Date.now()}.${file.name.split('.').pop()}`;
      const { error } = await supabase.storage.from('documents').upload(fileName, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      return supabase.storage.from('documents').getPublicUrl(fileName).data.publicUrl;
    } catch { return null; }
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !conversation) return;
    const type = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'file';
    if (type === 'image' || type === 'video') {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
      setIsAttachmentMenuOpen(false);
      if (e.target) e.target.value = '';
      return;
    }
    setUploadingFile(true); setIsAttachmentMenuOpen(false);
    try {
      const fileUrl = await uploadFile(file);
      if (!fileUrl) throw new Error('Upload failed');
      await supabase.from('chat_messages').insert([{ conversation_id: conversation.id, sender_type: 'member', message: `📎 Sent ${file.name}`, attachment_url: fileUrl, attachment_type: 'file', attachment_name: file.name, read: false }]);
      await supabase.from('chat_conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversation.id);
      await loadMessages(conversation.id);
    } catch { alert('Failed to send file.'); }
    finally { setUploadingFile(false); if (e.target) e.target.value = ''; }
  };

  const toggleAudioPlayback = (messageId: string, audioUrl: string) => {
    const audio = audioRefs.current[messageId];
    if (!audio) {
      const a = new Audio(audioUrl);
      audioRefs.current[messageId] = a;
      a.onended = () => setPlayingAudio(null);
      a.play(); setPlayingAudio(messageId);
    } else {
      if (playingAudio === messageId) { audio.pause(); audio.currentTime = 0; setPlayingAudio(null); }
      else { audio.play(); setPlayingAudio(messageId); }
    }
  };

  const startRecording = async () => {
    if (!conversation) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      mediaRecorder.onstop = async () => {
        const audioFile = new File([new Blob(audioChunksRef.current, { type: 'audio/webm' })], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
        setUploadingFile(true);
        try {
          const fileUrl = await uploadFile(audioFile);
          if (!fileUrl) throw new Error('Upload failed');
          await supabase.from('chat_messages').insert([{ conversation_id: conversation.id, sender_type: 'member', message: '🎤 Sent a voice note', attachment_url: fileUrl, attachment_type: 'voice', read: false }]);
          await supabase.from('chat_conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversation.id);
          await loadMessages(conversation.id);
        } catch { alert('Failed to send voice note.'); }
        finally { setUploadingFile(false); setRecordingTime(0); }
      };
      mediaRecorder.start(); setIsRecording(true);
      timerRef.current = setInterval(() => setRecordingTime(p => p + 1), 1000);
    } catch { alert('Failed to access microphone.'); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop(); setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  if (loading) return (
    <div className="flex h-screen w-full bg-white items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#1a558b]/20 border-t-[#1a558b] rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Loading chat...</p>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-full bg-white text-gray-900 font-sans overflow-hidden flex-col">
      <input type="file" ref={fileInputRef} className="hidden" accept="*/*" onChange={handleFileUpload} />
      <input ref={imageInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileUpload} />

      {/* Header */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-gray-200 bg-white/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => onClose ? onClose() : navigate('/partner/support')} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-[#1a568b] flex items-center justify-center font-semibold text-white">A</div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#00a63e] border-2 border-white rounded-full" />
          </div>
          <div>
            <h2 className="font-semibold text-sm text-gray-900">Plus1 Support Team</h2>
            <p className="text-xs text-gray-500">Online • Usually replies instantly</p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-4">
              <MessageSquarePlus className="w-10 h-10 text-[#1a568b]" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Hey there! 👋</h3>
            <p className="text-gray-600 max-w-sm mb-6">Welcome to Plus1 Support! Ask us about invoices, transactions, or anything else.</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {['Invoice query', 'Transaction issue', 'Account question'].map(s => (
                <button key={s} onClick={() => setInputText(s)} className="px-4 py-2 bg-white border-2 border-gray-200 hover:border-[#1a568b] hover:bg-[#1a568b]/5 rounded-full text-sm font-medium text-gray-700 hover:text-[#1a568b] transition-all">{s}</button>
              ))}
            </div>
          </div>
        ) : messages.map(msg => <ChatMessage key={msg.id} msg={msg} playingAudio={playingAudio} toggleAudioPlayback={toggleAudioPlayback} />)}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {conversation?.status === 'open' ? (
        <div className="p-4 bg-white border-t border-gray-100">
          {imagePreview && (
            <div className="mb-3 relative inline-block">
              <img src={imagePreview} alt="Preview" className="max-h-32 rounded-lg border-2 border-gray-200" />
              <button onClick={() => { setSelectedImage(null); setImagePreview(null); }} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          <div className="max-w-4xl mx-auto relative flex items-center gap-3">
            <button onClick={() => setIsAttachmentMenuOpen(!isAttachmentMenuOpen)} disabled={uploadingFile} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isAttachmentMenuOpen ? 'bg-[#1a568b]/10 text-[#1a568b] rotate-45' : 'bg-gray-100 text-gray-500 hover:text-[#1a568b]'} disabled:opacity-50`}>
              {isAttachmentMenuOpen ? <X className="w-5 h-5" /> : <Paperclip className="w-5 h-5" />}
            </button>
            <div className="flex-1 relative">
              {isRecording ? (
                <div className="w-full bg-red-50 text-red-600 rounded-2xl py-3 px-4 flex items-center justify-between animate-pulse">
                  <div className="flex items-center gap-2"><div className="w-2 h-2 bg-red-600 rounded-full animate-ping" /><span className="text-sm font-medium">Recording... {formatTime(recordingTime)}</span></div>
                  <button onClick={stopRecording}><Square className="w-5 h-5 fill-red-600" /></button>
                </div>
              ) : (
                <>
                  <input type="text" placeholder={uploadingFile ? 'Uploading...' : imagePreview ? 'Add a caption...' : 'Message'} value={inputText} onChange={e => setInputText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} disabled={sending || uploadingFile} className="w-full bg-gray-100 border-none rounded-2xl py-3 px-4 pr-24 text-sm focus:ring-1 focus:ring-[#1a568b]/20 outline-none text-gray-900 disabled:opacity-50" />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <button type="button" className="p-2 text-gray-400 hover:text-[#1a568b]"><Smile className="w-5 h-5" /></button>
                    <button type="button" onClick={startRecording} disabled={uploadingFile || !!imagePreview} className={`p-2 transition-colors ${isRecording ? 'text-red-500 animate-pulse' : 'text-gray-400 hover:text-[#1a568b]'} disabled:opacity-50`}><Mic className="w-5 h-5" /></button>
                    <button onClick={handleSendMessage} disabled={(!inputText.trim() && !selectedImage) || sending || uploadingFile} className="p-2 bg-[#1a568b] text-white rounded-xl hover:bg-[#1a568b]/90 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                      {sending || uploadingFile ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </div>
                </>
              )}
            </div>
            <AnimatePresence>
              {isAttachmentMenuOpen && (
                <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute bottom-16 left-0 w-48 bg-white border border-gray-200 rounded-2xl p-2 shadow-xl z-20">
                  <AttachmentOption icon={<FileText className="w-4 h-4" />} label="Attach file" onClick={() => fileInputRef.current?.click()} />
                  <AttachmentOption icon={<ImageIcon className="w-4 h-4" />} label="Photo or video" onClick={() => imageInputRef.current?.click()} />
                  <AttachmentOption icon={<Smile className="w-4 h-4" />} label="Emoji" onClick={() => setIsAttachmentMenuOpen(false)} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-gray-50 border-t border-gray-100">
          <div className="max-w-md mx-auto text-center space-y-3">
            <p className="text-sm text-gray-500">This conversation has been closed</p>
            <button
              onClick={async () => {
                const partnerId = getPartnerId();
                if (!partnerId) return;
                
                try {
                  const { data: newConvo, error } = await supabase
                    .from('chat_conversations')
                    .insert([{ 
                      partner_id: partnerId,  // Use partner_id instead of member_id
                      status: 'open', 
                      feedback_requested: false,
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString()
                    }])
                    .select()
                    .single();
                  
                  if (error) throw error;
                  setConversation(newConvo);
                  setMessages([]);
                } catch (error) {
                  console.error('Error creating new conversation:', error);
                  alert('Failed to start new conversation. Please try again.');
                }
              }}
              className="w-full bg-[#1a568b] hover:bg-[#1a568b]/90 text-white font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <MessageSquarePlus className="w-5 h-5" />
              Start New Conversation
            </button>
          </div>
        </div>
      )}

      <button onClick={scrollToBottom} className="absolute bottom-24 right-8 w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-[#1a568b] transition-all shadow-lg">
        <ChevronDown className="w-5 h-5" />
      </button>
    </div>
  );
}

function ChatMessage({ msg, playingAudio, toggleAudioPlayback }: any) {
  const isAdmin = msg.sender_type === 'admin';
  const time = new Date(msg.created_at).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
  return (
    <div className={`flex gap-4 group ${!isAdmin ? 'flex-row-reverse' : ''}`}>
      <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-semibold border ${isAdmin ? 'bg-[#1a568b] text-white border-[#1a568b]' : 'bg-gradient-to-br from-purple-500 to-pink-500 text-white border-purple-500'}`}>
        {isAdmin ? 'A' : 'P'}
      </div>
      <div className={`flex-1 space-y-1 ${!isAdmin ? 'text-right' : ''}`}>
        <div className={`flex items-center gap-2 ${!isAdmin ? 'justify-end' : ''}`}>
          <span className="text-sm font-semibold text-gray-700">{isAdmin ? 'Plus1 Support' : 'You'}</span>
        </div>
        <div className={`text-sm leading-relaxed flex ${!isAdmin ? 'justify-end' : ''}`}>
          <div className={`${isAdmin ? 'bg-white border-gray-200' : 'bg-gradient-to-r from-[#1a568b] to-blue-600 text-white'} p-3 rounded-2xl ${isAdmin ? 'rounded-tl-none' : 'rounded-tr-none'} max-w-md border shadow-sm`}>
            {msg.attachment_url ? (
              <div className="space-y-2">
                {msg.attachment_type === 'image' && <img src={msg.attachment_url} alt="Attachment" className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90" onClick={() => window.open(msg.attachment_url, '_blank')} />}
                {msg.attachment_type === 'video' && <video src={msg.attachment_url} controls className="rounded-lg max-w-full h-auto" />}
                {msg.attachment_type === 'voice' && (
                  <div className={`${isAdmin ? 'bg-white/50 border-gray-200' : 'bg-white/10 border-white/20'} rounded-2xl border p-3 flex items-center gap-4`}>
                    <button onClick={() => toggleAudioPlayback(msg.id, msg.attachment_url)} className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md flex-shrink-0 ${isAdmin ? 'bg-[#1a568b]' : 'bg-white/20'}`}>
                      {playingAudio === msg.id ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white ml-0.5" />}
                    </button>
                    <div className="flex-1 flex items-center gap-1">
                      {[...Array(24)].map((_, i) => <div key={i} className={`w-1 rounded-full ${isAdmin ? 'bg-[#1a568b]/40' : 'bg-white/40'}`} style={{ height: `${8 + Math.sin(i * 0.5) * 12}px` }} />)}
                    </div>
                  </div>
                )}
                {msg.attachment_type === 'file' && <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 p-2 rounded-lg ${isAdmin ? 'bg-white/50' : 'bg-white/10'}`}><FileText className={`w-5 h-5 ${isAdmin ? 'text-gray-600' : 'text-white'}`} /><span className={`text-sm truncate ${isAdmin ? 'text-gray-700' : 'text-white'}`}>{msg.attachment_name || 'Download file'}</span></a>}
                {msg.attachment_type !== 'voice' && msg.message && !msg.message.startsWith('📷') && !msg.message.startsWith('🎥') && !msg.message.startsWith('📎') && <p className={`text-sm ${isAdmin ? 'text-gray-800' : 'text-white'}`}>{msg.message}</p>}
              </div>
            ) : <p className={isAdmin ? 'text-gray-800' : 'text-white'}>{msg.message}</p>}
          </div>
        </div>
        <span className={`text-[10px] text-gray-400 block pt-1 ${!isAdmin ? 'text-right' : ''}`}>{time}</span>
      </div>
    </div>
  );
}

function AttachmentOption({ icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm text-gray-500 hover:text-[#1a568b]">
      <span className="text-gray-400">{icon}</span>{label}
    </button>
  );
}
