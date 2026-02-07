
import { checkLandmarkProximity } from './face-common';

// Indices for nose bridge, tip, and nostrils
export const NOSE_LANDMARKS = [1, 2, 4, 5, 6, 19, 94, 197, 168];

export const detectNosePicking = (
  handLandmarks: any[],
  faceLandmarks: any[],
  sensitivity: number
): boolean => {
  return checkLandmarkProximity(handLandmarks, faceLandmarks, NOSE_LANDMARKS, sensitivity);
};
