import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { X, Camera, AlertCircle } from 'lucide-react';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const codeReader = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    startScanning();
    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    try {
      setError('');
      setIsScanning(true);

      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment' // Use back camera if available
        } 
      });
      
      setHasPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Initialize ZXing code reader
        codeReader.current = new BrowserMultiFormatReader();
        
        // Start scanning
        codeReader.current.decodeFromVideoDevice(undefined, videoRef.current, (result, error) => {
          if (result) {
            onScan(result.getText());
            stopScanning();
          }
          if (error && !(error.name === 'NotFoundException')) {
            console.error('QR Scanner error:', error);
          }
        });
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setHasPermission(false);
      setIsScanning(false);
      
      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access and try again.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else {
        setError('Failed to access camera. Please check your camera settings.');
      }
    }
  };

  const stopScanning = () => {
    if (codeReader.current) {
      codeReader.current.reset();
    }
    
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    setIsScanning(false);
  };

  const handleManualInput = (phoneNumber: string) => {
    if (phoneNumber.length === 10) {
      onScan(phoneNumber);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 max-w-md w-full">
        <div className="text-center">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white text-2xl font-bold">Scan QR Code</h3>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Camera View */}
          {hasPermission === null && (
            <div className="bg-black/30 rounded-2xl p-8 mb-6">
              <Camera className="w-16 h-16 text-white/50 mx-auto mb-4" />
              <p className="text-white/70 text-lg">Requesting camera access...</p>
            </div>
          )}

          {hasPermission === false && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-2xl p-6 mb-6">
              <AlertCircle className="w-16 h-16 text-red-300 mx-auto mb-4" />
              <p className="text-red-200 text-lg mb-2">Camera Access Required</p>
              <p className="text-red-200/80 text-sm">{error}</p>
              <button
                onClick={startScanning}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-semibold transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {hasPermission === true && (
            <div className="mb-6">
              <div className="relative bg-black rounded-2xl overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-64 object-cover"
                />
                
                {/* Scanning overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 border-4 border-blue-400 rounded-2xl relative">
                    <div className="absolute inset-2 border-2 border-blue-400/50 rounded-xl animate-pulse"></div>
                    
                    {/* Corner indicators */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg"></div>
                  </div>
                </div>
              </div>
              
              <p className="text-white/70 text-sm mt-4">
                Position the QR code within the frame to scan
              </p>
            </div>
          )}

          {/* Manual Input Alternative */}
          <div className="border-t border-white/20 pt-6">
            <p className="text-white/60 text-sm mb-4">Can't scan? Enter manually:</p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter phone number"
                maxLength={10}
                className="flex-1 bg-black/30 text-white rounded-xl px-4 py-3 border border-white/20 focus:border-blue-400 focus:outline-none"
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                  e.target.value = value;
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const input = e.target as HTMLInputElement;
                    handleManualInput(input.value);
                  }
                }}
              />
              <button
                onClick={(e) => {
                  const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                  handleManualInput(input.value);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}