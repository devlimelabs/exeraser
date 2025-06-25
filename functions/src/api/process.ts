import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { ERROR_MESSAGES, COLLECTIONS, PROCESSING_STATUS, STORAGE_PATHS } from "../config/constants";
import { clipdropApiKey } from "../config/params";
import { removeBackground } from "../services/aiServices";
import { v4 as uuidv4 } from "uuid";

export const processImageRemoval = onRequest(
  {
    cors: true,
    secrets: [clipdropApiKey],
    timeoutSeconds: 300,
    memory: "2GiB",
  },
  async (req, res) => {
      if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
      }

      try {
        const { uploadId, imageUrl, selectedPeople, quality = "high" } = req.body;

        if (!uploadId || !imageUrl || !selectedPeople || !Array.isArray(selectedPeople)) {
          res.status(400).json({ error: ERROR_MESSAGES.INVALID_REQUEST });
          return;
        }

        // Update processing status
        const processingRef = admin.firestore()
          .collection(COLLECTIONS.PROCESSING)
          .doc(uploadId);

        await processingRef.update({
          status: PROCESSING_STATUS.PROCESSING,
          selectedPeople,
          quality,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Get the detection results
        const processingDoc = await processingRef.get();
        const processingData = processingDoc.data();

        if (!processingData || !processingData.detectionResult) {
          res.status(400).json({ error: "No detection data found" });
          return;
        }

        // Process the image removal
        const processedImageBuffer = await removeBackground(
          imageUrl,
          selectedPeople,
          processingData.detectionResult.predictions,
          quality
        );

        // Save processed image to storage
        const resultId = uuidv4();
        const bucket = admin.storage().bucket();
        const processedFilePath = `${STORAGE_PATHS.PROCESSED}/${uploadId}/${resultId}.png`;
        const file = bucket.file(processedFilePath);

        await file.save(processedImageBuffer, {
          metadata: {
            contentType: "image/png",
            metadata: {
              uploadId,
              resultId,
              processedAt: new Date().toISOString(),
            },
          },
        });

        await file.makePublic();
        
        const processedUrl = `https://storage.googleapis.com/${bucket.name}/${processedFilePath}`;

        // Update processing status with result
        await processingRef.update({
          status: PROCESSING_STATUS.COMPLETED,
          processedUrl,
          resultId,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        res.json({
          success: true,
          resultId,
          processedUrl,
          message: "Image processed successfully",
        });

      } catch (error) {
        console.error("Processing error:", error);
        res.status(500).json({ error: ERROR_MESSAGES.PROCESSING_FAILED });
      }
  }
);