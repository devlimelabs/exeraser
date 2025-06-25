import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

// Initialize Firebase Admin
admin.initializeApp();

// Export function modules
export * from "./api/upload";
export * from "./api/detect";
export * from "./api/process";
export * from "./api/download";

// Health check endpoint
export const healthCheck = onRequest(
  { cors: true },
  async (req, res) => {
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "exerase-functions-v2",
    });
  }
);