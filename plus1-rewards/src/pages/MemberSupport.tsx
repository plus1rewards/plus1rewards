import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MessageCircle, Mail, Phone, Clock, Info, Receipt, FileText, UserPlus, HelpCircle, ChevronRight } from "lucide-react";
import { supabase } from "../lib/supabase";
import { getSession, clearSession } from "../lib/session";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem } from "../components/ui/select";
import MemberLayout from "../components/member/MemberLayout";
import SendButton from "../components/ui/SendButton";
import FeedbackModal from "../components/ui/FeedbackModal";

export default function MemberSupport() {
  const navigate = useNavigate();
  const [member, setMember] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [issueType, setIssueType] = useState("missing_cashback");
  const [transactionId, setTransactionId] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [feedbackConversation, setFeedbackConversation] = useState<any>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  useEffect(() => { loadData(); checkForFeedbackRequest(); }, []);

  const loadData = async () => {
    try {
      const session = getSession();
      if (!session?.member?.id) { navigate("/member/login"); return; }
      const { data } = await supabase
        .from("members")
        .select("id, first_name, last_name, cell_phone, email, qr_code")
        .eq("id", session.member.id)
        .single();
      if (data) setMember({ id: data.id, name: `${data.first_name} ${data.last_name}`.trim(), phone: data.cell_phone, email: data.email, qr_code: data.qr_code });
      else navigate("/member/login");
    } catch { navigate("/member/login"); }
    finally { setLoading(false); }
  };

  const checkForFeedbackRequest = async () => {
    try {
      const session = getSession();
      if (!session?.member?.id) return;

      // Check for conversations that need feedback
      const { data: conversations } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('member_id', session.member.id)
        .eq('feedback_requested', true)
        .is('feedback_submitted_at', null)
        .order('feedback_requested_at', { ascending: false })
        .limit(1);

      if (conversations && conversations.length > 0) {
        setFeedbackConversation(conversations[0]);
        setShowFeedbackModal(true);
      }
    } catch (error) {
      console.error('Error checking for feedback:', error);
    }
  };

  const handleFeedbackClose = () => {
    setShowFeedbackModal(false);
    setFeedbackConversation(null);
  };

  const handleSubmit = async (e?: { preventDefault: () => void }) => {
    e?.preventDefault();
    if (!description.trim()) return;
    setSubmitting(true);
    try {
      const session = getSession();
      if (!session?.member?.id) { navigate("/member/login"); return; }
      const txId = transactionId.trim().match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
        ? transactionId.trim() : null;
      const { error } = await supabase.from("disputes").insert([{
        member_id: session.member.id, dispute_type: issueType,
        description: description.trim(), transaction_id: txId, status: "open"
      }]);
      if (error) throw error;
      setSuccessMessage("Dispute submitted! Our team will review it within 24 hours.");
      setDescription(""); setTransactionId(""); setIssueType("missing_cashback");
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch { alert("Failed to submit. Please try again."); }
    finally { setSubmitting(false); }
  };

  const handleSignOut = () => { clearSession(); navigate("/member/login"); };

  if (loading) return (
    <MemberLayout member={member} isOnline={navigator.onLine} pendingTransactions={0} onSignOut={handleSignOut}>
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-[#1a558b]/20 border-t-[#1a558b] rounded-full animate-spin mx-auto"></div>
      </div>
    </MemberLayout>
  );

  return (
    <MemberLayout member={member} isOnline={navigator.onLine} pendingTransactions={0} onSignOut={handleSignOut}>

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-900">Support Center</h1>
          <p className="text-slate-500 text-sm mt-0.5">We're here to help resolve any issues quickly.</p>
        </div>
        <button
          onClick={() => navigate("/member/dashboard")}
          className="self-start sm:self-auto bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 inline-flex items-center gap-2 h-9 px-4 rounded-xl shadow-sm transition-all text-sm font-medium flex-shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </div>

      {/* Success banner */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 flex items-center gap-3">
          <span className="text-green-600 font-bold text-sm">{successMessage}</span>
        </div>
      )}

      <div className="space-y-5">

        {/* ── Chat CTA ── */}
        <div className="bg-gradient-to-br from-[#0D47A1] via-[#1A237E] to-[#311B92] rounded-2xl p-5 md:p-8 relative overflow-hidden">
          <div className="absolute -right-16 -top-16 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 flex-shrink-0">
              <MessageCircle className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#00C853]/20 border border-[#00C853]/30 text-[#00C853] text-[10px] font-bold tracking-wider uppercase mb-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#00C853] animate-pulse" />
                Support Online
              </div>
              <h2 className="text-lg md:text-2xl font-bold text-white leading-tight">Need Help? Chat with Us!</h2>
              <p className="text-blue-100/70 text-sm mt-1">Our team is ready to help with anything.</p>
            </div>
            <button
              onClick={() => navigate('/member/chat')}
              className="w-full sm:w-auto bg-white text-[#0D47A1] hover:bg-blue-50 rounded-xl px-6 h-11 inline-flex items-center justify-center gap-2 font-bold text-sm shadow-lg transition-all flex-shrink-0"
            >
              Start Live Chat
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Dispute form */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-red-50 flex items-center justify-center border border-red-100 flex-shrink-0">
                <Info className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">File a Complaint or Dispute</h3>
                <p className="text-xs text-slate-500">Describe your transaction or account issue</p>
              </div>
            </div>
            <div className="p-4 md:p-6">
              <form onSubmit={e => handleSubmit(e)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Issue Type</label>
                    <Select value={issueType} onValueChange={setIssueType} className="bg-slate-50 border-slate-200 h-11 rounded-xl text-sm">
                      <SelectContent>
                        <SelectItem value="missing_cashback">Missing Cashback</SelectItem>
                        <SelectItem value="wrong_amount">Wrong Amount</SelectItem>
                        <SelectItem value="unauthorized">Unauthorized Transaction</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Transaction ID (Optional)</label>
                    <Input
                      value={transactionId}
                      onChange={e => setTransactionId(e.target.value)}
                      placeholder="e.g. TR-99283"
                      className="bg-slate-50 border-slate-200 h-11 rounded-xl text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Description *</label>
                  <Textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Please describe your issue in detail..."
                    className="min-h-[120px] bg-slate-50 border-slate-200 rounded-xl resize-none p-3 text-sm"
                  />
                </div>
                <SendButton disabled={submitting || !description.trim()} onClick={() => handleSubmit()} />
              </form>
            </div>
          </div>

          {/* Contact sidebar */}
          <div className="space-y-4">
            {/* Admin contact card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100 flex-shrink-0">
                  <HelpCircle className="h-5 w-5 text-[#0D47A1]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Admin Support</h3>
                  <p className="text-xs text-slate-500">Direct assistance available</p>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {[
                  { icon: Mail,  label: "Email",  value: "plus1rewards@gmail.com", color: "text-blue-500" },
                  { icon: Phone, label: "Phone",  value: "071 432 9190",           color: "text-green-500" },
                  { icon: Clock, label: "Hours",  value: "Mon–Fri: 7:30–19:00",    color: "text-orange-500" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center border border-slate-200 flex-shrink-0">
                      <item.icon className={`h-4 w-4 ${item.color}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.label}</p>
                      <p className="text-xs font-bold text-slate-700 truncate">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <a href="https://wa.me/27714329190" target="_blank" rel="noopener noreferrer">
                <button className="w-full bg-[#00C853] hover:bg-[#00B24A] text-white inline-flex items-center justify-center gap-2 h-11 rounded-xl font-bold text-sm shadow-sm transition-all">
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp Support
                </button>
              </a>
            </div>

            {/* Quick response badge */}
            <div className="bg-gradient-to-br from-blue-600 to-[#0D47A1] rounded-2xl p-5 text-white relative overflow-hidden">
              <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-7 w-7 rounded-lg bg-white/20 flex items-center justify-center">
                    <Info className="h-3.5 w-3.5 text-white" />
                  </div>
                  <h4 className="font-bold text-sm">Quick Response</h4>
                </div>
                <p className="text-blue-100/80 text-xs leading-relaxed mb-3">
                  We typically respond within{' '}
                  <span className="text-white font-bold underline decoration-[#00C853] underline-offset-2">15 minutes</span>{' '}
                  during business hours.
                </p>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-200 uppercase tracking-widest">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#00C853]" />
                  Priority Support Active
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Common topics ── */}
        <div>
          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-3">
            <HelpCircle className="h-4 w-4 text-[#0D47A1]" />
            Common Support Topics
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { title: "Transaction Issues",    desc: "Failed or pending",         icon: Receipt,    color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
              { title: "Cover Plan Questions",  desc: "Status & upgrades",         icon: FileText,   color: "bg-blue-50 text-blue-600 border-blue-100" },
              { title: "Top-Up Support",        desc: "EFT & proof of payment",    icon: UserPlus,   color: "bg-purple-50 text-purple-600 border-purple-100" },
              { title: "Cashback Queries",      desc: "Missing or incorrect",      icon: HelpCircle, color: "bg-orange-50 text-orange-600 border-orange-100" },
            ].map((topic, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-all cursor-pointer group">
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center border ${topic.color} mb-3 group-hover:scale-110 transition-transform`}>
                  <topic.icon className="h-4 w-4" />
                </div>
                <p className="font-bold text-slate-800 text-xs leading-tight group-hover:text-[#0D47A1] transition-colors">{topic.title}</p>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">{topic.desc}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Feedback Modal */}
      {feedbackConversation && (
        <FeedbackModal
          isOpen={showFeedbackModal}
          onClose={handleFeedbackClose}
          conversationId={feedbackConversation.id}
          userType="member"
        />
      )}
    </MemberLayout>
  );
}
