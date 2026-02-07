
import { checkLandmarkProximity } from './face-common';

// A distributed set of landmarks across the forehead, cheeks, and chin
export const FACE_SKIN_LANDMARKS = Array.from({ length: 468 }, (_, i) => i).filter(i => i % 15 === 0);

export const detectSkinPicking = (
  handLandmarks: any[],
  faceLandmarks: any[],
  sensitivity: number
): boolean => {
  return checkLandmarkProximity(handLandmarks, faceLandmarks, FACE_SKIN_LANDMARKS, sensitivity);
};
