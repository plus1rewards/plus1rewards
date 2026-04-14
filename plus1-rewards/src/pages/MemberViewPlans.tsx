import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Star, ChevronLeft, ChevronRight, Users, User, Heart, Plus, Trash2, Search, Info, Zap, Clock } from 'lucide-react';
import { PLAN_CATEGORIES, FEATURE_KEYS, FEATURE_DESCRIPTIONS, WAITING_PERIODS } from '../constants';
import { FamilyOption, Plan } from '../types';

// Flatten all plans for easy selection
const ALL_PLANS = PLAN_CATEGORIES.flatMap((cat: any) => 
  cat.plans.map((plan: any) => ({ ...plan, categoryLabel: cat.label, categoryId: cat.id }))
);

export default function App() {
  const [selectedPlanIds, setSelectedPlanIds] = useState<string[]>(['v-plus-h', 'plat-h', 'exec-h']);
  const [familyOption, setFamilyOption] = useState<FamilyOption>('Single');
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [currentBenefitIndex, setCurrentBenefitIndex] = useState(0);
  const [diffMode, setDiffMode] = useState<'waiting' | 'unique'>('waiting');
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const selectedPlans = useMemo(() => 
    selectedPlanIds.map(id => ALL_PLANS.find((p: any) => p.id === id)).filter(Boolean) as (Plan & { categoryLabel: string, categoryId: string })[],
    [selectedPlanIds]
  );

  const availableFeatureKeys = useMemo(() => 
    FEATURE_KEYS.filter((k: string) => k !== 'price' && selectedPlans.some((p: any) => p.features[k].isIncluded)),
    [selectedPlans]
  );

  useEffect(() => {
    if (currentBenefitIndex >= availableFeatureKeys.length && availableFeatureKeys.length > 0) {
      setCurrentBenefitIndex(availableFeatureKeys.length - 1);
    } else if (availableFeatureKeys.length === 0) {
      setCurrentBenefitIndex(0);
    }
  }, [availableFeatureKeys, currentBenefitIndex]);

  const filteredPlans = useMemo(() => 
    ALL_PLANS.filter((p: any) => 
      !selectedPlanIds.includes(p.id) && 
      (p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase()))
    ),
    [selectedPlanIds, searchQuery]
  );

  const addPlan = (id: string) => {
    if (selectedPlanIds.length >= 3) return;
    setSelectedPlanIds([...selectedPlanIds, id]);
    setIsPickerOpen(false);
    setSearchQuery('');
  };

  const getFeatureIcon = (key: string) => {
    switch (key) {
      case 'doctors': return <User className="w-5 h-5" />;
      case 'specialist': return <Star className="w-5 h-5" />;
      case 'meds_acute': return <Heart className="w-5 h-5" />;
      case 'meds_chronic': return <Heart className="w-5 h-5" />;
      case 'meds_combined': return <Heart className="w-5 h-5" />;
      case 'radiology': return <Info className="w-5 h-5" />;
      case 'pathology': return <Info className="w-5 h-5" />;
      case 'dentistry': return <Info className="w-5 h-5" />;
      case 'optometry': return <Info className="w-5 h-5" />;
      case 'out_of_area': return <Users className="w-5 h-5" />;
      case 'hospital_illness': return <Heart className="w-5 h-5" />;
      case 'accident': return <Info className="w-5 h-5" />;
      case 'funeral': return <Info className="w-5 h-5" />;
      case 'emergency': return <Star className="w-5 h-5" />;
      default: return <Info className="w-5 h-5" />;
    }
  };

  const removePlan = (id: string) => {
    setSelectedPlanIds(selectedPlanIds.filter(pId => pId !== id));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-24 font-sans overflow-x-hidden">
      {/* 1. Header - Premium Gradient */}
      <header className="premium-gradient py-6 md:py-10 px-4 md:px-6 shadow-xl">
        <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary font-black text-2xl shadow-2xl">D1</div>
              <h1 className="text-3xl md:text-5xl font-display font-black text-white tracking-tight leading-tight">
                Day1 Health Plans
              </h1>
            </div>
            <p className="text-white/80 text-sm md:text-xl max-w-2xl font-medium leading-relaxed">
              Pick any plans you like and see them side-by-side.
            </p>
          </div>
          
          <div className="flex flex-col gap-3 w-full md:w-auto">
            <div className="flex flex-col md:items-end gap-0">
              <p className="text-[11px] font-black uppercase tracking-widest text-white/60">Who are you buying for?</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-1.5 rounded-2xl flex flex-wrap w-full md:w-auto shadow-2xl border border-white/20">
              {(['Single', 'Couple', 'Family'] as FamilyOption[]).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setFamilyOption(opt)}
                  className={`flex-1 md:flex-none px-4 md:px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                    familyOption === opt 
                      ? 'bg-white text-primary shadow-xl scale-105 z-10' 
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {opt === 'Single' && <User className="w-4 h-4" />}
                  {opt === 'Couple' && <Heart className="w-4 h-4" />}
                  {opt === 'Family' && <Users className="w-4 h-4" />}
                  <span className="whitespace-nowrap">{opt}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow w-full px-4 md:px-12 py-6">
        {/* Mobile Comparison Trigger - More Prominent */}
        <div className="md:hidden mb-8 space-y-4">
          <div className="bg-primary/5 p-6 rounded-[2.5rem] border border-primary/10">
            <h3 className="text-xl font-black text-primary mb-2">Ready to compare?</h3>
            <p className="text-sm text-slate-500 mb-6 font-medium">Select up to 4 plans to see them side-by-side and find the best value for you.</p>
            <button 
              onClick={() => setIsPickerOpen(true)}
              className="w-full bg-primary text-white p-6 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-95 transition-transform"
            >
              <Plus className="w-6 h-6" />
              Compare Plans Now
            </button>
          </div>
        </div>

        {/* Simple Guide for Non-Technical Users - Compact on Desktop */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[
            { step: '1', title: 'Pick plans', desc: 'Click "Add Plan" below.' },
            { step: '2', title: 'Compare', desc: 'See benefits side-by-side.' },
            { step: '3', title: 'Choose', desc: 'Click the button at the bottom.' }
          ].map((item) => (
            <div key={item.step} className="bg-white p-3 rounded-2xl border border-slate-200 flex gap-3 items-center shadow-sm">
              <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center font-black text-sm shrink-0 shadow-lg shadow-primary/20">
                {item.step}
              </div>
              <div className="space-y-0">
                <h4 className="font-bold text-slate-800 text-sm">{item.title}</h4>
                <p className="text-slate-400 text-[10px] leading-tight hidden md:block">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 3. MAIN COMPARISON TABLE - Full Width & Spacious */}
        {selectedPlans.length === 0 ? (
          <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-200 p-12 md:p-24 text-center">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8">
              <Plus className="w-10 h-10 text-slate-300" />
            </div>
            <h2 className="text-3xl md:text-5xl font-display font-black text-slate-800 mb-4">No plans selected</h2>
            <p className="text-slate-500 text-lg md:text-xl max-w-lg mx-auto mb-12 font-medium">
              Your comparison table is empty. Click the button below to start picking plans and see them side-by-side.
            </p>
            <button 
              onClick={() => setIsPickerOpen(true)}
              className="bg-primary hover:bg-primary/90 text-white px-12 py-5 rounded-2xl font-black text-xl shadow-2xl shadow-primary/30 transition-all active:scale-95 flex items-center justify-center gap-3 mx-auto"
            >
              <Plus className="w-6 h-6" />
              Add Your First Plan
            </button>
          </div>
        ) : !isMobile ? (
          <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-200">
            <div className="overflow-x-auto no-scrollbar rounded-3xl" ref={tableRef}>
              <table className="w-full border-separate border-spacing-0">
                <thead>
                  <tr>
                    <th className="sticky top-0 left-0 z-50 bg-white p-4 text-left border-b border-r border-slate-100 w-56 min-w-[200px] shadow-[0_2px_4px_rgba(0,0,0,0.05)] rounded-tl-3xl">
                      <div className="flex flex-col gap-1">
                        <span className="text-[8px] uppercase tracking-[0.2em] text-primary font-black">Comparison</span>
                        <h2 className="text-xl font-display font-bold text-slate-800">Benefits</h2>
                      </div>
                    </th>
                    
                    {selectedPlans.map((plan, idx) => (
                      <th 
                        key={plan.id} 
                        className={`sticky top-0 z-40 bg-white p-4 border-b border-slate-100 min-w-[180px] relative group shadow-[0_2px_4px_rgba(0,0,0,0.05)] ${
                          idx === selectedPlans.length - 1 && selectedPlans.length === 4 ? 'rounded-tr-3xl' : ''
                        }`}
                      >
                        <div className="flex flex-col items-center text-center gap-2">
                          <div className="flex items-center justify-between w-full mb-1">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[8px] font-bold rounded-full uppercase tracking-wider">
                              {plan.categoryLabel}
                            </span>
                            <button 
                              onClick={() => removePlan(plan.id)}
                              className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100"
                              title="Remove from comparison"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                          
                          <div className="space-y-0">
                            <h3 className="text-2xl font-display font-black text-primary leading-none">
                              {plan.name}
                            </h3>
                          </div>

                          <div className="w-full pt-2 mt-1 border-t border-slate-50">
                            <div className="text-3xl font-display font-black text-slate-800">
                              R{plan.prices[plan.categoryId === 'day-to-day' ? 'Single' : familyOption]}
                              <span className="text-xs font-sans font-bold text-slate-400 ml-1">/mo</span>
                            </div>
                          </div>
                        </div>
                      </th>
                    ))}

                    {selectedPlans.length < 3 && (
                      <th className="sticky top-0 z-40 p-4 border-b border-slate-100 min-w-[180px] bg-white shadow-[0_2px_4px_rgba(0,0,0,0.05)] rounded-tr-3xl">
                        <button 
                          onClick={() => setIsPickerOpen(true)}
                          className="w-full h-full min-h-[120px] border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-primary hover:text-primary hover:bg-white transition-all group shadow-inner"
                        >
                          <div className="p-3 bg-white rounded-xl shadow-md group-hover:scale-110 transition-all">
                            <Plus className="w-6 h-6" />
                          </div>
                          <span className="block font-black text-sm">Add Plan</span>
                        </button>
                      </th>
                    )}
                  </tr>
                </thead>
                
                <tbody className="divide-y divide-slate-50">
                  {availableFeatureKeys.map((key: string, index: number) => {
                    const featureLabel = ALL_PLANS[0]?.features[key]?.label || '';
                    return (
                      <tr key={key} className={`group/row ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                        <td 
                          className={`sticky left-0 z-30 p-2 md:p-3 border-r border-slate-100 transition-colors cursor-help relative ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}
                          onMouseEnter={() => setHoveredFeature(key)}
                          onMouseLeave={() => setHoveredFeature(null)}
                        >
                          <div className="flex items-center gap-2">
                            <div className="text-slate-400">
                              <div className="scale-75">{getFeatureIcon(key)}</div>
                            </div>
                            <span className="font-bold text-slate-700 text-base uppercase tracking-wider">{featureLabel}</span>
                          </div>

                          <AnimatePresence>
                            {hoveredFeature === key && (
                              <motion.div
                                initial={{ opacity: 0, x: 10, y: -10 }}
                                animate={{ opacity: 1, x: 20, y: 0 }}
                                exit={{ opacity: 0, x: 10, y: -10 }}
                                className="absolute left-full top-0 z-[100] w-80 md:w-96 p-5 bg-slate-900 text-white rounded-2xl shadow-2xl pointer-events-none"
                              >
                                <div className="flex flex-col gap-2">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">What is this?</span>
                                  <p className="text-sm font-medium leading-relaxed">{FEATURE_DESCRIPTIONS[key]}</p>
                                </div>
                                <div className="absolute left-0 top-8 -translate-x-full border-8 border-transparent border-r-slate-900" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </td>
                        
                        {selectedPlans.map((plan) => {
                          const feature = plan.features[key];
                          const isBest = feature.isBetter;
                          const displayValue = feature.value;

                          return (
                            <td 
                              key={plan.id} 
                              className="p-2 md:p-3 text-center relative transition-all duration-300"
                            >
                              <div className="flex flex-col items-center gap-0.5 relative z-10">
                                <div className={`flex items-center gap-1 transition-all duration-500 ${
                                  isBest 
                                    ? 'text-primary font-black' 
                                    : 'text-slate-600 font-medium'
                                }`}>
                                  {displayValue === '✅' && <Check className="w-3 h-3 stroke-[4]" />}
                                  {displayValue === '❌' && <X className="w-3 h-3 text-red-400 stroke-[4]" />}
                                  {displayValue.includes('Priority') && (
                                    <Star className="w-2.5 h-2.5 fill-current" />
                                  )}
                                  {!['✅', '❌'].includes(displayValue) && (
                                    <span className={`text-base tracking-tight ${isBest ? 'drop-shadow-sm' : ''}`}>
                                      {displayValue}
                                    </span>
                                  )}
                                  {isBest && <Star className="w-3 h-3 fill-current ml-0.5 animate-pulse" />}
                                </div>
                              </div>
                            </td>
                          );
                        })}
                        
                        {selectedPlans.length < 3 && <td className="bg-slate-50/10" />}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Mobile View: Benefit Carousel */
          <div className="space-y-6 pb-12">
            {selectedPlans.length === 0 ? (
              <div className="bg-white rounded-[2rem] shadow-lg border border-slate-200 p-10 text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Plus className="w-8 h-8 text-slate-300" />
                </div>
                <h2 className="text-2xl font-display font-black text-slate-800 mb-2">No plans yet</h2>
                <p className="text-slate-500 text-sm mb-8 font-medium">
                  Add some plans to see how they compare.
                </p>
                <button 
                  onClick={() => setIsPickerOpen(true)}
                  className="w-full bg-primary text-white p-5 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-95 transition-transform"
                >
                  <Plus className="w-6 h-6" />
                  Add Plans
                </button>
              </div>
            ) : (
              <>
                {/* Sticky Mobile Plan Legend */}
                <div className="sticky top-0 z-40 bg-slate-50/80 backdrop-blur-md py-4 border-b border-slate-200">
                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                    {selectedPlans.map((plan, idx) => (
                      <div key={plan.id} className="flex items-center gap-2 pl-4 pr-2 py-2 bg-white rounded-xl border border-slate-200 shadow-sm shrink-0 group">
                        <div className="w-5 h-5 rounded-lg bg-primary text-white flex items-center justify-center text-[10px] font-black">
                          {idx + 1}
                        </div>
                        <span className="text-xs font-black text-slate-700 whitespace-nowrap">{plan.name}</span>
                        <button 
                          onClick={() => removePlan(plan.id)}
                          className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove plan"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <div className="overflow-hidden">
                    <AnimatePresence mode="wait">
                      {(() => {
                        const key = availableFeatureKeys[currentBenefitIndex];
                        if (!key) return null;
                        const featureLabel = ALL_PLANS[0].features[key].label;
                        
                        return (
                          <motion.div
                            key={key}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="bg-white rounded-[2rem] border border-slate-200 shadow-lg overflow-hidden"
                          >
                            <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary">
                                {getFeatureIcon(key)}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-black text-slate-800 text-lg leading-tight">{featureLabel}</h4>
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    {currentBenefitIndex + 1} / {availableFeatureKeys.length}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-400 font-medium mt-1">{FEATURE_DESCRIPTIONS[key]}</p>
                              </div>
                            </div>
                            
                            <div className="p-4 grid grid-cols-1 gap-1">
                              {selectedPlans.map((plan, idx) => {
                                const feature = plan.features[key];
                                const isBest = feature.isBetter;
                                return (
                                  <div 
                                    key={plan.id} 
                                    className={`flex items-center justify-between p-3 border-b border-slate-50 last:border-0 transition-all relative ${
                                      isBest ? 'text-primary font-black' : 'text-slate-600 font-medium'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 relative z-10">
                                      <div className={`w-4 h-4 rounded flex items-center justify-center font-black text-[8px] ${
                                        isBest ? 'bg-primary text-white shadow-sm' : 'bg-slate-100 text-slate-400'
                                      }`}>
                                        {idx + 1}
                                      </div>
                                      <span className="text-xs uppercase tracking-wider opacity-80">{plan.name}</span>
                                    </div>
                                    <div className="flex items-center gap-1 relative z-10">
                                      {isBest && <Star className="w-3 h-3 fill-current animate-pulse" />}
                                      <span className={`text-sm ${isBest ? 'drop-shadow-sm' : ''}`}>
                                        {feature.value}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </motion.div>
                        );
                      })()}
                    </AnimatePresence>
                  </div>

                  {/* Carousel Controls */}
                  <div className="flex items-center justify-between mt-6 px-2">
                    <button 
                      onClick={() => setCurrentBenefitIndex(prev => Math.max(0, prev - 1))}
                      disabled={currentBenefitIndex === 0}
                      className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm text-slate-400 disabled:opacity-30 disabled:bg-slate-50 transition-all active:scale-90"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>

                    <div className="flex gap-1.5">
                      {availableFeatureKeys.map((_: string, idx: number) => (
                        <div 
                          key={idx}
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            idx === currentBenefitIndex ? 'w-6 bg-primary' : 'w-1.5 bg-slate-200'
                          }`}
                        />
                      ))}
                    </div>

                    <button 
                      onClick={() => setCurrentBenefitIndex(prev => Math.min(availableFeatureKeys.length - 1, prev + 1))}
                      disabled={currentBenefitIndex === availableFeatureKeys.length - 1}
                      className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm text-slate-400 disabled:opacity-30 disabled:bg-slate-50 transition-all active:scale-90"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {selectedPlans.length < 3 && (
                  <button 
                    onClick={() => setIsPickerOpen(true)}
                    className="w-full p-8 border-4 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 text-slate-400 hover:border-primary hover:text-primary transition-all bg-white/50"
                  >
                    <div className="p-4 bg-white rounded-2xl shadow-md">
                      <Plus className="w-8 h-8" />
                    </div>
                    <span className="font-black text-lg">Add Another Plan</span>
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* Differences & Unique Features Section */}
        {selectedPlans.length > 1 && (
          <div className="mt-12 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-display font-black text-slate-800">More Details</h2>
                <p className="text-slate-500 text-sm font-medium">See when cover starts and what makes each plan special.</p>
              </div>
              
              <div className="bg-slate-200/50 p-1 rounded-2xl flex gap-1 self-start">
                <button 
                  onClick={() => setDiffMode('waiting')}
                  className={`px-4 py-2 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${
                    diffMode === 'waiting' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  When cover starts
                </button>
                <button 
                  onClick={() => setDiffMode('unique')}
                  className={`px-4 py-2 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${
                    diffMode === 'unique' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Zap className="w-3 h-3" />
                  Special for this plan
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {selectedPlans.map((plan) => (
                <div key={plan.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-sm ${
                      plan.name.includes('Executive') ? 'bg-primary' : 
                      plan.name.includes('Platinum') ? 'bg-primary' : 'bg-slate-400'
                    }`}>
                      {plan.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-slate-800 leading-tight text-lg">{plan.name}</h3>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{plan.categoryLabel}</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {diffMode === 'waiting' ? (
                      <div className="space-y-2">
                        {FEATURE_KEYS.map(key => {
                          const feature = plan.features[key];
                          if (!feature.isIncluded) return null;
                          return (
                            <div key={key} className="flex items-start justify-between py-3 border-b border-slate-100 last:border-0">
                              <span className="text-xs font-bold text-slate-600 uppercase tracking-wide flex-1">{feature.label}</span>
                              <span className="text-sm font-black text-slate-800 text-right ml-4 whitespace-nowrap">{WAITING_PERIODS[key]}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {FEATURE_KEYS.map(key => {
                          const feature = plan.features[key];
                          if (!feature.isIncluded) return null;
                          
                          // Check if this feature is unique or better compared to other selected plans
                          const isUnique = selectedPlans.every(other => 
                            other.id === plan.id || !other.features[key].isIncluded
                          );
                          const isBetter = feature.isBetter && selectedPlans.some(other => 
                            other.id !== plan.id && (!other.features[key].isBetter || other.features[key].value !== feature.value)
                          );

                          if (!isUnique && !isBetter) return null;

                          return (
                            <div key={key} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                              <div className={`mt-0.5 shrink-0 ${isUnique ? 'text-amber-500' : 'text-primary'}`}>
                                {isUnique ? <Zap className="w-4 h-4 fill-current" /> : <Star className="w-4 h-4 fill-current" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-slate-600 uppercase tracking-wide leading-tight">{feature.label}</p>
                                <p className="text-sm font-black text-slate-800 mt-1">{feature.value}</p>
                                {isUnique && <span className="inline-block mt-1 text-[10px] font-black text-amber-600 uppercase tracking-wider bg-amber-50 px-2 py-0.5 rounded-full">Only here</span>}
                              </div>
                            </div>
                          );
                        })}
                        {FEATURE_KEYS.every(key => {
                          const feature = plan.features[key];
                          if (!feature.isIncluded) return true;
                          const isUnique = selectedPlans.every(other => other.id === plan.id || !other.features[key].isIncluded);
                          const isBetter = feature.isBetter && selectedPlans.some(other => other.id !== plan.id && (!other.features[key].isBetter || other.features[key].value !== feature.value));
                          return !isUnique && !isBetter;
                        }) && (
                          <div className="py-8 text-center">
                            <p className="text-xs font-bold text-slate-400 italic">No unique advantages in this selection.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Plan Picker Modal */}
        <AnimatePresence>
          {isPickerOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsPickerOpen(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-white w-full max-w-4xl rounded-3xl md:rounded-[2.5rem] shadow-premium overflow-hidden flex flex-col max-h-[90vh] md:max-h-[80vh]"
              >
                <div className="p-4 md:p-8 border-b border-slate-100 flex items-center justify-between bg-white">
                  <div>
                    <h2 className="text-2xl md:text-4xl font-display font-black text-slate-800 leading-tight">Which plan?</h2>
                    <p className="text-slate-500 text-sm md:text-lg font-medium">Follow these simple steps to add a plan to your list.</p>
                  </div>
                  <button 
                    onClick={() => setIsPickerOpen(false)}
                    className="p-2 md:p-4 hover:bg-slate-100 rounded-2xl transition-colors"
                  >
                    <X className="w-6 h-6 md:w-8 md:h-8 text-slate-400" />
                  </button>
                </div>

                {/* Step-by-Step Guide inside Modal */}
                <div className="px-4 md:px-8 py-4 md:py-6 bg-blue-50/50 border-b border-slate-100">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                    {[
                      { step: 'A', title: 'Find', desc: 'Use the search box or click a category button below.' },
                      { step: 'B', title: 'Check', desc: 'Look at the name and starting price of the plan.' },
                      { step: 'C', title: 'Select', desc: 'Click anywhere on the plan to add it to your table.' }
                    ].map((item) => (
                      <div key={item.step} className="flex gap-3 items-start">
                        <div className="w-6 h-6 rounded-lg bg-primary text-white flex items-center justify-center font-black text-[10px] shrink-0 mt-0.5">
                          {item.step}
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="font-bold text-slate-800 text-sm">{item.title}</h4>
                          <p className="hidden sm:block text-slate-500 text-xs leading-tight">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 md:p-8 bg-slate-50 border-b border-slate-100 space-y-4 md:space-y-6">
                  <div className="relative">
                    <Search className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 md:w-6 md:h-6" />
                    <input 
                      type="text"
                      placeholder="Search for a plan..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 md:pl-14 pr-4 md:pr-6 py-4 md:py-5 bg-white border-2 border-slate-200 rounded-2xl md:rounded-3xl focus:ring-4 focus:ring-primary/10 focus:border-primary font-bold text-base md:text-lg transition-all shadow-sm"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2 md:gap-3">
                    {['All', ...PLAN_CATEGORIES.map(c => c.label)].map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSearchQuery(cat === 'All' ? '' : cat)}
                        className={`px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl text-xs md:text-sm font-black transition-all border-2 ${
                          (searchQuery === cat || (cat === 'All' && searchQuery === ''))
                            ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                            : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-grow overflow-y-auto p-4 md:p-8 custom-scrollbar">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredPlans.map((plan) => (
                      <button
                        key={plan.id}
                        onClick={() => addPlan(plan.id)}
                        className="flex items-center justify-between p-4 md:p-6 rounded-2xl border border-slate-100 hover:border-primary hover:bg-primary/[0.02] transition-all group text-left"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                              {plan.categoryLabel}
                            </span>
                          </div>
                          <h4 className="text-xl font-display font-bold text-slate-800 group-hover:text-primary transition-colors">
                            {plan.name}
                          </h4>
                          <p className="text-xs text-slate-400 font-medium line-clamp-1">{plan.tagline}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-display font-black text-slate-700">
                            R{plan.prices.Single}
                          </div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase">Starting From</div>
                        </div>
                      </button>
                    ))}
                  </div>
                  {filteredPlans.length === 0 && (
                    <div className="text-center py-20">
                      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="text-slate-400 font-bold text-lg">No plans found matching your search.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* Sticky Bottom Summary Bar */}
      <AnimatePresence>
        {selectedPlans.length > 0 && (
          <motion.footer 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-200 p-4 md:p-6 z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]"
          >
            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 md:gap-6">
              <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-2 sm:pb-0 w-full sm:w-auto">
                <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-400 shrink-0">Your Shortlist:</span>
                {selectedPlans.map(plan => (
                  <div key={plan.id} className="flex items-center gap-2 pl-3 md:pl-4 pr-1.5 md:pr-2 py-1.5 md:py-2 bg-slate-100 rounded-xl shrink-0 group">
                    <div className={`w-2 h-2 rounded-full ${
                      plan.name.includes('Executive') ? 'bg-primary' : 
                      plan.name.includes('Platinum') ? 'bg-primary' : 'bg-slate-400'
                    }`} />
                    <span className="text-xs md:text-sm font-bold text-slate-700">{plan.name}</span>
                    <button 
                      onClick={() => removePlan(plan.id)}
                      className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-200/50 rounded-lg transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              
              <button className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white px-8 md:px-10 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-base md:text-lg shadow-2xl shadow-primary/30 transition-all active:scale-95 flex items-center justify-center gap-3 group glow-pulse">
                I'm Ready to Choose
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.footer>
        )}
      </AnimatePresence>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
    </div>
  );
}
