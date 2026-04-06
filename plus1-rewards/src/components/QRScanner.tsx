import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { X, Camera, AlertCircle, RefreshCw } from 'lucide-react';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const codeReader = useRef<BrowserMultiFormatReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

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
      setCameraReady(false);

      // Stop any existing stream first
      stopScanning();

      // Get available video devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      if (videoDevices.length === 0) {
        throw new Error('No camera found on this device');
      }

      // Try to get the back camera first, then any camera
      const constraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: { ideal: 'environment' }
        }
      };

      console.log('Requesting camera access...');
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      setHasPermission(true);
      console.log('Camera access granted, stream:', stream);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded');
          if (videoRef.current) {
            videoRef.current.play().then(() => {
              console.log('Video playing');
              setCameraReady(true);
              
              // Initialize ZXing code reader after video is playing
              setTimeout(() => {
                initializeScanner();
              }, 500);
            }).catch(err => {
              console.error('Error playing video:', err);
              setError('Failed to start camera preview');
            });
          }
        };

        videoRef.current.onerror = (err) => {
          console.error('Video error:', err);
          setError('Camera stream error');
        };
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setHasPermission(false);
      setIsScanning(false);
      
      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access and try again.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else if (err.name === 'NotReadableError') {
        setError('Camera is being used by another application.');
      } else {
        setError(`Camera error: ${err.message || 'Unknown error'}`);
      }
    }
  };

  const initializeScanner = () => {
    try {
      if (videoRef.current && cameraReady) {
        console.log('Initializing QR scanner...');
        codeReader.current = new BrowserMultiFormatReader();
        
        codeReader.current.decodeFromVideoDevice(undefined, videoRef.current, (result, error) => {
          if (result) {
            console.log('QR Code detected:', result.getText());
            onScan(result.getText());
            stopScanning();
          }
          // Don't log NotFoundException as it's normal when no QR code is visible
          if (error && error.name !== 'NotFoundException') {
            console.error('QR Scanner error:', error);
          }
        });
      }
    } catch (err) {
      console.error('Scanner initialization error:', err);
      setError('Failed to initialize QR scanner');
    }
  };

  const stopScanning = () => {
    console.log('Stopping scanner...');
    
    if (codeReader.current) {
      try {
        codeReader.current.reset();
      } catch (err) {
        console.error('Error resetting code reader:', err);
      }
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        console.log('Stopping track:', track.label);
        track.stop();
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsScanning(false);
    setCameraReady(false);
  };

  const handleManualInput = (phoneNumber: string) => {
    if (phoneNumber.length === 10) {
      onScan(phoneNumber);
    }
  };

  const handleRetry = () => {
    setError('');
    setHasPermission(null);
    startScanning();
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
          
          {/* Loading State */}
          {hasPermission === null && (
            <div className="bg-black/30 rounded-2xl p-8 mb-6">
              <Camera className="w-16 h-16 text-white/50 mx-auto mb-4 animate-pulse" />
              <p className="text-white/70 text-lg">Requesting camera access...</p>
            </div>
          )}

          {/* Permission Denied */}
          {hasPermission === false && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-2xl p-6 mb-6">
              <AlertCircle className="w-16 h-16 text-red-300 mx-auto mb-4" />
              <p className="text-red-200 text-lg mb-2">Camera Access Issue</p>
              <p className="text-red-200/80 text-sm mb-4">{error}</p>
              <button
                onClick={handleRetry}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-semibold transition-colors flex items-center gap-2 mx-auto"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            </div>
          )}

          {/* Camera View */}
          {hasPermission === true && (
            <div className="mb-6">
              <div className="relative bg-black rounded-2xl overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-64 object-cover"
                  style={{ transform: 'scaleX(-1)' }} // Mirror the video for better UX
                />
                
                {/* Loading overlay when camera is not ready */}
                {!cameraReady && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-white/70 text-sm">Starting camera...</p>
                    </div>
                  </div>
                )}
                
                {/* Scanning overlay */}
                {cameraReady && (
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
                )}
              </div>
              
              <p className="text-white/70 text-sm mt-4">
                {cameraReady ? 'Position the QR code within the frame to scan' : 'Initializing camera...'}
              </p>
              
              {error && (
                <div className="mt-4 bg-red-500/20 border border-red-500/50 rounded-xl p-3">
                  <p className="text-red-200 text-sm">{error}</p>
                  <button
                    onClick={handleRetry}
                    className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded-lg text-sm font-semibold transition-colors"
                  >
                    Retry
                  </button>
                </div>
              )}
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