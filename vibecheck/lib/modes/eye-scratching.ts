
import { checkLandmarkProximity } from './face-common';

// MediaPipe face mesh eye landmarks: eyelids, under-eye, brow bone
export const EYE_LANDMARKS = [
  // Left eye contour
  33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246,
  // Right eye contour
  263, 249, 390, 373, 374, 380, 381, 382, 362, 398, 384, 385, 386, 387, 388, 466,
  // Under-eye / orbit
  111, 117, 118, 119, 120, 121, 340, 346, 347, 348, 349, 350,
  // Brow bone
  70, 63, 105, 66, 107, 300, 293, 334, 296, 336,
];

export const detectEyeScratching = (
  handLandmarks: any[],
  faceLandmarks: any[],
  sensitivity: number
): boolean => {
  return checkLandmarkProximity(handLandmarks, faceLandmarks, EYE_LANDMARKS, sensitivity);
};
