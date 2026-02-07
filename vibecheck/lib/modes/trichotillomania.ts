
import { FINGER_TIPS, getMaskPoint } from '../vision-utils';

/**
 * Checks if any hand finger tips are overlapping with or near the hair segmentation mask.
 * Uses sensitivity to define a search radius around the finger tips.
 */
export const checkTrichotillomania = (
  handLandmarks: any[], 
  hairMaskData: Uint8Array, 
  maskWidth: number, 
  maskHeight: number,
  sensitivity: number
): boolean => {
  if (!handLandmarks || handLandmarks.length === 0) return false;

  // Search radius in pixels. 
  // Lower sensitivity (0.1) -> ~2px radius (strict)
  // Higher sensitivity (1.0) -> ~25px radius (generous)
  const radius = Math.floor(2 + (23 * sensitivity));

  for (const hand of handLandmarks) {
    for (const idx of FINGER_TIPS) {
      const tip = hand[idx];
      const { px, py } = getMaskPoint(tip, maskWidth, maskHeight);
      
      // Perform a neighborhood search to account for segmentation noise
      // and proximity to the hair area.
      for (let dx = -radius; dx <= radius; dx += 2) { // Step by 2 for performance
        for (let dy = -radius; dy <= radius; dy += 2) {
          const nx = px + dx;
          const ny = py + dy;
          
          if (nx >= 0 && nx < maskWidth && ny >= 0 && ny < maskHeight) {
            // Distance check to maintain circular search
            if (dx * dx + dy * dy <= radius * radius) {
              if (hairMaskData[ny * maskWidth + nx] > 0) {
                return true;
              }
            }
          }
        }
      }
    }
  }

  return false;
};
