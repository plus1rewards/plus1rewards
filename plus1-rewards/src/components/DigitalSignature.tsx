import { useRef, useState, useEffect } from 'react';

interface DigitalSignatureProps {
  onSign: (signatureDataUrl: string) => void;
  onCancel: () => void;
  partnerName: string;
  cashbackPercent: number;
}

export default function DigitalSignature({ 
  onSign, 
  onCancel, 
  partnerName, 
  cashbackPercent 
}: DigitalSignatureProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Set drawing style
    ctx.strokeStyle = '#1a558b';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasSignature(true);

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSign = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) return;

    const signatureDataUrl = canvas.toDataURL('image/png');
    onSign(signatureDataUrl);
  };

  const systemFee = 1;
  const agentFee = 1;
  const memberCashback = cashbackPercent - 2;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 space-y-4">
          {/* Header */}
          <div className="text-center">
            <h2 className="text-2xl font-black text-gray-900">Partner Agreement</h2>
            <p className="text-sm text-gray-600 mt-1">Please review and sign to complete registration</p>
          </div>

          {/* Agreement Content */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-sm max-h-64 overflow-y-auto">
            <h3 className="font-bold text-base text-[#1a558b]">Plus1 Rewards Partner Agreement</h3>
            
            <div className="space-y-3 text-xs">
              <p>Partners are shop/business owners who:</p>
              <ul className="list-disc list-inside pl-2 space-y-1">
                <li>Process member transactions and issue cashback daily</li>
                <li>Manage store operations and maintain professional standards</li>
                <li>Offer delivery and/or pickup services through Plus1-Go (optional)</li>
                <li>Manage product catalogs and order fulfillment</li>
                <li>Pay monthly invoices for cashback liability</li>
                <li>Track sales, cashback, and financial performance</li>
                <li>Maintain compliance and documentation</li>
                <li>Provide excellent member and customer service</li>
                <li>Work with linked agents for support and growth</li>
                <li>Generate revenue through transaction volume and member engagement</li>
              </ul>
              <p className="font-semibold mt-3">This makes partners critical to the daily transaction processing, member experience, and revenue generation of the Plus1 Rewards system.</p>
            </div>
          </div>

          {/* Signature Section */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-[#1a558b]">
              Digital Signature
            </label>
            <p className="text-xs text-gray-600">Sign below using your mouse or touchscreen</p>
            <div className="border-2 border-[#1a558b] rounded-xl overflow-hidden bg-white">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-40 cursor-crosshair touch-none"
                style={{ touchAction: 'none' }}
              />
            </div>
            <button
              type="button"
              onClick={clearSignature}
              className="text-xs text-gray-600 hover:text-gray-900 underline"
            >
              Clear Signature
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSign}
              disabled={!hasSignature}
              className="flex-1 px-4 py-3 rounded-xl font-bold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                backgroundColor: hasSignature ? '#1a558b' : '#9ca3af',
                cursor: hasSignature ? 'pointer' : 'not-allowed'
              }}
            >
              Sign & Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
