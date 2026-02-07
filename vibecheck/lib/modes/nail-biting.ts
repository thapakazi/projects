
import { checkLandmarkProximity } from './face-common';

// Indices for upper and lower lips
export const MOUTH_LANDMARKS = [0, 11, 12, 13, 14, 15, 16, 17, 37, 38, 39, 40, 41, 42, 61, 62, 78, 80, 81, 82, 87, 88, 91, 95];

export const detectNailBiting = (
  handLandmarks: any[],
  faceLandmarks: any[],
  sensitivity: number
): boolean => {
  return checkLandmarkProximity(handLandmarks, faceLandmarks, MOUTH_LANDMARKS, sensitivity);
};
