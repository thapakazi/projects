
import React, { useRef, useEffect, useState } from 'react';
import { AppSettings, HabitMode } from '../types';
import { checkTrichotillomania } from '../lib/modes/trichotillomania';
import { detectNosePicking, NOSE_LANDMARKS } from '../lib/modes/nose-picking';
import { detectNailBiting, MOUTH_LANDMARKS } from '../lib/modes/nail-biting';
import { detectSkinPicking, FACE_SKIN_LANDMARKS } from '../lib/modes/skin-picking';
import { detectBeardPulling, BEARD_LANDMARKS } from '../lib/modes/beard-pulling';

interface CameraPanelProps {
  settings: AppSettings;
  onDetection: (inZone: boolean) => void;
}

const CameraPanel: React.FC<CameraPanelProps> = ({ settings, onDetection }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let handLandmarker: any = null;
    let faceLandmarker: any = null;
    let imageSegmenter: any = null;
    let animationFrame: number;

    const setupMediaPipe = async () => {
      try {
        const { FilesetResolver, HandLandmarker, FaceLandmarker, ImageSegmenter } = await import('@mediapipe/tasks-vision');
        
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm"
        );

        const baseOptions = { delegate: "GPU" as const };

        handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: { ...baseOptions, modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task` },
          runningMode: "VIDEO",
          numHands: 2
        });

        faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: { ...baseOptions, modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task` },
          runningMode: "VIDEO"
        });

        imageSegmenter = await ImageSegmenter.createFromOptions(vision, {
          baseOptions: { ...baseOptions, modelAssetPath: `https://storage.googleapis.com/mediapipe-models/image_segmenter/hair_segmenter/float32/latest/hair_segmenter.tflite` },
          runningMode: "VIDEO",
          outputCategoryMask: true
        });

        if (isMounted) setLoading(false);
        startCamera();
      } catch (err) {
        console.error("MediaPipe Init Error:", err);
        if (isMounted) setError(`AI Engine Error: Ensure GPU hardware acceleration is enabled.`);
      }
    };

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            if (!videoRef.current) return;
            videoRef.current.play();
            detect();
          };
        }
      } catch (err) {
        if (isMounted) setError("Camera access denied.");
      }
    };

    const detect = () => {
      if (!videoRef.current || !canvasRef.current || !handLandmarker || !faceLandmarker || !imageSegmenter) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx || video.paused || video.ended) {
        animationFrame = requestAnimationFrame(detect);
        return;
      }

      // Size canvas to container so drawing coords match the displayed video
      const container = canvas.parentElement!;
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width = cw;
        canvas.height = ch;
      }

      // Compute object-cover transform: how normalized video coords map to canvas pixels
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      const scale = Math.max(cw / vw, ch / vh);
      const dw = vw * scale;
      const dh = vh * scale;
      const ox = (cw - dw) / 2;
      const oy = (ch - dh) / 2;
      const mapX = (nx: number) => nx * dw + ox;
      const mapY = (ny: number) => ny * dh + oy;

      const startTimeMs = performance.now();
      let isDetected = false;
      let hairMaskData: Uint8Array | null = null;
      let maskWidth = 0;
      let maskHeight = 0;
      let currentFacePoints: any[] = [];
      let targetIndices: number[] = [];

      const handResults = handLandmarker.detectForVideo(video, startTimeMs);

      if (settings.habitMode === HabitMode.TRICHOTILLOMANIA) {
        const segmentResult = imageSegmenter.segmentForVideo(video, startTimeMs);
        if (segmentResult && segmentResult.categoryMask) {
          const mask = segmentResult.categoryMask;
          hairMaskData = mask.getAsUint8Array();
          maskWidth = mask.width;
          maskHeight = mask.height;
          isDetected = checkTrichotillomania(handResults.landmarks, hairMaskData, maskWidth, maskHeight, settings.sensitivity);
          mask.close();
        }
      } else {
        const faceResults = faceLandmarker.detectForVideo(video, startTimeMs);
        currentFacePoints = faceResults.faceLandmarks?.[0] || [];
        
        switch (settings.habitMode) {
          case HabitMode.NOSE_PICKING:
            targetIndices = NOSE_LANDMARKS;
            isDetected = detectNosePicking(handResults.landmarks, faceResults.faceLandmarks, settings.sensitivity);
            break;
          case HabitMode.NAIL_BITING:
            targetIndices = MOUTH_LANDMARKS;
            isDetected = detectNailBiting(handResults.landmarks, faceResults.faceLandmarks, settings.sensitivity);
            break;
          case HabitMode.SKIN_PICKING:
            targetIndices = FACE_SKIN_LANDMARKS;
            isDetected = detectSkinPicking(handResults.landmarks, faceResults.faceLandmarks, settings.sensitivity);
            break;
          case HabitMode.BEARD_PULLING:
            targetIndices = BEARD_LANDMARKS;
            isDetected = detectBeardPulling(handResults.landmarks, faceResults.faceLandmarks, settings.sensitivity);
            break;
        }
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (settings.showDetectionPoints && hairMaskData) {
        if (!maskCanvasRef.current) maskCanvasRef.current = document.createElement('canvas');
        const mCanvas = maskCanvasRef.current;
        mCanvas.width = maskWidth;
        mCanvas.height = maskHeight;
        const mCtx = mCanvas.getContext('2d');
        
        if (mCtx) {
          const mImgData = mCtx.createImageData(maskWidth, maskHeight);
          for (let i = 0; i < hairMaskData.length; i++) {
            const isHair = hairMaskData[i] > 0;
            const offset = i * 4;
            if (isHair) {
              mImgData.data[offset] = isDetected ? 244 : 99;     
              mImgData.data[offset + 1] = isDetected ? 63 : 102;  
              mImgData.data[offset + 2] = isDetected ? 94 : 241;  
              mImgData.data[offset + 3] = isDetected ? 140 : 80; 
            }
          }
          mCtx.putImageData(mImgData, 0, 0);
          ctx.save();
          ctx.globalAlpha = 0.7;
          ctx.drawImage(mCanvas, ox, oy, dw, dh);
          ctx.restore();
        }
      }

      if (settings.showDetectionPoints && currentFacePoints.length > 0 && targetIndices.length > 0) {
        targetIndices.forEach(idx => {
          const point = currentFacePoints[idx];
          if (!point) return;
          const x = mapX(point.x);
          const y = mapY(point.y);
          
          ctx.fillStyle = isDetected ? 'rgba(244, 63, 94, 0.8)' : 'rgba(129, 140, 248, 0.4)';
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, Math.PI * 2);
          ctx.fill();
          
          if (isDetected) {
            ctx.shadowBlur = 4;
            ctx.shadowColor = '#f43f5e';
            ctx.strokeStyle = '#f43f5e';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.shadowBlur = 0;
          }
        });
      }

      if (handResults.landmarks && settings.showDetectionPoints) {
        handResults.landmarks.forEach((hand: any[]) => {
          [4, 8, 12].forEach(idx => {
            const tip = hand[idx];
            const x = mapX(tip.x);
            const y = mapY(tip.y);
            ctx.fillStyle = isDetected ? '#f43f5e' : '#ffffff';
            ctx.beginPath();
            ctx.arc(x, y, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 2;
            ctx.stroke();
            if (isDetected) {
              ctx.shadowBlur = 15;
              ctx.shadowColor = '#f43f5e';
              ctx.beginPath();
              ctx.arc(x, y, 12, 0, Math.PI * 2);
              ctx.stroke();
              ctx.shadowBlur = 0;
            }
          });
        });
      }

      onDetection(isDetected);
      animationFrame = requestAnimationFrame(detect);
    };

    setupMediaPipe();

    return () => {
      isMounted = false;
      cancelAnimationFrame(animationFrame);
      if (handLandmarker) handLandmarker.close();
      if (faceLandmarker) faceLandmarker.close();
      if (imageSegmenter) imageSegmenter.close();
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    };
  }, [settings.habitMode, settings.sensitivity, settings.showDetectionPoints, onDetection]);

  return (
    <div className="relative flex-1 rounded-3xl overflow-hidden glass shadow-2xl border border-slate-700 bg-slate-900 flex items-center justify-center">
      <div 
        className="relative w-full h-full transition-transform duration-300 ease-out"
        style={{ transform: `scaleX(-1) scale(${settings.zoomLevel})` }}
      >
        <video
          ref={videoRef}
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${settings.isBlurred ? 'blur-2xl grayscale brightness-50' : ''}`}
          playsInline
          muted
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
        />
      </div>

      {loading && !error && (
        <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-xl flex flex-col items-center justify-center z-30">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-500/20 rounded-full"></div>
            <div className="absolute top-0 w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div className="mt-8 text-center px-6">
            <h3 className="text-indigo-400 font-bold text-xl tracking-tight">Securing Neural Link</h3>
            <p className="text-slate-500 text-xs mt-2 uppercase tracking-widest font-medium">Initializing Computer Vision Models</p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-8 text-center z-40">
          <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mb-6">
             <svg className="w-8 h-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
             </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-100 mb-2">Engine Error</h3>
          <p className="text-slate-400 mb-8 text-sm max-w-sm leading-relaxed">{error}</p>
          <button onClick={() => window.location.reload()} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-2xl transition-all font-bold shadow-lg shadow-indigo-500/20 active:scale-95">
            Reset Engine
          </button>
        </div>
      )}

      <div className="absolute top-6 left-6 z-20">
         <div className="px-4 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/50 text-[10px] font-bold tracking-widest uppercase flex items-center gap-2 shadow-xl">
           <span className={`w-2 h-2 rounded-full ${loading ? 'bg-amber-500 animate-pulse' : 'bg-indigo-500'}`}></span>
           <span className="text-slate-300">{settings.habitMode.replace('_', ' ')} ACTIVE</span>
         </div>
      </div>
    </div>
  );
};

export default CameraPanel;
