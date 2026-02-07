
import { HabitMode } from '../../types';
import { FINGER_TIPS, getDistance } from '../vision-utils';

/**
 * Landmark indices for various face target areas
 */
const FACE_LANDMARK_MAP = {
  [HabitMode.NOSE_PICKING]: [1, 2, 4, 5, 6, 197, 168], // Nose bridge and nostrils
  [HabitMode.NAIL_BITING]: [13, 14, 11, 12, 17, 0],    // Mouth/Lips area
  // For skin picking, we use a larger sample of points across the face
  [HabitMode.SKIN_PICKING]: Array.from({ length: 468 }, (_, i) => i).filter(i => i % 20 === 0)
};

/**
 * Detects if hands are near specific target face landmarks based on the habit mode
 */
export const checkFaceHabit = (
  mode: HabitMode,
  handLandmarks: any[],
  faceLandmarks: any[],
  sensitivity: number
): boolean => {
  if (!handLandmarks || !faceLandmarks || faceLandmarks.length === 0) return false;

  const targetIndices = FACE_LANDMARK_MAP[mode] || [];
  const facePoints = faceLandmarks[0];
  
  // Dynamic threshold based on user sensitivity setting
  const threshold = 0.075 * (1.1 - sensitivity);

  for (const hand of handLandmarks) {
    for (const handIdx of FINGER_TIPS) {
      const handTip = hand[handIdx];
      
      for (const faceIdx of targetIndices) {
        const facePoint = facePoints[faceIdx];
        if (getDistance(handTip, facePoint) < threshold) {
          return true;
        }
      }
    }
  }

  return false;
};
