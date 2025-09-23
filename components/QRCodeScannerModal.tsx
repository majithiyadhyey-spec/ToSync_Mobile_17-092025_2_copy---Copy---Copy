import React, { useRef, useEffect, useState, useCallback } from 'react';
import jsQR from 'jsqr';
import XIcon from './icons/XIcon';
import { useI18n } from '../context/I18nContext';

interface QRCodeScannerModalProps {
  onScan: (data: string | null) => void;
  onClose: () => void;
  targetTaskId?: string;
}

const QRCodeScannerModal: React.FC<QRCodeScannerModalProps> = ({ onScan, onClose, targetTaskId }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // FIX: The `useRef` hook requires an initial value when a generic type is provided.
  // The call `useRef<T>()` is invalid; it should be `useRef<T>(initialValue)`. Initialized with `null`.
  const requestRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const { t } = useI18n();

  const handleScan = useCallback((code: string) => {
    if (targetTaskId && code !== targetTaskId) {
        setScanError(t('scannerModal_error_incorrect'));
        setTimeout(() => setScanError(null), 3000); // Clear error after 3s
        return false;
    }
    setScanResult(code);
    onScan(code);
    return true;
  }, [targetTaskId, onScan, t]);

  const tick = useCallback(() => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const video = videoRef.current;
      const canvasElement = canvasRef.current;
      const canvas = canvasElement?.getContext('2d', { willReadFrequently: true });
      if (canvasElement && canvas) {
        canvasElement.height = video.videoHeight;
        canvasElement.width = video.videoWidth;
        canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
        const imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code) {
          if (handleScan(code.data)) {
            return; // Stop scanning on successful and valid scan
          }
        }
      }
    }
    requestRef.current = requestAnimationFrame(tick);
  }, [handleScan]);
  
  const cleanup = useCallback(() => {
    if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
    }
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
    }
    if (videoRef.current) {
        videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
      cleanup();
      setScanError(null);
      setCameraReady(false);
      try {
          if (!navigator.mediaDevices?.getUserMedia) {
              throw new Error(t('scannerModal_cameraError'));
          }
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
          streamRef.current = stream;
          if (videoRef.current) {
              videoRef.current.srcObject = stream;
              await videoRef.current.play();
              setCameraReady(true);
              requestRef.current = requestAnimationFrame(tick);
          }
      } catch (err: any) {
          console.error("Camera Error:", err);
          if (err.name === "NotAllowedError") {
              setScanError(t('scannerModal_permissionDenied'));
          } else if (err.name === "NotFoundError") {
              setScanError(t('scannerModal_noCamera'));
          } else {
              setScanError(t('scannerModal_cameraError'));
          }
      }
  }, [cleanup, tick, t]);


  useEffect(() => {
    startCamera();
    return cleanup;
  }, [startCamera, cleanup]);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4" aria-modal="true" role="dialog">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-lg relative">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('scannerModal_title')}</h2>
          <button type="button" onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition" aria-label={t('scannerModal_close')}>
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        
        <div className="relative aspect-video bg-gray-900 overflow-hidden">
            <video ref={videoRef} className={`w-full h-full object-cover transition-opacity duration-300 ${cameraReady ? 'opacity-100' : 'opacity-0'}`} playsInline />
            <canvas ref={canvasRef} className="hidden" />

            {/* Overlay */}
            <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
              <div className="w-full max-w-[250px] aspect-square relative">
                <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-white rounded-br-lg"></div>
              </div>
            </div>

             {/* Status Display */}
             <div className="absolute top-0 left-0 right-0 p-4 text-center">
                {!cameraReady && !scanError && <div className="bg-black/50 text-white text-sm font-semibold px-3 py-1.5 rounded-md">{t('loading')}</div>}
                {scanError && (
                     <div className="bg-red-500 text-white text-sm font-semibold px-3 py-1.5 rounded-md">
                        {scanError}
                        {scanError !== t('scannerModal_error_incorrect') && <button onClick={startCamera} className="ml-2 underline">{t('scannerModal_tryAgain')}</button>}
                    </div>
                )}
                {scanResult && <div className="bg-green-500 text-white text-sm font-semibold px-3 py-1.5 rounded-md">{t('scannerModal_success')}</div>}
             </div>
        </div>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 min-h-[60px] flex items-center justify-center">
            <p className="text-center text-gray-500 dark:text-gray-400">{t('scannerModal_prompt')}</p>
        </div>
      </div>
    </div>
  );
};

export default QRCodeScannerModal;