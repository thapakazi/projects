
import { checkLandmarkProximity } from './face-common';

// MediaPipe face mesh lip contour indices (outer + inner lip)
export const MOUTH_LANDMARKS = [
  // Outer lip
  0, 17, 37, 39, 40, 61, 84, 91, 146, 181, 185,
  267, 269, 270, 291, 314, 321, 375, 405, 409,
  // Inner lip
  13, 14, 78, 80, 81, 82, 87, 88, 95, 178, 191,
  308, 310, 311, 312, 317, 318, 324, 402, 415,
];

export const detectNailBiting = (
  handLandmarks: any[],
  faceLandmarks: any[],
  sensitivity: number
): boolean => {
  return checkLandmarkProximity(handLandmarks, faceLandmarks, MOUTH_LANDMARKS, sensitivity);
};
