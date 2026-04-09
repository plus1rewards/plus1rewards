// Chat Feedback Modal - Beautiful animated emoji feedback system
import { useState } from 'react';
import { supabase } from '../../lib/supabase';

interface ChatFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  memberId: string;
}

const RATINGS = [
  { value: 'angry', label: 'Angry' },
  { value: 'sad', label: 'Sad' },
  { value: 'ok', label: 'Okay' },
  { value: 'good', label: 'Good' },
  { value: 'happy', label: 'Happy' }
];

export default function ChatFeedbackModal({ isOpen, onClose, conversationId, memberId }: ChatFeedbackModalProps) {
  const [selectedRating, setSelectedRating] = useState<string>('good');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!selectedRating) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('chat_feedback')
        .insert([{
          conversation_id: conversationId,
          member_id: memberId,
          rating: selectedRating,
          comment: comment.trim() || null
        }]);

      if (error) throw error;

      setSubmitted(true);
      setTimeout(() => {
        onClose();
        setSubmitted(false);
        setSelectedRating('good');
        setComment('');
      }, 2000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    onClose();
    setSelectedRating('good');
    setComment('');
  };

  if (!isOpen) return null;

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <span className="text-5xl">✓</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Thank You! 🎉</h3>
          <p className="text-gray-600">Your feedback helps us improve our service</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <style>{`
        .feedback-widget {
          --normal: #ECEAF3;
          --normal-shadow: #D9D8E3;
          --normal-mouth: #9795A4;
          --normal-eye: #595861;
          --active: #F8DA69;
          --active-shadow: #F4B555;
          --active-mouth: #F05136;
          --active-eye: #313036;
          --active-tear: #76b5e7;
          --active-shadow-angry: #e94f1d;
        }
        
        .feedback-widget li {
          position: relative;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: var(--sb, var(--normal));
          box-shadow: inset 3px -3px 4px var(--sh, var(--normal-shadow));
          transition: background .4s, box-shadow .4s, transform .3s;
          cursor: pointer;
        }
        
        .feedback-widget li:active:not(.active) {
          transform: scale(.925);
        }
        
        .feedback-widget li.active {
          --sb: var(--active);
          --sh: var(--active-shadow);
          --m: var(--active-mouth);
          --e: var(--active-eye);
        }
        
        .feedback-widget li.active > div {
          animation: shake .8s linear forwards;
        }
        
        .feedback-widget li > div {
          width: 60px;
          height: 60px;
          position: relative;
          transform: perspective(240px) translateZ(4px);
        }
        
        .feedback-widget svg {
          display: block;
          position: absolute;
          fill: none;
          stroke: var(--s);
          stroke-width: 2px;
          stroke-linecap: round;
          stroke-linejoin: round;
          transition: stroke .4s;
        }
        
        .feedback-widget .eye {
          --s: var(--e, var(--normal-eye));
          width: 10px;
          height: 6px;
          top: 22px;
        }
        
        .feedback-widget .eye.left {
          left: 14px;
        }
        
        .feedback-widget .eye.right {
          left: 36px;
        }
        
        .feedback-widget .mouth {
          --s: var(--m, var(--normal-mouth));
          width: 28px;
          height: 10px;
          left: 16px;
          top: 34px;
        }
        
        .feedback-widget li:before,
        .feedback-widget li:after {
          content: '';
          display: block;
          position: absolute;
          z-index: var(--zi, 1);
          border-radius: var(--br, 1px);
          background: var(--b, var(--e, var(--normal-eye)));
          transition: background .4s;
        }
        
        /* Angry */
        .feedback-widget .angry:before {
          width: 12px;
          height: 3px;
          left: 14px;
          top: 21px;
          transform: rotate(20deg);
        }
        
        .feedback-widget .angry:after {
          width: 12px;
          height: 3px;
          left: 36px;
          top: 21px;
          transform: rotate(-20deg);
        }
        
        .feedback-widget .angry .eye {
          stroke-dasharray: 4.55;
          stroke-dashoffset: 8.15;
        }
        
        .feedback-widget .angry.active {
          animation: angry 1s linear;
        }
        
        /* Sad */
        .feedback-widget .sad:before,
        .feedback-widget .sad:after {
          --b: var(--active-tear);
          width: 8px;
          height: 8px;
          border-radius: 50%;
          top: 20px;
          transform: scale(0);
        }
        
        .feedback-widget .sad:before {
          left: 17px;
        }
        
        .feedback-widget .sad:after {
          left: 39px;
        }
        
        .feedback-widget .sad.active:before,
        .feedback-widget .sad.active:after {
          animation: tear .6s linear forwards;
        }
        
        .feedback-widget .sad .mouth {
          top: 36px;
          stroke-dasharray: 9.5;
          stroke-dashoffset: 33.25;
        }
        
        /* OK */
        .feedback-widget .ok:before {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          left: 18px;
          top: 24px;
          box-shadow: 18px 0 0 var(--e, var(--normal-eye));
        }
        
        .feedback-widget .ok:after {
          width: 21px;
          height: 3px;
          left: 20px;
          top: 38px;
          background: var(--m, var(--normal-mouth));
        }
        
        /* Good */
        .feedback-widget .good:before {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          left: 16px;
          top: 33px;
          opacity: .5;
          filter: blur(2px);
          background: var(--m, var(--normal-mouth));
          box-shadow: 24px 0 0 var(--m, var(--normal-mouth));
          z-index: 0;
        }
        
        .feedback-widget .good .eye {
          top: 20px;
          transform: scaleY(-1);
          stroke-dasharray: 4.55;
          stroke-dashoffset: 8.15;
        }
        
        .feedback-widget .good .mouth {
          top: 33px;
          transform: scaleY(-1);
          stroke-dasharray: 13.3;
          stroke-dashoffset: 23.75;
        }
        
        .feedback-widget .good.active .mouth {
          animation: toggle-mouth .8s linear forwards;
        }
        
        /* Happy */
        .feedback-widget .happy .eye {
          top: 19px;
          transform: scaleY(-1);
        }
        
        .feedback-widget .happy:after {
          width: 27px;
          height: 12px;
          left: 17px;
          top: 34px;
          border-radius: 0 0 12px 12px;
          background: var(--m, var(--normal-mouth));
        }
        
        .feedback-widget .happy.active:after {
          animation: toggle-happy .8s linear forwards;
        }
        
        @keyframes shake {
          30% {
            transform: perspective(240px) rotateX(var(--step-1-rx, 0deg)) rotateY(var(--step-1-ry, 0deg)) rotateZ(var(--step-1-rz, 0deg)) translateZ(10px);
          }
          60% {
            transform: perspective(240px) rotateX(var(--step-2-rx, 0deg)) rotateY(var(--step-2-ry, 0deg)) rotateZ(var(--step-2-rz, 0deg)) translateZ(10px);
          }
          100% {
            transform: perspective(240px) translateZ(4px);
          }
        }
        
        @keyframes tear {
          0% {
            opacity: 0;
            transform: translateY(-2px) scale(0);
          }
          50% {
            transform: translateY(18px) scale(.6, 1.2);
          }
          20%, 80% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translateY(36px) translateX(6px) rotateZ(-30deg) scale(.7, 1.1);
          }
        }
        
        @keyframes toggle-mouth {
          50% {
            transform: translateY(1px) scaleY(-1);
          }
        }
        
        @keyframes toggle-happy {
          50% {
            transform: scale(.95, .75);
          }
        }
        
        @keyframes angry {
          40% {
            background: var(--active);
          }
          45% {
            box-shadow: inset 3px -3px 4px var(--active-shadow), inset 0 8px 10px var(--active-shadow-angry);
          }
        }
        
        .angry { --step-1-rx: -24deg; --step-1-ry: 20deg; --step-2-rx: -24deg; --step-2-ry: -20deg; }
        .sad { --step-1-rx: 20deg; --step-1-ry: -12deg; --step-2-rx: -18deg; --step-2-ry: 14deg; }
        .ok { --step-1-rx: 4deg; --step-1-ry: -22deg; --step-1-rz: 6deg; --step-2-rx: 4deg; --step-2-ry: 22deg; --step-2-rz: -6deg; }
        .good { --step-1-rx: -14deg; --step-1-rz: 10deg; --step-2-rx: 10deg; --step-2-rz: -8deg; }
        .happy { --step-1-rx: 18deg; --step-1-ry: 24deg; --step-2-rx: 18deg; --step-2-ry: -24deg; }
      `}</style>
      
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1a558b] via-[#2563eb] to-purple-600 p-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
          
          <div className="relative text-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-4xl">💬</span>
            </div>
            <h3 className="text-2xl font-bold mb-2">How was your experience?</h3>
            <p className="text-white/90 text-sm">We'd love to hear your feedback!</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Rating Selection */}
          <div className="mb-8">
            <label className="block text-sm font-bold text-gray-700 mb-6 text-center">
              Rate your support experience
            </label>
            <ul className="feedback-widget flex justify-center gap-4">
              <svg xmlns="http://www.w3.org/2000/svg" style={{ display: 'none' }}>
                <symbol viewBox="0 0 7 4" id="eye">
                  <path d="M1,1 C1.83333333,2.16666667 2.66666667,2.75 3.5,2.75 C4.33333333,2.75 5.16666667,2.16666667 6,1"></path>
                </symbol>
                <symbol viewBox="0 0 18 7" id="mouth">
                  <path d="M1,5.5 C3.66666667,2.5 6.33333333,1 9,1 C11.6666667,1 14.3333333,2.5 17,5.5"></path>
                </symbol>
              </svg>
              
              {RATINGS.map((rating) => (
                <li
                  key={rating.value}
                  className={`${rating.value} ${selectedRating === rating.value ? 'active' : ''}`}
                  onClick={() => setSelectedRating(rating.value)}
                >
                  <div>
                    {rating.value !== 'ok' && (
                      <>
                        <svg className="eye left">
                          <use xlinkHref="#eye" />
                        </svg>
                        <svg className="eye right">
                          <use xlinkHref="#eye" />
                        </svg>
                      </>
                    )}
                    {(rating.value === 'angry' || rating.value === 'sad' || rating.value === 'good') && (
                      <svg className="mouth">
                        <use xlinkHref="#mouth" />
                      </svg>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex justify-center gap-4 mt-4">
              {RATINGS.map((rating) => (
                <span
                  key={rating.value}
                  className={`text-xs font-bold transition-all ${
                    selectedRating === rating.value ? 'text-[#1a558b] scale-110' : 'text-gray-400'
                  }`}
                >
                  {rating.label}
                </span>
              ))}
            </div>
          </div>

          {/* Comment (Optional) */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Additional comments (optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us more about your experience..."
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#1a558b] focus:ring-2 focus:ring-[#1a558b]/20 transition-all text-sm resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleSkip}
              className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all"
            >
              Skip
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedRating || submitting}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-[#1a558b] to-blue-600 hover:from-[#1a558b]/90 hover:to-blue-600/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">send</span>
                  Submit Feedback
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
