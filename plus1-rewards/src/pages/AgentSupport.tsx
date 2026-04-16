import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, MessageCircle, Mail, Phone, Clock, Info,
  Receipt, FileText, UserPlus, HelpCircle, ChevronRight
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem } from "../components/ui/select";
import SendButton from "../components/ui/SendButton";
import AgentLayout from "../components/agent/AgentLayout";

interface Agent {
  id: string;
  name: string;
  surname: string;
  phone: string;
  email: string;
}

export default function AgentSupport() {
  const navigate = useNavigate();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [issueType, setIssueType] = useState("commission_query");
  const [transactionId, setTransactionId] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => { checkAuthAndLoadData(); }, []);

  const checkAuthAndLoadData = async () => {
    try {
      const agentDataStr = sessionStorage.getItem('currentAgent') || localStorage.getItem('currentAgent');
      
      if (!agentDataStr) {
        navigate('/agent/login');
        return;
      }

      const agentData = JSON.parse(agentDataStr);
      
      const { data: currentAgent, error: agentError } = await supabase
        .from('agents')
        .select('*')
        .eq('id', agentData.agent_id || agentData.id)
        .single();

      if (agentError || !currentAgent) {
        sessionStorage.removeItem('currentAgent');
        localStorage.removeItem('currentAgent');
        navigate('/agent/login');
        return;
      }

      if (currentAgent.status !== 'active') {
        sessionStorage.removeItem('currentAgent');
        localStorage.removeItem('currentAgent');
        alert('Your agent account is not yet approved.');
        navigate('/agent/login');
        return;
      }

      const combinedData = {
        ...currentAgent,
        name: currentAgent.first_name || 'Agent',
        surname: currentAgent.surname || '',
        phone: currentAgent.cell_phone || '',
        email: currentAgent.email || ''
      };

      setAgent(combinedData as Agent);
    } catch (error) {
      console.error('Auth check failed:', error);
      navigate('/agent/login');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e?: { preventDefault: () => void }) => {
    e?.preventDefault();
    if (!description.trim() || !agent) return;
    setSubmitting(true);
    try {
      const txId = transactionId.trim().match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
        ? transactionId.trim() : null;
      
      const disputeTypeMap: Record<string, string> = {
        'commission_query': 'other',
        'payment_issue': 'other',
        'partner_recruitment': 'other',
        'account_access': 'other',
        'general_inquiry': 'other'
      };
      
      const { error } = await supabase.from("disputes").insert([{
        dispute_type: disputeTypeMap[issueType] || 'other',
        description: `Agent Support - ${issueType}: ${description.trim()}`,
        transaction_id: txId,
        status: 'open',
        agent_id: agent.id
      }]);
      if (error) {
        console.error('Support ticket error:', error);
        throw error;
      }
      setSuccessMessage("Support ticket submitted! Our team will review it within 24 hours.");
      setDescription(""); setTransactionId(""); setIssueType("commission_query");
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch { alert("Failed to submit. Please try again."); }
    finally { setSubmitting(false); }
  };

  const handleSignOut = () => {
    sessionStorage.removeItem('currentAgent');
    localStorage.removeItem('currentAgent');
    navigate("/agent/login");
  };

  if (loading) return (
    <AgentLayout agent={agent} onSignOut={handleSignOut}>
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-[#1a558b]/20 border-t-[#1a558b] rounded-full animate-spin mx-auto"></div>
      </div>
    </AgentLayout>
  );

  if (!agent) return null;

  return (
    <AgentLayout agent={agent} onSignOut={handleSignOut}>
      <div className="min-h-screen font-sans text-slate-900 -mx-4 md:-mx-8 px-4 md:px-8">
        <main className="mx-auto max-w-[1400px] px-4 md:px-6 py-6 md:py-8">

          {/* Page header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900">Support Center</h1>
              <p className="text-slate-500 text-base md:text-lg mt-1">We're here to help resolve any issues quickly.</p>
            </div>
            <button
              onClick={() => navigate("/agent/dashboard")}
              className="self-start sm:self-auto bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 inline-flex items-center gap-2 h-10 md:h-11 px-5 md:px-6 rounded-xl shadow-sm transition-all text-sm md:text-base font-medium flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
              Back
            </button>
          </div>

          {/* Success banner */}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 md:p-5 mb-6 flex items-center gap-3">
              <span className="text-green-600 font-bold text-sm md:text-base">{successMessage}</span>
            </div>
          )}

          <div className="space-y-6 md:space-y-8">

            {/* Chat CTA */}
            <div className="bg-gradient-to-br from-[#0D47A1] via-[#1A237E] to-[#311B92] rounded-2xl md:rounded-3xl p-6 md:p-10 relative overflow-hidden">
              <div className="absolute -right-16 -top-16 w-48 h-48 md:w-64 md:h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5 md:gap-8">
                <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 flex-shrink-0">
                  <MessageCircle className="h-8 w-8 md:h-10 md:w-10 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00C853]/20 border border-[#00C853]/30 text-[#00C853] text-xs font-bold tracking-wider uppercase mb-3">
                    <span className="h-2 w-2 rounded-full bg-[#00C853] animate-pulse" />
                    Support Online
                  </div>
                  <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-white leading-tight">Need Help? Chat with Us!</h2>
                  <p className="text-blue-100/80 text-sm md:text-base mt-2">Our team is ready to help with anything.</p>
                </div>
                <button
                  onClick={() => navigate('/agent/chat')}
                  className="w-full sm:w-auto bg-white text-[#0D47A1] hover:bg-blue-50 rounded-xl px-6 md:px-8 h-11 md:h-12 inline-flex items-center justify-center gap-2 font-bold text-sm md:text-base shadow-lg transition-all flex-shrink-0"
                >
                  Start Live Chat
                  <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
                </button>
              </div>
            </div>

            {/* Main grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

              {/* Support form */}
              <div className="lg:col-span-2 space-y-5">
                <div className="bg-white rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-5 md:px-6 lg:px-8 py-4 md:py-5 border-b border-slate-100 bg-slate-50 flex items-center gap-4">
                    <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl bg-red-50 flex items-center justify-center border border-red-100 flex-shrink-0">
                      <Info className="h-5 w-5 md:h-6 md:w-6 text-red-500" />
                    </div>
                    <div>
                      <h3 className="text-base md:text-lg lg:text-xl font-bold text-slate-800">Submit a Support Request</h3>
                      <p className="text-sm md:text-base text-slate-500">Provide details about your issue or question</p>
                    </div>
                  </div>
                  <div className="p-5 md:p-6">
                    <form onSubmit={(e) => handleSubmit(e)} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs md:text-sm font-bold text-slate-600 uppercase tracking-widest">Issue Type</label>
                          <Select value={issueType} onValueChange={setIssueType} className="bg-slate-50 border-slate-200 h-11 md:h-12 rounded-xl text-sm md:text-base">
                            <SelectContent>
                              <SelectItem value="commission_query">Commission Query</SelectItem>
                              <SelectItem value="partner_recruitment">Partner Recruitment</SelectItem>
                              <SelectItem value="payout_issue">Payout Issue</SelectItem>
                              <SelectItem value="technical_support">Technical Support</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs md:text-sm font-bold text-slate-600 uppercase tracking-widest">Transaction ID (Optional)</label>
                          <Input value={transactionId} onChange={(e) => setTransactionId(e.target.value)}
                            placeholder="e.g. TR-99283" className="bg-slate-50 border-slate-200 h-11 md:h-12 rounded-xl text-sm md:text-base" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs md:text-sm font-bold text-slate-600 uppercase tracking-widest">Description *</label>
                        <Textarea value={description} onChange={(e) => setDescription(e.target.value)}
                          placeholder="Please describe your issue in detail..."
                          className="min-h-[100px] md:min-h-[120px] bg-slate-50 border-slate-200 rounded-xl md:rounded-2xl resize-none p-4 text-sm md:text-base" />
                      </div>
                      <SendButton
                        disabled={submitting || !description.trim()}
                        onClick={() => handleSubmit()}
                      />
                    </form>
                  </div>
                </div>

                {/* Common Support Topics */}
                <div>
                  <h3 className="text-base md:text-lg font-bold text-slate-700 flex items-center gap-2 mb-4">
                    <HelpCircle className="h-5 w-5 md:h-6 md:w-6 text-[#0D47A1]" />
                    Common Support Topics
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { title: "Commission Tracking", desc: "View and track your earnings", icon: Receipt, color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
                      { title: "Partner Recruitment", desc: "Help with onboarding partners", icon: FileText, color: "bg-blue-50 text-blue-600 border-blue-100" },
                      { title: "Payout Support", desc: "Payment and withdrawal queries", icon: UserPlus, color: "bg-purple-50 text-purple-600 border-purple-100" },
                    ].map((topic, i) => (
                      <div key={i} className="bg-white border border-slate-200 rounded-xl md:rounded-2xl p-4 md:p-5 hover:shadow-md transition-all cursor-pointer group">
                        <div className={`h-10 w-10 md:h-12 md:w-12 rounded-xl flex items-center justify-center border ${topic.color} mb-3 group-hover:scale-110 transition-transform`}>
                          <topic.icon className="h-5 w-5 md:h-6 md:w-6" />
                        </div>
                        <p className="font-bold text-slate-800 text-sm md:text-base leading-tight group-hover:text-[#0D47A1] transition-colors">{topic.title}</p>
                        <p className="text-xs md:text-sm text-slate-400 mt-1 leading-tight">{topic.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Contact sidebar */}
              <div className="space-y-5 md:space-y-6">
                {/* Admin contact card */}
                <div className="bg-white rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm p-5 md:p-6 lg:p-8">
                  <div className="flex items-center gap-3 md:gap-4 mb-5 md:mb-6">
                    <div className="h-12 w-12 md:h-14 md:w-14 rounded-xl md:rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100 flex-shrink-0">
                      <HelpCircle className="h-6 w-6 md:h-7 md:w-7 text-[#0D47A1]" />
                    </div>
                    <div>
                      <h3 className="text-base md:text-lg lg:text-xl font-bold text-slate-800">Admin Support</h3>
                      <p className="text-sm md:text-base text-slate-500">Direct assistance available</p>
                    </div>
                  </div>

                  <div className="space-y-3 md:space-y-4 mb-5 md:mb-6">
                    {[
                      { icon: Mail, label: "Email", value: "plus1rewards@gmail.com", color: "text-blue-500" },
                      { icon: Phone, label: "Phone", value: "071 432 9190", color: "text-green-500" },
                      { icon: Clock, label: "Hours", value: "Mon-Fri: 7:30 - 19:00", color: "text-orange-500" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl md:rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="h-9 w-9 md:h-10 md:w-10 rounded-lg md:rounded-xl bg-white flex items-center justify-center border border-slate-200 flex-shrink-0">
                          <item.icon className={`h-4 w-4 md:h-5 md:w-5 ${item.color}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-widest">{item.label}</p>
                          <p className="text-sm md:text-base font-bold text-slate-700 truncate">{item.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <a href="https://wa.me/27714329190" target="_blank" rel="noopener noreferrer">
                    <button className="w-full bg-[#00C853] hover:bg-[#00B24A] text-white inline-flex items-center justify-center gap-2 md:gap-3 h-12 md:h-14 rounded-xl md:rounded-2xl font-bold text-sm md:text-base shadow-sm transition-all">
                      <MessageCircle className="h-4 w-4 md:h-5 md:w-5" />
                      WhatsApp Support
                    </button>
                  </a>
                </div>

                {/* Quick response badge */}
                <div className="bg-gradient-to-br from-blue-600 to-[#0D47A1] rounded-2xl md:rounded-3xl p-5 md:p-6 lg:p-8 text-white relative overflow-hidden">
                  <div className="absolute -right-8 -bottom-8 w-24 h-24 md:w-32 md:h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
                  <div className="relative">
                    <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                      <div className="h-8 w-8 md:h-9 md:w-9 rounded-lg md:rounded-xl bg-white/20 flex items-center justify-center">
                        <Info className="h-4 w-4 md:h-5 md:w-5 text-white" />
                      </div>
                      <h4 className="font-bold text-sm md:text-base lg:text-lg">Quick Response</h4>
                    </div>
                    <p className="text-blue-100/80 text-sm md:text-base leading-relaxed">
                      We typically respond within <span className="text-white font-bold underline decoration-[#00C853] underline-offset-2">15 minutes</span> during business hours.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </AgentLayout>
  );
}
