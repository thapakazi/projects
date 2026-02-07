
import { checkLandmarkProximity } from './face-common';

// MediaPipe face mesh nose landmarks: bridge, tip, nostrils, and contour
export const NOSE_LANDMARKS = [
  // Nose bridge
  6, 168, 197, 195, 5, 4,
  // Nose tip and bottom
  1, 2, 19, 94, 370,
  // Left nostril contour
  48, 64, 98, 240, 75, 235,
  // Right nostril contour
  278, 294, 327, 460, 305, 455,
  // Nose sides
  219, 218, 237, 44, 1, 274, 457, 438, 439,
];

export const detectNosePicking = (
  handLandmarks: any[],
  faceLandmarks: any[],
  sensitivity: number
): boolean => {
  return checkLandmarkProximity(handLandmarks, faceLandmarks, NOSE_LANDMARKS, sensitivity);
};
