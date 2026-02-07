
import { checkLandmarkProximity } from './face-common';

// MediaPipe face mesh landmarks for mustache, beard, chin, and jawline
export const BEARD_LANDMARKS = [
  // Mustache left
  164, 165, 167, 186, 92, 165, 206, 203, 216,
  // Mustache right
  393, 391, 407, 410, 322, 436, 426, 423,
  // Upper lip surround (philtrum to lip corners)
  185, 40, 39, 37, 0, 267, 269, 270, 409,
  // Chin center and below lower lip
  17, 18, 200, 199, 175, 152,
  // Chin contour left
  148, 149, 150, 136, 169, 170, 171, 140,
  // Chin contour right
  377, 378, 379, 365, 397, 394, 395, 369,
  // Jawline left (ear to chin)
  172, 138, 213, 147, 176, 135, 210, 212,
  // Jawline right (chin to ear)
  401, 366, 433, 376, 400, 364, 430, 432,
  // Cheek-jaw transition left
  58, 132, 93, 234,
  // Cheek-jaw transition right
  288, 361, 323, 454,
];

export const detectBeardPulling = (
  handLandmarks: any[],
  faceLandmarks: any[],
  sensitivity: number
): boolean => {
  return checkLandmarkProximity(handLandmarks, faceLandmarks, BEARD_LANDMARKS, sensitivity);
};
