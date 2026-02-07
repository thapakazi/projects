
/**
 * Common utilities and constants for MediaPipe detection logic
 */

export const FINGER_TIPS = [4, 8, 12]; // Thumb, Index, Middle finger tips

/**
 * Calculates Euclidean distance between two 3D points
 */
export const getDistance = (p1: { x: number, y: number }, p2: { x: number, y: number }) => {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
};

/**
 * Maps a normalized point (0-1) to pixel coordinates based on mask dimensions
 */
export const getMaskPoint = (normalizedPoint: { x: number, y: number }, width: number, height: number) => {
  return {
    px: Math.floor(normalizedPoint.x * width),
    py: Math.floor(normalizedPoint.y * height)
  };
};
