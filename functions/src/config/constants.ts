// Image processing constants
export const IMAGE_PROCESSING = {
  MAX_SIZE_MB: 10,
  MAX_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  QUALITY: {
    FAST: "fast",
    HIGH: "high",
  },
} as const;

// Storage paths
export const STORAGE_PATHS = {
  TEMP: "temp",
  PROCESSED: "processed",
  USERS: "users",
} as const;

// Firestore collections
export const COLLECTIONS = {
  PROCESSING: "processing",
  USERS: "users",
} as const;

// Processing status
export const PROCESSING_STATUS = {
  PENDING: "pending",
  DETECTING: "detecting",
  PROCESSING: "processing",
  COMPLETED: "completed",
  ERROR: "error",
} as const;

// Error messages
export const ERROR_MESSAGES = {
  INVALID_IMAGE: "Invalid image format. Please upload a JPEG, PNG, or WebP image.",
  IMAGE_TOO_LARGE: "Image is too large. Please upload an image smaller than 10MB.",
  NO_IMAGE_PROVIDED: "No image provided.",
  PROCESSING_FAILED: "Failed to process image. Please try again.",
  DETECTION_FAILED: "Failed to detect people in the image.",
  NO_PEOPLE_DETECTED: "No people detected in the image.",
  INVALID_REQUEST: "Invalid request format.",
  UNAUTHORIZED: "Unauthorized request.",
} as const;

// CORS configuration
export const CORS_OPTIONS = {
  origin: true,
  credentials: true,
} as const;