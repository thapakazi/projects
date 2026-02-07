
import { FINGER_TIPS, getDistance } from '../vision-utils';

/**
 * Shared logic to check if hands are within a threshold distance of specific face landmarks.
 */
export const checkLandmarkProximity = (
  handLandmarks: any[],
  faceLandmarks: any[],
  targetIndices: number[],
  sensitivity: number
): boolean => {
  if (!handLandmarks || !faceLandmarks || faceLandmarks.length === 0) return false;

  const facePoints = faceLandmarks[0];
  
  // Normalized threshold: 
  // sensitivity 0.0 -> 0.02 distance (very close/hard to trigger)
  // sensitivity 1.0 -> 0.12 distance (farther away/easy to trigger)
  const threshold = 0.02 + (0.10 * sensitivity);

  for (const hand of handLandmarks) {
    for (const handIdx of FINGER_TIPS) {
      const handTip = hand[handIdx];
      
      for (const faceIdx of targetIndices) {
        const facePoint = facePoints[faceIdx];
        if (!facePoint) continue;
        
        if (getDistance(handTip, facePoint) < threshold) {
          return true;
        }
      }
    }
  }

  return false;
};
