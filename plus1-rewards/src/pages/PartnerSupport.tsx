import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, MessageCircle, Mail, Phone, Clock, Info,
  Receipt, FileText, UserPlus, HelpCircle, ChevronRight
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "../lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem } from "../components/ui/select";
import PartnerLayout from "../components/partner/PartnerLayout";
import SendButton from "../components/ui/SendButton";
import FeedbackModal from "../components/ui/FeedbackModal";

export default function PartnerSupport() {
  const navigate = useNavigate();
  const [issueType, setIssueType] = useState("invoice_query");
  const [transactionId, setTransactionId] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [feedbackConversation, setFeedbackConversation] = useState<any>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  useEffect(() => { checkForFeedbackRequest(); }, []);

  const checkForFeedbackRequest = async () => {
    try {
      const partnerSessionData = localStorage.getItem('partnerSession') || sessionStorage.getItem('partnerSession');
      if (!partnerSessionData) return;

      const session = JSON.parse(partnerSessionData);
      const partnerId = session.partner?.id;
      if (!partnerId) return;

      // Check for conversations that need feedback
      const { data: conversations } = await supabase
        .from('partner_chat_conversations')
        .select('*')
        .eq('partner_id', partnerId)
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
      const partnerSessionData = localStorage.getItem('partnerSession') || sessionStorage.getItem('partnerSession');
      if (!partnerSessionData) { navigate("/partner/login"); return; }
      const session = JSON.parse(partnerSessionData);
      const partnerId = session.partner?.id;
      if (!partnerId) { navigate("/partner/login"); return; }
      
      // Get partner details
      const { data: partnerData } = await supabase
        .from('partners')
        .select('shop_name, cell_phone, id')
        .eq('id', partnerId)
        .single();
      
      const txId = transactionId.trim().match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
        ? transactionId.trim() : null;
      
      // Map issue types to valid dispute types
      const disputeTypeMap: Record<string, string> = {
        'invoice_query': 'other',
        'payment_issue': 'other',
        'transaction_error': 'incorrect_amount',
        'account_access': 'other',
        'general_inquiry': 'other'
      };
      
      const { error } = await supabase.from("disputes").insert([{
        dispute_type: disputeTypeMap[issueType] || 'other',
        description: `Partner Support - ${issueType}: ${description.trim()}`,
        transaction_id: txId,
        status: 'open',
        partner_id: partnerId
      }]);
      if (error) {
        console.error('Support ticket error:', error);
        throw error;
      }
      setSuccessMessage("Support ticket submitted! Our team will review it within 24 hours.");
      setDescription(""); setTransactionId(""); setIssueType("invoice_query");
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch { alert("Failed to submit. Please try again."); }
    finally { setSubmitting(false); }
  };

  return (
    <PartnerLayout>
      <div className="min-h-screen font-sans text-slate-900 -mx-4 md:-mx-8 px-4 md:px-8">
        <main className="mx-auto max-w-[1400px] px-4 py-8 space-y-10">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-1 font-black text-2xl tracking-tighter">
                  <span className="text-[#0D47A1]">Plus</span>
                  <span className="bg-[#00C853] text-white px-1.5 py-0.5 rounded-sm">ONE</span>
                  <span className="text-[#0D47A1] ml-1">REWARDS</span>
                </div>
                <Badge className="bg-purple-50 text-purple-600 border-purple-100 text-[10px] font-bold px-2 py-0">
                  PARTNER PORTAL
                </Badge>
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">Support Center</h1>
              <p className="text-slate-500 text-lg max-w-2xl">We're here to help you manage your business and resolve any issues quickly.</p>
            </div>
            <button onClick={() => navigate("/partner/dashboard")}
              className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-[#0D47A1] inline-flex items-center gap-2 h-11 px-6 rounded-xl shadow-sm transition-all active:scale-95 font-medium text-sm">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </button>
          </div>

          {/* Success */}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
              <span className="text-green-600 font-bold">{successMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-8 space-y-8">

              {/* Chat CTA */}
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, ease: "easeOut" }}>
                <Card className="overflow-hidden border-none shadow-2xl bg-[#0D47A1] relative group rounded-3xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#0D47A1] via-[#1A237E] to-[#311B92] opacity-90" />
                  <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-colors duration-700" />
                  <CardContent className="relative p-10 flex flex-col md:flex-row items-center gap-8">
                    <div className="h-20 w-20 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20 shadow-inner transform -rotate-3 group-hover:rotate-0 transition-transform duration-500">
                      <MessageCircle className="h-10 w-10 text-white" />
                    </div>
                    <div className="flex-1 text-center md:text-left space-y-3 pt-8">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00C853]/20 border border-[#00C853]/30 text-[#00C853] text-xs font-bold tracking-wider uppercase">
                        <span className="h-2 w-2 rounded-full bg-[#00C853] animate-pulse" />
                        Support Online
                      </div>
                      <h2 className="text-3xl font-bold text-white tracking-tight">Need Help? Chat with Us!</h2>
                      <p className="text-blue-100/80 text-base leading-relaxed">Our friendly support team is ready to help with anything. Get instant answers in real-time.</p>
                      <div className="pt-4">
                        <button
                          onClick={() => navigate('/partner/chat')}
                          className="bg-white text-[#0D47A1] hover:bg-blue-50 rounded-xl px-8 h-12 inline-flex items-center gap-3 font-bold shadow-lg shadow-black/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
                        >
                          Start Live Chat
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Support Form */}
              <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden">
                <CardHeader className="p-8 bg-slate-50/50 border-b border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-red-50 flex items-center justify-center border border-red-100 shadow-sm">
                      <Info className="h-6 w-6 text-red-500" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-slate-800">Submit a Support Request</CardTitle>
                      <CardDescription className="text-slate-500">Provide details about your issue or question</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <form onSubmit={(e) => handleSubmit(e)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Issue Type</label>
                        <Select value={issueType} onValueChange={setIssueType} className="bg-slate-50 border-slate-200 h-12 rounded-xl">
                        <SelectContent>
                          <SelectItem value="invoice_query">Invoice Query</SelectItem>
                          <SelectItem value="payment_issue">Payment Issue</SelectItem>
                          <SelectItem value="transaction_error">Transaction Error</SelectItem>
                          <SelectItem value="technical_support">Technical Support</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Transaction ID (Optional)</label>
                        <Input value={transactionId} onChange={(e) => setTransactionId(e.target.value)}
                          placeholder="e.g. TR-99283" className="bg-slate-50 border-slate-200 h-12 rounded-xl" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Description *</label>
                      <Textarea value={description} onChange={(e) => setDescription(e.target.value)}
                        placeholder="Please describe your issue in detail..."
                        className="min-h-[160px] bg-slate-50 border-slate-200 rounded-2xl resize-none p-4" />
                    </div>
                    <SendButton
                      disabled={submitting || !description.trim()}
                      onClick={() => handleSubmit()}
                    />
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-4 space-y-8">
              <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden">
                <div className="p-8 space-y-8">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="h-16 w-16 rounded-3xl bg-blue-50 flex items-center justify-center border border-blue-100 shadow-sm transform rotate-3">
                      <HelpCircle className="h-8 w-8 text-[#0D47A1]" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold text-slate-800">Admin Support</h3>
                      <p className="text-slate-500 text-sm leading-relaxed">Our dedicated admin team is available for direct assistance.</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {[
                      { icon: Mail, label: "Email", value: "plus1rewards@gmail.com", color: "text-blue-500" },
                      { icon: Phone, label: "Phone", value: "071 432 9190", color: "text-green-500" },
                      { icon: Clock, label: "Hours", value: "Mon-Fri: 7:30 - 19:00", color: "text-orange-500" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:bg-white hover:shadow-md transition-all duration-300">
                        <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center border border-slate-200 shadow-sm">
                          <item.icon className={`h-5 w-5 ${item.color}`} />
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.label}</p>
                          <p className="text-sm font-bold text-slate-700">{item.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <a href="https://wa.me/27714329190" target="_blank" rel="noopener noreferrer">
                    <button className="w-full bg-[#00C853] hover:bg-[#00B24A] text-white inline-flex items-center justify-center gap-3 h-14 rounded-2xl font-bold shadow-lg transition-all hover:scale-[1.02] active:scale-100">
                      <MessageCircle className="h-5 w-5" />
                      WhatsApp Support
                    </button>
                  </a>
                </div>
              </Card>

              <div className="bg-gradient-to-br from-blue-600 to-[#0D47A1] rounded-3xl p-8 text-white shadow-xl relative overflow-hidden group">
                <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700" />
                <div className="relative space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
                      <Info className="h-4 w-4 text-white" />
                    </div>
                    <h4 className="font-bold text-base">Quick Response</h4>
                  </div>
                  <p className="text-blue-50/80 text-sm leading-relaxed">
                    We typically respond within <span className="text-white font-bold underline decoration-[#00C853] underline-offset-4">15 minutes</span> during business hours.
                  </p>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-blue-200 uppercase tracking-widest">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#00C853]" />
                    Priority Support Active
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Common Topics */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-[#0D47A1]" />
                Common Support Topics
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
              {[
                { title: "Invoice Questions", desc: "Billing and payment queries", icon: Receipt, color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
                { title: "Transaction Issues", desc: "Failed or pending transactions", icon: FileText, color: "bg-blue-50 text-blue-600 border-blue-100" },
                { title: "Account Setup", desc: "Profile and settings help", icon: UserPlus, color: "bg-purple-50 text-purple-600 border-purple-100" },
                { title: "Cashback Queries", desc: "Cashback rates and calculations", icon: HelpCircle, color: "bg-orange-50 text-orange-600 border-orange-100" },
              ].map((topic, i) => (
                <motion.div key={i} whileHover={{ y: -5 }} className="group h-full">
                  <Card className="border-none bg-white shadow-sm hover:shadow-md transition-all cursor-pointer rounded-2xl h-full min-h-[160px]">
                    <CardContent className="p-6 pt-8 flex flex-col gap-4 h-full">
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center border ${topic.color} group-hover:scale-110 transition-transform flex-shrink-0`}>
                        <topic.icon className="h-6 w-6" />
                      </div>
                      <div className="space-y-1 flex-1">
                        <h4 className="font-bold text-slate-800 group-hover:text-[#0D47A1] transition-colors">{topic.title}</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">{topic.desc}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* Feedback Modal */}
      {feedbackConversation && (
        <FeedbackModal
          isOpen={showFeedbackModal}
          onClose={handleFeedbackClose}
          conversationId={feedbackConversation.id}
          userType="partner"
        />
      )}
    </PartnerLayout>
  );
}
