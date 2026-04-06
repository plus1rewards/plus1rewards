import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  Locate, 
  Layers, 
  Navigation,
  ChevronRight,
  X,
  Info,
  Calendar,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MapContainer, TileLayer, Marker, useMap, ZoomControl, Popup } from "react-leaflet";
import L from "leaflet";
import { supabase } from "../lib/supabase";
import "leaflet/dist/leaflet.css";

// Partner interface matching database schema
interface Partner {
  id: string;
  shop_name: string;
  category?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  cashback_percent: number;
  status: string;
  latitude?: number;
  longitude?: number;
  created_at?: string;
  business_registration?: string;
  bank_name?: string;
  account_number?: string;
  agent_id?: string;
  commission_rate?: number;
  total_revenue?: number;
  member_count?: number;
}

// Haversine formula to calculate distance in km
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

// Helper to center map with smooth animation
function MapController({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  
  useEffect(() => {
    const currentCenter = map.getCenter();
    const dist = getDistance(currentCenter.lat, currentCenter.lng, center[0], center[1]);
    const currentZoom = map.getZoom();
    
    // Only flyTo if the change is significant (programmatic move)
    // This prevents jitter during manual panning while allowing smooth animation for selection/locate
    if (dist > 0.001 || currentZoom !== zoom) {
      map.flyTo(center, zoom, {
        duration: 1.5,
        easeLinearity: 0.25
      });
    }
  }, [center, zoom, map]);

  return null;
}

export default function App() {
  const [searchParams] = useSearchParams();
  const highlightPartnerId = searchParams.get('highlight');
  
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All Partners");
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [radius, setRadius] = useState(25);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Default map center (Cape Town)
  const [mapCenter, setMapCenter] = useState<[number, number]>([-33.9249, 18.4241]);
  const [zoom, setZoom] = useState(13);
  const [mapLayer, setMapLayer] = useState<"standard" | "satellite" | "dark">("standard");
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Fetch partners from database
  useEffect(() => {
    async function fetchPartners() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('partners')
          .select('*')
          .eq('status', 'active')
          .order('shop_name');

        if (error) throw error;

        if (data) {
          // Fetch additional stats for each partner
          const partnersWithStats = await Promise.all(
            data.map(async (partner) => {
              // Get member count
              const { count: memberCount } = await supabase
                .from('wallets')
                .select('*', { count: 'exact', head: true })
                .eq('partner_id', partner.id);

              // Get total revenue
              const { data: transactions } = await supabase
                .from('transactions')
                .select('purchase_amount')
                .eq('partner_id', partner.id);

              const totalRevenue = transactions?.reduce((sum, t) => sum + (t.purchase_amount || 0), 0) || 0;

              return {
                ...partner,
                member_count: memberCount || 0,
                total_revenue: totalRevenue
              };
            })
          );

          setPartners(partnersWithStats);
          
          // Handle highlighted partner from URL
          if (highlightPartnerId) {
            const highlightedPartner = partnersWithStats.find(p => p.id === highlightPartnerId);
            if (highlightedPartner) {
              setSelectedPartnerId(highlightedPartner.id);
              setIsDetailOpen(true);
              if (highlightedPartner.latitude && highlightedPartner.longitude) {
                setMapCenter([highlightedPartner.latitude, highlightedPartner.longitude]);
                setZoom(15); // Zoom in closer for highlighted partner
              }
            }
          } else {
            // Set initial map center to first partner with coordinates
            const firstPartnerWithCoords = partnersWithStats.find(p => p.latitude && p.longitude);
            if (firstPartnerWithCoords && firstPartnerWithCoords.latitude && firstPartnerWithCoords.longitude) {
              setMapCenter([firstPartnerWithCoords.latitude, firstPartnerWithCoords.longitude]);
              setSelectedPartnerId(firstPartnerWithCoords.id);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching partners:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPartners();
  }, [highlightPartnerId]);

  const categories = ["All Partners", "Active", "Appliances", "Service", "Electronics", "Home Decor", "Furniture"];

  const filteredPartners = useMemo(() => {
    return partners.filter((p) => {
      const matchesSearch = p.shop_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (p.city && p.city.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = activeCategory === "All Partners" || 
                              (activeCategory === "Active" && p.status === "active") ||
                              (p.category && p.category === activeCategory);
      
      // Only filter by radius if partner has coordinates
      if (p.latitude && p.longitude) {
        const distance = getDistance(mapCenter[0], mapCenter[1], p.latitude, p.longitude);
        const matchesRadius = distance <= radius;
        return matchesSearch && matchesCategory && matchesRadius;
      }
      
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory, radius, mapCenter, partners]);

  const selectedPartner = useMemo(() => 
    partners.find(p => p.id === selectedPartnerId) || null
  , [selectedPartnerId, partners]);

  // Sync map center when partner is selected
  useEffect(() => {
    if (selectedPartner && selectedPartner.latitude && selectedPartner.longitude) {
      setMapCenter([selectedPartner.latitude, selectedPartner.longitude]);
      setZoom(15);
    }
  }, [selectedPartner]);

  const handleLocate = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setMapCenter([position.coords.latitude, position.coords.longitude]);
        setZoom(15);
      });
    }
  };

  const toggleLayer = () => {
    const layers: ("standard" | "satellite" | "dark")[] = ["standard", "satellite", "dark"];
    const currentIndex = layers.indexOf(mapLayer);
    const nextIndex = (currentIndex + 1) % layers.length;
    setMapLayer(layers[nextIndex]);
  };

  // Custom Marker Icons
  const createCustomIcon = (p: Partner) => {
    const isSelected = selectedPartnerId === p.id;
    const colorClass = isSelected ? 'bg-primary text-on-primary ring-4 ring-primary/20 marker-pulse-effect' : 'bg-white text-primary border-2 border-primary/10';
    const arrowColor = isSelected ? 'bg-primary' : 'bg-white border-r-2 border-b-2 border-primary/10';
    
    // Default icon for all partners
    const iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>';
    
    return L.divIcon({
      html: `
        <div class="relative group">
          <div class="w-11 h-11 rounded-2xl flex items-center justify-center shadow-xl relative transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) group-hover:scale-110 group-hover:-translate-y-1 ${colorClass}">
            ${iconSvg}
            <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 ${arrowColor}"></div>
          </div>
        </div>
      `,
      className: '',
      iconSize: [44, 44],
      iconAnchor: [22, 44],
    });
  };

  const getTileUrl = () => {
    switch(mapLayer) {
      case "satellite": return "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
      case "dark": return "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
      default: return "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
    }
  };

  return (
    <main className="find-partner-page flex h-screen w-full relative overflow-hidden font-sans bg-white selection:bg-primary/10 selection:text-primary">
      {loading ? (
        <div className="flex items-center justify-center w-full h-full">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-on-surface-variant font-semibold">Loading partners...</p>
          </div>
        </div>
      ) : (
        <>
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-[460px] h-full bg-white z-20 overflow-hidden shrink-0 border-r border-outline-variant/30 shadow-2xl">
        {/* Branding Section */}
        <div className="px-10 pt-12 pb-8 bg-white relative">
          <div className="flex flex-col gap-y-1 mb-8">
            <h1 className="text-4xl font-display font-bold tracking-tighter-extra text-primary leading-none">
              THE ARCHIVE
            </h1>
            <div className="flex items-center gap-3">
              <div className="h-[1px] w-8 bg-primary/30" />
              <p className="text-on-surface-variant font-bold text-[10px] tracking-[0.3em] uppercase">
                Curated Partner Directory
              </p>
            </div>
          </div>
          
          <div className="relative group">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-on-surface-variant/60">
              <Search size={18} strokeWidth={2.5} />
            </div>
            <input 
              className="w-full h-14 pl-14 pr-6 rounded-2xl bg-surface-container-low border border-transparent focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/5 placeholder-on-surface-variant/40 text-on-surface font-semibold transition-all duration-300"
              placeholder="Search partners or locations..." 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Filter Chips - Scrollable */}
        <div className="px-10 pb-6 flex gap-2 overflow-x-auto no-scrollbar mask-fade-right">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-300 cursor-pointer whitespace-nowrap border ${
                activeCategory === cat 
                  ? "bg-primary text-on-primary border-primary shadow-lg shadow-primary/20 -translate-y-0.5" 
                  : "bg-white text-on-surface-variant border-outline-variant/40 hover:border-primary/30 hover:text-primary"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Partner List Container */}
        <div className="flex-1 overflow-y-auto px-10 pb-12 space-y-8">
          <div className="flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10 py-4">
            <h2 className="text-[10px] font-black text-on-surface-variant/60 tracking-[0.25em] uppercase">
              Available Partners
            </h2>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                {filteredPartners.length} FOUND
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-y-5">
            <AnimatePresence mode="popLayout">
              {filteredPartners.map((partner) => (
                <motion.div
                  key={partner.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  onClick={() => {
                    setSelectedPartnerId(partner.id);
                    setIsDetailOpen(true);
                  }}
                  className={`group relative bg-white rounded-[24px] p-7 border transition-all duration-500 cursor-pointer overflow-hidden ${
                    partner.id === highlightPartnerId
                      ? 'border-blue-500 shadow-2xl shadow-blue-500/20 ring-2 ring-blue-500/20 bg-gradient-to-br from-blue-50/50 to-white'
                      : selectedPartnerId === partner.id 
                        ? 'border-primary shadow-2xl shadow-primary/10 ring-1 ring-primary/10' 
                        : 'border-outline-variant/30 hover:border-primary/40 hover:shadow-xl hover:-translate-y-1'
                  }`}
                >
                  {/* Selection Indicator */}
                  <AnimatePresence>
                    {selectedPartnerId === partner.id && (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="absolute top-0 left-0 w-1.5 h-full bg-primary" 
                      />
                    )}
                  </AnimatePresence>

                  {/* Highlighted Partner Badge */}
                  {partner.id === highlightPartnerId && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg"
                    >
                      Featured
                    </motion.div>
                  )}
                  
                  <div className="flex justify-between items-start mb-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-primary/5 text-primary text-[9px] font-black uppercase tracking-widest">
                          {partner.category || 'Partner'}
                        </span>
                        {partner.status === "active" && (
                          <div className="flex items-center gap-1">
                            <div className="w-1 h-1 rounded-full bg-green-500" />
                            <span className="text-[9px] font-bold text-green-600 uppercase tracking-tighter">Live</span>
                          </div>
                        )}
                      </div>
                      <h3 className="text-2xl font-display font-bold text-on-surface leading-tight tracking-tighter group-hover:text-primary transition-colors duration-300">
                        {partner.shop_name}
                      </h3>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="bg-primary text-on-primary px-4 py-2.5 rounded-2xl text-center shadow-lg shadow-primary/20">
                        <span className="text-xl font-black leading-none">{partner.cashback_percent}%</span>
                        <span className="block text-[8px] font-black uppercase tracking-widest opacity-70 mt-0.5">Back</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div className="flex items-center gap-4 text-on-surface-variant">
                      <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center shrink-0 group-hover:bg-primary/5 group-hover:text-primary transition-colors duration-300">
                        <MapPin size={16} strokeWidth={2.5} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Location</span>
                        <span className="text-xs font-bold text-on-surface/80 capitalize">
                          {partner.address || 'Address not available'}, {partner.city || 'City'}
                        </span>
                      </div>
                    </div>

                    {partner.phone && (
                      <div className="flex items-center gap-4 text-on-surface-variant">
                        <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center shrink-0 group-hover:bg-primary/5 group-hover:text-primary transition-colors duration-300">
                          <Phone size={16} strokeWidth={2.5} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Contact</span>
                          <span className="text-xs font-bold text-on-surface/80">{partner.phone}</span>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 pt-3">
                      <div className="p-3 bg-surface-container-low rounded-xl">
                        <span className="block text-[9px] font-black text-on-surface-variant/50 uppercase tracking-widest mb-1">Members</span>
                        <span className="text-lg font-display font-bold text-on-surface">{partner.member_count || 0}</span>
                      </div>
                      <div className="p-3 bg-surface-container-low rounded-xl">
                        <span className="block text-[9px] font-black text-on-surface-variant/50 uppercase tracking-widest mb-1">Revenue</span>
                        <span className="text-lg font-display font-bold text-on-surface">R{((partner.total_revenue || 0) / 1000).toFixed(1)}k</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-5 border-t border-outline-variant/20">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-on-surface-variant/40" />
                        <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-tighter">
                          Since {partner.created_at ? new Date(partner.created_at).getFullYear() : '2024'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-primary font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                        View Details <ChevronRight size={14} strokeWidth={3} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {filteredPartners.length === 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-24 px-8 bg-surface-container-low rounded-[32px] border-2 border-dashed border-outline-variant/40"
              >
                <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-black/5">
                  <Search size={32} className="text-outline-variant" strokeWidth={1.5} />
                </div>
                <h4 className="text-xl font-display font-bold text-on-surface mb-2">No partners found</h4>
                <p className="text-sm text-on-surface-variant/70 leading-relaxed mb-8">
                  We couldn't find any partners matching your current filters in this area.
                </p>
                <button 
                  onClick={() => setRadius(50)}
                  className="px-8 py-4 bg-primary text-on-primary rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:shadow-2xl hover:shadow-primary/30 transition-all duration-500 active:scale-95"
                >
                  Expand Radius to 50km
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Map View Section */}
      <section className="flex-1 relative h-full bg-surface-dim">
        <MapContainer 
          center={mapCenter} 
          zoom={zoom} 
          className="w-full h-full"
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url={getTileUrl()}
          />
          <MapController center={mapCenter} zoom={zoom} />
          <ZoomControl position="bottomright" />
          
          {filteredPartners
            .filter(p => p.latitude && p.longitude)
            .map((p) => (
            <Marker 
              key={p.id} 
              position={[p.latitude!, p.longitude!]} 
              icon={createCustomIcon(p)}
              eventHandlers={{
                click: () => {
                  setSelectedPartnerId(p.id);
                  setIsDetailOpen(true);
                },
              }}
            >
              <Popup className="custom-popup" closeButton={false}>
                <div className="p-6 bg-white">
                  <div className="flex justify-between items-start gap-4 mb-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded bg-primary/5 text-primary text-[8px] font-black uppercase tracking-widest">{p.category || 'Partner'}</span>
                        <div className="flex items-center gap-1">
                          <div className="w-1 h-1 rounded-full bg-green-500" />
                          <span className="text-[8px] font-bold text-green-600 uppercase">Live</span>
                        </div>
                      </div>
                      <h4 className="text-xl font-display font-bold text-primary m-0 leading-tight tracking-tighter">{p.shop_name}</h4>
                    </div>
                    <div className="bg-primary text-white w-12 h-12 rounded-2xl flex flex-col items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                      <span className="text-sm font-black leading-none">{p.cashback_percent}%</span>
                      <span className="text-[6px] font-black uppercase opacity-70">Back</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-on-surface-variant">
                      <MapPin size={12} strokeWidth={2.5} className="text-primary/40" />
                      <span className="text-[11px] font-bold text-on-surface/70 leading-tight">{p.address || 'Address not available'}, {p.city || 'City'}</span>
                    </div>
                    {p.phone && (
                      <div className="flex items-center gap-3 text-on-surface-variant">
                        <Phone size={12} strokeWidth={2.5} className="text-primary/40" />
                        <span className="text-[11px] font-bold text-on-surface/70">{p.phone}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <a 
                      href={`https://www.google.com/maps/dir/?api=1&destination=${p.latitude},${p.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 h-11 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary-container transition-all duration-300 no-underline shadow-lg shadow-primary/10"
                    >
                      <Navigation size={14} strokeWidth={2.5} />
                      Directions
                    </a>
                    <button 
                      onClick={() => setIsDetailOpen(true)}
                      className="w-11 h-11 bg-surface-container rounded-xl flex items-center justify-center text-primary hover:bg-primary/10 transition-all duration-300"
                    >
                      <Info size={18} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Floating Map Controls */}
        <div className="absolute top-10 left-10 right-10 flex justify-between items-start pointer-events-none z-[1000]">
          <div className="flex flex-col gap-4 pointer-events-auto">
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="glass-panel flex items-center gap-6 px-8 py-4 rounded-[24px] shadow-2xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Locate size={16} strokeWidth={2.5} />
                </div>
                <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em]">Range</span>
              </div>
              <div className="flex items-center gap-6">
                <div className="w-48 h-2 bg-primary/10 rounded-full relative cursor-pointer group">
                  <div 
                    className="absolute inset-y-0 left-0 bg-primary rounded-full shadow-[0_0_15px_rgba(26,85,139,0.4)] transition-all duration-300" 
                    style={{ width: `${(radius / 50) * 100}%` }}
                  ></div>
                  <input 
                    type="range" 
                    min="1" 
                    max="50" 
                    value={radius}
                    onChange={(e) => setRadius(parseInt(e.target.value))}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  />
                  <motion.div 
                    className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-white border-[3px] border-primary rounded-full shadow-xl pointer-events-none z-20"
                    style={{ left: `${(radius / 50) * 100}%`, marginLeft: '-12px' }}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                  />
                </div>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-lg font-display font-bold text-primary tabular-nums leading-none">{radius}</span>
                  <span className="text-[10px] font-black text-primary/60 uppercase">km</span>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="flex gap-3 pointer-events-auto">
            <motion.button 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              onClick={handleLocate}
              className="w-14 h-14 glass-panel rounded-2xl flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-white transition-all duration-500 shadow-2xl active:scale-90 group"
            >
              <Locate size={22} strokeWidth={2} className="group-hover:rotate-12 transition-transform" />
            </motion.button>
            <motion.button 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              onClick={toggleLayer}
              className="w-14 h-14 glass-panel rounded-2xl flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-white transition-all duration-500 shadow-2xl active:scale-90 group"
            >
              <Layers size={22} strokeWidth={2} className="group-hover:rotate-12 transition-transform" />
            </motion.button>
          </div>
        </div>

        {/* Detailed Shop View Overlay - Desktop & Mobile */}
        <AnimatePresence>
          {isDetailOpen && selectedPartner && (
            <>
              {/* Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsDetailOpen(false)}
                className="absolute inset-0 bg-black/20 backdrop-blur-sm z-[2000]"
              />
              
              {/* Detail Card */}
              <motion.div 
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="absolute top-0 right-0 bottom-0 w-full lg:w-[540px] bg-white z-[2001] shadow-[-40px_0_80px_rgba(0,0,0,0.1)] flex flex-col"
              >
                {/* Header Image/Pattern Area */}
                <div className="h-64 premium-gradient relative overflow-hidden shrink-0">
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
                  </div>
                  <button 
                    onClick={() => setIsDetailOpen(false)}
                    className="absolute top-8 right-8 w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white hover:bg-white hover:text-primary transition-all duration-500 z-10"
                  >
                    <X size={24} strokeWidth={2.5} />
                  </button>
                  
                  <div className="absolute bottom-10 left-10 right-10">
                    <motion.div 
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="flex items-center gap-3 mb-3"
                    >
                      <span className="px-3 py-1 rounded-lg bg-white/20 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest">
                        {selectedPartner.category}
                      </span>
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-green-500/20 backdrop-blur-md text-green-300 text-[10px] font-black uppercase tracking-widest">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        Active Partner
                      </div>
                    </motion.div>
                    <motion.h2 
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="text-5xl font-display font-bold text-white tracking-tighter-extra leading-none"
                    >
                      {selectedPartner.shop_name}
                    </motion.h2>
                  </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto px-10 py-12 space-y-12">
                  {/* Key Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-6 bg-surface-container-low rounded-[32px] border border-outline-variant/20">
                      <span className="block text-[9px] font-black text-on-surface-variant/60 uppercase tracking-widest mb-2">Cashback</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-display font-bold text-primary">{selectedPartner.cashback_percent}%</span>
                      </div>
                    </div>
                    <div className="p-6 bg-surface-container-low rounded-[32px] border border-outline-variant/20">
                      <span className="block text-[9px] font-black text-on-surface-variant/60 uppercase tracking-widest mb-2">Members</span>
                      <div className="flex items-center gap-1">
                        <span className="text-3xl font-display font-bold text-on-surface">{selectedPartner.member_count || 0}</span>
                      </div>
                    </div>
                    <div className="p-6 bg-surface-container-low rounded-[32px] border border-outline-variant/20">
                      <span className="block text-[9px] font-black text-on-surface-variant/60 uppercase tracking-widest mb-2">Status</span>
                      <span className="text-xs font-black text-green-600 uppercase tracking-widest">ACTIVE</span>
                    </div>
                  </div>

                  {/* Business Info */}
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-on-surface-variant/40 tracking-[0.3em] uppercase">Business Information</h4>
                    <div className="grid gap-4">
                      {selectedPartner.business_registration && (
                        <div className="p-6 bg-white rounded-[28px] border border-outline-variant/30">
                          <span className="block text-[10px] font-black text-on-surface-variant/50 uppercase tracking-widest mb-2">Registration Number</span>
                          <span className="text-sm font-bold text-on-surface/80">{selectedPartner.business_registration}</span>
                        </div>
                      )}
                      
                      {selectedPartner.email && (
                        <div className="p-6 bg-white rounded-[28px] border border-outline-variant/30">
                          <span className="block text-[10px] font-black text-on-surface-variant/50 uppercase tracking-widest mb-2">Business Email</span>
                          <span className="text-sm font-bold text-on-surface/80 break-all">{selectedPartner.email}</span>
                        </div>
                      )}

                      {selectedPartner.category && (
                        <div className="p-6 bg-white rounded-[28px] border border-outline-variant/30">
                          <span className="block text-[10px] font-black text-on-surface-variant/50 uppercase tracking-widest mb-2">Category</span>
                          <span className="text-sm font-bold text-on-surface/80 capitalize">{selectedPartner.category}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Financial Stats */}
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-on-surface-variant/40 tracking-[0.3em] uppercase">Financial Overview</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 rounded-[28px] border border-primary/20">
                        <span className="block text-[10px] font-black text-primary/60 uppercase tracking-widest mb-2">Total Revenue</span>
                        <span className="text-2xl font-display font-bold text-primary">R{(selectedPartner.total_revenue || 0).toLocaleString()}</span>
                      </div>
                      <div className="p-6 bg-gradient-to-br from-green-500/5 to-green-500/10 rounded-[28px] border border-green-500/20">
                        <span className="block text-[10px] font-black text-green-600/60 uppercase tracking-widest mb-2">Commission Rate</span>
                        <span className="text-2xl font-display font-bold text-green-600">{selectedPartner.commission_rate || selectedPartner.cashback_percent}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-on-surface-variant/40 tracking-[0.3em] uppercase">Contact & Location</h4>
                    <div className="grid gap-4">
                      <div className="flex items-center gap-5 p-6 bg-white rounded-[28px] border border-outline-variant/30 hover:border-primary/30 transition-colors duration-300 group">
                        <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500">
                          <MapPin size={24} strokeWidth={2} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-on-surface-variant/50 uppercase tracking-widest">Address</span>
                          <span className="text-sm font-bold text-on-surface/80">{selectedPartner.address || 'Address not available'}, {selectedPartner.city || 'City'}</span>
                        </div>
                      </div>
                      
                      {selectedPartner.phone && (
                        <div className="flex items-center gap-5 p-6 bg-white rounded-[28px] border border-outline-variant/30 hover:border-primary/30 transition-colors duration-300 group">
                          <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500">
                            <Phone size={24} strokeWidth={2} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-on-surface-variant/50 uppercase tracking-widest">Phone</span>
                            <span className="text-sm font-bold text-on-surface/80">{selectedPartner.phone}</span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-5 p-6 bg-white rounded-[28px] border border-outline-variant/30 hover:border-primary/30 transition-colors duration-300 group">
                        <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500">
                          <Mail size={24} strokeWidth={2} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-on-surface-variant/50 uppercase tracking-widest">Email</span>
                          <span className="text-sm font-bold text-on-surface/80 truncate max-w-[280px]">
                            {selectedPartner.email || `contact@${selectedPartner.shop_name.toLowerCase().replace(/\s+/g, '')}.co.za`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Partnership Details */}
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-on-surface-variant/40 tracking-[0.3em] uppercase">Partnership Details</h4>
                    <div className="grid gap-4">
                      <div className="p-6 bg-white rounded-[28px] border border-outline-variant/30">
                        <span className="block text-[10px] font-black text-on-surface-variant/50 uppercase tracking-widest mb-2">Partner Since</span>
                        <span className="text-sm font-bold text-on-surface/80">
                          {selectedPartner.created_at ? new Date(selectedPartner.created_at).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          }) : 'N/A'}
                        </span>
                      </div>
                      
                      <div className="p-6 bg-white rounded-[28px] border border-outline-variant/30">
                        <span className="block text-[10px] font-black text-on-surface-variant/50 uppercase tracking-widest mb-2">Partner ID</span>
                        <span className="text-sm font-mono font-bold text-on-surface/80">{selectedPartner.id.slice(0, 8)}...</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="pt-4">
                    {selectedPartner.latitude && selectedPartner.longitude && (
                      <a 
                        href={`https://www.google.com/maps/dir/?api=1&destination=${selectedPartner.latitude},${selectedPartner.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-6 premium-gradient text-white rounded-[28px] font-black text-sm uppercase tracking-[0.25em] flex items-center justify-center gap-4 shadow-2xl shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-1 transition-all duration-500 no-underline"
                      >
                        <Navigation size={20} strokeWidth={2.5} />
                        Start Navigation
                        <ArrowRight size={20} strokeWidth={2.5} />
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </section>
        </>
      )}
    </main>
  );
}