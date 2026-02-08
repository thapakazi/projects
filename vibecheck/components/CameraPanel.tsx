
import React, { useRef, useEffect, useState } from 'react';
import { AppSettings, HabitMode } from '../types';
import { checkTrichotillomania } from '../lib/modes/trichotillomania';
import { detectNosePicking, NOSE_LANDMARKS } from '../lib/modes/nose-picking';
import { detectNailBiting, MOUTH_LANDMARKS } from '../lib/modes/nail-biting';
import { detectSkinPicking, FACE_SKIN_LANDMARKS } from '../lib/modes/skin-picking';
import { detectBeardPulling, BEARD_LANDMARKS } from '../lib/modes/beard-pulling';
import { detectEyeScratching, EYE_LANDMARKS } from '../lib/modes/eye-scratching';

interface CameraPanelProps {
  settings: AppSettings;
  onDetection: (inZone: boolean) => void;
  isPaused: boolean;
  onToggleBlur?: () => void;
}

const CameraPanel: React.FC<CameraPanelProps> = ({ settings, onDetection, isPaused, onToggleBlur }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;
  const autoPipRef = useRef(settings.autoPip);
  autoPipRef.current = settings.autoPip;
  const pipCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const pipVideoRef = useRef<HTMLVideoElement | null>(null);
  const pipFrameRef = useRef<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPipActive, setIsPipActive] = useState(false);
  const [pipNeedsGesture, setPipNeedsGesture] = useState(false);

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

      // When paused, clear overlay and skip inference
      if (isPausedRef.current) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        onDetection(false);
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
          case HabitMode.EYE_SCRATCHING:
            targetIndices = EYE_LANDMARKS;
            isDetected = detectEyeScratching(handResults.landmarks, faceResults.faceLandmarks, settings.sensitivity);
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

  // Clear PiP gesture toast on any click
  useEffect(() => {
    if (!pipNeedsGesture) return;
    const dismiss = () => setPipNeedsGesture(false);
    document.addEventListener('click', dismiss, { once: true });
    return () => document.removeEventListener('click', dismiss);
  }, [pipNeedsGesture]);

  // Auto PiP when tab loses focus — canvas-based so filters actually render
  useEffect(() => {
    // Create pip video element once
    if (!pipVideoRef.current) {
      const v = document.createElement('video');
      v.muted = true;
      v.playsInline = true;
      // Only clean up if user manually closed PiP (tab still hidden).
      // When stopPipLoop triggers exitPictureInPicture, the tab is already
      // visible and stopPipLoop handles cleanup — so we skip to avoid
      // a race where this async event kills a newly started PiP session.
      v.addEventListener('leavepictureinpicture', () => {
        setIsPipActive(false);
        if (document.hidden) {
          cancelAnimationFrame(pipFrameRef.current);
          v.srcObject = null;
        }
      });
      pipVideoRef.current = v;
    }

    const startPipLoop = () => {
      const video = videoRef.current;
      const pipVideo = pipVideoRef.current;
      if (!video || video.videoWidth === 0 || !pipVideo) return;

      // Stop any existing loop before starting a new one
      cancelAnimationFrame(pipFrameRef.current);

      if (!pipCanvasRef.current) {
        pipCanvasRef.current = document.createElement('canvas');
      }
      const canvas = pipCanvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d')!;

      const drawFrame = () => {
        ctx.save();
        ctx.filter = 'blur(20px) grayscale(1) brightness(0.5)';
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.restore();
        if (canvasRef.current) {
          ctx.save();
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(canvasRef.current, 0, 0, canvas.width, canvas.height);
          ctx.restore();
        }
        pipFrameRef.current = requestAnimationFrame(drawFrame);
      };
      drawFrame();

      const stream = canvas.captureStream(30);
      pipVideo.srcObject = stream;
      pipVideo.play().then(() => {
        pipVideo.requestPictureInPicture().then(() => {
          setIsPipActive(true);
        }).catch(() => {
          cancelAnimationFrame(pipFrameRef.current);
          pipVideo.srcObject = null;
          setPipNeedsGesture(true);
        });
      }).catch(() => {});
    };

    const stopPipLoop = () => {
      cancelAnimationFrame(pipFrameRef.current);
      if (document.pictureInPictureElement) {
        document.exitPictureInPicture().catch(() => {});
      }
      if (pipVideoRef.current) {
        pipVideoRef.current.srcObject = null;
      }
      setIsPipActive(false);
    };

    const handleVisibility = () => {
      if (!autoPipRef.current) return;
      if (!videoRef.current || !document.pictureInPictureEnabled) return;
      if (document.hidden) {
        startPipLoop();
      } else {
        stopPipLoop();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      stopPipLoop();
    };
  }, []);

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

      {isPipActive && (
        <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center z-30">
          <svg className="w-16 h-16 text-slate-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
          </svg>
          <h3 className="text-slate-300 text-lg font-medium">Playing in picture-in-picture</h3>
        </div>
      )}

      {pipNeedsGesture && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 px-5 py-2.5 rounded-2xl bg-slate-800/90 backdrop-blur-md border border-slate-600/50 shadow-xl cursor-pointer animate-fade-in"
          onClick={() => setPipNeedsGesture(false)}
        >
          <p className="text-slate-200 text-sm font-medium whitespace-nowrap">Tap anywhere to enable auto PiP</p>
        </div>
      )}

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
           <span className={`w-2 h-2 rounded-full ${loading ? 'bg-amber-500 animate-pulse' : isPaused ? 'bg-amber-500' : 'bg-indigo-500'}`}></span>
           <span className="text-slate-300">{isPaused ? 'PAUSED' : `${settings.habitMode.replace('_', ' ')} ACTIVE`}</span>
         </div>
      </div>

      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={() => onToggleBlur?.()}
          title={settings.isBlurred ? 'Privacy Blur On' : 'Privacy Blur Off'}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all backdrop-blur-md shadow-xl ${settings.isBlurred ? 'bg-indigo-600 shadow-indigo-500/30' : 'bg-slate-900/80 border border-slate-700/50 hover:border-indigo-500'}`}
        >
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {settings.isBlurred ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
            ) : (
              <>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </>
            )}
          </svg>
        </button>
      </div>
    </div>
  );
};

export default CameraPanel;
