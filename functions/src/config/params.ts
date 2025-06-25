import {defineSecret, defineString} from "firebase-functions/params";

// API Keys as secrets
export const roboflowApiKey = defineSecret("ROBOFLOW_API_KEY");
export const clipdropApiKey = defineSecret("CLIPDROP_API_KEY");
export const segmindApiKey = defineSecret("SEGMIND_API_KEY");

// Configuration parameters
export const roboflowModel = defineString("ROBOFLOW_MODEL", {
  default: "people-detection-o2iay/1",
  description: "Roboflow model ID for people detection",
});

export const region = defineString("REGION", {
  default: "us-central1",
  description: "Default region for Firebase functions",
});

export const storageCleanupHours = defineString("STORAGE_CLEANUP_HOURS", {
  default: "24",
  description: "Hours after which to clean up stored images",
});

export const maxImageSize = defineString("MAX_IMAGE_SIZE_MB", {
  default: "10",
  description: "Maximum image size in megabytes",
});

// Export API configuration
export const getApiConfig = () => ({
  roboflow: {
    apiKey: roboflowApiKey.value(),
    model: roboflowModel.value(),
  },
  clipdrop: {
    apiKey: clipdropApiKey.value(),
  },
  segmind: {
    apiKey: segmindApiKey.value(),
  },
});