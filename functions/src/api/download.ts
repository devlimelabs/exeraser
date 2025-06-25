import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { ERROR_MESSAGES, COLLECTIONS } from "../config/constants";

export const downloadResult = onRequest(
  { cors: true },
  async (req, res) => {
    if (req.method !== "GET") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    try {
      const resultId = req.query.resultId as string;
      const uploadId = req.query.uploadId as string;

      if (!resultId || !uploadId) {
        res.status(400).json({ error: ERROR_MESSAGES.INVALID_REQUEST });
        return;
      }

      // Get processing document to verify the result
      const processingRef = admin.firestore()
        .collection(COLLECTIONS.PROCESSING)
        .doc(uploadId);
      
      const processingDoc = await processingRef.get();
      
      if (!processingDoc.exists) {
        res.status(404).json({ error: "Processing record not found" });
        return;
      }

      const processingData = processingDoc.data();
      
      if (!processingData || processingData.resultId !== resultId) {
        res.status(404).json({ error: "Invalid result ID" });
        return;
      }

      // Generate a signed URL for secure download
      const bucket = admin.storage().bucket();
      const filePath = `processed/${uploadId}/${resultId}.png`;
      const file = bucket.file(filePath);

      const [exists] = await file.exists();
      if (!exists) {
        res.status(404).json({ error: "Processed image not found" });
        return;
      }

      // Generate signed URL valid for 1 hour
      const [signedUrl] = await file.getSignedUrl({
        action: "read",
        expires: Date.now() + 3600 * 1000, // 1 hour
      });

      res.json({
        downloadUrl: signedUrl,
        filename: `exerase-result-${resultId}.png`,
        expiresIn: 3600, // seconds
      });

    } catch (error) {
      console.error("Download error:", error);
      res.status(500).json({ error: "Failed to generate download link" });
    }
  }
);