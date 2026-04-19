import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
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
  ArrowRight,
  Loader
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MapContainer, TileLayer, Marker, useMap, ZoomControl, Popup, Polyline, Circle } from "react-leaflet";
import L from "leaflet";
import { supabase } from "../lib/supabase";
import { geocodeAddress, getCityCoordinates, extractCityFromAddress } from "../utils/geocoding";
import SEO from "../components/SEO";
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
  store_logo_url?: string;
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

// Fetch route from OSRM API
async function fetchRoute(
  startLat: number,
  startLng: number,
  destLat: number,
  destLng: number
): Promise<[number, number][] | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${destLng},${destLat}?overview=full&geometries=geojson`;
    const response = await fetch(url);
    
    if (!response.ok) throw new Error('Failed to fetch route');
    
    const data = await response.json();
    
    if (data.routes && data.routes.length > 0) {
      // OSRM returns [longitude, latitude], convert to [latitude, longitude] for Leaflet
      return data.routes[0].geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching route:', error);
    return null;
  }
}

// Helper to center map with smooth animation
function MapController({ 
  center, 
  zoom, 
  followUser, 
  onManualOverride 
}: { 
  center: [number, number], 
  zoom: number,
  followUser: boolean,
  onManualOverride: () => void
}) {
  const map = useMap();
  
  useEffect(() => {
    const currentCenter = map.getCenter();
    const dist = getDistance(currentCenter.lat, currentCenter.lng, center[0], center[1]);
    const currentZoom = map.getZoom();
    
    // Only flyTo if the change is significant (programmatic move)
    if (dist > 0.001 || currentZoom !== zoom) {
      map.flyTo(center, zoom, {
        duration: followUser ? 0.5 : 1.2,
        easeLinearity: 0.25,
        noMoveStart: false
      });
    }
  }, [center, zoom, map, followUser]);

  // Detect manual map interaction to disable follow mode
  useEffect(() => {
    const handleDragStart = () => onManualOverride();
    const handleZoomStart = () => onManualOverride();
    const handleMouseDown = () => onManualOverride();
    const handleTouchStart = () => onManualOverride();

    map.on('dragstart', handleDragStart);
    map.on('zoomstart', handleZoomStart);
    map.on('mousedown', handleMouseDown);
    map.on('touchstart', handleTouchStart);

    return () => {
      map.off('dragstart', handleDragStart);
      map.off('zoomstart', handleZoomStart);
      map.off('mousedown', handleMouseDown);
      map.off('touchstart', handleTouchStart);
    };
  }, [map, onManualOverride]);

  return null;
}

export default function App() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const highlightPartnerId = searchParams.get('highlight');
  
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All Partners");
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [radius, setRadius] = useState(25);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Real-time navigation state
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [followUser, setFollowUser] = useState(false);
  const [route, setRoute] = useState<[number, number][] | null>(null);
  const [isRouting, setIsRouting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [userAccuracy, setUserAccuracy] = useState<number | null>(null);
  const [routeTransition, setRouteTransition] = useState<'entering' | 'exiting' | 'idle'>('idle');
  const [navigationRequested, setNavigationRequested] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  
  // Default map center (Cape Town)
  const [mapCenter, setMapCenter] = useState<[number, number]>([-33.9249, 18.4241]);
  const [zoom, setZoom] = useState(13);
  const [mapLayer, setMapLayer] = useState<"standard" | "satellite" | "dark">("standard");
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [showMobilePartners, setShowMobilePartners] = useState(false);

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

          // Geocode partners that don't have coordinates
          const partnersWithCoords = await Promise.all(
            partnersWithStats.map(async (partner) => {
              if (partner.latitude && partner.longitude) {
                return partner; // Already has coordinates
              }

              // Try to geocode the address
              if (partner.address) {
                console.log(`Geocoding address for ${partner.shop_name}: ${partner.address}`);
                const coords = await geocodeAddress(partner.address);
                
                if (coords) {
                  console.log(`Found coordinates for ${partner.shop_name}:`, coords);
                  
                  // Update the database with the new coordinates
                  try {
                    await supabase
                      .from('partners')
                      .update({
                        latitude: coords.latitude,
                        longitude: coords.longitude
                      })
                      .eq('id', partner.id);
                    
                    return {
                      ...partner,
                      latitude: coords.latitude,
                      longitude: coords.longitude
                    };
                  } catch (updateError) {
                    console.error(`Failed to update coordinates for ${partner.shop_name}:`, updateError);
                  }
                }
              }

              // Fallback: try to get city coordinates
              const city = extractCityFromAddress(partner.address || '');
              if (city) {
                const cityCoords = getCityCoordinates(city);
                if (cityCoords) {
                  console.log(`Using city coordinates for ${partner.shop_name} in ${city}:`, cityCoords);
                  return {
                    ...partner,
                    latitude: cityCoords.latitude,
                    longitude: cityCoords.longitude
                  };
                }
              }

              console.log(`No coordinates found for ${partner.shop_name}`);
              return partner;
            })
          );

          setPartners(partnersWithCoords);
          
          // Handle highlighted partner from URL
          if (highlightPartnerId) {
            const highlightedPartner = partnersWithCoords.find(p => p.id === highlightPartnerId);
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
            const firstPartnerWithCoords = partnersWithCoords.find(p => p.latitude && p.longitude);
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

  // Real-time geolocation tracking
  useEffect(() => {
    if (!navigator.geolocation) {
      console.error('Geolocation not supported');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setUserLocation([latitude, longitude]);
        setUserAccuracy(accuracy);

        // Update map center if follow mode is active
        if (followUser) {
          setMapCenter([latitude, longitude]);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        if (error.code === error.PERMISSION_DENIED) {
          setRouteError('Location permission denied. Please enable location access.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );

    watchIdRef.current = watchId;

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [followUser]);

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

  // Dynamic routing - recalculate when user location changes
  useEffect(() => {
    if (!navigationRequested || !userLocation || !selectedPartner || !selectedPartner.latitude || !selectedPartner.longitude) {
      // Smooth exit animation
      if (route) {
        setRouteTransition('exiting');
        const exitTimer = setTimeout(() => {
          setRoute(null);
          setRouteTransition('idle');
        }, 400);
        return () => clearTimeout(exitTimer);
      }
      return;
    }

    // Clear existing route immediately when partner changes for smooth transition
    if (route) {
      setRouteTransition('exiting');
      const clearTimer = setTimeout(() => {
        setRoute(null);
      }, 300);
      
      // Fetch new route after clearing
      const fetchTimer = setTimeout(async () => {
        setRouteTransition('entering');
        setIsRouting(true);
        setRouteError(null);
        
        try {
          const newRoute = await fetchRoute(
            userLocation[0],
            userLocation[1],
            selectedPartner.latitude!,
            selectedPartner.longitude!
          );
          
          if (newRoute) {
            setRoute(newRoute);
            setTimeout(() => setRouteTransition('idle'), 100);
          } else {
            setRouteError('Could not calculate route');
            setRouteTransition('idle');
          }
        } catch (error) {
          console.error('Routing error:', error);
          setRouteError('Error calculating route');
          setRouteTransition('idle');
        } finally {
          setIsRouting(false);
        }
      }, 400);

      return () => {
        clearTimeout(clearTimer);
        clearTimeout(fetchTimer);
      };
    } else {
      // No existing route, fetch immediately
      setRouteTransition('entering');
      const fetchTimer = setTimeout(async () => {
        setIsRouting(true);
        setRouteError(null);
        
        try {
          const newRoute = await fetchRoute(
            userLocation[0],
            userLocation[1],
            selectedPartner.latitude!,
            selectedPartner.longitude!
          );
          
          if (newRoute) {
            setRoute(newRoute);
            setTimeout(() => setRouteTransition('idle'), 100);
          } else {
            setRouteError('Could not calculate route');
            setRouteTransition('idle');
          }
        } catch (error) {
          console.error('Routing error:', error);
          setRouteError('Error calculating route');
          setRouteTransition('idle');
        } finally {
          setIsRouting(false);
        }
      }, 200);

      return () => clearTimeout(fetchTimer);
    }
  }, [navigationRequested, userLocation, selectedPartner?.id]);

  // Sync map center when partner is selected with smooth transition
  useEffect(() => {
    if (selectedPartner && selectedPartner.latitude && selectedPartner.longitude) {
      // Add a small delay for smooth visual transition
      const transitionTimer = setTimeout(() => {
        setMapCenter([selectedPartner.latitude, selectedPartner.longitude]);
        setZoom(15);
      }, 100);
      
      return () => clearTimeout(transitionTimer);
    }
  }, [selectedPartner]);

  const handleLocate = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const userLoc: [number, number] = [position.coords.latitude, position.coords.longitude];
        setUserLocation(userLoc);
        setMapCenter(userLoc);
        setFollowUser(true);
        setZoom(15);
      });
    }
  };

  const handleManualOverride = () => {
    setFollowUser(false);
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
      <SEO
        title="Find Partners | Plus1 Rewards"
        description="Discover partner stores near you where you can earn cashback toward your medical cover. Browse our network of trusted partners across South Africa."
        keywords="find partners, partner stores, cashback stores, Plus1 Rewards partners, medical cover partners, shop and earn"
        canonical="https://plus1rewards.com/find-partner"
        robots="index, follow"
      />
      {loading ? (
        <div className="flex items-center justify-center w-full h-full">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-on-surface-variant font-semibold">Loading partners...</p>
          </div>
        </div>
      ) : (
        <>
      {/* Mobile Header */}
      <div className={`lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 shadow-sm ${showMobilePartners || isDetailOpen ? 'z-[1999]' : 'z-[2100]'}`}>
        <div className="p-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/member/dashboard')}
                  className="w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center text-gray-600 transition-all flex-shrink-0"
                  aria-label="Back to dashboard"
                >
                  <span className="material-symbols-outlined text-lg">arrow_back</span>
                </button>
                <h1 className="text-xl font-display font-bold tracking-tighter text-primary">
                  THE ARCHIVE
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-black text-primary uppercase tracking-widest">
                  {filteredPartners.length} FOUND
                </span>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                <Search size={16} strokeWidth={2.5} />
              </div>
              <input 
                className="w-full h-12 pl-10 pr-4 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-primary/20 focus:ring-2 focus:ring-primary/5 placeholder-gray-400 text-gray-900 font-medium transition-all duration-300"
                placeholder="Search partners or locations..." 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer whitespace-nowrap border ${
                    activeCategory === cat 
                      ? "bg-primary text-white border-primary shadow-md" 
                      : "bg-white text-gray-600 border-gray-200 hover:border-primary/30 hover:text-primary"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-[380px] h-full bg-white z-20 overflow-hidden shrink-0 border-r border-outline-variant/30 shadow-2xl">
        {/* Branding Section */}
        <div className="px-10 pt-12 pb-8 bg-white relative">
          {/* Back Button */}
          <button
            onClick={() => navigate('/')}
            className="absolute top-6 left-6 w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center text-gray-600 hover:text-primary transition-all duration-300 group mr-4"
          >
            <span className="material-symbols-outlined text-lg group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
          </button>
          
          <div className="flex flex-col gap-y-1 mb-8 ml-14">
            <h1 className="text-4xl font-display font-bold tracking-tighter-extra text-primary leading-none">
              Partner Directory
            </h1>
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
              {filteredPartners.map((partner) => {
                const getCategoryColor = (category: string) => {
                  const colors = {
                    pharmacy: '#10b981',
                    grocery: '#f59e0b',
                    restaurant: '#ef4444',
                    retail: '#8b5cf6',
                    default: '#6b7280'
                  };
                  return colors[category?.toLowerCase() as keyof typeof colors] || colors.default;
                };

                const getBadgeColor = (cashbackPercent: number) => {
                  if (cashbackPercent >= 5) return '#f59e0b'; // Orange for high cashback
                  if (cashbackPercent >= 4) return '#3b82f6'; // Blue for medium cashback
                  return '#10b981'; // Green for standard cashback
                };

                const badgeColor = getBadgeColor(partner.cashback_percent);
                const memberEarns = Math.max(partner.cashback_percent - 2, 1);

                return (
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
                    className={`group relative bg-white rounded-[24px] border transition-all duration-500 cursor-pointer overflow-hidden ${
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

                    {/* Badge */}
                    <div 
                      className="absolute top-4 right-4 px-3 py-1 rounded-full text-white text-xs font-bold z-10"
                      style={{ backgroundColor: badgeColor }}
                    >
                      {partner.cashback_percent > 3 ? `${memberEarns}%` : 'NEW'}
                    </div>

                    {/* Highlighted Partner Badge */}
                    {partner.id === highlightPartnerId && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg z-20"
                      >
                        Featured
                      </motion.div>
                    )}
                    
                    {/* Image/Icon Section */}
                    <div 
                      className="h-[140px] w-full flex items-center justify-center relative overflow-hidden rounded-t-[24px]"
                      style={{ backgroundColor: getCategoryColor(partner.category || 'default') + '20' }}
                    >
                      {partner.store_logo_url ? (
                        <img
                          src={partner.store_logo_url}
                          alt={partner.shop_name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fallback = document.createElement('div');
                            fallback.className = 'w-full h-full flex items-center justify-center';
                            fallback.innerHTML = '<span class="material-symbols-outlined text-primary text-4xl">store</span>';
                            e.currentTarget.parentElement!.appendChild(fallback);
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-primary text-4xl">store</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="p-6 flex-1">
                      <div className="mb-6">
                        <div className="flex items-center gap-2 mb-2">
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
                        <h3 className="text-xl font-display font-bold text-on-surface leading-tight tracking-tighter group-hover:text-primary transition-colors duration-300 mb-1">
                          {partner.shop_name}
                        </h3>
                        <p className="text-xs font-bold text-on-surface/60 capitalize">
                          {partner.address || 'Address not available'}, {partner.city || 'City'}
                        </p>
                      </div>
                      
                      {/* Status */}
                      <div className="flex items-center gap-2 mb-6">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        <span className="text-green-600 text-xs font-bold uppercase">Active Partner</span>
                      </div>
                      
                      {/* Footer */}
                      <div className="flex items-center justify-between pt-6 border-t border-outline-variant/20 mt-auto">
                        <div className="text-xs font-bold text-on-surface/60">
                          {partner.cell_phone || 'No phone'}
                        </div>
                        <div className="flex items-center gap-1 text-primary font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                          View Details <ChevronRight size={14} strokeWidth={3} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
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
      <section className="flex-1 relative h-full bg-surface-dim lg:mt-0 mt-[180px]">
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
          <MapController center={mapCenter} zoom={zoom} followUser={followUser} onManualOverride={handleManualOverride} />
          <ZoomControl position="bottomright" />
          
          {/* Route Polyline */}
          {route && routeTransition !== 'exiting' && (
            <>
              {/* Base route layer */}
              <Polyline
                positions={route}
                color="#1a558b"
                weight={6}
                opacity={0.3}
                lineJoin="round"
                dashArray="0"
              />
              
              {/* Animated flowing route */}
              <Polyline
                positions={route}
                color="#1a558b"
                weight={6}
                opacity={0.9}
                lineJoin="round"
                dashArray="10, 10"
                pathOptions={{
                  className: 'route-flowing'
                }}
              />
              
              {/* Glow effect layer */}
              <Polyline
                positions={route}
                color="#1a558b"
                weight={12}
                opacity={0.15}
                lineJoin="round"
                dashArray="0"
              />
            </>
          )}

          {/* User Location Marker */}
          {userLocation && (
            <>
              <Marker
                position={userLocation}
                icon={L.divIcon({
                  html: `
                    <div class="relative">
                      <div class="w-6 h-6 bg-blue-500 rounded-full border-4 border-white shadow-lg animate-pulse"></div>
                      <div class="absolute inset-0 w-6 h-6 rounded-full border-2 border-blue-500 animate-ping opacity-75"></div>
                    </div>
                  `,
                  className: '',
                  iconSize: [24, 24],
                  iconAnchor: [12, 12],
                })}
              />
              {/* Accuracy Circle */}
              {userAccuracy && (
                <Circle
                  center={userLocation}
                  radius={userAccuracy}
                  color="#3b82f6"
                  weight={1}
                  opacity={0.2}
                  fill={true}
                  fillColor="#3b82f6"
                  fillOpacity={0.05}
                  dashArray="5, 5"
                />
              )}
            </>
          )}
          
          {filteredPartners
            .map((p) => {
              // Use partner coordinates if available, otherwise use city coordinates as fallback
              let lat = p.latitude;
              let lng = p.longitude;
              
              if (!lat || !lng) {
                const city = extractCityFromAddress(p.address || '');
                const cityCoords = city ? getCityCoordinates(city) : null;
                if (cityCoords) {
                  lat = cityCoords.latitude;
                  lng = cityCoords.longitude;
                }
              }
              
              // Only render marker if we have coordinates
              if (!lat || !lng) return null;
              
              return (
                <Marker 
                  key={p.id} 
                  position={[lat, lng]} 
                  icon={createCustomIcon(p)}
                  eventHandlers={{
                    click: () => {
                      setSelectedPartnerId(p.id);
                      setIsDetailOpen(true);
                    },
                  }}
                >
                  <Popup className="custom-popup" closeButton={false}>
                    <div className="p-4 bg-white rounded-2xl min-w-[280px]">
                      <div className="flex justify-between items-start gap-3 mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 rounded-md bg-primary/5 text-primary text-[8px] font-black uppercase tracking-widest">{p.category || 'Partner'}</span>
                            <div className="flex items-center gap-1">
                              <div className="w-1 h-1 rounded-full bg-green-500" />
                              <span className="text-[8px] font-bold text-green-600 uppercase">Live</span>
                            </div>
                          </div>
                          <h4 className="text-lg font-display font-bold text-primary m-0 leading-tight tracking-tighter">{p.shop_name}</h4>
                        </div>
                        <div className="bg-primary text-white w-14 h-14 rounded-xl flex flex-col items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                          <span className="text-base font-black leading-none">{p.cashback_percent}%</span>
                          <span className="text-[7px] font-black uppercase opacity-70">Back</span>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <div className="flex items-start gap-2 text-on-surface-variant">
                          <MapPin size={14} strokeWidth={2.5} className="text-primary/40 mt-0.5 shrink-0" />
                          <span className="text-[11px] font-semibold text-on-surface/70 leading-snug">{p.address || 'Address not available'}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 items-center">
                        <div 
                          onClick={() => {
                            // Enable follow mode and calculate route
                            setNavigationRequested(true);
                            setFollowUser(true);
                            setSelectedPartnerId(p.id);
                            
                            // Get user location if not already available
                            if (!userLocation) {
                              navigator.geolocation.getCurrentPosition((position) => {
                                const userLoc: [number, number] = [position.coords.latitude, position.coords.longitude];
                                setUserLocation(userLoc);
                                setMapCenter(userLoc);
                                setZoom(15);
                              });
                            } else {
                              setMapCenter(userLocation);
                              setZoom(15);
                            }
                          }}
                          className="map-btn-wrapper"
                          style={{ margin: 0, width: 'auto' }}
                        >
                          <svg height="0" width="0">
                            <filter id="land-popup">
                              <feTurbulence result="turb" numOctaves="7" baseFrequency="0.006" type="fractalNoise"></feTurbulence>
                              <feDisplacementMap yChannelSelector="G" xChannelSelector="R" scale="700" in="SourceGraphic" in2="turb"></feDisplacementMap>
                            </filter>
                          </svg>
                          <div className="map-btn" style={{ fontSize: '11px', padding: '1.2em 1.8em 1.1em 4em' }}>Get Directions</div>
                          <div className="pinpoint"></div>
                          <div className="map-container">
                            <div className="map fold-1"></div>
                            <div className="map fold-2"></div>
                            <div className="map fold-3"></div>
                            <div className="map fold-4"></div>
                          </div>
                        </div>
                        <button 
                          onClick={() => setIsDetailOpen(true)}
                          className="w-10 h-10 bg-surface-container rounded-lg flex items-center justify-center text-primary hover:bg-primary/10 transition-all duration-300 shrink-0"
                        >
                          <Info size={16} strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })
            .filter(Boolean) // Remove null entries
          }
        </MapContainer>

        {/* Floating Map Controls */}
        <div className="absolute top-4 lg:top-10 left-4 lg:left-10 right-4 lg:right-10 flex justify-between items-start pointer-events-none z-[1000]">
          <div className="flex flex-col gap-4 pointer-events-auto">
            {/* Route Error Message */}
            {routeError && (
              <motion.div 
                initial={{ x: -20, opacity: 0, scale: 0.95 }}
                animate={{ x: 0, opacity: 1, scale: 1 }}
                exit={{ x: -20, opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                className="glass-panel px-5 lg:px-7 py-4 lg:py-5 rounded-2xl lg:rounded-[24px] shadow-2xl bg-gradient-to-r from-red-50 to-transparent border border-red-200/50"
              >
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-xs lg:text-sm font-bold text-red-900">{routeError}</p>
                    <p className="text-[10px] lg:text-xs font-medium text-red-600/70">Try selecting another partner or check your connection</p>
                  </div>
                </div>
              </motion.div>
            )}
            
            {/* Routing Status */}
            {isRouting && (
              <motion.div 
                initial={{ x: -20, opacity: 0, scale: 0.95 }}
                animate={{ x: 0, opacity: 1, scale: 1 }}
                exit={{ x: -20, opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                className="glass-panel flex items-center gap-4 px-5 lg:px-7 py-4 lg:py-5 rounded-2xl lg:rounded-[24px] shadow-2xl bg-gradient-to-r from-blue-50 to-transparent border border-blue-100/50"
              >
                {/* Enhanced Loader */}
                <div className="relative w-5 h-5 lg:w-6 lg:h-6">
                  {/* Outer pulsing ring */}
                  <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 border-r-blue-500 loader-spin" />
                  
                  {/* Inner rotating circle */}
                  <div className="absolute inset-1 rounded-full border-2 border-transparent border-b-blue-400 loader-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }} />
                  
                  {/* Center dot */}
                  <div className="absolute inset-2 rounded-full bg-gradient-to-br from-blue-500 to-blue-600" />
                </div>
                
                <div className="flex flex-col gap-1">
                  <span className="text-xs lg:text-sm font-bold text-blue-900">Calculating route...</span>
                  <span className="text-[10px] lg:text-xs font-medium text-blue-600/70">Finding optimal path</span>
                </div>
              </motion.div>
            )}
            
            {/* Follow Mode Status */}
            {followUser && userLocation && (
              <motion.div 
                initial={{ x: -20, opacity: 0, scale: 0.95 }}
                animate={{ x: 0, opacity: 1, scale: 1 }}
                exit={{ x: -20, opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                className="glass-panel flex items-center gap-3 px-5 lg:px-7 py-4 lg:py-5 rounded-2xl lg:rounded-[24px] shadow-2xl bg-gradient-to-r from-green-50 to-transparent border border-green-100/50"
              >
                <div className="relative w-3 h-3">
                  <div className="absolute inset-0 rounded-full bg-green-500 animate-pulse" />
                  <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs lg:text-sm font-bold text-green-900">Following your location</span>
                  <span className="text-[10px] lg:text-xs font-medium text-green-600/70">Real-time tracking active</span>
                </div>
              </motion.div>
            )}
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="glass-panel flex items-center gap-3 lg:gap-6 px-4 lg:px-8 py-3 lg:py-4 rounded-2xl lg:rounded-[24px] shadow-2xl"
            >
              <div className="flex items-center gap-2 lg:gap-3">
                <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Locate size={14} strokeWidth={2.5} />
                </div>
                <span className="text-[8px] lg:text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em]">Range</span>
              </div>
              <div className="flex items-center gap-3 lg:gap-6">
                <div className="w-32 lg:w-48 h-2 bg-primary/10 rounded-full relative cursor-pointer group">
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
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 lg:w-6 lg:h-6 bg-white border-[2px] lg:border-[3px] border-primary rounded-full shadow-xl pointer-events-none z-20"
                    style={{ left: `${(radius / 50) * 100}%`, marginLeft: '-8px' }}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                  />
                </div>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-sm lg:text-lg font-display font-bold text-primary tabular-nums leading-none">{radius}</span>
                  <span className="text-[8px] lg:text-[10px] font-black text-primary/60 uppercase">km</span>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="flex gap-2 lg:gap-3 pointer-events-auto">
            <motion.button 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              onClick={handleLocate}
              className={`w-10 h-10 lg:w-14 lg:h-14 glass-panel rounded-xl lg:rounded-2xl flex items-center justify-center transition-all duration-500 shadow-2xl active:scale-90 group ${
                followUser 
                  ? 'bg-blue-500 text-white hover:bg-blue-600' 
                  : 'text-on-surface-variant hover:text-primary hover:bg-white'
              }`}
            >
              <Locate size={18} strokeWidth={2} className={`${followUser ? 'animate-pulse' : 'group-hover:rotate-12'} transition-transform`} />
            </motion.button>
            <motion.button 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              onClick={toggleLayer}
              className="w-10 h-10 lg:w-14 lg:h-14 glass-panel rounded-xl lg:rounded-2xl flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-white transition-all duration-500 shadow-2xl active:scale-90 group"
            >
              <Layers size={18} strokeWidth={2} className="group-hover:rotate-12 transition-transform" />
            </motion.button>
            {/* Clear Route Button */}
            {route && (
              <motion.button 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.25 }}
                onClick={() => setRoute(null)}
                className="w-10 h-10 lg:w-14 lg:h-14 glass-panel rounded-xl lg:rounded-2xl flex items-center justify-center text-red-500 hover:bg-red-50 transition-all duration-500 shadow-2xl active:scale-90 group"
                title="Clear Route"
              >
                <X size={18} strokeWidth={2} className="group-hover:rotate-12 transition-transform" />
              </motion.button>
            )}
            {/* Mobile Partners Toggle */}
            <motion.button 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              onClick={() => setShowMobilePartners(!showMobilePartners)}
              className="lg:hidden w-10 h-10 glass-panel rounded-xl flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-white transition-all duration-500 shadow-2xl active:scale-90 group"
            >
              <span className="material-symbols-outlined text-lg">list</span>
            </motion.button>
          </div>
        </div>

        {/* Mobile Bottom Sheet for Partners */}
        <div className="lg:hidden">
          <AnimatePresence>
            {showMobilePartners && (
              <>
                {/* Backdrop */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowMobilePartners(false)}
                  className="absolute inset-0 bg-black/20 backdrop-blur-sm z-[2000]"
                />
                
                {/* Bottom Sheet */}
                <motion.div 
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="absolute bottom-0 left-0 right-0 bg-white z-[2001] rounded-t-3xl shadow-2xl max-h-[70vh] overflow-hidden"
                >
                  {/* Handle */}
                  <div className="flex justify-center py-3">
                    <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
                  </div>
                  
                  {/* Header */}
                  <div className="px-6 pb-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-gray-900">
                        Available Partners ({filteredPartners.length})
                      </h3>
                      <button 
                        onClick={() => setShowMobilePartners(false)}
                        className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Partners Grid */}
                  <div className="overflow-y-auto p-4">
                    <div className="grid grid-cols-2 gap-3">
                      {filteredPartners.map((partner) => {
                        const getCategoryColor = (category: string) => {
                          const colors = {
                            pharmacy: '#10b981',
                            grocery: '#f59e0b',
                            restaurant: '#ef4444',
                            retail: '#8b5cf6',
                            default: '#6b7280'
                          };
                          return colors[category?.toLowerCase() as keyof typeof colors] || colors.default;
                        };

                        const getBadgeColor = (cashbackPercent: number) => {
                          if (cashbackPercent >= 5) return '#f59e0b';
                          if (cashbackPercent >= 4) return '#3b82f6';
                          return '#10b981';
                        };

                        const badgeColor = getBadgeColor(partner.cashback_percent);
                        const memberEarns = Math.max(partner.cashback_percent - 2, 1);

                        return (
                          <motion.div
                            key={partner.id}
                            layout
                            onClick={() => {
                              setSelectedPartnerId(partner.id);
                              setShowMobilePartners(false);
                            }}
                            className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden relative"
                          >
                            {/* Badge */}
                            <div 
                              className="absolute top-2 right-2 px-2 py-1 rounded-full text-white text-xs font-bold z-10"
                              style={{ backgroundColor: badgeColor }}
                            >
                              {partner.cashback_percent > 3 ? `${memberEarns}%` : 'NEW'}
                            </div>
                            
                            {/* Image */}
                            <div 
                              className="h-20 w-full flex items-center justify-center relative overflow-hidden"
                              style={{ backgroundColor: getCategoryColor(partner.category || 'default') + '20' }}
                            >
                              {partner.store_logo_url ? (
                                <img
                                  src={partner.store_logo_url}
                                  alt={partner.shop_name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="material-symbols-outlined text-primary text-2xl">store</span>
                              )}
                            </div>
                            
                            {/* Content */}
                            <div className="p-3">
                              <div className="mb-2">
                                <span className="px-1.5 py-0.5 rounded bg-primary/5 text-primary text-[8px] font-black uppercase tracking-widest">
                                  {partner.category || 'Partner'}
                                </span>
                              </div>
                              <h4 className="font-bold text-sm text-gray-900 mb-1 line-clamp-1">
                                {partner.shop_name}
                              </h4>
                              <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                                {partner.address || 'Address not available'}
                              </p>
                              <div className="flex items-center gap-1">
                                <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                                <span className="text-[10px] font-bold text-green-600 uppercase">Active</span>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                    
                    {filteredPartners.length === 0 && (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Search size={24} className="text-gray-400" />
                        </div>
                        <h4 className="text-lg font-bold text-gray-900 mb-2">No partners found</h4>
                        <p className="text-sm text-gray-600 mb-4">
                          Try adjusting your search or expanding the radius
                        </p>
                        <button 
                          onClick={() => setRadius(50)}
                          className="px-6 py-3 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors"
                        >
                          Expand to 50km
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
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
                transition={{ duration: 0.3 }}
                onClick={() => setIsDetailOpen(false)}
                className="absolute inset-0 bg-black/20 backdrop-blur-sm z-[2000]"
              />
              
              {/* Detail Card */}
              <motion.div 
                initial={{ x: "100%", opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: "100%", opacity: 0 }}
                transition={{ 
                  type: "spring", 
                  damping: 28, 
                  stiffness: 300,
                  mass: 1,
                  velocity: 2
                }}
                className="absolute top-0 right-0 bottom-0 w-full lg:w-[540px] bg-white z-[2001] shadow-[-40px_0_80px_rgba(0,0,0,0.1)] flex flex-col"
              >
                {/* Header Image/Pattern Area */}
                <div className="h-48 lg:h-64 premium-gradient relative overflow-hidden shrink-0">
                  {/* Partner Logo Background */}
                  {selectedPartner.store_logo_url && (
                    <div 
                      className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
                      style={{ 
                        backgroundImage: `url(${selectedPartner.store_logo_url})`,
                        filter: 'blur(2px) brightness(0.7)'
                      }}
                    />
                  )}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
                  </div>
                  <button 
                    onClick={() => setIsDetailOpen(false)}
                    className="absolute top-4 lg:top-8 right-4 lg:right-8 w-10 h-10 lg:w-12 lg:h-12 bg-white/10 backdrop-blur-md rounded-xl lg:rounded-2xl flex items-center justify-center text-white hover:bg-white hover:text-primary transition-all duration-500 z-10"
                  >
                    <X size={20} strokeWidth={2.5} />
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
                <div className="flex-1 overflow-y-auto px-6 lg:px-10 py-8 lg:py-12 space-y-8 lg:space-y-12">
                  {/* Key Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 bg-surface-container-low rounded-[32px] border border-outline-variant/20">
                      <span className="block text-[9px] font-black text-on-surface-variant/60 uppercase tracking-widest mb-2">Cashback</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-display font-bold text-primary">{selectedPartner.cashback_percent}%</span>
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

                  {/* Action Button */}
                  <div className="pt-4">
                    {(() => {
                      // Use partner coordinates if available, otherwise use city coordinates as fallback
                      let lat = selectedPartner.latitude;
                      let lng = selectedPartner.longitude;
                      
                      if (!lat || !lng) {
                        const city = extractCityFromAddress(selectedPartner.address || '');
                        const cityCoords = city ? getCityCoordinates(city) : null;
                        if (cityCoords) {
                          lat = cityCoords.latitude;
                          lng = cityCoords.longitude;
                        }
                      }
                      
                      return lat && lng ? (
                        <div 
                          onClick={() => {
                            // Enable follow mode and calculate route
                            setNavigationRequested(true);
                            setFollowUser(true);
                            setSelectedPartnerId(selectedPartner.id);
                            setIsDetailOpen(false);
                            
                            // Get user location if not already available
                            if (!userLocation) {
                              navigator.geolocation.getCurrentPosition((position) => {
                                const userLoc: [number, number] = [position.coords.latitude, position.coords.longitude];
                                setUserLocation(userLoc);
                                setMapCenter(userLoc);
                                setZoom(15);
                              });
                            } else {
                              setMapCenter(userLocation);
                              setZoom(15);
                            }
                          }}
                          className="map-btn-wrapper"
                        >
                          <svg height="0" width="0">
                            <filter id="land">
                              <feTurbulence result="turb" numOctaves="7" baseFrequency="0.006" type="fractalNoise"></feTurbulence>
                              <feDisplacementMap yChannelSelector="G" xChannelSelector="R" scale="700" in="SourceGraphic" in2="turb"></feDisplacementMap>
                            </filter>
                          </svg>
                          <div className="map-btn">Get Directions</div>
                          <div className="pinpoint"></div>
                          <div className="map-container">
                            <div className="map fold-1"></div>
                            <div className="map fold-2"></div>
                            <div className="map fold-3"></div>
                            <div className="map fold-4"></div>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full py-6 bg-gray-100 text-gray-500 rounded-[28px] font-black text-sm uppercase tracking-[0.25em] flex items-center justify-center gap-4">
                          <MapPin size={20} strokeWidth={2.5} />
                          Location Not Available
                        </div>
                      );
                    })()}
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