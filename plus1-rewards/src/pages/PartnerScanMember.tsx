import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import jsQR from 'jsqr';
import { parseMemberQR } from '../lib/config';

interface Member { id: string; name: string; phone: string; qr_code: string }
interface Wallet { id: string; member_id: string; balance: number; policies: { name: string; current: number; target: number; status: 'active' | 'paused' } }

export function PartnerScanMember() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [member, setMember] = useState<Member | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [partner, setPartner] = useState<any>(null);
  const [permissionAsked, setPermissionAsked] = useState(false);

  useEffect(() => {
    // Load partner data
    const partnerData = localStorage.getItem('currentPartner');
    if (!partnerData) { navigate('/partner/login'); return; }
    setPartner(JSON.parse(partnerData));
    
    return () => { stopCamera(); cancelAnimationFrame(rafRef.current); };
  }, []);

  const startCamera = async () => {
    setPermissionAsked(true);
    setError('');

    // Camera API requires HTTPS (except localhost)
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError(
        'Camera blocked: Your browser requires a secure HTTPS connection to use the camera. ' +
        'Please access this app via https:// or use localhost. ' +
        'As a workaround, use the phone search option in the Partner Dashboard.'
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setScanning(true);
          requestAnimationFrame(tick);
        };
      }
    } catch (err: any) {
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        setError('Camera permission was denied. Please open your browser settings, allow camera access for this site, then try again.');
      } else if (err?.name === 'NotFoundError') {
        setError('No camera found on this device. Use the phone search option in the Partner Dashboard instead.');
      } else {
        setError('Unable to start camera. Try using the phone search option instead.');
      }
    }
  };

  const stopCamera = () => {
    cancelAnimationFrame(rafRef.current);
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    }
  };

  const tick = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(tick); return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) { rafRef.current = requestAnimationFrame(tick); return; }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });
    if (code?.data) {
      stopCamera();
      setScanning(false);
      handleQRDecoded(code.data);
    } else {
      rafRef.current = requestAnimationFrame(tick);
    }
  };

  const handleQRDecoded = async (data: string) => {
    setError('');
    // Parse using config helper — supports URL, PLUS1-legacy, and raw strings
    const identifier = parseMemberQR(data);
    if (!identifier) { 
      setError('QR code not recognized as a +1 Rewards member. Ask the member to show their QR code from the app.'); 
      return; 
    }

    let memberData = null;
    // Try qr_code field
    const { data: byQR } = await supabase.from('members').select('*').eq('qr_code', identifier).single();
    if (byQR) { memberData = byQR; }
    else {
      // Try phone
      const { data: byPhone } = await supabase.from('members').select('*').eq('phone', identifier).single();
      if (byPhone) memberData = byPhone;
    }
    
    if (!memberData) { 
      setError('Member not found in the +1 Rewards network. Ask them to register first.'); 
      return; 
    }

    // Check if member has an active policy
    if (!memberData.active_policy) {
      setError('Member must select a policy plan before receiving rewards. Ask them to choose a policy in their +1 Rewards app first.');
      return;
    }
    
    setMember(memberData);
    
    // Check if member has wallet with this partner
    const { data: walletData } = await supabase.from('wallets').select('*').eq('member_id', memberData.id).eq('partner_id', partner?.id).single();
    if (walletData) {
      setWallet(walletData);
    } else {
      setError('Member not connected to this partner. Ask them to scan Your Business QR code first.');
    }
  };

  const handleManualInput = () => {
    stopCamera();
    navigate('/partner/dashboard');
  };

  const handleProceedToRewards = () => {
    if (member && wallet) {
      // Store the selected member data and navigate back to dashboard
      sessionStorage.setItem('selectedMember', JSON.stringify({ member, wallet }));
      navigate('/partner/dashboard');
    }
  };

  return (
    <div className="page-wrapper">
      <header className="page-header">
        <div style={{ maxWidth: '56rem', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '1.125rem', fontWeight: 800, margin: 0 }}>📱 Scan Member QR</h1>
            <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>Identify member to issue rewards</p>
          </div>
          <button onClick={() => { stopCamera(); navigate('/partner/dashboard'); }}
            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff', borderRadius: '8px', padding: '0.375rem 0.875rem', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}>
            ✕ Close
          </button>
        </div>
      </header>

      <main style={{ flex: 1, padding: '1.5rem 1rem', display: 'flex', alignItems: 'start', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {error && <div className="alert alert-error">{error}</div>}

          {!member ? (
            <div className="card" style={{ padding: '1.5rem' }}>

              {/* Permission prompt — shown before camera starts */}
              {!permissionAsked && (
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>📷</div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', marginBottom: '0.5rem' }}>Camera Access Needed</h2>
                  <p style={{ color: 'var(--gray-text)', fontSize: '0.9375rem', lineHeight: 1.6, marginBottom: '1.75rem' }}>
                    To scan a member's QR code, +1 Rewards needs access to your camera.
                    Your browser will ask for permission — please click <strong>Allow</strong>.
                  </p>
                  <button onClick={startCamera} className="btn btn-primary btn-block" style={{ height: '56px', borderRadius: '12px', fontSize: '1rem', marginBottom: '0.875rem' }}>
                    📷 Allow Camera & Start Scanning
                  </button>
                  <button onClick={handleManualInput} className="btn btn-ghost btn-block" style={{ borderRadius: '10px' }}>
                    📞 Use Phone Search Instead
                  </button>
                </div>
              )}

              {/* Live camera viewport — shown after permission granted */}
              {permissionAsked && (
                <>
                  <p style={{ color: 'var(--gray-text)', fontSize: '0.9375rem', textAlign: 'center', marginBottom: '1.25rem' }}>
                    Ask the member to show their QR code from the +1 Rewards app
                  </p>
                  <div style={{ position: 'relative', background: '#000', borderRadius: '16px', overflow: 'hidden', marginBottom: '1.25rem', aspectRatio: '1' }}>
                    <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                    {/* Overlay */}
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: '200px', height: '200px', borderRadius: '12px', boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)', border: '2px solid var(--green)', position: 'relative' }}>
                        {['top:0;left:0', 'top:0;right:0', 'bottom:0;left:0', 'bottom:0;right:0'].map((pos, i) => {
                          const isTop = pos.includes('top:0'); const isLeft = pos.includes('left:0');
                          return (<div key={i} style={{ position: 'absolute', width: '20px', height: '20px', top: isTop ? 0 : 'auto', bottom: !isTop ? 0 : 'auto', left: isLeft ? 0 : 'auto', right: !isLeft ? 0 : 'auto', borderTop: isTop ? '3px solid #37d270' : 'none', borderBottom: !isTop ? '3px solid #37d270' : 'none', borderLeft: isLeft ? '3px solid #37d270' : 'none', borderRight: !isLeft ? '3px solid #37d270' : 'none' }} />);
                        })}
                      </div>
                    </div>
                    {scanning && (
                      <div style={{ position: 'absolute', bottom: '1rem', left: 0, right: 0, textAlign: 'center' }}>
                        <span style={{ background: 'rgba(0,0,0,0.6)', color: '#37d270', padding: '0.375rem 0.875rem', borderRadius: '20px', fontSize: '0.8125rem', fontWeight: 600 }}>
                          🔍 Scanning for member QR...
                        </span>
                      </div>
                    )}
                  </div>
                  <button onClick={handleManualInput} className="btn btn-outline btn-block" style={{ borderRadius: '10px' }}>
                    📞 Use Phone Search Instead
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="card animate-fade-up" style={{ textAlign: 'center' }}>
              <div style={{ width: '64px', height: '64px', background: 'var(--green-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '2rem' }}>
                👤
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', marginBottom: '0.375rem' }}>Member Found!</h2>
              <p style={{ color: 'var(--blue)', fontWeight: 700, fontSize: '1.125rem', marginBottom: '0.25rem' }}>{member.name}</p>
              <p style={{ color: 'var(--gray-text)', fontSize: '0.9375rem', marginBottom: '1rem' }}>{member.phone}</p>
              
              {wallet && (
                <div style={{ background: 'var(--blue-light)', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem', border: '1px solid #dce8f5' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--gray-light)', margin: '0 0 2px' }}>Policy</p>
                      <p style={{ fontWeight: 600, color: '#111827', margin: 0, fontSize: '0.875rem' }}>{wallet.policies?.name}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--gray-light)', margin: '0 0 2px' }}>Progress</p>
                      <p style={{ fontWeight: 700, color: 'var(--blue)', margin: 0 }}>R{wallet.policies?.current || 0} / R{wallet.policies?.target || 0}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <button onClick={handleProceedToRewards} disabled={!wallet} className="btn btn-green btn-block" style={{ borderRadius: '12px', height: '52px', marginBottom: '0.75rem' }}>
                {wallet ? '✓ Proceed to Issue Rewards' : '❌ Member Not Connected'}
              </button>
              <button onClick={() => { setMember(null); setWallet(null); setError(''); startCamera(); }} className="btn btn-ghost btn-block" style={{ borderRadius: '12px' }}>
                🔄 Scan Different Member
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}