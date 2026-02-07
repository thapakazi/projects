
import { checkLandmarkProximity } from './face-common';

// Indices for mustache area and chin/beard line
export const BEARD_LANDMARKS = [
  164, 167, 165, 186, 92, 203, 206, 216, // Mustache area
  436, 426, 423, 410, 322, 407, 391,    // Mustache area right side
  152, 148, 149, 150, 175, 377, 378, 379, 396, 400, 201, 208, 171 // Chin and jawline
];

export const detectBeardPulling = (
  handLandmarks: any[],
  faceLandmarks: any[],
  sensitivity: number
): boolean => {
  return checkLandmarkProximity(handLandmarks, faceLandmarks, BEARD_LANDMARKS, sensitivity);
};
