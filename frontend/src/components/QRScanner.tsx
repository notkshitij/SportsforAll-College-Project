import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, CameraOff, FlipHorizontal, UploadCloud, Sparkles } from './icons';
import jsQR from 'jsqr';
import './QRScanner.css';

interface QRScannerProps {
  onScanSuccess: (qrText: string) => void;
  onError: (msg: string) => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScanSuccess, onError }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const animationFrameId = useRef<number | null>(null);

  // Stop camera helper
  const stopCamera = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  }, []);

  // Frame processing loop
  const processVideoFrame = useCallback(() => {
    if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      animationFrameId.current = requestAnimationFrame(processVideoFrame);
      return;
    }

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data) {
        stopCamera();
        onScanSuccess(code.data);
        return;
      }
    }

    animationFrameId.current = requestAnimationFrame(processVideoFrame);
  }, [onScanSuccess, stopCamera]);

  // Start camera
  const startCamera = async () => {
    try {
      if (streamRef.current) {
        stopCamera();
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
      }

      setIsScanning(true);
      animationFrameId.current = requestAnimationFrame(processVideoFrame);
    } catch (err: any) {
      console.error('Camera access error:', err);
      onError('Camera access denied or unavailable. Please check permissions or use manual entry.');
      stopCamera();
    }
  };

  // Toggle Camera Facing
  const toggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    if (isScanning) {
      stopCamera();
      setTimeout(() => {
        setFacingMode(nextMode);
        startCamera();
      }, 300);
    }
  };

  // Handle Image File Upload for QR decode
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code && code.data) {
          onScanSuccess(code.data);
        } else {
          onError('Could not detect a valid QR code in the uploaded image.');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <div className="scanner-card">
      <div className="scanner-header">
        <h2>
          <Camera size={22} color="var(--primary)" />
          <span>Live QR Scanner</span>
        </h2>
        <p>Align the student's Sports Stay Extension QR code within the frame</p>
      </div>

      <div className="camera-viewport">
        {isScanning ? (
          <>
            <video ref={videoRef} className="camera-video" muted playsInline />
            <div className="scanner-overlay">
              <div className="scanner-reticle">
                <div className="scanner-laser-line"></div>
              </div>
            </div>
          </>
        ) : (
          <div className="scanner-standby-screen">
            <div className="scanner-standby-icon">
              <CameraOff size={32} />
            </div>
            <p style={{ fontWeight: 600, color: '#E2E8F0' }}>Scanner is in Standby</p>
            <p style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
              Click "Start Scanner" below to activate camera
            </p>
          </div>
        )}
      </div>

      {/* Camera Controls */}
      <div className="scanner-controls-bar">
        {!isScanning ? (
          <button className="btn btn-primary btn-lg" onClick={startCamera}>
            <Camera size={18} />
            <span>🎥 Start Camera Scanner</span>
          </button>
        ) : (
          <>
            <button className="btn btn-danger" onClick={stopCamera}>
              <CameraOff size={18} />
              <span>Stop Scanner</span>
            </button>
            <button className="btn btn-secondary" onClick={toggleFacingMode} title="Flip Camera">
              <FlipHorizontal size={18} />
              <span>Flip Camera</span>
            </button>
          </>
        )}
      </div>

      {/* Upload QR File Alternative */}
      <div className="file-qr-upload-section">
        <span className="file-qr-upload-label">Or upload screenshot/photo of QR:</span>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadCloud size={16} />
          <span>Upload QR Image</span>
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="image/*"
          className="hidden-file-input"
        />
      </div>
    </div>
  );
};
