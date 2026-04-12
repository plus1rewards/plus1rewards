import { useState } from 'react';
import { X, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabaseAdmin } from '../../lib/supabase';
import './FeedbackModal.css';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  userType: 'member' | 'partner';
}

export default function FeedbackModal({ isOpen, onClose, conversationId, userType }: FeedbackModalProps) {
  const [rating, setRating] = useState(4); // Default to 'good' (index 3, but rating 4)
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    setSubmitting(true);
    try {
      // Use the PostgreSQL function to update feedback in chat schema
      const { error } = await supabaseAdmin.rpc('update_chat_feedback', {
        p_conversation_id: conversationId,
        p_user_type: userType,
        p_rating: rating,
        p_comment: feedback.trim() || null
      });

      if (error) throw error;

      alert('Thank you for your feedback!');
      onClose();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRatingClick = (newRating: number) => {
    setRating(newRating);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-br from-[#0D47A1] to-[#1A237E] p-6 relative overflow-hidden">
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
              <div className="relative">
                <h2 className="text-2xl font-bold text-white mb-2">How was your experience?</h2>
                <p className="text-blue-100/80 text-sm">Your feedback helps us improve our support</p>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Emoji Rating */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700">Rate your experience</label>
                <div className="flex justify-center">
                  <ul className="feedback">
                    <li className={`angry ${rating === 1 ? 'active' : ''}`} onClick={() => handleRatingClick(1)}>
                      <div>
                        <svg className="eye left"><use xlinkHref="#eye" /></svg>
                        <svg className="eye right"><use xlinkHref="#eye" /></svg>
                        <svg className="mouth"><use xlinkHref="#mouth" /></svg>
                      </div>
                    </li>
                    <li className={`sad ${rating === 2 ? 'active' : ''}`} onClick={() => handleRatingClick(2)}>
                      <div>
                        <svg className="eye left"><use xlinkHref="#eye" /></svg>
                        <svg className="eye right"><use xlinkHref="#eye" /></svg>
                        <svg className="mouth"><use xlinkHref="#mouth" /></svg>
                      </div>
                    </li>
                    <li className={`ok ${rating === 3 ? 'active' : ''}`} onClick={() => handleRatingClick(3)}>
                      <div></div>
                    </li>
                    <li className={`good ${rating === 4 ? 'active' : ''}`} onClick={() => handleRatingClick(4)}>
                      <div>
                        <svg className="eye left"><use xlinkHref="#eye" /></svg>
                        <svg className="eye right"><use xlinkHref="#eye" /></svg>
                        <svg className="mouth"><use xlinkHref="#mouth" /></svg>
                      </div>
                    </li>
                    <li className={`happy ${rating === 5 ? 'active' : ''}`} onClick={() => handleRatingClick(5)}>
                      <div>
                        <svg className="eye left"><use xlinkHref="#eye" /></svg>
                        <svg className="eye right"><use xlinkHref="#eye" /></svg>
                      </div>
                    </li>
                  </ul>
                  <svg xmlns="http://www.w3.org/2000/svg" style={{ display: 'none' }}>
                    <symbol xmlns="http://www.w3.org/2000/svg" viewBox="0 0 7 4" id="eye">
                      <path d="M1,1 C1.83333333,2.16666667 2.66666667,2.75 3.5,2.75 C4.33333333,2.75 5.16666667,2.16666667 6,1"></path>
                    </symbol>
                    <symbol xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 7" id="mouth">
                      <path d="M1,5.5 C3.66666667,2.5 6.33333333,1 9,1 C11.6666667,1 14.3333333,2.5 17,5.5"></path>
                    </symbol>
                  </svg>
                </div>
                {rating > 0 && (
                  <p className="text-center text-sm text-gray-600 mt-4">
                    {rating === 1 && 'Very Dissatisfied'}
                    {rating === 2 && 'Dissatisfied'}
                    {rating === 3 && 'Neutral'}
                    {rating === 4 && 'Satisfied'}
                    {rating === 5 && 'Very Satisfied'}
                  </p>
                )}
              </div>

              {/* Feedback Text */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Additional comments (optional)</label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Tell us more about your experience..."
                  className="w-full min-h-[100px] px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl resize-none focus:ring-2 focus:ring-[#1a558b]/20 focus:border-[#1a558b] outline-none text-sm"
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={rating === 0 || submitting}
                className="w-full bg-[#0D47A1] hover:bg-[#0D47A1]/90 text-white h-12 rounded-xl font-bold shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Feedback
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
